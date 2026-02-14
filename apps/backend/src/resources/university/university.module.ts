import { Module } from '@nestjs/common';
import { UniversityService } from './university.service.js';
import { UniversityController } from './university.controller.js';

import { PrismaModule } from '../../prisma/prisma.module.js';
import { LoggerModule } from '../../logger/logger.module.js';

@Module({
  imports: [PrismaModule, LoggerModule.forRoot('UniversityModule')],
  controllers: [UniversityController],
  providers: [UniversityService],
  exports: [UniversityService],
})
export class UniversityModule {}
