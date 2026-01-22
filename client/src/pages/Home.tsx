import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";

export default function Home() {
  let { user, isAuthenticated, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <main className="p-6">
        <h1 className="text-4xl font-bold mb-6">セリ市ビューワー</h1>
        <p className="mb-6 text-lg">競走馬のセリ市を効率的に関査できるツールです。</p>

        {isAuthenticated ? (
          <div>
            <p className="mb-4">こんにちは、{user?.name}さん</p>
            <Link href="/horses">
              <Button size="lg" className="mr-4">
                馬一覧を詳細でいてみる
              </Button>
            </Link>
            <Button variant="outline" onClick={logout}>
              ログアウト
            </Button>
          </div>
        ) : (
          <Button
            size="lg"
            onClick={() => (window.location.href = getLoginUrl())}
          >
            ログイン
          </Button>
        )}
      </main>
    </div>
  );
}
