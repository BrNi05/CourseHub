import { search, type Course } from '@coursehub/sdk';

import { apiOptions } from './api';
import type { SearchFilters } from '../stores/shared/types';

export async function searchCoursesByFilters(filters: SearchFilters): Promise<Course[]> {
  const response = await search({
    ...apiOptions(),
    query: {
      universityId: filters.universityId,
      courseName: filters.courseName.trim() || undefined,
      courseCode: filters.courseCode.trim() || undefined,
    },
  });

  return response.data;
}
