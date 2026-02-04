import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export function AdminImport() {
  const [catalogUrl, setCatalogUrl] = useState('');
  const [pdfUrls, setPdfUrls] = useState(['']);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const importMutation = trpc.admin.importData.useMutation();

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
    setError(null);
    setResult(null);
    setIsLoading(true);

    try {
      const validPdfUrls = pdfUrls.filter(url => url.trim().length > 0);
      
      if (!catalogUrl.trim()) {
        throw new Error('Webカタログ一覧URLを入力してください');
      }
      
      if (validPdfUrls.length === 0) {
        throw new Error('最低1つのPDF URLを入力してください');
      }

      const response = await importMutation.mutateAsync({
        catalogUrl: catalogUrl.trim(),
        pdfUrls: validPdfUrls,
      });

      setResult(response);
    } catch (err: any) {
      setError(err.message || 'データ取り込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>データ取り込み</CardTitle>
            <CardDescription>
              Webカタログ一覧URLと測尺PDFファイルからデータを取り込みます
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Webカタログ URL */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Webカタログ一覧 URL
              </label>
              <Input
                type="url"
                placeholder="https://example.com/catalog.html"
                value={catalogUrl}
                onChange={(e) => setCatalogUrl(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">
                HBA公式サイトのカタログHTMLファイルのURL
              </p>
            </div>

            {/* PDF URLs */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                測尺PDF ファイル URL
              </label>
              <div className="space-y-2">
                {pdfUrls.map((url, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      type="url"
                      placeholder={`https://example.com/measurements_${index + 1}.pdf`}
                      value={url}
                      onChange={(e) => handlePdfUrlChange(index, e.target.value)}
                      disabled={isLoading}
                    />
                    {pdfUrls.length > 1 && (
                      <Button
                        variant="outline"
                        onClick={() => handleRemovePdfUrl(index)}
                        disabled={isLoading}
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
                className="w-full"
              >
                + PDF URLを追加
              </Button>
              <p className="text-xs text-gray-500">
                複数のPDFファイルに対応しています
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {result && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-sm text-green-700 font-medium">{result.message}</p>
                {result.details && (
                  <div className="mt-2 text-xs text-green-600 space-y-1">
                    <p>カタログから抽出: {result.details.catalogCount} 頭</p>
                    <p>測尺データ: {result.details.measurementCount} 件</p>
                    <p>データベースに保存: {result.details.insertedCount} 頭</p>
                  </div>
                )}
              </div>
            )}

            {/* Import Button */}
            <Button
              onClick={handleImport}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  取り込み中...
                </>
              ) : (
                'データを取り込む'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
