import { Module } from '@nestjs/common';
import { LogsService } from './logs.service.js';
import { LogsController } from './logs.controller.js';

import { PrismaModule } from '../../prisma/prisma.module.js';
import { LoggerModule } from '../../logger/logger.module.js';
import { AuthModule } from '../../auth/auth.module.js';

@Module({
  imports: [PrismaModule, AuthModule, LoggerModule.forRoot('LogsModule')],
  controllers: [LogsController],
  providers: [LogsService],
  exports: [LogsService],
})
export class LogsModule {}
