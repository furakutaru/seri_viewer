import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from '@/lib/trpc';
import { JbisImportForm } from '@/components/JbisImportForm';
import { AdminRouteGuard } from '@/components/AdminRouteGuard';

export default function AdminImport() {
  return (
    <AdminRouteGuard>
      <AdminImportContent />
    </AdminRouteGuard>
  );
}

function AdminImportContent() {
  const [, setLocation] = useLocation();
  const [catalogUrl, setCatalogUrl] = useState('');
  const [pdfUrlsText, setPdfUrlsText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('catalog');

  const importDataMutation = trpc.admin.importData.useMutation({
    onSuccess: (data) => {
      setIsLoading(false);
      setResult(data);
      setError(null);
    },
    onError: (err: any) => {
      setIsLoading(false);
      setError(err.message || 'Import failed');
      setResult(null);
    },
  });

  // Parse PDF URLs from textarea (one per line)
  const getPdfUrls = (): string[] => {
    return pdfUrlsText
      .split('\n')
      .map((url) => url.trim())
      .filter((url) => url.length > 0);
  };

  const handleImport = async () => {
    if (!catalogUrl.trim()) {
      setError('Webカタログ一覧URLを入力してください');
      return;
    }

    const validPdfUrls = getPdfUrls();
    if (validPdfUrls.length === 0) {
      setError('少なくとも1つのPDF URLを入力してください');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      await importDataMutation.mutateAsync({
        catalogUrl: catalogUrl.trim(),
        pdfUrls: validPdfUrls,
      });
    } catch (err: any) {
      setError(err.message || 'Import failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">データ取り込み</h1>
        <p className="text-gray-600 mb-8">各種データをシステムに取り込みます</p>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="catalog">セリリスト</TabsTrigger>
            <TabsTrigger value="jbis">JBISインポート</TabsTrigger>
          </TabsList>

          <TabsContent value="catalog" className="mt-6">
            <Card className="p-8 shadow-lg">
              {/* Webカタログ一覧URL */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Webカタログ一覧 URL
                </label>
                <Input
                  type="url"
                  placeholder="https://w2.hba.or.jp/upload/..."
                  value={catalogUrl}
                  onChange={(e) => setCatalogUrl(e.target.value)}
                  disabled={isLoading || (result && result.success)}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  HBA公式サイトのセリ市カタログ一覧ページのURLを入力してください
                </p>
              </div>

              {/* PDF測尺データ URL */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  PDF測尺データ URL（複数可）
                </label>
                <textarea
                  placeholder="https://w2.hba.or.jp/upload/...&#10;https://w2.hba.or.jp/upload/..."
                  value={pdfUrlsText}
                  onChange={(e) => setPdfUrlsText(e.target.value)}
                  disabled={isLoading || (result && result.success)}
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-2">
                  複数のPDF URLを1行ずつ入力してください（改行区切り）
                </p>
                {getPdfUrls().length > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    {getPdfUrls().length}個のPDF URLが入力されています
                  </p>
                )}
              </div>

              {/* エラー表示 */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm font-semibold">エラー</p>
                  <p className="text-red-600 text-sm mt-1">{error}</p>
                </div>
              )}

              {/* 結果表示 */}
              {result && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 text-sm font-semibold">✓ {result.message}</p>
                  <div className="text-green-600 text-sm mt-2 space-y-1">
                    <p>• カタログから抽出: {result.catalogCount} 頭</p>
                    <p>• 測尺データ: {result.measurementCount} 件</p>
                    <p>• データベースに保存: {result.insertedCount} 頭</p>
                  </div>
                </div>
              )}

              {/* インポートボタン または 一覧確認ボタン */}
              {result && result.success ? (
                <Button
                  onClick={() => setLocation('/horses')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg"
                >
                  一覧を確認
                </Button>
              ) : (
                <Button
                  onClick={handleImport}
                  disabled={isLoading || !catalogUrl.trim() || getPdfUrls().length === 0}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg"
                >
                  {isLoading ? 'データを取り込み中...' : 'データを取り込む'}
                </Button>
              )}

              {/* キャッシュクリア情報 */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-700 text-sm font-semibold">💡 キャッシュについて</p>
                <p className="text-blue-600 text-sm mt-1">
                  Webカタログと測尺PDFは自動的にキャッシュされます。同じURLを再度使用する場合、キャッシュから読み込まれるため高速です。
                </p>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="jbis" className="mt-6">
            <JbisImportForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
