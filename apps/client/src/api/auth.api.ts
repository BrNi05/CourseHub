import {
  delete2 as deleteUser,
  logout as logoutRequest,
  me,
  type AuthSessionDto,
} from '@coursehub/sdk';

import { apiOptions } from './api';

export async function fetchCurrentSession(): Promise<AuthSessionDto> {
  const response = await me(apiOptions());
  return response.data;
}

export async function logoutSession(): Promise<void> {
  await logoutRequest(apiOptions());
}

export async function deleteProfileById(userId: string): Promise<void> {
  await deleteUser({
    ...apiOptions(),
    path: { id: userId },
  });
}

export function consumeLoginResultFromUrl(): string | null {
  const result = new URLSearchParams(globalThis.location.search).get('login');
  const url = new URL(globalThis.location.href);

  url.searchParams.delete('login');
  globalThis.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);

  return result;
}
