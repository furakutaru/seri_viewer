import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";

export default function Home() {
  const { user, loading, error, isAuthenticated, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* ナビゲーションバー */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">セリ市ビューワー</h1>
          <div className="flex items-center gap-4">
            {isAuthenticated && user && (
              <>
                <span className="text-sm text-gray-600">{user.name}</span>
                <Button variant="outline" onClick={logout}>
                  ログアウト
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            競走馬セリ市データビューワー
          </h2>
          <p className="text-xl text-gray-600">
            HBA公式セリ市のカタログと測尺データを一元管理
          </p>
        </div>

        {/* メニューカード */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 管理メニュー */}
          <Card className="p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex flex-col items-center text-center">
              <div className="text-4xl mb-4">⚙️</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">管理者メニュー</h3>
              <p className="text-gray-600 mb-6">
                データ取り込みと管理機能
              </p>
              <Link href="/admin/import">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  データを取り込む
                </Button>
              </Link>
            </div>
          </Card>

          {/* 馬一覧 */}
          <Card className="p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex flex-col items-center text-center">
              <div className="text-4xl mb-4">🐴</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">馬一覧を表示</h3>
              <p className="text-gray-600 mb-6">
                登録されている馬の一覧を確認
              </p>
              <Button variant="outline" className="w-full" disabled>
                馬一覧を詳細でいてみる
              </Button>
            </div>
          </Card>
        </div>

        {/* 情報セクション */}
        <div className="mt-12 bg-white rounded-lg shadow p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">このアプリについて</h3>
          <div className="space-y-4 text-gray-700">
            <p>
              セリ市ビューワーは、HBA公式セリ市のカタログと測尺データを効率的に管理・閲覧するためのツールです。
            </p>
            <p>
              Webカタログと測尺PDFを自動的にキャッシュするため、スクレイピング先への負荷を最小限に抑えます。
            </p>
            <p>
              <strong>主な機能:</strong>
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Webカタログの自動解析</li>
              <li>PDF測尺データの自動抽出</li>
              <li>データの統合管理</li>
              <li>キャッシュによる効率化</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
