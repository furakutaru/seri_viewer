import { useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">上場番号 {horse.lotNumber}</h1>
            <p className="text-gray-600">馬の詳細情報</p>
          </div>
          <Button
            onClick={() => setLocation('/horses')}
            variant="outline"
            className="text-gray-700 border-gray-300 hover:bg-gray-50"
          >
            一覧に戻る
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-8">
          {/* メイン情報 */}
          <div className="col-span-2 space-y-6">
            {/* 基本情報 */}
            <Card className="p-6 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">基本情報</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 font-semibold">性別</p>
                  <p className="text-lg text-gray-900">{horse.sex || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold">毛色</p>
                  <p className="text-lg text-gray-900">{horse.color || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold">生年月日</p>
                  <p className="text-lg text-gray-900">
                    {horse.birthDate
                      ? new Date(horse.birthDate).toLocaleDateString('ja-JP')
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold">年齢</p>
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
              <h2 className="text-2xl font-bold text-gray-900 mb-6">血統</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 font-semibold">父馬</p>
                  <p className="text-lg text-gray-900 font-semibold">{horse.sireName || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold">母馬</p>
                  <p className="text-lg text-gray-900 font-semibold">{horse.damName || '-'}</p>
                </div>
              </div>
            </Card>

            {/* 測尺データ */}
            <Card className="p-6 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">測尺データ</h2>
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 font-semibold">体高</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {horse.height ? `${horse.height}cm` : '-'}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 font-semibold">胸囲</p>
                  <p className="text-2xl font-bold text-green-600">
                    {horse.girth ? `${horse.girth}cm` : '-'}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 font-semibold">管囲</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {horse.cannon ? `${horse.cannon}cm` : '-'}
                  </p>
                </div>
              </div>
            </Card>

            {/* 出品者・生産者情報 */}
            <Card className="p-6 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">出品情報</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 font-semibold">申込者</p>
                  <p className="text-lg text-gray-900">{horse.consignor || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold">生産者</p>
                  <p className="text-lg text-gray-900">{horse.breeder || '-'}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* サイドバー - 評価パネル */}
          <div className="space-y-6">
            {/* 評価 */}
            <Card className="p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 mb-6">あなたの評価</h2>
              <div className="space-y-4">
                <div className="flex gap-2">
                  {(['◎', '○', '△'] as const).map((mark) => (
                    <button
                      key={mark}
                      onClick={() => setEvaluation(evaluation === mark ? null : mark)}
                      className={`flex-1 py-3 px-2 rounded-lg font-bold text-lg transition-colors ${
                        evaluation === mark
                          ? 'bg-blue-600 text-white'
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
                    メモ
                  </label>
                  <Textarea
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="この馬についてのメモを入力..."
                    className="w-full h-32"
                  />
                </div>

                {/* 除外 */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="eliminate"
                    checked={isEliminated}
                    onChange={(e) => setIsEliminated(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded"
                  />
                  <label htmlFor="eliminate" className="text-sm text-gray-700">
                    この馬を除外する
                  </label>
                </div>

                {/* 保存ボタン */}
                <Button
                  onClick={handleSaveEvaluation}
                  disabled={saveUserCheck.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2"
                >
                  {saveUserCheck.isPending ? '保存中...' : '評価を保存'}
                </Button>
              </div>
            </Card>

            {/* 人気指数 */}
            <Card className="p-6 shadow-lg bg-gradient-to-br from-yellow-50 to-orange-50">
              <h2 className="text-xl font-bold text-gray-900 mb-4">人気指数</h2>
              {popularityStats && popularityStats.total > 0 ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-orange-600">
                      {(popularityStats.score / (popularityStats.total * 3) * 100).toFixed(0)}%
                    </p>
                    <p className="text-sm text-gray-600 mt-2">{popularityStats.total}人の評価</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">◎ 優秀</span>
                      <span className="text-sm font-bold text-green-600">{popularityStats.countExcellent}人</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">○ 良好</span>
                      <span className="text-sm font-bold text-blue-600">{popularityStats.countGood}人</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">△ 要検討</span>
                      <span className="text-sm font-bold text-yellow-600">{popularityStats.countFair}人</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-400">-</p>
                  <p className="text-sm text-gray-600 mt-2">まだ評価がありません</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
