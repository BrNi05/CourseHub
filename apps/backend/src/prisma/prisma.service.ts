import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from './generated/client/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

import { ContextualLogger, LoggerService } from '../logger/logger.service.js';

const isOpenApiGeneration = process.env['OPENAPI_GENERATION'] === 'true';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  readonly logger: ContextualLogger;

  constructor(logger: LoggerService) {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL as string,
    });

    super({ adapter }); // just pass adapter, no globalThis
    this.logger = logger.forContext(PrismaService.name);
  }

  async onModuleInit() {
    if (isOpenApiGeneration) {
      this.logger.log('Skipping PostgreSQL connection during OpenAPI generation.');
      return;
    }

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
    if (isOpenApiGeneration) return;

    await this.$disconnect();
    this.logger.log('CourseHub-Backend is shutting down. Disconnected from PostgreSQL.');
  }
}
