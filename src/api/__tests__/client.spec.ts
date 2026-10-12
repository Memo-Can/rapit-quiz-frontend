import { afterEach, describe, expect, it, vi } from 'vitest'

import { api, ApiError } from '../client'

function mockFetch(status: number, body: unknown) {
  const fn = vi.fn<typeof fetch>().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response)
  vi.stubGlobal('fetch', fn)
  return fn
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('api client', () => {
  it('GET isteğinde Content-Type göndermez ve base URL kullanır', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example/')
    const fetchMock = mockFetch(200, [])
    await api.categories()
    const [url, rawInit] = fetchMock.mock.calls[0]!
    const init = rawInit!
    expect(url).toBe('https://api.example/api/v1/categories/')
    expect(init.method).toBe('GET')
    expect(init.headers).toBeUndefined()
  })

  it('POST gövdesini JSON olarak gönderir', async () => {
    const fetchMock = mockFetch(200, { is_correct: true })
    await api.answer('sid', 3, null)
    const [url, rawInit] = fetchMock.mock.calls[0]!
    const init = rawInit!
    expect(url).toContain('/api/v1/sessions/sid/answer/')
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' })
    expect(JSON.parse(init.body as string)).toEqual({ question_position: 3, choice_id: null })
  })

  it('backend hata gövdesini ApiError olarak fırlatır', async () => {
    mockFetch(409, { error: { code: 'already_answered', message: 'Zaten cevaplandı.' } })
    const err = await api.question('sid').catch((e) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err).toMatchObject({
      code: 'already_answered',
      status: 409,
      message: 'Zaten cevaplandı.',
    })
  })

  it('ağ hatasını network_error koduna çevirir', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Failed to fetch')),
    )
    await expect(api.categories()).rejects.toMatchObject({ code: 'network_error', status: 0 })
  })

  it('kategori slug değerini URL için kodlar', async () => {
    const fetchMock = mockFetch(200, [])
    await api.leaderboard('a b', 5)
    expect(fetchMock.mock.calls[0]![0]).toContain('/leaderboard/?category=a%20b&limit=5')
  })
})
