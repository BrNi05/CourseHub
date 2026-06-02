<script setup lang="ts">
import { computed, ref } from 'vue';

import BaseButton from './BaseButton.vue';
import BaseDialog from './BaseDialog.vue';
import ConfirmDialog from './ConfirmDialog.vue';

import { useAppStore } from '@/stores/composables/use-app-store';

const app = useAppStore();
const session = app.state.session as { email: string | null };
const isAccountDialogOpen = ref(false);
const isDeleteDialogOpen = ref(false);
const isLogoutDialogOpen = ref(false);
const clearLocalSaves = ref(true);

const sessionLabel = computed<string>(() => session.email ?? 'Bejelentkezés');

function openAccountDialog() {
  isAccountDialogOpen.value = true;
}

function closeAccountDialog() {
  isAccountDialogOpen.value = false;
}

function openDeleteDialog() {
  isAccountDialogOpen.value = false;
  clearLocalSaves.value = true;
  isDeleteDialogOpen.value = true;
}

function openLogoutDialog() {
  isAccountDialogOpen.value = false;
  clearLocalSaves.value = true;
  isLogoutDialogOpen.value = true;
}

function handleDeleteBack() {
  isDeleteDialogOpen.value = false;
  isAccountDialogOpen.value = true;
}

function handleLogoutBack() {
  isLogoutDialogOpen.value = false;
  isAccountDialogOpen.value = true;
}

async function handleLogout() {
  isLogoutDialogOpen.value = false;
  closeAccountDialog();
  isDeleteDialogOpen.value = false;
  await app.logout(!clearLocalSaves.value);
}

async function handleDeleteProfile() {
  const deleted = await app.deleteProfile(!clearLocalSaves.value);

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
          <BaseButton
            :disabled="app.state.deletingProfile"
            kind="secondary"
            @click="openLogoutDialog"
          >
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
      v-model="isLogoutDialogOpen"
      cancel-label="Vissza"
      confirm-kind="secondary"
      confirm-label="Kijelentkezés"
      description="Ha ez nem a saját készüléked, akkor ajánlott a helyi mentések törlése."
      title="Kijelentkezés"
      width="md"
      @back="handleLogoutBack"
      @confirm="handleLogout"
    >
      <label class="account-dialog__choice">
        <input v-model="clearLocalSaves" type="checkbox" />
        <span>Helyi mentések törlése</span>
      </label>
    </ConfirmDialog>

    <ConfirmDialog
      v-model="isDeleteDialogOpen"
      :busy="app.state.deletingProfile"
      cancel-label="Vissza"
      confirm-label="Fiók törlése"
      description="A fiókod és a szerveren tárolt adataid végleg törlődnek."
      title="Fiók törlése"
      width="md"
      @back="handleDeleteBack"
      @confirm="handleDeleteProfile"
    >
      <label class="account-dialog__choice">
        <input v-model="clearLocalSaves" type="checkbox" />
        <span>Helyi mentések törlése (ajánlott)</span>
      </label>
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

.account-dialog__choice {
  align-items: center;
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  font-size: 0.95rem;
  font-weight: 700;
  gap: 0.7rem;
  margin-bottom: 0.84rem;
  padding-left: 0.24rem;
}

.account-dialog__choice input {
  accent-color: var(--accent-green);
  flex: 0 0 auto;
  height: 1rem;
  width: 1rem;
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
