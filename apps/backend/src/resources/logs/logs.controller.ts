/* eslint-disable internal/no-serializer */
import { Controller, Get, Delete, Res } from '@nestjs/common';
import { type Response } from 'express';

import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';

import { LogsService } from './logs.service.js';

import { Admin } from '../../decorators/auth/admin.decorator.js';
import { Throttable } from '../../common/throttling/throttler.decorator.js';
import { FileSystemOperation } from '../../decorators/responses/filesys-operation.decorator.js';
import { DeletedResponse } from '../../decorators/responses/deleted-response.decorator.js';

@Controller('logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get('download')
  @Admin()
  @ApiOperation({
    summary: 'ADMIN',
    description: 'Downloads the logs for the application',
  })
  @FileSystemOperation()
  @Throttable(60, 3)
  @ApiOkResponse({ description: 'Downloaded' })
  async downloadLogs(@Res() res: Response) {
    const stream = await this.logsService.getLogStream();

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename="CourseHub-Backend.log"');

    stream.pipe(res);
  }

  @Delete()
  @Admin()
  @ApiOperation({
    summary: 'ADMIN',
    description: 'Clears the log file of the application',
  })
  @DeletedResponse('cleared')
  @Throttable(60, 3)
  @FileSystemOperation()
  async clearLogs() {
    return this.logsService.clearLogs();
  }
}
