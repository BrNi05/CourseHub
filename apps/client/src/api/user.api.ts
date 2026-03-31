import { readOne, updatePinnedCourses, type User } from '@coursehub/sdk';

import { apiOptions } from './api';

export async function fetchCurrentUser(userId: string): Promise<User> {
  const response = await readOne({
    ...apiOptions(),
    path: { id: userId },
  });

  return response.data;
}

export async function updateCurrentUserPinnedCourses(
  userId: string,
  pinnedCourses: string[]
): Promise<User> {
  const response = await updatePinnedCourses({
    ...apiOptions(),
    body: { pinnedCourses },
    path: { id: userId },
  });

  return response.data;
}
