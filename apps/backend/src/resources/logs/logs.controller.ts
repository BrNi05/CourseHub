/* eslint-disable internal/no-serializer */
import { Controller, Get, Delete, Res } from '@nestjs/common';
import { type Response } from 'express';

import { ApiOkResponse, ApiOperation, ApiProduces } from '@nestjs/swagger';

import { LogsService } from './logs.service.js';

import { Admin } from '../../decorators/auth/admin.decorator.js';
import { Throttable } from '../../common/throttling/throttler.decorator.js';
import { FileSystemOperation } from '../../decorators/responses/filesys-operation.decorator.js';
import { DeletedResponse } from '../../decorators/responses/deleted-response.decorator.js';

import {
  ONE_DAY_THROTTLE_TTL,
  THROTTLE_LIMIT_ONE,
} from '../../common/throttling/throttling.constants.js';

@Controller('logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get('download')
  @Admin()
  @ApiOperation({
    summary: 'ADMIN',
    description: 'Downloads the logs for the application',
  })
  @ApiProduces('text/plain')
  @ApiOkResponse({ description: 'Downloaded' })
  @FileSystemOperation()
  @Throttable(ONE_DAY_THROTTLE_TTL, THROTTLE_LIMIT_ONE)
  async downloadLogs(@Res() res: Response) {
    const stream = await this.logsService.getLogStream();

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename="CourseHub-Backend.log"');

    stream.on('error', (error) => {
      if (!res.headersSent) {
        res.status(500).end();
        return;
      }
      res.destroy(error);
    });

    stream.pipe(res);
  }

  @Delete()
  @Admin()
  @ApiOperation({
    summary: 'ADMIN',
    description: 'Clears the log file of the application',
  })
  @DeletedResponse('cleared')
  @FileSystemOperation()
  @Throttable(ONE_DAY_THROTTLE_TTL, THROTTLE_LIMIT_ONE)
  async clearLogs() {
    return this.logsService.clearLogs();
  }
}
