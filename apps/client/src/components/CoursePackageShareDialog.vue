<script setup lang="ts">
import { computed, ref } from 'vue';

import QrcodeVue from 'qrcode.vue';

import BaseButton from './BaseButton.vue';
import BaseDialog from './BaseDialog.vue';

import type { CoursePackage } from '@coursehub/sdk';

const props = defineProps<{
  modelValue: boolean;
  packageItem: CoursePackage | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const shareUrl = computed(() => {
  if (!props.packageItem) return '';

  const baseUrl = globalThis.window?.location?.origin ?? '';
  return `${baseUrl}/packages?package=${props.packageItem.id}`;
});

const copyAnimating = ref(false);
let copyAnimationTimeout: number | null = null;

function triggerCopyAnimation() {
  if (copyAnimationTimeout !== null) {
    globalThis.window?.clearTimeout(copyAnimationTimeout);
  }

  copyAnimating.value = false;

  globalThis.window?.requestAnimationFrame(() => {
    copyAnimating.value = true;

    copyAnimationTimeout =
      globalThis.window?.setTimeout(() => {
        copyAnimating.value = false;
        copyAnimationTimeout = null;
      }, 520) ?? null;
  });
}

async function copyShareUrl() {
  if (!shareUrl.value) return;

  try {
    await navigator.clipboard.writeText(shareUrl.value);
    triggerCopyAnimation();
  } catch {
    // Do not handle
  }
}

function handleInputFocus(event: Event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;

  target.select();
}
</script>

<template>
  <BaseDialog
    :model-value="props.modelValue"
    title="Csomag megosztása"
    width="md"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-if="props.packageItem" class="share-dialog">
      <div class="share-dialog__intro">
        <p class="share-dialog__title">{{ props.packageItem.name }}</p>
        <p class="share-dialog__meta">
          {{ props.packageItem.courses?.length ?? 0 }} tárgy
          <span v-if="props.packageItem.faculty?.name">
            · {{ props.packageItem.faculty.name }}</span
          >
        </p>
      </div>

      <label class="share-dialog__field">
        <span>Megosztási link</span>
        <div class="share-dialog__link-row">
          <input readonly :value="shareUrl" @focus="handleInputFocus" />

          <BaseButton class="share-dialog__copy-button" kind="primary" @click="copyShareUrl">
            {{ copyAnimating ? 'Másolva' : 'Másolás' }}
          </BaseButton>
        </div>
      </label>

      <div class="share-dialog__qr">
        <QrcodeVue class="share-dialog__qr-code" :size="184" render-as="svg" :value="shareUrl" />
      </div>
    </div>
  </BaseDialog>
</template>

<style scoped>
.share-dialog {
  display: grid;
  gap: 1.35rem;
}

.share-dialog__intro {
  display: grid;
  gap: 0.55rem;
  padding-left: 0.45rem;
  padding-top: 0.45rem;
}

.share-dialog__title,
.share-dialog__meta {
  margin: 0;
}

.share-dialog__title {
  color: var(--text-primary);
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.share-dialog__meta {
  color: var(--text-muted);
  line-height: 1.55;
}

.share-dialog__field {
  display: grid;
  gap: 0.45rem;
  padding-left: 0.45rem;
}

.share-dialog__link-row {
  align-items: stretch;
  display: grid;
  gap: 0.75rem;
}

.share-dialog__copy-button {
  min-width: 7.5rem;
}

.share-dialog__field span {
  color: var(--text-muted);
  font-size: 0.88rem;
}

.share-dialog__link-row input {
  background: var(--field-surface);
  border: 1px solid var(--border-soft);
  border-radius: 1rem;
  color: var(--text-primary);
  font: inherit;
  min-height: 3rem;
  padding: 0 0.95rem;
  width: 100%;
}

.share-dialog__qr {
  display: flex;
  justify-content: center;
  padding: 1rem 0 0.25rem;
}

.share-dialog__qr-code {
  background: white;
  border-radius: 1rem;
  padding: 0.8rem;
}

@media (min-width: 720px) {
  .share-dialog__link-row {
    grid-template-columns: minmax(0, 1fr) auto;
  }
}
</style>
