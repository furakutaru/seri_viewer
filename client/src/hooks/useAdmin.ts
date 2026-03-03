import { useAuth } from "@/_core/hooks/useAuth";

/**
 * 管理者権限をチェックするカスタムフック
 */
export const useAdmin = () => {
  const { user, isAuthenticated, loading } = useAuth();

  return {
    isAdmin: user?.role === 'admin',
    canAccessAdmin: user?.role === 'admin',
    userName: user?.name || '',
    userEmail: user?.email || '',
    isLoading: loading,
    isAuthenticated,
  };
};

/**
 * 管理者権限をチェックするヘルパー関数
 */
export const checkAdminAccess = (user: any): boolean => {
  return user?.role === 'admin';
};
