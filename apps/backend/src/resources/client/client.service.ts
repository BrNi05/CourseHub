import {
  Injectable,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { ErrorReportDto } from './dto/error-report.dto.js';
import { ErrorReportResponseDto } from './dto/error-report-response.dto.js';

import { PrismaService } from '../../prisma/prisma.service.js';
import { ClientPlatform } from '../../prisma/generated/client/client.js';

import { LoggerService } from '../../logger/logger.service.js';

import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import * as semver from 'semver';

@Injectable()
export class ClientService {
  private readonly logger: LoggerService;
  private readonly reportsDir: string;

  constructor(
    private readonly prisma: PrismaService,
    logger: LoggerService
  ) {
    this.logger = logger;
    this.reportsDir = path.join(process.cwd(), 'error-reports');
  }

  async onModuleInit(): Promise<void> {
    await fs.mkdir(this.reportsDir, { recursive: true });
  }

  // For now, hardcoded and updated on rare, special ocassions.
  // Desktop platforms will always be updated together
  private getMinVersions(): Record<ClientPlatform, string[]> {
    return {
      windows: ['1.0.0'],
      linux: ['1.0.0'],
      macos: ['1.0.0'],
      android: ['1.0.0'],
      ios: ['1.0.0'],
    };
  }

  isVersionSupported(platform: ClientPlatform, version: string): void {
    const minVersion = this.getMinVersions()[platform][0];

    if (!semver.valid(version) || semver.lt(version, minVersion)) {
      throw new HttpException('Client version is not supported', HttpStatus.I_AM_A_TEAPOT);
    }
  }

  async ping(userId: string, platform: ClientPlatform, version: string): Promise<void> {
    const now = new Date();

    // Ping is tracked daily
    const normalizedDate = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );

    await this.prisma.clientPing.create({
      data: {
        userId,
        platform,
        version,
        date: normalizedDate,
      },
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanOldPings() {
    const cutoffDate = new Date();
    cutoffDate.setUTCDate(cutoffDate.getUTCDate() - 364); // Ping log retention: 364 days ago (buffer)

    try {
      const deletedCount = await this.prisma.clientPing.deleteMany({
        where: {
          date: { lte: cutoffDate },
        },
      });

      // GDPR compliance: log success and metadata
      this.logger.log(`Deleted ${deletedCount.count} old client pings.`);
    } catch {
      this.logger.error('Failed to clean old client pings.');
    }
  }

  async reportError(userId: string, data: ErrorReportDto): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { googleEmail: true },
    }); // cannot be null due to ownership auth on controller

    const timestamp = Date.now();
    const fileName = `${user!.googleEmail}-${timestamp}.json`;

    const filePath = path.join(this.reportsDir, fileName);

    const payload: ErrorReportResponseDto = {
      userId,
      receivedAt: new Date().toISOString(),
      ...data,
    };

    await fs.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf-8');
  }

  async listErrorReports(): Promise<ErrorReportResponseDto[]> {
    const files = await fs.readdir(this.reportsDir);

    const reports: ErrorReportResponseDto[] = [];

    for (const file of files) {
      const content = await fs.readFile(path.join(this.reportsDir, file), 'utf-8');
      reports.push(JSON.parse(content) as ErrorReportResponseDto);
    }

    return reports;
  }

  async deleteErrorReport(fileName: string): Promise<void> {
    const filePath = path.join(this.reportsDir, fileName);

    try {
      await fs.unlink(filePath);
    } catch {
      this.logger.error(`Failed to delete error report: ${fileName}.`);
      throw new InternalServerErrorException('Failed to delete error report');
    }
  }

  // GDPR compliance: delete error reports after 30 days
  // 28 days: ensure that no late deletation happens, e.g. due to server downtime
  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async cleanOldErrorReports() {
    try {
      const files = await fs.readdir(this.reportsDir);

      const now = Date.now();

      for (const file of files) {
        // File name format: {email}-{timestamp}.json
        const timestampPart = file.split('-').at(-1)!.replace('.json', '');
        const timestamp = Number.parseInt(timestampPart, 10);

        if (Number.isNaN(timestamp)) throw new TypeError(`Invalid file name format: ${file}`);

        if (now - timestamp > 28 * 24 * 60 * 60 * 1000) {
          await fs.unlink(path.join(this.reportsDir, file));
          this.logger.log(`Deleted old error report: [email]-${timestampPart}.json`);
        }
      }
    } catch {
      this.logger.error('Failed to clean old error reports.');
    }
  }
}
