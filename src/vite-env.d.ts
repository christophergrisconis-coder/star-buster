/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly SUPABASE_URL?: string
  readonly SUPABASE_ANON_KEY?: string
  readonly VITE_SITE_URL?: string
  readonly VITE_ADMIN_PASSWORD?: string
  readonly VITE_OWNER_PASSWORD?: string
  readonly VITE_RIVE_HUD_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
