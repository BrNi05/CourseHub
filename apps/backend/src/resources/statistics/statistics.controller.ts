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
  @Throttable(60, 1)
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
  @Throttable(60, 1)
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
  @Throttable(60, 1)
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
  @Throttable(60, 1)
  async courses(): Promise<UniversityCoursesDto[]> {
    return await this.statisticsService.getCourseStatistics();
  }
}
