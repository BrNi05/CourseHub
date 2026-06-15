import { describe, expect, it, vi } from 'vitest';
import type { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import type { Cache } from 'cache-manager';

import { JwtStrategy } from './jwt.strategy.js';
import type { PrismaService } from '../../prisma/prisma.service.js';
import { AUTH_COOKIE_NAME } from '../auth.constants.js';
import type { IAuthenticatedUser } from '../interfaces.js';

type JwtExtractor = (request?: { cookies?: Record<string, unknown> }) => string | null;
type UserLookupArgs = { where: { id: string } };
type JwtStrategyInternal = {
  _jwtFromRequest: JwtExtractor;
};
type JwtPrismaMock = {
  user: {
    findUniqueOrThrow: ReturnType<
      typeof vi.fn<(args: UserLookupArgs) => Promise<IAuthenticatedUser>>
    >;
  };
};

describe('JwtStrategy', () => {
  function createStrategy() {
    const prisma = {
      user: {
        findUniqueOrThrow: vi.fn<(args: UserLookupArgs) => Promise<IAuthenticatedUser>>(),
      },
    } satisfies JwtPrismaMock;
    const configService = {
      getOrThrow: vi.fn().mockReturnValue('jwt-secret'),
    } as unknown as ConfigService;
    const cacheManager = {
      get: vi.fn(),
    } as unknown as Cache;

    const strategy = new JwtStrategy(
      prisma as unknown as PrismaService,
      configService,
      cacheManager
    );

    return { prisma, cacheManager, strategy };
  }

  it('extracts the JWT from the parsed auth cookie', () => {
    const { strategy } = createStrategy();
    const extractor = (strategy as unknown as JwtStrategyInternal)._jwtFromRequest;

    expect(extractor({ cookies: { [AUTH_COOKIE_NAME]: 'jwt-token' } })).toBe('jwt-token');
  });

  it('returns null when the auth cookie is missing or not a string', () => {
    const { strategy } = createStrategy();
    const extractor = (strategy as unknown as JwtStrategyInternal)._jwtFromRequest;

    expect(extractor({ cookies: {} })).toBeNull();
    expect(extractor({ cookies: { [AUTH_COOKIE_NAME]: ['jwt-token'] } })).toBeNull();
    expect(extractor(undefined)).toBeNull();
  });

  it('throws an UnauthorizedException if the token jti is blacklisted', async () => {
    const { strategy, cacheManager } = createStrategy();

    vi.mocked(cacheManager.get).mockResolvedValue(true);

    await expect(
      strategy.validate({ sub: 'user-1', email: 'user@example.com', exp: 99999, jti: 'bad-id' })
    ).rejects.toThrow(UnauthorizedException);

    expect(cacheManager.get).toHaveBeenCalledWith('jwt:blacklist:bad-id');
  });

  it('loads the authenticated user from prisma during validation', async () => {
    const { prisma, cacheManager, strategy } = createStrategy();

    const user: IAuthenticatedUser = {
      id: 'user-1',
      googleEmail: 'user@example.com',
      isAdmin: true,
    };

    vi.mocked(cacheManager.get).mockResolvedValue(null);
    prisma.user.findUniqueOrThrow.mockResolvedValue(user);

    await expect(
      strategy.validate({ sub: 'user-1', email: 'user@example.com', exp: 99999, jti: 'good-id' })
    ).resolves.toEqual(user);

    expect(cacheManager.get).toHaveBeenCalledWith('jwt:blacklist:good-id');
    expect(prisma.user.findUniqueOrThrow).toHaveBeenCalledWith({ where: { id: 'user-1' } });
  });
});
