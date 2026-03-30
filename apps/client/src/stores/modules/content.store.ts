import { reactive } from 'vue';

import { getErrorMessage } from '../shared/errors';
import { fetchNews } from '../../api/content.api';
import { normalizeNewsItems } from '../helpers/news.utils';
import { pushNotice } from './notifications.store';

export const contentState = reactive({
  news: [] as string[],
});

export async function loadNews(): Promise<void> {
  try {
    contentState.news = normalizeNewsItems(await fetchNews());
  } catch (error) {
    pushNotice('danger', 'Nem sikerült betölteni a híreket', getErrorMessage(error));
  }
}
