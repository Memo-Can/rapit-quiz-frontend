<script setup lang="ts">
import type { LeaderboardEntry } from '@/api'

defineProps<{ entries: LeaderboardEntry[]; highlightId?: number | null }>()

const medals: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

function seconds(ms: number) {
  return (ms / 1000).toFixed(1).replace('.', ',') + ' sn'
}
</script>

<template>
  <ol class="board">
    <li
      v-for="e in entries"
      :key="e.entry_id"
      class="row"
      :class="{ 'row--me': e.entry_id === highlightId }"
      :aria-current="e.entry_id === highlightId ? 'true' : undefined"
    >
      <span class="row__rank">
        <template v-if="medals[e.rank]">
          <span aria-hidden="true">{{ medals[e.rank] }}</span>
          <span class="sr-only">{{ e.rank }}. sıra</span>
        </template>
        <template v-else>{{ e.rank }}</template>
      </span>
      <span class="row__name">
        {{ e.player_name }}
        <small v-if="e.entry_id === highlightId" class="row__you">Sen</small>
      </span>
      <span class="row__meta">{{ e.correct_count }}/20 · {{ seconds(e.total_time_ms) }}</span>
      <span class="row__score">{{ e.score }}</span>
    </li>
  </ol>
</template>

<style scoped>
.board {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.row {
  display: grid;
  grid-template-columns: 44px 1fr auto;
  grid-template-areas:
    'rank name score'
    'rank meta score';
  align-items: center;
  column-gap: 12px;
  padding: 12px 16px 12px 8px;
  border: 2px solid transparent;
  border-radius: var(--radius);
  background: var(--card);
  box-shadow: 0 2px 10px rgb(76 63 180 / 7%);
}

.row--me {
  border-color: var(--primary);
  background: color-mix(in srgb, var(--primary) 8%, white);
}

.row__rank {
  grid-area: rank;
  text-align: center;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.3rem;
  color: var(--muted);
}

.row__name {
  grid-area: name;
  font-weight: 800;
  overflow-wrap: anywhere;
}

.row__you {
  margin-left: 6px;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--primary);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
}

.row__meta {
  grid-area: meta;
  color: var(--muted);
  font-size: 0.9rem;
}

.row__score {
  grid-area: score;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.35rem;
  color: var(--primary-dark);
  font-variant-numeric: tabular-nums;
}
</style>
