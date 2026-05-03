import { Module } from '@nestjs/common';

import { AuthModule } from '../../auth/auth.module.js';
import { PrismaModule } from '../../prisma/prisma.module.js';

import { AveragesController } from './averages.controller.js';
import { AveragesService } from './averages.service.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AveragesController],
  providers: [AveragesService],
})
export class AveragesModule {}
