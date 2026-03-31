import { randomBytes, timingSafeEqual } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import type OAuth2Strategy from 'passport-oauth2';

import { OAUTH_STATE_COOKIE_NAME, buildOAuthStateCookieOptions } from './auth.constants.js';

// Compare the browser and callback state
function hasMatchingState(expectedState: string, providedState: string): boolean {
  const expectedBuffer = Buffer.from(expectedState, 'utf8');
  const providedBuffer = Buffer.from(providedState, 'utf8');

  if (expectedBuffer.length !== providedBuffer.length) return false;

  return timingSafeEqual(expectedBuffer, providedBuffer);
}

@Injectable()
export class OAuthStateStore implements OAuth2Strategy.StateStore {
  private readonly isSecure: boolean;

  constructor(configService: ConfigService) {
    this.isSecure = configService.get<string>('NODE_ENV') === 'production';
  }

  store(req: Request, callback: OAuth2Strategy.StateStoreStoreCallback): void;

  store(
    req: Request,
    _meta: OAuth2Strategy.Metadata,
    callback: OAuth2Strategy.StateStoreStoreCallback
  ): void;

  store(
    req: Request,
    metaOrCallback: OAuth2Strategy.Metadata | OAuth2Strategy.StateStoreStoreCallback,
    maybeCallback?: OAuth2Strategy.StateStoreStoreCallback
  ): void {
    // Passport calls this with either (req, callback) or (req, meta, callback)
    const callback = typeof metaOrCallback === 'function' ? metaOrCallback : maybeCallback;

    if (!callback) return;

    if (!req.res) {
      callback(
        new Error('OAuth state cookie could not be written because the response is missing.'),
        undefined
      );
      return;
    }

    // This random value is sent to Google as state and also stored in a cookie
    const state = randomBytes(32).toString('base64url');
    req.res.cookie(OAUTH_STATE_COOKIE_NAME, state, buildOAuthStateCookieOptions(this.isSecure));
    callback(null, state);
  }

  verify(req: Request, state: string, callback: OAuth2Strategy.StateStoreVerifyCallback): void;

  verify(
    req: Request,
    state: string,
    _meta: OAuth2Strategy.Metadata,
    callback: OAuth2Strategy.StateStoreVerifyCallback
  ): void;
  verify(
    req: Request,
    state: string,
    metaOrCallback: OAuth2Strategy.Metadata | OAuth2Strategy.StateStoreVerifyCallback,
    maybeCallback?: OAuth2Strategy.StateStoreVerifyCallback
  ): void {
    // Passport calls this with either (req, state, callback) or (req, state, meta, callback)
    const callback = typeof metaOrCallback === 'function' ? metaOrCallback : maybeCallback;

    if (!callback) return;

    // One-time-use cookie: clear it before finishing verification
    if (req.res) {
      req.res.clearCookie(OAUTH_STATE_COOKIE_NAME, buildOAuthStateCookieOptions(this.isSecure));
    }

    // Login may continue only if the callback state matches the browser that started login
    const storedState = req.cookies?.[OAUTH_STATE_COOKIE_NAME];
    if (typeof storedState !== 'string' || typeof state !== 'string') {
      callback(null, false, { message: 'Unable to verify authorization request state.' });
      return;
    }

    if (!hasMatchingState(storedState, state)) {
      callback(null, false, { message: 'Invalid authorization request state.' });
      return;
    }

    callback(null, true, state);
  }
}
