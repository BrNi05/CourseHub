import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiCreatedResponse } from '@nestjs/swagger';

import { Course } from '../course/entity/course.entity.js';
import { SuggestedCourse } from './entity/suggestion.entity.js';
import { SuggestionService } from './suggestion.service.js';
import { CreateSuggestionDto } from './dto/create-suggestion.dto.js';
import { UpdateSuggestionDto } from './dto/update-suggestion.dto.js';

import { Admin } from '../../decorators/auth/admin.decorator.js';
import { DatabaseOperation } from '../../decorators/responses/database-operation.decorator.js';
import { Throttable } from '../../common/throttling/throttler.decorator.js';
import { Serialize } from '../../decorators/serialize.decorator.js';
import { DeletedResponse } from '../../decorators/responses/deleted-response.decorator.js';
import { RequiresAuth } from '../../decorators/auth/auth.decorator.js';
import { AuthUserId } from '../../decorators/auth/user-id.decorator.js';

import {
  ONE_MINUTE_THROTTLE_TTL,
  OPERATION_SUGGESTION_THROTTLE_LIMIT,
  POST_SUGGESTION_THROTTLE_LIMIT,
  THROTTLE_LIMIT_ONE,
} from '../../common/throttling/throttling.constants.js';

@Controller('suggestions')
@Serialize(SuggestedCourse)
export class SuggestionController {
  constructor(private readonly suggestionService: SuggestionService) {}

  @Get()
  @Admin()
  @ApiOperation({
    summary: 'ADMIN',
    description: 'Get all course suggestions for admin review',
  })
  @ApiOkResponse({ type: [SuggestedCourse], description: 'Success' })
  @DatabaseOperation()
  @Throttable(ONE_MINUTE_THROTTLE_TTL, OPERATION_SUGGESTION_THROTTLE_LIMIT)
  async findAll(): Promise<SuggestedCourse[]> {
    return await this.suggestionService.findAll();
  }

  @Post()
  @RequiresAuth()
  @ApiOperation({
    summary: 'USER AUTH',
    description: 'Suggests a new course',
  })
  @ApiCreatedResponse({ type: SuggestedCourse, description: 'Created' })
  @DatabaseOperation()
  @Throttable(ONE_MINUTE_THROTTLE_TTL, POST_SUGGESTION_THROTTLE_LIMIT)
  async suggest(
    @AuthUserId() userId: string,
    @Body() createSuggestionDto: CreateSuggestionDto
  ): Promise<SuggestedCourse> {
    return await this.suggestionService.suggest(userId, createSuggestionDto);
  }

  @Post('accept-all')
  @Admin()
  @ApiOperation({
    summary: 'ADMIN',
    description: 'Accepts all course suggestions in bulk',
  })
  @ApiOkResponse({ description: 'All accepted' })
  @DatabaseOperation()
  @Throttable(ONE_MINUTE_THROTTLE_TTL, THROTTLE_LIMIT_ONE)
  async acceptAll(): Promise<void> {
    await this.suggestionService.acceptAll();
  }

  @Post(':id') // :id is suggestion ID
  @Admin()
  @ApiOperation({
    summary: 'ADMIN',
    description:
      'Accepts a course suggestion, creating a new course (uni and facility as well if needed) and deleting the suggestion',
  })
  @ApiOkResponse({ type: Course, description: 'Accepted' })
  @DatabaseOperation()
  @Throttable(ONE_MINUTE_THROTTLE_TTL, OPERATION_SUGGESTION_THROTTLE_LIMIT)
  async accept(@Param('id') id: string): Promise<Course> {
    return await this.suggestionService.accept(id);
  }

  @Put(':id')
  @Admin()
  @ApiOperation({
    summary: 'ADMIN',
    description: 'Updates a course suggestion',
  })
  @ApiOkResponse({ type: SuggestedCourse, description: 'Updated' })
  @DatabaseOperation()
  @Throttable(ONE_MINUTE_THROTTLE_TTL, OPERATION_SUGGESTION_THROTTLE_LIMIT)
  async update(
    @Param('id') id: string,
    @Body() updateSuggestionDto: UpdateSuggestionDto
  ): Promise<SuggestedCourse> {
    return await this.suggestionService.update(id, updateSuggestionDto);
  }

  @Delete(':id')
  @Admin()
  @ApiOperation({
    summary: 'ADMIN',
    description: 'Deletes a course suggestion',
  })
  @DeletedResponse()
  @DatabaseOperation()
  @Throttable(ONE_MINUTE_THROTTLE_TTL, OPERATION_SUGGESTION_THROTTLE_LIMIT)
  async delete(@Param('id') id: string): Promise<void> {
    await this.suggestionService.delete(id);
  }
}
