import { isAxiosError } from 'axios';
import { reactive } from 'vue';

import { getErrorMessage } from '../shared/errors';
import { clearCourseHubBrowserState } from '../shared/storage';
import type { SessionState } from '../shared/types';

import { consumeLoginResultFromUrl, logoutSession } from '../../api/auth.api';
import { deleteCurrentUserProfile } from '../../api/user.api';
import { pushNotice } from './notifications.store';

export const authState = reactive({
  session: {
    authenticated: false,
    email: null,
  } as SessionState,
  deletingProfile: false,
  loginInFlight: false,
});

let pendingLoginResult: string | null = consumeLoginResultFromUrl();

export function consumePendingLoginResult(): string | null {
  const result: string | null = pendingLoginResult;
  pendingLoginResult = null;
  return result;
}

export function isAuthenticated(): boolean {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return authState.session.authenticated;
}

export function setAuthenticatedSession(email: string | null): void {
  authState.session.authenticated = true;
  authState.session.email = email;
}

export function clearSession(): void {
  authState.session.authenticated = false;
  authState.session.email = null;
}

export function handleUnauthorized(showNotice: boolean = true): void {
  clearSession();

  if (!showNotice) return;

  pushNotice('danger', 'Jelentkezz be', 'A munkamenet lejárt. Jelentkezz be újra a folytatáshoz.');
}

export function loginWithGoogle(): void {
  if (authState.loginInFlight) return;

  authState.loginInFlight = true;

  globalThis.setTimeout(() => {
    authState.loginInFlight = false;
  }, 3000);

  clearCourseHubBrowserState({ clearCookieAccepted: false, keepLocalSaves: true });

  globalThis.location.assign('api/auth/google');
}

export async function logout(keepLocalSaves: boolean = false): Promise<void> {
  try {
    await logoutSession();
  } catch (error) {
    if (!isAxiosError(error) || error.response?.status !== 401) {
      pushNotice('danger', 'Nem sikerült kijelentkezni', getErrorMessage(error));
      return;
    }
  }

  clearSession();
  clearCourseHubBrowserState({ keepLocalSaves });
  pushNotice(
    'info',
    'Kijelentkezve',
    'A módosításaid innentől csak a böngésződben lesznek elmentve.'
  );
}

export async function deleteProfile(keepLocalSaves: boolean = false): Promise<boolean> {
  if (!authState.session.authenticated) {
    pushNotice('info', 'Bejelentkezés szükséges', 'Jelentkezz be a profil törléséhez.');
    return false;
  }

  authState.deletingProfile = true;

  try {
    await deleteCurrentUserProfile();
    clearSession();
    clearCourseHubBrowserState({ keepLocalSaves });

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
