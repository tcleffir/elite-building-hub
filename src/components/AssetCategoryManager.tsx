import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, Check, X, Lock } from "lucide-react";
import { toast } from "sonner";
import { type CategoryEntry, slugifyCategory } from "@/hooks/use-assets-store";
import type { Asset } from "@/lib/assets-data";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CategoryEntry[];
  assets: Asset[];
  onChange: (next: CategoryEntry[]) => void;
}

const AssetCategoryManager = ({ open, onOpenChange, categories, assets, onChange }: Props) => {
  const [newLabel, setNewLabel] = useState("");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");

  const usageCount = (key: string) => assets.filter((a) => a.category === key).length;

  const handleAdd = () => {
    const label = newLabel.trim();
    if (label.length < 2) {
      toast.error("O nome da categoria deve ter ao menos 2 caracteres.");
      return;
    }
    let key = slugifyCategory(label);
    if (categories.some((c) => c.key === key)) {
      key = `${key}_${Date.now().toString(36).slice(-4)}`;
    }
    onChange([...categories, { key, label, builtin: false }]);
    setNewLabel("");
    toast.success(`Categoria "${label}" criada.`);
  };

  const startEdit = (c: CategoryEntry) => {
    setEditingKey(c.key);
    setEditLabel(c.label);
  };

  const commitEdit = () => {
    if (!editingKey) return;
    const label = editLabel.trim();
    if (label.length < 2) {
      toast.error("Nome inválido.");
      return;
    }
    onChange(categories.map((c) => (c.key === editingKey ? { ...c, label } : c)));
    setEditingKey(null);
    toast.success("Categoria renomeada.");
  };

  const handleDelete = (c: CategoryEntry) => {
    if (c.builtin) {
      toast.error("Categorias padrão não podem ser excluídas.");
      return;
    }
    if (usageCount(c.key) > 0) {
      toast.error(`Categoria em uso por ${usageCount(c.key)} ativo(s). Reclassifique-os antes.`);
      return;
    }
    onChange(categories.filter((x) => x.key !== c.key));
    toast.success(`Categoria "${c.label}" excluída.`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gerenciar categorias</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Nova categoria (ex.: Iluminação)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              maxLength={40}
            />
            <Button onClick={handleAdd} className="gap-1 shrink-0">
              <Plus className="h-4 w-4" /> Adicionar
            </Button>
          </div>

          <div className="max-h-80 overflow-y-auto border rounded-xl divide-y">
            {categories.map((c) => {
              const editing = editingKey === c.key;
              const count = usageCount(c.key);
              return (
                <div key={c.key} className="flex items-center gap-2 px-3 py-2">
                  {editing ? (
                    <Input
                      autoFocus
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitEdit();
                        if (e.key === "Escape") setEditingKey(null);
                      }}
                      className="h-8"
                      maxLength={40}
                    />
                  ) : (
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{c.label}</span>
                        {c.builtin && (
                          <Badge variant="outline" className="text-[10px] gap-0.5">
                            <Lock className="h-2.5 w-2.5" /> padrão
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {count} ativo{count === 1 ? "" : "s"} · key: {c.key}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center gap-1 shrink-0">
                    {editing ? (
                      <>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={commitEdit}>
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingKey(null)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(c)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          disabled={c.builtin || count > 0}
                          onClick={() => handleDelete(c)}
                          title={c.builtin ? "Categoria padrão" : count > 0 ? "Em uso" : "Excluir"}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssetCategoryManager;