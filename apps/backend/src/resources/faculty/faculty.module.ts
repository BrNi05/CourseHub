import { Module } from '@nestjs/common';
import { FacultyService } from './faculty.service.js';
import { FacultyController } from './faculty.controller.js';

import { PrismaModule } from '../../prisma/prisma.module.js';
import { AuthModule } from '../../auth/auth.module.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [FacultyController],
  providers: [FacultyService],
  exports: [FacultyService],
})
export class FacultyModule {}
