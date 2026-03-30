import { isAxiosError } from 'axios';
import { reactive } from 'vue';

import { getErrorMessage } from '../shared/errors';
import { hydrateFromStorage, setupPersistence } from '../shared/storage';
import type { SearchFilters } from '../shared/types';
import { searchCoursesByFilters } from '../../api/courses.api';
import { fetchCurrentUser, updateCurrentUserPinnedCourses } from '../../api/user.api';
import { dedupeCourses } from '../helpers/course.utils';
import { authState, handleUnauthorized } from './auth.store';
import { pushNotice } from './notifications.store';
import { applyUserResponse } from './user.store';
import type { Course } from '@coursehub/sdk';

type CoursesState = {
  searchFilters: SearchFilters;
  searchResults: Course[];
  searchingCourses: boolean;
  selectedCourses: Course[];
  syncingCourses: boolean;
};

export const coursesState = reactive<CoursesState>({
  searchFilters: {
    universityId: '',
    courseName: '',
    courseCode: '',
  } as SearchFilters,
  searchResults: [] as Course[],
  searchingCourses: false,
  selectedCourses: hydrateFromStorage(),
  syncingCourses: false,
});

setupPersistence((): Course[] => [...coursesState.selectedCourses]);

export function replaceSelectedCourses(courses: Course[]): void {
  coursesState.selectedCourses = dedupeCourses(courses);
}

export function clearSelectedCourses(): void {
  coursesState.selectedCourses = [];
}

async function reloadPinnedCoursesFromServer(userId: string): Promise<boolean> {
  try {
    const user = await fetchCurrentUser(userId);
    const { selectedCourses } = applyUserResponse(user);

    replaceSelectedCourses(selectedCourses);
    return true;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) {
      handleUnauthorized();
      return false;
    }

    return false;
  }
}

export async function syncPinnedCourses(
  ids: string[],
  successTitle: string,
  successDetail: string
): Promise<void> {
  const userId = authState.session.userId;

  if (!userId) {
    pushNotice(
      'info',
      successTitle,
      'A választásaid a mentésre kerültek a böngésződben. Jelentkezz be, hogy minden eszközödön elérhesd őket.'
    );
    return;
  }

  coursesState.syncingCourses = true;

  try {
    const user = await updateCurrentUserPinnedCourses(userId, ids);
    const { selectedCourses } = applyUserResponse(user);

    replaceSelectedCourses(selectedCourses);
    pushNotice('success', successTitle, successDetail);
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) {
      handleUnauthorized();
      return;
    }

    const restored = await reloadPinnedCoursesFromServer(userId);

    pushNotice(
      'danger',
      'Sikertelen szinkronizáció',
      restored
        ? 'A szerveren tárolt választásaid visszaállításra kerültek.'
        : 'A szerveren tárolt választásaid visszaállítása nem sikerült. Kérlek próbáld újra később.'
    );
  } finally {
    coursesState.syncingCourses = false;
  }
}

export async function searchCourses(): Promise<void> {
  if (!coursesState.searchFilters.universityId) {
    pushNotice(
      'info',
      'Válassz egy egyetemet',
      'A keresési művelet adott egyetem tárgyain fog futni.'
    );
    return;
  }

  coursesState.searchingCourses = true;

  try {
    coursesState.searchResults = await searchCoursesByFilters(coursesState.searchFilters);
  } catch (error) {
    pushNotice('danger', 'Nem sikerült keresni a tárgyak között', getErrorMessage(error));
  } finally {
    coursesState.searchingCourses = false;
  }
}

export async function addCourse(course: Course): Promise<void> {
  replaceSelectedCourses([...coursesState.selectedCourses, course]);

  await syncPinnedCourses(
    coursesState.selectedCourses.map((entry) => String(entry.id)),
    'Tárgy felvéve',
    `A(z) ${course.name} tárgyat inenntől láthatod a főoldalon.`
  );
}

export async function removeCourse(courseId: string): Promise<void> {
  const removedCourse = coursesState.selectedCourses.find((course) => course.id === courseId);

  coursesState.selectedCourses = coursesState.selectedCourses.filter(
    (course) => course.id !== courseId
  );

  await syncPinnedCourses(
    coursesState.selectedCourses.map((entry) => String(entry.id)),
    'Tárgy eltávolítva',
    removedCourse
      ? `A(z) ${removedCourse.name} tárgy törölve lett a felvettek közül.`
      : 'A tárgy törölve lett a felvettek közül.'
  );
}
