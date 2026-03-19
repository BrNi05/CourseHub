import { HttpException, HttpStatus, type ArgumentsHost } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { LoggerService } from '../logger/logger.service.js';
import { GlobalExceptionsFilter } from './exception.filter.js';

function createHost(request: { method: string; url: string }) {
  const response = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  };

  const host = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as ArgumentsHost;

  return { host, response };
}

describe('GlobalExceptionsFilter', () => {
  it('logs internal server errors and returns a normalized error response', () => {
    const scopedLogger = {
      error: vi.fn(),
    };
    const logger = {
      forContext: vi.fn().mockReturnValue(scopedLogger),
    } as unknown as LoggerService;
    const filter = new GlobalExceptionsFilter(logger);
    const exception = new HttpException('Boom', HttpStatus.INTERNAL_SERVER_ERROR);
    const { host, response } = createHost({ method: 'GET', url: '/api/test' });

    filter.catch(exception, host);

    expect(scopedLogger.error).toHaveBeenCalledWith('GET /api/test - Boom', exception.stack);
    expect(response.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Boom',
        path: '/api/test',
        method: 'GET',
      })
    );
  });

  it('replaces throttling messages with a safe generic response', () => {
    const scopedLogger = {
      error: vi.fn(),
    };
    const logger = {
      forContext: vi.fn().mockReturnValue(scopedLogger),
    } as unknown as LoggerService;
    const filter = new GlobalExceptionsFilter(logger);
    const { host, response } = createHost({ method: 'POST', url: '/api/ping' });

    filter.catch(new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS), host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.TOO_MANY_REQUESTS);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: 'Túl sok kérés. Kérlek, próbáld újra később.',
      })
    );
  });

  it('hides filesystem and asset paths from error messages', () => {
    const scopedLogger = {
      error: vi.fn(),
    };
    const logger = {
      forContext: vi.fn().mockReturnValue(scopedLogger),
    } as unknown as LoggerService;
    const filter = new GlobalExceptionsFilter(logger);
    const { host, response } = createHost({ method: 'GET', url: '/assets/app.js' });

    filter.catch(
      new HttpException('ENOENT: no such file or directory', HttpStatus.NOT_FOUND),
      host
    );

    expect(response.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'A kért erőforrás nem található!',
      })
    );
  });
});
