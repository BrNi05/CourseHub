import type { Reflector } from '@nestjs/core';
import { describe, expect, it } from 'vitest';

import { ThrottleGuard } from './throttler.guard.js';

describe('ThrottleGuard', () => {
  it('prefers the Cloudflare IP header over Express IP values', async () => {
    const guard = new ThrottleGuard({} as never, {} as never, {} as Reflector);

    const tracker = await (
      guard as never as { getTracker: (req: object) => Promise<string> }
    ).getTracker({
      headers: { 'cf-connecting-ip': '203.0.113.30' },
      ip: '10.0.0.1',
      socket: { remoteAddress: '127.0.0.1' },
    });

    expect(tracker).toBe('203.0.113.30');
  });

  it('falls back to req.ip and then the socket remote address', async () => {
    const guard = new ThrottleGuard({} as never, {} as never, {} as Reflector);

    const ipTracker = await (
      guard as never as { getTracker: (req: object) => Promise<string> }
    ).getTracker({
      headers: {},
      ip: '10.0.0.2',
      socket: { remoteAddress: '127.0.0.1' },
    });

    const remoteAddressTracker = await (
      guard as never as { getTracker: (req: object) => Promise<string> }
    ).getTracker({
      headers: {},
      socket: { remoteAddress: '127.0.0.1' },
    });

    expect(ipTracker).toBe('10.0.0.2');
    expect(remoteAddressTracker).toBe('127.0.0.1');
  });
});
