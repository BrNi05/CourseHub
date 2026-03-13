/* eslint-disable internal/no-serializer */
import { Controller, Get, Res } from '@nestjs/common';
import { type Response } from 'express';
import { ApiOkResponse, ApiOperation, ApiProduces } from '@nestjs/swagger';

import { DatabaseBackupService } from './database-backup.service.js';

import { Admin } from '../../decorators/auth/admin.decorator.js';
import { Throttable } from '../../common/throttling/throttler.decorator.js';
import { FileSystemOperation } from '../../decorators/responses/filesys-operation.decorator.js';

@Controller('database-backup')
export class DatabaseBackupController {
  constructor(private readonly databaseBackupService: DatabaseBackupService) {}

  @Get('download')
  @Admin()
  @ApiOperation({
    summary: 'ADMIN',
    description: 'Creates a temporary database dump and downloads it.',
  })
  @ApiProduces('application/octet-stream')
  @ApiOkResponse({ description: 'Downloaded' })
  @Throttable(60, 2)
  @FileSystemOperation()
  async downloadBackup(@Res() res: Response): Promise<void> {
    const { fileName, filePath } = await this.databaseBackupService.createDownloadableBackup();

    res.download(filePath, fileName, (error) => {
      void this.databaseBackupService.cleanupTemporaryBackup(filePath);

      if (!error) return;
      if (error && !res.headersSent) {
        res.status(500).end(); // error before response
        return;
      }
      res.destroy(error); // error mid-response
    });
  }
}
