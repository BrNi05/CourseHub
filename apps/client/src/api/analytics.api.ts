import { ping } from '@coursehub/sdk';

import { apiOptions } from './api';
import type { ClientPlatform } from '@/utils/client-runtime';

export async function sendClientPing(platform: ClientPlatform, version: string) {
  await ping({
    ...apiOptions(),
    body: {
      platform,
      version,
    },
  });
}
