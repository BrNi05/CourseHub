<script setup lang="ts">
import BaseButton from './BaseButton.vue';
import BaseDialog from './BaseDialog.vue';

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    busy?: boolean;
    confirmKind?: 'primary' | 'danger';
    width?: 'sm' | 'md';
  }>(),
  {
    confirmLabel: 'Megerősítés',
    cancelLabel: 'Vissza',
    busy: false,
    confirmKind: 'danger',
    width: 'sm',
  }
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  back: [];
  confirm: [];
}>();

function goBack() {
  emit('back');
  emit('update:modelValue', false);
}
</script>

<template>
  <BaseDialog
    :description="props.description"
    :model-value="props.modelValue"
    :title="props.title"
    :width="props.width"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="confirm-dialog__body">
      <slot></slot>
    </div>

    <template #footer="{ close: dismiss }">
      <div class="confirm-dialog__actions">
        <BaseButton :disabled="props.busy" kind="ghost" @click="goBack">
          {{ props.cancelLabel }}
        </BaseButton>

        <BaseButton :disabled="props.busy" :kind="props.confirmKind" @click="emit('confirm')">
          {{ props.busy ? 'Folyamatban...' : props.confirmLabel }}
        </BaseButton>

        <BaseButton :disabled="props.busy" kind="ghost" @click="dismiss">Bezárás</BaseButton>
      </div>
    </template>
  </BaseDialog>
</template>

<style scoped>
.confirm-dialog__body {
  margin-top: 0.8rem;
}

.confirm-dialog__actions {
  display: grid;
  gap: 0.75rem;
}

@media (min-width: 640px) {
  .confirm-dialog__actions {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .confirm-dialog__actions :last-child {
    grid-column: 1 / -1;
  }
}
</style>
