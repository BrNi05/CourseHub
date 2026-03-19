/* eslint-disable @typescript-eslint/no-explicit-any */
import { InternalServerErrorException } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EventEmitter } from 'node:events';

import { DatabaseBackupService } from './database-backup.service.js';
import type { ConfigService } from '@nestjs/config';
import type { LoggerService } from '../../logger/logger.service.js';

const { logStreamMock } = vi.hoisted(() => ({
  logStreamMock: {
    write: vi.fn(),
    end: vi.fn(),
    on: vi.fn(),
    destroyed: false,
  },
}));

vi.mock('node:fs', () => ({
  createWriteStream: vi.fn(() => logStreamMock),
  promises: {
    mkdir: vi.fn(),
    mkdtemp: vi.fn(),
    readdir: vi.fn(),
    stat: vi.fn(),
    rm: vi.fn(),
  },
}));

vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));

describe('DatabaseBackupService', () => {
  let service: DatabaseBackupService;
  let configService: Pick<ConfigService, 'get'>;
  let logger: LoggerService & { scopedLogger?: { log: any; error: any; warn: any } };

  beforeEach(() => {
    configService = {
      get: vi.fn().mockReturnValue('postgresql://user:password@localhost:5432/coursehub'),
    };

    const scopedLogger = {
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
    };

    logger = {
      forContext: vi.fn().mockReturnValue(scopedLogger),
      scopedLogger,
    } as unknown as LoggerService & { scopedLogger?: { log: any; error: any; warn: any } };

    service = new DatabaseBackupService(configService as ConfigService, logger as LoggerService);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('onModuleInit', () => {
    it('ensures the backup directory exists and cleans old backups', async () => {
      const cleanupSpy = vi.spyOn(service, 'cleanupOldBackups').mockResolvedValueOnce(undefined);
      const { promises: fs } = await import('node:fs');

      await service.onModuleInit();

      expect(fs.mkdir).toHaveBeenCalledWith(service['backupDir'], { recursive: true });
      expect(cleanupSpy).toHaveBeenCalledTimes(1);
    });

    it('logs and rethrows if initialization fails', async () => {
      const { promises: fs } = await import('node:fs');
      (fs.mkdir as any).mockRejectedValueOnce(new Error('mkdir failed'));

      await expect(service.onModuleInit()).rejects.toThrow('mkdir failed');
      expect(logger.scopedLogger!.error).toHaveBeenCalledWith(
        expect.stringContaining('Database backup module initialization failed: mkdir failed')
      );
    });
  });

  describe('createPersistentBackup', () => {
    it('creates a backup file in the persistent backup directory', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-03-13T09:00:00.000Z'));

      const dumpSpy = vi.spyOn(service as any, 'runPgDump').mockResolvedValueOnce(undefined);
      const cleanupSpy = vi.spyOn(service, 'cleanupOldBackups').mockResolvedValueOnce(undefined);

      const backupPath = await service.createPersistentBackup();

      expect(dumpSpy).toHaveBeenCalledWith(
        expect.stringContaining('/db-backups/coursehub-db-backup-2026-03-13T09-00-00-000Z.dump')
      );
      expect(cleanupSpy).toHaveBeenCalledTimes(1);
      expect(backupPath).toContain('/db-backups/coursehub-db-backup-2026-03-13T09-00-00-000Z.dump');
    });

    it('wraps errors with additional context', async () => {
      vi.spyOn(service as any, 'runPgDump').mockRejectedValueOnce(new Error('pg_dump failed'));

      await expect(service.createPersistentBackup()).rejects.toThrow(
        'Failed to create persistent database backup: pg_dump failed'
      );
    });
  });

  describe('createDownloadableBackup', () => {
    it('creates a temporary dump and returns its location', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-03-13T09:00:00.000Z'));

      const { promises: fs } = await import('node:fs');
      (fs.mkdtemp as any).mockResolvedValueOnce('/tmp/coursehub-db-export-abcd');

      const dumpSpy = vi.spyOn(service as any, 'runPgDump').mockResolvedValueOnce(undefined);

      const result = await service.createDownloadableBackup();

      expect(fs.mkdtemp).toHaveBeenCalledWith(expect.stringContaining('coursehub-db-export-'));
      expect(dumpSpy).toHaveBeenCalledWith(
        '/tmp/coursehub-db-export-abcd/coursehub-db-export-2026-03-13T09-00-00-000Z.dump'
      );
      expect(result).toEqual({
        fileName: 'coursehub-db-export-2026-03-13T09-00-00-000Z.dump',
        filePath: '/tmp/coursehub-db-export-abcd/coursehub-db-export-2026-03-13T09-00-00-000Z.dump',
      });
    });

    it('removes the temporary directory if pg_dump fails and throws InternalServerErrorException', async () => {
      const { promises: fs } = await import('node:fs');
      (fs.mkdtemp as any).mockResolvedValueOnce('/tmp/coursehub-db-export-abcd');

      vi.spyOn(service as any, 'runPgDump').mockRejectedValueOnce(new Error('pg_dump failed'));

      const promise = service.createDownloadableBackup();

      await expect(promise).rejects.toBeInstanceOf(InternalServerErrorException);

      expect(fs.rm).toHaveBeenCalledWith('/tmp/coursehub-db-export-abcd', {
        recursive: true,
        force: true,
      });
    });

    it('logs a warning if temp cleanup fails after backup creation failure', async () => {
      const { promises: fs } = await import('node:fs');
      (fs.mkdtemp as any).mockResolvedValueOnce('/tmp/coursehub-db-export-abcd');
      (fs.rm as any).mockRejectedValueOnce(new Error('cleanup failed'));

      vi.spyOn(service as any, 'runPgDump').mockRejectedValueOnce(new Error('pg_dump failed'));

      await expect(service.createDownloadableBackup()).rejects.toBeInstanceOf(
        InternalServerErrorException
      );

      expect(logger.scopedLogger!.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          'Failed to clean up temp backup directory "/tmp/coursehub-db-export-abcd": cleanup failed'
        )
      );
    });
  });

  describe('cleanupTemporaryBackup', () => {
    it('removes the temporary backup directory', async () => {
      const { promises: fs } = await import('node:fs');

      await service.cleanupTemporaryBackup('/tmp/coursehub-db-export-abcd/file.dump');

      expect(fs.rm).toHaveBeenCalledWith('/tmp/coursehub-db-export-abcd', {
        recursive: true,
        force: true,
      });
    });

    it('logs a warning if cleanup fails', async () => {
      const { promises: fs } = await import('node:fs');
      (fs.rm as any).mockRejectedValueOnce(new Error('rm failed'));

      await service.cleanupTemporaryBackup('/tmp/coursehub-db-export-abcd/file.dump');

      expect(logger.scopedLogger!.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          'Failed to delete temporary backup directory "/tmp/coursehub-db-export-abcd": rm failed'
        )
      );
    });
  });

  describe('cleanupOldBackups', () => {
    it('deletes files older than 14 days', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-03-13T12:00:00.000Z'));

      const { promises: fs } = await import('node:fs');

      (fs.readdir as any).mockResolvedValueOnce(['old.dump', 'fresh.dump']);
      (fs.stat as any)
        .mockResolvedValueOnce({
          isFile: () => true,
          mtimeMs: new Date('2026-02-20T12:00:00.000Z').getTime(),
        })
        .mockResolvedValueOnce({
          isFile: () => true,
          mtimeMs: new Date('2026-03-10T12:00:00.000Z').getTime(),
        });

      await service.cleanupOldBackups();

      expect(fs.rm).toHaveBeenCalledWith(expect.stringContaining('/db-backups/old.dump'), {
        force: true,
      });
      expect(logger.scopedLogger!.log).toHaveBeenCalledWith(
        'Deleted expired database backup: old.dump'
      );
    });

    it('throws if backup directory cannot be read', async () => {
      const { promises: fs } = await import('node:fs');
      (fs.readdir as any).mockRejectedValueOnce(new Error('readdir failed'));

      await expect(service.cleanupOldBackups()).rejects.toThrow(
        'Failed to read backup directory: readdir failed'
      );
    });

    it('logs a warning and continues if processing one file fails', async () => {
      const { promises: fs } = await import('node:fs');
      (fs.readdir as any).mockResolvedValueOnce(['broken.dump']);
      (fs.stat as any).mockRejectedValueOnce(new Error('stat failed'));

      await service.cleanupOldBackups();

      expect(logger.scopedLogger!.warn).toHaveBeenCalledWith(
        expect.stringContaining('Failed to process old backup "broken.dump": stat failed')
      );
    });
  });

  describe('createScheduledBackup', () => {
    it('logs a success message after creating a scheduled backup', async () => {
      vi.spyOn(service, 'createPersistentBackup').mockResolvedValueOnce(
        '/app/db-backups/latest.dump'
      );

      await service.createScheduledBackup();

      expect(logger.scopedLogger!.log).toHaveBeenCalledWith(
        'Created scheduled database backup: latest.dump'
      );
    });

    it('logs an error if scheduled backup creation fails', async () => {
      vi.spyOn(service, 'createPersistentBackup').mockRejectedValueOnce(
        new Error('pg_dump failed')
      );

      await service.createScheduledBackup();

      expect(logger.scopedLogger!.error).toHaveBeenCalledWith(
        'Failed to create scheduled database backup: pg_dump failed'
      );
    });
  });

  describe('runPgDump', () => {
    it('spawns pg_dump with the configured database url', async () => {
      const { spawn } = await import('node:child_process');
      const child = createChildProcessMock();
      (spawn as any).mockReturnValueOnce(child);

      const promise = service['runPgDump']('/tmp/db.dump');
      child.emit('close', 0);

      await expect(promise).resolves.toBeUndefined();

      expect(spawn).toHaveBeenCalledWith(
        'pg_dump',
        [
          '--dbname',
          'postgresql://user:password@localhost:5432/coursehub',
          '--format=custom',
          '--no-owner',
          '--no-privileges',
          '--file',
          '/tmp/db.dump',
        ],
        { stdio: ['ignore', 'ignore', 'pipe'] }
      );
    });

    it('throws Error when pg_dump exits with an error', async () => {
      const { spawn } = await import('node:child_process');
      const child = createChildProcessMock();
      (spawn as any).mockReturnValueOnce(child);

      const promise = service['runPgDump']('/tmp/db.dump');
      child.stderr.emit('data', 'database unavailable');
      child.emit('close', 1);

      await expect(promise).rejects.toThrow('database unavailable');
    });

    it('throws Error when pg_dump cannot be started', async () => {
      const { spawn } = await import('node:child_process');
      const child = createChildProcessMock();
      (spawn as any).mockReturnValueOnce(child);

      const promise = service['runPgDump']('/tmp/db.dump');
      child.emit('error', new Error('spawn ENOENT'));

      await expect(promise).rejects.toThrow('Failed to start pg_dump: spawn ENOENT');
    });

    it('throws if pg_dump times out', async () => {
      vi.useFakeTimers();

      const { spawn } = await import('node:child_process');
      const child = createChildProcessMock();
      child.kill = vi.fn() as any;
      (spawn as any).mockReturnValueOnce(child);

      const promise = service['runPgDump']('/tmp/db.dump');

      const rejectionAssertion = expect(promise).rejects.toThrow(
        'pg_dump timed out after 60000 ms.'
      );

      await vi.advanceTimersByTimeAsync(60_000);
      await rejectionAssertion;

      expect(child.kill).toHaveBeenCalledWith('SIGKILL');
    });
  });
});

function createChildProcessMock() {
  const child = new EventEmitter() as EventEmitter & {
    stderr: EventEmitter;
    kill: ReturnType<typeof vi.fn>;
  };

  child.stderr = new EventEmitter();
  child.kill = vi.fn();

  return child;
}
