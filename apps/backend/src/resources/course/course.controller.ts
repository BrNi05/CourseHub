import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiCreatedResponse } from '@nestjs/swagger';

import { Course } from './entity/course.entity.js';
import { CourseService } from './course.service.js';
import { CreateCourseDto } from './dto/create-course.dto.js';
import { UpdateCourseDto } from './dto/update-course.dto.js';
import { CourseQueryDto } from './dto/query-course.dto.js';

import { Admin } from '../../decorators/auth/admin.decorator.js';
import { DatabaseOperation } from '../../decorators/responses/database-operation.decorator.js';
import { Throttable } from '../../common/throttling/throttler.decorator.js';
import { Serialize } from '../../decorators/serialize.decorator.js';
import { DeletedResponse } from '../../decorators/responses/deleted-response.decorator.js';

import {
  ONE_MINUTE_THROTTLE_TTL,
  COURSE_ADMIN_NORMAL_THROTTLE_LIMIT,
  COURSE_FIND_ONE_THROTTLE_LIMIT,
  COURSE_SEARCH_THROTTLE_LIMIT,
} from '../../common/throttling/throttling.constants.js';

@Controller('courses')
@Serialize(Course)
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Get('search')
  @ApiOperation({
    summary: 'PUBLIC',
    description: 'Search courses by university, name, and code',
  })
  @ApiOkResponse({ type: [Course], description: 'Success' })
  @DatabaseOperation()
  @Throttable(ONE_MINUTE_THROTTLE_TTL, COURSE_SEARCH_THROTTLE_LIMIT)
  async search(@Query() query: CourseQueryDto): Promise<Course[]> {
    return this.courseService.findByQuery(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'PUBLIC',
    description: 'Get a single course by ID',
  })
  @ApiOkResponse({ type: Course, description: 'Success' })
  @DatabaseOperation()
  @Throttable(ONE_MINUTE_THROTTLE_TTL, COURSE_FIND_ONE_THROTTLE_LIMIT)
  async findOne(@Param('id') id: string): Promise<Course> {
    return this.courseService.findById(id);
  }

  @Post()
  @Admin()
  @ApiOperation({
    summary: 'ADMIN',
    description: 'Creates a new course',
  })
  @ApiCreatedResponse({ type: Course, description: 'Created' })
  @DatabaseOperation()
  @Throttable(ONE_MINUTE_THROTTLE_TTL, COURSE_ADMIN_NORMAL_THROTTLE_LIMIT)
  async create(@Body() dto: CreateCourseDto): Promise<Course> {
    return this.courseService.create(dto);
  }

  @Put(':id')
  @Admin()
  @ApiOperation({
    summary: 'ADMIN',
    description: 'Updates an existing course',
  })
  @ApiOkResponse({ type: Course, description: 'Updated' })
  @DatabaseOperation()
  @Throttable(ONE_MINUTE_THROTTLE_TTL, COURSE_ADMIN_NORMAL_THROTTLE_LIMIT)
  async update(@Param('id') id: string, @Body() dto: UpdateCourseDto): Promise<Course> {
    return this.courseService.update(id, dto);
  }

  @Delete('cache')
  @Admin()
  @ApiOperation({
    summary: 'ADMIN',
    description: 'Reset all course related caches',
  })
  @DeletedResponse('Resetted')
  @DatabaseOperation()
  @Throttable(ONE_MINUTE_THROTTLE_TTL, COURSE_ADMIN_NORMAL_THROTTLE_LIMIT)
  deleteAll(): void {
    return this.courseService.clearSearchQueryCache();
  }

  @Delete(':id')
  @Admin()
  @ApiOperation({
    summary: 'ADMIN',
    description: 'Deletes an existing course',
  })
  @DeletedResponse()
  @DatabaseOperation()
  @Throttable(ONE_MINUTE_THROTTLE_TTL, COURSE_ADMIN_NORMAL_THROTTLE_LIMIT)
  async delete(@Param('id') id: string): Promise<void> {
    return this.courseService.remove(id);
  }
}
