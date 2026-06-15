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
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DISCORD_WEBHOOK_URL =
      'https://discord.com/api/webhooks/123456789/test-webhook-token';
    fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204, statusText: 'No Content' });
    vi.stubGlobal('fetch', fetchMock);
    logger = new LoggerService();
  });

  afterEach(async () => {
    await logger.onModuleDestroy();
    vi.unstubAllGlobals();
    delete process.env.DISCORD_WEBHOOK_URL;
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

  it('logs admin operations locally with sensitive details and sends anonymized Discord alerts', async () => {
    logger.logAdminOperation(
      'Admin guard access',
      false,
      '203.0.113.10',
      'User user@example.com attempted admin access.'
    );

    expect(logStreamMock.write).toHaveBeenCalledWith(
      expect.stringContaining(
        '[Application] Admin Operation [Admin guard access] - Status: FAILURE | IP: 203.0.113.10 | Details: User user@example.com attempted admin access.\n'
      )
    );
    expect(fetchMock).toHaveBeenCalledWith(
      'https://discord.com/api/webhooks/123456789/test-webhook-token',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.any(String),
      })
    );

    const request = fetchMock.mock.calls[0]?.[1] as { body: string };
    const payload = JSON.parse(request.body) as {
      embeds: Array<{
        color: number;
        fields: Array<{ name: string; value: string; inline: boolean }>;
      }>;
    };

    expect(payload.embeds[0]?.color).toBe(0xdc3545);
    expect(payload.embeds[0]?.fields).toEqual([
      { name: 'Action', value: 'Admin guard access', inline: true },
      { name: 'Status', value: 'Failed', inline: true },
      { name: 'Timestamp', value: expect.any(String), inline: false },
    ]);
    expect(request.body).not.toContain('203.0.113.10');
    expect(request.body).not.toContain('user@example.com');
  });

  it('logs Discord API failures without throwing from admin operation logging', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Server Error' });

    logger.logAdminOperation('Admin login', true, '203.0.113.10');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(logStreamMock.write).toHaveBeenCalledWith(
      expect.stringContaining('[LoggerService] Discord API returned status: 500 Server Error\n')
    );
  });

  it('logs an error without throwing if Discord API times out via AbortSignal', async () => {
    const timeoutError = new Error('The operation was aborted due to timeout');
    timeoutError.name = 'AbortError';
    fetchMock.mockRejectedValueOnce(timeoutError);

    logger.logAdminOperation('Admin action', true, '203.0.113.11');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(logStreamMock.write).toHaveBeenCalledWith(
      expect.stringContaining(
        '[LoggerService] Failed to execute Discord webhook: The operation was aborted due to timeout\n'
      )
    );
  });

  it('logs an error if Discord fetch throws a generic network error', async () => {
    fetchMock.mockRejectedValueOnce(new Error('fetch failed'));

    logger.logAdminOperation('Admin action', false, '203.0.113.12');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(logStreamMock.write).toHaveBeenCalledWith(
      expect.stringContaining('[LoggerService] Failed to execute Discord webhook: fetch failed\n')
    );
  });
});
