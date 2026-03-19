import { HttpStatus, type ArgumentsHost } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { LoggerService } from '../logger/logger.service.js';
import { PrismaExceptionFilter } from './prisma-exception.filter.js';

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

describe('PrismaExceptionFilter', () => {
  it('maps known Prisma constraint errors to HTTP responses and logs P2xxx errors', () => {
    const scopedLogger = {
      error: vi.fn(),
    };
    const logger = {
      forContext: vi.fn().mockReturnValue(scopedLogger),
    } as unknown as LoggerService;
    const filter = new PrismaExceptionFilter(logger);
    const { host, response } = createHost({ method: 'POST', url: '/api/courses' });

    filter.catch({ code: 'P2002' } as never, host);

    expect(scopedLogger.error).toHaveBeenCalledWith('[PRISMA ERROR P2002] POST /api/courses');
    expect(response.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.CONFLICT,
        message: 'PRISMA: Unique constraint violated.',
        path: '/api/courses',
        method: 'POST',
      })
    );
  });

  it('falls back to a generic internal server error for unknown Prisma codes', () => {
    const scopedLogger = {
      error: vi.fn(),
    };
    const logger = {
      forContext: vi.fn().mockReturnValue(scopedLogger),
    } as unknown as LoggerService;
    const filter = new PrismaExceptionFilter(logger);
    const { host, response } = createHost({ method: 'GET', url: '/api/users' });

    filter.catch({ code: 'P9999' } as never, host);

    expect(scopedLogger.error).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'PRISMA: Generic database error.',
      })
    );
  });
});
