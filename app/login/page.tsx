'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">LP Builder</CardTitle>
          <CardDescription>
            認証機能は一時的に無効化中です。Dashboardへ移動中...
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
