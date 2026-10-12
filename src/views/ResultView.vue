<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { ApiError } from '@/api'
import { useCategoriesStore } from '@/stores/categories'
import { useGameStore } from '@/stores/game'

const NAME_MIN = 2
const NAME_MAX = 20

const router = useRouter()
const game = useGameStore()
const categories = useCategoriesStore()

const name = ref('')
const submitting = ref(false)
const error = ref('')

const result = computed(() => game.result)
const category = computed(() =>
  game.categorySlug ? categories.bySlug.get(game.categorySlug) : undefined,
)
const trimmed = computed(() => name.value.trim().replace(/\s+/g, ' '))
const nameValid = computed(
  () => trimmed.value.length >= NAME_MIN && trimmed.value.length <= NAME_MAX,
)

const headline = computed(() => {
  const ratio = (result.value?.correct_count ?? 0) / (result.value?.question_count || 1)
  if (ratio >= 0.9) return { emoji: '🏆', text: 'Efsanesin!' }
  if (ratio >= 0.7) return { emoji: '🔥', text: 'Harika iş!' }
  if (ratio >= 0.4) return { emoji: '👏', text: 'Fena değil!' }
  return { emoji: '💪', text: 'Bir dahaki sefere!' }
})

const seconds = computed(() =>
  ((result.value?.total_time_ms ?? 0) / 1000).toFixed(1).replace('.', ','),
)

onMounted(() => {
  categories.load()
  // Oyun bellekte yoksa (sayfa yenilendi / doğrudan açıldı) ana sayfaya dön.
  if (game.phase !== 'finished' || !result.value) router.replace({ name: 'home' })
})

function goLeaderboard() {
  router.push({ name: 'leaderboard', params: { category: game.categorySlug ?? '' } })
}

async function submit() {
  if (!nameValid.value || submitting.value) return
  submitting.value = true
  error.value = ''
  try {
    await game.submitScore(trimmed.value)
    goLeaderboard()
  } catch (e) {
    if (e instanceof ApiError && e.code === 'already_submitted') {
      goLeaderboard()
      return
    }
    error.value = e instanceof ApiError ? e.message : 'Skor gönderilemedi.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section v-if="result" class="result">
    <div class="card hero">
      <div class="hero__emoji" aria-hidden="true">{{ headline.emoji }}</div>
      <h1>{{ headline.text }}</h1>
      <p class="hero__cat">{{ category?.icon }} {{ category?.name }}</p>
      <p class="hero__score" aria-label="Toplam puan">{{ result.total_score }}</p>
      <p class="hero__label">puan</p>

      <dl class="stats">
        <div>
          <dt>Doğru</dt>
          <dd>{{ result.correct_count }}/{{ result.question_count }}</dd>
        </div>
        <div>
          <dt>Süre</dt>
          <dd>{{ seconds }} sn</dd>
        </div>
      </dl>
    </div>

    <form v-if="!result.score_submitted" class="card form" novalidate @submit.prevent="submit">
      <label for="player-name" class="form__label">Skor tablosu için adın</label>
      <input
        id="player-name"
        v-model="name"
        class="form__input"
        type="text"
        autocomplete="nickname"
        :maxlength="NAME_MAX + 10"
        placeholder="Örn. Zeynep"
        :aria-invalid="name.length > 0 && !nameValid"
        aria-describedby="name-help"
      />
      <p
        id="name-help"
        class="form__help"
        :class="{ 'form__help--err': name.length > 0 && !nameValid }"
      >
        {{ NAME_MIN }}–{{ NAME_MAX }} karakter ({{ trimmed.length }})
      </p>
      <p v-if="error" class="form__error" role="alert">{{ error }}</p>
      <button type="submit" class="btn" :disabled="!nameValid || submitting">
        {{ submitting ? 'Gönderiliyor…' : 'Skoru Kaydet' }}
      </button>
    </form>

    <div class="actions">
      <RouterLink
        v-if="game.categorySlug"
        class="btn btn--ghost"
        :to="{ name: 'play', params: { category: game.categorySlug } }"
      >
        🔁 Tekrar oyna
      </RouterLink>
      <RouterLink class="btn btn--ghost" to="/">Kategoriler</RouterLink>
    </div>
  </section>
</template>

<style scoped>
.result {
  display: grid;
  gap: 18px;
}

.hero {
  text-align: center;
  display: grid;
  justify-items: center;
}

.hero__emoji {
  font-size: 3.2rem;
}

.hero__cat {
  margin: 4px 0 0;
  color: var(--muted);
  font-weight: 700;
}

.hero__score {
  margin: 8px 0 0;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(3.5rem, 18vw, 5rem);
  line-height: 1;
  background: linear-gradient(90deg, var(--primary), var(--coral));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.hero__label {
  margin: 0;
  color: var(--muted);
  font-weight: 700;
}

.stats {
  display: flex;
  gap: 32px;
  margin: 20px 0 0;
}

.stats dt {
  color: var(--muted);
  font-size: 0.9rem;
  font-weight: 700;
}

.stats dd {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.4rem;
}

.form {
  display: grid;
  gap: 8px;
}

.form__label {
  font-weight: 800;
}

.form__input {
  min-height: 52px;
  padding: 0 16px;
  border: 2px solid var(--line);
  border-radius: 16px;
  background: #fff;
  font-size: 1.1rem;
}

.form__input:focus {
  border-color: var(--primary);
  outline: none;
  box-shadow: 0 0 0 4px rgb(108 92 231 / 20%);
}

.form__input[aria-invalid='true'] {
  border-color: var(--bad);
}

.form__help {
  margin: 0;
  color: var(--muted);
  font-size: 0.9rem;
}

.form__help--err {
  color: var(--bad);
}

.form__error {
  margin: 0;
  padding: 10px 14px;
  border-radius: 14px;
  background: var(--bad-bg);
  color: #a3182a;
  font-weight: 700;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
}
</style>
