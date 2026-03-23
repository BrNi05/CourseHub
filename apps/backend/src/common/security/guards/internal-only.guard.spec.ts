import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import { InternalOnlyGuard } from './internal-only.guard.js';

function createHttpContext(request: object): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
}

describe('InternalOnlyGuard', () => {
  it('allows callers from configured Docker subnets', () => {
    const guard = new InternalOnlyGuard();
    const request = {
      method: 'GET',
      url: '/api/metrics',
      socket: { remoteAddress: '172.40.0.25' },
      headers: {},
    };

    const result = guard.canActivate(createHttpContext(request));

    expect(result).toBe(true);
  });

  it('allows IPv4-mapped Docker addresses', () => {
    const guard = new InternalOnlyGuard();
    const request = {
      method: 'GET',
      url: '/api/metrics',
      socket: { remoteAddress: '::ffff:172.40.0.25' },
      headers: {},
    };

    const result = guard.canActivate(createHttpContext(request));

    expect(result).toBe(true);
  });

  it('rejects localhost callers', () => {
    const guard = new InternalOnlyGuard();
    const request = {
      method: 'GET',
      url: '/api/metrics',
      socket: { remoteAddress: '127.0.0.1' },
      headers: {},
    };

    expect(() => guard.canActivate(createHttpContext(request))).toThrow(ForbiddenException);
  });

  it('rejects callers outside the configured Docker subnets', () => {
    const guard = new InternalOnlyGuard();
    const request = {
      method: 'GET',
      url: '/api/metrics',
      socket: { remoteAddress: '10.0.0.25' },
      headers: {},
    };

    expect(() => guard.canActivate(createHttpContext(request))).toThrow(ForbiddenException);
  });

  it('rejects requests with cf-connecting-ip header', () => {
    const guard = new InternalOnlyGuard();
    const request = {
      method: 'GET',
      url: '/api/metrics',
      socket: { remoteAddress: '172.40.0.25' },
      headers: { 'cf-connecting-ip': '10.0.0.25' },
    };

    expect(() => guard.canActivate(createHttpContext(request))).toThrow(ForbiddenException);
  });
});
