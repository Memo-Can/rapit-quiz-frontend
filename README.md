# Rapit Quiz — Frontend

Vue 3 + Vite + TypeScript + Pinia + Vue Router. Backend: `../rapit-quiz-backend`
(proje dokümanı: `../rapit-quiz-backend/docs/PROJE_DOKUMANI.md`).

## Çalıştırma

```bash
npm ci
cp .env.example .env.local     # VITE_API_BASE_URL=http://localhost:8000
npm run dev                    # http://localhost:5173
```

Backend'in `CORS_ALLOWED_ORIGINS` değeri frontend adresini içermelidir
(yerelde `http://localhost:5173`; `127.0.0.1` ile açarsanız onu da ekleyin).

> `.npmrc` içinde `legacy-peer-deps=true` vardır: npm 10'un peer-dependency çözücüsü
> bu bağımlılık ağacında hata veriyor.

## Komutlar

| Komut | Açıklama |
|---|---|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Tip kontrolü + üretim derlemesi (`dist/`) |
| `npm run lint` | oxlint + eslint |
| `npx vitest run` | Birim testleri (API istemcisi, oyun store'u, bileşenler) |
| `npm run test:e2e` | Playwright (API mock'lanır; ilk kez `npx playwright install chromium`) |

## Yapı

- `src/api/` — tipli fetch istemcisi; backend hata biçimi `ApiError` olur.
  Tipler backend OpenAPI şemasıyla (`/api/v1/schema/`) uyumlu tutulmalıdır.
- `src/stores/game.ts` — oyun durumu makinesi (`loading → question → locked → feedback → finished`).
  Yalnızca bellekte tutulur; sayfa yenilenirse oyun biter. Geç gelen yanıtlar `run` sayacıyla yok sayılır.
- `src/composables/useCountdown.ts` — görsel geri sayım. Süre ve puan **sunucuda** doğrulanır;
  istemci süre bitince `choice_id: null` gönderir.
- `src/views/` — `/` kategoriler, `/play/:category`, `/result`, `/leaderboard/:category?`.
- Tasarım: açık tema, Nunito/Poppins (`@fontsource`, yalnızca latin + latin-ext), renk + ikonla
  doğru/yanlış geri bildirimi, 1–4 tuşlarıyla şık seçimi, `prefers-reduced-motion` desteği.

## Dağıtım (DigitalOcean App Platform — Static Site)

`.do/app.yaml` taslağına bakın. Build: `npm ci && npm run build-only`, çıktı `dist`,
`catchall_document: index.html` (history modu). `VITE_API_BASE_URL` build zamanında verilir.
