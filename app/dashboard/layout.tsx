'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Box,
  FileText,
  Image,
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
            <span className="text-sm text-slate-600">認証無効モード</span>
          </div>
        </div>
      </div>

      <main className="p-6">
        {children}
      </main>
    </div>
  );
}
