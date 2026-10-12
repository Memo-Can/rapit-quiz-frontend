import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { api, ApiError, type Category } from '@/api'

export const useCategoriesStore = defineStore('categories', () => {
  const items = ref<Category[]>([])
  const loading = ref(false)
  const error = ref('')

  const bySlug = computed(() => new Map(items.value.map((c) => [c.slug, c])))

  async function load(force = false) {
    if (loading.value || (items.value.length > 0 && !force)) return
    loading.value = true
    error.value = ''
    try {
      items.value = await api.categories()
    } catch (e) {
      error.value = e instanceof ApiError ? e.message : 'Kategoriler yüklenemedi.'
    } finally {
      loading.value = false
    }
  }

  return { items, loading, error, bySlug, load }
})
