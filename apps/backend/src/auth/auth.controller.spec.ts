/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthController } from './auth.controller.js';
import type { Request, Response } from 'express';
import type { ConfigService } from '@nestjs/config';
import type { GoogleCallbackDto } from './dto/google-callback.dto.js';
import type { AuthService } from './auth.service.js';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: Pick<AuthService, 'setAuthCookie' | 'clearAuthCookie'>;

  beforeEach(() => {
    const configService = {
      get: vi.fn().mockImplementation((key: string) => {
        if (key === 'CORS_ORIGIN') return 'http://localhost:3000';
        if (key === 'NODE_ENV') return 'development';
        return undefined;
      }),
    } as unknown as ConfigService;
    authService = {
      setAuthCookie: vi.fn(),
      clearAuthCookie: vi.fn(),
    };

    controller = new AuthController(authService as AuthService, configService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should redirect to the frontend root route with the token in the hash', () => {
    const mockUser: GoogleCallbackDto = { accessToken: '...' };

    const req = {
      user: mockUser,
    } as unknown as Request;

    const res = {
      redirect: vi.fn(),
    } as unknown as Response;

    controller.googleCallback(req, res);

    expect(authService.setAuthCookie).toHaveBeenCalledWith(res, mockUser.accessToken, false);
    expect(res.redirect).toHaveBeenCalledWith(302, 'http://localhost:3000/?login=success');
  });

  it('should set a secure auth cookie in production', () => {
    const mockUser: GoogleCallbackDto = { accessToken: '...' };
    const productionConfig = {
      get: vi.fn().mockImplementation((key: string) => {
        if (key === 'CORS_ORIGIN') return 'https://coursehub.hu';
        if (key === 'NODE_ENV') return 'production';
        return undefined;
      }),
    } as unknown as ConfigService;
    const productionController = new AuthController(authService as AuthService, productionConfig);
    const req = {
      user: mockUser,
    } as unknown as Request;
    const res = {
      redirect: vi.fn(),
    } as unknown as Response;

    productionController.googleCallback(req, res);

    expect(authService.setAuthCookie).toHaveBeenCalledWith(res, mockUser.accessToken, true);
    expect(res.redirect).toHaveBeenCalledWith(302, 'https://coursehub.hu/?login=success');
  });

  it('should return only the authenticated user id for the current session', async () => {
    await expect(controller.me('user-1')).resolves.toEqual({ id: 'user-1' });
  });

  it('should clear the auth cookie on logout', () => {
    const res = {} as Response;

    controller.logout(res);

    expect(authService.clearAuthCookie).toHaveBeenCalledWith(res, false);
  });

  it('should clear a secure auth cookie on logout in production', () => {
    const productionConfig = {
      get: vi.fn().mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'production';
        return undefined;
      }),
    } as unknown as ConfigService;
    const productionController = new AuthController(authService as AuthService, productionConfig);
    const res = {} as Response;

    productionController.logout(res);

    expect(authService.clearAuthCookie).toHaveBeenCalledWith(res, true);
  });
});
