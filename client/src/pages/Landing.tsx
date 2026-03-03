import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/_core/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';

export default function Landing() {
  const [, setLocation] = useLocation();
  const [isLoginPage] = useRoute('/login');
  const { isAuthenticated, user } = useAuth();
  const { isAdmin } = useAdmin();
  const [isScrolled, setIsScrolled] = useState(false);

  // スクロール位置を監視してヘッダーの背景色を変更
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation Header */}
      <nav className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-md border-slate-200' 
          : 'bg-white/10 backdrop-blur-md border-white/10'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-2xl animate-pulse transition-colors ${
              isScrolled ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'
            }`}>
              🐴
            </div>
            <h1 className={`text-xl font-black tracking-tighter transition-colors ${
              isScrolled ? 'text-slate-800' : 'text-white'
            }`}>
              SERI市<span className={isScrolled ? 'text-blue-600' : 'text-blue-400'}>VIEWER</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Button
                  onClick={() => setLocation('/horses')}
                  variant="ghost"
                  className={`font-bold transition-colors ${
                    isScrolled 
                      ? 'text-slate-600 hover:bg-slate-50' 
                      : 'text-white hover:bg-white/20'
                  }`}
                >
                  上場馬一覧
                </Button>
                <Button
                  onClick={() => setLocation('/my-page')}
                  variant="ghost"
                  className={`font-bold transition-colors ${
                    isScrolled 
                      ? 'text-indigo-600 hover:bg-indigo-50' 
                      : 'text-blue-400 hover:bg-blue-400/20'
                  }`}
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
                    <span className={`text-xs font-bold uppercase tracking-widest transition-colors ${
                      isScrolled ? 'text-slate-400' : 'text-white/60'
                    }`}>Signed in as</span>
                    <span className={`text-sm font-bold transition-colors ${
                      isScrolled ? 'text-slate-700' : 'text-white'
                    }`}>{user?.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      window.location.href = '/api/auth/logout';
                    }}
                    className={`font-bold transition-colors ${
                      isScrolled 
                        ? 'text-slate-500 hover:text-red-600 hover:bg-red-50' 
                        : 'text-white/80 hover:text-red-400 hover:bg-red-400/20'
                    }`}
                  >
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <Button
                onClick={() => setLocation('/login')}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2 rounded-xl"
              >
                会員登録/ログイン
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534447677768-be436b0804?ixlib=rb-4.0.3&auto=format&fit=crop&w=2694&q=80')] opacity-20 bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-slate-900" />
        
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center">
            <h1 className="text-5xl font-black tracking-tight text-white sm:text-7xl mb-6">
              競走馬セリ市を、<br /><span className="text-blue-400">もっとスマートに。</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300 font-medium">
              HBA公式セリ市のカタログ、画像、血統PDF、測尺データを一元管理。<br />
              あなたの馬選びを強力にサポートする高機能ビューワー。
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
      </div>

      {/* Features Section */}
      <div className="relative bg-white py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-slate-900 mb-4">
              なぜSERI市VIEWERが選ばれるのか
            </h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              馬選びのプロフェッショナルのための機能を提供します
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: "🔍",
                title: "スマート検索",
                description: "上場番号や父馬名、測尺データでの絞り込みが可能。人気順でのソートも。",
                color: "blue"
              },
              {
                icon: "🖼️",
                title: "ビジュアル確認",
                description: "馬体画像と5代血統PDFを同一画面で確認。スピーディな分析を実現。",
                color: "green"
              },
              {
                icon: "📝",
                title: "自分だけのメモ",
                description: "気になった馬に評価（◎○△）とメモを残して、あなただけの検討リストを。",
                color: "purple"
              }
            ].map((feature, i) => (
              <div key={i} className="group">
                <div className="p-8 rounded-2xl bg-white shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all duration-300 border border-slate-100">
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
                    <span className={`inline-block p-3 rounded-xl bg-${feature.color}-50 group-hover:bg-${feature.color}-100 transition-colors`}>
                      {feature.icon}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-black text-slate-900 mb-4">
              さあ、あなたの理想の馬を見つけよう
            </h2>
            <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
              今すぐ登録して、次のセリ市で最適な馬選びを。
            </p>
            <Button
              size="lg"
              onClick={() => setLocation('/login')}
              className="bg-slate-900 hover:bg-slate-800 text-white text-lg font-bold px-12 py-6 rounded-2xl shadow-xl transition-all hover:scale-105"
            >
              無料で会員登録/ログイン
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
