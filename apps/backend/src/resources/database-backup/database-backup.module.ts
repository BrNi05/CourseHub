import { Module } from '@nestjs/common';

import { DatabaseBackupController } from './database-backup.controller.js';
import { DatabaseBackupService } from './database-backup.service.js';

import { AuthModule } from '../../auth/auth.module.js';
import { LoggerModule } from '../../logger/logger.module.js';

@Module({
  imports: [AuthModule, LoggerModule.forRoot('DatabaseBackupModule')],
  controllers: [DatabaseBackupController],
  providers: [DatabaseBackupService],
  exports: [DatabaseBackupService],
})
export class DatabaseBackupModule {}
