import { reactive } from 'vue';

import { pingClient } from './modules/analytics.store';
import { consumePendingLoginResult } from './modules/auth.store';
import { loadNews } from './modules/content.store';
import { coursesState, replaceSelectedCourses } from './modules/courses.store';
import { pushNotice } from './modules/notifications.store';
import { loadCurrentUser } from './modules/user.store';

export const appLifecycleState = reactive({ initialized: false });

let initializePromise: Promise<void> | null = null;

export async function initialize(): Promise<void> {
  if (appLifecycleState.initialized) return;

  if (initializePromise !== null) {
    await initializePromise;
    return;
  }

  initializePromise = (async () => {
    const pendingLoginResult = consumePendingLoginResult();
    const hasLocalDraft = coursesState.selectedCourses.length > 0;
    const newsPromise = loadNews();

    try {
      const userResult = await loadCurrentUser(false);

      if (userResult) {
        replaceSelectedCourses(userResult.selectedCourses);

        if (pendingLoginResult === 'success') {
          pushNotice('success', 'Bejelentkezve', 'Mentett tárgyak betöltve.');
        }

        await pingClient();
      } else if (pendingLoginResult === 'success') {
        pushNotice(
          'danger',
          'A bejelentkezés nem sikerült',
          'Ellenőrizd a sütibeállításokat, majd próbáld újra.'
        );
      } else if (hasLocalDraft) {
        pushNotice(
          'info',
          'Helyi mentés betöltve',
          'A helyi mentésed betöltöttük. Jelentkezz be, hogy szinkronizáld a tárgyaidat.'
        );
      }

      await newsPromise;
      appLifecycleState.initialized = true;
    } finally {
      initializePromise = null;
    }
  })();

  await initializePromise;
}
