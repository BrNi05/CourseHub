import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { IAuthenticatedUser } from '../interfaces.js';
import type { LoggerService } from '../../logger/logger.service.js';
import type { AuthService } from '../auth.service.js';
import { UserOwnershipGuard } from './ownership.guard.js';

type GuardRequest = {
  method?: string;
  url?: string;
  params: { id: string };
  headers?: Record<string, string | undefined>;
  user?: IAuthenticatedUser;
};

function createContext(request: GuardRequest, handlerName = 'updateUser'): ExecutionContext {
  const handler = { [handlerName]() {} }[handlerName];

  const requestWithDefaults = {
    method: 'GET',
    url: `/users/${request.params.id}`,
    ...request,
  };

  return {
    switchToHttp: () => ({
      getRequest: () => requestWithDefaults,
    }),
    getHandler: () => handler,
  } as unknown as ExecutionContext;
}

describe('UserOwnershipGuard', () => {
  it('rejects requests without an authenticated user on the request', async () => {
    const scopedLogger = {
      warn: vi.fn(),
      debug: vi.fn(),
    };
    const logger = {
      logAdminOperation: vi.fn(),
      forContext: vi.fn().mockReturnValue(scopedLogger),
    } as unknown as LoggerService;

    const verifyAdminMfaToken = vi.fn();
    const authService = { verifyAdminMfaToken } as unknown as AuthService;

    const guard = new UserOwnershipGuard(logger, authService);

    await expect(
      guard.canActivate(
        createContext({
          params: { id: 'resource-user-id' },
          headers: {},
        })
      )
    ).rejects.toThrow(new ForbiddenException('Érvénytelen azonosított állapot!'));

    expect(scopedLogger.warn).toHaveBeenCalledWith(
      'Missing authenticated user on request for resource resource-user-id'
    );
  });

  it('allows the owner using the authenticated request user', async () => {
    const scopedLogger = {
      warn: vi.fn(),
      debug: vi.fn(),
    };
    const logger = {
      logAdminOperation: vi.fn(),
      forContext: vi.fn().mockReturnValue(scopedLogger),
    } as unknown as LoggerService;

    const verifyAdminMfaToken = vi.fn();
    const authService = { verifyAdminMfaToken } as unknown as AuthService;

    const request: GuardRequest = {
      params: { id: 'resource-user-id' },
      headers: { authorization: 'Bearer token' },
      user: {
        id: 'resource-user-id',
        googleEmail: 'owner@example.com',
        isAdmin: false,
      },
    };
    const guard = new UserOwnershipGuard(logger, authService);

    const result = await guard.canActivate(createContext(request));

    expect(result).toBe(true);
    expect(request.user).toEqual({
      id: 'resource-user-id',
      googleEmail: 'owner@example.com',
      isAdmin: false,
    });
  });

  it('allows admin override on non-restricted handlers', async () => {
    const logAdminOperation = vi.fn();
    const scopedLogger = {
      warn: vi.fn(),
      debug: vi.fn(),
    };
    const logger = {
      logAdminOperation,
      forContext: vi.fn().mockReturnValue(scopedLogger),
    } as unknown as LoggerService;

    const verifyAdminMfaToken = vi.fn().mockResolvedValue(true);
    const authService = { verifyAdminMfaToken } as unknown as AuthService;

    const request: GuardRequest = {
      params: { id: 'resource-user-id' },
      headers: {
        authorization: 'Bearer token',
        'cf-connecting-ip': '203.0.113.12',
        'x-admin-api-mfa': 'valid-mfa',
      },
      user: {
        id: 'admin-user-id',
        googleEmail: 'admin@example.com',
        isAdmin: true,
      },
    };
    const guard = new UserOwnershipGuard(logger, authService);

    const result = await guard.canActivate(createContext(request, 'updateUser'));

    expect(result).toBe(true);
    expect(verifyAdminMfaToken).toHaveBeenCalledWith('admin-user-id', 'valid-mfa');
    expect(logAdminOperation).toHaveBeenCalledWith(
      'UserOwnershipGuard Admin Override',
      true,
      '203.0.113.12',
      'Admin admin@example.com accessed user resource resource-user-id.'
    );
    expect(request.user).toEqual({
      id: 'admin-user-id',
      googleEmail: 'admin@example.com',
      isAdmin: true,
    });
  });

  it('blocks admin override if MFA token is invalid or missing', async () => {
    const logAdminOperation = vi.fn();
    const scopedLogger = {
      warn: vi.fn(),
      debug: vi.fn(),
    };
    const logger = {
      logAdminOperation,
      forContext: vi.fn().mockReturnValue(scopedLogger),
    } as unknown as LoggerService;

    const verifyAdminMfaToken = vi.fn().mockResolvedValue(false);
    const authService = { verifyAdminMfaToken } as unknown as AuthService;

    const request: GuardRequest = {
      params: { id: 'resource-user-id' },
      headers: {
        authorization: 'Bearer token',
        'cf-connecting-ip': '203.0.113.15',
        'x-admin-api-mfa': 'invalid-mfa',
      },
      user: {
        id: 'admin-user-id',
        googleEmail: 'admin@example.com',
        isAdmin: true,
      },
    };
    const guard = new UserOwnershipGuard(logger, authService);

    await expect(guard.canActivate(createContext(request, 'updateUser'))).rejects.toThrow(
      new ForbiddenException('Érvénytelen vagy hiányzó másodlagos azonosító (MFA)!')
    );

    expect(verifyAdminMfaToken).toHaveBeenCalledWith('admin-user-id', 'invalid-mfa');
    expect(logAdminOperation).toHaveBeenCalledWith(
      'UserOwnershipGuard Admin Override',
      false,
      '203.0.113.15',
      'Admin admin@example.com failed MFA verification during override for user resource resource-user-id.'
    );
  });

  it('blocks admin override on restricted handlers like ping', async () => {
    const logAdminOperation = vi.fn();
    const scopedLogger = {
      warn: vi.fn(),
      debug: vi.fn(),
    };
    const logger = {
      logAdminOperation,
      forContext: vi.fn().mockReturnValue(scopedLogger),
    } as unknown as LoggerService;

    const verifyAdminMfaToken = vi.fn();
    const authService = { verifyAdminMfaToken } as unknown as AuthService;

    const guard = new UserOwnershipGuard(logger, authService);

    await expect(
      guard.canActivate(
        createContext(
          {
            params: { id: 'resource-user-id' },
            headers: { authorization: 'Bearer token', 'cf-connecting-ip': '203.0.113.13' },
            user: {
              id: 'admin-user-id',
              googleEmail: 'admin@example.com',
              isAdmin: true,
            },
          },
          'ping'
        )
      )
    ).rejects.toThrow(new ForbiddenException('Hozzáférés megtagadva!'));

    expect(verifyAdminMfaToken).not.toHaveBeenCalled();
    expect(logAdminOperation).toHaveBeenCalledWith(
      'UserOwnershipGuard Admin Override',
      false,
      '203.0.113.13',
      'Admin admin@example.com was denied access for user resource resource-user-id.'
    );

    expect(scopedLogger.warn).not.toHaveBeenCalled();
  });

  it('rejects non-owner non-admin authenticated users', async () => {
    const scopedLogger = {
      warn: vi.fn(),
      debug: vi.fn(),
    };
    const logger = {
      logAdminOperation: vi.fn(),
      forContext: vi.fn().mockReturnValue(scopedLogger),
    } as unknown as LoggerService;

    const verifyAdminMfaToken = vi.fn();
    const authService = { verifyAdminMfaToken } as unknown as AuthService;

    const guard = new UserOwnershipGuard(logger, authService);

    await expect(
      guard.canActivate(
        createContext({
          method: 'PATCH',
          url: '/users/resource-user-id',
          params: { id: 'resource-user-id' },
          headers: { authorization: 'Bearer token', 'cf-connecting-ip': '203.0.113.14' },
          user: {
            id: 'other-user-id',
            googleEmail: 'user@example.com',
            isAdmin: false,
          },
        })
      )
    ).rejects.toThrow(new ForbiddenException('Hozzáférés megtagadva!'));

    expect(verifyAdminMfaToken).not.toHaveBeenCalled();
    expect(scopedLogger.warn).toHaveBeenCalledWith(
      'User other-user-id attempted to access resource resource-user-id. Context: HTTP PATCH /users/resource-user-id. IP: 203.0.113.14'
    );
  });
});
