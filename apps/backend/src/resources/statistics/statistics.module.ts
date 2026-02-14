import { Module } from '@nestjs/common';
import { StatisticsService } from './statistics.service.js';
import { StatisticsController } from './statistics.controller.js';

import { PrismaModule } from '../../prisma/prisma.module.js';
import { LoggerModule } from '../../logger/logger.module.js';
import { AuthModule } from '../../auth/auth.module.js';

@Module({
  imports: [PrismaModule, AuthModule, LoggerModule.forRoot('StatisticsModule')],
  controllers: [StatisticsController],
  providers: [StatisticsService],
  exports: [StatisticsService],
})
export class StatisticsModule {}
