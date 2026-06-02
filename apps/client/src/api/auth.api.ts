import { logout as logoutRequest } from '@coursehub/sdk';

import { apiOptions } from './api';

export async function logoutSession(): Promise<void> {
  await logoutRequest(apiOptions());
}

export function consumeLoginResultFromUrl(): string | null {
  const result = new URLSearchParams(globalThis.location.search).get('login');
  const url = new URL(globalThis.location.href);

  url.searchParams.delete('login');
  globalThis.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);

  return result;
}
