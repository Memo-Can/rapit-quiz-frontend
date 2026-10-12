import { expect, test, type Page } from '@playwright/test'

const TOTAL = 20
const categories = [
  { id: 1, slug: 'fizik', name: 'Fizik', icon: '⚛️', color: '#FF9F43' },
  { id: 2, slug: 'yazilim', name: 'Yazılım', icon: '💻', color: '#6C5CE7' },
]

/** Backend'i taklit eder: her soruda 1 numaralı şık (id: pos*10+1) doğrudur. */
async function mockApi(page: Page) {
  let position = 0
  const board: unknown[] = []

  await page.route('**/api/v1/**', async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname.replace('/api/v1', '')
    const method = route.request().method()
    const json = (body: unknown, status = 200) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        headers: { 'access-control-allow-origin': '*' },
        body: JSON.stringify(body),
      })

    if (method === 'OPTIONS') {
      return route.fulfill({
        status: 204,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-headers': 'content-type',
          'access-control-allow-methods': 'GET,POST,OPTIONS',
        },
      })
    }
    if (path === '/categories/') return json(categories)
    if (path === '/sessions/' && method === 'POST') {
      position = 0
      return json({ session_id: 'sid-1', category: 'fizik', question_count: TOTAL }, 201)
    }
    if (path.endsWith('/question/')) {
      position += 1
      return json({
        position,
        total_questions: TOTAL,
        text: `Test sorusu ${position}`,
        choices: [1, 2, 3, 4].map((n) => ({ id: position * 10 + n, text: `Şık ${n}` })),
        time_limit_ms: 5000,
        remaining_ms: 5000,
      })
    }
    if (path.endsWith('/answer/')) {
      const body = route.request().postDataJSON() as {
        question_position: number
        choice_id: number
      }
      const correct = body.choice_id === body.question_position * 10 + 1
      return json({
        is_correct: correct,
        correct_choice_id: body.question_position * 10 + 1,
        score_gained: correct ? 150 : 0,
        finished: body.question_position === TOTAL,
      })
    }
    if (path.endsWith('/result/')) {
      return json({
        category: 'fizik',
        total_score: 3000,
        correct_count: 20,
        question_count: TOTAL,
        total_time_ms: 20000,
        score_submitted: false,
      })
    }
    if (path.endsWith('/submit-score/')) {
      const { player_name } = route.request().postDataJSON() as { player_name: string }
      board.push({
        rank: 1,
        entry_id: 7,
        player_name,
        score: 3000,
        correct_count: 20,
        total_time_ms: 20000,
      })
      return json({ entry_id: 7, rank: 1, player_name, score: 3000 }, 201)
    }
    if (path === '/leaderboard/') return json(board)
    return json({ error: { code: 'not_found', message: 'yok' } }, 404)
  })
}

test('kategori seç, 20 soruyu klavyeyle oyna, skoru kaydet, tabloda gör', async ({ page }) => {
  test.setTimeout(90_000)
  await mockApi(page)

  await page.goto('/')
  await page.getByRole('link', { name: /Fizik/ }).click()
  await expect(page).toHaveURL(/\/play\/fizik$/)

  for (let n = 1; n <= TOTAL; n++) {
    await expect(page.getByRole('heading', { name: `Test sorusu ${n}` })).toBeVisible()
    await page.keyboard.press('1')
    await expect(page.getByRole('status').filter({ hasText: 'Doğru! +150' })).toBeVisible()
  }

  await expect(page).toHaveURL(/\/result$/)
  await expect(page.getByLabel('Toplam puan')).toHaveText('3000')
  await expect(page.getByText('20/20')).toBeVisible()

  const save = page.getByRole('button', { name: 'Skoru Kaydet' })
  await expect(save).toBeDisabled()
  await page.getByLabel('Skor tablosu için adın').fill('Z')
  await expect(save).toBeDisabled() // en az 2 karakter
  await page.getByLabel('Skor tablosu için adın').fill('Zeynep')
  await save.click()

  await expect(page).toHaveURL(/\/leaderboard\/fizik$/)
  await expect(page.getByText('Zeynep, 3000 puanla')).toBeVisible()
  await expect(page.getByRole('listitem').filter({ hasText: 'Sen' })).toContainText('Zeynep')
})

test('sunucuya ulaşılamazsa hata gösterir ve tekrar dene çalışır', async ({ page }) => {
  let fail = true
  await page.route('**/api/v1/categories/', (route) =>
    fail
      ? route.abort()
      : route.fulfill({
          contentType: 'application/json',
          headers: { 'access-control-allow-origin': '*' },
          body: JSON.stringify(categories),
        }),
  )
  await page.goto('/')
  await expect(page.getByRole('alert')).toContainText('Sunucuya ulaşılamadı')
  fail = false
  await page.getByRole('button', { name: 'Tekrar dene' }).click()
  await expect(page.getByRole('link', { name: /Fizik/ })).toBeVisible()
})

test('oyun belleğinde değilken /result ana sayfaya döner', async ({ page }) => {
  await mockApi(page)
  await page.goto('/result')
  await expect(page).toHaveURL(/\/$/)
})
