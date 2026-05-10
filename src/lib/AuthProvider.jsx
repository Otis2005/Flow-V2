import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient.js';

const AuthContext = createContext(null);

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

  const signInWithMagicLink = useCallback(async (email, redirectPath = '/admin') => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local') };
    }
    const redirectTo = `${window.location.origin}${redirectPath}`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo }
    });
    return { error };
  }, []);

  const signInWithPassword = useCallback(async (email, password) => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase not configured') };
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password
    });
    return { error };
  }, []);

  const signUpWithPassword = useCallback(async (email, password, fullName) => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase not configured') };
    }
    const { error, data } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/dashboard`
      }
    });
    return { error, data };
  }, []);

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    await supabase.auth.signOut();
  }, []);

  const user = session?.user ?? null;
  const isAdmin = !!user && ADMIN_EMAILS.includes((user.email || '').toLowerCase());

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAdmin,
        loading,
        signInWithMagicLink,
        signInWithPassword,
        signUpWithPassword,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return {
      user: null,
      session: null,
      isAdmin: false,
      loading: false,
      signInWithMagicLink: async () => ({ error: new Error('AuthProvider missing') }),
      signInWithPassword: async () => ({ error: new Error('AuthProvider missing') }),
      signUpWithPassword: async () => ({ error: new Error('AuthProvider missing') }),
      signOut: async () => {}
    };
  }
  return ctx;
}

export { ADMIN_EMAILS };
