import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { Loader2, Trash2, RefreshCw } from 'lucide-react';

export function CacheManager() {
  const [isClearing, setIsClearing] = useState(false);
  
  const cacheInfo = trpc.cache.getCacheInfo.useQuery();
  const clearCacheMutation = trpc.cache.clearCache.useMutation({
    onSuccess: () => {
      cacheInfo.refetch();
      setIsClearing(false);
    },
  });

  const handleClearCache = async () => {
    setIsClearing(true);
    await clearCacheMutation.mutateAsync();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}日前`;
    if (hours > 0) return `${hours}時間前`;
    if (minutes > 0) return `${minutes}分前`;
    return `${seconds}秒前`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5" />
          キャッシュ管理
        </CardTitle>
        <CardDescription>
          ダウンロード済みのWebカタログとPDFファイルを管理します
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {cacheInfo.isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="ml-2">キャッシュ情報を読み込み中...</span>
          </div>
        ) : cacheInfo.data ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">キャッシュファイル数</div>
                <div className="text-2xl font-bold">{cacheInfo.data.totalFiles}</div>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">合計サイズ</div>
                <div className="text-2xl font-bold">{formatBytes(cacheInfo.data.totalSize)}</div>
              </div>
            </div>

            {cacheInfo.data.files.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">キャッシュファイル一覧</h3>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {cacheInfo.data.files.map((file, idx) => (
                    <div key={idx} className="text-xs bg-muted p-2 rounded">
                      <div className="font-mono truncate">{file.url}</div>
                      <div className="text-muted-foreground">
                        {file.type} • {formatBytes(file.size)} • {formatTime(file.age)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={handleClearCache}
              disabled={isClearing || cacheInfo.data.totalFiles === 0}
              variant="destructive"
              className="w-full"
            >
              {isClearing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  クリア中...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  キャッシュをクリア
                </>
              )}
            </Button>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            キャッシュ情報を読み込めませんでした
          </div>
        )}
      </CardContent>
    </Card>
  );
}
