export function apiOptions() {
  return {
    baseURL: '/api',
    withCredentials: true,
    throwOnError: true as const,
  };
}
