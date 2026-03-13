import { createRouter, createWebHistory } from 'vue-router';

import AdminPage from '@/pages/AdminPage.vue';
import ErrorReportPage from '@/pages/ErrorReportPage.vue';
import ManagePage from '@/pages/ManagePage.vue';
import SearchPage from '@/pages/SearchPage.vue';
import SuggestPage from '@/pages/SuggestPage.vue';
import { useAppStore } from '@/lib/app-store';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'manage',
      component: ManagePage,
      meta: { title: 'Manage' },
    },
    {
      path: '/search',
      name: 'search',
      component: SearchPage,
      meta: { title: 'Search Courses' },
    },
    {
      path: '/suggest',
      name: 'suggest',
      component: SuggestPage,
      meta: { title: 'Suggest' },
    },
    {
      path: '/error-report',
      name: 'error-report',
      component: ErrorReportPage,
      meta: { title: 'Error Report' },
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminPage,
      meta: { title: 'Admin', requiresAdmin: true },
    },
  ],
});

router.beforeEach((to) => {
  const app = useAppStore();

  if (to.meta.requiresAdmin && !app.state.session.isAdmin) {
    return { name: 'manage' }; // redirect non-admins
  }

  return true;
});

router.afterEach((to) => {
  document.title = `${to.meta.title} | CourseHub`;
});

export default router;
