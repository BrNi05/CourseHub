import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createWriteStream } from 'node:fs';
import { LoggerService } from './logger.service.js';

const { logStreamMock } = vi.hoisted(() => ({
  logStreamMock: {
    write: vi.fn(),
    end: vi.fn(),
    on: vi.fn(),
    destroyed: false,
  },
}));

vi.mock('node:fs', () => ({
  createWriteStream: vi.fn(() => logStreamMock),
}));

describe('LoggerService', () => {
  let logger: LoggerService;

  beforeEach(() => {
    vi.clearAllMocks();
    logger = new LoggerService();
  });

  afterEach(() => {
    logger.onModuleDestroy();
  });

  it('creates contextual loggers that write with the provided context', () => {
    const appLogger = logger.forContext('AppService');

    appLogger.log('hello');

    expect(logStreamMock.write).toHaveBeenCalledWith(
      expect.stringContaining('[AppService] hello\n')
    );
  });

  it('shares one file stream across contextual loggers', () => {
    logger.forContext('FirstService');
    logger.forContext('SecondService');

    expect(createWriteStream).toHaveBeenCalledTimes(0);
  });

  it('closes the shared stream on destroy', () => {
    logger.onModuleDestroy();

    expect(logStreamMock.end).toHaveBeenCalledTimes(1);
  });
});
