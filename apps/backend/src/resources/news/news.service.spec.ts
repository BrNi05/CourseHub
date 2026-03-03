/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NewsService } from './news.service.js';

type CacheMock = {
  get: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
  del: ReturnType<typeof vi.fn>;
};

type LoggerMock = {
  log: ReturnType<typeof vi.fn>;
};

describe('NewsService', () => {
  let cacheManager: CacheMock;
  let logger: LoggerMock;
  let service: NewsService;

  beforeEach(() => {
    cacheManager = {
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
    };

    logger = {
      log: vi.fn(),
    };

    service = new NewsService(cacheManager as any, logger as any);
  });

  it('starts with empty in-memory news', () => {
    expect(service.getAllNews()).toEqual([]);
  });

  it('onModuleInit loads news from cache if present', async () => {
    cacheManager.get.mockResolvedValueOnce(['a', 'b']);

    await service.onModuleInit();

    expect(cacheManager.get).toHaveBeenCalledWith('news_store');
    expect(service.getAllNews()).toEqual(['a', 'b']);
    expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('Loaded 2 news items'));
  });

  it('onModuleInit logs when no cache is present', async () => {
    cacheManager.get.mockResolvedValueOnce(undefined);

    await service.onModuleInit();

    expect(cacheManager.get).toHaveBeenCalledWith('news_store');
    expect(service.getAllNews()).toEqual([]);
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('No news items found in cache')
    );
  });

  it('createNews appends items, writes to cache, and returns updated array', async () => {
    cacheManager.set.mockResolvedValueOnce(undefined);

    const result = await service.createNews({ news: ['x', 'y'] } as any);

    expect(result).toEqual(['x', 'y']);
    expect(service.getAllNews()).toEqual(['x', 'y']);
    expect(cacheManager.set).toHaveBeenCalledWith('news_store', ['x', 'y'], 0);
  });

  it('deleteOldestNews removes first item and updates cache', async () => {
    cacheManager.set.mockResolvedValue(undefined);

    await service.createNews({ news: ['a', 'b', 'c'] } as any);
    await service.deleteOldestNews();

    expect(service.getAllNews()).toEqual(['b', 'c']);
    expect(cacheManager.set).toHaveBeenLastCalledWith('news_store', ['b', 'c'], 0);
  });

  it('deleteOldestNews does nothing if empty (no cache write)', async () => {
    await service.deleteOldestNews();

    expect(service.getAllNews()).toEqual([]);
    expect(cacheManager.set).not.toHaveBeenCalled();
  });

  it('deleteLatestNews removes last item and updates cache', async () => {
    cacheManager.set.mockResolvedValue(undefined);

    await service.createNews({ news: ['a', 'b', 'c'] } as any);
    await service.deleteLatestNews();

    expect(service.getAllNews()).toEqual(['a', 'b']);
    expect(cacheManager.set).toHaveBeenLastCalledWith('news_store', ['a', 'b'], 0);
  });

  it('deleteLatestNews does nothing if empty (no cache write)', async () => {
    await service.deleteLatestNews();

    expect(service.getAllNews()).toEqual([]);
    expect(cacheManager.set).not.toHaveBeenCalled();
  });

  it('deleteAllNews clears in-memory array and deletes cache key', async () => {
    cacheManager.del.mockResolvedValueOnce(undefined);

    await service.createNews({ news: ['a', 'b'] } as any);
    await service.deleteAllNews();

    expect(service.getAllNews()).toEqual([]);
    expect(cacheManager.del).toHaveBeenCalledWith('news_store');
  });

  it('loadNewsFromCache appends cached items to existing in-memory news', async () => {
    cacheManager.get.mockResolvedValueOnce(['c', 'd']);

    await service.createNews({ news: ['a', 'b'] } as any);
    await service.loadNewsFromCache();

    expect(service.getAllNews()).toEqual(['a', 'b', 'c', 'd']);
  });
});
