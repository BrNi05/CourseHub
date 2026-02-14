/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ClientService } from './client.service.js';
import { ClientPlatform } from '../../prisma/generated/client/client.js';
import type { PrismaService } from '../../prisma/prisma.service.js';
import type { LoggerService } from '../../logger/logger.service.js';
import { promises as fs } from 'node:fs';

vi.mock('node:fs', () => {
  return {
    promises: {
      mkdir: vi.fn(),
      writeFile: vi.fn(),
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
        create: vi.fn(),
        deleteMany: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
      },
    };

    logger = {
      error: vi.fn(),
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
      new HttpException('Client version is not supported', HttpStatus.I_AM_A_TEAPOT)
    );
  });

  it('should throw if version is invalid', () => {
    expect(() => service.isVersionSupported(ClientPlatform.windows, 'not-a-version')).toThrow(
      HttpException
    );
  });

  it('should create a client ping with normalized UTC date', async () => {
    await service.ping('user-1', ClientPlatform.linux, '1.0.0');

    expect(prisma.clientPing.create).toHaveBeenCalledTimes(1);

    const call = prisma.clientPing.create.mock.calls[0][0];

    expect(call.data.userId).toBe('user-1');
    expect(call.data.platform).toBe(ClientPlatform.linux);
    expect(call.data.version).toBe('1.0.0');

    const date = call.data.date as Date;
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

  it('should log error if deleteMany fails', async () => {
    prisma.clientPing.deleteMany.mockRejectedValueOnce(new Error('error'));

    await service.cleanOldPings();

    expect(logger.error).toHaveBeenCalledWith('Failed to clean old client pings.');
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
});
