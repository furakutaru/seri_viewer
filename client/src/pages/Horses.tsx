import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { trpc } from '@/lib/trpc';
import { Header } from '@/components/Header';
import { useAuth } from '@/_core/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, ChevronUp, Star, CheckCircle2, AlertCircle, Trash2, Filter } from 'lucide-react';

export default function Horses() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const queryParams = new URLSearchParams(window.location.search);
  const initialSaleId = queryParams.get('saleId') ? parseInt(queryParams.get('saleId')!) : null;

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'lotNumber' | 'birthDate' | 'popularity' | 'height' | 'girth' | 'cannon'>('lotNumber');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filter states
  const [filters, setFilters] = useState({
    sex: [] as string[],
    heightMin: '',
    heightMax: '',
    girthMin: '',
    girthMax: '',
    cannonMin: '',
    cannonMax: '',
    sire: '',
    saleId: initialSaleId,
  });

  // Bulk selection state
  const [selectedHorseIds, setSelectedHorseIds] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch all horses with stats
  const { data: horses, isLoading, error } = trpc.horses.getAllWithStats.useQuery(undefined, {
    enabled: isAuthenticated
  });

  // Fetch unique sires for autocomplete
  const { data: sires } = trpc.horses.getSires.useQuery(undefined, {
    enabled: isAuthenticated
  });

  // Bulk update mutation
  const bulkUpdateMutation = trpc.horses.bulkSaveUserCheck.useMutation({
    onSuccess: () => {
      utils.horses.getAllWithStats.invalidate();
      setSelectedHorseIds([]);
      console.log("一括評価を更新しました");
    },
    onError: (err) => {
      console.error(`更新に失敗しました: ${err.message}`);
    }
  });

  // Filter and sort horses
  const filteredHorses = useMemo(() => {
    if (!horses) return [];

    let filtered = horses.filter((horse: any) => {
      // 非表示（アーカイブ）のセリに紐づく馬は、特定のsaleId指定がない限り管理者でも表示しない
      const isSpecificSaleRequest = filters.saleId && horse.saleId === filters.saleId;
      if (horse.sale?.status === 'hidden' && !isSpecificSaleRequest) return false;

      // Basic elimination check (always exclude eliminated horses from this list)
      if (horse.userCheck?.isEliminated) return false;

      const searchLower = searchTerm.toLowerCase();

      // Text search
      const matchesSearch = searchTerm === '' || (
        horse.lotNumber.toString().includes(searchLower) ||
        horse.sireName?.toLowerCase().includes(searchLower) ||
        horse.damName?.toLowerCase().includes(searchLower) ||
        horse.sex?.toLowerCase().includes(searchLower) ||
        horse.color?.toLowerCase().includes(searchLower) ||
        horse.userCheck?.memo?.toLowerCase().includes(searchLower)
      );

      if (!matchesSearch) return false;

      // Gender filter
      if (filters.sex.length > 0 && !filters.sex.includes(horse.sex)) return false;

      // Measurements filters
      const h = horse.height ? parseFloat(horse.height) : null;
      const g = horse.girth ? parseFloat(horse.girth) : null;
      const c = horse.cannon ? parseFloat(horse.cannon) : null;

      if (filters.heightMin && (h === null || h < parseFloat(filters.heightMin))) return false;
      if (filters.heightMax && (h === null || h > parseFloat(filters.heightMax))) return false;
      if (filters.girthMin && (g === null || g < parseFloat(filters.girthMin))) return false;
      if (filters.girthMax && (g === null || g > parseFloat(filters.girthMax))) return false;
      if (filters.cannonMin && (c === null || c < parseFloat(filters.cannonMin))) return false;
      if (filters.cannonMax && (c === null || c > parseFloat(filters.cannonMax))) return false;

      // Sire filter (text match)
      if (filters.sire && !horse.sireName?.toLowerCase().includes(filters.sire.toLowerCase())) return false;

      // Sale filter
      if (filters.saleId && horse.saleId !== filters.saleId) return false;

      return true;
    });

    // Sort
    filtered.sort((a: any, b: any) => {
      let aVal: any = a[sortBy];
      let bVal: any = b[sortBy];

      if (sortBy === 'popularity') {
        aVal = a.stats?.score || 0;
        bVal = b.stats?.score || 0;
      } else if (sortBy === 'birthDate') {
        aVal = aVal ? new Date(aVal).getTime() : 0;
        bVal = bVal ? new Date(bVal).getTime() : 0;
      } else if (['height', 'girth', 'cannon'].includes(sortBy)) {
        aVal = aVal ? parseFloat(aVal) : 0;
        bVal = bVal ? parseFloat(bVal) : 0;
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [horses, searchTerm, sortBy, sortOrder, filters]);

  const toggleRowExpansion = (horseId: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(horseId)) {
      newExpanded.delete(horseId);
    } else {
      newExpanded.add(horseId);
    }
    setExpandedRows(newExpanded);
  };

  const handleSort = (field: 'lotNumber' | 'birthDate' | 'popularity' | 'height' | 'girth' | 'cannon') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-bold">認証状態を確認中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 text-center">
            <p className="text-gray-600 mb-4">ログインが必要です</p>
            <Button onClick={() => setLocation('/')} className="bg-blue-600 hover:bg-blue-700">
              ホームに戻る
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-8">
      <Header />
      <div className="max-w-7xl mx-auto px-8 pt-8">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-2xl md:text-4xl font-bold text-gray-900">上場馬一覧</h1>
              {filters.saleId && horses?.find(h => h.saleId === filters.saleId)?.sale?.status === 'draft' && (
                <Badge className="bg-amber-100 text-amber-700 border-amber-200 font-black shadow-none border">
                  プレビュー中
                </Badge>
              )}
            </div>
            <p className="text-gray-600 text-sm md:text-base">
              {filters.saleId && horses?.find(h => h.saleId === filters.saleId)?.sale
                ? `${horses?.find(h => h.saleId === filters.saleId)?.sale?.saleName} の情報を表示中`
                : '登録されている馬の一覧を表示しています'}
            </p>
          </div>
        </div>

        {/* 検索・フィルター */}
        <Card className="p-6 mb-8 shadow-lg">
          <div className="flex flex-col gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                馬を検索
              </label>
              {/* デスクトップ用 */}
              <div className="hidden md:flex gap-4">
                <Input
                  type="text"
                  placeholder="上場番号、父馬名、母馬名、性別、毛色、セリ名で検索..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="flex-1 text-lg py-6"
                />
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`h-auto px-6 border-2 font-bold flex gap-2 ${showFilters ? 'bg-blue-50 border-blue-400 text-blue-700' : 'border-gray-200'}`}
                >
                  <Filter className="w-5 h-5" />
                  絞り込み
                  {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </div>
              {/* モバイル用 */}
              <div className="md:hidden space-y-3">
                <Input
                  type="text"
                  placeholder="上場番号、父馬名、母馬名、性別、毛色、セリ名で検索..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="w-full text-lg py-6"
                />
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`w-full h-auto px-6 border-2 font-bold flex gap-2 justify-center ${showFilters ? 'bg-blue-50 border-blue-400 text-blue-700' : 'border-gray-200'}`}
                >
                  <Filter className="w-5 h-5" />
                  絞り込み
                  {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6 bg-slate-50 rounded-xl border border-slate-200 animate-in fade-in slide-in-from-top-2">
                {/* 性別 */}
                <div className="space-y-3">
                  <h4 className="text-xs md:text-sm font-bold text-gray-900 border-l-4 border-blue-500 pl-2">性別</h4>
                  <div className="flex flex-wrap gap-4">
                    {['牡', '牝', 'セン'].map((sex) => (
                      <div key={sex} className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                        <Checkbox
                          id={`sex-${sex}`}
                          checked={filters.sex.includes(sex)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFilters({ ...filters, sex: [...filters.sex, sex] });
                            } else {
                              setFilters({ ...filters, sex: filters.sex.filter((s: string) => s !== sex) });
                            }
                          }}
                        />
                        <label
                          htmlFor={`sex-${sex}`}
                          className="text-sm font-bold text-gray-700 cursor-pointer"
                        >
                          {sex}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 父馬 (Autocomplete via Datalist) */}
                <div className="space-y-3">
                  <h4 className="text-xs md:text-sm font-bold text-gray-900 border-l-4 border-blue-500 pl-2">父馬</h4>
                  <Input
                    list="sires-list"
                    placeholder="父馬名を入力..."
                    value={filters.sire}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters({ ...filters, sire: e.target.value })}
                    className="bg-white"
                  />
                  <datalist id="sires-list">
                    {sires?.map(sire => (
                      <option key={sire} value={sire} />
                    ))}
                  </datalist>
                </div>

                {/* 体高・胸囲 */}
                <div className="space-y-3 lg:col-span-2">
                  <h4 className="text-xs md:text-sm font-bold text-gray-900 border-l-4 border-blue-500 pl-2">馬体計測値 (〇〇 〜 〇〇)</h4>
                  {/* デスクトップ用 */}
                  <div className="hidden md:block">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">体高</Label>
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            placeholder="最小"
                            value={filters.heightMin}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters({ ...filters, heightMin: e.target.value })}
                            className="h-9 px-2 text-sm bg-white"
                          />
                          <span className="text-gray-400">~</span>
                          <Input
                            type="number"
                            placeholder="最大"
                            value={filters.heightMax}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters({ ...filters, heightMax: e.target.value })}
                            className="h-9 px-2 text-sm bg-white"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">胸囲</Label>
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            placeholder="最小"
                            value={filters.girthMin}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters({ ...filters, girthMin: e.target.value })}
                            className="h-9 px-2 text-sm bg-white"
                          />
                          <span className="text-gray-400">~</span>
                          <Input
                            type="number"
                            placeholder="最大"
                            value={filters.girthMax}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters({ ...filters, girthMax: e.target.value })}
                            className="h-9 px-2 text-sm bg-white"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">管囲</Label>
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            placeholder="最小"
                            value={filters.cannonMin}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters({ ...filters, cannonMin: e.target.value })}
                            className="h-9 px-2 text-sm bg-white"
                          />
                          <span className="text-gray-400">~</span>
                          <Input
                            type="number"
                            placeholder="最大"
                            value={filters.cannonMax}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters({ ...filters, cannonMax: e.target.value })}
                            className="h-9 px-2 text-sm bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* モバイル用 */}
                  <div className="md:hidden space-y-4">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">体高</Label>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          placeholder="最小"
                          value={filters.heightMin}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters({ ...filters, heightMin: e.target.value })}
                          className="h-9 px-2 text-sm bg-white flex-1"
                        />
                        <span className="text-gray-400">~</span>
                        <Input
                          type="number"
                          placeholder="最大"
                          value={filters.heightMax}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters({ ...filters, heightMax: e.target.value })}
                          className="h-9 px-2 text-sm bg-white flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">胸囲</Label>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          placeholder="最小"
                          value={filters.girthMin}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters({ ...filters, girthMin: e.target.value })}
                          className="h-9 px-2 text-sm bg-white flex-1"
                        />
                        <span className="text-gray-400">~</span>
                        <Input
                          type="number"
                          placeholder="最大"
                          value={filters.girthMax}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters({ ...filters, girthMax: e.target.value })}
                          className="h-9 px-2 text-sm bg-white flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">管囲</Label>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          placeholder="最小"
                          value={filters.cannonMin}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters({ ...filters, cannonMin: e.target.value })}
                          className="h-9 px-2 text-sm bg-white flex-1"
                        />
                        <span className="text-gray-400">~</span>
                        <Input
                          type="number"
                          placeholder="最大"
                          value={filters.cannonMax}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters({ ...filters, cannonMax: e.target.value })}
                          className="h-9 px-2 text-sm bg-white flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 lg:col-span-4 flex justify-end gap-2 pt-2 border-t border-slate-200 mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 font-bold hover:bg-slate-200"
                    onClick={() => setFilters({
                      sex: [],
                      heightMin: '',
                      heightMax: '',
                      girthMin: '',
                      girthMax: '',
                      cannonMin: '',
                      cannonMax: '',
                      sire: '',
                      saleId: null,
                    })}
                  >
                    フィルターをクリア
                  </Button>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500 font-medium">
                該当件数: <span className="text-blue-600 font-bold">{filteredHorses.length}</span> 件
              </p>

              {selectedHorseIds.length > 0 && (
                <div className="flex items-center gap-3 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-200 animate-in zoom-in-95">
                  <span className="text-xs font-bold text-indigo-700">
                    <span className="text-lg mr-1">{selectedHorseIds.length}</span>頭 選択中
                  </span>
                  <div className="h-4 w-px bg-indigo-200 mx-1"></div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full h-8">
                        一括アクション
                        <ChevronDown className="ml-1 w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 font-bold">
                      <DropdownMenuItem
                        onClick={() => bulkUpdateMutation.mutate({ horseIds: selectedHorseIds, evaluation: '◎', isEliminated: false })}
                        className="text-green-600 focus:text-green-700"
                      >
                        <Star className="mr-2 h-4 w-4" /> 評価 ◎ に設定
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => bulkUpdateMutation.mutate({ horseIds: selectedHorseIds, evaluation: '○', isEliminated: false })}
                        className="text-blue-600 focus:text-blue-700"
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" /> 評価 ○ に設定
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => bulkUpdateMutation.mutate({ horseIds: selectedHorseIds, evaluation: '△', isEliminated: false })}
                        className="text-slate-600 focus:text-slate-700"
                      >
                        <AlertCircle className="mr-2 h-4 w-4" /> 評価 △ に設定
                      </DropdownMenuItem>
                      <div className="h-px bg-slate-100 my-1"></div>
                      <DropdownMenuItem
                        onClick={() => bulkUpdateMutation.mutate({ horseIds: selectedHorseIds, evaluation: null, isEliminated: true })}
                        className="text-red-600 focus:text-red-700"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> リストから除外
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-indigo-400 hover:text-indigo-600 rounded-full"
                    onClick={() => setSelectedHorseIds([])}
                  >
                    ×
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* テーブル */}
        {isLoading ? (
          <Card className="p-12 text-center">
            <p className="text-gray-600 text-lg animate-pulse">データを読み込み中...</p>
          </Card>
        ) : error ? (
          <Card className="p-8 text-center bg-red-50 border border-red-200">
            <p className="text-red-600">エラーが発生しました: {error?.message}</p>
          </Card>
        ) : filteredHorses.length === 0 ? (
          <Card className="p-12 text-center text-gray-500 text-lg">
            該当する馬がありません
          </Card>
        ) : (
          <>
            {/* デスクトップ用テーブル */}
            <div className="hidden md:block">
              <Card className="overflow-hidden shadow-xl border-none">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 w-12">
                          <Checkbox
                            checked={selectedHorseIds.length === filteredHorses.length && filteredHorses.length > 0}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedHorseIds(filteredHorses.map((h: any) => h.id));
                              } else {
                                setSelectedHorseIds([]);
                              }
                            }}
                            className="border-gray-300"
                          />
                        </th>
                        <th className="px-6 py-4">
                          <button
                            onClick={() => handleSort('lotNumber')}
                            className="font-bold text-gray-600 hover:text-gray-900 flex items-center gap-1 uppercase text-xs tracking-wider"
                          >
                            上場番号
                            {sortBy === 'lotNumber' && (
                              <span className="text-blue-600 font-black">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </button>
                        </th>
                        <th className="px-6 py-4 font-bold text-gray-600 uppercase text-xs tracking-wider">性別/毛色</th>
                        <th className="px-6 py-4">
                          <button
                            onClick={() => handleSort('birthDate')}
                            className="font-bold text-gray-600 hover:text-gray-900 flex items-center gap-1 uppercase text-xs tracking-wider"
                          >
                            生年月日
                            {sortBy === 'birthDate' && (
                              <span className="text-blue-600 font-black">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </button>
                        </th>
                        <th className="px-6 py-4 font-bold text-gray-600 uppercase text-xs tracking-wider">血統 (父 / 母)</th>
                        <th className="px-2 py-4">
                          <button
                            onClick={() => handleSort('height')}
                            className="font-bold text-gray-600 hover:text-gray-900 flex items-center gap-1 uppercase text-[10px] tracking-tighter"
                          >
                            体高
                            {sortBy === 'height' && (
                              <span className="text-blue-600 font-black">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </button>
                        </th>
                        <th className="px-2 py-4">
                          <button
                            onClick={() => handleSort('girth')}
                            className="font-bold text-gray-600 hover:text-gray-900 flex items-center gap-1 uppercase text-[10px] tracking-tighter"
                          >
                            胸囲
                            {sortBy === 'girth' && (
                              <span className="text-blue-600 font-black">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </button>
                        </th>
                        <th className="px-2 py-4">
                          <button
                            onClick={() => handleSort('cannon')}
                            className="font-bold text-gray-600 hover:text-gray-900 flex items-center gap-1 uppercase text-[10px] tracking-tighter"
                          >
                            管囲
                            {sortBy === 'cannon' && (
                              <span className="text-blue-600 font-black">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </button>
                        </th>
                        <th className="px-6 py-4">
                          <button
                            onClick={() => handleSort('popularity')}
                            className="font-bold text-gray-600 hover:text-gray-900 flex items-center gap-1 uppercase text-xs tracking-wider"
                          >
                            人気
                            {sortBy === 'popularity' && (
                              <span className="text-blue-600 font-black">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </button>
                        </th>
                        <th className="px-6 py-4 font-bold text-gray-600 uppercase text-xs tracking-wider text-right">詳細</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {filteredHorses.map((horse: any) => {
                        const stats = horse.stats;
                        return (
                          <tr
                            key={horse.id}
                            className={`hover:bg-blue-50/50 transition-colors group ${selectedHorseIds.includes(horse.id) ? 'bg-indigo-50/50' : ''}`}
                          >
                            <td className="px-6 py-4">
                              <Checkbox
                                checked={selectedHorseIds.includes(horse.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedHorseIds([...selectedHorseIds, horse.id]);
                                  } else {
                                    setSelectedHorseIds(selectedHorseIds.filter((id: number) => id !== horse.id));
                                  }
                                }}
                                className="border-gray-200"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-2xl font-black text-gray-900">{horse.lotNumber}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-1">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-black w-fit ${horse.sex === '牡' ? 'bg-blue-100 text-blue-800' :
                                  horse.sex === '牝' ? 'bg-pink-100 text-pink-800' :
                                    horse.sex === 'セン' ? 'bg-green-100 text-green-800' :
                                      'bg-gray-100 text-gray-800'
                                  }`}>
                                  {horse.sex || '-'}
                                </span>
                                <div className="text-xs text-gray-500 font-medium ml-1">{horse.color || '-'}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 font-medium">
                                {horse.birthDate
                                  ? new Date(horse.birthDate).toLocaleDateString('ja-JP')
                                  : '-'}
                              </div>
                              <div className="text-[10px] text-gray-400 font-bold">
                                {horse.birthDate ? `${new Date().getFullYear() - new Date(horse.birthDate).getFullYear()}歳` : ''}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-bold text-blue-900">{horse.sireName || '-'}</div>
                              <div className="text-xs text-gray-600 italic">× {horse.damName || '-'}</div>
                            </td>
                            <td className="px-2 py-4">
                              <span className="text-sm font-black text-blue-700">{horse.height || '-'}</span>
                            </td>
                            <td className="px-2 py-4">
                              <span className="text-sm font-black text-green-700">{horse.girth || '-'}</span>
                            </td>
                            <td className="px-2 py-4">
                              <span className="text-sm font-black text-purple-700">{horse.cannon || '-'}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1">
                                {stats && stats.total > 0 ? (
                                  <>
                                    <div className="flex -space-x-1">
                                      {stats.countExcellent > 0 && Array(Math.min(stats.countExcellent, 3)).fill(0).map((_, i) => (
                                        <span key={i} className="text-green-600 font-bold">◎</span>
                                      ))}
                                      {stats.countExcellent === 0 && stats.countGood > 0 && <span className="text-blue-600 font-bold">○</span>}
                                    </div>
                                    <span className="text-[10px] font-black text-gray-400 ml-1">
                                      Score: {stats.score} ({stats.total})
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-xs text-gray-300 font-bold">未評価</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Button
                                onClick={() => setLocation(`/horses/${horse.id}`)}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded-full text-xs transition-all shadow-md group-hover:scale-105"
                              >
                                詳細
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            {/* モバイル用アコーディオン */}
            <div className="md:hidden space-y-3">
              {/* モバイル用ソートコントロール */}
              <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-600">並び替え</span>
                  <Select 
                    value={`${sortBy}-${sortOrder}`} 
                    onValueChange={(value: string) => {
                      const [field, order] = value.split('-') as [typeof sortBy, typeof sortOrder];
                      if (sortBy === field) {
                        setSortOrder(order === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortBy(field);
                        setSortOrder('asc');
                      }
                    }}
                  >
                    <SelectTrigger className="w-32 bg-white border-gray-200 text-xs font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      <SelectItem value="lotNumber-asc" className="text-xs font-bold">
                        上場番号 ↑
                      </SelectItem>
                      <SelectItem value="lotNumber-desc" className="text-xs font-bold">
                        上場番号 ↓
                      </SelectItem>
                      <SelectItem value="birthDate-asc" className="text-xs font-bold">
                        生年月日 ↑
                      </SelectItem>
                      <SelectItem value="birthDate-desc" className="text-xs font-bold">
                        生年月日 ↓
                      </SelectItem>
                      <SelectItem value="height-asc" className="text-xs font-bold">
                        体高 ↑
                      </SelectItem>
                      <SelectItem value="height-desc" className="text-xs font-bold">
                        体高 ↓
                      </SelectItem>
                      <SelectItem value="girth-asc" className="text-xs font-bold">
                        胸囲 ↑
                      </SelectItem>
                      <SelectItem value="girth-desc" className="text-xs font-bold">
                        胸囲 ↓
                      </SelectItem>
                      <SelectItem value="cannon-asc" className="text-xs font-bold">
                        管囲 ↑
                      </SelectItem>
                      <SelectItem value="cannon-desc" className="text-xs font-bold">
                        管囲 ↓
                      </SelectItem>
                      <SelectItem value="popularity-asc" className="text-xs font-bold">
                        人気度 ↑
                      </SelectItem>
                      <SelectItem value="popularity-desc" className="text-xs font-bold">
                        人気度 ↓
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {filteredHorses.map((horse: any) => {
                const stats = horse.stats;
                return (
                  <Card key={horse.id} className="bg-white shadow-md border-0 overflow-hidden">
                    {/* 基本情報行 */}
                    <div 
                      className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => toggleRowExpansion(horse.id)}
                    >
                      {/* 1段目：チェックボックス、上場番号、評価、性別 */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {/* チェックボックス */}
                          <Checkbox
                            checked={selectedHorseIds.includes(horse.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedHorseIds([...selectedHorseIds, horse.id]);
                              } else {
                                setSelectedHorseIds(selectedHorseIds.filter((id: number) => id !== horse.id));
                              }
                            }}
                            className="border-gray-200"
                          />
                          
                          {/* 上場番号 */}
                          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-lg">
                            {horse.lotNumber}
                          </div>

                          {/* 性別 */}
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${horse.sex === '牡' ? 'bg-blue-100 text-blue-800' :
                            horse.sex === '牝' ? 'bg-pink-100 text-pink-800' :
                              horse.sex === 'セン' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>
                            {horse.sex || '-'}
                          </span>
                        </div>

                        {/* 展開ボタン */}
                        <div className="flex-shrink-0">
                          {expandedRows.has(horse.id) ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {/* 2段目：血統 */}
                      <div className="mb-3">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="font-bold text-blue-900 text-sm leading-tight">
                              {horse.sireName || '-'} × {horse.damName || '-'}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-sm">{horse.sireName || '-'} × {horse.damName || '-'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>

                      {/* 3段目：測尺データ */}
                      <div className="flex gap-4 text-xs">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">体:</span>
                          <span className="font-bold text-blue-700">{horse.height || '-'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">胸:</span>
                          <span className="font-bold text-green-700">{horse.girth || '-'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">管:</span>
                          <span className="font-bold text-purple-700">{horse.cannon || '-'}</span>
                        </div>
                      </div>
                    </div>

                    {/* 詳細情報（展開時） */}
                    {expandedRows.has(horse.id) && (
                      <div className="border-t border-gray-100 p-4 bg-gray-50">
                        <div className="space-y-3">
                          {/* 生年月日 */}
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-gray-600">生年月日</span>
                            <span className="text-sm text-gray-900">
                              {horse.birthDate
                                ? new Date(horse.birthDate).toLocaleDateString('ja-JP')
                                : '-'}
                              {horse.birthDate && (
                                <span className="text-xs text-gray-500 ml-2">
                                  {new Date().getFullYear() - new Date(horse.birthDate).getFullYear()}歳
                                </span>
                              )}
                            </span>
                          </div>

                          {/* 人気度 */}
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-gray-600">人気度</span>
                            <div className="flex items-center gap-1">
                              {stats && stats.total > 0 ? (
                                <>
                                  <div className="flex -space-x-1">
                                    {stats.countExcellent > 0 && Array(Math.min(stats.countExcellent, 3)).fill(0).map((_, i) => (
                                      <span key={i} className="text-green-600 font-bold text-sm">◎</span>
                                    ))}
                                    {stats.countExcellent === 0 && stats.countGood > 0 && <span className="text-blue-600 font-bold text-sm">○</span>}
                                  </div>
                                  <span className="text-xs font-black text-gray-400 ml-1">
                                    {stats.score} ({stats.total})
                                  </span>
                                </>
                              ) : (
                                <span className="text-xs text-gray-300 font-bold">未評価</span>
                              )}
                            </div>
                          </div>

                          {/* 毛色 */}
                          {horse.color && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-gray-600">毛色</span>
                              <span className="text-sm text-gray-900">{horse.color}</span>
                            </div>
                          )}

                          {/* 操作ボタン */}
                          <div className="flex gap-2 pt-2">
                            <Button 
                              size="sm" 
                              onClick={() => setLocation(`/horses/${horse.id}`)} 
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold"
                            >
                              詳細を見る
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
