import { Module } from '@nestjs/common';
import { UniversityService } from './university.service.js';
import { UniversityController } from './university.controller.js';

import { PrismaModule } from '../../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [UniversityController],
  providers: [UniversityService],
  exports: [UniversityService],
})
export class UniversityModule {}
