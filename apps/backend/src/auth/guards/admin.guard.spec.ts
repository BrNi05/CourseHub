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
    const contextualLogAdminOperation = vi.fn();
    const mockContextualLogger = {
      logAdminOperation: contextualLogAdminOperation,
    };

    const forContext = vi.fn().mockReturnValue(mockContextualLogger);
    const loggerService = {
      forContext,
    } as unknown as LoggerService;

    const guard = new AdminGuard(loggerService);

    const request = {
      method: 'GET',
      url: '/api/v1/admin/dashboard',
      user: { id: 'user-1', googleEmail: 'admin@example.com', isAdmin: true },
      headers: { 'cf-connecting-ip': '203.0.113.11' },
      socket: {},
    };

    const result = guard.canActivate(createHttpContext(request));

    expect(result).toBe(true);
    expect(forContext).toHaveBeenCalledWith('AdminGuard');

    expect(contextualLogAdminOperation).toHaveBeenCalledWith(
      'AdminGuard (canActivate)',
      true,
      '203.0.113.11',
      'Admin admin@example.com accessed an admin-protected route at GET /api/v1/admin/dashboard.'
    );
  });

  it('rejects non-admin users and logs the failed admin operation', () => {
    const contextualLogAdminOperation = vi.fn();
    const mockContextualLogger = {
      logAdminOperation: contextualLogAdminOperation,
    };

    const forContext = vi.fn().mockReturnValue(mockContextualLogger);
    const loggerService = {
      forContext,
    } as unknown as LoggerService;

    const guard = new AdminGuard(loggerService);

    const request = {
      method: 'DELETE',
      url: '/api/v1/users/123',
      user: { id: 'user-1', googleEmail: 'user@example.com', isAdmin: false },
      headers: { 'cf-connecting-ip': '203.0.113.10' },
      socket: {},
    };

    expect(() => guard.canActivate(createHttpContext(request))).toThrow(UnauthorizedException);
    expect(forContext).toHaveBeenCalledWith('AdminGuard');
    expect(contextualLogAdminOperation).toHaveBeenCalledWith(
      'AdminGuard (canActivate)',
      false,
      '203.0.113.10',
      'User user@example.com attempted admin access to DELETE /api/v1/users/123.'
    );
  });
});
