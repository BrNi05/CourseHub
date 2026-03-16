/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-explicit-any */
import 'reflect-metadata';

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HEADERS_METADATA } from '@nestjs/common/constants.js';

import { NewsController } from './news.controller.js';
import type { NewsService } from './news.service.js';

describe('NewsController', () => {
  let controller: NewsController;

  let newsService: {
    getAllNews: ReturnType<typeof vi.fn>;
    createNews: ReturnType<typeof vi.fn>;
    deleteOldestNews: ReturnType<typeof vi.fn>;
    deleteLatestNews: ReturnType<typeof vi.fn>;
    deleteAllNews: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    newsService = {
      getAllNews: vi.fn(),
      createNews: vi.fn(),
      deleteOldestNews: vi.fn(),
      deleteLatestNews: vi.fn(),
      deleteAllNews: vi.fn(),
    };

    controller = new NewsController(newsService as unknown as NewsService);
  });

  it('news() returns all news items from service', () => {
    newsService.getAllNews.mockReturnValueOnce(['a', 'b']);

    const result = controller.news();

    expect(result).toEqual(['a', 'b']);
    expect(newsService.getAllNews).toHaveBeenCalledTimes(1);
  });

  it('news() sets a 1 hour minute Cache-Control header', () => {
    const headers = Reflect.getMetadata(HEADERS_METADATA, NewsController.prototype.news) as Array<{
      name: string;
      value: string;
    }>;

    expect(headers).toContainEqual({
      name: 'Cache-Control',
      value: 'public, max-age=3600',
    });
  });

  it('createNews() forwards DTO to service and returns updated list', async () => {
    newsService.createNews.mockResolvedValueOnce(['x', 'y']);

    const dto = { news: ['x', 'y'] };
    const result = await controller.createNews(dto as any);

    expect(result).toEqual(['x', 'y']);
    expect(newsService.createNews).toHaveBeenCalledTimes(1);
    expect(newsService.createNews).toHaveBeenCalledWith(dto);
  });

  it('deleteOldestNews() calls service.deleteOldestNews()', async () => {
    newsService.deleteOldestNews.mockResolvedValueOnce(undefined);

    const result = await controller.deleteOldestNews();

    expect(result).toBeUndefined();
    expect(newsService.deleteOldestNews).toHaveBeenCalledTimes(1);
  });

  it('deleteNewestNews() calls service.deleteLatestNews()', async () => {
    newsService.deleteLatestNews.mockResolvedValueOnce(undefined);

    const result = await controller.deleteNewestNews();

    expect(result).toBeUndefined();
    expect(newsService.deleteLatestNews).toHaveBeenCalledTimes(1);
  });

  it('deleteAllNews() calls service.deleteAllNews()', async () => {
    newsService.deleteAllNews.mockResolvedValueOnce(undefined);

    const result = await controller.deleteAllNews();

    expect(result).toBeUndefined();
    expect(newsService.deleteAllNews).toHaveBeenCalledTimes(1);
  });
});
