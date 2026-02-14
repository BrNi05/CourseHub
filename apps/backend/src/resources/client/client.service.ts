import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

import { Cron, CronExpression } from '@nestjs/schedule';
import { ErrorReportDto } from './dto/error-report.dto.js';

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
    cutoffDate.setUTCDate(cutoffDate.getUTCDate() - 365); // Ping log retention: 365 days ago

    try {
      await this.prisma.clientPing.deleteMany({
        where: {
          date: { lte: cutoffDate },
        },
      });
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

    const payload: ErrorReportDto & { userId: string; receivedAt: string } = {
      userId,
      receivedAt: new Date().toISOString(),
      ...data,
    };

    await fs.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf-8');
  }
}
