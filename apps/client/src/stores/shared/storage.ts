import type { Course } from '@coursehub/sdk';

import { watch } from 'vue';

import { dedupeCourses } from '../helpers/course.utils';

export const DRAFT_STORAGE_KEY = 'coursehub.web.draft-courses';
export const PING_STORAGE_KEY = 'coursehub.web.client-pings';
export const SEARCH_UNIVERSITY_STORAGE_KEY = 'coursehub.web.search-university-id';

function isStoredCourseArray(value: unknown): value is Course[] {
  return Array.isArray(value);
}

export function hydrateFromStorage(): Course[] {
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
      globalThis.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(courses));
    },
    { deep: true, immediate: true }
  );
}

export function hydrateSearchUniversityId(): string | null {
  const savedUniversityId = globalThis.localStorage.getItem(SEARCH_UNIVERSITY_STORAGE_KEY);
  return savedUniversityId || null;
}

export function persistSearchUniversityId(universityId: string): void {
  if (!universityId) {
    globalThis.localStorage.removeItem(SEARCH_UNIVERSITY_STORAGE_KEY);
    return;
  }

  globalThis.localStorage.setItem(SEARCH_UNIVERSITY_STORAGE_KEY, universityId);
}
