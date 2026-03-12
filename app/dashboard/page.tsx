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
      title: 'Components',
      value: stats.components,
      description: 'Reusable UI components',
      icon: Box,
      href: '/dashboard/components',
    },
    {
      title: 'Pages',
      value: stats.pages,
      description: 'Total landing pages',
      icon: FileText,
      href: '/dashboard/pages',
    },
    {
      title: 'Published',
      value: stats.published,
      description: 'Live pages',
      icon: TrendingUp,
      href: '/dashboard/pages',
    },
    {
      title: 'Assets',
      value: stats.assets,
      description: 'Images and media',
      icon: Image,
      href: '/dashboard/assets',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-slate-600 mt-1">
            Welcome to your LP builder platform
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
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/components/new">
              <Button variant="outline" className="w-full justify-start">
                <Box className="mr-2 h-4 w-4" />
                Create Component
              </Button>
            </Link>
            <Link href="/dashboard/pages/new">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                Create Page
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Learn how to use the platform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600">
            <p>1. Create reusable components with editable properties</p>
            <p>2. Build pages by combining components</p>
            <p>3. Preview and publish your landing pages</p>
            <p>4. Track component usage across pages</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
