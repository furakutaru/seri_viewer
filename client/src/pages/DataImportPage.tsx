import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function DataImportPage() {
  const [saleId, setSaleId] = useState(1);
  const [saleName, setSaleName] = useState("");
  const [catalogUrl, setCatalogUrl] = useState("");
  const [jokushaUrl, setJokushaUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // データ取り込みステータスを取得
  const { data: importStatus, refetch } = trpc.dataImport.getImportStatus.useQuery(
    { saleId },
    { enabled: saleId > 0 }
  );

  // セリを作成
  const createSaleMutation = trpc.dataImport.createSale.useMutation({
    onSuccess: () => {
      toast.success("セリを作成しました");
      setSaleName("");
      setCatalogUrl("");
      setJokushaUrl("");
      refetch();
    },
    onError: (error) => {
      toast.error(`エラー: ${error.message}`);
    },
  });

  const handleCreateSale = async () => {
    if (!saleName || !catalogUrl) {
      toast.error("セリ名とカタログURLは必須です");
      return;
    }

    setIsLoading(true);
    try {
      await createSaleMutation.mutateAsync({
        name: saleName,
        catalogUrl,
        jokushaUrl: jokushaUrl || undefined,
      });
    } finally {
      setIsLoading(false);
    }
  };

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
          <h1 className="text-2xl font-bold">データ取り込み管理</h1>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="p-6 max-w-4xl mx-auto">
        {/* セリ作成フォーム */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">新しいセリを作成</h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">セリ名</label>
              <Input
                placeholder="例: 2025年サマーセール"
                value={saleName}
                onChange={(e) => setSaleName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">カタログURL</label>
              <Input
                placeholder="https://wmp512t973.user-space.cdn.idcfcloud.net/catalog/..."
                value={catalogUrl}
                onChange={(e) => setCatalogUrl(e.target.value)}
                type="url"
              />
              <p className="text-xs text-muted-foreground mt-1">
                日高軽種馬農業協同組合のカタログHTMLのURL
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">即尺PDF URL（オプション）</label>
              <Input
                placeholder="https://w2.hba.or.jp/upload/..."
                value={jokushaUrl}
                onChange={(e) => setJokushaUrl(e.target.value)}
                type="url"
              />
              <p className="text-xs text-muted-foreground mt-1">
                即尺データを含むPDFのURL
              </p>
            </div>

            <Button
              onClick={handleCreateSale}
              disabled={isLoading || !saleName || !catalogUrl}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  作成中...
                </>
              ) : (
                "セリを作成"
              )}
            </Button>
          </div>
        </Card>

        {/* 取り込みステータス */}
        {importStatus && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">取り込みステータス</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">カタログ取り込み</p>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      importStatus.catalogStatus === "completed"
                        ? "bg-green-500"
                        : importStatus.catalogStatus === "processing"
                        ? "bg-yellow-500"
                        : importStatus.catalogStatus === "failed"
                        ? "bg-red-500"
                        : "bg-gray-300"
                    }`}
                  />
                  <span className="text-sm">
                    {importStatus.catalogStatus === "completed"
                      ? "完了"
                      : importStatus.catalogStatus === "processing"
                      ? "処理中..."
                      : importStatus.catalogStatus === "failed"
                      ? "失敗"
                      : "待機中"}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium">即尺データ取り込み</p>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      importStatus.jokushaStatus === "completed"
                        ? "bg-green-500"
                        : importStatus.jokushaStatus === "processing"
                        ? "bg-yellow-500"
                        : importStatus.jokushaStatus === "failed"
                        ? "bg-red-500"
                        : "bg-gray-300"
                    }`}
                  />
                  <span className="text-sm">
                    {importStatus.jokushaStatus === "completed"
                      ? "完了"
                      : importStatus.jokushaStatus === "processing"
                      ? "処理中..."
                      : importStatus.jokushaStatus === "failed"
                      ? "失敗"
                      : "待機中"}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium">登録馬数</p>
                <p className="text-sm mt-1">{importStatus.horsesCount}件</p>
              </div>
            </div>
          </Card>
        )}

        {/* 使用方法 */}
        <Card className="p-6 mt-6 bg-blue-50">
          <h3 className="font-semibold mb-2">使用方法</h3>
          <ol className="text-sm space-y-2 list-decimal list-inside">
            <li>セリ名を入力します</li>
            <li>カタログHTMLのURLを入力します</li>
            <li>（オプション）即尺PDFのURLを入力します</li>
            <li>「セリを作成」ボタンをクリックします</li>
            <li>自動的にデータが取り込まれます</li>
          </ol>
        </Card>
      </div>
    </div>
  );
}
