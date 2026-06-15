/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AuthService } from './auth.service.js';
import type { JwtService } from '@nestjs/jwt';
import type { ConfigService } from '@nestjs/config';
import type { Cache } from 'cache-manager';
import type { IJwtPayload } from './interfaces.js';
import { AUTH_COOKIE_NAME, buildAuthCookieOptions } from './auth.constants.js';
import type { Response } from 'express';
import type { LoggerService } from '../logger/logger.service.js';

describe('AuthService', () => {
  let service: AuthService;

  let mockJwtService: Partial<JwtService>;
  let mockConfigService: Partial<ConfigService>;
  let mockCacheManager: Partial<Cache>;
  let mockLoggerService: Partial<LoggerService>;
  let mockContextualLogger: any;
  let fetchMock: any;

  beforeEach(() => {
    vi.clearAllMocks();

    fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, statusText: 'OK' });
    vi.stubGlobal('fetch', fetchMock);

    mockJwtService = {
      sign: vi.fn(),
      verify: vi.fn(),
      decode: vi.fn(),
    };

    mockConfigService = {
      get: vi.fn().mockImplementation((key: string) => {
        if (key === 'JWT_SECRET') return 'fake-secret';
        if (key === 'ADMIN_MFA_WEBHOOK_DISCORD_URL') return 'https://discord.webhook.local';
        return undefined;
      }),
    };

    mockCacheManager = {
      set: vi.fn(),
      get: vi.fn(),
    };

    mockContextualLogger = {
      error: vi.fn(),
    };

    mockLoggerService = {
      forContext: vi.fn().mockReturnValue(mockContextualLogger),
    };

    service = new AuthService(
      mockJwtService as JwtService,
      mockConfigService as ConfigService,
      mockLoggerService as LoggerService,
      mockCacheManager as Cache
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateJwtToken', () => {
    it('should call jwtService.sign with payload and secret', () => {
      const payload: IJwtPayload = { sub: '123', email: 'test@example.com', exp: 99999 };
      (mockJwtService.sign as any).mockReturnValue('signed-token');

      const token = service.generateJwtToken(payload);

      expect(token).toBe('signed-token');
      expect(mockJwtService.sign).toHaveBeenCalledWith(payload, {
        secret: 'fake-secret',
        algorithm: 'HS384',
        jwtid: expect.any(String),
      });
    });
  });

  describe('blacklistToken', () => {
    it('should not attempt to cache if decode returns null', async () => {
      (mockJwtService.decode as any).mockReturnValue(null);
      await service.blacklistToken('invalid-token');
      expect(mockCacheManager.set).not.toHaveBeenCalled();
    });

    it('should not attempt to cache if token lacks jti or exp', async () => {
      (mockJwtService.decode as any).mockReturnValue({ sub: '123' });
      await service.blacklistToken('token-no-jti');
      expect(mockCacheManager.set).not.toHaveBeenCalled();
    });

    it('should not cache if the token is already naturally expired', async () => {
      const pastSeconds = Math.floor(Date.now() / 1000) - 1000;
      (mockJwtService.decode as any).mockReturnValue({ jti: 'id-1', exp: pastSeconds });

      await service.blacklistToken('expired-token');
      expect(mockCacheManager.set).not.toHaveBeenCalled();
    });

    it('should cache the jti with correct ttl in milliseconds if valid', async () => {
      const futureSeconds = Math.floor(Date.now() / 1000) + 10;
      (mockJwtService.decode as any).mockReturnValue({ jti: 'id-2', exp: futureSeconds });

      await service.blacklistToken('valid-token');
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'jwt:blacklist:id-2',
        true,
        expect.any(Number)
      );
    });
  });

  describe('setAuthCookie', () => {
    it('should write the auth cookie with the expected options', () => {
      const response = {
        cookie: vi.fn(),
      } as unknown as Response;

      service.setAuthCookie(response, 'jwt-token', false);

      expect(response.cookie).toHaveBeenCalledWith(
        AUTH_COOKIE_NAME,
        'jwt-token',
        buildAuthCookieOptions(false)
      );
    });
  });

  describe('clearAuthCookie', () => {
    it('should clear the auth cookie with the expected options', () => {
      const response = {
        clearCookie: vi.fn(),
      } as unknown as Response;

      service.clearAuthCookie(response, false);

      expect(response.clearCookie).toHaveBeenCalledWith(
        AUTH_COOKIE_NAME,
        buildAuthCookieOptions(false)
      );
    });
  });

  describe('generateAndSendAdminMfaToken', () => {
    it('should generate a token, store it in redis, send to discord and return true', async () => {
      const result = await service.generateAndSendAdminMfaToken('admin@example.com', 'user-123');

      expect(result).toBe(true);
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'mfa:user:user-123',
        expect.any(String),
        expect.any(Number)
      );

      expect(fetchMock).toHaveBeenCalledWith(
        'https://discord.webhook.local',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('admin@example.com'),
        })
      );
    });

    it('should log an error and return false if the discord webhook fetch fails', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const result = await service.generateAndSendAdminMfaToken('admin@example.com', 'user-123');

      expect(result).toBe(false);
      expect(mockContextualLogger.error).toHaveBeenCalledWith(
        'Discord API returned status: 500 Internal Server Error'
      );
    });

    it('should log a specific timeout error and return false if TimeoutError occurs', async () => {
      const timeoutError = new Error('The operation was aborted due to timeout');
      timeoutError.name = 'TimeoutError';
      fetchMock.mockRejectedValueOnce(timeoutError);

      const result = await service.generateAndSendAdminMfaToken('admin@example.com', 'user-123');

      expect(result).toBe(false);
      expect(mockContextualLogger.error).toHaveBeenCalledWith(
        'Discord webhook fetch timed out during admin login.'
      );
    });

    it('should log an error and return false if fetch throws a general exception', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const result = await service.generateAndSendAdminMfaToken('admin@example.com', 'user-123');

      expect(result).toBe(false);
      expect(mockContextualLogger.error).toHaveBeenCalledWith(
        'Failed to send MFA token to Discord webhook',
        expect.any(String)
      );
    });
  });

  describe('verifyAdminMfaToken', () => {
    const valid64CharToken = 'a'.repeat(64);
    const wrong64CharToken = 'b'.repeat(64);

    it('should return false if token is missing', async () => {
      const result = await service.verifyAdminMfaToken('user-123', undefined);
      expect(result).toBe(false);
      expect(mockCacheManager.get).not.toHaveBeenCalled();
    });

    it('should return false if token is an array', async () => {
      const result = await service.verifyAdminMfaToken('user-123', ['token1', 'token2']);
      expect(result).toBe(false);
      expect(mockCacheManager.get).not.toHaveBeenCalled();
    });

    it('should return false and prevent OOM DoS if token is massively long (not 64 chars)', async () => {
      const massivePayload = 'A'.repeat(5000);
      const result = await service.verifyAdminMfaToken('user-123', massivePayload);

      expect(result).toBe(false);
      expect(mockCacheManager.get).not.toHaveBeenCalled();
    });

    it('should return false if token is too short', async () => {
      const result = await service.verifyAdminMfaToken('user-123', 'short-token');
      expect(result).toBe(false);
      expect(mockCacheManager.get).not.toHaveBeenCalled();
    });

    it('should return false if expected token is not in cache', async () => {
      (mockCacheManager.get as any).mockResolvedValue(null);
      const result = await service.verifyAdminMfaToken('user-123', valid64CharToken);

      expect(result).toBe(false);
      expect(mockCacheManager.get).toHaveBeenCalledWith('mfa:user:user-123');
    });

    it('should return false if token does not match the cached value', async () => {
      (mockCacheManager.get as any).mockResolvedValue(valid64CharToken);
      const result = await service.verifyAdminMfaToken('user-123', wrong64CharToken);

      expect(result).toBe(false);
      expect(mockCacheManager.get).toHaveBeenCalledWith('mfa:user:user-123');
    });

    it('should return true if token matches the cached value safely', async () => {
      (mockCacheManager.get as any).mockResolvedValue(valid64CharToken);
      const result = await service.verifyAdminMfaToken('user-123', valid64CharToken);

      expect(result).toBe(true);
      expect(mockCacheManager.get).toHaveBeenCalledWith('mfa:user:user-123');
    });
  });
});
