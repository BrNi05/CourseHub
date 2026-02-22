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
import { AuthUserId } from '../../decorators/auth/user-id.dto.js';

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
  @Throttable(60, 3)
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
  @Throttable(60, 3)
  async suggest(
    @AuthUserId() userId: string,
    @Body() createSuggestionDto: CreateSuggestionDto
  ): Promise<SuggestedCourse> {
    return await this.suggestionService.suggest(userId, createSuggestionDto);
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
  @Throttable(60, 3)
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
  @Throttable(60, 3)
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
  @Throttable(60, 3)
  async delete(@Param('id') id: string): Promise<void> {
    await this.suggestionService.delete(id);
  }
}
