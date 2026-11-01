'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Box, FileText, Image, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    components: 0,
    pages: 0,
    assets: 0,
    published: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const [componentsRes, pagesRes, assetsRes, publishedRes] = await Promise.all([
      supabase.from('components').select('id', { count: 'exact', head: true }),
      supabase.from('pages').select('id', { count: 'exact', head: true }),
      supabase.from('assets').select('id', { count: 'exact', head: true }),
      supabase.from('pages').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    ]);

    setStats({
      components: componentsRes.count || 0,
      pages: pagesRes.count || 0,
      assets: assetsRes.count || 0,
      published: publishedRes.count || 0,
    });
  };

  const statCards = [
    {
      title: 'コンポーネント',
      value: stats.components,
      description: '再利用可能なUI部品',
      icon: Box,
      href: '/dashboard/components',
    },
    {
      title: 'ページ',
      value: stats.pages,
      description: 'ランディングページの合計',
      icon: FileText,
      href: '/dashboard/pages',
    },
    {
      title: '公開中',
      value: stats.published,
      description: '公開済みのページ',
      icon: TrendingUp,
      href: '/dashboard/pages',
    },
    {
      title: 'アセット',
      value: stats.assets,
      description: '画像・メディア',
      icon: Image,
      href: '/dashboard/assets',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ダッシュボード</h1>
          <p className="text-slate-600 mt-1">
            LP制作プラットフォームへようこそ
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} href={stat.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-slate-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-slate-600 mt-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>クイックアクション</CardTitle>
            <CardDescription>よく使う操作から始めましょう</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/components/new">
              <Button variant="outline" className="w-full justify-start">
                <Box className="mr-2 h-4 w-4" />
                コンポーネントを作成
              </Button>
            </Link>
            <Link href="/dashboard/pages/new">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                ページを作成
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>はじめに</CardTitle>
            <CardDescription>プラットフォームの使い方</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600">
            <p>1. 編集可能なプロパティ付きの再利用コンポーネントを作成</p>
            <p>2. コンポーネントを組み合わせてページを構築</p>
            <p>3. プレビューしてランディングページを公開</p>
            <p>4. ページ横断でのコンポーネント使用状況を確認</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
