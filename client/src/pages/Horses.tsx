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

  // Fetch all horses
  const { data: horses, isLoading, error } = trpc.horses.getAll.useQuery();

  // Build popularity map
  const popularityMap = useMemo(() => {
    const map: Record<number, any> = {};
    if (!horses) return map;
    
    // Note: We would need to fetch popularity stats separately
    // For now, return empty map to avoid infinite queries
    return map;
  }, [horses]);

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
        horse.color?.toLowerCase().includes(searchLower)
      );
    });

    // Sort
    filtered.sort((a: any, b: any) => {
      let aVal: any = a[sortBy];
      let bVal: any = b[sortBy];

      if (sortBy === 'popularity') {
        const aStats = popularityMap[a.id];
        const bStats = popularityMap[b.id];
        aVal = aStats ? aStats.score / (aStats.total * 3) : 0;
        bVal = bStats ? bStats.score / (bStats.total * 3) : 0;
      } else if (sortBy === 'birthDate') {
        aVal = aVal ? new Date(aVal).getTime() : 0;
        bVal = bVal ? new Date(bVal).getTime() : 0;
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [horses, searchTerm, sortBy, sortOrder, popularityMap]);

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
              検索
            </label>
            <Input
              type="text"
              placeholder="上場番号、父馬名、母馬名、性別、毛色で検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              {filteredHorses.length} 件の馬が見つかりました
            </p>
          </div>
        </Card>

        {/* テーブル */}
        {isLoading ? (
          <Card className="p-8 text-center">
            <p className="text-gray-600">データを読み込み中...</p>
          </Card>
        ) : error ? (
          <Card className="p-8 text-center bg-red-50 border border-red-200">
            <p className="text-red-600">エラーが発生しました: {error.message}</p>
          </Card>
        ) : filteredHorses.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-600">該当する馬がありません</p>
          </Card>
        ) : (
          <Card className="overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort('lotNumber')}
                        className="font-semibold text-gray-700 hover:text-gray-900 flex items-center gap-1"
                      >
                        上場番号
                        {sortBy === 'lotNumber' && (
                          <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">性別</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">毛色</th>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort('birthDate')}
                        className="font-semibold text-gray-700 hover:text-gray-900 flex items-center gap-1"
                      >
                        生年月日
                        {sortBy === 'birthDate' && (
                          <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">父馬名</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">母馬名</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">体高</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">胸囲</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">管囲</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">詳細</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHorses.map((horse: any, index: number) => {
                    return (
                      <tr
                        key={horse.id}
                        className={`border-b border-gray-200 hover:bg-blue-50 transition-colors ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        }`}
                      >
                        <td className="px-6 py-4 text-sm font-semibold text-blue-600">
                          {horse.lotNumber}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{horse.sex}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{horse.color}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {horse.birthDate
                            ? new Date(horse.birthDate).toLocaleDateString('ja-JP')
                            : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{horse.sireName || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{horse.damName || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {horse.height ? `${horse.height}cm` : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {horse.girth ? `${horse.girth}cm` : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {horse.cannon ? `${horse.cannon}cm` : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <Button
                            onClick={() => setLocation(`/horses/${horse.id}`)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-semibold"
                          >
                            詳細を見る
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
