<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ fraction: number; remainingMs: number }>()

const level = computed(() =>
  props.fraction > 0.5 ? 'ok' : props.fraction > 0.25 ? 'warn' : 'danger',
)
const urgent = computed(() => props.remainingMs > 0 && props.remainingMs <= 2000)
const seconds = computed(() => Math.ceil(props.remainingMs / 1000))
</script>

<template>
  <div class="countdown" :class="[`countdown--${level}`, { 'countdown--urgent': urgent }]">
    <div class="countdown__track" aria-hidden="true">
      <div class="countdown__fill" :style="{ transform: `scaleX(${fraction})` }" />
    </div>
    <span class="countdown__secs" aria-hidden="true">{{ seconds }}</span>
    <span class="sr-only" role="timer">Kalan süre {{ seconds }} saniye</span>
  </div>
</template>

<style scoped>
.countdown {
  display: flex;
  align-items: center;
  gap: 12px;
}

.countdown__track {
  flex: 1;
  height: 16px;
  border-radius: 999px;
  background: var(--line);
  overflow: hidden;
}

.countdown__fill {
  width: 100%;
  height: 100%;
  border-radius: 999px;
  transform-origin: left center;
  background: var(--good);
}

.countdown--warn .countdown__fill {
  background: var(--yellow);
}

.countdown--danger .countdown__fill {
  background: var(--bad);
}

.countdown__secs {
  min-width: 2ch;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.4rem;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.countdown--danger .countdown__secs {
  color: var(--bad);
}

.countdown--urgent {
  animation: shake 0.4s ease-in-out infinite;
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-2px) rotate(-0.2deg);
  }
  75% {
    transform: translateX(2px) rotate(0.2deg);
  }
}
</style>
