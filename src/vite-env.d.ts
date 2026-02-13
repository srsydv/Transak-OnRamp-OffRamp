/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TRANSAK_API_KEY: string
  readonly VITE_TRANSAK_ENV: 'staging' | 'production'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
