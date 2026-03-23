/* eslint-disable @typescript-eslint/require-await */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createWriteStream } from 'node:fs';
import { LoggerService } from './logger.service.js';

const { logStreamMock } = vi.hoisted(() => ({
  logStreamMock: {
    write: vi.fn(),
    end: vi.fn(),
    on: vi.fn(),
    once: vi.fn((event: string, handler: () => void) => {
      if (event === 'close') handler();
    }),
    destroyed: false,
    writableEnded: false,
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

  afterEach(async () => {
    await logger.onModuleDestroy();
  });

  it('creates contextual loggers that write with the provided context', () => {
    const appLogger = logger.forContext('AppService');

    appLogger.log('hello');

    expect(logStreamMock.write).toHaveBeenCalledWith(
      expect.stringContaining('[AppService] hello\n')
    );
  });

  it('shares one file stream across contextual loggers', () => {
    const streamCreationsBefore = vi.mocked(createWriteStream).mock.calls.length;

    logger.forContext('FirstService');
    logger.forContext('SecondService');

    expect(createWriteStream).toHaveBeenCalledTimes(streamCreationsBefore);
  });

  it('closes the shared stream on destroy', async () => {
    await logger.onModuleDestroy();

    expect(logStreamMock.end).toHaveBeenCalledTimes(1);
  });

  it('releases and recreates the shared stream for maintenance operations', async () => {
    const streamCreationsBefore = vi.mocked(createWriteStream).mock.calls.length;

    await logger.withReleasedFileStream(async () => undefined);

    expect(logStreamMock.end).toHaveBeenCalledTimes(1);
    expect(createWriteStream).toHaveBeenCalledTimes(streamCreationsBefore + 1);
  });

  it('queues log writes during maintenance and flushes them afterwards', async () => {
    await logger.withReleasedFileStream(async () => {
      logger.log('during maintenance');
    });

    expect(logStreamMock.write).toHaveBeenCalledWith(
      expect.stringContaining('[Application] during maintenance\n')
    );
  });
});
