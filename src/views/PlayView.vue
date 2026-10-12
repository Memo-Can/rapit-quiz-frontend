<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import ChoiceButton, { type ChoiceState } from '@/components/ChoiceButton.vue'
import CountdownBar from '@/components/CountdownBar.vue'
import ErrorBox from '@/components/ErrorBox.vue'
import { useCountdown } from '@/composables/useCountdown'
import { useCategoriesStore } from '@/stores/categories'
import { useGameStore } from '@/stores/game'

const FEEDBACK_MS = 1000

const route = useRoute()
const router = useRouter()
const game = useGameStore()
const categories = useCategoriesStore()

const slug = computed(() => String(route.params.category))
const category = computed(() => categories.bySlug.get(slug.value))

const countdown = useCountdown(() => select(null))
let alive = true

async function select(choiceId: number | null) {
  if (game.phase !== 'question') return
  countdown.stop()
  const result = await game.answer(choiceId)
  if (!result || !alive) return
  await new Promise((resolve) => setTimeout(resolve, FEEDBACK_MS))
  if (alive) await game.advance()
}

// Yeni soru geldiğinde sunucunun bildirdiği kalan süreyle geri sayımı başlat.
watch(
  () => [game.phase, game.question] as const,
  ([phase, q]) => {
    if (phase === 'question' && q) countdown.start(q.remaining_ms, q.time_limit_ms)
  },
)

// Oyun bitince sonuç ekranına geç.
watch(
  () => game.phase,
  (phase) => {
    if (phase === 'finished') router.replace({ name: 'result' })
  },
)

function onKey(e: KeyboardEvent) {
  if (e.ctrlKey || e.metaKey || e.altKey || game.phase !== 'question') return
  const n = Number(e.key)
  const choice = game.question?.choices[n - 1]
  if (n >= 1 && n <= 4 && choice) {
    e.preventDefault()
    select(choice.id)
  }
}

onMounted(async () => {
  window.addEventListener('keydown', onKey)
  await categories.load()
  if (!alive) return
  if (categories.error) return
  if (!category.value) {
    router.replace({ name: 'home' })
    return
  }
  game.start(slug.value)
})

onBeforeUnmount(() => {
  alive = false
  window.removeEventListener('keydown', onKey)
  countdown.stop()
  if (game.phase !== 'finished') game.reset()
})

function choiceState(id: number): ChoiceState {
  const fb = game.feedback
  if (!fb) return 'idle'
  if (game.phase === 'locked') return fb.selectedChoiceId === id ? 'selected' : 'dim'
  if (id === fb.result.correct_choice_id) return 'correct'
  if (id === fb.selectedChoiceId) return 'wrong'
  return 'dim'
}

const banner = computed(() => {
  const fb = game.feedback
  if (game.phase !== 'feedback' || !fb) return null
  if (fb.result.is_correct) return { kind: 'good', text: `Doğru! +${fb.result.score_gained}` }
  if (fb.selectedChoiceId === null) return { kind: 'bad', text: 'Süre doldu!' }
  return { kind: 'bad', text: 'Yanlış' }
})

const locked = computed(() => game.phase !== 'question')
</script>

<template>
  <section :style="{ '--c': category?.color ?? 'var(--primary)' }">
    <ErrorBox v-if="categories.error" :message="categories.error" @retry="categories.load(true)">
      <RouterLink class="btn btn--ghost" to="/">Ana sayfa</RouterLink>
    </ErrorBox>

    <ErrorBox v-else-if="game.phase === 'error'" :message="game.errorMessage" @retry="game.retry()">
      <RouterLink class="btn btn--ghost" to="/">Ana sayfa</RouterLink>
    </ErrorBox>

    <div v-else-if="!game.question" class="loading" role="status">
      <span class="loading__icon" aria-hidden="true">{{ category?.icon ?? '⚡' }}</span>
      Sorular hazırlanıyor…
    </div>

    <div v-else class="play">
      <div class="meta">
        <span class="meta__cat">{{ category?.icon }} {{ category?.name }}</span>
        <span class="meta__score" aria-live="polite">⭐ {{ game.runningScore }}</span>
      </div>

      <div class="progress">
        <span class="progress__label">
          Soru <b>{{ game.question.position }}</b> / {{ game.question.total_questions }}
        </span>
        <div class="progress__dots" aria-hidden="true">
          <i
            v-for="n in game.question.total_questions"
            :key="n"
            :class="{ done: n < game.question.position, now: n === game.question.position }"
          />
        </div>
      </div>

      <CountdownBar
        :fraction="countdown.fraction.value"
        :remaining-ms="countdown.remainingMs.value"
      />

      <Transition name="q" mode="out-in">
        <div :key="game.question.position" class="qa">
          <h2 class="question card">{{ game.question.text }}</h2>
          <div class="choices">
            <ChoiceButton
              v-for="(c, i) in game.question.choices"
              :key="c.id"
              :index="i"
              :text="c.text"
              :state="choiceState(c.id)"
              :disabled="locked"
              @pick="select(c.id)"
            />
          </div>
        </div>
      </Transition>

      <p
        class="banner"
        :class="banner ? `banner--${banner.kind}` : ''"
        role="status"
        aria-live="assertive"
      >
        <template v-if="banner">
          <span aria-hidden="true">{{ banner.kind === 'good' ? '✓' : '✕' }}</span>
          {{ banner.text }}
        </template>
      </p>
    </div>
  </section>
</template>

<style scoped>
.loading {
  display: grid;
  justify-items: center;
  gap: 12px;
  padding: 64px 0;
  color: var(--muted);
  font-weight: 700;
}

.loading__icon {
  font-size: 3rem;
  animation: bounce 0.9s ease-in-out infinite;
}

@keyframes bounce {
  50% {
    transform: translateY(-10px);
  }
}

.play {
  display: grid;
  gap: 16px;
}

.meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 800;
}

.meta__cat {
  padding: 6px 14px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--c) 16%, white);
}

.meta__score {
  font-family: var(--font-display);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.progress {
  display: grid;
  gap: 8px;
  color: var(--muted);
  font-weight: 700;
}

.progress__label b {
  color: var(--text);
}

.progress__dots {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  gap: 3px;
}

.progress__dots i {
  height: 6px;
  border-radius: 3px;
  background: var(--line);
}

.progress__dots i.done {
  background: var(--c);
}

.progress__dots i.now {
  background: color-mix(in srgb, var(--c) 55%, white);
}

.qa {
  display: grid;
  gap: 16px;
}

.question {
  font-size: clamp(1.2rem, 4.6vw, 1.5rem);
  font-weight: 700;
  text-align: center;
  display: grid;
  place-items: center;
  min-height: 120px;
  border-top: 6px solid var(--c);
}

.choices {
  display: grid;
  gap: 12px;
}

.banner {
  min-height: 3rem;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: var(--radius);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.2rem;
}

.banner--good {
  background: var(--good-bg);
  color: #0b6b3c;
}

.banner--bad {
  background: var(--bad-bg);
  color: #a3182a;
}

.q-enter-active,
.q-leave-active {
  transition:
    opacity 0.16s ease,
    transform 0.16s ease;
}

.q-enter-from {
  opacity: 0;
  transform: translateX(24px);
}

.q-leave-to {
  opacity: 0;
  transform: translateX(-24px);
}
</style>
