'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import type { Asset, AssetFolder } from '@/lib/database.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Trash2,
  Copy,
  Upload,
  Folder,
  FolderPlus,
  ChevronRight,
  FolderOpen,
} from 'lucide-react';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

function sanitizeFileName(name: string): string {
  const trimmed = name.trim() || 'file';
  const dot = trimmed.lastIndexOf('.');
  const base = dot > 0 ? trimmed.slice(0, dot) : trimmed;
  const ext = dot > 0 ? trimmed.slice(dot) : '';
  const safeBase = base
    .normalize('NFKD')
    .replace(/[^\w.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'file';
  const safeExt = ext.replace(/[^\w.]+/g, '').toLowerCase();
  return `${safeBase}${safeExt}`;
}

export default function AssetsPage() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [folders, setFolders] = useState<AssetFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteFolderId, setDeleteFolderId] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [movingAssetId, setMovingAssetId] = useState<string | null>(null);

  useEffect(() => {
    loadFolders();
  }, []);

  useEffect(() => {
    loadAssets();
  }, [currentFolderId]);

  const loadFolders = async () => {
    const { data, error } = await supabase
      .from('asset_folders')
      .select('*')
      .order('name');

    if (error) {
      toast.error('フォルダの読み込みに失敗しました');
    } else {
      setFolders(data || []);
    }
  };

  const loadAssets = async () => {
    setLoading(true);
    let query = supabase
      .from('assets')
      .select('*')
      .order('created_at', { ascending: false });

    if (currentFolderId) {
      query = query.eq('folder_id', currentFolderId);
    } else {
      query = query.is('folder_id', null);
    }

    const { data, error } = await query;

    if (error) {
      toast.error('アセットの読み込みに失敗しました');
    } else {
      setAssets(data || []);
    }
    setLoading(false);
  };

  const childFolders = folders.filter((f) => f.parent_id === currentFolderId);

  const breadcrumb: AssetFolder[] = [];
  if (currentFolderId) {
    let cursor: string | null = currentFolderId;
    while (cursor) {
      const folder = folders.find((f) => f.id === cursor);
      if (!folder) break;
      breadcrumb.unshift(folder);
      cursor = folder.parent_id;
    }
  }

  const handleCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name) {
      toast.error('フォルダ名を入力してください');
      return;
    }

    if (!user) {
      toast.error('ログインが必要です');
      return;
    }

    setCreatingFolder(true);
    const { error } = await supabase.from('asset_folders').insert({
      name,
      parent_id: currentFolderId,
    } as any);

    setCreatingFolder(false);

    if (error) {
      toast.error(`フォルダの作成に失敗しました: ${error.message}`);
      return;
    }

    toast.success('フォルダを作成しました');
    setNewFolderName('');
    setCreateFolderOpen(false);
    loadFolders();
  };

  const handleDeleteFolder = async (id: string) => {
    const hasChildren = folders.some((f) => f.parent_id === id);
    const { count } = await supabase
      .from('assets')
      .select('id', { count: 'exact', head: true })
      .eq('folder_id', id);

    if (hasChildren || (count && count > 0)) {
      toast.error('中身のあるフォルダは削除できません。先に空にしてください');
      setDeleteFolderId(null);
      return;
    }

    const { error } = await supabase.from('asset_folders').delete().eq('id', id);

    if (error) {
      toast.error(`フォルダの削除に失敗しました: ${error.message}`);
    } else {
      toast.success('フォルダを削除しました');
      if (currentFolderId === id) {
        const deleted = folders.find((f) => f.id === id);
        setCurrentFolderId(deleted?.parent_id ?? null);
      }
      loadFolders();
    }
    setDeleteFolderId(null);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('assets').delete().eq('id', id);

    if (error) {
      toast.error('アセットの削除に失敗しました');
    } else {
      toast.success('アセットを削除しました');
      loadAssets();
    }
    setDeleteId(null);
  };

  const handleMoveAsset = async (assetId: string, folderId: string) => {
    const nextFolderId = folderId === 'root' ? null : folderId;
    const { error } = await supabase
      .from('assets')
      .update({ folder_id: nextFolderId } as never)
      .eq('id', assetId);

    if (error) {
      toast.error(`移動に失敗しました: ${error.message}`);
    } else {
      toast.success('フォルダへ移動しました');
      setMovingAssetId(null);
      loadAssets();
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!user) {
      toast.error('ログインが必要です');
      return;
    }

    setUploading(true);

    let successCount = 0;
    let failureCount = 0;
    const folderSegment = currentFolderId || 'root';

    for (const file of Array.from(files)) {
      try {
        const path = `folders/${folderSegment}/${Date.now()}-${sanitizeFileName(file.name)}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('assets')
          .upload(path, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type || undefined,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('assets')
          .getPublicUrl(uploadData.path);

        const { error: dbError } = await supabase.from('assets').insert([
          {
            url: urlData.publicUrl,
            file_name: file.name,
            file_type: file.type || 'application/octet-stream',
            file_size: file.size,
            folder_id: currentFolderId,
            uploaded_by: user.id,
          },
        ] as any);

        if (dbError) throw dbError;
        successCount += 1;
      } catch (error: any) {
        failureCount += 1;
        const message = error?.message || String(error);
        toast.error(`${file.name} のアップロードに失敗しました: ${message}`);
      }
    }

    setUploading(false);
    e.target.value = '';

    if (successCount > 0) {
      setUploadOpen(false);
      loadAssets();
      toast.success(
        failureCount > 0
          ? `${successCount} 件アップロードしました（${failureCount} 件失敗）`
          : `${successCount} 件のアセットをアップロードしました`
      );
    }
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
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const folderOptions = [
    { id: 'root', name: 'ルート' },
    ...folders.map((f) => ({ id: f.id, name: f.name })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">アセット</h1>
          <p className="text-slate-600 mt-1">
            フォルダで画像やメディアを整理します
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCreateFolderOpen(true)}>
            <FolderPlus className="mr-2 h-4 w-4" />
            フォルダ作成
          </Button>
          <Button onClick={() => setUploadOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            アップロード
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="rounded-lg border bg-white p-3 space-y-1 h-fit">
          <p className="px-2 py-1 text-xs font-medium text-slate-500">フォルダ</p>
          <button
            type="button"
            onClick={() => setCurrentFolderId(null)}
            className={`w-full flex items-center gap-2 rounded-md px-2 py-2 text-sm text-left transition-colors ${
              currentFolderId === null
                ? 'bg-slate-100 text-slate-900 font-medium'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <FolderOpen className="h-4 w-4 shrink-0" />
            ルート
          </button>
          {folders
            .filter((f) => f.parent_id === null)
            .map((folder) => (
              <button
                key={folder.id}
                type="button"
                onClick={() => setCurrentFolderId(folder.id)}
                className={`w-full flex items-center gap-2 rounded-md px-2 py-2 text-sm text-left transition-colors ${
                  currentFolderId === folder.id
                    ? 'bg-slate-100 text-slate-900 font-medium'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Folder className="h-4 w-4 shrink-0" />
                <span className="truncate">{folder.name}</span>
              </button>
            ))}
        </aside>

        <div className="space-y-4">
          <div className="flex items-center gap-1 text-sm text-slate-600 flex-wrap">
            <button
              type="button"
              className="hover:text-slate-900"
              onClick={() => setCurrentFolderId(null)}
            >
              ルート
            </button>
            {breadcrumb.map((folder) => (
              <span key={folder.id} className="flex items-center gap-1">
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                <button
                  type="button"
                  className="hover:text-slate-900"
                  onClick={() => setCurrentFolderId(folder.id)}
                >
                  {folder.name}
                </button>
              </span>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="このフォルダ内を検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {childFolders.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {childFolders.map((folder) => (
                <Card
                  key={folder.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setCurrentFolderId(folder.id)}
                >
                  <CardContent className="p-4 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Folder className="h-5 w-5 text-amber-500 shrink-0" />
                      <span className="font-medium truncate">{folder.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteFolderId(folder.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

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
          ) : filteredAssets.length === 0 && childFolders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-slate-600 mb-4">
                  {searchQuery
                    ? 'アセットが見つかりません'
                    : 'このフォルダは空です'}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setCreateFolderOpen(true)}>
                    <FolderPlus className="mr-2 h-4 w-4" />
                    フォルダ作成
                  </Button>
                  <Button onClick={() => setUploadOpen(true)}>
                    <Upload className="mr-2 h-4 w-4" />
                    アップロード
                  </Button>
                </div>
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
                    {movingAssetId === asset.id ? (
                      <Select
                        onValueChange={(value) => handleMoveAsset(asset.id, value)}
                        defaultValue={asset.folder_id || 'root'}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="移動先を選択" />
                        </SelectTrigger>
                        <SelectContent>
                          {folderOptions
                            .filter((opt) => opt.id !== (asset.folder_id || 'root'))
                            .map((opt) => (
                              <SelectItem key={opt.id} value={opt.id}>
                                {opt.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    ) : null}
                    <div className="flex space-x-1 pt-1">
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
                        onClick={() =>
                          setMovingAssetId(movingAssetId === asset.id ? null : asset.id)
                        }
                      >
                        移動
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
        </div>
      </div>

      <Dialog open={createFolderOpen} onOpenChange={setCreateFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>フォルダを作成</DialogTitle>
            <DialogDescription>
              {currentFolderId
                ? '現在のフォルダの中に新しいフォルダを作成します'
                : 'ルート直下に新しいフォルダを作成します'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="folder-name">フォルダ名</Label>
            <Input
              id="folder-name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="ヒーロー画像"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCreateFolder();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateFolderOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleCreateFolder} disabled={creatingFolder}>
              作成
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>アセットをアップロード</DialogTitle>
            <DialogDescription>
              {currentFolderId
                ? '現在開いているフォルダにアップロードします'
                : 'ルートにアップロードします'}
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

      <AlertDialog
        open={deleteFolderId !== null}
        onOpenChange={() => setDeleteFolderId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>フォルダを削除</AlertDialogTitle>
            <AlertDialogDescription>
              空のフォルダのみ削除できます。中にファイルや子フォルダがある場合は削除できません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteFolderId && handleDeleteFolder(deleteFolderId)}
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
