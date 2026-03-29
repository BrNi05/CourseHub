/* eslint-disable @typescript-eslint/unbound-method */
import { describe, expect, it, vi } from 'vitest';
import type { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';

import { OAUTH_STATE_COOKIE_NAME, buildOAuthStateCookieOptions } from './auth.constants.js';
import { OAuthStateStore } from './oauth-state.store.js';

type RequestWithResponse = Request & {
  cookies?: Record<string, unknown>;
  res?: Response;
};

describe('OAuthStateStore', () => {
  function createRequest(request: Partial<RequestWithResponse>): RequestWithResponse {
    return request as unknown as RequestWithResponse;
  }

  function createStore(nodeEnv: 'development' | 'production' = 'development') {
    const configService = {
      get: vi.fn().mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return nodeEnv;
        return undefined;
      }),
    } as unknown as ConfigService;

    return new OAuthStateStore(configService);
  }

  it('stores the OAuth state in an httpOnly cookie', () => {
    const store = createStore();
    const response = {
      cookie: vi.fn(),
    } as unknown as Response;
    const request = createRequest({ res: response });
    const callback = vi.fn();

    store.store(request, callback);

    expect(callback).toHaveBeenCalledWith(null, expect.any(String));
    const storedState = callback.mock.calls[0]?.[1];
    expect(response.cookie).toHaveBeenCalledWith(
      OAUTH_STATE_COOKIE_NAME,
      storedState,
      buildOAuthStateCookieOptions(false)
    );
  });

  it('fails to store the OAuth state when the response object is missing', () => {
    const store = createStore();
    const request = createRequest({});
    const callback = vi.fn();

    store.store(request, callback);

    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'OAuth state cookie could not be written because the response is missing.',
      }),
      undefined
    );
  });

  it('rejects callbacks without a matching cookie state and clears the cookie', () => {
    const store = createStore();
    const response = {
      clearCookie: vi.fn(),
    } as unknown as Response;
    const request = createRequest({
      cookies: { [OAUTH_STATE_COOKIE_NAME]: 'expected-state' },
      res: response,
    });
    const callback = vi.fn();

    store.verify(request, 'wrong-state', callback);

    expect(response.clearCookie).toHaveBeenCalledWith(
      OAUTH_STATE_COOKIE_NAME,
      buildOAuthStateCookieOptions(false)
    );
    expect(callback).toHaveBeenCalledWith(null, false, {
      message: 'Invalid authorization request state.',
    });
  });

  it('rejects callbacks when the OAuth state cookie is missing', () => {
    const store = createStore();
    const response = {
      clearCookie: vi.fn(),
    } as unknown as Response;
    const request = createRequest({
      cookies: {},
      res: response,
    });
    const callback = vi.fn();

    store.verify(request, 'expected-state', callback);

    expect(response.clearCookie).toHaveBeenCalledWith(
      OAUTH_STATE_COOKIE_NAME,
      buildOAuthStateCookieOptions(false)
    );
    expect(callback).toHaveBeenCalledWith(null, false, {
      message: 'Unable to verify authorization request state.',
    });
  });

  it('accepts callbacks with the matching cookie state', () => {
    const store = createStore('production');
    const response = {
      clearCookie: vi.fn(),
    } as unknown as Response;
    const request = createRequest({
      cookies: { [OAUTH_STATE_COOKIE_NAME]: 'expected-state' },
      res: response,
    });
    const callback = vi.fn();

    store.verify(request, 'expected-state', callback);

    expect(response.clearCookie).toHaveBeenCalledWith(
      OAUTH_STATE_COOKIE_NAME,
      buildOAuthStateCookieOptions(true)
    );
    expect(callback).toHaveBeenCalledWith(null, true, 'expected-state');
  });
});
