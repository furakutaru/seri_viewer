import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch all sales info
  const { data: sales, isLoading } = trpc.sales.getAll.useQuery();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ナビゲーションバー */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white text-2xl animate-pulse">
              🐴
            </div>
            <h1 className="text-xl font-black text-slate-800 tracking-tighter">
              SERI市<span className="text-blue-600">VIEWER</span>
            </h1>
          </div>
          <div className="flex items-center gap-6">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => setLocation('/my-page')}
                  variant="ghost"
                  className="text-indigo-600 hover:bg-indigo-50 font-bold"
                >
                  My Page
                </Button>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Signed in as</span>
                    <span className="text-sm font-bold text-slate-700">{user.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={logout}
                    className="text-slate-500 hover:text-red-600 hover:bg-red-50 font-bold"
                  >
                    Logout
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => setLocation('/login')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                Login
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* ヒーローセクション */}
      <div className="relative overflow-hidden bg-slate-900 py-24 sm:py-32">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534447677768-be436bb09401?ixlib=rb-4.0.3&auto=format&fit=crop&w=2694&q=80')] opacity-20 bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40" />

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <h2 className="text-5xl font-black tracking-tight text-white sm:text-7xl mb-6">
            競走馬セリ市を、<br /><span className="text-blue-500">もっとスマートに。</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300 font-medium">
            HBA公式セリ市のカタログ、画像、血統PDF、測尺データを一元管理。<br />
            あなたの馬選びを強力にサポートする高機能ビューワー。
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button
              size="lg"
              onClick={() => setLocation('/horses')}
              className="bg-blue-600 hover:bg-blue-500 text-white text-lg font-bold px-8 py-6 rounded-2xl shadow-2xl shadow-blue-500/20 transition-all hover:scale-105"
            >
              上場馬一覧を見る
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* 左側: セリ情報一覧 */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                <span className="w-2 h-8 bg-blue-600 rounded-full inline-block" />
                開催中のセリ市
              </h3>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2].map(i => (
                  <Card key={i} className="p-6 h-48 animate-pulse bg-slate-100 border-none" />
                ))}
              </div>
            ) : sales && sales.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sales.map((sale: any) => (
                  <Card key={sale.id} className="p-6 border-none shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150" />
                    <div className="relative">
                      <div className="text-xs font-black text-blue-600 uppercase tracking-widest mb-2">
                        {sale.saleDate ? new Date(sale.saleDate).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' }) : '日付未定'}
                      </div>
                      <h4 className="text-xl font-bold text-slate-800 mb-4 group-hover:text-blue-700 transition-colors">
                        {sale.saleName}
                      </h4>
                      <div className="flex flex-wrap gap-2 mb-6">
                        <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500 uppercase">
                          Location: {sale.location || 'HBA'}
                        </span>
                      </div>
                      <Link href={`/horses?saleId=${sale.id}`}>
                        <Button className="w-full bg-slate-900 hover:bg-blue-600 text-white font-bold transition-all">
                          このセリの馬を見る
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center bg-white border-dashed border-2 border-slate-200 shadow-none">
                <p className="text-slate-400 font-bold italic">現在開催中のセリ市はありません</p>
              </Card>
            )}
          </div>

          {/* 右側: ツール/管理 */}
          <div className="space-y-8">
            <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <span className="w-2 h-8 bg-indigo-600 rounded-full inline-block" />
              クイックメニュー
            </h3>

            <div className="space-y-4">
              <Card
                className="p-6 border-none shadow-lg shadow-slate-200/50 hover:translate-x-1 transition-transform cursor-pointer group"
                onClick={() => setLocation('/horses')}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    🔍
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">全上場馬から探す</div>
                    <div className="text-xs text-slate-400 font-medium">血統や詳細条件で検索</div>
                  </div>
                </div>
              </Card>

              <Card
                className="p-6 border-none shadow-lg shadow-slate-200/50 hover:translate-x-1 transition-transform cursor-pointer group bg-blue-50/30"
                onClick={() => setLocation('/my-page')}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    ⭐
                  </div>
                  <div>
                    <div className="font-bold text-indigo-900">マイページ</div>
                    <div className="text-xs text-indigo-400 font-medium tracking-tight">評価した馬・除外馬の管理</div>
                  </div>
                </div>
              </Card>

              {user?.role === 'admin' && (
                <Card
                  className="p-6 border-none shadow-lg shadow-slate-200/50 hover:translate-x-1 transition-transform cursor-pointer group bg-indigo-50/50"
                  onClick={() => setLocation('/admin/import')}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-sm">
                      📥
                    </div>
                    <div>
                      <div className="font-bold text-indigo-900">データ取り込み</div>
                      <div className="text-xs text-indigo-400 font-medium tracking-tight">カタログURLから自動インポート</div>
                    </div>
                  </div>
                </Card>
              )}

              <Card className="p-8 bg-gradient-to-br from-slate-800 to-slate-900 border-none shadow-2xl text-white">
                <h4 className="font-bold mb-4 flex items-center gap-2">
                  <span className="text-blue-400">●</span> 配信状況
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400 font-bold">カタログ解析</span>
                    <span className="text-green-400 font-black">ONLINE</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400 font-bold">画像サーバー</span>
                    <span className="text-green-400 font-black">ONLINE</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400 font-bold">PDF抽出</span>
                    <span className="text-green-400 font-black">ONLINE</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* 機能紹介 */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: "スマート検索", desc: "上場番号や父馬名、測尺データでの絞り込みが可能。人気順でのソートも。 ", icon: "⚡" },
            { title: "ビジュアル確認", desc: "馬体画像と5代血統PDFを同一画面で確認。スピーディな分析を実現。", icon: "🖼️" },
            { title: "自分だけのメモ", desc: "気になった馬に評価（◎○△）とメモを残して、あなただけの検討リストを。", icon: "📝" },
          ].map((feature, i) => (
            <div key={i} className="p-8 rounded-3xl bg-white shadow-xl shadow-slate-200/50">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h4 className="text-xl font-bold text-slate-800 mb-2">{feature.title}</h4>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
