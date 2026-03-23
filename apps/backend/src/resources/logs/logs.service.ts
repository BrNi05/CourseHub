import { Injectable, InternalServerErrorException, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { once } from 'node:events';
import { createReadStream, createWriteStream, promises as fs } from 'node:fs';
import type { WriteStream } from 'node:fs';
import * as path from 'node:path';
import * as readline from 'node:readline';
import { ContextualLogger, LoggerService } from '../../logger/logger.service.js';

@Injectable()
export class LogsService implements OnModuleInit {
  private readonly logPath = path.resolve(process.cwd(), 'CourseHub-Backend.log');
  private readonly logger: ContextualLogger;

  constructor(private readonly loggerService: LoggerService) {
    this.logger = loggerService.forContext(LogsService.name);
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.deleteOldLogs();
    } catch (error) {
      this.logger.error(
        `Startup log retention cleanup failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async getLogStream() {
    try {
      await fs.access(this.logPath);
    } catch {
      throw new InternalServerErrorException('Log file not found');
    }

    return createReadStream(this.logPath);
  }

  async clearLogs() {
    await this.loggerService.withReleasedFileStream(async () => {
      await fs.writeFile(this.logPath, '', 'utf-8');
    });
  }

  // Delete logs older than 3 weeks, runs every day at 5 AM
  @Cron(CronExpression.EVERY_DAY_AT_5AM)
  async deleteOldLogs() {
    const threeWeeksAgo = new Date();
    threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);

    await this.loggerService.withReleasedFileStream(async () => {
      try {
        await fs.access(this.logPath);
      } catch {
        return;
      }

      const tempFile = this.logPath + '.tmp';

      try {
        await this.rewriteLogFile(tempFile, threeWeeksAgo);
        await fs.copyFile(tempFile, this.logPath);
        await fs.unlink(tempFile);
      } catch (error) {
        await fs.unlink(tempFile).catch(() => undefined);
        throw error;
      }
    });
  }

  private parseDateFromLog(line: string): Date | null {
    // Format: 2026. 02. 21. du. 05:25:10 [INFO] ...
    const regex = /^(\d{4})\. (\d{2})\. (\d{2})\. (de|du)\. (\d{2}):(\d{2}):(\d{2})/;

    const match = regex.exec(line);
    if (!match) return null;

    let [, year, month, day, period, hour, minute, second] = match;

    let h = Number.parseInt(hour, 10);

    if (period === 'du' && h < 12) h += 12;

    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      h,
      Number(minute),
      Number(second)
    );
  }

  // Clears log entries older than the cutoff date by rewriting the log file (GDPR compliance)
  private async rewriteLogFile(tempFile: string, cutoffDate: Date): Promise<void> {
    const readStream = createReadStream(this.logPath);
    const writeStream = createWriteStream(tempFile, { flags: 'w' });
    const rl = readline.createInterface({
      input: readStream,
      crlfDelay: Infinity,
    });

    try {
      for await (const line of rl) {
        const date = this.parseDateFromLog(line);
        if (!date || date >= cutoffDate) {
          if (!writeStream.write(line + '\n')) {
            await once(writeStream, 'drain');
          }
        }
      }

      await this.closeWriteStream(writeStream);
    } catch (error) {
      readStream.destroy();
      writeStream.destroy();
      throw error;
    } finally {
      rl.close();
      readStream.destroy();
    }
  }

  // Closes a writable stream
  private async closeWriteStream(writeStream: WriteStream): Promise<void> {
    if (writeStream.destroyed) return;

    await new Promise<void>((resolve, reject) => {
      writeStream.once('error', reject);
      writeStream.end(() => resolve());
    });
  }
}
