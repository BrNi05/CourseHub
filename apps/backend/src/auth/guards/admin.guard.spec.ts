import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { LoggerService } from '../../logger/logger.service.js';
import type { PrismaService } from '../../prisma/prisma.service.js';
import type { AuthService } from '../auth.service.js';
import { AdminGuard } from './admin.guard.js';

function createHttpContext(request: object): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
}

describe('AdminGuard', () => {
  it('allows authenticated admins through when DB confirms admin status and MFA is valid', async () => {
    const contextualLogAdminOperation = vi.fn();
    const mockContextualLogger = { logAdminOperation: contextualLogAdminOperation };
    const forContext = vi.fn().mockReturnValue(mockContextualLogger);
    const loggerService = { forContext } as unknown as LoggerService;

    const findUniqueOrThrow = vi.fn().mockResolvedValue({
      isAdmin: true,
      googleEmail: 'admin@example.com',
    });
    const prismaService = { user: { findUniqueOrThrow } } as unknown as PrismaService;

    const verifyAdminMfaToken = vi.fn().mockResolvedValue(true);
    const authService = { verifyAdminMfaToken } as unknown as AuthService;

    const guard = new AdminGuard(loggerService, prismaService, authService);

    const request = {
      method: 'GET',
      url: '/api/v1/admin/dashboard',
      user: { id: 'user-1', googleEmail: 'admin@example.com', isAdmin: true },
      headers: { 'cf-connecting-ip': '203.0.113.11', 'x-admin-api-mfa': 'valid-mfa' },
      socket: {},
    };

    const result = await guard.canActivate(createHttpContext(request));

    expect(result).toBe(true);
    expect(findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: { isAdmin: true, googleEmail: true },
    });
    expect(verifyAdminMfaToken).toHaveBeenCalledWith('user-1', 'valid-mfa');
    expect(forContext).toHaveBeenCalledWith('AdminGuard');
    expect(contextualLogAdminOperation).toHaveBeenCalledWith(
      'AdminGuard (canActivate)',
      true,
      '203.0.113.11',
      'Admin admin@example.com accessed an admin-protected route at GET /api/v1/admin/dashboard.'
    );
  });

  it('rejects non-admin users instantly without checking the database', async () => {
    const contextualLogAdminOperation = vi.fn();
    const mockContextualLogger = { logAdminOperation: contextualLogAdminOperation };
    const forContext = vi.fn().mockReturnValue(mockContextualLogger);
    const loggerService = { forContext } as unknown as LoggerService;

    const findUniqueOrThrow = vi.fn();
    const prismaService = { user: { findUniqueOrThrow } } as unknown as PrismaService;

    const verifyAdminMfaToken = vi.fn();
    const authService = { verifyAdminMfaToken } as unknown as AuthService;

    const guard = new AdminGuard(loggerService, prismaService, authService);

    const request = {
      method: 'DELETE',
      url: '/api/v1/users/123',
      user: { id: 'user-2', googleEmail: 'user@example.com', isAdmin: false },
      headers: { 'cf-connecting-ip': '203.0.113.10' },
      socket: {},
    };

    await expect(guard.canActivate(createHttpContext(request))).rejects.toThrow(
      UnauthorizedException
    );

    expect(findUniqueOrThrow).not.toHaveBeenCalled();
    expect(verifyAdminMfaToken).not.toHaveBeenCalled();
    expect(forContext).toHaveBeenCalledWith('AdminGuard');
    expect(contextualLogAdminOperation).toHaveBeenCalledWith(
      'AdminGuard (canActivate)',
      false,
      '203.0.113.10',
      'User user@example.com attempted admin access to DELETE /api/v1/users/123.'
    );
  });

  it('rejects requests if JWT claims admin but DB says user is NOT an admin (Revoked/Spoofed)', async () => {
    const contextualLogAdminOperation = vi.fn();
    const mockContextualLogger = { logAdminOperation: contextualLogAdminOperation };
    const forContext = vi.fn().mockReturnValue(mockContextualLogger);
    const loggerService = { forContext } as unknown as LoggerService;

    const findUniqueOrThrow = vi.fn().mockResolvedValue({
      isAdmin: false,
      googleEmail: 'hacker@example.com',
    });
    const prismaService = { user: { findUniqueOrThrow } } as unknown as PrismaService;

    const verifyAdminMfaToken = vi.fn();
    const authService = { verifyAdminMfaToken } as unknown as AuthService;

    const guard = new AdminGuard(loggerService, prismaService, authService);

    const request = {
      method: 'POST',
      url: '/api/v1/admin/settings',
      user: { id: 'user-3', googleEmail: 'hacker@example.com', isAdmin: true },
      headers: { 'cf-connecting-ip': '203.0.113.12' },
      socket: {},
    };

    await expect(guard.canActivate(createHttpContext(request))).rejects.toThrow(
      UnauthorizedException
    );

    expect(verifyAdminMfaToken).not.toHaveBeenCalled();
    expect(contextualLogAdminOperation).toHaveBeenCalledWith(
      'AdminGuard (canActivate)',
      false,
      '203.0.113.12',
      'User hacker@example.com attempted admin access to POST /api/v1/admin/settings, but DB verification failed.'
    );
  });

  it('rejects requests if user is deleted from the DB but still holds an active JWT', async () => {
    const contextualLogAdminOperation = vi.fn();
    const mockContextualLogger = { logAdminOperation: contextualLogAdminOperation };
    const forContext = vi.fn().mockReturnValue(mockContextualLogger);
    const loggerService = { forContext } as unknown as LoggerService;

    const findUniqueOrThrow = vi.fn().mockRejectedValue(new Error('Record not found'));
    const prismaService = { user: { findUniqueOrThrow } } as unknown as PrismaService;

    const verifyAdminMfaToken = vi.fn();
    const authService = { verifyAdminMfaToken } as unknown as AuthService;

    const guard = new AdminGuard(loggerService, prismaService, authService);

    const request = {
      method: 'GET',
      url: '/api/v1/admin/logs',
      user: { id: 'user-4', googleEmail: 'ghost@example.com', isAdmin: true },
      headers: { 'cf-connecting-ip': '203.0.113.13' },
      socket: {},
    };

    await expect(guard.canActivate(createHttpContext(request))).rejects.toThrow(
      UnauthorizedException
    );

    expect(verifyAdminMfaToken).not.toHaveBeenCalled();
    expect(contextualLogAdminOperation).toHaveBeenCalledWith(
      'AdminGuard (canActivate)',
      false,
      '203.0.113.13',
      'User ghost@example.com attempted admin access to GET /api/v1/admin/logs, but user record no longer exists in DB.'
    );
  });

  it('rejects requests if MFA token is invalid or missing', async () => {
    const contextualLogAdminOperation = vi.fn();
    const mockContextualLogger = { logAdminOperation: contextualLogAdminOperation };
    const forContext = vi.fn().mockReturnValue(mockContextualLogger);
    const loggerService = { forContext } as unknown as LoggerService;

    const findUniqueOrThrow = vi.fn().mockResolvedValue({
      isAdmin: true,
      googleEmail: 'admin@example.com',
    });
    const prismaService = { user: { findUniqueOrThrow } } as unknown as PrismaService;

    const verifyAdminMfaToken = vi.fn().mockResolvedValue(false);
    const authService = { verifyAdminMfaToken } as unknown as AuthService;

    const guard = new AdminGuard(loggerService, prismaService, authService);

    const request = {
      method: 'GET',
      url: '/api/v1/admin/dashboard',
      user: { id: 'user-1', googleEmail: 'admin@example.com', isAdmin: true },
      headers: { 'cf-connecting-ip': '203.0.113.11', 'x-admin-api-mfa': 'invalid-mfa' },
      socket: {},
    };

    await expect(guard.canActivate(createHttpContext(request))).rejects.toThrow(
      new UnauthorizedException('Érvénytelen vagy hiányzó másodlagos azonosító (MFA)!')
    );

    expect(verifyAdminMfaToken).toHaveBeenCalledWith('user-1', 'invalid-mfa');
    expect(contextualLogAdminOperation).toHaveBeenCalledWith(
      'AdminGuard (canActivate)',
      false,
      '203.0.113.11',
      'Admin admin@example.com failed MFA verification for GET /api/v1/admin/dashboard.'
    );
  });
});
