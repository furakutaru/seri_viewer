import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function StatisticsDashboard() {
  const [selectedSaleId, setSelectedSaleId] = useState(1);

  // セリの人気度統計を取得
  const { data: popularityStats, isLoading: isLoadingPopularity } = (trpc.statistics as any)?.getPopularityBySale?.useQuery({
    saleId: selectedSaleId,
  }) || { data: undefined, isLoading: false };

  if (isLoadingPopularity) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  // チャートデータの準備
  const chartData = popularityStats?.statistics.map((horse: any) => ({
    name: horse.horseName,
    "◎": horse.excellentCount,
    "○": horse.goodCount,
    "△": horse.fairCount,
    "消": horse.eliminatedCount,
  })) || [];

  // 人気度スコアのデータ
  const popularityData = popularityStats?.statistics.map((horse: any) => ({
    name: horse.horseName,
    score: horse.popularityScore,
  })) || [];

  // 評価分布のデータ
  const evaluationDistribution = [
    {
      name: "◎（優秀）",
      value: popularityStats?.statistics.reduce((sum: number, h: any) => sum + h.excellentCount, 0) || 0,
      color: "#ef4444",
    },
    {
      name: "○（良好）",
      value: popularityStats?.statistics.reduce((sum: number, h: any) => sum + h.goodCount, 0) || 0,
      color: "#f97316",
    },
    {
      name: "△（要検討）",
      value: popularityStats?.statistics.reduce((sum: number, h: any) => sum + h.fairCount, 0) || 0,
      color: "#eab308",
    },
    {
      name: "消（対象外）",
      value: popularityStats?.statistics.reduce((sum: number, h: any) => sum + h.eliminatedCount, 0) || 0,
      color: "#6b7280",
    },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">統計・可視化ダッシュボード</h1>

        {/* セリ選択 */}
        <div className="mb-8">
          <label className="block text-sm font-medium mb-2">セリを選択</label>
          <select
            value={selectedSaleId}
            onChange={(e) => setSelectedSaleId(parseInt(e.target.value))}
            className="border border-border rounded px-3 py-2"
          >
            <option value={1}>2025年サマーセール</option>
            <option value={2}>2025年セプテンバーセール</option>
            <option value={3}>2025年オータムセール</option>
          </select>
        </div>

        {/* 統計サマリー */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="text-sm font-medium text-muted-foreground">総投票数</div>
            <div className="text-2xl font-bold mt-2">{popularityStats?.totalEvaluations || 0}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm font-medium text-muted-foreground">◎（優秀）</div>
            <div className="text-2xl font-bold mt-2 text-red-500">
              {evaluationDistribution[0]?.value || 0}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm font-medium text-muted-foreground">○（良好）</div>
            <div className="text-2xl font-bold mt-2 text-orange-500">
              {evaluationDistribution[1]?.value || 0}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm font-medium text-muted-foreground">△（要検討）</div>
            <div className="text-2xl font-bold mt-2 text-yellow-500">
              {evaluationDistribution[2]?.value || 0}
            </div>
          </Card>
        </div>

        {/* チャート */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* 評価分布（円グラフ） */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">評価分布</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={evaluationDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {evaluationDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* 人気度スコアランキング（棒グラフ） */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">人気度スコアランキング（上位10）</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={popularityData.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="score" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* 詳細テーブル */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">詳細統計</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-2 px-4">馬名</th>
                  <th className="text-center py-2 px-4">◎</th>
                  <th className="text-center py-2 px-4">○</th>
                  <th className="text-center py-2 px-4">△</th>
                  <th className="text-center py-2 px-4">消</th>
                  <th className="text-center py-2 px-4">総投票数</th>
                  <th className="text-center py-2 px-4">人気度スコア</th>
                </tr>
              </thead>
              <tbody>
                {popularityStats?.statistics.map((horse: any) => (
                  <tr key={horse.horseId} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-4">{horse.horseName}</td>
                    <td className="text-center py-2 px-4 text-red-500 font-semibold">
                      {horse.excellentCount}
                    </td>
                    <td className="text-center py-2 px-4 text-orange-500 font-semibold">
                      {horse.goodCount}
                    </td>
                    <td className="text-center py-2 px-4 text-yellow-500 font-semibold">
                      {horse.fairCount}
                    </td>
                    <td className="text-center py-2 px-4 text-gray-500 font-semibold">
                      {horse.eliminatedCount}
                    </td>
                    <td className="text-center py-2 px-4">{horse.totalVotes}</td>
                    <td className="text-center py-2 px-4 font-bold">
                      {horse.popularityScore.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
