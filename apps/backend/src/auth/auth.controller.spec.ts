import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthController } from './auth.controller.js';
import type { Request, Response } from 'express';
import type { ConfigService } from '@nestjs/config';
import type { GoogleCallbackDto } from './dto/google-callback.dto.js';

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(() => {
    const configService = {
      get: vi.fn().mockReturnValue('http://localhost:3000'),
      getOrThrow: vi.fn().mockReturnValue('http://localhost:3000'),
    } as unknown as ConfigService;

    controller = new AuthController(configService);
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

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(res.redirect).toHaveBeenCalledWith(
      302,
      `http://localhost:3000/#token=${encodeURIComponent(mockUser.accessToken)}`
    );
  });
});
