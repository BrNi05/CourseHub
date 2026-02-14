import { Module } from '@nestjs/common';
import { FacultyService } from './faculty.service.js';
import { FacultyController } from './faculty.controller.js';

import { PrismaModule } from '../../prisma/prisma.module.js';
import { LoggerModule } from '../../logger/logger.module.js';

@Module({
  imports: [PrismaModule, LoggerModule.forRoot('FacultyModule')],
  controllers: [FacultyController],
  providers: [FacultyService],
  exports: [FacultyService],
})
export class FacultyModule {}
