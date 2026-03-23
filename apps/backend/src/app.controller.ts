/* eslint-disable internal/no-serializer */
import { Controller, Get, Res } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiProduces } from '@nestjs/swagger';
import type { Response } from 'express';

import { AppService } from './app.service.js';

import { HealthCheckDto } from './resources/healthcheck/health-check.response.dto.js';

import { Throttable } from './common/throttling/throttler.decorator.js';
import { InternalOnly } from './decorators/auth/internal.decorator.js';
import { Serialize } from './decorators/serialize.decorator.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @Serialize(HealthCheckDto)
  @ApiOperation({
    summary: 'PUBLIC',
    description:
      'Health check endpoint for Docker and CourseHub clients. Health status is determined based on server load.',
  })
  @ApiOkResponse({
    type: HealthCheckDto,
    description: 'Returns health status of CourseHub server instance',
  })
  @Throttable(10, 60)
  getHealth(): HealthCheckDto {
    return this.appService.getHealth();
  }

  @Get('metrics')
  @ApiOperation({
    summary: 'INTERNAL',
    description:
      'Prometheus metrics endpoint for internal monitoring. Only configured internal network requests are accepted.',
  })
  @ApiProduces('text/plain')
  @ApiOkResponse({
    description: 'Returns Prometheus metrics in text format',
  })
  @InternalOnly()
  @Throttable(5, 60)
  async getMetrics(@Res() res: Response): Promise<void> {
    res.setHeader('Content-Type', this.appService.getMetricsContentType());
    res.send(await this.appService.getMetrics());
  }
}
