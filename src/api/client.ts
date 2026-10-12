import type {
  AnswerResult,
  Category,
  GameResult,
  LeaderboardEntry,
  Question,
  ScoreSubmitted,
  SessionCreated,
} from './types'

/** Backend hata gövdesi: {"error": {"code", "message"}} */
export class ApiError extends Error {
  readonly code: string
  readonly status: number
  readonly details?: unknown

  constructor(code: string, message: string, status: number, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.details = details
  }
}

const baseUrl = () => (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')

async function request<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const hasBody = init.body !== undefined
  let response: Response
  try {
    response = await fetch(`${baseUrl()}/api/v1${path}`, {
      method: init.method ?? 'GET',
      // GET isteklerinde Content-Type göndermemek gereksiz CORS preflight'ı önler.
      headers: hasBody ? { 'Content-Type': 'application/json' } : undefined,
      body: hasBody ? JSON.stringify(init.body) : undefined,
    })
  } catch {
    throw new ApiError('network_error', 'Sunucuya ulaşılamadı. İnternet bağlantını kontrol et.', 0)
  }

  let data: unknown = null
  try {
    data = await response.json()
  } catch {
    // gövde JSON değil
  }

  if (!response.ok) {
    const err = (data as { error?: { code?: string; message?: string; details?: unknown } } | null)
      ?.error
    throw new ApiError(
      err?.code ?? 'unknown_error',
      err?.message ?? 'Beklenmeyen bir hata oluştu.',
      response.status,
      err?.details,
    )
  }
  return data as T
}

export const api = {
  categories: () => request<Category[]>('/categories/'),

  createSession: (category: string) =>
    request<SessionCreated>('/sessions/', { method: 'POST', body: { category } }),

  question: (sessionId: string) => request<Question>(`/sessions/${sessionId}/question/`),

  answer: (sessionId: string, questionPosition: number, choiceId: number | null) =>
    request<AnswerResult>(`/sessions/${sessionId}/answer/`, {
      method: 'POST',
      body: { question_position: questionPosition, choice_id: choiceId },
    }),

  result: (sessionId: string) => request<GameResult>(`/sessions/${sessionId}/result/`),

  submitScore: (sessionId: string, playerName: string) =>
    request<ScoreSubmitted>(`/sessions/${sessionId}/submit-score/`, {
      method: 'POST',
      body: { player_name: playerName },
    }),

  leaderboard: (category: string, limit = 10) =>
    request<LeaderboardEntry[]>(
      `/leaderboard/?category=${encodeURIComponent(category)}&limit=${limit}`,
    ),
}
