'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { buildPreviewValues, renderComponentTemplate } from '@/lib/render-component';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader as Loader2, Plus, Trash2 } from 'lucide-react';
import type { ComponentSchema } from '@/lib/database.types';

export default function NewComponentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'general',
    html_template: '',
    css_template: '',
  });
  const [schema, setSchema] = useState<ComponentSchema[]>([]);

  const previewHtml = formData.html_template.trim()
    ? renderComponentTemplate(formData.html_template, buildPreviewValues(schema))
    : '';

  const handleAddField = () => {
    setSchema([
      ...schema,
      {
        name: '',
        type: 'text',
        label: '',
        default: '',
      },
    ]);
  };

  const handleUpdateField = (index: number, field: Partial<ComponentSchema>) => {
    const newSchema = [...schema];
    newSchema[index] = { ...newSchema[index], ...field };
    setSchema(newSchema);
  };

  const handleRemoveField = (index: number) => {
    setSchema(schema.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('components').insert({
        ...formData,
        schema_json: schema,
      } as any);

      if (error) throw error;

      toast.success('コンポーネントを作成しました');
      router.push('/dashboard/components');
    } catch (error: any) {
      toast.error(error.message || 'コンポーネントの作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const previewCard = (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>プレビュー</CardTitle>
        <CardDescription>
          編集内容がリアルタイムで反映されます
        </CardDescription>
      </CardHeader>
      <CardContent>
        {previewHtml ? (
          <div className="rounded-lg border bg-white overflow-auto min-h-[200px]">
            {formData.css_template.trim() && (
              <style dangerouslySetInnerHTML={{ __html: formData.css_template }} />
            )}
            <div
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-[200px] rounded-lg border border-dashed text-sm text-slate-500">
            プレビューする HTML を入力してください
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">新規コンポーネント</h1>
        <p className="text-slate-600 mt-1">
          カスタマイズ可能なプロパティ付きの再利用コンポーネントを作成します
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] lg:items-start">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
              <CardDescription>
                コンポーネント名、説明、カテゴリを設定します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">コンポーネント名 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ヒーローセクション"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">説明</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="見出し、サブ見出し、CTAボタン付きのヒーローセクション"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">カテゴリ</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">一般</SelectItem>
                    <SelectItem value="hero">ヒーロー</SelectItem>
                    <SelectItem value="cta">CTA</SelectItem>
                    <SelectItem value="form">フォーム</SelectItem>
                    <SelectItem value="feature">機能紹介</SelectItem>
                    <SelectItem value="testimonial">お客様の声</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>テンプレートコード</CardTitle>
              <CardDescription>
                HTML構造とスタイルを定義します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="html_template">HTMLテンプレート *</Label>
                <Textarea
                  id="html_template"
                  value={formData.html_template}
                  onChange={(e) => setFormData({ ...formData, html_template: e.target.value })}
                  placeholder='<div className="hero">
  <h1>{{headline}}</h1>
  <p>{{subheadline}}</p>
  <button>{{ctaText}}</button>
</div>'
                  rows={10}
                  className="font-mono text-sm"
                  required
                />
                <p className="text-xs text-slate-500">
                  動的な値には二重波括弧を使います: {'{{'} fieldName {'}}'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="css_template">CSS / Tailwind クラス</Label>
                <Textarea
                  id="css_template"
                  value={formData.css_template}
                  onChange={(e) => setFormData({ ...formData, css_template: e.target.value })}
                  placeholder=".hero { padding: 4rem 2rem; text-align: center; }"
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>編集可能フィールド</CardTitle>
              <CardDescription>
                このコンポーネント利用時にカスタマイズできるプロパティを定義します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {schema.map((field, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">フィールド {index + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveField(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>フィールド名</Label>
                      <Input
                        value={field.name}
                        onChange={(e) => handleUpdateField(index, { name: e.target.value })}
                        placeholder="headline"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label>タイプ</Label>
                      <Select
                        value={field.type}
                        onValueChange={(value: any) => handleUpdateField(index, { type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">テキスト</SelectItem>
                          <SelectItem value="textarea">テキストエリア</SelectItem>
                          <SelectItem value="image">画像</SelectItem>
                          <SelectItem value="color">色</SelectItem>
                          <SelectItem value="url">URL</SelectItem>
                          <SelectItem value="select">セレクト</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label>ラベル</Label>
                      <Input
                        value={field.label}
                        onChange={(e) => handleUpdateField(index, { label: e.target.value })}
                        placeholder="見出しテキスト"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label>デフォルト値</Label>
                      <Input
                        value={field.default || ''}
                        onChange={(e) => handleUpdateField(index, { default: e.target.value })}
                        placeholder="サイトへようこそ"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button type="button" variant="outline" onClick={handleAddField} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                フィールドを追加
              </Button>
            </CardContent>
          </Card>

          <div className="lg:hidden">{previewCard}</div>

          <div className="flex justify-end space-x-3">
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
              コンポーネントを作成
            </Button>
          </div>
        </form>

        <aside className="hidden lg:block sticky top-6 self-start">
          {previewCard}
        </aside>
      </div>
    </div>
  );
}
