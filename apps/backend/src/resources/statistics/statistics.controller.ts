/* eslint-disable internal/no-serializer */
import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';

import { StatisticsService } from './statistics.service.js';
import { PingsStatisticsResponseDto } from './dto/pings-response.dto.js';
import { CoursesPinnedDto } from './dto/pins-response.dto.js';
import { UniversityUsersDto } from './dto/users-reponse.dto.js';
import { UniversityCoursesDto } from './dto/courses-reponse.dto.js';

import { Admin } from '../../decorators/auth/admin.decorator.js';
import { DatabaseOperation } from '../../decorators/responses/database-operation.decorator.js';
import { Throttable } from '../../common/throttling/throttler.decorator.js';

import {
  ONE_DAY_THROTTLE_TTL,
  THROTTLE_LIMIT_ONE,
} from '../../common/throttling/throttling.constants.js';

@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('pings')
  @ApiOperation({
    summary: 'ADMIN',
    description: 'Returns aggregated statistics about client pings (usage)',
  })
  @ApiOkResponse({ description: 'Success', type: PingsStatisticsResponseDto })
  @Admin()
  @DatabaseOperation()
  @Throttable(ONE_DAY_THROTTLE_TTL, THROTTLE_LIMIT_ONE)
  async pings(): Promise<PingsStatisticsResponseDto> {
    return await this.statisticsService.getPingStatistics();
  }

  @Get('pins')
  @ApiOperation({
    summary: 'ADMIN',
    description: 'Returns aggregated statistics about course pins (popularity of courses)',
  })
  @ApiOkResponse({ description: 'Success', type: CoursesPinnedDto, isArray: true })
  @Admin()
  @DatabaseOperation()
  @Throttable(ONE_DAY_THROTTLE_TTL, THROTTLE_LIMIT_ONE)
  async pins(): Promise<CoursesPinnedDto[]> {
    return await this.statisticsService.getPinStatistics();
  }

  @Get('users')
  @ApiOperation({
    summary: 'ADMIN',
    description: 'Returns aggregated statistics about users university and faculty affiliation',
  })
  @ApiOkResponse({ description: 'Success', type: UniversityUsersDto, isArray: true })
  @Admin()
  @DatabaseOperation()
  @Throttable(ONE_DAY_THROTTLE_TTL, THROTTLE_LIMIT_ONE)
  async users(): Promise<UniversityUsersDto[]> {
    return await this.statisticsService.getUserStatistics();
  }

  @Get('courses')
  @ApiOperation({
    summary: 'ADMIN',
    description: 'Returns aggregated statistics about courses',
  })
  @ApiOkResponse({
    description: 'Success',
    type: UniversityCoursesDto,
    isArray: true,
  })
  @Admin()
  @DatabaseOperation()
  @Throttable(ONE_DAY_THROTTLE_TTL, THROTTLE_LIMIT_ONE)
  async courses(): Promise<UniversityCoursesDto[]> {
    return await this.statisticsService.getCourseStatistics();
  }
}
