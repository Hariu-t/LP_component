'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LayoutDashboard,
  Box,
  FileText,
  Image,
  LogOut,
  User,
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, profile, loading, signOut } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-8 w-48" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

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
                Dashboard
              </Button>
            </Link>
            <Link href="/dashboard/components">
              <Button variant="ghost" size="sm">
                <Box className="mr-2 h-4 w-4" />
                Components
              </Button>
            </Link>
            <Link href="/dashboard/pages">
              <Button variant="ghost" size="sm">
                <FileText className="mr-2 h-4 w-4" />
                Pages
              </Button>
            </Link>
            <Link href="/dashboard/assets">
              <Button variant="ghost" size="sm">
                <Image className="mr-2 h-4 w-4" />
                Assets
              </Button>
            </Link>
          </nav>

          <div className="ml-auto flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-slate-600" />
              <span className="text-sm text-slate-600">
                {profile?.full_name || profile?.email}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <main className="p-6">
        {children}
      </main>
    </div>
  );
}
