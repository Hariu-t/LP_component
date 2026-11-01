'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { DENIED_MESSAGE } from '@/lib/access';
import { Loader as Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { enforceAccess } = useAuth();
  const [message, setMessage] = useState('ログインを確認しています…');

  useEffect(() => {
    let cancelled = false;

    const finish = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        const oauthError = url.searchParams.get('error_description')
          || url.searchParams.get('error');

        if (oauthError) {
          throw new Error(oauthError);
        }

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          // Implicit / hash fragment flow
          const { data, error } = await supabase.auth.getSession();
          if (error) throw error;
          if (!data.session) {
            throw new Error('セッションを取得できませんでした');
          }
        }

        await enforceAccess();
        if (cancelled) return;
        router.replace('/dashboard');
      } catch (error: any) {
        if (cancelled) return;
        const msg = String(error?.message || DENIED_MESSAGE);
        setMessage(msg);
        router.replace(`/login?error=${encodeURIComponent(msg)}`);
      }
    };

    void finish();
    return () => {
      cancelled = true;
    };
  }, [enforceAccess, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-50">
      <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
      <p className="text-sm text-slate-600">{message}</p>
    </div>
  );
}
