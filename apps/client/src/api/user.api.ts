import { deleteOwn, readOwnOne, updateOwnPinnedCourses, type User } from '@coursehub/sdk';

import { apiOptions } from './api';

export async function fetchCurrentUser(): Promise<User> {
  return (await readOwnOne(apiOptions())).data;
}

export async function updateCurrentUserPinnedCourses(pinnedCourses: string[]): Promise<User> {
  const response = await updateOwnPinnedCourses({
    ...apiOptions(),
    body: { pinnedCourses },
  });

  return response.data;
}

export async function deleteCurrentUserProfile(): Promise<void> {
  await deleteOwn(apiOptions());
}
