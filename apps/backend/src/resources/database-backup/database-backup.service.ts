import { Injectable, InternalServerErrorException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';

import { LoggerService } from '../../logger/logger.service.js';

@Injectable()
export class DatabaseBackupService implements OnModuleInit {
  private readonly backupDir = path.join(process.cwd(), 'db-backups');
  private readonly backupRetentionDays = 14;
  private readonly pgDumpTimeoutMs = 60_000; // 60 sec

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
      await this.cleanupOldBackups();
    } catch (error) {
      this.logger.error(
        `Database backup module initialization failed: ${this.getErrorMessage(error)}`
      );
      throw error;
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async createScheduledBackup(): Promise<void> {
    try {
      const backupPath = await this.createPersistentBackup();
      this.logger.log(`Created scheduled database backup: ${path.basename(backupPath)}`);
    } catch (error) {
      this.logger.error(
        `Failed to create scheduled database backup: ${this.getErrorMessage(error)}`
      );
    }
  }

  // Called by the scheduler automatically
  async createPersistentBackup(): Promise<string> {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });

      const fileName = this.buildFileName('backup');
      const filePath = path.join(this.backupDir, fileName);

      await this.runPgDump(filePath);
      await this.cleanupOldBackups();

      return filePath;
    } catch (error) {
      throw new Error(
        `Failed to create persistent database backup: ${this.getErrorMessage(error)}`,
        { cause: error }
      );
    }
  }

  // Called by the controller for on-demand downloads
  async createDownloadableBackup(): Promise<{ fileName: string; filePath: string }> {
    let tempDir: string | null = null;

    try {
      tempDir = await fs.mkdtemp(path.join(tmpdir(), 'coursehub-db-export-'));
      const fileName = this.buildFileName('export');
      const filePath = path.join(tempDir, fileName);

      await this.runPgDump(filePath);
      return { fileName, filePath };
    } catch (error) {
      if (tempDir) {
        try {
          await fs.rm(tempDir, { recursive: true, force: true });
        } catch (cleanupError) {
          this.logger.warn(
            `Failed to clean up temp backup directory "${tempDir}": ${this.getErrorMessage(cleanupError)}`
          );
        }
      }

      throw new InternalServerErrorException(
        `Failed to create downloadable database backup: ${this.getErrorMessage(error)}`,
        { cause: error }
      );
    }
  }

  // Post-download cleanup of temporary backup files
  async cleanupTemporaryBackup(filePath: string): Promise<void> {
    try {
      await fs.rm(path.dirname(filePath), { recursive: true, force: true });
    } catch (error) {
      this.logger.warn(
        `Failed to delete temporary backup directory "${path.dirname(filePath)}": ${this.getErrorMessage(error)}`
      );
    }
  }

  // Deletes backup files older than the retention period
  async cleanupOldBackups(): Promise<void> {
    await fs.mkdir(this.backupDir, { recursive: true });

    let files: string[];
    try {
      files = await fs.readdir(this.backupDir);
    } catch (error) {
      throw new Error(`Failed to read backup directory: ${this.getErrorMessage(error)}`, {
        cause: error,
      });
    }

    const cutoff = Date.now() - this.backupRetentionDays * 24 * 60 * 60 * 1000;

    for (const file of files) {
      const filePath = path.join(this.backupDir, file);

      try {
        const stats = await fs.stat(filePath);
        if (!stats.isFile() || stats.mtimeMs >= cutoff) continue;
        await fs.rm(filePath, { force: true });
        this.logger.log(`Deleted expired database backup: ${file}`);
      } catch (error) {
        this.logger.warn(`Failed to process old backup "${file}": ${this.getErrorMessage(error)}`);
      }
    }
  }

  // Helper to build backup file names with timestamps
  private buildFileName(kind: 'backup' | 'export'): string {
    const timestamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-');
    return `coursehub-db-${kind}-${timestamp}.dump`;
  }

  // Helper to run pg_dump
  private async runPgDump(targetPath: string): Promise<void> {
    const databaseUrl = new URL(this.configService.get<string>('DATABASE_URL')!).toString();

    await new Promise<void>((resolve, reject) => {
      const pgProcess = spawn(
        'pg_dump',
        [
          '--dbname',
          databaseUrl,
          '--format=custom',
          '--no-owner',
          '--no-privileges',
          '--file',
          targetPath,
        ],
        {
          stdio: ['ignore', 'ignore', 'pipe'],
        }
      );

      let stderr = '';

      // Kill if the process is stuck
      const timeout = setTimeout(() => {
        pgProcess.kill('SIGKILL');
        reject(new Error(`pg_dump timed out after ${this.pgDumpTimeoutMs} ms.`));
      }, this.pgDumpTimeoutMs);

      // Capture stderr for error reporting
      pgProcess.stderr?.on('data', (chunk: Buffer | string) => {
        stderr += chunk.toString();
      });

      // Handle process errors
      pgProcess.once('error', (error) => {
        clearTimeout(timeout);
        reject(new Error(`Failed to start pg_dump: ${error.message || 'unknown error'}`));
      });

      // Handle process exit
      pgProcess.once('close', (code) => {
        clearTimeout(timeout);

        // Success
        if (code === 0) {
          resolve();
          return;
        }

        // Failure
        reject(new Error(stderr.trim() || `pg_dump exited with code ${String(code)}.`));
      });
    });
  }

  // Helper to extract error messages from different error types
  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
