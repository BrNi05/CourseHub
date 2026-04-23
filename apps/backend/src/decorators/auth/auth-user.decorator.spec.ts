import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import type { IAuthenticatedUser } from '../../auth/interfaces.js';

import { getAuthenticatedUserOrThrow } from './auth-user.decorator.js';

describe('getAuthenticatedUserOrThrow', () => {
  it('returns the authenticated user from the request', () => {
    const user: IAuthenticatedUser = {
      id: 'user-1',
      googleEmail: 'user@example.com',
      isAdmin: false,
    };

    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as ExecutionContext;

    expect(getAuthenticatedUserOrThrow(context)).toEqual(user);
  });

  it('throws when the request is missing an authenticated user', () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    } as ExecutionContext;

    expect(() => getAuthenticatedUserOrThrow(context)).toThrow(UnauthorizedException);
  });
});
