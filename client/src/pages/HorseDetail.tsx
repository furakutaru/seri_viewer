import { useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';

// Helper function to convert relative URLs to absolute URLs
function getAbsoluteUrl(relativeUrl: string | null | undefined, catalogUrl: string | null | undefined): string | null {
  if (!relativeUrl) return null;
  if (!catalogUrl) return relativeUrl; // Fallback if no catalog URL

  // If already absolute, return as is
  if (relativeUrl.startsWith('http')) return relativeUrl;

  try {
    // Get the base URL from catalog URL
    const url = new URL(catalogUrl);
    const baseUrl = url.origin + url.pathname.substring(0, url.pathname.lastIndexOf('/') + 1);

    // Handle relative paths
    if (relativeUrl.startsWith('/')) {
      return url.origin + relativeUrl;
    }

    // Handle relative paths like ../img/photo.png or pic/20250801-01-0001-1.jpg
    return new URL(relativeUrl, baseUrl).href;
  } catch (e) {
    console.error('Failed to resolve URL:', e);
    return relativeUrl;
  }
}

export default function HorseDetail() {
  const [location, setLocation] = useLocation();
  const [match, params] = useRoute('/horses/:id');
  const { user, isAuthenticated } = useAuth();
  const horseId = params?.id ? parseInt(params.id) : null;

  const [evaluation, setEvaluation] = useState<'◎' | '○' | '△' | null>(null);
  const [memo, setMemo] = useState('');
  const [isEliminated, setIsEliminated] = useState(false);

  // Fetch horse data
  const { data: horse, isLoading, error } = trpc.horses.getById.useQuery(horseId || 0, {
    enabled: !!horseId,
  });

  // Fetch user check data
  const { data: userCheck } = trpc.horses.getUserCheck.useQuery(horseId || 0, {
    enabled: !!horseId && isAuthenticated,
  });

  // Fetch popularity stats
  const { data: popularityStats } = trpc.horses.getPopularityStats.useQuery(horseId || 0, {
    enabled: !!horseId,
  });

  // Save user check
  const saveUserCheck = trpc.horses.saveUserCheck.useMutation({
    onSuccess: () => {
      // Optionally show a toast
    },
  });

  const handleSaveEvaluation = async () => {
    if (!horseId || !user) return;

    saveUserCheck.mutate({
      horseId,
      evaluation,
      memo,
      isEliminated,
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 text-center">
            <p className="text-gray-600 mb-4">ログインが必要です</p>
            <Button onClick={() => setLocation('/')} className="bg-blue-600 hover:bg-blue-700">
              ホームに戻る
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 text-center">
            <p className="text-gray-600">データを読み込み中...</p>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !horse) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 text-center bg-red-50 border border-red-200">
            <p className="text-red-600 mb-4">馬が見つかりません</p>
            <Button
              onClick={() => setLocation('/horses')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              一覧に戻る
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // Get absolute URLs for photo and pedigree PDF using the catalog URL from sale info
  const photoUrl = getAbsoluteUrl(horse.photoUrl, (horse as any).sale?.catalogUrl);
  const pedigreePdfUrl = getAbsoluteUrl(horse.pedigreePdfUrl, (horse as any).sale?.catalogUrl);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">上場番号 {horse.lotNumber}</h1>
            <p className="text-gray-600">馬の詳細情報 {(horse as any).sale?.saleName ? `(${(horse as any).sale.saleName})` : ''}</p>
          </div>
          <Button
            onClick={() => setLocation('/horses')}
            variant="outline"
            className="text-gray-700 border-gray-300 hover:bg-gray-50"
          >
            一覧に戻る
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* メイン情報 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 写真 */}
            <Card className="p-6 shadow-lg overflow-hidden">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">馬体画像</h2>
              {photoUrl ? (
                <div className="relative group">
                  <img
                    src={photoUrl}
                    alt={`上場番号 ${horse.lotNumber}`}
                    className="w-full h-auto rounded-lg shadow-md object-contain max-h-[500px] transition-transform duration-300 group-hover:scale-[1.02]"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=No+Image';
                    }}
                  />
                  <div className="mt-4 flex justify-end">
                    <a
                      href={photoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      画像を別タブで開く ↗
                    </a>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-100 rounded-lg p-12 text-center text-gray-500">
                  画像が登録されていません
                </div>
              )}
            </Card>

            {/* 基本情報 */}
            <Card className="p-6 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">基本情報</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-1">性別</p>
                  <p className="text-lg text-gray-900">{horse.sex || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-1">毛色</p>
                  <p className="text-lg text-gray-900">{horse.color || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-1">生年月日</p>
                  <p className="text-lg text-gray-900">
                    {horse.birthDate
                      ? new Date(horse.birthDate).toLocaleDateString('ja-JP')
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-1">年齢</p>
                  <p className="text-lg text-gray-900">
                    {horse.birthDate
                      ? new Date().getFullYear() - new Date(horse.birthDate).getFullYear()
                      : '-'}
                    歳
                  </p>
                </div>
              </div>
            </Card>

            {/* 血統情報 */}
            <Card className="p-6 shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">血統</h2>
                {pedigreePdfUrl && (
                  <a
                    href={pedigreePdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors shadow-sm"
                  >
                    <span>📄</span>
                    <span>血統書PDFを表示</span>
                  </a>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                  <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-2">Sire / 父</p>
                  <p className="text-xl text-gray-900 font-bold">{horse.sireName || '-'}</p>
                </div>
                <div className="p-4 bg-pink-50/50 rounded-lg border border-pink-100">
                  <p className="text-xs text-pink-600 font-bold uppercase tracking-wider mb-2">Dam / 母</p>
                  <p className="text-xl text-gray-900 font-bold">{horse.damName || '-'}</p>
                </div>
              </div>
            </Card>

            {/* 測尺データ */}
            <Card className="p-6 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">測尺データ</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-sm">
                  <p className="text-sm text-gray-600 font-semibold mb-2">体高</p>
                  <p className="text-3xl font-black text-blue-700">
                    {horse.height ? `${horse.height}` : '-'}
                    <span className="text-sm font-normal ml-1">cm</span>
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-xl border border-green-100 shadow-sm">
                  <p className="text-sm text-gray-600 font-semibold mb-2">胸囲</p>
                  <p className="text-3xl font-black text-green-700">
                    {horse.girth ? `${horse.girth}` : '-'}
                    <span className="text-sm font-normal ml-1">cm</span>
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 shadow-sm">
                  <p className="text-sm text-gray-600 font-semibold mb-2">管囲</p>
                  <p className="text-3xl font-black text-purple-700">
                    {horse.cannon ? `${horse.cannon}` : '-'}
                    <span className="text-sm font-normal ml-1">cm</span>
                  </p>
                </div>
              </div>
            </Card>

            {/* 出品者・生産者情報 */}
            <Card className="p-6 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">出品情報</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg text-lg">🏢</div>
                  <div>
                    <p className="text-sm text-gray-600 font-semibold">申込者</p>
                    <p className="text-lg text-gray-900 font-medium">{horse.consignor || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg text-lg">🌾</div>
                  <div>
                    <p className="text-sm text-gray-600 font-semibold">生産者</p>
                    <p className="text-lg text-gray-900 font-medium">{horse.breeder || '-'}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* サイドバー - 評価パネル */}
          <div className="space-y-6">
            {/* 評価 */}
            <Card className="p-6 shadow-lg sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span>📝</span>
                <span>あなたの検討メモ</span>
              </h2>
              <div className="space-y-4">
                <div className="flex gap-2">
                  {(['◎', '○', '△'] as const).map((mark) => (
                    <button
                      key={mark}
                      onClick={() => setEvaluation(evaluation === mark ? null : mark)}
                      className={`flex-1 py-3 px-2 rounded-lg font-bold text-xl transition-all shadow-sm ${evaluation === mark
                          ? 'bg-blue-600 text-white scale-105 ring-2 ring-blue-300'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      {mark}
                    </button>
                  ))}
                </div>

                {/* メモ */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    個人的なメモ
                  </label>
                  <Textarea
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="欠点、歩様の特徴、血統背景など..."
                    className="w-full h-40 resize-none border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                  />
                </div>

                {/* 除外 */}
                <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                  <input
                    type="checkbox"
                    id="eliminate"
                    checked={isEliminated}
                    onChange={(e) => setIsEliminated(e.target.checked)}
                    className="w-5 h-5 text-red-600 rounded border-gray-300 focus:ring-red-500"
                  />
                  <label htmlFor="eliminate" className="text-sm text-red-700 font-bold select-none cursor-pointer">
                    この馬を検討から除外する
                  </label>
                </div>

                {/* 保存ボタン */}
                <Button
                  onClick={handleSaveEvaluation}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 text-lg rounded-xl transition-all hover:shadow-lg active:scale-95"
                >
                  検討状況を保存
                </Button>
                {saveUserCheck.isSuccess && (
                  <p className="text-center text-sm font-bold text-green-600 animate-pulse">
                    ✓ 保存しました
                  </p>
                )}
              </div>

              {/* 人気指数 */}
              {popularityStats && (
                <div className="mt-8 pt-8 border-t border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span>📊</span>
                    <span>みんなの評価</span>
                  </h3>
                  <div className="space-y-4">
                    {[
                      { label: '◎ 評価', count: popularityStats.countExcellent, color: 'bg-green-600', text: 'text-green-600' },
                      { label: '○ 評価', count: popularityStats.countGood, color: 'bg-blue-600', text: 'text-blue-600' },
                      { label: '△ 評価', count: popularityStats.countFair, color: 'bg-orange-600', text: 'text-orange-600' },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-gray-600">{item.label}</span>
                          <span className={`text-sm font-black ${item.text}`}>{item.count}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className={`${item.color} h-2 rounded-full transition-all duration-500`}
                            style={{
                              width: `${(popularityStats.countExcellent +
                                  popularityStats.countGood +
                                  popularityStats.countFair) > 0
                                  ? (item.count /
                                    (popularityStats.countExcellent +
                                      popularityStats.countGood +
                                      popularityStats.countFair)) *
                                  100
                                  : 0
                                }%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
