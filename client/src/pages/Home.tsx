import { useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Header } from "@/components/Header";

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch all sales info
  const { data: sales, isLoading } = trpc.sales.getAll.useQuery();

  const displaySales = useMemo(() => {
    if (!sales) return [];
    return sales.filter((s: any) => s.status !== 'hidden');
  }, [sales]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      {/* ヒーローセクション */}
      <div 
        className="relative overflow-hidden bg-cover bg-center bg-no-repeat py-12 sm:py-16"
        style={{ 
          backgroundImage: "url('/images/hero-horse-auction.jpg')",
          backgroundAttachment: 'fixed',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-slate-900 opacity-70" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <h2 className="text-5xl font-black tracking-tight text-white sm:text-6xl mb-6">
            さぁ、馬を見よう
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300 font-medium">
            血統から測尺、馬体写真、JBISリンクまで。精査に必要なデータを1ページにまとめました。<br />
            無駄な情報収集の時間を終わらせ、純粋な馬選びに没頭できるビューワーです。
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            {isAuthenticated ? (
              <Button
                size="lg"
                onClick={() => setLocation('/horses')}
                className="bg-blue-600 hover:bg-blue-500 text-white text-lg font-bold px-8 py-6 rounded-2xl shadow-2xl shadow-blue-500/20 transition-all hover:scale-105"
              >
                上場馬一覧を見る
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={() => setLocation('/login')}
                className="bg-blue-600 hover:bg-blue-500 text-white text-lg font-bold px-8 py-6 rounded-2xl shadow-2xl shadow-blue-500/20 transition-all hover:scale-105"
              >
                会員登録/ログイン
              </Button>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-6 py-16">
        {/* 開催中のセリ市 */}
        <div className="mb-24">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-black text-slate-800 mb-4">開催中のセリ市</h3>
          </div>

          {isLoading ? (
            <Card className="p-12 h-64 animate-pulse bg-slate-100 border-none" />
          ) : displaySales && displaySales.length > 0 ? (
            <div className="space-y-8">
              {displaySales.map((sale: any) => (
                <Card key={sale.id} className="p-12 border-none shadow-2xl shadow-slate-200/50 hover:shadow-3xl transition-all group overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-32 -mt-32 transition-transform group-hover:scale-150" />
                  <div className="relative text-center">
                    <div className="text-sm font-black text-blue-600 uppercase tracking-widest mb-4">
                      {sale.saleDate ? new Date(sale.saleDate).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' }) : '日付未定'}
                    </div>
                    <h4 className="text-3xl font-bold text-slate-800 mb-6 group-hover:text-blue-700 transition-colors">
                      {sale.saleName}
                    </h4>
                    <div className="flex justify-center gap-4 mb-8">
                      <span className="px-4 py-2 bg-slate-100 rounded-full text-sm font-bold text-slate-500 uppercase">
                        Location: {sale.location || 'HBA'}
                      </span>
                      {sale.status === 'draft' && (
                        <span className="px-4 py-2 bg-amber-100 border border-amber-200 rounded-full text-sm font-black text-amber-700">
                          PREVIEW
                        </span>
                      )}
                    </div>
                    <Link href={`/horses?saleId=${sale.id}`}>
                      <Button className="bg-blue-600 hover:bg-blue-500 text-white text-lg font-bold px-12 py-4 rounded-2xl shadow-xl shadow-blue-500/20 transition-all hover:scale-105">
                        このセリの馬を見る
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-16 text-center bg-white border-dashed border-2 border-slate-200 shadow-none">
              <p className="text-slate-400 font-bold italic text-lg">現在開催中のセリ市はありません</p>
            </Card>
          )}
        </div>

        {/* 機能紹介 */}
        <div className="bg-slate-50 -mx-6 px-6 py-24">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h3 className="text-3xl font-black text-slate-800 mb-4">機能紹介</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: "スマート検索", desc: "上場番号や父馬名、測尺データでの絞り込みが可能。人気順でのソートも。", icon: "⚡" },
                { title: "ビジュアル確認", desc: "馬体画像と5代血統PDFを同一画面で確認。スピーディな分析を実現。", icon: "🖼️" },
                { title: "自分だけのメモ", desc: "気になった馬に評価（◎○△）とメモを残して、あなただけの検討リストを。", icon: "📝" },
              ].map((feature, i) => (
                <div key={i} className="p-8 rounded-3xl bg-white shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all">
                  <div className="text-5xl mb-6 text-center">{feature.icon}</div>
                  <h4 className="text-xl font-bold text-slate-800 mb-4 text-center">{feature.title}</h4>
                  <p className="text-slate-500 text-sm leading-relaxed font-medium text-center">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
