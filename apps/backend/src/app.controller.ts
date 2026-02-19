import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';

import { AppService } from './app.service.js';

import { HealthCheckDto } from './resources/healthcheck/health-check.response.dto.js';

import { Throttable } from './common/throttling/throttler.decorator.js';
import { Serialize } from './decorators/serialize.decorator.js';

@Controller()
@Serialize(HealthCheckDto)
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
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
}
