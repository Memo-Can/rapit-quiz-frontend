import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import {
  api,
  ApiError,
  type AnswerResult,
  type GameResult,
  type Question,
  type ScoreSubmitted,
} from '@/api'

export type Phase =
  | 'idle'
  | 'loading' // oturum açılıyor / soru bekleniyor
  | 'question' // soru ekranda, geri sayım sürüyor
  | 'locked' // cevap gönderildi, sunucu yanıtı bekleniyor
  | 'feedback' // doğru/yanlış gösteriliyor
  | 'finished' // oyun bitti, sonuç hazır
  | 'error'

export interface Feedback {
  selectedChoiceId: number | null
  result: AnswerResult
}

/**
 * Oyun durumu yalnızca bellekte tutulur (sayfa yenilenirse oyun biter).
 * Puanı sunucu hesaplar; buradaki değerler yalnızca sunucu yanıtlarının yansımasıdır.
 */
export const useGameStore = defineStore('game', () => {
  const sessionId = ref<string | null>(null)
  const categorySlug = ref<string | null>(null)
  const question = ref<Question | null>(null)
  const feedback = ref<Feedback | null>(null)
  const phase = ref<Phase>('idle')
  const runningScore = ref(0)
  const result = ref<GameResult | null>(null)
  const submitted = ref<ScoreSubmitted | null>(null)
  const errorMessage = ref('')

  // Terk edilen oyunlardan gelen geç yanıtları yok saymak için.
  let run = 0
  let retryAction: (() => Promise<void>) | null = null

  const isActive = computed(() =>
    ['loading', 'question', 'locked', 'feedback'].includes(phase.value),
  )

  function fail(e: unknown, retry: () => Promise<void>) {
    errorMessage.value = e instanceof ApiError ? e.message : 'Beklenmeyen bir hata oluştu.'
    retryAction = retry
    phase.value = 'error'
  }

  function reset() {
    run++
    sessionId.value = null
    categorySlug.value = null
    question.value = null
    feedback.value = null
    phase.value = 'idle'
    runningScore.value = 0
    result.value = null
    submitted.value = null
    errorMessage.value = ''
    retryAction = null
  }

  async function start(slug: string) {
    reset()
    const token = run
    categorySlug.value = slug
    phase.value = 'loading'
    const begin = async () => {
      try {
        const created = await api.createSession(slug)
        if (token !== run) return
        sessionId.value = created.session_id
        await fetchQuestion()
      } catch (e) {
        if (token === run) fail(e, begin)
      }
    }
    await begin()
  }

  async function fetchQuestion() {
    const token = run
    const id = sessionId.value
    if (!id) return
    phase.value = 'loading'
    try {
      const q = await api.question(id)
      if (token !== run) return
      question.value = q
      feedback.value = null
      phase.value = 'question'
    } catch (e) {
      if (token !== run) return
      if (e instanceof ApiError && ['session_finished', 'session_not_active'].includes(e.code)) {
        await loadResult()
      } else {
        fail(e, fetchQuestion)
      }
    }
  }

  /** choiceId null: süre doldu. Başarılıysa sunucu yanıtını döner. */
  async function answer(choiceId: number | null): Promise<AnswerResult | null> {
    const token = run
    const id = sessionId.value
    const q = question.value
    if (phase.value !== 'question' || !id || !q) return null
    phase.value = 'locked'
    feedback.value = {
      selectedChoiceId: choiceId,
      result: { is_correct: false, correct_choice_id: -1, score_gained: 0, finished: false },
    }
    const send = async (): Promise<AnswerResult | null> => {
      try {
        const res = await api.answer(id, q.position, choiceId)
        if (token !== run) return null
        feedback.value = { selectedChoiceId: choiceId, result: res }
        runningScore.value += res.score_gained
        phase.value = 'feedback'
        return res
      } catch (e) {
        if (token !== run) return null
        if (e instanceof ApiError && e.code === 'already_answered') {
          // Sunucu soruyu zaten kapatmış (ör. önceki isteğin yanıtı kayboldu).
          await fetchQuestion()
        } else if (e instanceof ApiError && e.code === 'session_not_active') {
          await loadResult()
        } else {
          fail(e, async () => {
            await send()
          })
        }
        return null
      }
    }
    return send()
  }

  /** Geri bildirim sonrası sıradaki adım. */
  async function advance() {
    if (phase.value !== 'feedback') return
    if (feedback.value?.result.finished) await loadResult()
    else await fetchQuestion()
  }

  async function loadResult() {
    const token = run
    const id = sessionId.value
    if (!id) return
    phase.value = 'loading'
    try {
      const res = await api.result(id)
      if (token !== run) return
      result.value = res
      phase.value = 'finished'
    } catch (e) {
      if (token === run) fail(e, loadResult)
    }
  }

  async function submitScore(name: string): Promise<ScoreSubmitted> {
    if (!sessionId.value) throw new ApiError('no_session', 'Aktif oyun yok.', 0)
    const res = await api.submitScore(sessionId.value, name)
    submitted.value = res
    if (result.value) result.value.score_submitted = true
    return res
  }

  async function retry() {
    const action = retryAction
    if (!action) return
    errorMessage.value = ''
    phase.value = 'loading'
    await action()
  }

  return {
    sessionId,
    categorySlug,
    question,
    feedback,
    phase,
    runningScore,
    result,
    submitted,
    errorMessage,
    isActive,
    start,
    answer,
    advance,
    submitScore,
    retry,
    reset,
  }
})
