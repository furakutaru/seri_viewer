import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import ChecklistManager from "@/components/ChecklistManager";

interface HorseDetailProps {
  params: {
    id: string;
  };
}

export default function HorseDetail({ params }: HorseDetailProps) {
  const horseId = parseInt(params.id);
  const [, setLocation] = useLocation();
  const [showSidebar, setShowSidebar] = useState(true);
  const [evaluation, setEvaluation] = useState<"◎" | "○" | "△" | null>(null);
  const [memo, setMemo] = useState("");
  const [isEliminated, setIsEliminated] = useState(false);
  const [showCheckItems, setShowCheckItems] = useState(false);
  const [activeTab, setActiveTab] = useState<"checklist" | "memo" | "pdf">("checklist");

  // 馬の詳細情報を取得
  const { data: horse, isLoading } = trpc.horses.getById.useQuery({ id: horseId });

  // 前の馬を取得
  const { data: previousHorse } = trpc.navigation.getPrevious.useQuery(
    { saleId: horse?.saleId || 1, currentHorseId: horseId },
    { enabled: !!horse?.saleId }
  );

  // 次の馬を取得
  const { data: nextHorse } = trpc.navigation.getNext.useQuery(
    { saleId: horse?.saleId || 1, currentHorseId: horseId },
    { enabled: !!horse?.saleId }
  );

  // ユーザーの評価を取得
  const { data: userCheck } = trpc.userChecks.getByHorse.useQuery(
    { horseId },
    { enabled: !!horseId }
  );

  // 評価を更新
  const updateCheckMutation = trpc.userChecks.update.useMutation();

  const handleEvaluationChange = (value: "◎" | "○" | "△") => {
    setEvaluation(value);
    updateCheckMutation.mutate({
      horseId,
      evaluation: value,
      memo,
      isEliminated,
    });
  };

  const handleMemoChange = (value: string) => {
    setMemo(value);
  };

  const handleEliminatedChange = (value: boolean) => {
    setIsEliminated(value);
    updateCheckMutation.mutate({
      horseId,
      evaluation,
      memo,
      isEliminated: value,
    });
  };

  const handleSaveMemo = () => {
    updateCheckMutation.mutate({
      horseId,
      evaluation,
      memo,
      isEliminated,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  if (!horse) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg mb-4">馬が見つかりません</p>
          <Link href="/horses">
            <Button>一覧に戻る</Button>
          </Link>
        </div>
      </div>
    );
  }

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
          {previousHorse && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation(`/horses/${previousHorse.id}`)}
              title="前の馬へ"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          )}
          <h1 className="text-2xl font-bold">{horse.horseName}</h1>
          <span className="text-sm text-muted-foreground">上場番号: {horse.lotNumber}</span>
          {nextHorse && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation(`/horses/${nextHorse.id}`)}
              title="次の馬へ"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant={evaluation === "◎" ? "default" : "outline"}
            onClick={() => handleEvaluationChange("◎")}
          >
            ◎
          </Button>
          <Button
            variant={evaluation === "○" ? "default" : "outline"}
            onClick={() => handleEvaluationChange("○")}
          >
            ○
          </Button>
          <Button
            variant={evaluation === "△" ? "default" : "outline"}
            onClick={() => handleEvaluationChange("△")}
          >
            △
          </Button>
          <Button
            variant={isEliminated ? "destructive" : "outline"}
            onClick={() => handleEliminatedChange(!isEliminated)}
          >
            {isEliminated ? "消（解除）" : "消"}
          </Button>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* 左パネル：馬情報 */}
        <div className="flex-1 overflow-auto border-r p-6">
          <div className="max-w-2xl">
            {/* 写真 */}
            {horse.photoUrl && (
              <div className="mb-6">
                <img
                  src={horse.photoUrl}
                  alt={horse.horseName}
                  className="w-full rounded-lg object-cover max-h-96"
                />
              </div>
            )}

            {/* 基本情報 */}
            <Card className="p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">基本情報</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">性別</p>
                  <p className="font-semibold">{horse.sex}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">毛色</p>
                  <p className="font-semibold">{horse.color}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">生年月日</p>
                  <p className="font-semibold">
                    {horse.birthDate ? new Date(horse.birthDate).toLocaleDateString("ja-JP") : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">販売希望価格</p>
                  <p className="font-semibold">{horse.priceEstimate}万円</p>
                </div>
              </div>
            </Card>

            {/* 血統情報 */}
            <Card className="p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">血統情報</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">父馬</p>
                  <p className="font-semibold">
                    {horse.sireName}
                    {horse.sireName && (
                      <a
                        href={`https://jbis.or.jp/horse/${encodeURIComponent(horse.sireName)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-blue-600 text-sm"
                      >
                        (JBIS)
                      </a>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">母馬</p>
                  <p className="font-semibold">
                    {horse.damName}
                    {horse.damName && (
                      <a
                        href={`https://jbis.or.jp/horse/${encodeURIComponent(horse.damName)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-blue-600 text-sm"
                      >
                        (JBIS)
                      </a>
                    )}
                  </p>
                </div>
              </div>
            </Card>

            {/* 即尺データ */}
            <Card className="p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">即尺データ</h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">体高</p>
                  <p className="font-semibold">{horse.height} cm</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">胸囲</p>
                  <p className="font-semibold">{horse.girth} cm</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">管囲</p>
                  <p className="font-semibold">{horse.cannon} cm</p>
                </div>
              </div>
            </Card>

            {/* 牧場情報 */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">牧場情報</h2>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">上場者</p>
                  <p className="font-semibold">{horse.consignor}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">生産者</p>
                  <p className="font-semibold">{horse.breeder}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* 右パネル：チェックリスト・血統PDF・メモ */}
        <div className="w-96 border-l bg-muted/30 flex flex-col">
          {/* タブ */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab("checklist")}
              className={`flex-1 py-3 px-4 text-sm font-medium ${
                activeTab === "checklist" ? "border-b-2 border-primary" : "text-muted-foreground"
              }`}
            >
              チェック
            </button>
            <button
              onClick={() => setActiveTab("pdf")}
              className={`flex-1 py-3 px-4 text-sm font-medium ${
                activeTab === "pdf" ? "border-b-2 border-primary" : "text-muted-foreground"
              }`}
            >
              血統PDF
            </button>
            <button
              onClick={() => setActiveTab("memo")}
              className={`flex-1 py-3 px-4 text-sm font-medium ${
                activeTab === "memo" ? "border-b-2 border-primary" : "text-muted-foreground"
              }`}
            >
              メモ
            </button>
          </div>

          {/* コンテンツ */}
          <div className="flex-1 overflow-auto p-4">
            {activeTab === "checklist" && (
              <ChecklistManager saleId={horse.saleId} horseId={horseId} userCheckId={userCheck?.id} />
            )}

            {activeTab === "pdf" && (
              <div>
                {horse.pedigreePdfUrl ? (
                  <iframe
                    src={horse.pedigreePdfUrl}
                    className="w-full h-full rounded"
                    title="血統PDF"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    血統PDFが利用できません
                  </div>
                )}
              </div>
            )}

            {activeTab === "memo" && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">メモ</label>
                  <textarea
                    value={memo}
                    onChange={(e) => handleMemoChange(e.target.value)}
                    className="w-full h-32 p-2 border rounded resize-none"
                    placeholder="メモを入力してください"
                  />
                </div>
                <Button onClick={handleSaveMemo} className="w-full">
                  メモを保存
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
