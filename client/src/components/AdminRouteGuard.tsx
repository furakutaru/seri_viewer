import { ReactNode } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useLocation, useRoute } from 'wouter';

interface AdminRouteGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * 管理者専用ルートを保護するコンポーネント
 */
export const AdminRouteGuard = ({ children, fallback }: AdminRouteGuardProps) => {
  const { isAdmin, isLoading, isAuthenticated } = useAdmin();
  const [, setLocation] = useLocation();
  const [isLoginPage] = useRoute('/login');

  // ローディング中
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">認証中...</p>
        </div>
      </div>
    );
  }

  // 未認証の場合
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 max-w-md">
          <Alert className="mb-6">
            <AlertDescription>
              このページにアクセスするにはログインが必要です。
            </AlertDescription>
          </Alert>
          <Button onClick={() => setLocation('/login')} className="w-full">
            ログインページへ
          </Button>
        </div>
      </div>
    );
  }

  // 管理者権限がない場合
  if (!isAdmin) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 max-w-md">
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              このページにアクセスする権限がありません。
              管理者のみが利用できる機能です。
            </AlertDescription>
          </Alert>
          <Button onClick={() => setLocation('/')} variant="outline" className="w-full">
            トップページへ戻る
          </Button>
        </div>
      </div>
    );
  }

  // 管理者権限がある場合
  return <>{children}</>;
};
