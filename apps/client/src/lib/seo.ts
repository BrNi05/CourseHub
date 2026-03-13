const SITE_NAME = 'CourseHub';

// SEO config for a page
export type RouteSeo = {
  title: string;
  description: string;
  robots?: string;
  canonicalPath?: string;
};

// Default SEO values
export const defaultSeo: RouteSeo = {
  title: SITE_NAME,
  description: 'Egyetemi tárgyak, egyszerűen.',
};

export const SITE_URL = 'https://coursehub.hu';

// Upsert a meta tag with the given attribute and value, and return it
function upsertMeta(attribute: 'name' | 'property', value: string): HTMLMetaElement {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${value}"]`);

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, value);
    document.head.appendChild(element);
  }

  return element;
}

// Upsert a link tag with the given rel, and return it
function upsertLink(rel: string): HTMLLinkElement {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);

  if (!element) {
    element = document.createElement('link');
    element.rel = rel;
    document.head.appendChild(element);
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return element;
}

// Set the content of a meta tag with the given attribute and value, creating it if it doesn't exist
function setMeta(attribute: 'name' | 'property', value: string, content: string) {
  upsertMeta(attribute, value).content = content;
}

// Apply new SEO values after page change
export function applySeo(routeSeo: RouteSeo, currentPath: string) {
  const pageTitle = routeSeo.title === SITE_NAME ? SITE_NAME : `${routeSeo.title} | ${SITE_NAME}`;
  const canonicalUrl = new URL(routeSeo.canonicalPath ?? currentPath, `${SITE_URL}/`).toString();
  const imageUrl = new URL('/logo.png', `${SITE_URL}/`).toString();
  const robots = routeSeo.robots ?? 'index,follow';

  document.title = pageTitle;

  setMeta('name', 'description', routeSeo.description);
  setMeta('name', 'robots', robots);
  setMeta('property', 'og:type', 'website');
  setMeta('property', 'og:site_name', SITE_NAME);
  setMeta('property', 'og:title', pageTitle);
  setMeta('property', 'og:description', routeSeo.description);
  setMeta('property', 'og:url', canonicalUrl);
  setMeta('property', 'og:image', imageUrl);
  setMeta('property', 'og:image:alt', 'CourseHub logo');
  setMeta('name', 'twitter:card', 'summary');
  setMeta('name', 'twitter:title', pageTitle);
  setMeta('name', 'twitter:description', routeSeo.description);
  setMeta('name', 'twitter:image', imageUrl);

  upsertLink('canonical').href = canonicalUrl;
}
