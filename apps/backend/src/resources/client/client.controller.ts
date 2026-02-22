/* eslint-disable internal/no-serializer */
import { Controller, Get, Post, Delete, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiIAmATeapotResponse,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiOperation,
} from '@nestjs/swagger';

import { ClientService } from './client.service.js';
import { ClientIdDto } from './dto/client-id.dto.js';
import { ErrorReportDto } from './dto/error-report.dto.js';
import { ErrorReportResponseDto } from './dto/error-report-response.dto.js';

import { Admin } from '../../decorators/auth/admin.decorator.js';
import { DatabaseOperation } from '../../decorators/responses/database-operation.decorator.js';
import { Throttable } from '../../common/throttling/throttler.decorator.js';
import { FileSystemOperation } from '../../decorators/responses/filesys-operation.decorator.js';
import { DeletedResponse } from '../../decorators/responses/deleted-response.decorator.js';
import { RequiresAuth } from '../../decorators/auth/auth.decorator.js';
import { AuthUserId } from '../../decorators/auth/user-id.dto.js';

@Controller('client')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Post('check-version')
  @ApiOperation({
    summary: 'PUBLIC',
    description: 'Check if the client version is supported (meets minimum version)',
  })
  @ApiOkResponse({ description: 'Client version is supported' })
  @HttpCode(HttpStatus.OK)
  @ApiIAmATeapotResponse({ description: 'Client version is not supported' })
  @Throttable(60, 20000)
  checkVersion(@Body() dto: ClientIdDto): void {
    this.clientService.isVersionSupported(dto.platform, dto.version);
  }

  @Post('ping')
  @RequiresAuth()
  @ApiOperation({
    summary: 'USER AUTH',
    description:
      'Ping CourseHub so it can track usage statistics. User is indentified by the userId in the JWT.',
  })
  @ApiOkResponse({ description: 'Ping received' })
  @HttpCode(HttpStatus.OK)
  @DatabaseOperation()
  @Throttable(60, 20000)
  async ping(@AuthUserId() userId: string, @Body() body: ClientIdDto) {
    await this.clientService.ping(userId, body.platform, body.version);
  }

  @Post('error-report')
  @RequiresAuth()
  @ApiOperation({
    summary: 'USER AUTH',
    description:
      'Report a client error for later analysis. User is indentified by the userId in the JWT.',
  })
  @ApiCreatedResponse({ description: 'Error report received' })
  @Throttable(60, 20000)
  @FileSystemOperation()
  async errorReport(@AuthUserId() userId: string, @Body() body: ErrorReportDto) {
    await this.clientService.reportError(userId, body);
  }

  @Get('error-reports')
  @Admin()
  @ApiOperation({
    summary: 'ADMIN',
    description: 'List all error report files content',
  })
  @ApiOkResponse({ description: 'Success', type: [ErrorReportResponseDto] })
  @Throttable(60, 3)
  @FileSystemOperation()
  async listErrorReports(): Promise<ErrorReportResponseDto[]> {
    return await this.clientService.listErrorReports();
  }

  @Delete('error-reports/:fileName')
  @Admin()
  @ApiOperation({
    summary: 'ADMIN',
    description: 'Delete an error report',
  })
  @DeletedResponse()
  @Throttable(60, 3)
  @FileSystemOperation()
  async deleteErrorReport(@Param('fileName') fileName: string): Promise<void> {
    await this.clientService.deleteErrorReport(fileName);
  }
}
