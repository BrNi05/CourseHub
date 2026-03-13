/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { InternalServerErrorException } from '@nestjs/common';
import { LogsService } from './logs.service.js';
import { promises as fs } from 'node:fs';
import * as fsModule from 'node:fs';
import * as readline from 'node:readline';

vi.mock('node:fs', () => ({
  promises: {
    access: vi.fn(),
    writeFile: vi.fn(),
    open: vi.fn(),
    rename: vi.fn(),
  },
  createReadStream: vi.fn(),
}));

vi.mock('node:readline', () => ({
  createInterface: vi.fn(),
}));

describe('LogsService', () => {
  let service: LogsService;

  beforeEach(() => {
    service = new LogsService();
  });

  afterEach(() => {
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
      expect(fs.writeFile).toHaveBeenCalledWith(service['logPath'], '', 'utf-8');
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

    it('deletes lines older than 3 weeks', async () => {
      const oldLine = '2026. 01. 01. de. 05:00:00 [INFO] Old';
      const newLine = '2026. 02. 15. de. 05:00:00 [INFO] New';
      const lines = [oldLine, newLine];

      const appendFile = vi.fn();
      const close = vi.fn();
      const mockWriteStream = { appendFile, close };

      (fs.open as any).mockResolvedValue(mockWriteStream);
      (fsModule.createReadStream as any).mockReturnValue({});
      (readline.createInterface as any).mockReturnValue({
        [Symbol.asyncIterator]: () => lines[Symbol.iterator](),
      });

      await service.deleteOldLogs();

      expect(appendFile).toHaveBeenCalledTimes(1);
      expect(appendFile).toHaveBeenCalledWith(newLine + '\n');
      expect(close).toHaveBeenCalled();
      expect(fs.rename).toHaveBeenCalled();
    });
  });
});
