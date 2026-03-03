import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { isAdmin } = useAdmin();

  // Fetch data
  const { data: sales, isLoading: salesLoading } = trpc.sales.getAll.useQuery();
  // const { data: stats, isLoading: statsLoading } = trpc.horses.getPopularityStats.useQuery();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
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
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setLocation('/horses')}
              variant="ghost"
              className="text-slate-600 hover:bg-slate-50 font-bold"
            >
              上場馬一覧
            </Button>
            <Button
              onClick={() => setLocation('/my-page')}
              variant="ghost"
              className="text-indigo-600 hover:bg-indigo-50 font-bold"
            >
              マイページ
            </Button>
            {isAdmin && (
              <Button
                onClick={() => setLocation('/admin/import')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              >
                管理者メニュー
              </Button>
            )}
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Signed in as</span>
                <span className="text-sm font-bold text-slate-700">{user?.name}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Logout logic
                  window.location.href = '/api/auth/logout';
                }}
                className="text-slate-500 hover:text-red-600 hover:bg-red-50 font-bold"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-2">
              ようこそ、{user?.name}さん！
            </h2>
            <p className="text-blue-100">
              SERI市VIEWERへようこそいただきました。馬選びをサポートします。
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Current Sales */}
          <div className="lg:col-span-2">
            <Card className="p-6 h-full">
              <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-2 h-8 bg-blue-600 rounded-full inline-block"></span>
                開催中のセリ市
              </h3>
              
              {salesLoading ? (
                <div className="space-y-4">
                  {[1, 2].map(i => (
                    <div key={i} className="p-4 bg-slate-50 rounded-lg animate-pulse">
                      <div className="h-4 bg-slate-200 rounded mb-2"></div>
                      <div className="h-3 bg-slate-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : sales && sales.length > 0 ? (
                <div className="space-y-4">
                  {sales.map((sale: any) => (
                    <div key={sale.id} className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="text-sm font-black text-blue-600 uppercase tracking-widest mb-1">
                            {sale.saleDate ? new Date(sale.saleDate).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' }) : '日付未定'}
                          </div>
                          <h4 className="text-lg font-bold text-slate-800">
                            {sale.saleName}
                          </h4>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {sale.location || 'HBA'}
                        </Badge>
                      </div>
                      <Button
                        onClick={() => setLocation(`/horses?saleId=${sale.id}`)}
                        className="w-full bg-slate-900 hover:bg-blue-600 text-white font-bold transition-colors"
                      >
                        このセリの馬を見る
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-slate-400 font-bold italic">
                    現在開催中のセリ市はありません
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">クイックアクション</h3>
              <div className="space-y-3">
                <Button
                  onClick={() => setLocation('/horses')}
                  variant="outline"
                  className="w-full"
                >
                  🔍 全上場馬から探す
                </Button>
                <Button
                  onClick={() => setLocation('/my-page')}
                  variant="outline"
                  className="w-full"
                >
                  ⭐ マイページ
                </Button>
                {isAdmin && (
                  <Button
                    onClick={() => setLocation('/admin/import')}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    📥 管理者メニュー
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
