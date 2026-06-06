import type { CookieOptions } from 'express';

export const AUTH_COOKIE_NAME = 'coursehub_auth'; // External name
export const AUTH_COOKIE_SECURITY_NAME = 'auth_cookie'; // Internal name
export const AUTH_COOKIE_MAX_AGE_MS_DEV = 160 * 24 * 60 * 60 * 1000; // 160 days
export const AUTH_COOKIE_MAX_AGE_MS_PROD = 30 * 60 * 1000; // 30 minutes
export const OAUTH_STATE_COOKIE_NAME = 'coursehub_oauth_state'; // External name
export const OAUTH_STATE_COOKIE_MAX_AGE_MS = 2 * 60 * 1000; // 2 minutes

export const isProduction = () => process.env.NODE_ENV?.trim() !== 'development';

export function buildAuthCookieOptions(isSecure: boolean): CookieOptions {
  return {
    httpOnly: true,
    maxAge: isProduction() ? AUTH_COOKIE_MAX_AGE_MS_PROD : AUTH_COOKIE_MAX_AGE_MS_DEV,
    path: '/',
    sameSite: 'lax',
    secure: isSecure,
  };
}

export function buildOAuthStateCookieOptions(isSecure: boolean): CookieOptions {
  return {
    httpOnly: true,
    maxAge: OAUTH_STATE_COOKIE_MAX_AGE_MS,
    path: '/api/auth',
    sameSite: 'lax',
    secure: isSecure,
  };
}
