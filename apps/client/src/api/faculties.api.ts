import { getAll as getFacultiesRequest, type FacultyWithoutCoursesDto } from '@coursehub/sdk';

import { apiOptions } from './api';

export async function fetchFacultiesByUniversity(
  universityId: string
): Promise<FacultyWithoutCoursesDto[]> {
  const response = await getFacultiesRequest({
    ...apiOptions(),
    query: { universityId },
  });

  return response.data;
}
