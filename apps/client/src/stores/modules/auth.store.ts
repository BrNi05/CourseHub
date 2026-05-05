import { isAxiosError } from 'axios';
import { reactive } from 'vue';

import { getErrorMessage } from '../shared/errors';
import { PING_STORAGE_KEY } from '../shared/storage';
import type { SessionState } from '../shared/types';
import type { AuthSessionDto } from '@coursehub/sdk';

import {
  consumeLoginResultFromUrl,
  deleteProfileById,
  fetchCurrentSession,
  logoutSession,
} from '../../api/auth.api';
import { pushNotice } from './notifications.store';
import { clearPingRegistry } from './analytics.store';

export const authState = reactive({
  session: {
    userId: null,
    email: null,
  } as SessionState,
  deletingProfile: false,
  loginInFlight: false,
});

let sessionPromise: Promise<AuthSessionDto | null> | null = null;
let cachedSession: AuthSessionDto | null = null;
let pendingLoginResult: string | null = consumeLoginResultFromUrl();

export function consumePendingLoginResult(): string | null {
  const result: string | null = pendingLoginResult;
  pendingLoginResult = null;
  return result;
}

export function isAuthenticated(): boolean {
  return Boolean(authState.session.userId);
}

export function applyAuthSession(session: AuthSessionDto): void {
  cachedSession = session;
  authState.session.userId = session.id;
}

export function setSessionEmail(email: string | null): void {
  authState.session.email = email;
}

export function clearSession(): void {
  cachedSession = null;
  sessionPromise = null;
  authState.session.userId = null;
  authState.session.email = null;
  globalThis.localStorage.removeItem(PING_STORAGE_KEY);
}

export function handleUnauthorized(showNotice: boolean = true): void {
  clearSession();

  if (!showNotice) return;

  pushNotice('danger', 'Jelentkezz be', 'A munkamenet lejárt. Jelentkezz be újra a folytatáshoz.');
}

export async function getCurrentSession(
  notifyOnUnauthorized: boolean = true
): Promise<AuthSessionDto | null> {
  if (cachedSession) {
    return cachedSession;
  }

  if (sessionPromise !== null) return await sessionPromise;

  sessionPromise = (async () => {
    try {
      const session: AuthSessionDto = await fetchCurrentSession();
      applyAuthSession(session);
      return session;
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        handleUnauthorized(notifyOnUnauthorized);
        return null;
      }

      pushNotice('danger', 'Nem sikerült betölteni a tárgyaidat', getErrorMessage(error));
      return null;
    } finally {
      sessionPromise = null;
    }
  })();

  return await sessionPromise;
}

export function loginWithGoogle(): void {
  if (authState.loginInFlight) return;

  authState.loginInFlight = true;

  globalThis.setTimeout(() => {
    authState.loginInFlight = false;
  }, 3000);

  // Clear local ping registry on login as an other user might have logged in
  clearPingRegistry();

  globalThis.location.assign('api/auth/google');
}

export async function logout(): Promise<void> {
  try {
    await logoutSession();
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) {
      clearSession();
    } else {
      pushNotice('danger', 'Nem sikerült kijelentkezni', getErrorMessage(error));
      return;
    }
  }

  clearSession();
  pushNotice(
    'info',
    'Kijelentkezve',
    'A módosításaid innentől csak a böngésződben lesznek elmentve.'
  );
}

export async function deleteProfile(): Promise<boolean> {
  if (!authState.session.userId) {
    pushNotice('info', 'Bejelentkezés szükséges', 'Jelentkezz be a profil törléséhez.');
    return false;
  }

  authState.deletingProfile = true;

  try {
    await deleteProfileById(authState.session.userId);
    clearSession();

    pushNotice(
      'success',
      'Profil törölve',
      'A fiókod és a szerveren tárolt felvett tárgyaid törölve lettek.'
    );
    return true;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) {
      handleUnauthorized();
      return false;
    }

    pushNotice('danger', 'Nem sikerült törölni a profilt', getErrorMessage(error));
    return false;
  } finally {
    authState.deletingProfile = false;
  }
}
