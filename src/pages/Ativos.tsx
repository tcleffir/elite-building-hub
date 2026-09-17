import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import KpiCard from "@/components/KpiCard";
import { Package, Coins, ShieldCheck, AlertTriangle, Search, Plus, Tags, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  formatBRL, formatBRLFull, getCategoryIcon,
  formatFloor, getWarrantyStatus, getMaintenanceStatus, type Asset, type AssetMaintenance,
  type AssetChangeLog, diffAsset, nextAssetId, nextLogId,
} from "@/lib/assets-data";
import { mockTickets } from "@/lib/mock-data";
import AssetDrawer from "@/components/AssetDrawer";
import AssetFormDialog from "@/components/AssetFormDialog";
import AssetDeleteDialog from "@/components/AssetDeleteDialog";
import AssetCategoryManager from "@/components/AssetCategoryManager";
import { useAssetsStore } from "@/hooks/use-assets-store";
import { useApp } from "@/contexts/AppContext";
import { toast } from "sonner";

const fmt = (iso: string) => format(parseISO(iso), "dd/MM/yyyy", { locale: ptBR });

const warrantyChip = {
  active: { label: "🟢 Ativa", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
  expiring: { label: "🟡 Vence", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  expired: { label: "🔴 Vencida", className: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300" },
} as const;

const maintChip = {
  ok: { label: "🟢 Em dia", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
  due_soon: { label: "🟡 Próx.", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  overdue: { label: "🔴 Vencida", className: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300" },
} as const;

// Pesos para ordenação de garantia (vencida → ativa)
const warrantyWeight = { expired: 0, expiring: 1, active: 2 } as const;

type SortKey = "name" | "category" | "floor" | "purchaseDate" | "purchasePrice"
  | "warranty" | "nextMaintenance" | "tickets";
type SortDir = "asc" | "desc";

const Ativos = () => {
  const { user } = useApp();
  const canManage = user.role === "super_admin" || user.role === "building_manager";
  const roleLabel =
    user.role === "super_admin" ? "Super Admin"
    : user.role === "building_manager" ? "Gestor Predial"
    : user.role;

  const {
    assets, setAssets,
    maintenances, setMaintenances,
    logs, setLogs,
    categories, setCategories,
  } = useAssetsStore();

  const categoryLabels = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.key, c.label])) as Record<string, string>,
    [categories]
  );

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [floor, setFloor] = useState<string>("all");
  const [warrantyFilter, setWarrantyFilter] = useState<string>("all");
  const [maintFilter, setMaintFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Asset | null>(null);
  const [open, setOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formInitial, setFormInitial] = useState<Asset | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Asset | null>(null);
  const [catOpen, setCatOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const appendLog = (entry: Omit<AssetChangeLog, "id" | "userId" | "userName" | "userRole">) => {
    setLogs((prev) => [
      { ...entry, id: nextLogId(), userId: user.id, userName: user.full_name, userRole: roleLabel },
      ...prev,
    ]);
  };

  const ticketsByAsset = useMemo(() => {
    const map = new Map<string, number>();
    mockTickets.forEach(t => {
      const id = (t as any).asset_id as string | undefined;
      if (!id) return;
      if (!["completed", "cancelled"].includes(t.status)) {
        map.set(id, (map.get(id) ?? 0) + 1);
      }
    });
    return map;
  }, []);

  const floors = useMemo(() => {
    const set = new Set(assets.map(a => a.floor));
    return Array.from(set).sort((a, b) => a - b);
  }, [assets]);

  const filtered = useMemo(() => {
    return assets.filter(a => {
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!`${a.name} ${a.brand} ${a.model} ${a.serialNumber}`.toLowerCase().includes(q)) return false;
      }
      if (category !== "all" && a.category !== category) return false;
      if (floor !== "all" && String(a.floor) !== floor) return false;
      if (warrantyFilter !== "all" && getWarrantyStatus(a) !== warrantyFilter) return false;
      if (maintFilter !== "all" && getMaintenanceStatus(a) !== maintFilter) return false;
      return true;
    });
  }, [assets, search, category, floor, warrantyFilter, maintFilter]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const dir = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = a.name.localeCompare(b.name, "pt-BR");
          break;
        case "category": {
          const la = categoryLabels[a.category] ?? a.category;
          const lb = categoryLabels[b.category] ?? b.category;
          cmp = la.localeCompare(lb, "pt-BR");
          break;
        }
        case "floor":
          cmp = a.floor - b.floor;
          break;
        case "purchaseDate":
          cmp = a.purchaseDate.localeCompare(b.purchaseDate);
          break;
        case "purchasePrice":
          cmp = a.purchasePrice - b.purchasePrice;
          break;
        case "warranty": {
          const wa = warrantyWeight[getWarrantyStatus(a)];
          const wb = warrantyWeight[getWarrantyStatus(b)];
          cmp = wa - wb;
          if (cmp === 0) cmp = a.warranty.endDate.localeCompare(b.warranty.endDate);
          break;
        }
        case "nextMaintenance":
          cmp = a.nextMaintenanceDate.localeCompare(b.nextMaintenanceDate);
          break;
        case "tickets": {
          const ta = ticketsByAsset.get(a.id) ?? 0;
          const tb = ticketsByAsset.get(b.id) ?? 0;
          cmp = ta - tb;
          break;
        }
      }
      return cmp * dir;
    });
    return arr;
  }, [filtered, sortKey, sortDir, categoryLabels, ticketsByAsset]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortHeader = ({ label, sKey, className = "" }: { label: string; sKey: SortKey; className?: string }) => {
    const active = sortKey === sKey;
    const Icon = !active ? ArrowUpDown : sortDir === "asc" ? ArrowUp : ArrowDown;
    return (
      <TableHead className={`text-left ${className}`}>
        <button
          type="button"
          onClick={() => toggleSort(sKey)}
          className={`inline-flex items-center gap-1 hover:text-foreground transition-colors ${active ? "text-foreground font-semibold" : ""}`}
        >
          {label}
          <Icon className={`h-3 w-3 ${active ? "opacity-100" : "opacity-50"}`} />
        </button>
      </TableHead>
    );
  };

  // KPIs
  const totalAssets = assets.length;
  const totalValue = assets.reduce((s, a) => s + a.purchasePrice, 0);
  const inWarranty = assets.filter(a => getWarrantyStatus(a) !== "expired").length;
  const overdueMaint = assets.filter(a => getMaintenanceStatus(a) === "overdue").length;

  const handleRowClick = (a: Asset) => {
    setSelected(a);
    setOpen(true);
  };

  const handleAddMaintenance = (m: AssetMaintenance) => {
    setMaintenances(prev => [m, ...prev]);
    appendLog({
      assetId: m.assetId,
      type: "maintenance",
      performedAt: new Date().toISOString(),
      summary: `Registrou manutenção (${m.company}, ${formatBRLFull(m.amountPaid)})`,
      source: "manual",
    });
  };

  const handleUpdatePhotos = (assetId: string, photos: string[]) => {
    let prevCount = 0;
    setAssets((prev) =>
      prev.map((a) => {
        if (a.id !== assetId) return a;
        prevCount = a.photos?.length ?? 0;
        return { ...a, photos };
      })
    );
    setSelected((prev) => (prev && prev.id === assetId ? { ...prev, photos } : prev));
    const diff = photos.length - prevCount;
    if (diff !== 0) {
      appendLog({
        assetId,
        type: "attachment",
        performedAt: new Date().toISOString(),
        summary: diff > 0
          ? `Adicionou ${diff} foto${diff > 1 ? "s" : ""} (total: ${photos.length})`
          : `Removeu ${Math.abs(diff)} foto${Math.abs(diff) > 1 ? "s" : ""} (total: ${photos.length})`,
        source: "manual",
      });
    }
  };

  const handleOpenCreate = () => {
    setFormMode("create");
    setFormInitial(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (a: Asset) => {
    setFormMode("edit");
    setFormInitial(a);
    setFormOpen(true);
  };

  const handleSubmit = (next: Asset, aiFileName?: string) => {
    if (formMode === "create") {
      const id = nextAssetId(assets);
      const created: Asset = { ...next, id };
      setAssets((prev) => [created, ...prev]);
      setSelected(created);
      appendLog({
        assetId: id,
        type: aiFileName ? "ai_extraction" : "create",
        performedAt: new Date().toISOString(),
        summary: aiFileName
          ? `Criou o ativo via extração IA (${aiFileName})`
          : "Cadastrou o ativo manualmente",
        source: aiFileName ? "ai" : "manual",
      });
      toast.success("Ativo criado com sucesso.");
    } else if (formInitial) {
      const merged: Asset = { ...next, id: formInitial.id };
      const changes = diffAsset(formInitial, merged);
      setAssets((prev) => prev.map((a) => (a.id === merged.id ? merged : a)));
      setSelected(merged);
      if (changes.length > 0) {
        appendLog({
          assetId: merged.id,
          type: "update",
          performedAt: new Date().toISOString(),
          summary: `Editou ${changes.length} ${changes.length === 1 ? "campo" : "campos"}`,
          changes,
          source: aiFileName ? "ai" : "manual",
        });
      }
      toast.success("Alterações salvas.");
    }
  };

  const handleAskDelete = (a: Asset) => {
    setDeleteTarget(a);
    setDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setAssets((prev) => prev.filter((a) => a.id !== id));
    setLogs((prev) => prev.filter((l) => l.assetId !== id));
    setDeleteOpen(false);
    setOpen(false);
    setSelected(null);
    toast.success(`Ativo ${deleteTarget.name} excluído.`);
    setDeleteTarget(null);
  };

  const deleteOpenTickets = deleteTarget ? (ticketsByAsset.get(deleteTarget.id) ?? 0) : 0;
  const selectedLogs = useMemo(
    () => (selected ? logs.filter((l) => l.assetId === selected.id) : []),
    [selected, logs]
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Gestão de Ativos</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Equipamentos físicos do ativo — compras, garantias, manutenções e chamados.
            </p>
          </div>
          {canManage && (
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" onClick={() => setCatOpen(true)} className="gap-1">
                <Tags className="h-4 w-4" /> Categorias
              </Button>
              <Button onClick={handleOpenCreate} className="gap-1">
                <Plus className="h-4 w-4" /> Novo Ativo
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          title="Total de Ativos"
          value={totalAssets}
          subtitle="Equipamentos cadastrados"
          icon={<Package className="h-5 w-5" />}
        />
        <KpiCard
          title="Valor Patrimonial"
          value={formatBRL(totalValue)}
          subtitle="Soma dos preços de compra"
          icon={<Coins className="h-5 w-5" />}
        />
        <KpiCard
          title="Em Garantia"
          value={`${inWarranty}/${totalAssets}`}
          subtitle="Garantia ativa ou prestes a vencer"
          icon={<ShieldCheck className="h-5 w-5" />}
        />
        <KpiCard
          title="Manutenções Vencidas"
          value={overdueMaint}
          subtitle={overdueMaint > 0 ? "Ação imediata necessária" : "Tudo em dia"}
          icon={<AlertTriangle className={`h-5 w-5 ${overdueMaint > 0 ? "text-destructive" : ""}`} />}
          className={overdueMaint > 0 ? "border border-destructive/30" : ""}
        />
      </div>

      {/* Filtros */}
      <Card className="p-4 rounded-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, marca, modelo..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categories.map(c => (
                <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={floor} onValueChange={setFloor}>
            <SelectTrigger><SelectValue placeholder="Localização" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os andares</SelectItem>
              {floors.map(f => (
                <SelectItem key={f} value={String(f)}>{formatFloor(f)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={warrantyFilter} onValueChange={setWarrantyFilter}>
            <SelectTrigger><SelectValue placeholder="Garantia" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas garantias</SelectItem>
              <SelectItem value="active">🟢 Ativa</SelectItem>
              <SelectItem value="expiring">🟡 Próx. vencer</SelectItem>
              <SelectItem value="expired">🔴 Vencida</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mt-3">
          <Select value={maintFilter} onValueChange={setMaintFilter}>
            <SelectTrigger><SelectValue placeholder="Manutenção" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas manutenções</SelectItem>
              <SelectItem value="ok">🟢 Em dia</SelectItem>
              <SelectItem value="due_soon">🟡 Próx. vencer</SelectItem>
              <SelectItem value="overdue">🔴 Vencida</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Tabela */}
      <Card className="rounded-2xl overflow-hidden">
        <div className="hidden overflow-x-auto md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <SortHeader label="Ativo" sKey="name" />
                <SortHeader label="Categoria" sKey="category" />
                <SortHeader label="Localização" sKey="floor" />
                <SortHeader label="Compra" sKey="purchaseDate" />
                <SortHeader label="Valor" sKey="purchasePrice" />
                <SortHeader label="Garantia" sKey="warranty" />
                <SortHeader label="Próx. Manutenção" sKey="nextMaintenance" />
                <SortHeader label="Chamados" sKey="tickets" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-10">
                    Nenhum ativo encontrado com os filtros atuais.
                  </TableCell>
                </TableRow>
              )}
              {sorted.map(a => {
                const Icon = getCategoryIcon(a.category);
                const w = getWarrantyStatus(a);
                const m = getMaintenanceStatus(a);
                const open = ticketsByAsset.get(a.id) ?? 0;
                return (
                  <TableRow
                    key={a.id}
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() => handleRowClick(a)}
                  >
                    <TableCell className="text-left">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-interactive shrink-0">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{a.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{a.brand} · {a.model}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-left text-sm">{categoryLabels[a.category] ?? a.category}</TableCell>
                    <TableCell className="text-left text-sm">{formatFloor(a.floor)}</TableCell>
                    <TableCell className="text-left text-sm">{fmt(a.purchaseDate)}</TableCell>
                    <TableCell className="text-left text-sm font-medium">{formatBRLFull(a.purchasePrice)}</TableCell>
                    <TableCell className="text-left">
                      <div className="flex flex-col gap-0.5">
                        <Badge className={`text-xs ${warrantyChip[w].className} w-fit`}>{warrantyChip[w].label}</Badge>
                        <span className="text-xs text-muted-foreground">até {fmt(a.warranty.endDate)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-left">
                      <div className="flex flex-col gap-0.5">
                        <Badge className={`text-xs ${maintChip[m].className} w-fit`}>{maintChip[m].label}</Badge>
                        <span className="text-xs text-muted-foreground">{fmt(a.nextMaintenanceDate)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-left text-sm">
                      {open > 0 ? (
                        <Badge variant="outline" className="text-xs">{open} aberto{open > 1 ? "s" : ""}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <div className="divide-y md:hidden">
          {sorted.map(a => { const Icon = getCategoryIcon(a.category); const w = getWarrantyStatus(a); const m = getMaintenanceStatus(a); const ticketCount = ticketsByAsset.get(a.id) ?? 0; return <button key={a.id} onClick={() => handleRowClick(a)} className="block min-h-11 w-full space-y-3 p-4 text-left active:bg-muted/50"><div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-interactive"><Icon className="h-5 w-5" /></div><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{a.name}</p><p className="text-xs text-muted-foreground">{a.brand} · {a.model}</p></div><Badge variant="outline">{categoryLabels[a.category] ?? a.category}</Badge></div><div className="grid grid-cols-2 gap-2 text-xs"><div><span className="block text-muted-foreground">Localização</span><strong>{formatFloor(a.floor)}</strong></div><div><span className="block text-muted-foreground">Valor</span><strong>{formatBRLFull(a.purchasePrice)}</strong></div><div><span className="block text-muted-foreground">Garantia</span><Badge className={`${warrantyChip[w].className} mt-1`}>{warrantyChip[w].label}</Badge></div><div><span className="block text-muted-foreground">Manutenção</span><Badge className={`${maintChip[m].className} mt-1`}>{maintChip[m].label}</Badge></div></div>{ticketCount > 0 && <p className="text-xs text-muted-foreground">{ticketCount} chamado{ticketCount > 1 ? 's' : ''} aberto{ticketCount > 1 ? 's' : ''}</p>}</button>; })}
          {sorted.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">Nenhum ativo encontrado com os filtros atuais.</p>}
        </div>
      </Card>

      <AssetDrawer
        asset={selected}
        maintenances={maintenances}
        logs={selectedLogs}
        open={open}
        onOpenChange={setOpen}
        onAddMaintenance={handleAddMaintenance}
        canManage={canManage}
        onEdit={(a) => { setOpen(false); handleOpenEdit(a); }}
        onDelete={handleAskDelete}
        onUpdatePhotos={handleUpdatePhotos}
      />

      <AssetFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        initial={formInitial}
        buildingId="b1"
        onSubmit={handleSubmit}
        categories={categories}
      />

      <AssetDeleteDialog
        asset={deleteTarget}
        openTickets={deleteOpenTickets}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={confirmDelete}
      />

      <AssetCategoryManager
        open={catOpen}
        onOpenChange={setCatOpen}
        categories={categories}
        assets={assets}
        onChange={setCategories}
      />
    </div>
  );
};

export default Ativos;
