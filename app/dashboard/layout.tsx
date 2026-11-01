'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Box,
  FileText,
  Image,
  LogOut,
  Loader as Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, profile, loading, signOut } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('ログアウトしました');
      router.replace('/login');
    } catch (error: any) {
      toast.error(error?.message || 'ログアウトに失敗しました');
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
      </div>
    );
  }

  const displayName =
    profile?.full_name || profile?.email || user.email || 'ユーザー';

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b bg-white">
        <div className="flex h-16 items-center px-6">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <LayoutDashboard className="h-6 w-6" />
            <span className="text-xl font-bold">LP Builder</span>
          </Link>

          <nav className="ml-12 flex items-center space-x-1">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                ダッシュボード
              </Button>
            </Link>
            <Link href="/dashboard/components">
              <Button variant="ghost" size="sm">
                <Box className="mr-2 h-4 w-4" />
                コンポーネント
              </Button>
            </Link>
            <Link href="/dashboard/pages">
              <Button variant="ghost" size="sm">
                <FileText className="mr-2 h-4 w-4" />
                ページ
              </Button>
            </Link>
            <Link href="/dashboard/assets">
              <Button variant="ghost" size="sm">
                <Image className="mr-2 h-4 w-4" />
                アセット
              </Button>
            </Link>
          </nav>

          <div className="ml-auto flex items-center space-x-3">
            <span className="text-sm text-slate-600 max-w-[12rem] truncate">
              {displayName}
            </span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              ログアウト
            </Button>
          </div>
        </div>
      </div>

      <main className="p-6">{children}</main>
    </div>
  );
}
