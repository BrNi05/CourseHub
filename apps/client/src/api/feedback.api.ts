import {
  errorReport,
  suggest,
  type CreateSuggestionDto,
  type ErrorReportDto,
} from '@coursehub/sdk';

import { apiOptions } from './api';

export async function submitSuggestionRequest(payload: CreateSuggestionDto): Promise<void> {
  await suggest({
    ...apiOptions(),
    body: payload,
  });
}

export async function submitErrorReportRequest(payload: ErrorReportDto): Promise<void> {
  await errorReport({
    ...apiOptions(),
    body: payload,
  });
}
