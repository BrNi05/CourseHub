import { Module } from '@nestjs/common';
import { UniversityService } from './university.service.js';
import { UniversityController } from './university.controller.js';

import { PrismaModule } from '../../prisma/prisma.module.js';
import { AuthModule } from '../../auth/auth.module.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [UniversityController],
  providers: [UniversityService],
  exports: [UniversityService],
})
export class UniversityModule {}
