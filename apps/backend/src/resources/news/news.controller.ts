/* eslint-disable internal/no-serializer */
import { Controller, Get, Post, Delete, Body } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';

import { NewsService } from './news.service.js';
import { CreateNewsDto } from './dto/create.dto.js';

import { Admin } from '../../decorators/auth/admin.decorator.js';
import { Throttable } from '../../common/throttling/throttler.decorator.js';
import { DeletedResponse } from '../../decorators/responses/deleted-response.decorator.js';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  @ApiOperation({
    summary: 'PUBLIC',
    description: 'Returns all news items',
  })
  @ApiOkResponse({ description: 'Success', type: String, isArray: true })
  @Admin()
  @Throttable(60, 60000)
  news(): string[] {
    return this.newsService.getAllNews();
  }

  @Post()
  @ApiOperation({
    summary: 'ADMIN',
    description: 'Creates a new news item',
  })
  @ApiOkResponse({ description: 'Success', type: String, isArray: true })
  @Admin()
  @Throttable(60, 1)
  async createNews(@Body() createNewsDto: CreateNewsDto): Promise<string[]> {
    return await this.newsService.createNews(createNewsDto);
  }

  @Delete('oldest')
  @ApiOperation({
    summary: 'ADMIN',
    description: 'Deletes the oldest news item',
  })
  @DeletedResponse('Oldest item deleted')
  @Admin()
  @Throttable(60, 1)
  async deleteOldestNews(): Promise<void> {
    return await this.newsService.deleteOldestNews();
  }

  @Delete('latest')
  @ApiOperation({
    summary: 'ADMIN',
    description: 'Deletes the latest news item',
  })
  @DeletedResponse('Latest item deleted')
  @Admin()
  @Throttable(60, 1)
  async deleteNewestNews(): Promise<void> {
    return await this.newsService.deleteLatestNews();
  }

  @Delete()
  @ApiOperation({
    summary: 'ADMIN',
    description: 'Deletes all news items',
  })
  @DeletedResponse('All news items deleted')
  @Admin()
  @Throttable(60, 1)
  async deleteAllNews(): Promise<void> {
    return await this.newsService.deleteAllNews();
  }
}
