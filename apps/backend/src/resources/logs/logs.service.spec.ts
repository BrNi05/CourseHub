/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { InternalServerErrorException } from '@nestjs/common';
import { LogsService } from './logs.service.js';
import { promises as fs } from 'node:fs';
import * as fsModule from 'node:fs';
import * as readline from 'node:readline';
import type { LoggerService } from '../../logger/logger.service.js';

vi.mock('node:fs', () => ({
  promises: {
    access: vi.fn(),
    writeFile: vi.fn(),
    copyFile: vi.fn(),
    unlink: vi.fn(),
  },
  createReadStream: vi.fn(),
  createWriteStream: vi.fn(() => ({
    write: vi.fn(),
    end: vi.fn(),
    on: vi.fn(),
    once: vi.fn((event: string, handler: () => void) => {
      if (event === 'close') handler();
    }),
    destroyed: false,
    writableEnded: false,
  })),
}));

vi.mock('node:readline', () => ({
  createInterface: vi.fn(),
}));

describe('LogsService', () => {
  let service: LogsService;
  let loggerService: Pick<LoggerService, 'withReleasedFileStream' | 'forContext'>;
  let contextualLogger: { error: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    const withReleasedFileStreamMock = vi.fn((operation: () => Promise<unknown>) => operation());
    contextualLogger = {
      error: vi.fn(),
    };

    loggerService = {
      withReleasedFileStream:
        withReleasedFileStreamMock as unknown as LoggerService['withReleasedFileStream'],
      forContext: vi
        .fn()
        .mockReturnValue(contextualLogger) as unknown as LoggerService['forContext'],
    };
    service = new LogsService(loggerService as LoggerService);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('getLogStream', () => {
    it('throws if log file does not exist', async () => {
      (fs.access as any).mockRejectedValueOnce(new Error('Not found'));

      await expect(service.getLogStream()).rejects.toBeInstanceOf(InternalServerErrorException);
    });

    it('returns a read stream if file exists', async () => {
      const mockStream = {} as any;
      (fs.access as any).mockResolvedValue(undefined);
      (fsModule.createReadStream as any).mockReturnValue(mockStream);

      const result = await service.getLogStream();
      expect(result).toBe(mockStream);
    });
  });

  describe('clearLogs', () => {
    it('overwrites log file with empty content', async () => {
      await service.clearLogs();

      expect(loggerService.withReleasedFileStream).toHaveBeenCalledTimes(1);
      expect(fs.writeFile).toHaveBeenCalledWith(service['logPath'], '', 'utf-8');
    });
  });

  describe('onModuleInit', () => {
    it('runs log retention cleanup on startup', async () => {
      const deleteOldLogsSpy = vi.spyOn(service, 'deleteOldLogs').mockResolvedValueOnce();

      await service.onModuleInit();

      expect(deleteOldLogsSpy).toHaveBeenCalledTimes(1);
    });

    it('logs cleanup errors without failing startup', async () => {
      const error = new Error('cleanup failed');
      vi.spyOn(service, 'deleteOldLogs').mockRejectedValueOnce(error);

      await expect(service.onModuleInit()).resolves.toBeUndefined();
    });
  });

  describe('parseDateFromLog', () => {
    it('parses valid log line with PM correctly', () => {
      const line = '2026. 02. 21. du. 05:25:10 [INFO] Test';
      const date = service['parseDateFromLog'](line);
      expect(date).toEqual(new Date(2026, 1, 21, 17, 25, 10));
    });

    it('returns null for invalid line', () => {
      expect(service['parseDateFromLog']('not a date')).toBeNull();
    });

    it('parses valid log line with AM correctly', () => {
      const line = '2026. 02. 21. de. 05:25:10 [INFO] Test';
      const date = service['parseDateFromLog'](line);
      expect(date).toEqual(new Date(2026, 1, 21, 5, 25, 10));
    });
  });

  describe('deleteOldLogs', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-03-01T12:00:00'));
    });

    it('does nothing if the log file does not exist', async () => {
      (fs.access as any).mockRejectedValueOnce(new Error('Not found'));

      await service.deleteOldLogs();

      expect(loggerService.withReleasedFileStream).toHaveBeenCalledTimes(1);
      expect(fsModule.createReadStream).not.toHaveBeenCalled();
      expect(fs.copyFile).not.toHaveBeenCalled();
    });

    it('deletes lines older than 3 weeks', async () => {
      const oldLine = '2026. 01. 01. de. 05:00:00 [INFO] Old';
      const newLine = '2026. 02. 15. de. 05:00:00 [INFO] New';
      const lines = [oldLine, newLine];

      const write = vi.fn().mockReturnValue(true);
      const end = vi.fn((callback?: () => void) => callback?.());
      const mockWriteStream = {
        write,
        end,
        once: vi.fn(),
        destroy: vi.fn(),
        destroyed: false,
      };
      const readStream = { destroy: vi.fn() };

      (fs.access as any).mockResolvedValue(undefined);
      (fsModule.createReadStream as any).mockReturnValue(readStream);
      (fsModule.createWriteStream as any).mockReturnValue(mockWriteStream);
      (readline.createInterface as any).mockReturnValue({
        close: vi.fn(),
        [Symbol.asyncIterator]: () => lines[Symbol.iterator](),
      });

      await service.deleteOldLogs();

      expect(loggerService.withReleasedFileStream).toHaveBeenCalledTimes(1);
      expect(write).toHaveBeenCalledTimes(1);
      expect(write).toHaveBeenCalledWith(newLine + '\n');
      expect(end).toHaveBeenCalledTimes(1);
      expect(readStream.destroy).toHaveBeenCalled();
      expect(fs.copyFile).toHaveBeenCalledWith(service['logPath'] + '.tmp', service['logPath']);
      expect(fs.unlink).toHaveBeenCalledWith(service['logPath'] + '.tmp');
    });
  });
});
