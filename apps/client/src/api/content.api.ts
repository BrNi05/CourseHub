import { news } from '@coursehub/sdk';

import { apiOptions } from './api';

export async function fetchNews(): Promise<string[]> {
  const response = await news(apiOptions());
  return response.data;
}
