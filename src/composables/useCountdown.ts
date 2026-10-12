import { computed, onScopeDispose, ref } from 'vue'

/**
 * Görsel geri sayım. Kaynak doğruluk sunucudadır; bu yalnızca kullanıcıya süreyi gösterir
 * ve süre dolunca `onExpire` çağırarak boş cevap göndermeyi tetikler.
 */
export function useCountdown(onExpire: () => void) {
  const remainingMs = ref(0)
  const totalMs = ref(5000)
  let raf = 0
  let endAt = 0
  let active = false

  const fraction = computed(() =>
    totalMs.value > 0 ? Math.min(1, Math.max(0, remainingMs.value / totalMs.value)) : 0,
  )

  function tick() {
    if (!active) return
    const left = Math.max(0, endAt - performance.now())
    remainingMs.value = left
    if (left <= 0) {
      active = false
      onExpire()
      return
    }
    raf = requestAnimationFrame(tick)
  }

  function start(remaining: number, total: number) {
    stop()
    totalMs.value = total
    remainingMs.value = remaining
    endAt = performance.now() + remaining
    active = true
    raf = requestAnimationFrame(tick)
  }

  function stop() {
    active = false
    cancelAnimationFrame(raf)
  }

  onScopeDispose(stop)

  return { remainingMs, totalMs, fraction, start, stop }
}
