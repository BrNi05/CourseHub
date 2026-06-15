import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import type { Profile } from 'passport-google-oauth20';
import { describe, expect, it, vi } from 'vitest';

import type { LoggerService } from '../../logger/logger.service.js';
import type { PrismaService } from '../../prisma/prisma.service.js';
import type { AuthService } from '../auth.service.js';
import type { OAuthStateStore } from '../oauth-state.store.js';
import { GoogleStrategy } from './google.strategy.js';

type GoogleUser = {
  id: string;
  googleEmail: string;
  isAdmin: boolean;
};

function createStrategy(options?: {
  adminEmails?: string;
  existingUser?: GoogleUser | null;
  createdUser?: GoogleUser;
}) {
  const generateJwtToken = vi.fn().mockReturnValue('jwt-token');
  const generateAndSendAdminMfaToken = vi.fn().mockResolvedValue(true);

  const authService = {
    generateJwtToken,
    generateAndSendAdminMfaToken,
  } as unknown as AuthService;

  const contextualLogAdminOperation = vi.fn();
  const mockContextualLogger = {
    logAdminOperation: contextualLogAdminOperation,
  };
  const forContext = vi.fn().mockReturnValue(mockContextualLogger);

  const prisma = {
    user: {
      findUnique: vi.fn().mockResolvedValue(options?.existingUser ?? null),
      create: vi.fn().mockResolvedValue(
        options?.createdUser ?? {
          id: 'created-user-id',
          googleEmail: 'admin@example.com',
          isAdmin: true,
        }
      ),
    },
  };
  const configService = {
    get: vi.fn((key: string) => {
      const values: Record<string, string> = {
        GOOGLE_CLIENT_ID: 'google-client-id',
        GOOGLE_CLIENT_SECRET: 'google-client-secret',
        GOOGLE_CALLBACK_URL: 'https://coursehub.example.com/auth/google/callback',
        ADMIN_EMAILS: options?.adminEmails ?? 'admin@example.com',
      };

      return values[key];
    }),
  } as unknown as ConfigService;

  const logger = {
    forContext,
  } as unknown as LoggerService;

  const oauthStateStore = {
    store: vi.fn(),
    verify: vi.fn(),
  } as unknown as OAuthStateStore;

  const strategy = new GoogleStrategy(
    authService,
    prisma as unknown as PrismaService,
    configService,
    logger,
    oauthStateStore
  );

  return {
    generateJwtToken,
    generateAndSendAdminMfaToken,
    contextualLogAdminOperation,
    forContext,
    prisma,
    strategy,
  };
}

describe('GoogleStrategy', () => {
  it('logs successful admin logins and generates tokens if MFA delivery succeeds', async () => {
    const existingUser = {
      id: 'admin-user-id',
      googleEmail: 'admin@example.com',
      isAdmin: true,
    };
    const {
      generateJwtToken,
      generateAndSendAdminMfaToken,
      contextualLogAdminOperation,
      forContext,
      prisma,
      strategy,
    } = createStrategy({
      adminEmails: 'admin@example.com',
      existingUser,
    });
    const done = vi.fn();

    await strategy.validate(
      { headers: { 'cf-connecting-ip': '203.0.113.15' }, socket: {} } as unknown as Request,
      'access-token',
      'refresh-token',
      { id: 'google-id', emails: [{ value: 'admin@example.com' }] } as Profile,
      done
    );

    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(forContext).toHaveBeenCalledWith('GoogleLogin');
    expect(generateAndSendAdminMfaToken).toHaveBeenCalledWith('admin@example.com', 'admin-user-id');

    expect(contextualLogAdminOperation).toHaveBeenCalledWith(
      'Admin Login',
      true,
      '203.0.113.15',
      'Admin admin@example.com logged in. Session and MFA will expire in 30 mins.'
    );

    expect(generateJwtToken).toHaveBeenCalledWith(
      expect.objectContaining({
        sub: 'admin-user-id',
        email: 'admin@example.com',
      })
    );
    expect(done).toHaveBeenCalledWith(null, { accessToken: 'jwt-token' });
  });

  it('aborts login with UnauthorizedException if MFA delivery fails', async () => {
    const existingUser = {
      id: 'admin-user-id',
      googleEmail: 'admin@example.com',
      isAdmin: true,
    };
    const {
      generateJwtToken,
      generateAndSendAdminMfaToken,
      contextualLogAdminOperation,
      strategy,
    } = createStrategy({
      adminEmails: 'admin@example.com',
      existingUser,
    });

    generateAndSendAdminMfaToken.mockResolvedValue(false);

    const done = vi.fn();

    await strategy.validate(
      { headers: { 'cf-connecting-ip': '203.0.113.15' }, socket: {} } as unknown as Request,
      'access-token',
      'refresh-token',
      { id: 'google-id', emails: [{ value: 'admin@example.com' }] } as Profile,
      done
    );

    expect(generateAndSendAdminMfaToken).toHaveBeenCalledWith('admin@example.com', 'admin-user-id');

    expect(contextualLogAdminOperation).toHaveBeenCalledWith(
      'Admin Login',
      false,
      '203.0.113.15',
      'Admin admin@example.com login failed! MFA token could not be sent via Discord.'
    );

    expect(generateJwtToken).not.toHaveBeenCalled();
    expect(done).toHaveBeenCalledWith(
      new UnauthorizedException('Discord Timeout: Could not send MFA token.'),
      false
    );
  });

  it('does not log admin login audit events for non-admin users', async () => {
    const { contextualLogAdminOperation, generateAndSendAdminMfaToken, strategy } = createStrategy({
      adminEmails: '',
      existingUser: {
        id: 'user-id',
        googleEmail: 'user@example.com',
        isAdmin: false,
      },
    });
    const done = vi.fn();

    await strategy.validate(
      { headers: { 'cf-connecting-ip': '203.0.113.16' }, socket: {} } as unknown as Request,
      'access-token',
      'refresh-token',
      { id: 'google-id', emails: [{ value: 'user@example.com' }] } as Profile,
      done
    );

    expect(contextualLogAdminOperation).not.toHaveBeenCalled();
    expect(generateAndSendAdminMfaToken).not.toHaveBeenCalled();
    expect(done).toHaveBeenCalledWith(null, { accessToken: 'jwt-token' });
  });

  it('rejects Google profiles without an email address', async () => {
    const { contextualLogAdminOperation, strategy } = createStrategy();
    const done = vi.fn();

    await strategy.validate(
      { headers: {}, socket: {} } as Request,
      'access-token',
      'refresh-token',
      { id: 'google-id', emails: [] } as unknown as Profile,
      done
    );

    expect(contextualLogAdminOperation).not.toHaveBeenCalled();
    expect(done.mock.calls[0]?.[0]).toBeInstanceOf(UnauthorizedException);
    expect(done.mock.calls[0]?.[1]).toBe(false);
  });
});
