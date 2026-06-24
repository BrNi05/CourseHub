import { isAxiosError } from 'axios';
import { reactive } from 'vue';

import { fetchOwnCreditProfile } from '../../api/averages.api';
import { handleUnauthorized } from './auth.store';
import { pushNotice } from './notifications.store';
import type { AveragesCalculation } from '@coursehub/sdk';

type AveragesState = {
  ownCreditProfile: AveragesCalculation | null;
  ownCreditProfileLoaded: boolean;
  loadingOwnCreditProfile: boolean;
};

export const averagesState = reactive<AveragesState>({
  ownCreditProfile: null,
  ownCreditProfileLoaded: false,
  loadingOwnCreditProfile: false,
});

let ownCreditProfilePromise: Promise<AveragesCalculation | null> | null = null;

export function clearOwnCreditProfile(): void {
  averagesState.ownCreditProfile = null;
  averagesState.ownCreditProfileLoaded = false;
}

export function applyOwnCreditProfile(profile: AveragesCalculation): void {
  averagesState.ownCreditProfile = profile;
  averagesState.ownCreditProfileLoaded = true;
}

export async function loadOwnCreditProfile(): Promise<AveragesCalculation | null> {
  if (averagesState.ownCreditProfileLoaded) return averagesState.ownCreditProfile;

  if (ownCreditProfilePromise !== null) return ownCreditProfilePromise;

  averagesState.loadingOwnCreditProfile = true;

  ownCreditProfilePromise = (async (): Promise<AveragesCalculation | null> => {
    try {
      const profile: AveragesCalculation = await fetchOwnCreditProfile();
      applyOwnCreditProfile(profile);
      return profile;
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        handleUnauthorized();
        return null;
      }

      pushNotice('danger', 'Nem sikerült betölteni az adatokat', 'Próbáld újra később!');
      return null;
    } finally {
      averagesState.loadingOwnCreditProfile = false;
      ownCreditProfilePromise = null;
    }
  })();

  return ownCreditProfilePromise;
}
