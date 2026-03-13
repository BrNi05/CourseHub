<script setup lang="ts">
import { onMounted } from 'vue';
import { RouterView } from 'vue-router';

import AppFooter from './components/AppFooter.vue';
import AppHeader from './components/AppHeader.vue';
import ToastStack from './components/ToastStack.vue';
import { useAppStore } from './lib/app-store';

const app = useAppStore();

onMounted(() => {
  void app.initialize();
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

    <ToastStack :notices="app.state.notices" @dismiss="app.dismissNotice" />
  </div>
</template>
