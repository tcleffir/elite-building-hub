import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  FileText, Download, Phone, Mail, ShieldCheck, Wrench, Ticket as TicketIcon,
  Calendar, Plus, ExternalLink, Building2, MapPin, Tag, User as UserIcon, Truck,
  Pencil, Trash2, History,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Asset, AssetMaintenance, getCategoryIcon, categoryLabels, statusLabels,
  periodicityLabels, formatBRLFull, formatFloor, getWarrantyStatus, getMaintenanceStatus,
  getAssetHealth, daysBetween, AssetChangeLog,
} from "@/lib/assets-data";
import { mockTickets } from "@/lib/mock-data";
import AssetMaintenanceDialog from "./AssetMaintenanceDialog";
import AssetHistoryTab from "./AssetHistoryTab";
import PhotoCapture from "./PhotoCapture";
import { toast } from "sonner";

interface Props {
  asset: Asset | null;
  maintenances: AssetMaintenance[];
  logs?: AssetChangeLog[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddMaintenance: (m: AssetMaintenance) => void;
  canManage?: boolean;
  onEdit?: (asset: Asset) => void;
  onDelete?: (asset: Asset) => void;
  onUpdatePhotos?: (assetId: string, photos: string[]) => void;
}

const fmtDate = (iso: string) => format(parseISO(iso), "dd/MM/yyyy", { locale: ptBR });

const healthBadge = {
  healthy: { label: "🟢 Saudável", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
  warning: { label: "🟡 Atenção", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  critical: { label: "🔴 Crítico", className: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300" },
} as const;

const warrantyBadge = {
  active: { label: "🟢 Ativa", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
  expiring: { label: "🟡 Vence em breve", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  expired: { label: "🔴 Vencida", className: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300" },
} as const;

const maintBadge = {
  ok: { label: "🟢 Em dia", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
  due_soon: { label: "🟡 Próxima vencer", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  overdue: { label: "🔴 Vencida", className: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300" },
} as const;

const AssetDrawer = ({
  asset, maintenances, logs = [], open, onOpenChange, onAddMaintenance,
  canManage = false, onEdit, onDelete, onUpdatePhotos,
}: Props) => {
  const navigate = useNavigate();
  const [showDialog, setShowDialog] = useState(false);

  const assetMaintenances = useMemo(
    () => (asset ? maintenances.filter(m => m.assetId === asset.id).sort((a, b) => b.performedAt.localeCompare(a.performedAt)) : []),
    [asset, maintenances]
  );

  const linkedTickets = useMemo(
    () => (asset ? mockTickets.filter(t => (t as any).asset_id === asset.id) : []),
    [asset]
  );

  const openTickets = linkedTickets.filter(t => !["completed", "cancelled"].includes(t.status)).length;

  if (!asset) return null;

  const Icon = getCategoryIcon(asset.category);
  const wStatus = getWarrantyStatus(asset);
  const mStatus = getMaintenanceStatus(asset);
  const health = getAssetHealth(asset, openTickets);
  const warrantyDaysLeft = daysBetween(asset.warranty.endDate);
  const maintenanceDaysLeft = daysBetween(asset.nextMaintenanceDate);

  const handleDownload = (name: string) => toast.info(`Download iniciado: ${name}`);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="center" className="overflow-y-auto">
          <SheetHeader>
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-interactive shrink-0">
                <Icon className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <SheetTitle className="text-left text-lg leading-tight truncate">{asset.name}</SheetTitle>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">{asset.id}</Badge>
                  <Badge variant="secondary" className="text-xs">{categoryLabels[asset.category] ?? asset.category}</Badge>
                  <Badge className={`text-xs ${healthBadge[health].className}`}>{healthBadge[health].label}</Badge>
                </div>
              </div>
              {canManage && (
                <div className="flex flex-col gap-1.5 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => onEdit?.(asset)} className="h-8 gap-1">
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onDelete?.(asset)} className="h-8 gap-1 text-destructive hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" /> Excluir
                  </Button>
                </div>
              )}
            </div>
          </SheetHeader>

          <Tabs defaultValue="overview" className="mt-4">
            <TabsList className="grid grid-cols-6 w-full">
              <TabsTrigger value="overview">Visão</TabsTrigger>
              <TabsTrigger value="purchase">Compra</TabsTrigger>
              <TabsTrigger value="warranty">Garantia</TabsTrigger>
              <TabsTrigger value="maintenance">Manutenção</TabsTrigger>
              <TabsTrigger value="tickets">Chamados</TabsTrigger>
              <TabsTrigger value="history" className="gap-1">
                <History className="h-3 w-3" /> <span className="hidden sm:inline">Histórico</span>
              </TabsTrigger>
            </TabsList>

            {/* Aba 1 — Visão Geral */}
            <TabsContent value="overview" className="space-y-3 mt-4">
              <Card className="p-4 rounded-2xl">
                <PhotoCapture
                  photos={asset.photos ?? []}
                  onChange={(p) => onUpdatePhotos?.(asset.id, p)}
                  label="Fotos do ativo"
                  max={6}
                />
                {!canManage && (asset.photos?.length ?? 0) === 0 && (
                  <p className="text-xs text-muted-foreground mt-2">Nenhuma foto cadastrada.</p>
                )}
              </Card>
              <Card className="p-4 rounded-2xl">
                <p className="text-sm text-muted-foreground">{asset.description ?? "—"}</p>
              </Card>
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-3 rounded-2xl">
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Tag className="h-3 w-3" /> Marca / Modelo</p>
                  <p className="text-sm font-medium mt-1">{asset.brand}</p>
                  <p className="text-xs text-muted-foreground">{asset.model}</p>
                </Card>
                <Card className="p-3 rounded-2xl">
                  <p className="text-xs text-muted-foreground">Nº de série</p>
                  <p className="text-sm font-medium mt-1 break-all">{asset.serialNumber}</p>
                </Card>
                <Card className="p-3 rounded-2xl">
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Building2 className="h-3 w-3" /> Localização</p>
                  <p className="text-sm font-medium mt-1">{formatFloor(asset.floor)}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> {asset.area}</p>
                </Card>
                <Card className="p-3 rounded-2xl">
                  <p className="text-xs text-muted-foreground">Status operacional</p>
                  <Badge variant="outline" className="mt-1">{statusLabels[asset.status]}</Badge>
                </Card>
              </div>
              <Card className="p-4 rounded-2xl space-y-2">
                <p className="text-sm font-semibold">Indicador de saúde</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge className={warrantyBadge[wStatus].className}>Garantia: {warrantyBadge[wStatus].label}</Badge>
                  <Badge className={maintBadge[mStatus].className}>Manutenção: {maintBadge[mStatus].label}</Badge>
                  <Badge variant="outline">Chamados abertos: {openTickets}</Badge>
                </div>
              </Card>
            </TabsContent>

            {/* Aba 2 — Compra & NF */}
            <TabsContent value="purchase" className="space-y-3 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-3 rounded-2xl">
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Data de compra</p>
                  <p className="text-sm font-medium mt-1">{fmtDate(asset.purchaseDate)}</p>
                </Card>
                <Card className="p-3 rounded-2xl">
                  <p className="text-xs text-muted-foreground">Valor pago</p>
                  <p className="text-sm font-semibold mt-1">{formatBRLFull(asset.purchasePrice)}</p>
                </Card>
                <Card className="p-3 rounded-2xl">
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Truck className="h-3 w-3" /> Fornecedor</p>
                  <p className="text-sm font-medium mt-1">{asset.supplier}</p>
                </Card>
                <Card className="p-3 rounded-2xl">
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><UserIcon className="h-3 w-3" /> Comprador</p>
                  <p className="text-sm font-medium mt-1">{asset.buyer}</p>
                </Card>
                <Card className="p-3 rounded-2xl">
                  <p className="text-xs text-muted-foreground">Instalação</p>
                  <p className="text-sm font-medium mt-1">{fmtDate(asset.installationDate)}</p>
                  <p className="text-xs text-muted-foreground">{asset.installer}</p>
                </Card>
                <Card className="p-3 rounded-2xl">
                  <p className="text-xs text-muted-foreground">Local de instalação</p>
                  <p className="text-sm font-medium mt-1">{asset.installationLocation}</p>
                </Card>
              </div>
              <Card className="p-4 rounded-2xl">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold flex items-center gap-2"><FileText className="h-4 w-4" /> Nota Fiscal</p>
                    <p className="text-xs text-muted-foreground mt-1">{asset.invoice.number} · emitida em {fmtDate(asset.invoice.issuedAt)}</p>
                    <p className="text-xs text-muted-foreground truncate">{asset.invoice.fileName}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleDownload(asset.invoice.fileName)}>
                    <Download className="h-4 w-4 mr-1" /> Baixar
                  </Button>
                </div>
              </Card>
            </TabsContent>

            {/* Aba 3 — Garantia */}
            <TabsContent value="warranty" className="space-y-3 mt-4">
              <Card className="p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Garantia</p>
                  <Badge className={warrantyBadge[wStatus].className}>{warrantyBadge[wStatus].label}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Tipo</p>
                    <p className="font-medium">{asset.warranty.type === "manufacturer" ? "Fabricante" : "Estendida"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Período</p>
                    <p className="font-medium">{fmtDate(asset.warranty.startDate)} → {fmtDate(asset.warranty.endDate)}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Tempo restante</p>
                    <p className="font-semibold">
                      {warrantyDaysLeft < 0
                        ? `Vencida há ${Math.abs(warrantyDaysLeft)} dias`
                        : `${warrantyDaysLeft} dias restantes`}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Termos</p>
                  <p className="text-sm">{asset.warranty.terms}</p>
                </div>
                {asset.warranty.termFileName && (
                  <div className="flex items-center justify-between border-t pt-3">
                    <p className="text-xs text-muted-foreground truncate">{asset.warranty.termFileName}</p>
                    <Button size="sm" variant="outline" onClick={() => handleDownload(asset.warranty.termFileName!)}>
                      <Download className="h-4 w-4 mr-1" /> Termo
                    </Button>
                  </div>
                )}
              </Card>
              <Card className="p-4 rounded-2xl space-y-2">
                <p className="text-sm font-semibold">Acionamento da garantia</p>
                <p className="text-sm">{asset.warranty.supplierContactName}</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <a href={`tel:${asset.warranty.supplierContactPhone.replace(/\D/g, "")}`}>
                      <Phone className="h-4 w-4 mr-1" /> {asset.warranty.supplierContactPhone}
                    </a>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <a href={`mailto:${asset.warranty.supplierContactEmail}`}>
                      <Mail className="h-4 w-4 mr-1" /> E-mail
                    </a>
                  </Button>
                </div>
              </Card>
            </TabsContent>

            {/* Aba 4 — Manutenção */}
            <TabsContent value="maintenance" className="space-y-3 mt-4">
              <Card className="p-4 rounded-2xl">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-sm font-semibold flex items-center gap-2"><Wrench className="h-4 w-4" /> Periodicidade</p>
                    <p className="text-xs text-muted-foreground mt-1">{periodicityLabels[asset.periodicity]}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Próxima manutenção</p>
                    <p className="text-sm font-semibold">{fmtDate(asset.nextMaintenanceDate)}</p>
                    <Badge className={`text-xs mt-1 ${maintBadge[mStatus].className}`}>
                      {maintenanceDaysLeft < 0
                        ? `Atrasada ${Math.abs(maintenanceDaysLeft)}d`
                        : `${maintenanceDaysLeft}d restantes`}
                    </Badge>
                  </div>
                </div>
              </Card>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Histórico ({assetMaintenances.length})</p>
                <Button size="sm" onClick={() => setShowDialog(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Registrar Manutenção
                </Button>
              </div>
              <div className="space-y-2">
                {assetMaintenances.length === 0 && (
                  <Card className="p-4 rounded-2xl text-center text-sm text-muted-foreground">
                    Nenhuma manutenção registrada.
                  </Card>
                )}
                {assetMaintenances.map(m => (
                  <Card key={m.id} className="p-3 rounded-2xl">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{m.company}</p>
                        <p className="text-xs text-muted-foreground">{m.technician} · {fmtDate(m.performedAt)}</p>
                        {m.notes && <p className="text-xs text-muted-foreground mt-1">{m.notes}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold">{formatBRLFull(m.amountPaid)}</p>
                        <p className="text-xs text-muted-foreground">Validade: {fmtDate(m.validUntil)}</p>
                        <p className="text-xs text-muted-foreground">Garantia: {m.serviceWarrantyDays}d</p>
                      </div>
                    </div>
                    {m.invoice && (
                      <div className="flex items-center justify-between mt-2 pt-2 border-t">
                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                          <FileText className="h-3 w-3" /> {m.invoice.number} · {m.invoice.fileName}
                        </p>
                        <Button size="sm" variant="ghost" onClick={() => handleDownload(m.invoice!.fileName)}>
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Aba 5 — Chamados */}
            <TabsContent value="tickets" className="space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <TicketIcon className="h-4 w-4" /> Chamados vinculados ({linkedTickets.length})
                </p>
                <Button size="sm" onClick={() => navigate(`/chamados?asset=${asset.id}`)}>
                  <Plus className="h-4 w-4 mr-1" /> Novo Chamado
                </Button>
              </div>
              {linkedTickets.length === 0 && (
                <Card className="p-4 rounded-2xl text-center text-sm text-muted-foreground">
                  Nenhum chamado vinculado a este ativo.
                </Card>
              )}
              {linkedTickets.map(t => (
                <Card
                  key={t.id}
                  className="p-3 rounded-2xl cursor-pointer hover:bg-muted/50 transition"
                  onClick={() => navigate("/chamados")}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{t.id}</p>
                      <p className="text-sm font-medium truncate">{t.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{t.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge variant="outline" className="text-xs">{t.status}</Badge>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Aberto em {fmtDate(t.created_at.slice(0, 10))}</p>
                </Card>
              ))}
            </TabsContent>

            {/* Aba 6 — Histórico */}
            <TabsContent value="history" className="mt-4">
              <AssetHistoryTab logs={logs} />
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      <AssetMaintenanceDialog
        asset={asset}
        open={showDialog}
        onOpenChange={setShowDialog}
        onSave={onAddMaintenance}
      />
    </>
  );
};

export default AssetDrawer;
