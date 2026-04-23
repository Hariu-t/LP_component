'use client';

import { createContext, useContext } from 'react';
import type { User } from '@supabase/supabase-js';
import type { Profile } from './database.types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_DISABLED_CONTEXT: AuthContextType = {
  user: null,
  profile: null,
  loading: false,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthContext.Provider value={AUTH_DISABLED_CONTEXT}>
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
