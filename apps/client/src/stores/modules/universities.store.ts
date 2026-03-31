import { reactive } from 'vue';

import { getErrorMessage } from '../shared/errors';
import { fetchUniversities } from '../../api/universities.api';
import { coursesState } from './courses.store';
import { pushNotice } from './notifications.store';
import type { UniversityWithoutFacultiesDto } from '@coursehub/sdk';

export const universitiesState = reactive({
  loadingUniversities: false,
  universities: [] as UniversityWithoutFacultiesDto[],
});

let universitiesPromise: Promise<void> | null = null;

export function selectedUniversity(): UniversityWithoutFacultiesDto | null {
  return (
    universitiesState.universities.find(
      (university) => university.id === coursesState.searchFilters.universityId
    ) ?? null
  );
}

export async function loadUniversities(): Promise<void> {
  if (universitiesState.universities.length > 0) return;

  if (universitiesPromise !== null) {
    await universitiesPromise;
    return;
  }

  universitiesPromise = (async () => {
    universitiesState.loadingUniversities = true;

    try {
      universitiesState.universities = await fetchUniversities();

      const [firstUniversity] = universitiesState.universities;

      if (!coursesState.searchFilters.universityId && firstUniversity) {
        coursesState.searchFilters.universityId = firstUniversity.id;
      }
    } catch (error) {
      pushNotice('danger', 'Nem sikerült betölteni az egyetemeket', getErrorMessage(error));
    } finally {
      universitiesState.loadingUniversities = false;
      universitiesPromise = null;
    }
  })();

  await universitiesPromise;
}
