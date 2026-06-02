import { isAxiosError } from 'axios';

import { CLIENT_VERSION, getClientPlatform, type ClientPlatform } from '@/utils/client-runtime';

import { PING_STORAGE_KEY } from '../shared/storage';
import type { PingRegistry } from '../shared/types';
import { sendClientPing } from '../../api/analytics.api';
import { authState, handleUnauthorized } from './auth.store';

function pingDayKey(now: Date = new Date()) {
  return now.toISOString().slice(0, 10);
}

export function pingStorageKey(platform: ClientPlatform, day: string = pingDayKey()) {
  return `${platform}:${day}`;
}

export function readPingRegistry(): PingRegistry {
  const savedRegistry = globalThis.localStorage.getItem(PING_STORAGE_KEY);

  if (!savedRegistry) return {};

  try {
    const parsed: unknown = JSON.parse(savedRegistry);

    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const registry: PingRegistry = {};

      for (const [key, value] of Object.entries(parsed)) {
        if (value === true) registry[key] = true;
      }

      return registry;
    }
  } catch {
    // Fall through and reset invalid storage
  }

  globalThis.localStorage.removeItem(PING_STORAGE_KEY);
  return {};
}

export function writePingRegistry(registry: PingRegistry) {
  const today = pingDayKey();
  const entries: PingRegistry = {};

  for (const key of Object.keys(registry)
    .filter((entry) => entry.endsWith(`:${today}`))
    .slice(-20)) {
    entries[key] = true;
  }

  globalThis.localStorage.setItem(PING_STORAGE_KEY, JSON.stringify(entries));
}

export function hasPingedToday(platform: ClientPlatform) {
  const registry = readPingRegistry();
  return registry[pingStorageKey(platform)] === true;
}

export function markPingedToday(platform: ClientPlatform) {
  const registry = readPingRegistry();
  registry[pingStorageKey(platform)] = true;
  writePingRegistry(registry);
}

export async function pingClient(): Promise<void> {
  if (!authState.session.authenticated) return;

  const platform = getClientPlatform();

  if (hasPingedToday(platform)) return;

  try {
    await sendClientPing(platform, CLIENT_VERSION);
    markPingedToday(platform);
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) {
      handleUnauthorized();
      return;
    }

    // eslint-disable-next-line no-console
    console.error('Failed to send client ping.', error);
  }
}
