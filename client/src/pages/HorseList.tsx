import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Link } from "wouter";

export default function HorseList() {
  const [saleId] = useState(1); // Sample sale ID
  const [filters, setFilters] = useState({
    sireName: "",
    breeder: "",
    heightMin: undefined as number | undefined,
    heightMax: undefined as number | undefined,
    girthMin: undefined as number | undefined,
    girthMax: undefined as number | undefined,
    cannonMin: undefined as number | undefined,
    cannonMax: undefined as number | undefined,
  });
  const [sortBy, setSortBy] = useState<"lotNumber" | "sireName" | "height" | "totalScore">("lotNumber");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // 馬一覧を取得
  const { data: horses = [], isLoading } = trpc.horses.listBySale.useQuery({
    saleId,
    sireName: filters.sireName || undefined,
    breeder: filters.breeder || undefined,
    heightMin: filters.heightMin,
    heightMax: filters.heightMax,
    girthMin: filters.girthMin,
    girthMax: filters.girthMax,
    cannonMin: filters.cannonMin,
    cannonMax: filters.cannonMax,
  });

  // ソート処理
  const sortedHorses = useMemo(() => {
    const sorted = [...horses].sort((a, b) => {
      let aVal: any = a[sortBy as keyof typeof a];
      let bVal: any = b[sortBy as keyof typeof b];

      if (sortBy === "totalScore") {
        aVal = (a as any).userCheck?.totalScore || 0;
        bVal = (b as any).userCheck?.totalScore || 0;
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [horses, sortBy, sortOrder]);

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === "" ? undefined : value,
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">セリ市ビューワー</h1>
          <Link href="/comparison">
            <Button>比較画面へ</Button>
          </Link>
        </div>

        {/* フィルタリングUI */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">フィルタリング</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">父馬名</label>
              <Input
                placeholder="父馬名"
                value={filters.sireName}
                onChange={(e) => handleFilterChange("sireName", e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">飼養者</label>
              <Input
                placeholder="飼養者"
                value={filters.breeder}
                onChange={(e) => handleFilterChange("breeder", e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">体高 (cm)</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="最小"
                  value={filters.heightMin || ""}
                  onChange={(e) =>
                    handleFilterChange("heightMin", e.target.value ? parseFloat(e.target.value) : undefined)
                  }
                />
                <Input
                  type="number"
                  placeholder="最大"
                  value={filters.heightMax || ""}
                  onChange={(e) =>
                    handleFilterChange("heightMax", e.target.value ? parseFloat(e.target.value) : undefined)
                  }
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">胸囲 (cm)</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="最小"
                  value={filters.girthMin || ""}
                  onChange={(e) =>
                    handleFilterChange("girthMin", e.target.value ? parseFloat(e.target.value) : undefined)
                  }
                />
                <Input
                  type="number"
                  placeholder="最大"
                  value={filters.girthMax || ""}
                  onChange={(e) =>
                    handleFilterChange("girthMax", e.target.value ? parseFloat(e.target.value) : undefined)
                  }
                />
              </div>
            </div>
          </div>
        </Card>

        {/* ソート・表示オプション */}
        <div className="flex gap-4 mb-6">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border rounded"
          >
            <option value="lotNumber">上場番号</option>
            <option value="sireName">父馬名</option>
            <option value="height">体高</option>
            <option value="totalScore">スコア</option>
          </select>
          <Button
            variant="outline"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            {sortOrder === "asc" ? "昇順" : "降順"}
          </Button>
        </div>

        {/* 馬一覧テーブル */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted">
                <th className="border p-3 text-left">上場番号</th>
                <th className="border p-3 text-left">馬名</th>
                <th className="border p-3 text-left">性別</th>
                <th className="border p-3 text-left">父馬名</th>
                <th className="border p-3 text-left">体高</th>
                <th className="border p-3 text-left">胸囲</th>
                <th className="border p-3 text-left">管囲</th>
                <th className="border p-3 text-left">人気度</th>
                <th className="border p-3 text-left">操作</th>
              </tr>
            </thead>
            <tbody>
              {sortedHorses.map((horse: any) => (
                <tr key={horse.id} className="hover:bg-muted/50">
                  <td className="border p-3">{horse.lotNumber}</td>
                  <td className="border p-3 font-semibold">{horse.horseName}</td>
                  <td className="border p-3">{horse.sex}</td>
                  <td className="border p-3">{horse.sireName}</td>
                  <td className="border p-3">{horse.height} cm</td>
                  <td className="border p-3">{horse.girth} cm</td>
                  <td className="border p-3">{horse.cannon} cm</td>
                  <td className="border p-3">
                    <span className="text-sm">
                      ◎{horse.stats?.countExcellent || 0} ○{horse.stats?.countGood || 0} △
                      {horse.stats?.countFair || 0}
                    </span>
                  </td>
                  <td className="border p-3">
                    <Link href={`/horse/${horse.id}`}>
                      <Button size="sm">
                        詳細
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sortedHorses.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            該当する馬がありません
          </div>
        )}

        {/* 統計ダッシュボードへのリンク */}
        <div className="mt-8 flex justify-center">
          <Link href="/statistics">
            <Button variant="default" size="lg">
              統計ダッシュボードを詳細
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
