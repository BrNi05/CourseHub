<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { isMobileClientPlatform, isPWA } from '@/utils/client-runtime';

import BaseButton from './BaseButton.vue';
import BaseDialog from './BaseDialog.vue';

const PWA_INSTALL_PROMPT_CLOSED_KEY = 'coursehub.pwaInstallPromptClosed';

const route = useRoute();
const isOpen = ref(false);

function maybeOpenPrompt() {
  if (route.path !== '/') return;
  if (!isMobileClientPlatform()) return;
  if (isPWA()) return;
  if (globalThis.localStorage.getItem(PWA_INSTALL_PROMPT_CLOSED_KEY) === 'true') return;

  isOpen.value = true;
}

function closePrompt() {
  globalThis.localStorage.setItem(PWA_INSTALL_PROMPT_CLOSED_KEY, 'true');
  isOpen.value = false;
}

function handleVisibilityChange(nextValue: boolean) {
  if (nextValue) {
    isOpen.value = true;
    return;
  }

  closePrompt();
}

watch(
  () => route.path,
  () => maybeOpenPrompt()
);
</script>

<template>
  <BaseDialog
    :model-value="isOpen"
    title="CourseHub app"
    width="sm"
    @update:model-value="handleVisibilityChange"
  >
    <p class="pwa-install-dialog__copy">
      A CourseHub letölthető alkalmazásként.<br />
      Böngészőmenü: "Hozzáadás a főképernyőhöz".
    </p>

    <template #footer>
      <BaseButton kind="primary" @click="closePrompt">Bezárás</BaseButton>
    </template>
  </BaseDialog>
</template>

<style scoped>
.pwa-install-dialog__copy {
  color: var(--text-muted);
  margin-left: 0.8rem;
  margin-right: 0.8rem;
}
</style>
