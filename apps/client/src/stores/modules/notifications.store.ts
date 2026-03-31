import { reactive } from 'vue';

import type { Notice, NoticeTone } from '../shared/types';

const TOAST_DURATION_MS = 2400;
const MAX_VISIBLE_NOTIFICATIONS = 3;

export const notificationsState = reactive({ notices: [] as Notice[] });

let noticeSequence = 1;

export function dismissNotice(id: number) {
  notificationsState.notices = notificationsState.notices.filter((notice) => notice.id !== id);
}

export function pushNotice(tone: NoticeTone, title: string, detail: string) {
  const notice: Notice = {
    id: noticeSequence++,
    tone,
    title,
    detail,
    durationMs: TOAST_DURATION_MS,
  };

  const visibleNotifications = notificationsState.notices.slice(-(MAX_VISIBLE_NOTIFICATIONS - 1));
  notificationsState.notices = [...visibleNotifications, notice];

  globalThis.setTimeout(() => {
    dismissNotice(notice.id);
  }, TOAST_DURATION_MS);
}

export function notify(tone: NoticeTone, title: string, detail: string) {
  pushNotice(tone, title, detail);
}
