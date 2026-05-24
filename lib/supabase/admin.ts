import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

/**
 * Server-only Supabase client for the Dreamer Dash backend.
 * Uses the service_role key, so it must NEVER be imported into client components.
 */
export function getDreamerDashDb(): SupabaseClient | null {
  if (_client) return _client

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    console.warn('[supabase] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set — Dreamer Dash integration disabled.')
    return null
  }

  _client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return _client
}
