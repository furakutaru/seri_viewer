import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { LogIn } from "lucide-react";

export default function Login() {
  const handleLogin = () => {
    const loginUrl = getLoginUrl();
    console.log("OAuth Login URL:", loginUrl);
    
    // 開発環境ではモックOAuthに直接リダイレクト
    window.location.href = loginUrl;
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
        <div className="flex flex-col items-center gap-6">
          <h1 className="text-2xl font-semibold tracking-tight text-center">
            ログイン
          </h1>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            アカウントにアクセスしてください。続行してログインフローを起動します。
          </p>
          <p className="text-xs text-muted-foreground text-center">
            開発環境：モックOAuth認証を使用します
          </p>
        </div>
        <Button
          onClick={handleLogin}
          size="lg"
          className="w-full shadow-lg hover:shadow-xl transition-all"
        >
          <LogIn className="mr-2 h-4 w-4" />
          ログイン
        </Button>
      </div>
    </div>
  );
}
