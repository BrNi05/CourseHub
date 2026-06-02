import { reactive } from 'vue';

import { pingClient } from './modules/analytics.store';
import { loadNews } from './modules/content.store';
import {
  coursesState,
  replaceSelectedCourses,
  updateRemotePinnedCoursesAfterLogin,
} from './modules/courses.store';
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
    const hasLocalDraft = coursesState.selectedCourses.length > 0;
    const newsPromise = loadNews();

    try {
      const serverUser = await loadCurrentUser(false);

      if (serverUser) {
        if (hasLocalDraft && serverUser.selectedCourses.length === 0) {
          await updateRemotePinnedCoursesAfterLogin();
        } else {
          replaceSelectedCourses(serverUser.selectedCourses);
        }

        await pingClient();
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
