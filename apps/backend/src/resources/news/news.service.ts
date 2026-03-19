import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { type Cache } from 'cache-manager';

import { ContextualLogger, LoggerService } from '../../logger/logger.service.js';

import { CreateNewsDto } from './dto/create.dto.js';

@Injectable()
export class NewsService implements OnModuleInit {
  private readonly newsStoreKey = 'news_store';
  private readonly logger: ContextualLogger;

  // In-memory news array
  private readonly news: string[] = [];

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    logger: LoggerService
  ) {
    this.logger = logger.forContext(NewsService.name);
  }

  // Load news from cache on startup
  async onModuleInit(): Promise<void> {
    await this.loadNewsFromCache();
  }

  getAllNews(): string[] {
    return this.news;
  }

  async createNews(createNewsDto: CreateNewsDto): Promise<string[]> {
    this.news.push(...createNewsDto.news);
    await this.cacheManager.set(this.newsStoreKey, this.news, 0);
    return this.news;
  }

  async deleteOldestNews(): Promise<void> {
    if (this.news.length === 0) return;
    this.news.shift();
    await this.cacheManager.set(this.newsStoreKey, this.news, 0);
  }

  async deleteLatestNews(): Promise<void> {
    if (this.news.length === 0) return;
    this.news.pop();
    await this.cacheManager.set(this.newsStoreKey, this.news, 0);
  }

  async deleteAllNews(): Promise<void> {
    this.news.splice(0);
    await this.cacheManager.del(this.newsStoreKey);
  }

  async loadNewsFromCache(): Promise<void> {
    const cached = await this.cacheManager.get<string[]>(this.newsStoreKey);

    if (cached) {
      this.news.push(...cached);
      this.logger.log(`Loaded ${cached.length} news items from cache on startup.`);
    } else {
      this.logger.log('No news items found in cache on startup.');
    }
  }
}
