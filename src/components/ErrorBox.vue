<script setup lang="ts">
defineProps<{ message: string; retryLabel?: string }>()
defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="error card" role="alert">
    <span class="error__icon" aria-hidden="true">😵</span>
    <p class="error__msg">{{ message }}</p>
    <div class="error__actions">
      <button type="button" class="btn" @click="$emit('retry')">
        {{ retryLabel ?? 'Tekrar dene' }}
      </button>
      <slot />
    </div>
  </div>
</template>

<style scoped>
.error {
  text-align: center;
  display: grid;
  gap: 12px;
  justify-items: center;
}

.error__icon {
  font-size: 2.5rem;
}

.error__msg {
  margin: 0;
  color: var(--text);
  font-weight: 600;
}

.error__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
}
</style>
