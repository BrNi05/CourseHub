import { Module } from '@nestjs/common';

import { AuthModule } from '../../auth/auth.module.js';
import { PrismaModule } from '../../prisma/prisma.module.js';

import { CreditsController } from './credits.controller.js';
import { CreditsService } from './credits.service.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CreditsController],
  providers: [CreditsService],
})
export class CreditsModule {}
