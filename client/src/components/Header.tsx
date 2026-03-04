import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export function Header() {
    const { user, isAuthenticated, logout } = useAuth();
    const [, setLocation] = useLocation();

    return (
        <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => setLocation('/')}
                >
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
                                onClick={() => setLocation('/horses')}
                                variant="ghost"
                                className="text-slate-600 hover:bg-slate-50 font-bold"
                            >
                                上場馬一覧
                            </Button>
                            <Button
                                onClick={() => setLocation('/my-page')}
                                variant="ghost"
                                className="text-slate-600 hover:bg-slate-50 font-bold"
                            >
                                My Page
                            </Button>
                            {user?.role === 'admin' && (
                                <Button
                                    onClick={() => setLocation('/admin/import')}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                                >
                                    ⚙️ 管理メニュー
                                </Button>
                            )}
                            <div className="flex items-center gap-4 ml-2">
                                <div className="flex flex-col items-end">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Signed in as</span>
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
    );
}
