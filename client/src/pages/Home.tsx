import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">セリ市ビューワー</h1>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-gray-600">{user?.name}</span>
                <Button variant="outline" onClick={logout}>
                  ログアウト
                </Button>
              </>
            ) : (
              <Button onClick={() => window.location.href = getLoginUrl()}>
                ログイン
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {isAuthenticated ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Admin Panel */}
            {user?.role === 'admin' && (
              <Card className="border-2 border-blue-200">
                <CardHeader>
                  <CardTitle>管理者メニュー</CardTitle>
                  <CardDescription>
                    データ取り込みと管理機能
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/admin/import">
                    <Button className="w-full">
                      データを取り込む
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* View Horses */}
            <Card>
              <CardHeader>
                <CardTitle>馬一覧を表示</CardTitle>
                <CardDescription>
                  登録されている馬の一覧を確認
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/horses">
                  <Button className="w-full">
                    馬一覧を詳細で見てみる
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>ようこそ</CardTitle>
              <CardDescription>
                セリ市ビューワーを使用するにはログインしてください
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => window.location.href = getLoginUrl()}
              >
                ログイン
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
