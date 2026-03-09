import { createClient } from '@supabase/supabase-js'

// Safe fallbacks prevent crash during static prerendering when env vars aren't injected yet.
// Actual API calls will only happen client-side where vars are always present.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
