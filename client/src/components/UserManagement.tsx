import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { ChevronLeft, ChevronRight, Users, Calendar, MessageSquare, X, Crown } from 'lucide-react';

interface UserManagementProps {
  className?: string;
}

export function UserManagement({ className }: UserManagementProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 20;

  const { data: users, isLoading, error } = trpc.admin.users.useQuery({
    offset: currentPage * pageSize,
    limit: pageSize,
  });

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (users && users.length === pageSize) {
      setCurrentPage(currentPage + 1);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (error) {
    return (
      <Card className="p-6 text-center">
        <p className="text-red-600">エラーが発生しました: {error.message}</p>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 text-white p-2 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">ユーザー管理</h2>
            <p className="text-sm text-slate-600">登録ユーザーの一覧と利用状況</p>
          </div>
        </div>
      </div>

      {/* テーブル */}
      <Card className="border-none shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left p-4 font-bold text-slate-700 text-sm uppercase tracking-wider">
                  ユーザー情報
                </th>
                <th className="text-left p-4 font-bold text-slate-700 text-sm uppercase tracking-wider">
                  登録日
                </th>
                <th className="text-left p-4 font-bold text-slate-700 text-sm uppercase tracking-wider">
                  最終ログイン
                </th>
                <th className="text-center p-4 font-bold text-slate-700 text-sm uppercase tracking-wider">
                  メモ数
                </th>
                <th className="text-center p-4 font-bold text-slate-700 text-sm uppercase tracking-wider">
                  除外数
                </th>
                <th className="text-center p-4 font-bold text-slate-700 text-sm uppercase tracking-wider">
                  役割
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                // スケルトンローディング
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="border-b border-slate-100">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-200 rounded-full animate-pulse" />
                        <div className="space-y-1">
                          <div className="h-4 bg-slate-200 rounded w-32 animate-pulse" />
                          <div className="h-3 bg-slate-100 rounded w-24 animate-pulse" />
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="h-4 bg-slate-200 rounded w-24 animate-pulse" />
                    </td>
                    <td className="p-4">
                      <div className="h-4 bg-slate-200 rounded w-24 animate-pulse" />
                    </td>
                    <td className="p-4 text-center">
                      <div className="h-4 bg-slate-200 rounded w-8 mx-auto animate-pulse" />
                    </td>
                    <td className="p-4 text-center">
                      <div className="h-4 bg-slate-200 rounded w-8 mx-auto animate-pulse" />
                    </td>
                    <td className="p-4 text-center">
                      <div className="h-6 bg-slate-200 rounded w-16 mx-auto animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : users && users.length > 0 ? (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">
                            {user.name || '不明なユーザー'}
                          </div>
                          <div className="text-sm text-slate-500">
                            {user.email || 'メールアドレスなし'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="w-4 h-4" />
                        {formatDate(user.createdAt)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="w-4 h-4" />
                        {formatDate(user.lastSignedIn)}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <MessageSquare className="w-4 h-4 text-blue-500" />
                        <span className="font-semibold text-blue-600">{user.memoCount}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <X className="w-4 h-4 text-red-500" />
                        <span className="font-semibold text-red-600">{user.eliminatedCount}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <Badge 
                        className={`${
                          user.role === 'admin' 
                            ? 'bg-purple-100 text-purple-700 border-purple-200' 
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        } font-bold`}
                      >
                        {user.role === 'admin' ? (
                          <div className="flex items-center gap-1">
                            <Crown className="w-3 h-3" />
                            管理者
                          </div>
                        ) : (
                          '一般'
                        )}
                      </Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    ユーザーが見つかりません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ページネーション */}
        {!isLoading && users && users.length > 0 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-200">
            <div className="text-sm text-slate-600">
              {currentPage * pageSize + 1} - {currentPage * pageSize + users.length} 件目
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={currentPage === 0}
                className="gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                前へ
              </Button>
              <div className="flex items-center gap-1 px-3">
                <span className="font-semibold text-indigo-600">{currentPage + 1}</span>
                <span className="text-slate-400">ページ</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={users.length < pageSize}
                className="gap-1"
              >
                次へ
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* 統計情報 */}
      {!isLoading && users && users.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-900">{users.length}</div>
                <div className="text-sm text-blue-700">表示中のユーザー</div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center gap-3">
              <div className="bg-green-600 text-white p-2 rounded-lg">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-900">
                  {users.reduce((sum, user) => sum + user.memoCount, 0)}
                </div>
                <div className="text-sm text-green-700">総メモ数</div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <div className="flex items-center gap-3">
              <div className="bg-red-600 text-white p-2 rounded-lg">
                <X className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-red-900">
                  {users.reduce((sum, user) => sum + user.eliminatedCount, 0)}
                </div>
                <div className="text-sm text-red-700">総除外数</div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
