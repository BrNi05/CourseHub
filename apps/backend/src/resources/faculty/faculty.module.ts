import { Module } from '@nestjs/common';
import { FacultyService } from './faculty.service.js';
import { FacultyController } from './faculty.controller.js';

import { PrismaModule } from '../../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [FacultyController],
  providers: [FacultyService],
  exports: [FacultyService],
})
export class FacultyModule {}
