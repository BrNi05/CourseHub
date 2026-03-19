/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { ClientService } from './client.service.js';
import { ClientPlatform } from '../../prisma/generated/client/client.js';
import type { PrismaService } from '../../prisma/prisma.service.js';
import type { LoggerService } from '../../logger/logger.service.js';
import { promises as fs } from 'node:fs';

const { logStreamMock } = vi.hoisted(() => ({
  logStreamMock: {
    write: vi.fn(),
    end: vi.fn(),
    on: vi.fn(),
    destroyed: false,
  },
}));

vi.mock('node:fs', () => {
  return {
    createWriteStream: vi.fn(() => logStreamMock),
    promises: {
      mkdir: vi.fn(),
      writeFile: vi.fn(),
      readFile: vi.fn(),
      readdir: vi.fn(),
      unlink: vi.fn(),
    },
  };
});

describe('ClientService', () => {
  let service: ClientService;
  let prisma: any;
  let logger: any;

  beforeEach(() => {
    prisma = {
      clientPing: {
        upsert: vi.fn(),
        deleteMany: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
      },
    };

    const scopedLogger = {
      error: vi.fn(),
      log: vi.fn(),
    };

    logger = {
      forContext: vi.fn().mockReturnValue(scopedLogger),
      scopedLogger,
    };

    service = new ClientService(
      prisma as unknown as PrismaService,
      logger as unknown as LoggerService
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create reports directory on init', async () => {
    await service.onModuleInit();
    expect(fs.mkdir).toHaveBeenCalled();
  });

  it('should allow supported version', () => {
    expect(() => service.isVersionSupported(ClientPlatform.windows, '1.0.0')).not.toThrow();
  });

  it('should throw if version is lower than minimum', () => {
    expect(() => service.isVersionSupported(ClientPlatform.windows, '0.9.0')).toThrowError(
      new HttpException('A kliens verziója nem támogatott!', HttpStatus.I_AM_A_TEAPOT)
    );
  });

  it('should throw if version is invalid', () => {
    expect(() => service.isVersionSupported(ClientPlatform.windows, 'not-a-version')).toThrow(
      HttpException
    );
  });

  it('should upsert a client ping with normalized UTC date', async () => {
    await service.ping('user-1', ClientPlatform.linux, '1.0.0');

    expect(prisma.clientPing.upsert).toHaveBeenCalledTimes(1);

    const call = prisma.clientPing.upsert.mock.calls[0][0];

    expect(call.where.userId_date_platform.userId).toBe('user-1');
    expect(call.where.userId_date_platform.platform).toBe(ClientPlatform.linux);
    expect(call.create.userId).toBe('user-1');
    expect(call.create.platform).toBe(ClientPlatform.linux);
    expect(call.create.version).toBe('1.0.0');
    expect(call.update.version).toBe('1.0.0');

    const date = call.create.date as Date;
    expect(date.getUTCHours()).toBe(0);
    expect(date.getUTCMinutes()).toBe(0);
    expect(date.getUTCSeconds()).toBe(0);
  });

  it('should delete pings older than 365 days', async () => {
    await service.cleanOldPings();

    expect(prisma.clientPing.deleteMany).toHaveBeenCalledTimes(1);

    const where = prisma.clientPing.deleteMany.mock.calls[0][0].where;

    expect(where.date.lte).toBeInstanceOf(Date);
  });

  it('should calculate cutoff date correctly for old pings', async () => {
    const now = new Date('2026-02-20T00:00:00Z');

    vi.useFakeTimers();
    vi.setSystemTime(now);

    await service.cleanOldPings();

    const where = prisma.clientPing.deleteMany.mock.calls[0][0].where;
    const cutoff = where.date.lte as Date;

    const diffDays = Math.floor((now.getTime() - cutoff.getTime()) / (1000 * 60 * 60 * 24));

    expect(diffDays).toBe(364);

    vi.useRealTimers();
  });

  it('should log error if deleteMany fails', async () => {
    prisma.clientPing.deleteMany.mockRejectedValueOnce(new Error('error'));

    await service.cleanOldPings();

    expect(logger.scopedLogger.error).toHaveBeenCalledWith('Failed to clean old client pings.');
  });

  it('should write error report file with correct payload', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({
      googleEmail: 'test@example.com',
    });

    const data = {
      message: 'Something failed',
    };

    await service.reportError('user-1', data as any);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: { googleEmail: true },
    });

    expect(fs.writeFile).toHaveBeenCalledTimes(1);

    const [filePath, content] = (fs.writeFile as any).mock.calls[0];

    expect(filePath).toContain('test@example.com');

    const parsed = JSON.parse(content);

    expect(parsed.userId).toBe('user-1');
    expect(parsed.message).toBe('Something failed');
    expect(parsed.receivedAt).toBeDefined();
  });

  it('should delete error reports older than 28 days', async () => {
    const now = new Date('2026-02-20T00:00:00Z').getTime();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    const oldTimestamp = now - 29 * 24 * 60 * 60 * 1000;
    const recentTimestamp = now - 10 * 24 * 60 * 60 * 1000;

    (fs.readdir as any).mockResolvedValue([
      `user-${oldTimestamp}.json`,
      `user-${recentTimestamp}.json`,
    ]);

    await service.cleanOldErrorReports();

    expect(fs.unlink).toHaveBeenCalledTimes(1);

    const deletedPath = (fs.unlink as any).mock.calls[0][0];
    expect(deletedPath).toContain(String(oldTimestamp));
  });

  it('should not delete recent error reports', async () => {
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    const recentTimestamp = now - 5 * 24 * 60 * 60 * 1000;

    (fs.readdir as any).mockResolvedValue([`user-${recentTimestamp}.json`]);

    await service.cleanOldErrorReports();

    expect(fs.unlink).not.toHaveBeenCalled();
  });

  it('should log error if filename format is invalid', async () => {
    (fs.readdir as any).mockResolvedValue(['invalid-file-name.json']);

    await service.cleanOldErrorReports();

    expect(logger.scopedLogger.error).toHaveBeenCalledWith('Failed to clean old error reports.');
  });

  it('should log error if readdir throws', async () => {
    (fs.readdir as any).mockRejectedValueOnce(new Error('fs error'));

    await service.cleanOldErrorReports();

    expect(logger.scopedLogger.error).toHaveBeenCalledWith('Failed to clean old error reports.');
  });

  it('should list and parse all error reports', async () => {
    const report1 = { userId: 'u1', message: 'err1' };
    const report2 = { userId: 'u2', message: 'err2' };

    (fs.readdir as any).mockResolvedValue(['file1.json', 'file2.json']);
    (fs.readFile as any)
      .mockResolvedValueOnce(JSON.stringify(report1))
      .mockResolvedValueOnce(JSON.stringify(report2));

    const result = await service.listErrorReports();

    expect(fs.readdir).toHaveBeenCalledTimes(1);
    expect(fs.readFile).toHaveBeenCalledTimes(2);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(report1);
    expect(result[1]).toEqual(report2);
  });

  it('should delete an error report file', async () => {
    await service.deleteErrorReport('test.json');

    expect(fs.unlink).toHaveBeenCalledTimes(1);
    expect(fs.unlink).toHaveBeenCalledWith(expect.stringContaining('test.json'));
  });

  it('should throw and log if deleteErrorReport fails', async () => {
    (fs.unlink as any).mockRejectedValueOnce(new Error('fail'));

    await expect(service.deleteErrorReport('bad.json')).rejects.toThrow(
      'Failed to delete error report'
    );

    expect(logger.scopedLogger.error).toHaveBeenCalledWith(
      'Failed to delete error report: bad.json.'
    );
  });

  it('should reject deleting an error report outside the reports directory', async () => {
    await expect(service.deleteErrorReport('../CourseHub-Backend.log')).rejects.toBeInstanceOf(
      BadRequestException
    );

    expect(fs.unlink).not.toHaveBeenCalled();
  });
});
