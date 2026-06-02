import { isAxiosError } from 'axios';
import { reactive } from 'vue';

import { getErrorMessage } from '../shared/errors';
import { fetchCurrentUser } from '../../api/user.api';
import { dedupeCourses } from '../helpers/course.utils';
import { handleUnauthorized, setAuthenticatedSession } from './auth.store';
import { pushNotice } from './notifications.store';
import type { Course, User } from '@coursehub/sdk';

export const userState = reactive({ currentUser: null as User | null });

export type UserLoadResult = {
  user: User;
  selectedCourses: Course[];
};

export function clearCurrentUser(): void {
  userState.currentUser = null;
}

export function applyUserResponse(user: User): UserLoadResult {
  userState.currentUser = user;
  setAuthenticatedSession(user.googleEmail);

  return { user, selectedCourses: dedupeCourses(user.pinnedCourses ?? []) };
}

export async function loadCurrentUser(
  notifyOnUnauthorized: boolean = true
): Promise<UserLoadResult | null> {
  try {
    const user = await fetchCurrentUser();
    return applyUserResponse(user);
  } catch (error) {
    clearCurrentUser();

    if (isAxiosError(error) && error.response?.status === 401) {
      handleUnauthorized(notifyOnUnauthorized);
      return null;
    }

    pushNotice('danger', 'Nem sikerült betölteni a tárgyaidat', getErrorMessage(error));
    return null;
  }
}
