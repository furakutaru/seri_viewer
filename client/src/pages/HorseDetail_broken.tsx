import { useState, useEffect, useMemo } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { getAbsoluteUrl } from '@/lib/utils';

export default function HorseDetail() {
  const [location, setLocation] = useLocation();
  const [match, params] = useRoute('/horses/:id');
  const { user, isAuthenticated } = useAuth();
  const horseId = params?.id ? parseInt(params.id) : null;

  const [evaluation, setEvaluation] = useState<'◎' | '○' | '△' | null>(null);
  const [memo, setMemo] = useState('');
  const [isEliminated, setIsEliminated] = useState(false);

  const navigateToHorse = (horseId: number) => {
    setLocation(`/horses/${horseId}`);
  };

  // Checklist state management
  const [checklistState, setChecklistState] = useState<Record<number, boolean>>({});
  const [numericValues, setNumericValues] = useState<Record<number, number>>({});

  // Fetch horse data
  const { data: horse, isLoading, error } = trpc.horses.getById.useQuery(horseId || 0, {
    enabled: !!horseId,
  });

  // Fetch user check data
  const { data: userCheck } = trpc.horses.getUserCheck.useQuery(horseId || 0, {
    enabled: !!horseId && isAuthenticated,
  });

  // Fetch checklist items for the horse's sale
  const { data: checklistItems } = trpc.horses.checkListItems.getAll.useQuery(
    { saleId: horse?.saleId },
    { enabled: !!horse?.saleId && isAuthenticated }
  );

  // Fetch checklist results for this horse
  const { data: checklistResults, refetch: refetchChecklistResults } = trpc.horses.checkListResults.getForHorse.useQuery(
    horseId || 0,
    { enabled: !!horseId && isAuthenticated }
  );

  // Save checklist results
  const saveChecklistResults = trpc.horses.checkListResults.save.useMutation({
    onSuccess: () => {
      refetchChecklistResults();
    },
  });

  // Initialize checklist state when data loads
  useEffect(() => {
    if (checklistResults && checklistItems) {
      const newChecklistState: Record<number, boolean> = {};
      const newNumericValues: Record<number, number> = {};
      
      checklistResults.forEach(({ result, item }) => {
        if (item) {
          if (item.itemType === 'boolean') {
            newChecklistState[item.id] = result?.isChecked || false;
          } else if (item.itemType === 'numeric') {
            newNumericValues[item.id] = result?.scoreApplied || 0;
          }
        }
      });
      
      setChecklistState(newChecklistState);
      setNumericValues(newNumericValues);
    }
  }, [checklistResults, checklistItems]);

  // Handle checklist changes
  const handleChecklistChange = (itemId: number, isChecked: boolean) => {
    setChecklistState(prev => ({ ...prev, [itemId]: isChecked }));
    saveChecklistResultsData();
  };

  const handleNumericChange = (itemId: number, value: number) => {
    setNumericValues(prev => ({ ...prev, [itemId]: value }));
    saveChecklistResultsData();
  };

  const saveChecklistResultsData = () => {
    if (!horseId || !checklistItems) return;

    const results = checklistItems.map(item => {
      if (item.itemType === 'boolean') {
        return {
          checkItemId: item.id,
          isChecked: checklistState[item.id] || false,
          scoreApplied: checklistState[item.id] ? item.score : 0,
        };
      } else {
        return {
          checkItemId: item.id,
          isChecked: numericValues[item.id] > 0,
          scoreApplied: numericValues[item.id] || 0,
        };
      }
    });

    saveChecklistResults.mutate({
      horseId,
      results,
    });
  };

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
          <div className="flex gap-4">
            <Button
              onClick={() => setLocation('/my-page')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
            >
              マイページ (評価一覧)
            </Button>
            <Button
              onClick={() => setLocation('/horses')}
              variant="outline"
              className="text-gray-700 border-gray-300 hover:bg-gray-50 font-bold"
            >
              一覧に戻る
            </Button>
          </div>
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

            {/* 基本情報 & 測尺 */}
            <Card className="p-6 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">基本情報 / 測尺</h2>
              <div className="space-y-8">
                {/* 性別・毛色・年齢 */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 font-bold mb-1">性別</p>
                    <p className="text-xl text-gray-900 font-black">{horse.sex || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-bold mb-1">毛色</p>
                    <p className="text-xl text-gray-900 font-black">{horse.color || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-bold mb-1">生年月日</p>
                    <p className="text-xl text-gray-900 font-black">
                      {horse.birthDate
                        ? new Date(horse.birthDate).toLocaleDateString('ja-JP')
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-bold mb-1">年齢</p>
                    <p className="text-xl text-gray-900 font-black">
                      {horse.birthDate
                        ? `${new Date().getFullYear() - new Date(horse.birthDate).getFullYear()}歳`
                        : '-'}
                    </p>
                  </div>
                </div>

                {/* 測尺データ */}
                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-100">
                  <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                    <p className="text-[10px] text-blue-600 font-bold uppercase mb-1">体高</p>
                    <p className="text-2xl font-black text-blue-700">
                      {horse.height ? `${horse.height}` : '-'}
                      <span className="text-xs font-normal ml-0.5">cm</span>
                    </p>
                  </div>
                  <div className="bg-green-50/50 p-3 rounded-lg border border-green-100">
                    <p className="text-[10px] text-green-600 font-bold uppercase mb-1">胸囲</p>
                    <p className="text-2xl font-black text-green-700">
                      {horse.girth ? `${horse.girth}` : '-'}
                      <span className="text-xs font-normal ml-0.5">cm</span>
                    </p>
                  </div>
                  <div className="bg-purple-50/50 p-3 rounded-lg border border-purple-100">
                    <p className="text-[10px] text-purple-600 font-bold uppercase mb-1">管囲</p>
                    <p className="text-2xl font-black text-purple-700">
                      {horse.cannon ? `${horse.cannon}` : '-'}
                      <span className="text-xs font-normal ml-0.5">cm</span>
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* 血統情報 & PDF */}
            <Card className="p-6 shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">血統情報</h2>
                {pedigreePdfUrl && (
                  <a
                    href={pedigreePdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    PDFを別タブで開く ↗
                  </a>
                )}
              </div>

              <div className="space-y-6">
                {/* 父・母の名前 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                    <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-1">Sire / 父</p>
                    <p className="text-xl text-gray-900 font-black">{horse.sireName || '-'}</p>
                  </div>
                  <div className="p-4 bg-pink-50/50 rounded-lg border border-pink-100">
                    <p className="text-[10px] text-pink-600 font-bold uppercase tracking-wider mb-1">Dam / 母</p>
                    <p className="text-xl text-gray-900 font-black">{horse.damName || '-'}</p>
                  </div>
                </div>

                {/* PDFの埋め込み */}
                {pedigreePdfUrl ? (
                  <div className="mt-4 border rounded-xl overflow-hidden shadow-inner bg-gray-50 h-[800px]">
                    <iframe
                      src={`${pedigreePdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                      className="w-full h-full border-none"
                      title="血統書PDF"
                    >
                      PDFを表示できません。
                    </iframe>
                  </div>
                ) : (
                  <div className="h-40 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 text-sm border border-dashed">
                    血統書PDFがありません
                  </div>
                )}
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

                {/* Checklist */}
                {checklistItems && checklistItems.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span>✓</span>
                      <span>チェックリスト</span>
                    </h3>
                    <div className="space-y-3">
                      {checklistItems.map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-3 flex-1">
                            {item.itemType === 'boolean' ? (
                              <Checkbox
                                checked={checklistState[item.id] || false}
                                onCheckedChange={(checked) => handleChecklistChange(item.id, checked as boolean)}
                                className="w-5 h-5"
                              />
                            ) : (
                              <div className="w-5 h-5 flex items-center justify-center">
                                <span className="text-xs font-bold text-blue-600">{numericValues[item.id] || 0}</span>
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{item.itemName}</div>
                              <div className="text-xs text-gray-500">+{item.score}点</div>
                            </div>
                          </div>
                          {item.itemType === 'numeric' && (
                            <input
                              type="number"
                              min="0"
                              max={item.score}
                              value={numericValues[item.id] || 0}
                              onChange={(e) => handleNumericChange(item.id, parseInt(e.target.value) || 0)}
                              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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

                    </h3>
                    <div className="space-y-3">
                      {checklistItems.map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-3 flex-1">
                            {item.itemType === 'boolean' ? (
                              <Checkbox
                                checked={checklistState[item.id] || false}
                                onCheckedChange={(checked) => handleChecklistChange(item.id, checked as boolean)}
                                className="w-5 h-5"
                              />
                            ) : (
                              <div className="w-5 h-5 flex items-center justify-center">
                                <span className="text-xs font-bold text-blue-600">{numericValues[item.id] || 0}</span>
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{item.itemName}</div>
                              <div className="text-xs text-gray-500">+{item.score}点</div>
                            </div>
                          </div>
                          {item.itemType === 'numeric' && (
                            <input
                              type="number"
                              min="0"
                              max={item.score}
                              value={numericValues[item.id] || 0}
                              onChange={(e) => handleNumericChange(item.id, parseInt(e.target.value) || 0)}
                              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 除外ボタン */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <Button
                    onClick={() => {
                      setIsEliminated(!isEliminated);
                      if (!isEliminated) {
                        setEvaluation(null);
                        setMemo('');
                      }
                    }}
                    variant={isEliminated ? "default" : "outline"}
                    className={`w-full font-bold transition-all ${isEliminated
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'text-red-600 border-red-200 hover:bg-red-50'
                      }`}
                  >
                    {isEliminated ? '除外を解除する' : '検討対象から除外する'}
                  </Button>
                </div>

                {/* 保存ボタン */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <Button
                    onClick={handleSaveEvaluation}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
                  >
                    評価・メモを保存
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
