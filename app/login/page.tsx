'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader as Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [loading, user, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      toast.error('メールアドレスとパスワードを入力してください');
      return;
    }
    if (mode === 'signup' && !fullName.trim()) {
      toast.error('お名前を入力してください');
      return;
    }
    if (password.length < 6) {
      toast.error('パスワードは6文字以上にしてください');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'login') {
        await signIn(email.trim(), password);
        toast.success('ログインしました');
      } else {
        await signUp(email.trim(), password, fullName.trim());
        toast.success('アカウントを作成しました');
      }
      router.replace('/dashboard');
    } catch (error: any) {
      const message = String(error?.message || '');
      if (/Invalid login credentials/i.test(message)) {
        toast.error('メールアドレスまたはパスワードが正しくありません');
      } else if (/User already registered/i.test(message)) {
        toast.error('このメールアドレスは既に登録されています');
      } else if (/確認メール/.test(message)) {
        toast.message(message);
      } else {
        toast.error(message || '認証に失敗しました');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">LP Builder</CardTitle>
          <CardDescription>
            管理画面にアクセスするにはログインしてください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={mode}
            onValueChange={(value) => setMode(value as 'login' | 'signup')}
          >
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">ログイン</TabsTrigger>
              <TabsTrigger value="signup">新規登録</TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="space-y-4">
              <TabsContent value="signup" className="mt-0 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">お名前</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="山田 太郎"
                    autoComplete="name"
                  />
                </div>
              </TabsContent>

              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">パスワード</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="6文字以上"
                  autoComplete={
                    mode === 'login' ? 'current-password' : 'new-password'
                  }
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === 'login' ? 'ログイン' : 'アカウント作成'}
              </Button>
            </form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
