/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DatabaseBackupController } from './database-backup.controller.js';
import type { DatabaseBackupService } from './database-backup.service.js';

describe('DatabaseBackupController', () => {
  let controller: DatabaseBackupController;
  let databaseBackupService: any;

  beforeEach(() => {
    databaseBackupService = {
      createDownloadableBackup: vi.fn(),
      cleanupTemporaryBackup: vi.fn(),
    };

    controller = new DatabaseBackupController(databaseBackupService as DatabaseBackupService);
  });

  describe('downloadBackup', () => {
    it('starts the download and cleans up the temporary file afterwards', async () => {
      databaseBackupService.createDownloadableBackup.mockResolvedValueOnce({
        fileName: 'coursehub-db-export-2026-03-13.dump',
        filePath: '/tmp/coursehub-db-export/file.dump',
      });

      const res: any = {
        download: vi.fn((filePath: string, fileName: string, callback: (error?: Error) => void) => {
          expect(filePath).toBe('/tmp/coursehub-db-export/file.dump');
          expect(fileName).toBe('coursehub-db-export-2026-03-13.dump');
          callback();
        }),
        status: vi.fn().mockReturnThis(),
        end: vi.fn(),
        destroy: vi.fn(),
        headersSent: false,
      };

      await controller.downloadBackup(res);

      expect(databaseBackupService.createDownloadableBackup).toHaveBeenCalledTimes(1);
      expect(databaseBackupService.cleanupTemporaryBackup).toHaveBeenCalledWith(
        '/tmp/coursehub-db-export/file.dump'
      );
      expect(res.status).not.toHaveBeenCalled();
      expect(res.end).not.toHaveBeenCalled();
      expect(res.destroy).not.toHaveBeenCalled();
    });

    it('returns 500 if express download reports an error before headers are sent', async () => {
      const error = new Error('download failed');

      databaseBackupService.createDownloadableBackup.mockResolvedValueOnce({
        fileName: 'coursehub-db-export-2026-03-13.dump',
        filePath: '/tmp/coursehub-db-export/file.dump',
      });

      const res: any = {
        download: vi.fn((_filePath: string, _fileName: string, callback: (error?: Error) => void) =>
          callback(error)
        ),
        status: vi.fn().mockReturnThis(),
        end: vi.fn(),
        destroy: vi.fn(),
        headersSent: false,
      };

      await controller.downloadBackup(res);

      expect(databaseBackupService.cleanupTemporaryBackup).toHaveBeenCalledWith(
        '/tmp/coursehub-db-export/file.dump'
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.end).toHaveBeenCalled();
      expect(res.destroy).not.toHaveBeenCalled();
    });

    it('destroys the response if express download reports an error after headers were sent', async () => {
      const error = new Error('download failed');

      databaseBackupService.createDownloadableBackup.mockResolvedValueOnce({
        fileName: 'coursehub-db-export-2026-03-13.dump',
        filePath: '/tmp/coursehub-db-export/file.dump',
      });

      const res: any = {
        download: vi.fn((_filePath: string, _fileName: string, callback: (error?: Error) => void) =>
          callback(error)
        ),
        status: vi.fn().mockReturnThis(),
        end: vi.fn(),
        destroy: vi.fn(),
        headersSent: true,
      };

      await controller.downloadBackup(res);

      expect(databaseBackupService.cleanupTemporaryBackup).toHaveBeenCalledWith(
        '/tmp/coursehub-db-export/file.dump'
      );
      expect(res.status).not.toHaveBeenCalled();
      expect(res.end).not.toHaveBeenCalled();
      expect(res.destroy).toHaveBeenCalledWith(error);
    });

    it('propagates backup generation errors', async () => {
      databaseBackupService.createDownloadableBackup.mockRejectedValueOnce(
        new Error('pg_dump failed')
      );

      const res: any = {
        download: vi.fn(),
        status: vi.fn().mockReturnThis(),
        end: vi.fn(),
        destroy: vi.fn(),
        headersSent: false,
      };

      await expect(controller.downloadBackup(res)).rejects.toThrow('pg_dump failed');
    });
  });
});
