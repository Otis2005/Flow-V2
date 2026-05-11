import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn(
    '[TenderFlow] Supabase env vars are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local. The app will run in demo mode against bundled sample data until you do.'
  );
}

export const supabase =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      })
    : null;

export const isSupabaseConfigured = Boolean(supabase);
