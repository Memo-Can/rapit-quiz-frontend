<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'

import AppLogo from '@/components/AppLogo.vue'
</script>

<template>
  <div class="container">
    <header class="top">
      <RouterLink to="/" class="top__logo" aria-label="Rapit Quiz ana sayfa">
        <AppLogo />
      </RouterLink>
    </header>
    <main>
      <RouterView v-slot="{ Component, route }">
        <Transition name="page" mode="out-in">
          <component :is="Component" :key="route.path" />
        </Transition>
      </RouterView>
    </main>
  </div>
</template>

<style scoped>
.top {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.top__logo {
  text-decoration: none;
  border-radius: 14px;
}
</style>
