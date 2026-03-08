import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

export function Header() {
    const { user, isAuthenticated, logout } = useAuth();
    const [, setLocation] = useLocation();
    const [isOpen, setIsOpen] = useState(false);

    const handleNavigation = (path: string) => {
        setLocation(path);
        setIsOpen(false);
    };

    const handleLogout = () => {
        logout();
        setIsOpen(false);
    };

    return (
        <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => handleNavigation('/')}
                >
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white text-2xl animate-pulse">
                        🐴
                    </div>
                    <h1 className="text-xl font-black text-slate-800 tracking-tighter">
                        SERI市<span className="text-blue-600">VIEWER</span>
                    </h1>
                </div>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-6">
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

                {/* Mobile Navigation */}
                <div className="md:hidden">
                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-slate-600 hover:bg-slate-50"
                            >
                                <Menu className="h-6 w-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-80">
                            <div className="flex flex-col h-full">
                                {/* User info at top */}
                                {isAuthenticated && user && (
                                    <div className="border-b border-slate-200 pb-4 mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white text-xl">
                                                🐴
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Signed in as</p>
                                                <p className="text-lg font-bold text-slate-800">{user.name}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Navigation items */}
                                <div className="flex-1 space-y-2">
                                    {isAuthenticated && user ? (
                                        <>
                                            <Button
                                                onClick={() => handleNavigation('/horses')}
                                                variant="ghost"
                                                className="w-full justify-start text-slate-600 hover:bg-slate-50 font-bold"
                                            >
                                                上場馬一覧
                                            </Button>
                                            <Button
                                                onClick={() => handleNavigation('/my-page')}
                                                variant="ghost"
                                                className="w-full justify-start text-slate-600 hover:bg-slate-50 font-bold"
                                            >
                                                My Page
                                            </Button>
                                            {user?.role === 'admin' && (
                                                <Button
                                                    onClick={() => handleNavigation('/admin/import')}
                                                    className="w-full justify-start bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                                                >
                                                    ⚙️ 管理メニュー
                                                </Button>
                                            )}
                                        </>
                                    ) : (
                                        <Button
                                            onClick={() => handleNavigation('/login')}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
                                        >
                                            Login
                                        </Button>
                                    )}
                                </div>

                                {/* Logout at bottom */}
                                {isAuthenticated && user && (
                                    <div className="border-t border-slate-200 pt-4 mt-4">
                                        <Button
                                            onClick={handleLogout}
                                            variant="ghost"
                                            className="w-full justify-start text-slate-500 hover:text-red-600 hover:bg-red-50 font-bold"
                                        >
                                            Logout
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </nav>
    );
}
