import clientPackage from '../../package.json';

export type ClientPlatform = 'windows' | 'linux' | 'macos' | 'android' | 'ios';

const CLIENT_PLATFORMS: ClientPlatform[] = ['windows', 'linux', 'macos', 'android', 'ios'];

let cachedPlatform: ClientPlatform | null = null;

export const CLIENT_VERSION = clientPackage.version;

export function getClientPlatform(): ClientPlatform {
  if (cachedPlatform) return cachedPlatform;

  const userAgent = globalThis.navigator.userAgent.toLowerCase();

  if (userAgent.includes('android')) {
    cachedPlatform = 'android';
    return cachedPlatform;
  }

  if (userAgent.includes('iphone') || userAgent.includes('ipad') || userAgent.includes('ipod')) {
    cachedPlatform = 'ios';
    return cachedPlatform;
  }

  if (userAgent.includes('mac')) {
    cachedPlatform = 'macos';
    return cachedPlatform;
  }

  if (userAgent.includes('win')) {
    cachedPlatform = 'windows';
    return cachedPlatform;
  }

  if (userAgent.includes('linux') || userAgent.includes('x11')) {
    cachedPlatform = 'linux';
    return cachedPlatform;
  }

  // Pick a random platform, so analytics stay useful
  // Backend cannot accept null
  // This fallback is basically impossible to happen
  cachedPlatform = CLIENT_PLATFORMS[Math.floor(Math.random() * CLIENT_PLATFORMS.length)]!;

  return cachedPlatform;
}

export function isMobileClientPlatform(): boolean {
  const platform = getClientPlatform();
  return platform === 'android' || platform === 'ios';
}

export function isPWA(): boolean {
  const isStandaloneDisplayMode =
    globalThis.matchMedia?.('(display-mode: standalone)').matches ||
    globalThis.matchMedia?.('(display-mode: fullscreen)').matches ||
    globalThis.matchMedia?.('(display-mode: minimal-ui)').matches;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isIOSStandalone = (globalThis.navigator as any)?.standalone === true;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return isStandaloneDisplayMode || isIOSStandalone;
}
