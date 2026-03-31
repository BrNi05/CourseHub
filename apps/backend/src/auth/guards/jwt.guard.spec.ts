import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import { JwtAuthGuard } from './jwt.guard.js';

function createHttpContext(request: object): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  it('returns the authenticated user when passport validation succeeds', () => {
    const guard = new JwtAuthGuard();
    const user = { sub: 'user-1' };

    const result = guard.handleRequest(null, user, null, createHttpContext({ headers: {} }));

    expect(result).toBe(user);
  });

  it('throws an UnauthorizedException when the user is missing', () => {
    const guard = new JwtAuthGuard();
    const context = createHttpContext({
      headers: { 'cf-connecting-ip': '203.0.113.20' },
      socket: {},
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    expect(() => guard.handleRequest(null, null, null, context)).toThrow(UnauthorizedException);
  });

  it('throws an UnauthorizedException when passport returns an error', () => {
    const guard = new JwtAuthGuard();
    const context = createHttpContext({ headers: {} });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    expect(() => guard.handleRequest(new Error('passport failed'), null, null, context)).toThrow(
      UnauthorizedException
    );
  });
});
