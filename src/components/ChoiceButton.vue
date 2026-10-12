<script setup lang="ts">
export type ChoiceState = 'idle' | 'selected' | 'correct' | 'wrong' | 'dim'

defineProps<{ index: number; text: string; state: ChoiceState; disabled: boolean }>()
defineEmits<{ pick: [] }>()
</script>

<template>
  <button
    type="button"
    class="choice"
    :class="`choice--${state}`"
    :disabled="disabled"
    :aria-keyshortcuts="String(index + 1)"
    @click="$emit('pick')"
  >
    <span class="choice__key" aria-hidden="true">{{ index + 1 }}</span>
    <span class="choice__text">{{ text }}</span>
    <span v-if="state === 'correct'" class="choice__mark" aria-hidden="true">✓</span>
    <span v-else-if="state === 'wrong'" class="choice__mark" aria-hidden="true">✕</span>
    <span v-if="state === 'correct'" class="sr-only">Doğru cevap</span>
    <span v-else-if="state === 'wrong'" class="sr-only">Yanlış cevap</span>
  </button>
</template>

<style scoped>
.choice {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  min-height: 64px;
  padding: 10px 16px 10px 12px;
  border: 2px solid var(--line);
  border-radius: var(--radius);
  background: var(--card);
  text-align: left;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 8px rgb(76 63 180 / 6%);
  transition:
    transform 0.12s ease,
    border-color 0.12s ease,
    background 0.12s ease,
    opacity 0.2s ease;
}

.choice:hover:not(:disabled) {
  border-color: var(--primary);
  transform: translateY(-2px);
}

.choice:active:not(:disabled) {
  transform: scale(0.98);
}

.choice:disabled {
  cursor: default;
}

.choice__key {
  display: grid;
  place-items: center;
  flex: none;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--primary) 12%, white);
  color: var(--primary-dark);
  font-family: var(--font-display);
  font-weight: 700;
}

.choice__text {
  flex: 1;
  overflow-wrap: anywhere;
}

.choice__mark {
  flex: none;
  font-size: 1.4rem;
  font-weight: 800;
}

.choice--selected {
  border-color: var(--primary);
  background: color-mix(in srgb, var(--primary) 8%, white);
}

.choice--correct {
  border-color: var(--good);
  background: var(--good-bg);
  animation: pop 0.3s ease;
}

.choice--correct .choice__mark {
  color: var(--good);
}

.choice--wrong {
  border-color: var(--bad);
  background: var(--bad-bg);
}

.choice--wrong .choice__mark {
  color: var(--bad);
}

.choice--dim {
  opacity: 0.5;
}

@keyframes pop {
  50% {
    transform: scale(1.03);
  }
}
</style>
