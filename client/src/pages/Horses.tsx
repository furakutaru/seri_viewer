import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';

export default function Horses() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'lotNumber' | 'birthDate' | 'popularity'>('lotNumber');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Fetch all horses with stats
  const { data: horses, isLoading, error } = trpc.horses.getAllWithStats.useQuery();

  // Filter and sort horses
  const filteredHorses = useMemo(() => {
    if (!horses) return [];

    let filtered = horses.filter((horse: any) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        horse.lotNumber.toString().includes(searchLower) ||
        horse.sireName?.toLowerCase().includes(searchLower) ||
        horse.damName?.toLowerCase().includes(searchLower) ||
        horse.sex?.toLowerCase().includes(searchLower) ||
        horse.color?.toLowerCase().includes(searchLower) ||
        horse.sale?.saleName?.toLowerCase().includes(searchLower)
      );
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
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [horses, searchTerm, sortBy, sortOrder]);

  const handleSort = (column: 'lotNumber' | 'birthDate' | 'popularity') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">上場馬一覧</h1>
            <p className="text-gray-600">登録されている馬の一覧を表示しています</p>
          </div>
          <Button
            onClick={() => setLocation('/')}
            variant="outline"
            className="text-gray-700 border-gray-300 hover:bg-gray-50"
          >
            ホームに戻る
          </Button>
        </div>

        {/* 検索・フィルター */}
        <Card className="p-6 mb-8 shadow-lg">
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              馬を検索
            </label>
            <Input
              type="text"
              placeholder="上場番号、父馬名、母馬名、性別、毛色、セリ名で検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-lg py-6"
            />
            <p className="text-sm text-gray-500 mt-2 font-medium">
              該当件数: <span className="text-blue-600 font-bold">{filteredHorses.length}</span> 件
            </p>
          </div>
        </Card>

        {/* テーブル */}
        {isLoading ? (
          <Card className="p-12 text-center">
            <p className="text-gray-600 text-lg animate-pulse">データを読み込み中...</p>
          </Card>
        ) : error ? (
          <Card className="p-8 text-center bg-red-50 border border-red-200">
            <p className="text-red-600">エラーが発生しました: {error.message}</p>
          </Card>
        ) : filteredHorses.length === 0 ? (
          <Card className="p-12 text-center text-gray-500 text-lg">
            該当する馬がありません
          </Card>
        ) : (
          <Card className="overflow-hidden shadow-xl border-none">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
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
                    <th className="px-6 py-4 font-bold text-gray-600 uppercase text-xs tracking-wider">測尺 (体/胸/管)</th>
                    <th className="px-6 py-4">
                      <button
                        onClick={() => handleSort('popularity')}
                        className="font-bold text-gray-600 hover:text-gray-900 flex items-center gap-1 uppercase text-xs tracking-wider"
                      >
                        人気指数
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
                        className="hover:bg-blue-50/50 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <span className="text-xl font-black text-gray-900">{horse.lotNumber}</span>
                          {horse.sale?.saleName && (
                            <div className="text-[10px] text-gray-400 font-bold truncate max-w-[120px]">
                              {horse.sale.saleName}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-gray-900">{horse.sex || '-'}</div>
                          <div className="text-xs text-gray-500">{horse.color || '-'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {horse.birthDate
                              ? new Date(horse.birthDate).toLocaleDateString('ja-JP')
                              : '-'}
                          </div>
                          <div className="text-xs text-gray-400">
                            {horse.birthDate ? `${new Date().getFullYear() - new Date(horse.birthDate).getFullYear()}歳` : ''}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-blue-900">{horse.sireName || '-'}</div>
                          <div className="text-sm text-gray-600 italic">× {horse.damName || '-'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2 text-xs font-bold">
                            <span className="text-blue-600">{horse.height || '-'}</span>
                            <span className="text-gray-300">/</span>
                            <span className="text-green-600">{horse.girth || '-'}</span>
                            <span className="text-gray-300">/</span>
                            <span className="text-purple-600">{horse.cannon || '-'}</span>
                          </div>
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
        )}
      </div>
    </div>
  );
}
