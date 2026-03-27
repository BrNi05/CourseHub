/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NewsService } from './news.service.js';

type CacheMock = {
  get: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
  del: ReturnType<typeof vi.fn>;
};

type LoggerMock = {
  forContext: ReturnType<typeof vi.fn>;
  scopedLogger?: {
    log: ReturnType<typeof vi.fn>;
  };
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

    const scopedLogger = {
      log: vi.fn(),
    };

    logger = {
      forContext: vi.fn().mockReturnValue(scopedLogger),
      scopedLogger,
    } as any;

    service = new NewsService(cacheManager as any, logger as any);
  });

  it('returns an empty array when the cache is empty', async () => {
    cacheManager.get.mockResolvedValueOnce(undefined);

    await expect(service.getAllNews()).resolves.toEqual([]);
  });

  it('onModuleInit logs cached news count if present', async () => {
    cacheManager.get.mockResolvedValueOnce(['a', 'b']);

    await service.onModuleInit();

    expect(cacheManager.get).toHaveBeenCalledWith('news_store');
    expect(logger.scopedLogger!.log).toHaveBeenCalledWith(
      expect.stringContaining('Loaded 2 news items')
    );
  });

  it('onModuleInit logs when no cache is present', async () => {
    cacheManager.get.mockResolvedValueOnce(undefined);

    await service.onModuleInit();

    expect(cacheManager.get).toHaveBeenCalledWith('news_store');
    expect(logger.scopedLogger!.log).toHaveBeenCalledWith(
      expect.stringContaining('No news items found on startup')
    );
  });

  it('createNews appends items to cached news and returns the updated array', async () => {
    cacheManager.get.mockResolvedValueOnce(['a']);
    cacheManager.set.mockResolvedValueOnce(undefined);

    const result = await service.createNews({ news: ['x', 'y'] } as any);

    expect(result).toEqual(['a', 'x', 'y']);
    expect(cacheManager.set).toHaveBeenCalledWith('news_store', ['a', 'x', 'y'], 0);
  });

  it('deleteOldestNews removes first item from cached news and updates cache', async () => {
    cacheManager.get.mockResolvedValueOnce(['a', 'b', 'c']);
    cacheManager.set.mockResolvedValue(undefined);

    await service.deleteOldestNews();

    expect(cacheManager.set).toHaveBeenLastCalledWith('news_store', ['b', 'c'], 0);
  });

  it('deleteOldestNews does nothing if empty (no cache write)', async () => {
    cacheManager.get.mockResolvedValueOnce([]);

    await service.deleteOldestNews();

    expect(cacheManager.set).not.toHaveBeenCalled();
  });

  it('deleteLatestNews removes last item from cached news and updates cache', async () => {
    cacheManager.get.mockResolvedValueOnce(['a', 'b', 'c']);
    cacheManager.set.mockResolvedValue(undefined);

    await service.deleteLatestNews();

    expect(cacheManager.set).toHaveBeenLastCalledWith('news_store', ['a', 'b'], 0);
  });

  it('deleteLatestNews does nothing if empty (no cache write)', async () => {
    cacheManager.get.mockResolvedValueOnce([]);

    await service.deleteLatestNews();

    expect(cacheManager.set).not.toHaveBeenCalled();
  });

  it('deleteAllNews deletes the cache key', async () => {
    cacheManager.del.mockResolvedValueOnce(undefined);

    await service.deleteAllNews();

    expect(cacheManager.del).toHaveBeenCalledWith('news_store');
  });
});
