'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader as Loader2 } from 'lucide-react';

export default function NewPagePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
  });

  const handleSlugChange = (value: string) => {
    const slug = value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    setFormData({ ...formData, slug });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('ログインが必要です');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('pages')
        .insert({
          ...formData,
          created_by: user.id,
        } as any)
        .select()
        .single();

      if (error) throw error;

      toast.success('ページを作成しました');
      router.push(`/dashboard/pages/${(data as any).id}/edit`);
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('このスラッグのページは既に存在します');
      } else {
        toast.error(error.message || 'ページの作成に失敗しました');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">新規ページ</h1>
        <p className="text-slate-600 mt-1">
          新しいランディングページを作成します
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>ページ情報</CardTitle>
            <CardDescription>
              ランディングページの基本情報
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">ページタイトル *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="新商品ローンチページ"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">URLスラッグ *</Label>
              <div className="flex items-center">
                <span className="text-sm text-slate-500 mr-2">/</span>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="product-launch"
                  required
                />
              </div>
              <p className="text-xs text-slate-500">
                英字・数字・ハイフンのみ使用できます
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">説明</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="新商品ローンチキャンペーン用のランディングページ"
                rows={3}
              />
              <p className="text-xs text-slate-500">
                SEO用のメタディスクリプションとして使用されます
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                ページを作成
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
