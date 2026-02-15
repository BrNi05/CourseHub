/* eslint-disable internal/no-serializer */
import { Controller, Post, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiIAmATeapotResponse,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiOperation,
} from '@nestjs/swagger';

import { ClientService } from './client.service.js';
import { ClientIdDto } from './dto/client-id.dto.js';
import { ErrorReportDto } from './dto/error-report.dto.js';

import { RequiresAuthAndOwnership } from '../../decorators/ownership.decorator.js';
import { DatabaseOperation } from '../../decorators/database-operation.decorator.js';
import { Throttable } from '../../common/throttling/throttler.decorator.js';

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

  @Post('ping/:id') // identify and authorize the user
  @RequiresAuthAndOwnership()
  @ApiOperation({
    summary: 'USER AUTH',
    description: 'Ping CourseHub so it can track usage statistics',
  })
  @ApiOkResponse({ description: 'Ping received' })
  @HttpCode(HttpStatus.OK)
  @DatabaseOperation()
  @Throttable(60, 20000)
  async ping(@Param('id') userId: string, @Body() body: ClientIdDto) {
    await this.clientService.ping(userId, body.platform, body.version);
  }

  @Post('error-report/:id') // identify and authorize the user
  @RequiresAuthAndOwnership()
  @ApiOperation({
    summary: 'USER AUTH',
    description: 'Report a client error for later analysis',
  })
  @ApiCreatedResponse({ description: 'Error report received' })
  @Throttable(60, 20000)
  async errorReport(@Param('id') userId: string, @Body() body: ErrorReportDto) {
    await this.clientService.reportError(userId, body);
  }
}
