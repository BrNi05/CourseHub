import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthController } from './auth.controller.js';
import type { Request, Response } from 'express';
import type { GoogleCallbackDto } from './dto/google-callback.dto.js';

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(() => {
    controller = new AuthController();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return req.user in googleCallback and set content type', () => {
    const mockUser: GoogleCallbackDto = { accessToken: '...' };

    const req = {
      user: mockUser,
    } as unknown as Request;

    const res = {
      contentType: vi.fn(),
    } as unknown as Response;

    const result = controller.googleCallback(req, res);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(res.contentType).toHaveBeenCalledWith('application/json');
    expect(result).toEqual(mockUser);
  });
});
