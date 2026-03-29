import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { IAuthenticatedUser } from '../interfaces.js';
import type { LoggerService } from '../../logger/logger.service.js';
import { UserOwnershipGuard } from './ownership.guard.js';

type GuardRequest = {
  params: { id: string };
  headers?: Record<string, string | undefined>;
  user?: IAuthenticatedUser;
};

function createContext(request: GuardRequest, handlerName = 'updateUser'): ExecutionContext {
  const handler = { [handlerName]() {} }[handlerName] as () => void;

  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getHandler: () => handler,
  } as unknown as ExecutionContext;
}

describe('UserOwnershipGuard', () => {
  it('rejects requests without an authenticated user on the request', () => {
    const scopedLogger = {
      warn: vi.fn(),
      debug: vi.fn(),
    };
    const logger = {
      forContext: vi.fn().mockReturnValue(scopedLogger),
    } as unknown as LoggerService;
    const guard = new UserOwnershipGuard(logger);

    expect(() =>
      guard.canActivate(
        createContext({
          params: { id: 'resource-user-id' },
          headers: {},
        })
      )
    ).toThrow(new ForbiddenException('Érvénytelen azonosított állapot!'));

    expect(scopedLogger.warn).toHaveBeenCalledWith(
      'Missing authenticated user on request for resource resource-user-id'
    );
  });

  it('allows the owner using the authenticated request user', () => {
    const scopedLogger = {
      warn: vi.fn(),
      debug: vi.fn(),
    };
    const logger = {
      forContext: vi.fn().mockReturnValue(scopedLogger),
    } as unknown as LoggerService;
    const request: GuardRequest = {
      params: { id: 'resource-user-id' },
      headers: { authorization: 'Bearer token' },
      user: {
        id: 'resource-user-id',
        googleEmail: 'owner@example.com',
        isAdmin: false,
      },
    };
    const guard = new UserOwnershipGuard(logger);

    const result = guard.canActivate(createContext(request));

    expect(result).toBe(true);
    expect(request.user).toEqual({
      id: 'resource-user-id',
      googleEmail: 'owner@example.com',
      isAdmin: false,
    });
  });

  it('allows admin override on non-restricted handlers', () => {
    const scopedLogger = {
      warn: vi.fn(),
      debug: vi.fn(),
    };
    const logger = {
      forContext: vi.fn().mockReturnValue(scopedLogger),
    } as unknown as LoggerService;
    const request: GuardRequest = {
      params: { id: 'resource-user-id' },
      headers: { authorization: 'Bearer token' },
      user: {
        id: 'admin-user-id',
        googleEmail: 'admin@example.com',
        isAdmin: true,
      },
    };
    const guard = new UserOwnershipGuard(logger);

    const result = guard.canActivate(createContext(request, 'updateUser'));

    expect(result).toBe(true);
    expect(scopedLogger.debug).toHaveBeenCalledWith(
      'Admin override granted for user admin-user-id (admin@example.com) on user resource resource-user-id'
    );
    expect(request.user).toEqual({
      id: 'admin-user-id',
      googleEmail: 'admin@example.com',
      isAdmin: true,
    });
  });

  it('blocks admin override on restricted handlers like ping', () => {
    const scopedLogger = {
      warn: vi.fn(),
      debug: vi.fn(),
    };
    const logger = {
      forContext: vi.fn().mockReturnValue(scopedLogger),
    } as unknown as LoggerService;
    const guard = new UserOwnershipGuard(logger);

    expect(() =>
      guard.canActivate(
        createContext(
          {
            params: { id: 'resource-user-id' },
            headers: { authorization: 'Bearer token' },
            user: {
              id: 'admin-user-id',
              googleEmail: 'admin@example.com',
              isAdmin: true,
            },
          },
          'ping'
        )
      )
    ).toThrow(new ForbiddenException('Hozzáférés megtagadva!'));

    expect(scopedLogger.warn).toHaveBeenCalledWith(
      'Access denied. Authenticated user admin-user-id is not owner nor admin for resource resource-user-id'
    );
  });

  it('rejects non-owner non-admin authenticated users', () => {
    const scopedLogger = {
      warn: vi.fn(),
      debug: vi.fn(),
    };
    const logger = {
      forContext: vi.fn().mockReturnValue(scopedLogger),
    } as unknown as LoggerService;
    const guard = new UserOwnershipGuard(logger);

    expect(() =>
      guard.canActivate(
        createContext({
          params: { id: 'resource-user-id' },
          headers: { authorization: 'Bearer token' },
          user: {
            id: 'other-user-id',
            googleEmail: 'user@example.com',
            isAdmin: false,
          },
        })
      )
    ).toThrow(new ForbiddenException('Hozzáférés megtagadva!'));

    expect(scopedLogger.warn).toHaveBeenCalledWith(
      'Access denied. Authenticated user other-user-id is not owner nor admin for resource resource-user-id'
    );
  });
});
