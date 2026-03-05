import React, { useState, useEffect } from 'react';
import { trpc } from '../lib/trpc';

interface ImportResult {
  success: number;
  skipped: number;
  errors: string[];
  total?: number;
}

export const JbisImportForm: React.FC = () => {
  const [saleUrl, setSaleUrl] = useState('');
  const [multipleUrls, setMultipleUrls] = useState('');
  const [results, setResults] = useState<ImportResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'single' | 'multiple'>('single');

  const importJbisUrls = trpc.admin.importJbisUrls.useMutation();
  const importMultipleJbisUrls = trpc.admin.importMultipleJbisUrls.useMutation();
  const { data: jbisStatus } = trpc.admin.checkJbisStatus.useQuery();

  // リダイレクトを無効化してエラー確認できるようにする
  // useEffect(() => {
  //   if (results) {
  //     // インポート完了後にステータスを再取得
  //     setTimeout(() => {
  //       window.location.reload();
  //     }, 2000);
  //   }
  // }, [results]);

  const handleSingleImport = async () => {
    if (!saleUrl.trim()) return;
    
    setIsLoading(true);
    setResults(null);
    
    try {
      // 単一URL用のAPIを使用
      const result = await importJbisUrls.mutateAsync({ saleUrl: saleUrl.trim() });
      setResults(result);
    } catch (error) {
      console.error('Import failed:', error);
      setResults({
        success: 0,
        skipped: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMultipleImport = async () => {
    const urls = multipleUrls
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0);
    
    if (urls.length === 0) return;
    
    setIsLoading(true);
    setResults(null);
    
    try {
      const result = await importMultipleJbisUrls.mutateAsync({ saleUrls: urls });
      setResults(result);
    } catch (error) {
      console.error('Multiple import failed:', error);
      setResults({
        success: 0,
        skipped: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">JBIS URL インポート</h2>
      
      {/* モード切り替え */}
      <div className="mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setMode('single')}
            className={`px-4 py-2 rounded ${
              mode === 'single'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            単一URL
          </button>
          <button
            onClick={() => setMode('multiple')}
            className={`px-4 py-2 rounded ${
              mode === 'multiple'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            複数URL
          </button>
        </div>
      </div>

      {/* 単一URLモード */}
      {mode === 'single' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              セールページURL
            </label>
            <input
              type="url"
              value={saleUrl}
              onChange={(e) => setSaleUrl(e.target.value)}
              placeholder="https://www.jbis.or.jp/seri/2025/11B3/sale/"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleSingleImport}
            disabled={isLoading || !saleUrl.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'インポート中...' : 'インポート実行'}
          </button>
        </div>
      )}

      {/* 複数URLモード */}
      {mode === 'multiple' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              セールページURL（1行に1つ）
            </label>
            <textarea
              value={multipleUrls}
              onChange={(e) => setMultipleUrls(e.target.value)}
              placeholder="https://www.jbis.or.jp/seri/2025/11B3/sale/&#10;https://www.jbis.or.jp/seri/2025/11B2/sale/&#10;https://www.jbis.or.jp/seri/2025/11B1/sale/"
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleMultipleImport}
            disabled={isLoading || !multipleUrls.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? '一括インポート中...' : '一括インポート実行'}
          </button>
        </div>
      )}

      {/* 結果表示 */}
      {results && (
        <div className="mt-6 p-4 bg-gray-50 rounded-md">
          <h3 className="text-lg font-semibold mb-3">インポート結果</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>成功:</span>
              <span className="text-green-600 font-medium">{results.success}</span>
            </div>
            <div className="flex justify-between">
              <span>スキップ:</span>
              <span className="text-yellow-600 font-medium">{results.skipped}</span>
            </div>
            <div className="flex justify-between">
              <span>エラー:</span>
              <span className="text-red-600 font-medium">{results.errors.length}</span>
            </div>
          </div>
          
          {results.errors.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-red-600 mb-2">エラー詳細:</h4>
              <ul className="text-sm text-red-600 space-y-1">
                {results.errors.map((error, index) => (
                  <li key={index} className="break-all">{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 説明 */}
      <div className="mt-6 p-4 bg-blue-50 rounded-md">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">使い方</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• JBISのセール売却成績ページのURLを入力してください</li>
          <li>• 例: https://www.jbis.or.jp/seri/2025/11B3/sale/</li>
          <li>• 1回のアクセスで全馬・父・母のURLを取得します</li>
          <li>• キャッシュ機能により2回目以降は高速です</li>
          <li>• 既存の馬にJBIS URLを紐付けます</li>
        </ul>
      </div>

      {/* JBIS URL紐付け状況 */}
      {jbisStatus && (
        <div className="mt-6 p-4 bg-gray-50 rounded-md">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">現在の状況</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{jbisStatus.total}</div>
              <div className="text-gray-600">総馬数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{jbisStatus.withJbisUrl}</div>
              <div className="text-gray-600">JBIS URLあり</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{jbisStatus.withoutJbisUrl}</div>
              <div className="text-gray-600">JBIS URLなし</div>
            </div>
          </div>
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(jbisStatus.withJbisUrl / jbisStatus.total) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
