import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { ApiError, type AnswerResult, type Question } from '@/api'
import { useGameStore } from '../game'

type Fn = (...args: unknown[]) => Promise<unknown>

vi.mock('@/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api')>()
  return {
    ...actual,
    api: {
      createSession: vi.fn<Fn>(),
      question: vi.fn<Fn>(),
      answer: vi.fn<Fn>(),
      result: vi.fn<Fn>(),
      submitScore: vi.fn<Fn>(),
    },
  }
})

import { api } from '@/api'
const mocked = vi.mocked(api)

const question = (position: number): Question => ({
  position,
  total_questions: 20,
  text: `Soru ${position}`,
  choices: [1, 2, 3, 4].map((id) => ({ id: position * 10 + id, text: `Şık ${id}` })),
  time_limit_ms: 5000,
  remaining_ms: 5000,
})

const answerResult = (over: Partial<AnswerResult> = {}): AnswerResult => ({
  is_correct: true,
  correct_choice_id: 11,
  score_gained: 130,
  finished: false,
  ...over,
})

beforeEach(() => {
  setActivePinia(createPinia())
  vi.resetAllMocks()
  mocked.createSession.mockResolvedValue({
    session_id: 'sid',
    category: 'fizik',
    question_count: 20,
  })
  mocked.question.mockResolvedValue(question(1))
})

describe('game store', () => {
  it('oyunu başlatır ve ilk soruyu getirir', async () => {
    const game = useGameStore()
    await game.start('fizik')
    expect(game.sessionId).toBe('sid')
    expect(game.phase).toBe('question')
    expect(game.question?.position).toBe(1)
  })

  it('cevap sonrası geri bildirim gösterir ve puanı sunucudan toplar', async () => {
    const game = useGameStore()
    await game.start('fizik')
    mocked.answer.mockResolvedValue(answerResult())
    const res = await game.answer(11)
    expect(mocked.answer).toHaveBeenCalledWith('sid', 1, 11)
    expect(res?.score_gained).toBe(130)
    expect(game.phase).toBe('feedback')
    expect(game.runningScore).toBe(130)
  })

  it('süre dolunca null cevap gönderir', async () => {
    const game = useGameStore()
    await game.start('fizik')
    mocked.answer.mockResolvedValue(answerResult({ is_correct: false, score_gained: 0 }))
    await game.answer(null)
    expect(mocked.answer).toHaveBeenCalledWith('sid', 1, null)
    expect(game.feedback?.selectedChoiceId).toBeNull()
  })

  it('aynı soruya ikinci cevap yok sayılır', async () => {
    const game = useGameStore()
    await game.start('fizik')
    mocked.answer.mockResolvedValue(answerResult())
    await game.answer(11)
    expect(await game.answer(12)).toBeNull()
    expect(mocked.answer).toHaveBeenCalledTimes(1)
  })

  it('advance: bitmediyse sonraki soruyu getirir', async () => {
    const game = useGameStore()
    await game.start('fizik')
    mocked.answer.mockResolvedValue(answerResult())
    await game.answer(11)
    mocked.question.mockResolvedValue(question(2))
    await game.advance()
    expect(game.question?.position).toBe(2)
    expect(game.phase).toBe('question')
    expect(game.feedback).toBeNull()
  })

  it('advance: son cevaptan sonra sonucu yükler', async () => {
    const game = useGameStore()
    await game.start('fizik')
    mocked.answer.mockResolvedValue(answerResult({ finished: true }))
    mocked.result.mockResolvedValue({
      category: 'fizik',
      total_score: 2400,
      correct_count: 18,
      question_count: 20,
      total_time_ms: 40000,
      score_submitted: false,
    })
    await game.answer(11)
    await game.advance()
    expect(game.phase).toBe('finished')
    expect(game.result?.total_score).toBe(2400)
  })

  it('ağ hatasında error fazına geçer ve retry ile devam eder', async () => {
    const game = useGameStore()
    await game.start('fizik')
    mocked.answer.mockRejectedValueOnce(new ApiError('network_error', 'Sunucuya ulaşılamadı.', 0))
    await game.answer(11)
    expect(game.phase).toBe('error')
    expect(game.errorMessage).toContain('ulaşılamadı')

    mocked.answer.mockResolvedValue(answerResult())
    await game.retry()
    expect(game.phase).toBe('feedback')
    expect(game.runningScore).toBe(130)
  })

  it('already_answered hatasında sıradaki soruya geçer', async () => {
    const game = useGameStore()
    await game.start('fizik')
    mocked.answer.mockRejectedValue(new ApiError('already_answered', 'Zaten cevaplandı.', 409))
    mocked.question.mockResolvedValue(question(2))
    await game.answer(11)
    expect(game.question?.position).toBe(2)
    expect(game.phase).toBe('question')
  })

  it('soru isteğinde session_finished gelirse sonucu yükler', async () => {
    const game = useGameStore()
    mocked.question.mockRejectedValue(new ApiError('session_finished', 'Oyun bitti.', 409))
    mocked.result.mockResolvedValue({
      category: 'fizik',
      total_score: 0,
      correct_count: 0,
      question_count: 20,
      total_time_ms: 100000,
      score_submitted: false,
    })
    await game.start('fizik')
    expect(game.phase).toBe('finished')
  })

  it('terk edilen oyundan gelen geç yanıt yeni oyunu bozmaz', async () => {
    const game = useGameStore()
    let release!: (v: Question) => void
    mocked.question.mockReturnValueOnce(new Promise((r) => (release = r)))
    const first = game.start('fizik')
    await vi.waitFor(() => expect(mocked.question).toHaveBeenCalled())
    game.reset()
    release(question(7))
    await first
    expect(game.question).toBeNull()
    expect(game.phase).toBe('idle')
  })

  it('skoru gönderir ve sonucu işaretler', async () => {
    const game = useGameStore()
    await game.start('fizik')
    mocked.submitScore.mockResolvedValue({ entry_id: 5, rank: 2, player_name: 'Ali', score: 100 })
    const res = await game.submitScore('Ali')
    expect(res.rank).toBe(2)
    expect(game.submitted?.entry_id).toBe(5)
  })
})
