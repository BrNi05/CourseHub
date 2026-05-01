<script setup lang="ts">
import { onMounted } from 'vue';
import { RouterView, useRouter } from 'vue-router';

import AppFooter from './components/AppFooter.vue';
import AppHeader from './components/AppHeader.vue';
import PwaInstallPromptDialog from './components/PwaInstallPromptDialog.vue';
import ToastStack from './components/ToastStack.vue';

import { redirectToRememberedRoute } from '@/router/routing-manager';
import { useAppStore } from '@/stores/composables/use-app-store';

const app = useAppStore();
const router = useRouter();

onMounted(() => {
  void (async () => {
    await app.initialize();

    // If the user is not authenticated, do not redirect
    // as route manager is intended to redirect authenticated users
    if (!app.isAuthenticated()) return;
    await redirectToRememberedRoute(router);
  })();
});
</script>

<template>
  <div class="app-shell">
    <div class="app-shell__glow app-shell__glow--left"></div>
    <div class="app-shell__glow app-shell__glow--right"></div>

    <AppHeader />

    <main class="app-shell__main">
      <RouterView />
    </main>

    <AppFooter />

    <PwaInstallPromptDialog />

    <ToastStack :notices="app.state.notices" @dismiss="app.dismissNotice" />
  </div>
</template>
