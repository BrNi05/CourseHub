import { Module } from '@nestjs/common';

import { DatabaseBackupController } from './database-backup.controller.js';
import { DatabaseBackupService } from './database-backup.service.js';

import { AuthModule } from '../../auth/auth.module.js';
import { PrismaModule } from '../../prisma/prisma.module.js';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [DatabaseBackupController],
  providers: [DatabaseBackupService],
  exports: [DatabaseBackupService],
})
export class DatabaseBackupModule {}
