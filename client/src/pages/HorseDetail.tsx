import { useState, useEffect, useMemo } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ImageCarousel } from '@/components/ImageCarousel';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { getAbsoluteUrl } from '@/lib/utils';
import { toast } from 'sonner';

export default function HorseDetail() {
  const [location, setLocation] = useLocation();
  const [match, params] = useRoute('/horses/:id');
  const { user, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const horseId = params?.id ? parseInt(params.id) : null;

  const [evaluation, setEvaluation] = useState<'◎' | '○' | '△' | null>(null);
  const [memo, setMemo] = useState('');
  const [isEliminated, setIsEliminated] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  // Checklist state management
  const [checklistState, setChecklistState] = useState<Record<number, boolean>>({});
  const [numericValues, setNumericValues] = useState<Record<number, number>>({});

  // Fetch horse data
  const { data: horse, isLoading, error } = trpc.horses.getById.useQuery(horseId || 0, {
    enabled: !!horseId,
  });

  // Navigation functions
  const navigateToHorse = async (direction: 'prev' | 'next') => {
    if (!horse) return;

    const targetLot = direction === 'prev' ? horse.lotNumber - 1 : horse.lotNumber + 1;
    if (targetLot < 1) return;

    // Reset state immediately when navigating
    setEvaluation(null);
    setMemo('');
    setIsEliminated(false);
    setChecklistState({});
    setNumericValues({});

    const targetHorse = await utils.horses.getByLotNumber.fetch({ lotNumber: targetLot, saleId: horse.saleId });
    if (targetHorse) {
      setLocation('/horses/' + targetHorse.id);
    }
  };

  // Fetch user check data
  const { data: userCheck } = trpc.horses.getUserCheck.useQuery(horseId || 0, {
    enabled: !!horseId && isAuthenticated,
  });

  // Fetch checklist items (both sale-specific and general)
  const { data: checklistItems } = trpc.horses.checkListItems.getAll.useQuery(
    {},
    { enabled: isAuthenticated }
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
    const newChecklistState = { ...checklistState, [itemId]: isChecked };
    setChecklistState(newChecklistState);
    saveChecklistResultsData(newChecklistState, numericValues);
  };

  const handleNumericChange = (itemId: number, value: number) => {
    const newNumericValues = { ...numericValues, [itemId]: value };
    setNumericValues(newNumericValues);
    saveChecklistResultsData(checklistState, newNumericValues);
  };

  const saveChecklistResultsData = (currentChecklistState = checklistState, currentNumericValues = numericValues) => {
    if (!horseId || !checklistItems) return;

    const results = checklistItems.map(item => {
      if (item.itemType === 'boolean') {
        return {
          checkItemId: item.id,
          isChecked: currentChecklistState[item.id] || false,
          scoreApplied: currentChecklistState[item.id] ? item.score : 0,
        };
      } else {
        return {
          checkItemId: item.id,
          isChecked: currentNumericValues[item.id] > 0,
          scoreApplied: currentNumericValues[item.id] || 0,
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
      toast.success('評価・メモを保存しました', {
        description: '内容が正常に保存されました。',
        duration: 3000,
      });
    },
    onError: () => {
      toast.error('保存に失敗しました', {
        description: '時間をおいて再度お試しください。',
        duration: 4000,
      });
    },
  });

  // Exclude mutation (separate from saveUserCheck to avoid conflicting toasts)
  const excludeMutation = trpc.horses.saveUserCheck.useMutation({
    onSuccess: () => {
      // Toast is shown in handleExcludeToggle after state update
    },
    onError: () => {
      toast.error('操作に失敗しました', {
        description: '時間をおいて再度お試しください。',
        duration: 4000,
      });
    },
  });

  // Handle exclude/unexclude with toast
  const handleExcludeToggle = async () => {
    if (!horseId || !user) return;

    const newIsEliminated = !isEliminated;

    // Update local state immediately for UI responsiveness
    setIsEliminated(newIsEliminated);
    if (newIsEliminated) {
      setEvaluation(null);
      setMemo('');
    }

    // Save to server
    excludeMutation.mutate({
      horseId,
      evaluation: newIsEliminated ? null : evaluation,
      memo: newIsEliminated ? '' : memo,
      isEliminated: newIsEliminated,
    });

    // Show appropriate toast immediately for better UX
    if (newIsEliminated) {
      toast.success('検討対象から除外しました', {
        description: 'この馬を検討リストから除外しました。',
        duration: 3000,
      });
    } else {
      toast.success('除外を解除しました', {
        description: 'この馬を検討リストに戻しました。',
        duration: 3000,
      });
    }
  };

  const handleSaveEvaluation = async () => {
    if (!horseId || !user) return;

    saveUserCheck.mutate({
      horseId,
      evaluation,
      memo,
      isEliminated,
    });
  };

  // Initialize form when data loads
  useEffect(() => {
    try {
      if (userCheck && typeof userCheck === 'object' && userCheck !== null) {
        setEvaluation(userCheck.evaluation || null);
        setMemo(userCheck.memo || '');
        setIsEliminated(userCheck.isEliminated || false);
      }
    } catch (error) {
      console.error('Error initializing user check data:', error);
      // デフォルト値を設定
      setEvaluation(null);
      setMemo('');
      setIsEliminated(false);
    }
  }, [userCheck]);

  // Navigation functionality temporarily disabled
  const navigation = null;

  // Get absolute URLs for photo and pedigree PDF using the catalog URL from sale info
  // 画像URLの準備 - 新しいimageUrlsフィールドと古いphotoUrlフィールドの両方に対応
  // horseデータが変更されたら画像URLを再計算
  useEffect(() => {
    if (!horse) {
      setImages([]);
      return;
    }

    const urlSet = new Set<string>();

    // 新しいimageUrlsフィールドを優先的に処理
    if (horse.imageUrls && Array.isArray(horse.imageUrls)) {
      horse.imageUrls.forEach(url => {
        if (url && typeof url === 'string' && url.trim() !== '') {
          urlSet.add(url);
        }
      });
    }

    // 古いphotoUrlフィールドを処理（既に含まれていれば無視される）
    if (horse.photoUrl && typeof horse.photoUrl === 'string' && horse.photoUrl.trim() !== '') {
      urlSet.add(horse.photoUrl);
    }

    setImages(Array.from(urlSet));
  }, [horse?.id, (horse as any)?.imageUrls, horse?.photoUrl]);

  if (isLoading || !horse) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-bold">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
        <Card className="p-8 text-center bg-white shadow-lg">
          <p className="text-red-600 mb-4 font-bold">エラーが発生しました</p>
          <Button onClick={() => setLocation('/horses')} className="bg-blue-600 hover:bg-blue-700">一覧に戻る</Button>
        </Card>
      </div>
    );
  }


  const photoUrl = images.length > 0 ? images[0] : null;
  const pedigreePdfUrl = getAbsoluteUrl(horse.pedigreePdfUrl, (horse as any).sale?.catalogUrl);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      {/* 固定ナビゲーション */}
      {horse && (
        <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-50 bg-white rounded-lg shadow-lg p-4 border border-gray-200">
          <div className="text-center space-y-3">
            <div className="text-sm font-bold text-gray-700 mb-2">
              {horse.lotNumber}/1462
            </div>

            <button
              onClick={() => navigateToHorse('prev')}
              disabled={horse.lotNumber <= 1}
              className="w-full px-3 py-2 bg-gray-600 text-white text-sm font-medium rounded hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              ◀
            </button>

            <button
              onClick={() => navigateToHorse('next')}
              className="w-full px-3 py-2 bg-gray-600 text-white text-sm font-medium rounded hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              ▶
            </button>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">上場番号 {horse.lotNumber}</h1>
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
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">馬体画像</h2>
              <ImageCarousel
                images={images}
                alt={`上場番号 ${horse.lotNumber}`}
                className="w-full"
              />
            </Card>

            {/* 基本情報 & 測尺 */}
            <Card className="p-6 shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">基本情報 / 測尺</h2>
                {horse.jbisUrl && (
                  <a
                    href={horse.jbisUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    JBISで詳細を見る ↗
                  </a>
                )}
              </div>
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
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">血統情報</h2>
                {pedigreePdfUrl && (
                  <a
                    href={pedigreePdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    血統書PDFを開く ↗
                  </a>
                )}
              </div>

              <div className="space-y-6">
                {/* 父・母の名前 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-1">Sire / 父</p>
                        <p className="text-xl text-gray-900 font-black">{horse.sireName || '-'}</p>
                      </div>
                      {horse.sireUrl && (
                        <a
                          href={horse.sireUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline font-medium"
                        >
                          JBIS
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="p-4 bg-pink-50/50 rounded-lg border border-pink-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] text-pink-600 font-bold uppercase tracking-wider mb-1">Dam / 母</p>
                        <p className="text-xl text-gray-900 font-black">{horse.damName || '-'}</p>
                      </div>
                      {horse.damUrl && (
                        <a
                          href={horse.damUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline font-medium"
                        >
                          JBIS
                        </a>
                      )}
                    </div>
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
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">出品情報</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg text-lg">🏢</div>
                  <div>
                    <p className="text-sm text-gray-600 font-semibold">申込者</p>
                    <p className="text-lg text-gray-900 font-medium">{horse.consignor ? (horse.consignor.includes('（') ? horse.consignor.slice(horse.consignor.indexOf('（')) : horse.consignor) : '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg text-lg">🌾</div>
                  <div>
                    <p className="text-sm text-gray-600 font-semibold">生産者</p>
                    <p className="text-lg text-gray-900 font-medium">{horse.breeder ? (horse.breeder.includes('（') ? horse.breeder.slice(horse.breeder.indexOf('（')) : horse.breeder) : '-'}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* サイドバー - 評価パネル */}
          <div className="space-y-6">
            {/* 評価 */}
            <Card className="p-6 shadow-lg">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
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
                    <h3 className="text-base md:text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
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

            {/* 除外ボタン - 検討メモセクションの外に移動 */}
            <Card className="p-6 shadow-lg">
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-sm font-semibold text-gray-700 mb-3">
                    検討対象の管理
                  </div>
                  <Button
                    onClick={handleExcludeToggle}
                    variant={isEliminated ? "default" : "outline"}
                    className={`w-full font-bold transition-all ${isEliminated
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'text-red-600 border-red-200 hover:bg-red-50'
                      }`}
                  >
                    {isEliminated ? '除外を解除する' : '検討対象から除外する'}
                  </Button>
                </div>
              </div>
            </Card>

            {/* 人気度統計 */}
            {popularityStats && popularityStats.total > 0 && (
              <Card className="p-6 shadow-lg">
                <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-6">みんなの評価</h2>
                <div className="space-y-3">
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
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
