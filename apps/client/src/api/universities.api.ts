import { findAll, type UniversityWithoutFacultiesDto } from '@coursehub/sdk';

import { apiOptions } from './api';

export async function fetchUniversities(): Promise<UniversityWithoutFacultiesDto[]> {
  const response = await findAll(apiOptions());
  return response.data;
}
