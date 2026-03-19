/* eslint-disable @typescript-eslint/unbound-method */
import type { ConfigService } from '@nestjs/config';
import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import { describe, expect, it, vi } from 'vitest';

import type { LoggerService } from '../../logger/logger.service.js';
import type { PrismaService } from '../../prisma/prisma.service.js';
import { UserOwnershipGuard } from './ownership.guard.js';

type GuardRequest = {
  params: { id: string };
  headers: Record<string, string | undefined>;
  user?: unknown;
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
  it('rejects requests without a bearer token', async () => {
    const scopedLogger = {
      warn: vi.fn(),
      debug: vi.fn(),
    };
    const logger = {
      forContext: vi.fn().mockReturnValue(scopedLogger),
    } as unknown as LoggerService;
    const jwtService = {
      verify: vi.fn(),
    } as unknown as JwtService;
    const prisma = {
      user: { findUnique: vi.fn() },
    } as unknown as PrismaService;
    const configService = {
      get: vi.fn(),
    } as unknown as ConfigService;
    const guard = new UserOwnershipGuard(jwtService, prisma, configService, logger);

    await expect(
      guard.canActivate(
        createContext({
          params: { id: 'resource-user-id' },
          headers: {},
        })
      )
    ).rejects.toThrow(new ForbiddenException('Érvénytelen vagy hiányzó Authorization header!'));

    expect(scopedLogger.warn).toHaveBeenCalledWith(
      'Missing or invalid Authorization header for resource resource-user-id'
    );
  });

  it('allows the owner and attaches the verified JWT payload to the request', async () => {
    const scopedLogger = {
      warn: vi.fn(),
      debug: vi.fn(),
    };
    const logger = {
      forContext: vi.fn().mockReturnValue(scopedLogger),
    } as unknown as LoggerService;
    const jwtService = {
      verify: vi.fn().mockReturnValue({
        sub: 'resource-user-id',
        email: 'owner@example.com',
        exp: 123456,
      }),
    } as unknown as JwtService;
    const prisma = {
      user: { findUnique: vi.fn() },
    } as unknown as PrismaService;
    const configService = {
      get: vi.fn().mockReturnValue('jwt-secret'),
    } as unknown as ConfigService;
    const request: GuardRequest = {
      params: { id: 'resource-user-id' },
      headers: { authorization: 'Bearer token' },
    };
    const guard = new UserOwnershipGuard(jwtService, prisma, configService, logger);

    const result = await guard.canActivate(createContext(request));

    expect(result).toBe(true);
    expect(jwtService.verify).toHaveBeenCalledWith('token', {
      secret: 'jwt-secret',
      algorithms: ['HS384'],
    });
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(request.user).toEqual({
      sub: 'resource-user-id',
      email: 'owner@example.com',
      exp: 123456,
    });
  });

  it('allows admin override on non-restricted handlers', async () => {
    const scopedLogger = {
      warn: vi.fn(),
      debug: vi.fn(),
    };
    const logger = {
      forContext: vi.fn().mockReturnValue(scopedLogger),
    } as unknown as LoggerService;
    const jwtService = {
      verify: vi.fn().mockReturnValue({
        sub: 'admin-user-id',
        email: 'admin@example.com',
        exp: 123456,
      }),
    } as unknown as JwtService;
    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue({ isAdmin: true }),
      },
    } as unknown as PrismaService;
    const configService = {
      get: vi.fn().mockReturnValue('jwt-secret'),
    } as unknown as ConfigService;
    const request: GuardRequest = {
      params: { id: 'resource-user-id' },
      headers: { authorization: 'Bearer token' },
    };
    const guard = new UserOwnershipGuard(jwtService, prisma, configService, logger);

    const result = await guard.canActivate(createContext(request, 'updateUser'));

    expect(result).toBe(true);
    expect(scopedLogger.debug).toHaveBeenCalledWith(
      'Admin override granted for user admin-user-id (admin@example.com) on user resource resource-user-id'
    );
    expect(request.user).toEqual({
      sub: 'admin-user-id',
      email: 'admin@example.com',
      exp: 123456,
    });
  });

  it('blocks admin override on restricted handlers like ping', async () => {
    const scopedLogger = {
      warn: vi.fn(),
      debug: vi.fn(),
    };
    const logger = {
      forContext: vi.fn().mockReturnValue(scopedLogger),
    } as unknown as LoggerService;
    const jwtService = {
      verify: vi.fn().mockReturnValue({
        sub: 'admin-user-id',
        email: 'admin@example.com',
        exp: 123456,
      }),
    } as unknown as JwtService;
    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue({ isAdmin: true }),
      },
    } as unknown as PrismaService;
    const configService = {
      get: vi.fn().mockReturnValue('jwt-secret'),
    } as unknown as ConfigService;
    const guard = new UserOwnershipGuard(jwtService, prisma, configService, logger);

    await expect(
      guard.canActivate(
        createContext(
          {
            params: { id: 'resource-user-id' },
            headers: { authorization: 'Bearer token' },
          },
          'ping'
        )
      )
    ).rejects.toThrow(new ForbiddenException('Hozzáférés megtagadva!'));

    expect(scopedLogger.warn).toHaveBeenCalledWith(
      'Access denied. JWT sub admin-user-id is not owner nor admin for resource resource-user-id'
    );
  });

  it('rejects invalid or expired tokens', async () => {
    const scopedLogger = {
      warn: vi.fn(),
      debug: vi.fn(),
    };
    const logger = {
      forContext: vi.fn().mockReturnValue(scopedLogger),
    } as unknown as LoggerService;
    const jwtService = {
      verify: vi.fn().mockImplementation(() => {
        throw new Error('jwt expired');
      }),
    } as unknown as JwtService;
    const prisma = {
      user: {
        findUnique: vi.fn(),
      },
    } as unknown as PrismaService;
    const configService = {
      get: vi.fn().mockReturnValue('jwt-secret'),
    } as unknown as ConfigService;
    const guard = new UserOwnershipGuard(jwtService, prisma, configService, logger);

    await expect(
      guard.canActivate(
        createContext({
          params: { id: 'resource-user-id' },
          headers: { authorization: 'Bearer token' },
        })
      )
    ).rejects.toThrow(new ForbiddenException('Érvénytelen vagy hiányzó JWT!'));

    expect(scopedLogger.warn).toHaveBeenCalledWith(
      'JWT validation failed for resource resource-user-id: jwt expired'
    );
  });
});
