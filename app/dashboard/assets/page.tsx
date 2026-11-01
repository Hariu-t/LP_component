'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Asset } from '@/lib/database.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Search, Trash2, Copy, Upload } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('アセットの読み込みに失敗しました');
    } else {
      setAssets(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('assets')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('アセットの削除に失敗しました');
    } else {
      toast.success('アセットを削除しました');
      loadAssets();
    }
    setDeleteId(null);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    for (const file of Array.from(files)) {
      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('assets')
          .upload(`uploads/${Date.now()}-${file.name}`, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('assets')
          .getPublicUrl(uploadData.path);

        const { error: dbError } = await supabase.from('assets').insert([{
          url: urlData.publicUrl,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
        }] as any);

        if (dbError) throw dbError;
      } catch (error: any) {
        toast.error(`${file.name} のアップロードに失敗しました: ${error.message}`);
      }
    }

    setUploading(false);
    setUploadOpen(false);
    loadAssets();
    toast.success('アセットをアップロードしました');
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URLをクリップボードにコピーしました');
  };

  const filteredAssets = assets.filter((asset) =>
    asset.file_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">アセット</h1>
          <p className="text-slate-600 mt-1">
            画像やメディアファイルを管理します
          </p>
        </div>
        <Button onClick={() => setUploadOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          アセットをアップロード
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="アセットを検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="aspect-video bg-slate-200" />
              <CardContent className="p-3">
                <div className="h-4 bg-slate-200 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredAssets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-slate-600 mb-4">
              {searchQuery ? 'アセットが見つかりません' : 'アセットがまだありません'}
            </p>
            <Button onClick={() => setUploadOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              最初のアセットをアップロード
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          {filteredAssets.map((asset) => (
            <Card key={asset.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-slate-100 relative">
                {asset.file_type.startsWith('image/') ? (
                  <img
                    src={asset.url}
                    alt={asset.alt_text || asset.file_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    <Upload className="h-12 w-12" />
                  </div>
                )}
              </div>
              <CardContent className="p-3 space-y-2">
                <p className="text-sm font-medium truncate" title={asset.file_name}>
                  {asset.file_name}
                </p>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{formatFileSize(asset.file_size)}</span>
                  <span>{new Date(asset.created_at).toLocaleDateString('ja-JP')}</span>
                </div>
                <div className="flex space-x-1 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleCopyUrl(asset.url)}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    コピー
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteId(asset.id)}
                  >
                    <Trash2 className="h-3 w-3 text-red-600" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>アセットをアップロード</DialogTitle>
            <DialogDescription>
              アップロードする画像やファイルを選択してください。複数ファイルに対応しています。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
              <Input
                type="file"
                multiple
                accept="image/*"
                onChange={handleUpload}
                disabled={uploading}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="h-12 w-12 text-slate-400 mb-3" />
                <p className="text-sm font-medium text-slate-700">
                  クリックしてファイルを選択
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  またはドラッグ＆ドロップ
                </p>
              </label>
            </div>
            {uploading && (
              <p className="text-sm text-center text-slate-600">アップロード中...</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>アセットを削除</AlertDialogTitle>
            <AlertDialogDescription>
              このアセットを削除しますか？この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
