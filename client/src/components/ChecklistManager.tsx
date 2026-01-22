import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Plus, Edit2 } from "lucide-react";
import { toast } from "sonner";

interface ChecklistManagerProps {
  saleId: number;
  horseId?: number;
  userCheckId?: number;
}

export default function ChecklistManager({
  saleId,
  horseId,
  userCheckId,
}: ChecklistManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    itemName: "",
    itemType: "boolean" as "boolean" | "numeric",
    score: 0,
    criteria: "",
  });

  // チェック項目一覧を取得
  const { data: checkItems, refetch: refetchItems } = trpc.checkItems.list.useQuery(
    { saleId },
    { enabled: !!saleId }
  );

  // チェック結果を取得
  const { data: checkResults, refetch: refetchResults } = trpc.checkResults.list.useQuery(
    { userCheckId: userCheckId || 0 },
    { enabled: !!userCheckId }
  );

  // チェック項目作成
  const createMutation = trpc.checkItems.create.useMutation({
    onSuccess: () => {
      toast.success("チェック項目を追加しました");
      setFormData({ itemName: "", itemType: "boolean", score: 0, criteria: "" });
      setShowAddForm(false);
      refetchItems();
    },
    onError: () => {
      toast.error("チェック項目の追加に失敗しました");
    },
  });

  // チェック項目更新
  const updateMutation = trpc.checkItems.update.useMutation({
    onSuccess: () => {
      toast.success("チェック項目を更新しました");
      setEditingId(null);
      setFormData({ itemName: "", itemType: "boolean", score: 0, criteria: "" });
      refetchItems();
    },
    onError: () => {
      toast.error("チェック項目の更新に失敗しました");
    },
  });

  // チェック項目削除
  const deleteMutation = trpc.checkItems.delete.useMutation({
    onSuccess: () => {
      toast.success("チェック項目を削除しました");
      refetchItems();
    },
    onError: () => {
      toast.error("チェック項目の削除に失敗しました");
    },
  });

  // チェック結果更新
  const updateResultMutation = trpc.checkResults.update.useMutation({
    onSuccess: () => {
      refetchResults();
    },
    onError: () => {
      toast.error("チェック結果の更新に失敗しました");
    },
  });

  const handleAddItem = () => {
    if (!formData.itemName) {
      toast.error("項目名を入力してください");
      return;
    }

    createMutation.mutate({
      saleId,
      itemName: formData.itemName,
      itemType: formData.itemType,
      score: formData.score,
      criteria: formData.itemType === "numeric" ? JSON.parse(formData.criteria || "{}") : undefined,
    });
  };

  const handleUpdateItem = (itemId: number) => {
    if (!formData.itemName) {
      toast.error("項目名を入力してください");
      return;
    }

    updateMutation.mutate({
      itemId,
      itemName: formData.itemName,
      score: formData.score,
      criteria: formData.itemType === "numeric" ? JSON.parse(formData.criteria || "{}") : undefined,
    });
  };

  const handleDeleteItem = (itemId: number) => {
    if (confirm("このチェック項目を削除してもよろしいですか？")) {
      deleteMutation.mutate({ itemId });
    }
  };

  const handleCheckItem = (itemId: number, isChecked: boolean, score: number) => {
    if (!userCheckId) return;

    updateResultMutation.mutate({
      userCheckId,
      checkItemId: itemId,
      isChecked,
      scoreApplied: isChecked ? score : 0,
    });
  };

  const getCheckStatus = (itemId: number) => {
    return checkResults?.find((r) => r.checkItemId === itemId)?.isChecked ?? false;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">チェックリスト</h3>
        {!showAddForm && !editingId && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            追加
          </Button>
        )}
      </div>

      {/* 追加フォーム */}
      {showAddForm && (
        <Card className="p-4 space-y-3">
          <Input
            placeholder="項目名（例：腰高、馬体重400kg以上）"
            value={formData.itemName}
            onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
          />
          <div className="flex gap-2">
            <select
              value={formData.itemType}
              onChange={(e) =>
                setFormData({ ...formData, itemType: e.target.value as "boolean" | "numeric" })
              }
              className="flex-1 px-3 py-2 border rounded"
            >
              <option value="boolean">目視評価</option>
              <option value="numeric">自動判定</option>
            </select>
            <Input
              type="number"
              placeholder="スコア"
              value={formData.score}
              onChange={(e) => setFormData({ ...formData, score: parseInt(e.target.value) || 0 })}
              className="w-24"
            />
          </div>
          {formData.itemType === "numeric" && (
            <Input
              placeholder='条件（JSON形式）'
              value={formData.criteria}
              onChange={(e) => setFormData({ ...formData, criteria: e.target.value })}
            />
          )}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleAddItem}
              disabled={createMutation.isPending}
            >
              追加
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowAddForm(false);
                setFormData({ itemName: "", itemType: "boolean", score: 0, criteria: "" });
              }}
            >
              キャンセル
            </Button>
          </div>
        </Card>
      )}

      {/* チェック項目リスト */}
      <div className="space-y-2">
        {checkItems?.map((item) => (
          <div key={item.id} className="flex items-center gap-3 p-3 border rounded">
            {userCheckId && (
              <Checkbox
                checked={getCheckStatus(item.id)}
                onCheckedChange={(checked) =>
                  handleCheckItem(item.id, checked as boolean, item.score)
                }
              />
            )}
            <div className="flex-1">
              <p className="font-medium text-sm">{item.itemName}</p>
              <p className="text-xs text-muted-foreground">
                {item.itemType === "boolean" ? "目視" : "自動判定"} • {item.score > 0 ? "+" : ""}{item.score}P
              </p>
            </div>
            {editingId !== item.id && (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditingId(item.id);
                    setFormData({
                      itemName: item.itemName,
                      itemType: item.itemType,
                      score: item.score,
                      criteria: JSON.stringify(item.criteria || {}),
                    });
                  }}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteItem(item.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 編集フォーム */}
      {editingId && (
        <Card className="p-4 space-y-3">
          <Input
            placeholder="項目名"
            value={formData.itemName}
            onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
          />
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="スコア"
              value={formData.score}
              onChange={(e) => setFormData({ ...formData, score: parseInt(e.target.value) || 0 })}
              className="w-24"
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => handleUpdateItem(editingId)}
              disabled={updateMutation.isPending}
            >
              更新
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditingId(null);
                setFormData({ itemName: "", itemType: "boolean", score: 0, criteria: "" });
              }}
            >
              キャンセル
            </Button>
          </div>
        </Card>
      )}

      {(!checkItems || checkItems.length === 0) && !showAddForm && (
        <p className="text-sm text-muted-foreground text-center py-4">
          チェック項目がありません
        </p>
      )}
    </div>
  );
}
