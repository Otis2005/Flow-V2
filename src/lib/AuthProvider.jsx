import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient.js';

const AuthContext = createContext({
  user: null,
  session: null,
  isAdmin: false,
  loading: true,
  signInWithMagicLink: async () => ({ error: new Error('Supabase not configured') }),
  signOut: async () => {}
});

// Read admin allowlist from build-time env. Falls back to the canonical admin
// so the gate still works in dev before Supabase is wired up.
const RAW_ADMIN_LIST = import.meta.env.VITE_ADMIN_EMAILS || 'kennedynange@gmail.com';
const ADMIN_EMAILS = RAW_ADMIN_LIST.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    let unsub;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    unsub = listener.subscription;
    return () => unsub?.unsubscribe();
  }, []);

  const signInWithMagicLink = useCallback(async (email) => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local') };
    }
    const redirectTo = `${window.location.origin}/admin`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo }
    });
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    await supabase.auth.signOut();
  }, []);

  const user = session?.user ?? null;
  const isAdmin = !!user && ADMIN_EMAILS.includes((user.email || '').toLowerCase());

  return (
    <AuthContext.Provider
      value={{ user, session, isAdmin, loading, signInWithMagicLink, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export { ADMIN_EMAILS };
