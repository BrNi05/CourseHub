import { createRouter, createWebHistory } from 'vue-router';

import ErrorReportPage from '@/pages/ErrorReportPage.vue';
import ManagePage from '@/pages/ManagePage.vue';
import PackagesPage from '@/pages/PackagesPage.vue';
import SearchPage from '@/pages/SearchPage.vue';
import SuggestPage from '@/pages/SuggestPage.vue';

import { applySeo, defaultSeo } from '@/seo/seo';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'courses',
      component: ManagePage,
      meta: {
        title: 'Tárgyaim',
        description: 'Hallgatott tárgyak áttekintése egy helyen.',
      },
    },
    {
      path: '/search',
      name: 'search',
      component: SearchPage,
      meta: {
        title: 'Keresés',
        description:
          'Keress nyilvános egyetemi kurzusokat egyetem, név vagy kód szerint, és jelöld azokat, amiket felvettél.',
        canonicalPath: '/search',
        robots: 'noindex',
      },
    },
    {
      path: '/packages',
      name: 'packages',
      component: PackagesPage,
      meta: {
        title: 'Csomagjaim',
        description: 'Tárgycsomagok létrehozása, keresése és felvétele.',
        canonicalPath: '/packages',
        robots: 'noindex',
      },
    },
    {
      path: '/suggest',
      name: 'suggest',
      component: SuggestPage,
      meta: {
        title: 'Javaslat',
        description:
          'Javasolj új tárgyat, hibás link javítását vagy adatkorrekciót, hogy a CourseHub naprakész és pontos maradjon.',
        canonicalPath: '/suggest',
        robots: 'noindex',
      },
    },
    {
      path: '/error-report',
      name: 'error-report',
      component: ErrorReportPage,
      meta: {
        title: 'Hibajelentés',
        description: 'Jelentsd a CourseHub hibás működését vagy felhasználói felületi problémáit.',
        canonicalPath: '/error-report',
        robots: 'noindex',
      },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
});

// Apply SEO changes after each route change
router.afterEach((to) => {
  applySeo(
    {
      title: typeof to.meta.title === 'string' ? to.meta.title : defaultSeo.title,
      description:
        typeof to.meta.description === 'string' ? to.meta.description : defaultSeo.description,
      robots: typeof to.meta.robots === 'string' ? to.meta.robots : undefined,
      canonicalPath: typeof to.meta.canonicalPath === 'string' ? to.meta.canonicalPath : undefined,
    },
    to.path
  );
});

export default router;
