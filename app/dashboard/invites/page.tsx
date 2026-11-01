'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import type { InvitedUser } from '@/lib/database.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader as Loader2, Trash2, UserPlus } from 'lucide-react';

export default function InvitesPage() {
  const router = useRouter();
  const { profile, user, loading: authLoading } = useAuth();
  const [invites, setInvites] = useState<InvitedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = profile?.role === 'admin';

  const loadInvites = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('invited_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error(error.message || '招待一覧の取得に失敗しました');
      setInvites([]);
    } else {
      setInvites(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) {
      router.replace('/dashboard');
      return;
    }
    void loadInvites();
  }, [authLoading, isAdmin, loadInvites, router]);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (!normalized || !normalized.includes('@')) {
      toast.error('有効なメールアドレスを入力してください');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('invited_users').insert({
        email: normalized,
        invited_by: user?.id ?? null,
      });
      if (error) {
        if (/duplicate|unique/i.test(error.message)) {
          throw new Error('このメールアドレスは既に招待済みです');
        }
        throw error;
      }
      toast.success('招待を追加しました');
      setEmail('');
      await loadInvites();
    } catch (error: any) {
      toast.error(error?.message || '招待の追加に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('invited_users').delete().eq('id', id);
    if (error) {
      toast.error(error.message || '削除に失敗しました');
      return;
    }
    toast.success('招待を削除しました');
    setInvites((prev) => prev.filter((row) => row.id !== id));
  };

  if (authLoading || !isAdmin) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">招待管理</h1>
        <p className="text-sm text-slate-600 mt-1">
          ここに登録したメールアドレスだけが Google ログインできます。
          初期管理者は環境変数 NEXT_PUBLIC_ALLOWED_EMAILS でも許可されます。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">メールを招待</CardTitle>
          <CardDescription>
            招待リンクは送信しません。相手は Google で同じメールでログインしてください。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-2">
              <Label htmlFor="invite-email" className="sr-only">
                メールアドレス
              </Label>
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@example.com"
                autoComplete="email"
              />
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="mr-2 h-4 w-4" />
              )}
              追加
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">招待一覧</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
            </div>
          ) : invites.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">まだ招待はありません</p>
          ) : (
            <ul className="divide-y">
              {invites.map((invite) => (
                <li
                  key={invite.id}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{invite.email}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(invite.created_at).toLocaleString('ja-JP')}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(invite.id)}
                    aria-label={`${invite.email} を削除`}
                  >
                    <Trash2 className="h-4 w-4 text-slate-500" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
