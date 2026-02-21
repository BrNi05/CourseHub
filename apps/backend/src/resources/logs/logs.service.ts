import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { createReadStream, promises as fs } from 'node:fs';
import * as path from 'node:path';
import * as readline from 'node:readline';

@Injectable()
export class LogsService {
  private readonly logPath = path.resolve(process.cwd(), 'CourseHub-Backend.log');

  async getLogStream() {
    try {
      await fs.access(this.logPath);
    } catch {
      throw new InternalServerErrorException('Log file not found');
    }

    return createReadStream(this.logPath);
  }

  async clearLogs() {
    await fs.writeFile(this.logPath, '', 'utf-8');
  }

  // Delete logs older than 3 weeks, runs every day at 5 AM
  @Cron(CronExpression.EVERY_DAY_AT_5AM)
  async deleteOldLogs() {
    const threeWeeksAgo = new Date();
    threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);

    const tempFile = this.logPath + '.tmp';

    const readStream = createReadStream(this.logPath);
    const writeStream = await fs.open(tempFile, 'w');

    const rl = readline.createInterface({
      input: readStream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      const date = this.parseDateFromLog(line);
      if (!date || date >= threeWeeksAgo) {
        await writeStream.appendFile(line + '\n');
      }
    }

    await writeStream.close();
    await fs.rename(tempFile, this.logPath);
  }

  private parseDateFromLog(line: string): Date | null {
    // Format: 2026. 02. 21. du. 05:25:10 [INFO] ...
    const regex = /^(\d{4})\. (\d{2})\. (\d{2})\. (de|du)\. (\d{2}):(\d{2}):(\d{2})/;

    const match = new RegExp(regex).exec(line);
    if (!match) return null;

    let [, year, month, day, period, hour, minute, second] = match;

    let h = Number.parseInt(hour, 10);

    if (period === 'du' && h < 12) {
      h += 12;
    }

    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      h,
      Number(minute),
      Number(second)
    );
  }
}
