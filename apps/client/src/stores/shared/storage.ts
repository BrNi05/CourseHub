import type { Course } from '@coursehub/sdk';

import { watch } from 'vue';

import { dedupeCourses } from '../helpers/course.utils';

export const DRAFT_STORAGE_KEY = 'coursehub.web.draft-courses';
export const PING_STORAGE_KEY = 'coursehub.web.client-pings';
export const SEARCH_UNIVERSITY_STORAGE_KEY = 'coursehub.web.search-university-id';
export const AVERAGES_CALCULATOR_STORAGE_KEY = 'coursehub.web.averages-calculator';
export const AVERAGES_CALCULATOR_DIRTY_STORAGE_KEY = 'coursehub.web.averages-calculator.dirty';
export const COOKIE_BANNER_ACCEPTED_STORAGE_KEY = 'coursehub.web.cookieBannerAccepted';
export const PWA_INSTALL_PROMPT_CLOSED_STORAGE_KEY = 'coursehub.web.pwaInstallPromptClosed';
export const COURSEHUB_BROWSER_STATE_CLEARED_EVENT = 'coursehub:browser-state-cleared';

const COURSEHUB_BROWSER_STATE_KEYS = [
  AVERAGES_CALCULATOR_STORAGE_KEY,
  AVERAGES_CALCULATOR_DIRTY_STORAGE_KEY,
  PING_STORAGE_KEY,
  COOKIE_BANNER_ACCEPTED_STORAGE_KEY,
  DRAFT_STORAGE_KEY,
  PWA_INSTALL_PROMPT_CLOSED_STORAGE_KEY,
  SEARCH_UNIVERSITY_STORAGE_KEY,
];

const LOCAL_SAVE_STORAGE_KEYS = new Set([
  AVERAGES_CALCULATOR_STORAGE_KEY,
  AVERAGES_CALCULATOR_DIRTY_STORAGE_KEY,
  DRAFT_STORAGE_KEY,
  SEARCH_UNIVERSITY_STORAGE_KEY,
]);

type ClearCourseHubBrowserStateOptions = {
  clearCookieAccepted?: boolean;
  keepLocalSaves?: boolean;
};

export function clearCourseHubBrowserState(options: ClearCourseHubBrowserStateOptions = {}): void {
  const { clearCookieAccepted = true, keepLocalSaves = false } = options;

  for (const key of COURSEHUB_BROWSER_STATE_KEYS) {
    if (!clearCookieAccepted && key === COOKIE_BANNER_ACCEPTED_STORAGE_KEY) continue;
    if (keepLocalSaves && LOCAL_SAVE_STORAGE_KEYS.has(key)) continue;
    globalThis.localStorage.removeItem(key);
  }

  globalThis.dispatchEvent(
    new CustomEvent(COURSEHUB_BROWSER_STATE_CLEARED_EVENT, {
      detail: { keepLocalSaves },
    })
  );
}

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
      if (courses.length === 0) {
        globalThis.localStorage.removeItem(DRAFT_STORAGE_KEY);
        return;
      }

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
