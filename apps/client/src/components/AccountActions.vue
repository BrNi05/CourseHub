<script setup lang="ts">
import { computed, ref } from 'vue';

import BaseButton from './BaseButton.vue';
import BaseDialog from './BaseDialog.vue';
import ConfirmDialog from './ConfirmDialog.vue';
import { useAppStore } from '@/lib/app-store';

const app = useAppStore();
const session = app.state.session as { email: string | null };
const isAccountDialogOpen = ref(false);
const isDeleteDialogOpen = ref(false);

const sessionLabel = computed<string>(() => session.email ?? 'Bejelentkezés');

function openAccountDialog() {
  isAccountDialogOpen.value = true;
}

function closeAccountDialog() {
  isAccountDialogOpen.value = false;
}

function openDeleteDialog() {
  isAccountDialogOpen.value = false;
  isDeleteDialogOpen.value = true;
}

function handleDeleteBack() {
  isDeleteDialogOpen.value = false;
  isAccountDialogOpen.value = true;
}

function handleLogout() {
  closeAccountDialog();
  isDeleteDialogOpen.value = false;
  app.logout();
}

async function handleDeleteProfile() {
  const deleted = await app.deleteProfile();

  if (deleted) {
    isDeleteDialogOpen.value = false;
  }
}
</script>

<template>
  <div class="account-actions">
    <BaseButton
      v-if="!app.isAuthenticated()"
      :disabled="app.state.loginInFlight"
      kind="primary"
      @click="app.loginWithGoogle"
    >
      {{ app.state.loginInFlight ? 'Átirányítás...' : 'Bejelentkezés' }}
    </BaseButton>

    <BaseButton v-else kind="secondary" @click="openAccountDialog">
      {{ sessionLabel }}
    </BaseButton>

    <BaseDialog v-model="isAccountDialogOpen" :title="sessionLabel" width="md">
      <div class="account-dialog__spacer" aria-hidden="true"></div>

      <template #footer="{ close }">
        <div class="account-dialog__actions">
          <BaseButton :disabled="app.state.deletingProfile" kind="secondary" @click="handleLogout">
            Kijelentkezés
          </BaseButton>

          <BaseButton :disabled="app.state.deletingProfile" kind="danger" @click="openDeleteDialog">
            Fiók törlése
          </BaseButton>

          <BaseButton :disabled="app.state.deletingProfile" kind="ghost" @click="close">
            Bezárás
          </BaseButton>
        </div>
      </template>
    </BaseDialog>

    <ConfirmDialog
      v-model="isDeleteDialogOpen"
      :busy="app.state.deletingProfile"
      cancel-label="Vissza"
      confirm-label="Profil törlése"
      description="A fiókod és a szerveren tárolt felvett tárgyaid végleg törlődnek."
      title="Profil törlése"
      width="md"
      @back="handleDeleteBack"
      @confirm="handleDeleteProfile"
    >
    </ConfirmDialog>
  </div>
</template>

<style scoped>
.account-actions {
  display: flex;
}

.account-dialog__spacer {
  min-height: 0.7rem;
}

.account-dialog__actions {
  display: grid;
  gap: 1.2rem;
  margin-top: 0.55rem;
}

@media (min-width: 640px) {
  .account-dialog__actions {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .account-dialog__actions :last-child {
    grid-column: 1 / -1;
  }
}
</style>
