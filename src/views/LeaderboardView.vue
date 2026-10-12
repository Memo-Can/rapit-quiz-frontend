<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { api, ApiError, type LeaderboardEntry } from '@/api'
import ErrorBox from '@/components/ErrorBox.vue'
import LeaderboardList from '@/components/LeaderboardList.vue'
import { useCategoriesStore } from '@/stores/categories'
import { useGameStore } from '@/stores/game'

const route = useRoute()
const router = useRouter()
const categories = useCategoriesStore()
const game = useGameStore()

const entries = ref<LeaderboardEntry[]>([])
const loading = ref(false)
const error = ref('')

const slug = computed(() => (route.params.category as string | undefined) || '')
const current = computed(() => categories.bySlug.get(slug.value))

// Kullanıcının az önce gönderdiği kayıt bu kategoriye aitse vurgula.
const mine = computed(() =>
  game.submitted && game.categorySlug === slug.value ? game.submitted : null,
)
const mineInList = computed(() => entries.value.some((e) => e.entry_id === mine.value?.entry_id))

let requestId = 0
async function load() {
  if (!slug.value) return
  const id = ++requestId
  loading.value = true
  error.value = ''
  try {
    const data = await api.leaderboard(slug.value, 10)
    if (id === requestId) entries.value = data
  } catch (e) {
    if (id !== requestId) return
    if (e instanceof ApiError && e.code === 'category_not_found') {
      router.replace({ name: 'leaderboard' })
      return
    }
    entries.value = []
    error.value = e instanceof ApiError ? e.message : 'Skor tablosu yüklenemedi.'
  } finally {
    if (id === requestId) loading.value = false
  }
}

onMounted(async () => {
  await categories.load()
  // Kategori verilmediyse ilkini göster.
  if (!slug.value && categories.items.length > 0) {
    router.replace({ name: 'leaderboard', params: { category: categories.items[0]!.slug } })
  }
})

watch(slug, load, { immediate: true })
</script>

<template>
  <section>
    <h1 class="title">🏆 Skor Tablosu</h1>

    <nav class="tabs" aria-label="Kategori seç">
      <RouterLink
        v-for="c in categories.items"
        :key="c.id"
        class="tab"
        :class="{ 'tab--on': c.slug === slug }"
        :style="{ '--c': c.color }"
        :to="{ name: 'leaderboard', params: { category: c.slug } }"
        :aria-current="c.slug === slug ? 'page' : undefined"
      >
        <span aria-hidden="true">{{ c.icon }}</span> {{ c.name }}
      </RouterLink>
    </nav>

    <p v-if="mine" class="mine" role="status">
      🎉 <b>{{ mine.player_name }}</b
      >, {{ mine.score }} puanla <b>{{ mine.rank }}. sıradasın!</b>
    </p>

    <ErrorBox v-if="error" :message="error" @retry="load" />

    <div v-else-if="loading && entries.length === 0" class="empty" role="status">Yükleniyor…</div>

    <div v-else-if="entries.length === 0 && slug" class="empty card">
      <span aria-hidden="true">{{ current?.icon ?? '🏁' }}</span>
      <p>Henüz kimse yok. İlk sen ol!</p>
    </div>

    <LeaderboardList v-else :entries="entries" :highlight-id="mineInList ? mine?.entry_id : null" />

    <div class="actions">
      <RouterLink v-if="slug" class="btn" :to="{ name: 'play', params: { category: slug } }">
        ⚡ {{ current?.name ?? 'Oyna' }} oyna
      </RouterLink>
      <RouterLink class="btn btn--ghost" to="/">Ana sayfa</RouterLink>
    </div>
  </section>
</template>

<style scoped>
.title {
  text-align: center;
  margin-bottom: 16px;
}

.tabs {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin: 0 0 20px;
}

.tab {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  padding: 0 16px;
  border: 2px solid var(--line);
  border-radius: 999px;
  background: var(--card);
  color: var(--text);
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
}

.tab--on {
  border-color: var(--c);
  background: color-mix(in srgb, var(--c) 16%, white);
}

.mine {
  margin: 0 0 16px;
  padding: 12px 16px;
  border-radius: var(--radius);
  background: color-mix(in srgb, var(--primary) 10%, white);
  text-align: center;
}

.empty {
  text-align: center;
  color: var(--muted);
  font-weight: 700;
}

.empty span {
  font-size: 2.4rem;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  margin-top: 24px;
}
</style>
