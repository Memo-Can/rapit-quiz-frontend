<template>
  <span class="logo" aria-label="Rapit Quiz">
    <span class="logo__bolt" aria-hidden="true">⚡</span>
    <span class="logo__text">Rapit<b>Quiz</b></span>
  </span>
</template>

<style scoped>
.logo {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 1.35rem;
  color: var(--text);
}

.logo__bolt {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--primary), var(--coral));
  font-size: 1.15rem;
  box-shadow: 0 4px 12px rgb(108 92 231 / 35%);
}

.logo__text b {
  color: var(--primary);
}
</style>
