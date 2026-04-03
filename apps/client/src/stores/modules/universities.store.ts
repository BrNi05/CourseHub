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

      // If the saved university ID is not in the loaded universities, reset it to the first university or empty
      const selectedUniversityId = coursesState.searchFilters.universityId;
      const hasSavedUniversity =
        selectedUniversityId.length > 0 &&
        universitiesState.universities.some((university) => university.id === selectedUniversityId);
      const [firstUniversity] = universitiesState.universities;

      if (selectedUniversityId && !hasSavedUniversity) coursesState.searchFilters.universityId = '';
      else if (!selectedUniversityId && firstUniversity) {
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
