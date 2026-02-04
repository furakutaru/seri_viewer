import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';

export default function AdminImport() {
  const [catalogUrl, setCatalogUrl] = useState('');
  const [pdfUrls, setPdfUrls] = useState<string[]>(['']);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

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

  const handleAddPdfUrl = () => {
    setPdfUrls([...pdfUrls, '']);
  };

  const handleRemovePdfUrl = (index: number) => {
    setPdfUrls(pdfUrls.filter((_, i) => i !== index));
  };

  const handlePdfUrlChange = (index: number, value: string) => {
    const newUrls = [...pdfUrls];
    newUrls[index] = value;
    setPdfUrls(newUrls);
  };

  const handleImport = async () => {
    if (!catalogUrl.trim()) {
      setError('Webカタログ一覧URLを入力してください');
      return;
    }

    const validPdfUrls = pdfUrls.filter((url) => url.trim());
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
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">データ取り込み</h1>
        <p className="text-gray-600 mb-8">Webカタログと測尺PDFからデータを取り込みます</p>

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
              disabled={isLoading}
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
            <div className="space-y-3">
              {pdfUrls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="url"
                    placeholder="https://..."
                    value={url}
                    onChange={(e) => handlePdfUrlChange(index, e.target.value)}
                    disabled={isLoading}
                    className="flex-1"
                  />
                  {pdfUrls.length > 1 && (
                    <Button
                      variant="outline"
                      onClick={() => handleRemovePdfUrl(index)}
                      disabled={isLoading}
                      className="px-4"
                    >
                      削除
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              onClick={handleAddPdfUrl}
              disabled={isLoading}
              className="mt-3 w-full"
            >
              + PDF URLを追加
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              複数のPDFファイルがある場合は、すべてのURLを入力してください
            </p>
          </div>

          {/* エラーメッセージ */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <span className="font-semibold">エラー:</span> {error}
              </p>
            </div>
          )}

          {/* 成功メッセージ */}
          {result && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800 font-semibold mb-2">✓ データ取り込み完了</p>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• カタログから抽出: {result.catalogCount} 頭</li>
                <li>• 測尺データ: {result.measurementCount} 件</li>
                <li>• データベースに保存: {result.insertedCount} 頭</li>
              </ul>
            </div>
          )}

          {/* 進捗表示 */}
          {isLoading && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <span className="inline-block animate-spin mr-2">⏳</span>
                データを取り込み中です。しばらくお待ちください...
              </p>
            </div>
          )}

          {/* 取り込みボタン */}
          <Button
            onClick={handleImport}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            {isLoading ? 'データを取り込み中...' : 'データを取り込む'}
          </Button>

          {/* キャッシュ情報 */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-600">
              <span className="font-semibold">💾 キャッシュについて:</span> Webカタログと測尺PDFは自動的にキャッシュされます。
              同じURLを再度使用する場合、キャッシュから読み込まれるため、スクレイピング先への負荷を軽減できます。
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
