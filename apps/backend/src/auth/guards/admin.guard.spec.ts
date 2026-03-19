import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { LoggerService } from '../../logger/logger.service.js';
import { AdminGuard } from './admin.guard.js';

function createHttpContext(request: object): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
}

describe('AdminGuard', () => {
  it('allows authenticated admins through', () => {
    const scopedLogger = {
      warn: vi.fn(),
    };
    const logger = {
      forContext: vi.fn().mockReturnValue(scopedLogger),
    } as unknown as LoggerService;
    const guard = new AdminGuard(logger);
    const request = {
      user: { id: 'user-1', googleEmail: 'admin@example.com', isAdmin: true },
      headers: {},
      socket: {},
    };

    const result = guard.canActivate(createHttpContext(request));

    expect(result).toBe(true);
    expect(scopedLogger.warn).not.toHaveBeenCalled();
  });

  it('rejects non-admin users and logs the access attempt', () => {
    const scopedLogger = {
      warn: vi.fn(),
    };
    const logger = {
      forContext: vi.fn().mockReturnValue(scopedLogger),
    } as unknown as LoggerService;
    const guard = new AdminGuard(logger);
    const request = {
      user: { id: 'user-1', googleEmail: 'user@example.com', isAdmin: false },
      headers: { 'cf-connecting-ip': '203.0.113.10' },
      socket: {},
    };

    expect(() => guard.canActivate(createHttpContext(request))).toThrow(UnauthorizedException);
    expect(scopedLogger.warn).toHaveBeenCalledWith(
      'Unauthorized admin access attempt. User: user@example.com, IP: 203.0.113.10'
    );
  });
});
