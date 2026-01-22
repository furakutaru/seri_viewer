import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';

export function AdminImport() {
  const [saleId, setSaleId] = useState('');
  const [catalogUrl, setCatalogUrl] = useState('');
  const [pdfUrls, setPdfUrls] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const importMutation = trpc.import.importCatalogAndMeasurements.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    // バリデーション
    if (!saleId.trim()) {
      setError('セリIDを入力してください');
      return;
    }

    if (!catalogUrl.trim()) {
      setError('WebカタログのURLを入力してください');
      return;
    }

    if (!pdfUrls.trim()) {
      setError('PDF即尺データのURLを入力してください');
      return;
    }

    // PDF URLを配列に変換
    const pdfUrlArray = pdfUrls
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0);

    if (pdfUrlArray.length === 0) {
      setError('有効なPDF URLが見つかりません');
      return;
    }

    setLoading(true);

    try {
      const res = await importMutation.mutateAsync({
        saleId: parseInt(saleId),
        catalogUrl: catalogUrl.trim(),
        pdfUrls: pdfUrlArray,
      });

      setResult(res);
      setSaleId('');
      setCatalogUrl('');
      setPdfUrls('');
    } catch (err: any) {
      setError(err.message || 'データ取り込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">データ取り込み</h1>
          <p className="text-muted-foreground">Webカタログと PDF即尺データを取り込みます</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>取り込み設定</CardTitle>
            <CardDescription>
              Webカタログと PDF即尺データのURLを入力してください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* セリID */}
              <div className="space-y-2">
                <label htmlFor="saleId" className="block text-sm font-medium text-foreground">
                  セリID
                </label>
                <Input
                  id="saleId"
                  type="number"
                  placeholder="例: 1"
                  value={saleId}
                  onChange={(e) => setSaleId(e.target.value)}
                  disabled={loading}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  このセリに対応するID番号を入力してください
                </p>
              </div>

              {/* Webカタログ URL */}
              <div className="space-y-2">
                <label htmlFor="catalogUrl" className="block text-sm font-medium text-foreground">
                  Webカタログ URL
                </label>
                <Input
                  id="catalogUrl"
                  type="url"
                  placeholder="https://example.com/catalog.html"
                  value={catalogUrl}
                  onChange={(e) => setCatalogUrl(e.target.value)}
                  disabled={loading}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  馬データが含まれるWebカタログのURLを入力してください
                </p>
              </div>

              {/* PDF即尺データ URL */}
              <div className="space-y-2">
                <label htmlFor="pdfUrls" className="block text-sm font-medium text-foreground">
                  PDF即尺データ URL（複数行入力可）
                </label>
                <textarea
                  id="pdfUrls"
                  placeholder="https://example.com/measurements1.pdf&#10;https://example.com/measurements2.pdf"
                  value={pdfUrls}
                  onChange={(e) => setPdfUrls(e.target.value)}
                  disabled={loading}
                  className="w-full min-h-32 p-3 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-xs text-muted-foreground">
                  複数のPDFがある場合は、1行に1つのURLを入力してください
                </p>
              </div>

              {/* エラー表示 */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* 送信ボタン */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    取り込み中...
                  </>
                ) : (
                  'データを取り込む'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* 結果表示 */}
        {result && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <CardTitle className="text-green-900">取り込み完了</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-green-800">{result.message}</p>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded border border-green-200">
                  <p className="text-xs text-muted-foreground mb-1">カタログ件数</p>
                  <p className="text-2xl font-bold text-green-600">{result.catalogCount}</p>
                </div>
                <div className="bg-white p-4 rounded border border-green-200">
                  <p className="text-xs text-muted-foreground mb-1">測尺データ件数</p>
                  <p className="text-2xl font-bold text-green-600">{result.measurementCount}</p>
                </div>
                <div className="bg-white p-4 rounded border border-green-200">
                  <p className="text-xs text-muted-foreground mb-1">保存件数</p>
                  <p className="text-2xl font-bold text-green-600">{result.insertedCount}</p>
                </div>
              </div>

              <Button
                onClick={() => {
                  setResult(null);
                  window.location.href = '/';
                }}
                className="w-full"
              >
                一覧に戻る
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
