import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from './generated/client/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

import { LoggerService } from '../logger/logger.service.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  readonly logger: LoggerService;

  constructor(logger: LoggerService) {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL as string,
    });

    super({ adapter }); // just pass adapter, no globalThis
    this.logger = logger;
  }

  async onModuleInit() {
    let retries = 3;
    while (retries) {
      try {
        await this.$connect();
        this.logger.log('CourseHub started. Connected to PostgreSQL successfully.');
        return;
      } catch {
        this.logger.warn('Failed to connect to database, retrying...');
        retries--;
      }
    }
    this.logger.error('Could not connect to database after 3 attempts. Exiting...');
    process.exit(1);
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Disconnected from PostgreSQL.');
  }
}
