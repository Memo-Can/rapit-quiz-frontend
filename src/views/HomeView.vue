<script setup lang="ts">
import { onMounted } from 'vue'

import CategoryCard from '@/components/CategoryCard.vue'
import ErrorBox from '@/components/ErrorBox.vue'
import { useCategoriesStore } from '@/stores/categories'

const categories = useCategoriesStore()

onMounted(() => categories.load())
</script>

<template>
  <section>
    <div class="hero">
      <h1>20 soru. 5 saniye.<br /><span>Hızlı ol!</span></h1>
      <p>Bir kategori seç, bilgini test et ve skor tablosunda yerini al.</p>
    </div>

    <ErrorBox v-if="categories.error" :message="categories.error" @retry="categories.load(true)" />

    <ul v-else class="grid" aria-label="Kategoriler">
      <template v-if="categories.loading && categories.items.length === 0">
        <li v-for="n in 5" :key="n" class="skeleton" aria-hidden="true" />
      </template>
      <li v-for="c in categories.items" :key="c.id">
        <CategoryCard :category="c" />
      </li>
    </ul>

    <div class="footer">
      <RouterLink class="btn btn--ghost" :to="{ name: 'leaderboard' }">🏆 Skor Tablosu</RouterLink>
    </div>
  </section>
</template>

<style scoped>
.hero {
  text-align: center;
  margin-bottom: 28px;
}

.hero h1 {
  font-size: clamp(1.9rem, 7vw, 2.6rem);
}

.hero h1 span {
  background: linear-gradient(90deg, var(--primary), var(--coral));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.hero p {
  margin: 12px 0 0;
  color: var(--muted);
}

.grid {
  display: grid;
  gap: 14px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.skeleton {
  height: 76px;
  border-radius: var(--radius);
  background: linear-gradient(90deg, #eceefb 25%, #f6f7ff 50%, #eceefb 75%);
  background-size: 200% 100%;
  animation: shimmer 1.2s linear infinite;
}

@keyframes shimmer {
  to {
    background-position: -200% 0;
  }
}

.footer {
  display: flex;
  justify-content: center;
  margin-top: 28px;
}
</style>
