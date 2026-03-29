import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { LoggerService } from '../../logger/logger.service.js';
import { JwtAuthGuard } from './jwt.guard.js';

function createHttpContext(request: object): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  it('returns the authenticated user when passport validation succeeds', () => {
    const scopedLogger = {
      warn: vi.fn(),
    };
    const logger = {
      forContext: vi.fn().mockReturnValue(scopedLogger),
    } as unknown as LoggerService;
    const guard = new JwtAuthGuard(logger);
    const user = { sub: 'user-1' };

    const result = guard.handleRequest(null, user, null, createHttpContext({ headers: {} }));

    expect(result).toBe(user);
    expect(scopedLogger.warn).not.toHaveBeenCalled();
  });

  it('throws an UnauthorizedException and logs when the user is missing', () => {
    const scopedLogger = {
      warn: vi.fn(),
    };
    const logger = {
      forContext: vi.fn().mockReturnValue(scopedLogger),
    } as unknown as LoggerService;
    const guard = new JwtAuthGuard(logger);
    const context = createHttpContext({
      headers: { 'cf-connecting-ip': '203.0.113.20' },
      socket: {},
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    expect(() => guard.handleRequest(null, null, null, context)).toThrow(UnauthorizedException);
    expect(scopedLogger.warn).toHaveBeenCalledWith(
      'Auth cookie validation failed. IP: 203.0.113.20'
    );
  });
});
