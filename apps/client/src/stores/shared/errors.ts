import { isAxiosError } from 'axios';

export function getErrorMessage(
  error: unknown,
  fallback: string = 'A művelet sikertelen. Próbáld meg kicsit később.'
) {
  if (isAxiosError(error)) {
    const backendMessage = error.response?.data;

    if (backendMessage && typeof backendMessage === 'object' && 'message' in backendMessage) {
      const message = backendMessage.message;

      if (typeof message === 'string') return message;

      if (Array.isArray(message)) {
        const normalized = message.filter((item): item is string => typeof item === 'string');

        if (normalized.length > 0) return normalized.join('\n\n');
      }
    }

    if (typeof backendMessage === 'string' && backendMessage.trim().length > 0) {
      return backendMessage;
    }

    return error.message || fallback;
  }

  if (error instanceof Error) return error.message;

  return fallback;
}
