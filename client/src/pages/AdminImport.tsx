import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from '@/lib/trpc';
import { Header } from '@/components/Header';
import { JbisImportForm } from '@/components/JbisImportForm';
import { AdminRouteGuard } from '@/components/AdminRouteGuard';
import { UserManagement } from '@/components/UserManagement';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Settings, Eye, Download, Trash2, Calendar, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AdminImport() {
  return (
    <AdminRouteGuard>
      <AdminImportContent />
    </AdminRouteGuard>
  );
}

function AdminImportContent() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const queryParams = new URLSearchParams(window.location.search);
  const initialSaleId = queryParams.get('saleId') ? parseInt(queryParams.get('saleId')!) : null;

  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(initialSaleId);
  const [catalogUrl, setCatalogUrl] = useState('');
  const [pdfUrlsText, setPdfUrlsText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(queryParams.get('tab') || 'sales');

  const { data: sales, isLoading: salesLoading } = trpc.sales.getAll.useQuery();

  const createSaleMutation = trpc.admin.createSale.useMutation({
    onSuccess: () => {
      toast.success('セリを作成しました');
      utils.sales.getAll.invalidate();
      setOpen(false);
    }
  });

  const updateStatusMutation = trpc.admin.updateSaleStatus.useMutation({
    onSuccess: () => {
      toast.success('ステータスを更新しました');
      utils.sales.getAll.invalidate();
    }
  });

  const deleteSaleMutation = trpc.admin.deleteSale.useMutation({
    onSuccess: () => {
      toast.success('セリを削除しました');
      utils.sales.getAll.invalidate();
    }
  });

  const [open, setOpen] = useState(false);
  const [newSale, setNewSale] = useState({
    saleCode: '',
    saleName: '',
    saleDate: new Date().toISOString().split('T')[0],
  });

  const importDataMutation = trpc.admin.importData.useMutation({
    onSuccess: (data) => {
      setIsLoading(false);
      setResult(data);
      setError(null);
    },
    onError: (err: any) => {
      setIsLoading(false);
      setError(err.message || 'Import failed');
      setResult(null);
    },
  });

  const handleCreate = () => {
    if (!newSale.saleCode || !newSale.saleName) {
      toast.error('必要事項を入力してください');
      return;
    }
    createSaleMutation.mutate({
      ...newSale,
      saleDate: new Date(newSale.saleDate),
    });
  };

  const statusColors = {
    draft: 'bg-amber-100 text-amber-700 border-amber-200',
    published: 'bg-green-100 text-green-700 border-green-200',
    hidden: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const statusLabels = {
    draft: '下書き（管理者のみ）',
    published: '公開中（全ユーザー）',
    hidden: '非表示（アーカイブ）',
  };

  // Parse PDF URLs from textarea (one per line)
  const getPdfUrls = (): string[] => {
    return pdfUrlsText
      .split('\n')
      .map((url) => url.trim())
      .filter((url) => url.length > 0);
  };

  const handleImport = async () => {
    if (!selectedSaleId) {
      setError('インポート先のセリを選択してください');
      return;
    }

    if (!catalogUrl.trim()) {
      setError('Webカタログ一覧URLを入力してください');
      return;
    }

    const validPdfUrls = getPdfUrls();
    if (validPdfUrls.length === 0) {
      setError('少なくとも1つのPDF URLを入力してください');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      await importDataMutation.mutateAsync({
        saleId: selectedSaleId,
        catalogUrl: catalogUrl.trim(),
        pdfUrls: validPdfUrls,
      });
    } catch (err: any) {
      setError(err.message || 'Import failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-8">
      <Header />
      <div className="max-w-7xl mx-auto px-8 pt-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-black text-gray-900 mb-2">管理メニュー</h1>
            <p className="text-gray-600">セリ情報の管理とデータ取り込みを行います</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white/50 backdrop-blur p-1 h-auto rounded-xl shadow-sm">
            <TabsTrigger value="sales" className="py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600 transition-all">
              <Settings className="w-4 h-4 mr-2" />
              セリ管理・配信設定
            </TabsTrigger>
            <TabsTrigger value="catalog" className="py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600 transition-all">
              <Download className="w-4 h-4 mr-2" />
              カタログ・測尺インポート
            </TabsTrigger>
            <TabsTrigger value="jbis" className="py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600 transition-all">
              <Plus className="w-4 h-4 mr-2" />
              JBISデータ更新
            </TabsTrigger>
            <TabsTrigger value="users" className="py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600 transition-all">
              <Users className="w-4 h-4 mr-2" />
              ユーザー管理
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sales" className="mt-8">
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white/40 p-6 rounded-2xl border border-white underline-offset-4">
                <div className="flex gap-4 items-center">
                  <div className="bg-blue-600 text-white p-2 rounded-lg">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-800">配信フロー</h2>
                    <p className="text-xs text-slate-500 font-medium">下書き状態で取り込み・確認を行い、問題なければ公開してください</p>
                  </div>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700 gap-2 font-black shadow-lg shadow-blue-200">
                      <Plus className="w-4 h-4" />
                      新規セリ作成
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>新規セリの作成</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="code">セリコード (例: 20240901)</Label>
                        <Input
                          id="code"
                          value={newSale.saleCode}
                          onChange={e => setNewSale({ ...newSale, saleCode: e.target.value })}
                          placeholder="20240901"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="name">セリ名</Label>
                        <Input
                          id="name"
                          value={newSale.saleName}
                          onChange={e => setNewSale({ ...newSale, saleName: e.target.value })}
                          placeholder="2024年セプテンバーセール"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="date">開催日</Label>
                        <Input
                          id="date"
                          type="date"
                          value={newSale.saleDate}
                          onChange={e => setNewSale({ ...newSale, saleDate: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleCreate} disabled={createSaleMutation.isPending}>
                        作成する
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {salesLoading ? (
                <div className="grid gap-4">
                  {[1, 2].map(i => (
                    <div key={i} className="h-32 bg-white/40 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : sales && sales.length > 0 ? (
                <div className="grid gap-6">
                  {sales.map((sale: any) => (
                    <Card key={sale.id} className="p-6 border-none shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all group overflow-hidden relative bg-white">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge className={`${statusColors[sale.status as keyof typeof statusColors]} border shadow-none font-bold`}>
                              {statusLabels[sale.status as keyof typeof statusLabels]}
                            </Badge>
                            <span className="text-xs text-slate-400 font-bold tracking-widest uppercase">
                              ID: {sale.id}
                            </span>
                          </div>
                          <h3 className="text-xl font-bold text-slate-800 mb-1">{sale.saleName}</h3>
                          <div className="flex items-center gap-4 text-xs text-slate-500 font-bold uppercase tracking-wider">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(sale.saleDate).toLocaleDateString()}
                            </span>
                            <span>Code: {sale.saleCode}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex flex-col gap-1 mr-4">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase">ステータス変更</Label>
                            <Select
                              value={sale.status}
                              onValueChange={(val) => updateStatusMutation.mutate({ id: sale.id, status: val as any })}
                            >
                              <SelectTrigger className="w-[180px] h-9 bg-slate-50">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="draft">下書き</SelectItem>
                                <SelectItem value="published">公開中</SelectItem>
                                <SelectItem value="hidden">非表示</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2 font-bold hover:bg-slate-50"
                              onClick={() => setLocation(`/horses?saleId=${sale.id}`)}
                            >
                              <Eye className="w-4 h-4" />
                              プレビュー
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2 text-indigo-600 border-indigo-100 hover:bg-indigo-50 font-bold"
                              onClick={() => {
                                setSelectedSaleId(sale.id);
                                setActiveTab('catalog');
                              }}
                            >
                              <Download className="w-4 h-4" />
                              取り込み
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:text-red-600 hover:bg-red-50"
                              onClick={() => {
                                if (confirm('このセリ情報を完全に削除しますか？（上場馬データも削除されます）')) {
                                  deleteSaleMutation.mutate(sale.id);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center text-gray-500 border-dashed border-2 bg-white/50">
                  作成されているセリ枠がありません
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="catalog" className="mt-6">
            <Card className="p-8 shadow-lg">
              {/* セリの選択 */}
              <div className="mb-8 p-6 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-wider">
                  1. インポート先のセリを選択
                </label>
                <Select
                  value={selectedSaleId?.toString()}
                  onValueChange={(val) => setSelectedSaleId(parseInt(val))}
                  disabled={isLoading || (result && result.success)}
                >
                  <SelectTrigger className="w-full bg-white border-slate-300">
                    <SelectValue placeholder="セリを選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {sales?.map(sale => (
                      <SelectItem key={sale.id} value={sale.id.toString()}>
                        {sale.saleName} ({new Date(sale.saleDate).toLocaleDateString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!selectedSaleId && (
                  <p className="text-xs text-red-500 mt-2 font-bold animate-pulse">
                    ※ データを流し込む枠を先に作成・選択してください
                  </p>
                )}
              </div>

              {/* Webカタログ一覧URL */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  2. Webカタログ一覧 URL
                </label>
                <Input
                  type="url"
                  placeholder="https://w2.hba.or.jp/upload/..."
                  value={catalogUrl}
                  onChange={(e) => setCatalogUrl(e.target.value)}
                  disabled={isLoading || (result && result.success)}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  HBA公式サイトのセリ市カタログ一覧ページのURLを入力してください
                </p>
              </div>

              {/* PDF測尺データ URL */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  PDF測尺データ URL（複数可）
                </label>
                <textarea
                  placeholder="https://w2.hba.or.jp/upload/...&#10;https://w2.hba.or.jp/upload/..."
                  value={pdfUrlsText}
                  onChange={(e) => setPdfUrlsText(e.target.value)}
                  disabled={isLoading || (result && result.success)}
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-2">
                  複数のPDF URLを1行ずつ入力してください（改行区切り）
                </p>
                {getPdfUrls().length > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    {getPdfUrls().length}個のPDF URLが入力されています
                  </p>
                )}
              </div>

              {/* エラー表示 */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm font-semibold">エラー</p>
                  <p className="text-red-600 text-sm mt-1">{error}</p>
                </div>
              )}

              {/* 結果表示 */}
              {result && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 text-sm font-semibold">✓ {result.message}</p>
                  <div className="text-green-600 text-sm mt-2 space-y-1">
                    <p>• カタログから抽出: {result.catalogCount} 頭</p>
                    <p>• 測尺データ: {result.measurementCount} 件</p>
                    <p>• データベースに保存: {result.insertedCount} 頭</p>
                  </div>
                </div>
              )}

              {/* インポートボタン または 一覧確認ボタン */}
              {result && result.success ? (
                <Button
                  onClick={() => setLocation('/horses')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg"
                >
                  一覧を確認
                </Button>
              ) : (
                <Button
                  onClick={handleImport}
                  disabled={isLoading || !catalogUrl.trim() || getPdfUrls().length === 0}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg"
                >
                  {isLoading ? 'データを取り込み中...' : 'データを取り込む'}
                </Button>
              )}

              {/* キャッシュクリア情報 */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-700 text-sm font-semibold">💡 キャッシュについて</p>
                <p className="text-blue-600 text-sm mt-1">
                  Webカタログと測尺PDFは自動的にキャッシュされます。同じURLを再度使用する場合、キャッシュから読み込まれるため高速です。
                </p>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="jbis" className="mt-6">
            <JbisImportForm />
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <UserManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
