import type { Course } from '@coursehub/sdk';

import { watch } from 'vue';

import { dedupeCourses } from '../helpers/course.utils';

export const DRAFT_STORAGE_KEY = 'coursehub.web.draft-courses';
export const PING_STORAGE_KEY = 'coursehub.web.client-pings';

function isStoredCourseArray(value: unknown): value is Course[] {
  return Array.isArray(value);
}

export function hydrateFromStorage(): Course[] {
  if (globalThis.window === undefined) return [];

  const savedDraft = globalThis.localStorage.getItem(DRAFT_STORAGE_KEY);

  if (!savedDraft) return [];

  try {
    const parsed: unknown = JSON.parse(savedDraft);

    if (!isStoredCourseArray(parsed)) {
      globalThis.localStorage.removeItem(DRAFT_STORAGE_KEY);
      return [];
    }

    const courses: Course[] = dedupeCourses(parsed);
    return courses;
  } catch {
    globalThis.localStorage.removeItem(DRAFT_STORAGE_KEY);
    return [];
  }
}

export function setupPersistence(source: () => Course[]) {
  watch(
    source,
    (courses) => {
      if (globalThis.window === undefined) return;

      globalThis.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(courses));
    },
    { deep: true, immediate: true }
  );
}
