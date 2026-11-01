'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import {
  DENIED_MESSAGE,
  ensureBootstrapAdmin,
  isEmailAllowed,
} from '@/lib/access';
import type { Profile } from './database.types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  /** After OAuth callback: verify allowlist; signs out and throws if denied. */
  enforceAccess: (sessionUser?: User | null) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Failed to load profile', error);
    return null;
  }

  return data;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const enforceAccess = useCallback(async (sessionUser?: User | null) => {
    let current = sessionUser ?? null;

    if (!current) {
      const { data } = await supabase.auth.getUser();
      current = data.user;
    }

    if (!current) {
      throw new Error('セッションが見つかりません');
    }

    const email = current.email;
    const allowed = await isEmailAllowed(email);

    if (!allowed) {
      await supabase.auth.signOut();
      throw new Error(DENIED_MESSAGE);
    }

    await ensureBootstrapAdmin(current.id, email);
    return current;
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      const sessionUser = data.session?.user ?? null;
      if (!sessionUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const allowedUser = await enforceAccess(sessionUser);
        if (!mounted) return;
        setUser(allowedUser);
        setProfile(await fetchProfile(allowedUser.id));
      } catch {
        if (!mounted) return;
        setUser(null);
        setProfile(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user ?? null;
      if (!sessionUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      // Callback page runs enforceAccess; avoid racing sign-out on every event.
      setUser(sessionUser);
      fetchProfile(sessionUser.id).then((p) => {
        if (mounted) setProfile(p);
      });
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [enforceAccess]);

  const signInWithGoogle = useCallback(async () => {
    const origin =
      typeof window !== 'undefined' ? window.location.origin : '';
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signInWithGoogle, signOut, enforceAccess }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
