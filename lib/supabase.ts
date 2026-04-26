import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export const hasSupabase = Boolean(url && anon)

// Anon client — safe in browser; used for Realtime subscriptions
export const supabase = hasSupabase ? createClient(url, anon) : null

// Admin client — uses service role key in server contexts (bypasses RLS)
export const supabaseAdmin = hasSupabase
  ? createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY || anon)
  : null
