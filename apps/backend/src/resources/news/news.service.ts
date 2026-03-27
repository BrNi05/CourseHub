import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { type Cache } from 'cache-manager';

import { ContextualLogger, LoggerService } from '../../logger/logger.service.js';

import { CreateNewsDto } from './dto/create.dto.js';

@Injectable()
export class NewsService implements OnModuleInit {
  private readonly newsStoreKey = 'news_store';
  private readonly logger: ContextualLogger;

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    logger: LoggerService
  ) {
    this.logger = logger.forContext(NewsService.name);
  }

  // Load news from cache on startup
  async onModuleInit(): Promise<void> {
    const cached = await this.readNewsFromCache();

    if (cached.length > 0) {
      this.logger.log(`Loaded ${cached.length} news items on startup.`);
    } else {
      this.logger.log('No news items found on startup.');
    }
  }

  async getAllNews(): Promise<string[]> {
    return await this.readNewsFromCache();
  }

  async createNews(createNewsDto: CreateNewsDto): Promise<string[]> {
    const news = await this.readNewsFromCache();
    const updatedNews = [...news, ...createNewsDto.news];

    await this.cacheManager.set(this.newsStoreKey, updatedNews, 0);
    return updatedNews;
  }

  async deleteOldestNews(): Promise<void> {
    const news = await this.readNewsFromCache();
    if (news.length === 0) return;

    const updatedNews = news.slice(1);
    await this.cacheManager.set(this.newsStoreKey, updatedNews, 0);
  }

  async deleteLatestNews(): Promise<void> {
    const news = await this.readNewsFromCache();
    if (news.length === 0) return;

    const updatedNews = news.slice(0, -1);
    await this.cacheManager.set(this.newsStoreKey, updatedNews, 0);
  }

  async deleteAllNews(): Promise<void> {
    await this.cacheManager.del(this.newsStoreKey);
  }

  // Helper method to read news from cache
  private async readNewsFromCache(): Promise<string[]> {
    return [...((await this.cacheManager.get<string[]>(this.newsStoreKey)) ?? [])];
  }
}
