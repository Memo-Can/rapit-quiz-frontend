/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API kök adresi, örn. https://api.rapitquiz.example (sonunda / olmadan) */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
