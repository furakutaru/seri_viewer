import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { getAbsoluteUrl } from '@/lib/utils';
import { Trash2, Edit, Plus, CheckSquare, Square } from 'lucide-react';

export default function MyPage() {
    const [, setLocation] = useLocation();
    const { user, isAuthenticated, loading } = useAuth();
    const [activeTab, setActiveTab] = useState('evaluation');
    const [evalFilter, setEvalFilter] = useState<'ALL' | '◎' | '○' | '△'>('ALL');

    // Checklist states
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [newItem, setNewItem] = useState({
        itemName: '',
        itemType: 'boolean' as 'boolean' | 'numeric',
        score: 1,
        criteria: ''
    });
    const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);

    // Fetch all horses with user-specific info
    const { data: horses, isLoading, error, refetch } = trpc.horses.getAllWithStats.useQuery(undefined, {
        enabled: isAuthenticated
    });

    // Fetch sales for checklist selection
    const { data: sales } = trpc.sales.getAll.useQuery(undefined, {
        enabled: isAuthenticated
    });

    // Fetch checklist items
    const { data: checklistItems, refetch: refetchChecklist } = trpc.horses.checkListItems.getAll.useQuery(
        { saleId: selectedSaleId || undefined },
        { enabled: isAuthenticated }
    );

    // Checklist mutations
    const createItem = trpc.horses.checkListItems.create.useMutation({
        onSuccess: () => {
            refetchChecklist();
            setIsCreateDialogOpen(false);
            setNewItem({ itemName: '', itemType: 'boolean', score: 10, criteria: '' });
        }
    });

    const updateItem = trpc.horses.checkListItems.update.useMutation({
        onSuccess: () => {
            refetchChecklist();
            setEditingItem(null);
        }
    });

    const deleteItem = trpc.horses.checkListItems.delete.useMutation({
        onSuccess: () => {
            refetchChecklist();
        }
    });

    const saveCheck = trpc.horses.saveUserCheck.useMutation({
        onSuccess: () => refetch()
    });

    const evaluatedHorses = useMemo(() => {
        if (!horses) return [];
        let filtered = horses.filter((h: any) => h.userCheck?.evaluation && !h.userCheck?.isEliminated);
        if (evalFilter !== 'ALL') {
            filtered = filtered.filter((h: any) => h.userCheck?.evaluation === evalFilter);
        }
        return filtered;
    }, [horses, evalFilter]);

    const eliminatedHorses = useMemo(() => {
        if (!horses) return [];
        return horses.filter((h: any) => h.userCheck?.isEliminated);
    }, [horses]);

    const calculateChecklistScore = (horse: any) => {
        return horse.userCheck?.checklistScore || 0;
    };

    const handleRestore = async (horseId: number, evaluation: any, memo: string) => {
        await saveCheck.mutateAsync({
            horseId,
            evaluation,
            memo,
            isEliminated: false
        });
    };

    // Checklist handlers
    const handleCreateItem = () => {
        if (!selectedSaleId) return;
        
        createItem.mutate({
            saleId: selectedSaleId,
            itemName: newItem.itemName,
            itemType: newItem.itemType,
            score: newItem.score,
            criteria: newItem.criteria || null
        });
    };

    const handleUpdateItem = () => {
        if (!editingItem) return;
        
        updateItem.mutate({
            id: editingItem.id,
            itemName: editingItem.itemName,
            itemType: editingItem.itemType,
            score: editingItem.score,
            criteria: editingItem.criteria || null
        });
    };

    const handleDeleteItem = (itemId: number) => {
        if (confirm('本当に削除しますか？')) {
            deleteItem.mutate(itemId);
        }
    };

    const startEdit = (item: any) => {
        setEditingItem({ ...item });
    };

    const cancelEdit = () => {
        setEditingItem(null);
    };

    if (loading || isLoading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-500 font-bold">読み込み中...</p>
            </div>
        </div>
    );

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
                <div className="max-w-4xl mx-auto">
                    <Card className="p-8 text-center bg-white shadow-lg">
                        <p className="text-gray-600 mb-4 font-bold">ログインが必要です</p>
                        <Button onClick={() => setLocation('/')} className="bg-blue-600 hover:bg-blue-700">ホームへ戻る</Button>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <TooltipProvider>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
            <div className="max-w-7xl mx-auto">
                {/* ヘッダー */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">マイページ</h1>
                        <p className="text-gray-600">あなたの評価・検討状況を管理します</p>
                    </div>
                    <Button
                        onClick={() => setLocation('/horses')}
                        variant="outline"
                        className="text-gray-700 border-gray-300 hover:bg-gray-50 font-bold"
                    >
                        一覧に戻る
                    </Button>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="mb-8 grid grid-cols-4 w-full max-w-3xl mx-auto bg-white/50 backdrop-blur shadow-sm p-1 rounded-xl h-auto">
                        <TabsTrigger value="evaluation" className="font-bold py-3 rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600">評価リスト</TabsTrigger>
                        <TabsTrigger value="comparison" className="font-bold py-3 rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600">馬体比較ビュー</TabsTrigger>
                        <TabsTrigger value="checklist" className="font-bold py-3 rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600">チェックリスト管理</TabsTrigger>
                        <TabsTrigger value="eliminated" className="font-bold py-3 rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600">除外管理 ({eliminatedHorses.length})</TabsTrigger>
                    </TabsList>

                    {/* 絞り込みフィルター (評価リストと比較ビュー用) */}
                    {(activeTab === 'evaluation' || activeTab === 'comparison') && (
                        <div className="flex justify-center gap-2 mb-8">
                            {[
                                { id: 'ALL', label: 'すべて' },
                                { id: '◎', label: '◎のみ' },
                                { id: '○', label: '○のみ' },
                                { id: '△', label: '△のみ' },
                            ].map((f) => (
                                <Button
                                    key={f.id}
                                    variant={evalFilter === f.id ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setEvalFilter(f.id as any)}
                                    className={`font-bold rounded-full px-6 ${evalFilter === f.id ? "bg-blue-600" : "bg-white text-gray-600 border-gray-200"
                                        }`}
                                >
                                    {f.label}
                                </Button>
                            ))}
                        </div>
                    )}

                    {/* 評価リストビュー */}
                    <TabsContent value="evaluation">
                        {evaluatedHorses.length === 0 ? (
                            <Card className="p-12 text-center text-gray-500 bg-white/50 border-dashed border-2">評価した馬がまだありません</Card>
                        ) : (
                            <Card className="overflow-hidden shadow-xl border-none">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="px-6 py-4 font-bold text-gray-600 uppercase text-xs tracking-wider">No.</th>
                                                <th className="px-6 py-4 font-bold text-gray-600 uppercase text-xs tracking-wider">評価</th>
                                                <th className="px-6 py-4 font-bold text-gray-600 uppercase text-xs tracking-wider">性別/毛色</th>
                                                <th className="px-6 py-4 font-bold text-gray-600 uppercase text-xs tracking-wider">血統</th>
                                                <th className="px-6 py-4 font-bold text-gray-600 uppercase text-xs tracking-wider">チェック</th>
                                                <th className="px-6 py-4 font-bold text-gray-600 uppercase text-xs tracking-wider w-1/3">メモ</th>
                                                <th className="px-6 py-4 font-bold text-gray-600 uppercase text-xs tracking-wider text-right">詳細</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 bg-white">
                                            {evaluatedHorses.map((horse: any) => (
                                                <tr key={horse.id} className="hover:bg-blue-50/50 transition-colors">
                                                    <td className="px-6 py-4 font-black text-xl text-gray-900">{horse.lotNumber}</td>
                                                    <td className="px-6 py-4">
                                                        <Badge className={`text-sm font-black px-3 py-1 ${horse.userCheck?.evaluation === '◎' ? 'bg-green-100 text-green-700 border-green-200' :
                                                            horse.userCheck?.evaluation === '○' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                                'bg-amber-100 text-amber-700 border-amber-200'
                                                            }`}>
                                                            {horse.userCheck?.evaluation}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4 font-medium text-gray-700">{horse.sex} / {horse.color}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-blue-900">{horse.sireName}</div>
                                                        <div className="text-xs text-gray-500">× {horse.damName}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 font-bold cursor-help">
                                                                    {calculateChecklistScore(horse)}点
                                                                </Badge>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p className="text-sm">内訳は馬の詳細ページで確認できます</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm text-gray-600 italic bg-amber-50/50 p-2 rounded line-clamp-2">
                                                            {horse.userCheck?.memo || '-'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <Button size="sm" onClick={() => setLocation(`/horses/${horse.id}`)} className="bg-blue-600 hover:bg-blue-700 rounded-full font-bold">
                                                            表示
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        )}
                    </TabsContent>

                    {/* 比較ビュー (画像メイン) */}
                    <TabsContent value="comparison">
                        {evaluatedHorses.length === 0 ? (
                            <Card className="p-12 text-center text-gray-500 bg-white/50 border-dashed border-2">比較する馬がまだありません</Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {evaluatedHorses.map((horse: any) => (
                                    <Card key={horse.id} className="overflow-hidden shadow-lg hover:shadow-2xl transition-all bg-white flex flex-col group border-none" onClick={() => setLocation(`/horses/${horse.id}`)}>
                                        <div className="aspect-[4/3] relative bg-slate-100 overflow-hidden cursor-pointer">
                                            {horse.photoUrl ? (
                                                <img
                                                    src={getAbsoluteUrl(horse.photoUrl, horse.sale?.catalogUrl) || ''}
                                                    alt={`Lot ${horse.lotNumber}`}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold uppercase tracking-widest text-xs">No Horse Image</div>
                                            )}
                                            <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm text-white px-4 py-1.5 rounded-full font-black text-2xl shadow-lg border border-white/20">
                                                {horse.lotNumber}
                                            </div>
                                            <div className="absolute top-4 right-4">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xl shadow-xl border-2 ${horse.userCheck?.evaluation === '◎' ? 'bg-green-500 text-white border-green-200' :
                                                    horse.userCheck?.evaluation === '○' ? 'bg-blue-500 text-white border-blue-200' :
                                                        'bg-amber-500 text-white border-amber-200'
                                                    }`}>
                                                    {horse.userCheck?.evaluation}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-6 flex-1 flex flex-col bg-white">
                                            <div className="mb-4">
                                                <div className={`inline-block px-3 py-0.5 rounded-full text-xs font-black mb-2 shadow-sm ${horse.sex === '牡' ? 'bg-blue-100 text-blue-800' :
                                                    horse.sex === '牝' ? 'bg-pink-100 text-pink-800' :
                                                        'bg-green-100 text-green-800'
                                                    }`}>
                                                    {horse.sex} / {horse.color}
                                                </div>
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <h3 className="text-xl font-black text-blue-900 leading-tight group-hover:text-blue-600 transition-colors uppercase tracking-tight">{horse.sireName}</h3>
                                                        <p className="text-sm font-medium text-gray-500 mt-0.5 italic">× {horse.damName}</p>
                                                    </div>
                                                    <div className="ml-4">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <div className="cursor-help">
                                                                    <div className="text-[10px] text-purple-600 font-black uppercase tracking-widest mb-1 text-right">チェック</div>
                                                                    <div className="font-black text-lg text-purple-700 text-right min-w-[3rem]">{calculateChecklistScore(horse)}点</div>
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p className="text-sm">内訳は馬の詳細ページで確認できます</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-3 mb-4 bg-slate-50/80 p-4 rounded-xl text-center border border-slate-100">
                                                <div>
                                                    <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">体高</div>
                                                    <div className="font-black text-base text-blue-700">{horse.height || '-'}</div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">胸囲</div>
                                                    <div className="font-black text-base text-green-700">{horse.girth || '-'}</div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">管囲</div>
                                                    <div className="font-black text-base text-purple-700">{horse.cannon || '-'}</div>
                                                </div>
                                            </div>

                                            {horse.userCheck?.memo && (
                                                <div className="mt-auto bg-amber-50/50 p-4 rounded-xl border border-amber-100 italic text-sm text-amber-900 line-clamp-3 leading-relaxed relative overflow-hidden">
                                                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-200"></div>
                                                    "{horse.userCheck.memo}"
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* 除外管理ビュー */}
                    <TabsContent value="eliminated">
                        {eliminatedHorses.length === 0 ? (
                            <Card className="p-12 text-center text-gray-500 bg-white/50 border-dashed border-2">除外した馬はありません</Card>
                        ) : (
                            <Card className="overflow-hidden shadow-xl border-none">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="px-6 py-4 font-bold text-gray-600 uppercase text-xs tracking-wider">No.</th>
                                                <th className="px-6 py-4 font-bold text-gray-600 uppercase text-xs tracking-wider">性別/毛色</th>
                                                <th className="px-6 py-4 font-bold text-gray-600 uppercase text-xs tracking-wider">血統</th>
                                                <th className="px-6 py-4 font-bold text-gray-600 uppercase text-xs tracking-wider text-right">アクション</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 bg-white">
                                            {eliminatedHorses.map((horse: any) => (
                                                <tr key={horse.id} className="opacity-60 hover:opacity-100 transition-opacity">
                                                    <td className="px-6 py-4 font-black text-xl text-gray-400">{horse.lotNumber}</td>
                                                    <td className="px-6 py-4 font-medium text-gray-500">{horse.sex} / {horse.color}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-gray-500">{horse.sireName}</div>
                                                        <div className="text-xs text-gray-400">× {horse.damName}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            onClick={() => setLocation(`/horses/${horse.id}`)}
                                                            className="bg-blue-600 hover:bg-blue-700 rounded-full font-bold"
                                                        >
                                                            表示
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRestore(horse.id, horse.userCheck?.evaluation, horse.userCheck?.memo || '');
                                                            }}
                                                            className="text-blue-600 border-blue-200 hover:bg-blue-50 font-bold rounded-full"
                                                        >
                                                            検討リストに戻す
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        )}
                    </TabsContent>

                    {/* チェックリスト管理ビュー */}
                    <TabsContent value="checklist">
                        <div className="space-y-6">
                            {/* セリ選択と作成ボタン */}
                            <Card className="p-6 bg-white/50 backdrop-blur">
                                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                                    <div className="flex-1 max-w-md">
                                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">セリ選択</Label>
                                        <Select value={selectedSaleId?.toString()} onValueChange={(value) => setSelectedSaleId(value ? parseInt(value) : null)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="セリを選択してください" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {sales?.map((sale: any) => (
                                                    <SelectItem key={sale.id} value={sale.id.toString()}>
                                                        {sale.saleName}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button 
                                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                                                disabled={!selectedSaleId}
                                            >
                                                <Plus className="w-4 h-4 mr-2" />
                                                チェック項目を追加
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-md">
                                            <DialogHeader>
                                                <DialogTitle>新しいチェック項目</DialogTitle>
                                            </DialogHeader>
                                            <div className="space-y-4">
                                                <div>
                                                    <Label htmlFor="itemName">項目名</Label>
                                                    <Input
                                                        id="itemName"
                                                        value={newItem.itemName}
                                                        onChange={(e) => setNewItem({ ...newItem, itemName: e.target.value })}
                                                        placeholder="例：胸囲170以上"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="itemType">項目タイプ</Label>
                                                    <Select value={newItem.itemType} onValueChange={(value: 'boolean' | 'numeric') => setNewItem({ ...newItem, itemType: value })}>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="boolean">チェックボックス</SelectItem>
                                                            <SelectItem value="numeric">数値評価</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <Label htmlFor="score">スコア ({newItem.itemType === 'boolean' ? 'チェック時のスコア' : '最大スコア'})</Label>
                                                    <Input
                                                        id="score"
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        value={newItem.score}
                                                        onChange={(e) => setNewItem({ ...newItem, score: parseInt(e.target.value) || 0 })}
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button 
                                                        onClick={handleCreateItem}
                                                        disabled={!newItem.itemName || !selectedSaleId}
                                                        className="flex-1"
                                                    >
                                                        作成
                                                    </Button>
                                                    <Button 
                                                        variant="outline" 
                                                        onClick={() => setIsCreateDialogOpen(false)}
                                                        className="flex-1"
                                                    >
                                                        キャンセル
                                                    </Button>
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </Card>

                            {/* チェックリスト項目一覧 */}
                            {!selectedSaleId ? (
                                <Card className="p-12 text-center text-gray-500 bg-white/50 border-dashed border-2">
                                    セリを選択してください
                                </Card>
                            ) : !checklistItems || checklistItems.length === 0 ? (
                                <Card className="p-12 text-center text-gray-500 bg-white/50 border-dashed border-2">
                                    チェックリスト項目がありません
                                </Card>
                            ) : (
                                <Card className="overflow-hidden shadow-xl border-none">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-gray-50 border-b border-gray-200">
                                                <tr>
                                                    <th className="px-6 py-4 font-bold text-gray-600 uppercase text-xs tracking-wider">項目名</th>
                                                    <th className="px-6 py-4 font-bold text-gray-600 uppercase text-xs tracking-wider">タイプ</th>
                                                    <th className="px-6 py-4 font-bold text-gray-600 uppercase text-xs tracking-wider">スコア</th>
                                                    <th className="px-6 py-4 font-bold text-gray-600 uppercase text-xs tracking-wider">作成日</th>
                                                    <th className="px-6 py-4 font-bold text-gray-600 uppercase text-xs tracking-wider text-right">アクション</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 bg-white">
                                                {checklistItems.map((item: any) => (
                                                    <tr key={item.id} className="hover:bg-blue-50/50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            {editingItem?.id === item.id ? (
                                                                <Input
                                                                    value={editingItem.itemName}
                                                                    onChange={(e) => setEditingItem({ ...editingItem, itemName: e.target.value })}
                                                                    className="w-full"
                                                                />
                                                            ) : (
                                                                <div className="font-medium text-gray-900">{item.itemName}</div>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {editingItem?.id === item.id ? (
                                                                <Select value={editingItem.itemType} onValueChange={(value: 'boolean' | 'numeric') => setEditingItem({ ...editingItem, itemType: value })}>
                                                                    <SelectTrigger className="w-32">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="boolean">チェック</SelectItem>
                                                                        <SelectItem value="numeric">数値</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            ) : (
                                                                <Badge variant={item.itemType === 'boolean' ? 'default' : 'secondary'}>
                                                                    {item.itemType === 'boolean' ? 'チェックボックス' : '数値評価'}
                                                                </Badge>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {editingItem?.id === item.id ? (
                                                                <Input
                                                                    type="number"
                                                                    min="0"
                                                                    max="100"
                                                                    value={editingItem.score}
                                                                    onChange={(e) => setEditingItem({ ...editingItem, score: parseInt(e.target.value) || 0 })}
                                                                    className="w-20"
                                                                />
                                                            ) : (
                                                                <div className="font-bold text-blue-600">{item.score}点</div>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm text-gray-500">
                                                                {new Date(item.createdAt).toLocaleDateString('ja-JP')}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex gap-2 justify-end">
                                                                {editingItem?.id === item.id ? (
                                                                    <>
                                                                        <Button size="sm" onClick={handleUpdateItem} className="bg-green-600 hover:bg-green-700">
                                                                            保存
                                                                        </Button>
                                                                        <Button size="sm" variant="outline" onClick={cancelEdit}>
                                                                            キャンセル
                                                                        </Button>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Button size="sm" variant="outline" onClick={() => startEdit(item)}>
                                                                            <Edit className="w-4 h-4" />
                                                                        </Button>
                                                                        <Button size="sm" variant="outline" onClick={() => handleDeleteItem(item.id)} className="text-red-600 hover:text-red-700">
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </Button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
        </TooltipProvider>
    );
}
