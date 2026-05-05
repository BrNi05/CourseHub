import {
  deleteOwnCredits,
  findOwnCredits,
  updateOwnCredits,
  type AveragesCalculation,
} from '@coursehub/sdk';

import { apiOptions } from './api';

export async function fetchOwnCreditProfile(): Promise<AveragesCalculation> {
  const response = await findOwnCredits(apiOptions());
  return response.data;
}

export async function saveOwnCreditProfile(
  data: Record<string, unknown>
): Promise<AveragesCalculation> {
  const response = await updateOwnCredits({
    ...apiOptions(),
    body: data,
  });

  return response.data;
}

export async function deleteOwnCreditProfile(): Promise<void> {
  await deleteOwnCredits(apiOptions());
}
