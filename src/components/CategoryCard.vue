<script setup lang="ts">
import type { Category } from '@/api'

defineProps<{ category: Category }>()
</script>

<template>
  <RouterLink
    class="cat"
    :to="{ name: 'play', params: { category: category.slug } }"
    :style="{ '--c': category.color }"
  >
    <span class="cat__icon" aria-hidden="true">{{ category.icon }}</span>
    <span class="cat__name">{{ category.name }}</span>
    <span class="cat__go" aria-hidden="true">→</span>
  </RouterLink>
</template>

<style scoped>
.cat {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 76px;
  padding: 14px 20px 14px 14px;
  border-radius: var(--radius);
  background: var(--card);
  box-shadow: var(--shadow);
  border-left: 8px solid var(--c);
  color: var(--text);
  text-decoration: none;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.cat:hover,
.cat:focus-visible {
  transform: translateY(-3px) rotate(-0.4deg);
  box-shadow: var(--shadow-lg);
}

.cat:active {
  transform: scale(0.98);
}

.cat__icon {
  display: grid;
  place-items: center;
  flex: none;
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: color-mix(in srgb, var(--c) 16%, white);
  font-size: 1.7rem;
}

.cat__name {
  flex: 1;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 1.1rem;
}

.cat__go {
  font-size: 1.4rem;
  color: var(--muted);
}
</style>
