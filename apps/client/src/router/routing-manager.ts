import type { Router } from 'vue-router';

const ROUTE_INTENT_STORAGE_KEY = 'coursehub.web.route-intent';

// Ensures that the provided route is a valid internal route and normalizes it to a consistent format
function normalizeCourseHubRoute(value: string): string | null {
  try {
    const url = new URL(value, globalThis.window.location.origin);

    if (url.origin !== globalThis.window.location.origin) return null;

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

// Stores the intended route in localStorage to be used for redirection after authentication
export function rememberRouteIntent(routeTarget: string): void {
  const normalizedRoute = normalizeCourseHubRoute(routeTarget);
  if (!normalizedRoute) return;

  globalThis.localStorage.setItem(ROUTE_INTENT_STORAGE_KEY, normalizedRoute);
}

// Attempts to redirect the user to the remembered route if it exists and is valid
export async function redirectToRememberedRoute(router: Router): Promise<boolean> {
  const savedRoute = globalThis.localStorage.getItem(ROUTE_INTENT_STORAGE_KEY);
  if (!savedRoute) return false;

  const normalizedRoute = normalizeCourseHubRoute(savedRoute);

  if (!normalizedRoute) {
    globalThis.localStorage.removeItem(ROUTE_INTENT_STORAGE_KEY);
    return false;
  }

  const resolvedRoute = router.resolve(normalizedRoute);
  const hasConcreteMatch = resolvedRoute.matched.some(
    (record) => record.path !== '/:pathMatch(.*)*'
  );

  if (!hasConcreteMatch || resolvedRoute.fullPath === router.currentRoute.value.fullPath) {
    globalThis.localStorage.removeItem(ROUTE_INTENT_STORAGE_KEY);
    return false;
  }

  try {
    await router.replace(normalizedRoute);
    return true;
  } finally {
    globalThis.localStorage.removeItem(ROUTE_INTENT_STORAGE_KEY);
  }
}
