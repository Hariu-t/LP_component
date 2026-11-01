'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  buildPreviewValues,
  extractPlaceholderNames,
  renderComponentTemplate,
  schemaForSave,
  syncSchemaWithPlaceholders,
} from '@/lib/render-component';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader as Loader2, Sparkles, Trash2 } from 'lucide-react';
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

  const placeholderNames = extractPlaceholderNames(formData.html_template);
  const placeholderSet = new Set(placeholderNames);
  const unusedFields = schema.filter((f) => f.name && !placeholderSet.has(f.name));

  const previewHtml = formData.html_template.trim()
    ? renderComponentTemplate(formData.html_template, buildPreviewValues(schema))
    : '';

  const handleHtmlChange = (html: string) => {
    setFormData({ ...formData, html_template: html });
    setSchema((prev) => syncSchemaWithPlaceholders(html, prev));
  };

  const handleDetectFields = () => {
    const next = syncSchemaWithPlaceholders(formData.html_template, schema);
    setSchema(next);
    const count = extractPlaceholderNames(formData.html_template).length;
    if (count === 0) {
      toast.message('HTML に {{フィールド名}} が見つかりませんでした');
    } else {
      toast.success(`${count} 件のフィールドを同期しました`);
    }
  };

  const handleUpdateField = (index: number, field: Partial<ComponentSchema>) => {
    const newSchema = [...schema];
    newSchema[index] = { ...newSchema[index], ...field };
    setSchema(newSchema);
  };

  const handleRemoveField = (index: number) => {
    setSchema(schema.filter((_, i) => i !== index));
  };

  const handleRemoveUnused = () => {
    setSchema(schema.filter((f) => f.name && placeholderSet.has(f.name)));
    toast.success('未使用フィールドを削除しました');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('components').insert({
        ...formData,
        schema_json: schemaForSave(formData.html_template, schema),
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
                HTML構造とスタイルを定義します。{'{{'} name {'}}'} は編集可能フィールドとして自動検出されます
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="html_template">HTMLテンプレート *</Label>
                <Textarea
                  id="html_template"
                  value={formData.html_template}
                  onChange={(e) => handleHtmlChange(e.target.value)}
                  placeholder='<div class="hero">
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
            <CardHeader className="flex flex-row items-start justify-between space-y-0 gap-4">
              <div className="space-y-1.5">
                <CardTitle>編集可能フィールド</CardTitle>
                <CardDescription>
                  HTML のプレースホルダから自動生成されます。ラベル・タイプ・デフォルトだけ調整してください
                </CardDescription>
              </div>
              <div className="flex shrink-0 gap-2">
                {unusedFields.length > 0 && (
                  <Button type="button" variant="outline" size="sm" onClick={handleRemoveUnused}>
                    未使用を削除
                  </Button>
                )}
                <Button type="button" variant="outline" size="sm" onClick={handleDetectFields}>
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  再検出
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {schema.length === 0 ? (
                <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-slate-500">
                  HTML に {'{{'} headline {'}}'} のようなプレースホルダを書くと、ここにフィールドが現れます
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="hidden sm:grid sm:grid-cols-[7rem_6.5rem_minmax(0,1fr)_minmax(0,1fr)_2.5rem] gap-2 px-1 text-xs font-medium text-slate-500">
                    <span>キー</span>
                    <span>タイプ</span>
                    <span>ラベル</span>
                    <span>デフォルト</span>
                    <span />
                  </div>
                  {schema.map((field, index) => {
                    const unused = Boolean(field.name && !placeholderSet.has(field.name));
                    return (
                      <div
                        key={field.name || index}
                        className={`grid gap-2 rounded-lg border p-2 sm:grid-cols-[7rem_6.5rem_minmax(0,1fr)_minmax(0,1fr)_2.5rem] sm:items-center ${
                          unused ? 'border-amber-300 bg-amber-50/50' : 'bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <code className="truncate text-xs font-mono text-slate-700" title={field.name}>
                            {field.name || '—'}
                          </code>
                          {unused && (
                            <Badge variant="outline" className="shrink-0 text-[10px] border-amber-400 text-amber-800">
                              未使用
                            </Badge>
                          )}
                        </div>
                        <Select
                          value={field.type}
                          onValueChange={(value: ComponentSchema['type']) =>
                            handleUpdateField(index, { type: value })
                          }
                        >
                          <SelectTrigger className="h-9">
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
                        <Input
                          className="h-9"
                          value={field.label}
                          onChange={(e) => handleUpdateField(index, { label: e.target.value })}
                          placeholder="表示名"
                        />
                        <Input
                          className="h-9"
                          value={field.default || ''}
                          onChange={(e) => handleUpdateField(index, { default: e.target.value })}
                          placeholder="初期値"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0"
                          onClick={() => handleRemoveField(index)}
                          aria-label="フィールドを削除"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
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
