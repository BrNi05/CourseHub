import { Module } from '@nestjs/common';
import { CourseService } from './course.service.js';
import { CourseController } from './course.controller.js';

import { PrismaModule } from '../../prisma/prisma.module.js';
import { LoggerModule } from '../../logger/logger.module.js';

@Module({
  imports: [PrismaModule, LoggerModule.forRoot('CourseModule')],
  controllers: [CourseController],
  providers: [CourseService],
  exports: [CourseService],
})
export class CourseModule {}
