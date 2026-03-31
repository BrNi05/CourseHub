import { getClientPlatform } from './client-runtime';

const MOODLE_FALLBACK_DELAY_MS = 500;

function isMobilePlatform() {
  const platform = getClientPlatform();
  return platform === 'android' || platform === 'ios';
}

function createMoodleAppUrl(webUrl: string) {
  return `moodlemobile://link=${webUrl}`;
}

export function shouldUseMoodleAppRedirect(webUrl?: string) {
  return Boolean(webUrl) && isMobilePlatform();
}

export function openMoodleLink(webUrl: string) {
  if (!shouldUseMoodleAppRedirect(webUrl)) {
    globalThis.location.assign(webUrl);
    return;
  }

  let appLaunchDetected = false;

  const markAppLaunch = () => {
    appLaunchDetected = true;
  };

  const onVisibilityChange = () => {
    if (document.visibilityState === 'hidden') markAppLaunch();
  };

  const cleanup = () => {
    document.removeEventListener('visibilitychange', onVisibilityChange);
    globalThis.removeEventListener('pagehide', markAppLaunch);
    globalThis.removeEventListener('blur', markAppLaunch);
  };

  // Heuristics to detect if the Moodle app was launched successfully
  document.addEventListener('visibilitychange', onVisibilityChange);
  globalThis.addEventListener('pagehide', markAppLaunch, { once: true });
  globalThis.addEventListener('blur', markAppLaunch, { once: true });

  globalThis.location.href = createMoodleAppUrl(webUrl);

  globalThis.setTimeout(() => {
    cleanup();

    if (!appLaunchDetected) globalThis.location.assign(webUrl);
  }, MOODLE_FALLBACK_DELAY_MS);
}
