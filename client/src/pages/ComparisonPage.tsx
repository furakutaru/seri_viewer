import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "wouter";
import { Loader2, X } from "lucide-react";

interface SelectedHorse {
  id: number;
  name: string;
}

export default function ComparisonPage() {
  const [selectedHorseIds, setSelectedHorseIds] = useState<number[]>([]);
  const [filterEvaluation, setFilterEvaluation] = useState<"◎" | "○" | "△" | null>(null);
  const [showEliminated, setShowEliminated] = useState(true);

  // 比較対象の馬の詳細情報を取得
  const { data: horsesData, isLoading } = trpc.comparison.getMultiple.useQuery(
    { horseIds: selectedHorseIds },
    { enabled: selectedHorseIds.length > 0 }
  );

  // 評価を一括更新
  const updateEvaluationsMutation = trpc.comparison.updateEvaluations.useMutation();

  // 馬を選択/解除
  const toggleHorseSelection = (horseId: number) => {
    setSelectedHorseIds((prev) =>
      prev.includes(horseId) ? prev.filter((id) => id !== horseId) : [...prev, horseId]
    );
  };

  // 評価を変更
  const handleEvaluationChange = (horseId: number, evaluation: "◎" | "○" | "△" | null) => {
    const updates = [{ horseId, evaluation }];
    updateEvaluationsMutation.mutate({ updates });
  };

  // 消フラグを変更
  const handleEliminatedChange = (horseId: number, isEliminated: boolean) => {
    const updates = [{ horseId, isEliminated }];
    updateEvaluationsMutation.mutate({ updates });
  };

  // フィルタリング
  const filteredHorses = horsesData?.filter((horse) => {
    if (filterEvaluation && horse.userEvaluation?.evaluation !== filterEvaluation) {
      return false;
    }
    if (!showEliminated && horse.userEvaluation?.isEliminated) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* ヘッダー */}
      <div className="bg-muted p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/horses">
            <Button variant="ghost" size="sm">
              ← 一覧に戻る
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">馬の比較</h1>
          <span className="text-sm text-muted-foreground">
            {selectedHorseIds.length}頭を選択中
          </span>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* 左パネル：馬選択 */}
        <div className="w-80 border-r bg-muted/30 overflow-auto p-4">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold mb-4">馬を選択</h2>
              <p className="text-sm text-muted-foreground mb-4">
                一覧から馬を選択して比較してください
              </p>
            </div>

            {/* フィルタリングオプション */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">フィルタリング</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="filter-all"
                    checked={filterEvaluation === null}
                    onCheckedChange={() => setFilterEvaluation(null)}
                  />
                  <label htmlFor="filter-all" className="text-sm cursor-pointer">
                    すべて表示
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="filter-excellent"
                    checked={filterEvaluation === "◎"}
                    onCheckedChange={() => setFilterEvaluation("◎")}
                  />
                  <label htmlFor="filter-excellent" className="text-sm cursor-pointer">
                    ◎ のみ表示
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="filter-good"
                    checked={filterEvaluation === "○"}
                    onCheckedChange={() => setFilterEvaluation("○")}
                  />
                  <label htmlFor="filter-good" className="text-sm cursor-pointer">
                    ○ のみ表示
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="filter-fair"
                    checked={filterEvaluation === "△"}
                    onCheckedChange={() => setFilterEvaluation("△")}
                  />
                  <label htmlFor="filter-fair" className="text-sm cursor-pointer">
                    △ のみ表示
                  </label>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Checkbox
                    id="show-eliminated"
                    checked={showEliminated}
                    onCheckedChange={(checked) => setShowEliminated(checked as boolean)}
                  />
                  <label htmlFor="show-eliminated" className="text-sm cursor-pointer">
                    消フラグを表示
                  </label>
                </div>
              </div>
            </Card>

            {/* 選択済みの馬 */}
            {selectedHorseIds.length > 0 && (
              <Card className="p-4">
                <h3 className="font-semibold mb-3">選択済み ({selectedHorseIds.length})</h3>
                <div className="space-y-2">
                  {selectedHorseIds.map((id) => {
                    const horse = horsesData?.find((h) => h.id === id);
                    return (
                      <div key={id} className="flex items-center justify-between p-2 bg-background rounded">
                        <span className="text-sm">{horse?.horseName || `馬 #${id}`}</span>
                        <button
                          onClick={() => toggleHorseSelection(id)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {selectedHorseIds.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <p>馬を選択すると比較が開始されます</p>
              </div>
            )}
          </div>
        </div>

        {/* 右パネル：比較表示 */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="animate-spin w-8 h-8" />
            </div>
          ) : filteredHorses && filteredHorses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredHorses.map((horse) => {
                if (!horse.id) return null;
                return (
                <Card key={horse.id} className="overflow-hidden">
                  {/* 写真 */}
                  {horse.photoUrl && (
                    <img
                      src={horse.photoUrl}
                      alt={horse.horseName}
                      className="w-full h-48 object-cover"
                    />
                  )}

                  {/* 情報 */}
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{horse.horseName}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      上場番号: {horse.lotNumber}
                    </p>

                    {/* 基本情報 */}
                    <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">性別</p>
                        <p className="font-semibold">{horse.sex}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">毛色</p>
                        <p className="font-semibold">{horse.color}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">体高</p>
                        <p className="font-semibold">{horse.height} cm</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">胸囲</p>
                        <p className="font-semibold">{horse.girth} cm</p>
                      </div>
                    </div>

                    {/* 血統情報 */}
                    <div className="mb-4 text-sm">
                      <p className="text-muted-foreground">父馬</p>
                      <p className="font-semibold">{horse.sireName}</p>
                    </div>

                    {/* 評価ボタン */}
                    <div className="flex gap-2 mb-4">
                      <Button
                        size="sm"
                        variant={horse.userEvaluation?.evaluation === "◎" ? "default" : "outline"}
                        onClick={() => handleEvaluationChange(horse.id!, "◎")}
                        className="flex-1"
                      >
                        ◎
                      </Button>
                      <Button
                        size="sm"
                        variant={horse.userEvaluation?.evaluation === "○" ? "default" : "outline"}
                        onClick={() => handleEvaluationChange(horse.id!, "○")}
                        className="flex-1"
                      >
                        ○
                      </Button>
                      <Button
                        size="sm"
                        variant={horse.userEvaluation?.evaluation === "△" ? "default" : "outline"}
                        onClick={() => handleEvaluationChange(horse.id!, "△")}
                        className="flex-1"
                      >
                        △
                      </Button>
                    </div>

                    {/* 消フラグ */}
                    <Button
                      size="sm"
                      variant={horse.userEvaluation?.isEliminated ? "destructive" : "outline"}
                      onClick={() => {
                        const isCurrentlyEliminated = horse.userEvaluation?.isEliminated ?? false;
                        handleEliminatedChange(horse.id!, !isCurrentlyEliminated);
                      }}
                      className="w-full mb-4"
                    >
                      {horse.userEvaluation?.isEliminated ? "消（解除）" : "消"}
                    </Button>

                    {/* 詳細へのリンク */}
                    <Link href={`/horses/${horse.id}`}>
                      <Button size="sm" variant="ghost" className="w-full">
                        詳細を見る
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
              })}
            </div>
          ) : selectedHorseIds.length > 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>フィルタリング条件に一致する馬がありません</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
