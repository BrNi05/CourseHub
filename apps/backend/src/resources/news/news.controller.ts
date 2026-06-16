/* eslint-disable internal/no-serializer */
import { Controller, Get, Post, Delete, Body, Header } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';

import { NewsService } from './news.service.js';
import { CreateNewsDto } from './dto/create.dto.js';

import { Admin } from '../../decorators/auth/admin.decorator.js';
import { Throttable } from '../../common/throttling/throttler.decorator.js';
import { DeletedResponse } from '../../decorators/responses/deleted-response.decorator.js';

import {
  ONE_MINUTE_THROTTLE_TTL,
  NEWS_GET_THROTTLE_LIMIT,
  NEWS_ADMIN_NORMAL_THROTTLE_LIMIT,
} from '../../common/throttling/throttling.constants.js';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  @ApiOperation({
    summary: 'PUBLIC',
    description: 'Returns all news items (cached for 1 hour)',
  })
  @ApiOkResponse({ description: 'Success', type: String, isArray: true })
  @Header('Cache-Control', 'public, max-age=3600')
  @Throttable(ONE_MINUTE_THROTTLE_TTL, NEWS_GET_THROTTLE_LIMIT)
  async news(): Promise<string[]> {
    return await this.newsService.getAllNews();
  }

  @Post()
  @ApiOperation({
    summary: 'ADMIN',
    description: 'Creates a new news item',
  })
  @ApiOkResponse({ description: 'Success', type: String, isArray: true })
  @Admin()
  @Throttable(ONE_MINUTE_THROTTLE_TTL, NEWS_ADMIN_NORMAL_THROTTLE_LIMIT)
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
  @Throttable(ONE_MINUTE_THROTTLE_TTL, NEWS_ADMIN_NORMAL_THROTTLE_LIMIT)
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
  @Throttable(ONE_MINUTE_THROTTLE_TTL, NEWS_ADMIN_NORMAL_THROTTLE_LIMIT)
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
  @Throttable(ONE_MINUTE_THROTTLE_TTL, NEWS_ADMIN_NORMAL_THROTTLE_LIMIT)
  async deleteAllNews(): Promise<void> {
    return await this.newsService.deleteAllNews();
  }
}
