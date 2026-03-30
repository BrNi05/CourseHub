import { isAxiosError } from 'axios';
import { reactive } from 'vue';

import { getErrorMessage } from '../shared/errors';
import { submitErrorReportRequest, submitSuggestionRequest } from '../../api/feedback.api';
import { handleUnauthorized, isAuthenticated } from './auth.store';
import { pushNotice } from './notifications.store';
import type { CreateSuggestionDto, ErrorReportDto } from '@coursehub/sdk';

export const feedbackState = reactive({
  submittingErrorReport: false,
  submittingSuggestion: false,
});

export async function submitSuggestion(payload: CreateSuggestionDto): Promise<boolean> {
  if (!isAuthenticated()) {
    pushNotice('info', 'Bejelentkezés szükséges', 'Jelentkezz be a javaslat elküldése előtt.');
    return false;
  }

  feedbackState.submittingSuggestion = true;

  try {
    await submitSuggestionRequest(payload);
    pushNotice(
      'success',
      'Javaslat elküldve',
      'A javaslat sikeresen elküldve, és hamarosan feldolgozásra kerül.'
    );
    return true;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) {
      handleUnauthorized();
      return false;
    }

    pushNotice('danger', 'Nem sikerült elküldeni a javaslatot', getErrorMessage(error));
    return false;
  } finally {
    feedbackState.submittingSuggestion = false;
  }
}

export async function submitErrorReport(payload: ErrorReportDto): Promise<boolean> {
  if (!isAuthenticated()) {
    pushNotice('info', 'Bejelentkezés szükséges', 'Jelentkezz be a hibajelentés elküldése előtt.');
    return false;
  }

  feedbackState.submittingErrorReport = true;

  try {
    await submitErrorReportRequest(payload);
    pushNotice(
      'success',
      'Hibajelentés elküldve',
      'A hibajelentés sikeresen elküldve, és hamarosan feldolgozásra kerül.'
    );
    return true;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) {
      handleUnauthorized();
      return false;
    }

    pushNotice(
      'danger',
      'Nem sikerült elküldeni a hibajelentést. Ironikus, nemde?',
      getErrorMessage(error)
    );
    return false;
  } finally {
    feedbackState.submittingErrorReport = false;
  }
}
