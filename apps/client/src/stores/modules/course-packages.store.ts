import { isAxiosError } from 'axios';
import { reactive } from 'vue';

import { fetchMyCoursePackages } from '../../api/course-packages.api';
import { handleUnauthorized } from './auth.store';
import { pushNotice } from './notifications.store';
import type { CoursePackage } from '@coursehub/sdk';

type CoursePackagesState = {
  myPackages: CoursePackage[];
  myPackagesLoaded: boolean;
  loadingMyPackages: boolean;
};

export const coursePackagesState = reactive<CoursePackagesState>({
  myPackages: [],
  myPackagesLoaded: false,
  loadingMyPackages: false,
});

let myPackagesPromise: Promise<CoursePackage[]> | null = null;

export function clearMyCoursePackages(): void {
  coursePackagesState.myPackages = [];
  coursePackagesState.myPackagesLoaded = false;
}

export function replaceMyCoursePackages(packages: CoursePackage[]): void {
  coursePackagesState.myPackages = packages;
  coursePackagesState.myPackagesLoaded = true;
}

export async function loadMyCoursePackages(): Promise<CoursePackage[]> {
  if (coursePackagesState.myPackagesLoaded) return coursePackagesState.myPackages;

  if (myPackagesPromise !== null) return myPackagesPromise;

  coursePackagesState.loadingMyPackages = true;

  myPackagesPromise = (async (): Promise<CoursePackage[]> => {
    try {
      const packages: CoursePackage[] = await fetchMyCoursePackages();
      replaceMyCoursePackages(packages);
      return packages;
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        clearMyCoursePackages();
        handleUnauthorized();
        return [];
      }

      pushNotice('danger', 'Nem sikerült betölteni a csomagjaidat', 'Próbáld újra később!');
      return [];
    } finally {
      coursePackagesState.loadingMyPackages = false;
      myPackagesPromise = null;
    }
  })();

  return myPackagesPromise;
}
