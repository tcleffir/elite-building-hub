import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Building2, Upload, Download, Edit, RefreshCw, Info, FileText, Ticket as TicketIcon, Wrench, Mail, ListChecks, Plus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatusBadge from "@/components/StatusBadge";
import StackingPlan from "@/components/assets/StackingPlan";

import { mockBuildings, mockTenantContracts, mockTickets, mockUsers, isHGRE11Asset, TenantContract } from "@/lib/mock-data";
import { getContractHealth, getOccupancyStatus, daysUntil, healthColors, healthLabels } from "@/lib/health-utils";
import { toast } from "sonner";
import { useApp } from "@/contexts/AppContext";

const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR')}`;
const contractTypeLabels: Record<string, string> = { net: 'Net', gross: 'Gross', 'semi-gross': 'Semi-gross' };
const contractTypeTooltips: Record<string, string> = {
  net: 'Locatário arca com todas as despesas operacionais',
  gross: 'Proprietário arca com todas as despesas operacionais',
  'semi-gross': 'Despesas operacionais compartilhadas',
};

const floorStatusColors: Record<string, string> = {
  occupied: "bg-success/20 border-success text-success",
  partial: "bg-amber-100 border-amber-400 text-amber-700 dark:bg-amber-900/20 dark:border-amber-600 dark:text-amber-400",
  vacant: "bg-muted border-border text-muted-foreground",
};

const legendItems = [
  { status: 'occupied', label: 'Ocupado', color: 'bg-success/20 border-success' },
  { status: 'partial', label: 'Parcial', color: 'bg-amber-100 border-amber-400 dark:bg-amber-900/20 dark:border-amber-600' },
  { status: 'vacant', label: 'Vago', color: 'bg-muted border-border' },
];

const getContractStatus = (endDate: string) => {
  const now = new Date();
  const end = new Date(endDate);
  const diffMs = end.getTime() - now.getTime();
  const months = Math.round(diffMs / (1000 * 60 * 60 * 24 * 30));
  if (months < 0) return { label: `VENCIDO há ${Math.abs(months)}m`, color: 'text-red-600', icon: '🔴' };
  if (months < 6) return { label: `Vence em ${months}m`, color: 'text-red-500', icon: '🔴' };
  if (months < 12) return { label: `${months}m restantes`, color: 'text-amber-500', icon: '🟡' };
  return { label: `${months}m restantes`, color: 'text-green-600', icon: '🟢' };
};

interface SynthFloor {
  floor: number;
  label: string;
  status: 'occupied' | 'partial' | 'vacant';
  units: TenantContract[];
  tenantSummary: string;
  area_m2: number;
  tickets_count: number;
}

const ProprietarioEdificios = () => {
  const { user } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>(searchParams.get('building') || '');
  const [selectedContract, setSelectedContract] = useState<TenantContract | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<SynthFloor | null>(null);

  // Dialogs
  const [showEdit, setShowEdit] = useState(false);
  const [showRenew, setShowRenew] = useState(false);
  const [showNewBuilding, setShowNewBuilding] = useState(false);
  const [showNewTenant, setShowNewTenant] = useState(false);
  const [newBuilding, setNewBuilding] = useState({ name: '', city: '', state: '', segment: 'office', floors: '', gla: '', address: '' });
  const [newTenant, setNewTenant] = useState({ name: '', unit: '', floor: '', area: '', pricePerM2: '', start: '', end: '', contact: '', email: '' });
  const [editForm, setEditForm] = useState({ tenant: '', type: 'net', area: '', price: '', start: '', end: '' });
  const [renewForm, setRenewForm] = useState({ endDate: '', value: '', index: '4.82' });

  useEffect(() => {
    const bp = searchParams.get('building');
    if (bp) setSelectedBuildingId(bp);
  }, [searchParams]);

  // For the Proprietário module, scope to the fund manager's portfolio (HGRE11 assets)
  const fundManager = mockUsers.find(u => u.role === 'gestor_fundo');
  const allowedBuildingIds: string[] = fundManager?.building_ids ?? user.building_ids;
  const userBuildings = mockBuildings.filter(b => (allowedBuildingIds.includes(b.id) || isHGRE11Asset(b.id)) && b.segment);
  const building = userBuildings.find(b => b.id === selectedBuildingId);
  const contracts = useMemo(() => mockTenantContracts.filter(c => c.building_id === selectedBuildingId), [selectedBuildingId]);
  const buildingTickets = useMemo(() => mockTickets.filter(t => t.building_id === selectedBuildingId && t.status !== 'completed' && t.status !== 'cancelled'), [selectedBuildingId]);

  const synthFloors = useMemo<SynthFloor[]>(() => {
    const floorMap = new Map<number, TenantContract[]>();
    contracts.forEach(c => {
      const digits = c.unit_id.replace(/\D/g, '');
      const floor = digits.length >= 2 ? parseInt(digits.charAt(0)) : parseInt(digits) || 1;
      if (!floorMap.has(floor)) floorMap.set(floor, []);
      floorMap.get(floor)!.push(c);
    });
    if (building) {
      const maxFloor = Math.max(...Array.from(floorMap.keys()), 0);
      const totalFloors = Math.max(maxFloor, Math.min(building.total_floors || maxFloor, 20));
      for (let f = 1; f <= totalFloors; f++) {
        if (!floorMap.has(f)) floorMap.set(f, []);
      }
    }
    return Array.from(floorMap.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([floor, units]) => {
        const occupied = units.filter(u => u.status !== 'vacant');
        const totalArea = units.reduce((s, u) => s + u.area_m2, 0);
        let status: 'occupied' | 'partial' | 'vacant' = 'vacant';
        if (units.length > 0 && occupied.length === units.length) status = 'occupied';
        else if (occupied.length > 0) status = 'partial';
        const tenantNames = occupied.map(u => u.tenant_name).filter(Boolean) as string[];
        let tenantSummary = 'Disponível';
        if (tenantNames.length === 1) tenantSummary = tenantNames[0];
        else if (tenantNames.length > 1) tenantSummary = `${tenantNames[0]} +${tenantNames.length - 1}`;
        const tickets_count = buildingTickets.filter(t => t.floor === floor).length;
        return { floor, label: `${floor}º`, status, units, tenantSummary, area_m2: totalArea, tickets_count };
      });
  }, [contracts, building, buildingTickets]);

  const occupiedCount = synthFloors.filter(f => f.status === 'occupied').length;
  const partialCount = synthFloors.filter(f => f.status === 'partial').length;
  const vacantCount = synthFloors.filter(f => f.status === 'vacant').length;
  const totalUnits = contracts.length;
  const occupiedUnits = contracts.filter(c => c.status !== 'vacant').length;

  const openEdit = (c: TenantContract) => {
    setEditForm({
      tenant: c.tenant_name,
      type: c.contract_type || 'net',
      area: String(c.area_m2),
      price: String(c.price_per_m2 || 0),
      start: c.contract_start || '',
      end: c.contract_end || '',
    });
    setShowEdit(true);
  };

  const openRenew = (c: TenantContract) => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 2);
    const monthlyTotal = c.area_m2 * (c.price_per_m2 || 0);
    setRenewForm({
      endDate: futureDate.toISOString().split('T')[0],
      value: String(monthlyTotal),
      index: '4.82',
    });
    setShowRenew(true);
  };

  const renewPreviewValue = useMemo(() => {
    const val = parseFloat(renewForm.value) || 0;
    const idx = parseFloat(renewForm.index) || 0;
    return val * (1 + idx / 100);
  }, [renewForm.value, renewForm.index]);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:flex-wrap">
          {building && (
            <Button variant="ghost" size="sm" onClick={() => setSelectedBuildingId('')} className="gap-1">
              <ArrowLeft size={16} /> Portfólio
            </Button>
          )}
          <h2 className="text-lg font-semibold">Mapa de Ativos</h2>
          <Select value={selectedBuildingId} onValueChange={setSelectedBuildingId}>
            <SelectTrigger className="w-full sm:w-[280px]"><SelectValue placeholder="Selecione o ativo" /></SelectTrigger>
            <SelectContent>
              {userBuildings.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {building && (
            <Badge className={`${healthColors[getOccupancyStatus(building.occupancy_pct || 0)].badge} text-xs`}>
              {building.occupancy_pct}% ocupação
            </Badge>
          )}
          <div className="grid grid-cols-1 gap-2 sm:ml-auto sm:flex sm:items-center sm:flex-wrap">
            <Button size="sm" className="text-xs gap-1" onClick={() => setShowNewBuilding(true)}>
              <Plus size={12} /> Adicionar Ativo
            </Button>
            {building && (
              <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => setShowNewTenant(true)}>
                <UserPlus size={12} /> Adicionar Locatário
              </Button>
            )}
            {building && (
              <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => navigate('/proprietario/contratos')}>
                <ListChecks size={12} /> Ver Lista de Contratos
              </Button>
            )}
          </div>
        </div>

        {!building ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Selecione um ativo abaixo para abrir o mapa de unidades — {userBuildings.length} ativos no portfólio.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {userBuildings.map(b => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBuildingId(b.id)}
                  className="text-left bg-card rounded-2xl p-4 premium-shadow border hover:border-interactive transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-foreground flex items-center gap-2">
                        <Building2 size={15} /> {b.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{b.city}/{b.state}</p>
                    </div>
                    <Badge className={`${healthColors[getOccupancyStatus(b.occupancy_pct || 0)].badge} text-[10px]`}>
                      {b.occupancy_pct}% ocup.
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    {(b.gla_m2 || b.total_area_m2 || 0).toLocaleString('pt-BR')} m² · {b.total_floors || 0} andares
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Header info */}
            <div>
              <p className="text-sm text-muted-foreground">
                {building.name} — {building.total_floors} andares • {(building.gla_m2 || 0).toLocaleString('pt-BR')} m² GLA • {occupiedUnits}/{totalUnits} unidades ocupadas
              </p>
            </div>

            {/* Stacking Plan — andar por andar, com áreas BOMA/NBR e custos por m² */}
            <StackingPlan
              buildingName={building.name}
              totalFloors={building.total_floors}
              contracts={contracts}
              tickets={buildingTickets as any}
              levelLabel={building.segment === 'logistics' ? 'conjunto' : 'andar'}
              onOpenContract={(c) => setSelectedContract(c)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-card rounded-2xl p-5 premium-shadow text-center">
                <p className="text-3xl font-bold text-success">{occupiedCount}</p>
                <p className="text-sm text-muted-foreground mt-1">Andares Ocupados</p>
              </div>
              <div className="bg-card rounded-2xl p-5 premium-shadow text-center">
                <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{partialCount}</p>
                <p className="text-sm text-muted-foreground mt-1">Parcialmente Ocupados</p>
              </div>
              <div className="bg-card rounded-2xl p-5 premium-shadow text-center">
                <p className="text-3xl font-bold text-muted-foreground tabular-nums">{vacantCount}</p>
                <p className="text-sm text-muted-foreground mt-1">Andares Vagos</p>
              </div>
            </div>

          </>
        )}

        {/* Floor Detail Sheet */}
        <Sheet open={!!selectedFloor} onOpenChange={(v) => !v && setSelectedFloor(null)}>
          <SheetContent side="center" className="overflow-y-auto p-0">
            {selectedFloor && (
              <>
                <div className="sticky top-0 bg-card z-10 border-b p-5">
                  <SheetHeader>
                    <SheetTitle className="text-left">{selectedFloor.label} Andar</SheetTitle>
                  </SheetHeader>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedFloor.units.length > 0
                      ? `${selectedFloor.units.length} unidade(s) • ${selectedFloor.area_m2.toLocaleString('pt-BR')} m²`
                      : 'Sem unidades cadastradas'}
                  </p>
                </div>
                <Tabs defaultValue="general">
                  <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-5 h-auto py-0">
                    <TabsTrigger value="general" className="rounded-none border-b-2 border-transparent data-[state=active]:border-interactive data-[state=active]:bg-transparent py-3 text-sm">Geral</TabsTrigger>
                    <TabsTrigger value="tenants" className="rounded-none border-b-2 border-transparent data-[state=active]:border-interactive data-[state=active]:bg-transparent py-3 text-sm">Unidades</TabsTrigger>
                    <TabsTrigger value="tickets" className="rounded-none border-b-2 border-transparent data-[state=active]:border-interactive data-[state=active]:bg-transparent py-3 text-sm">Chamados</TabsTrigger>
                  </TabsList>

                  <TabsContent value="general" className="p-5 space-y-4 mt-0">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-muted/50 rounded-xl p-4">
                        <p className="text-xs text-muted-foreground">Área Total</p>
                        <p className="text-lg font-bold">{selectedFloor.area_m2.toLocaleString('pt-BR')} m²</p>
                      </div>
                      <div className="bg-muted/50 rounded-xl p-4">
                        <p className="text-xs text-muted-foreground">Unidades</p>
                        <p className="text-lg font-bold">{selectedFloor.units.length}</p>
                      </div>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-4">
                      <p className="text-xs text-muted-foreground">Status</p>
                      <StatusBadge status={selectedFloor.status === 'occupied' ? 'active' : selectedFloor.status === 'vacant' ? 'terminated' : 'expiring'} />
                    </div>
                  </TabsContent>

                  <TabsContent value="tenants" className="p-5 mt-0">
                    {selectedFloor.units.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">Nenhuma unidade cadastrada neste andar</p>
                    ) : (
                      <div className="space-y-3">
                        {selectedFloor.units.map(unit => {
                          const isVacant = unit.status === 'vacant';
                          const status = unit.contract_end ? getContractStatus(unit.contract_end) : null;
                          const health = unit.contract_end ? getContractHealth(unit.contract_end) : undefined;
                          return (
                            <button
                              key={unit.id}
                              onClick={() => { setSelectedContract(unit); setSelectedFloor(null); }}
                              className={`w-full rounded-xl border p-4 text-left transition-all hover:shadow-md ${
                                isVacant ? 'bg-background border-dashed border-muted-foreground/30' :
                                health === 'critical' ? 'bg-rose-50 border-rose-300 dark:bg-rose-950/20' :
                                health === 'warning' ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/20' :
                                'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <p className="text-sm font-bold">{unit.unit_id}</p>
                                <p className="text-[10px] text-muted-foreground">{unit.area_m2} m²</p>
                              </div>
                              <p className={`text-xs ${isVacant ? 'text-muted-foreground italic' : 'text-foreground'}`}>
                                {isVacant ? 'DISPONÍVEL' : unit.tenant_name}
                              </p>
                              {!isVacant && status && (
                                <p className={`text-[10px] mt-1 font-medium ${status.color}`}>
                                  {status.icon} {status.label}
                                </p>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="tickets" className="p-5 mt-0">
                    {buildingTickets.filter(t => t.floor === selectedFloor.floor).length > 0 ? (
                      <div className="space-y-2">
                        {buildingTickets.filter(t => t.floor === selectedFloor.floor).map(t => (
                          <div key={t.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                            <div>
                              <p className="text-sm font-medium">{t.id} — {t.title}</p>
                              <p className="text-xs text-muted-foreground">{t.category}</p>
                            </div>
                            <div className="flex gap-2">
                              <StatusBadge status={t.priority} type="priority" />
                              <StatusBadge status={t.status} />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">Nenhum chamado neste andar</p>
                    )}
                  </TabsContent>
                </Tabs>
              </>
            )}
          </SheetContent>
        </Sheet>

        {/* Unit Detail Drawer */}
        <Sheet open={!!selectedContract} onOpenChange={() => setSelectedContract(null)}>
          <SheetContent side="center" className="overflow-y-auto">
            {selectedContract && (() => {
              const isVacant = selectedContract.status === 'vacant';
              const health = selectedContract.contract_end ? getContractHealth(selectedContract.contract_end) : undefined;
              const days = selectedContract.contract_end ? daysUntil(selectedContract.contract_end) : 0;
              const monthlyTotal = selectedContract.area_m2 * (selectedContract.price_per_m2 || 0);
              const status = selectedContract.contract_end ? getContractStatus(selectedContract.contract_end) : null;
              const unitTickets = buildingTickets.filter(t => {
                const unitFloor = parseInt(selectedContract.unit_id.replace(/\D/g, '').charAt(0)) || 0;
                return t.floor === unitFloor;
              });

              return (
                <>
                  <SheetHeader>
                    <SheetTitle>Detalhes — {selectedContract.unit_id}</SheetTitle>
                  </SheetHeader>
                  <div className="space-y-6 mt-4">
                    {isVacant ? (
                      <div className="space-y-4">
                        <div className="text-center py-4">
                          <Building2 size={40} className="mx-auto text-muted-foreground/40 mb-2" />
                          <p className="text-sm font-medium">Unidade disponível para locação</p>
                          <p className="text-xs text-muted-foreground mt-1">Área: <span className="font-semibold">{selectedContract.area_m2} m²</span></p>
                        </div>
                        <div>
                          <Label className="text-xs">Valor de mercado estimado (R$/m²)</Label>
                          <Input type="number" defaultValue="135" className="mt-1" />
                        </div>
                        <Button className="w-full gap-2"><Mail size={16} /> Enviar Proposta</Button>
                      </div>
                    ) : (
                      <>
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Contrato</h4>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-xs text-muted-foreground">Locatário</p>
                              <p className="font-semibold">{selectedContract.tenant_name}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                Tipo
                                <Tooltip>
                                  <TooltipTrigger><Info size={12} className="text-muted-foreground" /></TooltipTrigger>
                                  <TooltipContent className="max-w-xs">
                                    <p>{selectedContract.contract_type ? contractTypeTooltips[selectedContract.contract_type] : ''}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </p>
                              <p className="font-semibold">{selectedContract.contract_type ? contractTypeLabels[selectedContract.contract_type] : '-'}</p>
                            </div>
                            <div><p className="text-xs text-muted-foreground">Área</p><p className="font-semibold">{selectedContract.area_m2} m²</p></div>
                            <div><p className="text-xs text-muted-foreground">R$/m²</p><p className="font-semibold">R$ {selectedContract.price_per_m2}</p></div>
                            <div className="col-span-2"><p className="text-xs text-muted-foreground">Total mensal</p><p className="font-semibold text-lg">{fmt(monthlyTotal)}</p></div>
                            <div><p className="text-xs text-muted-foreground">Início</p><p className="font-semibold">{selectedContract.contract_start ? new Date(selectedContract.contract_start).toLocaleDateString('pt-BR') : '-'}</p></div>
                            <div>
                              <p className="text-xs text-muted-foreground">Fim</p>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold">{selectedContract.contract_end ? new Date(selectedContract.contract_end).toLocaleDateString('pt-BR') : '-'}</p>
                                {health && <Badge className={`${healthColors[health].badge} text-[9px]`}>{healthLabels[health].pt}</Badge>}
                              </div>
                            </div>
                            <div className="col-span-2">
                              <p className="text-xs text-muted-foreground">Tempo restante</p>
                              <p className={`font-semibold ${status?.color || ''}`}>
                                {status?.label || '—'}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-2 mt-4">
                            <Button variant="outline" className="w-full gap-2 text-sm" onClick={() => toast.info("Selecione o arquivo PDF")}><Upload size={16} /> Upload Contrato PDF</Button>
            <Button variant="outline" className="w-full gap-2 text-sm" onClick={() => {
                              if (selectedContract.contract_end) {
                                toast.success("Download iniciado");
                              } else {
                                toast("Nenhum contrato vinculado. Faça upload primeiro.", { icon: '⚠️' });
                              }
                            }}><Download size={16} /> Download Contrato</Button>
                            <Button variant="outline" className="w-full gap-2 text-sm" onClick={() => openEdit(selectedContract)}><Edit size={16} /> Editar</Button>
                            <Button className="w-full gap-2 text-sm" onClick={() => openRenew(selectedContract)}><RefreshCw size={16} /> Renovar</Button>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3 flex items-center gap-1"><TicketIcon size={12} /> Chamados Abertos</h4>
                          {unitTickets.length > 0 ? (
                            <div className="space-y-2">
                              {unitTickets.map(t => (
                                <div key={t.id} className="text-xs border rounded-lg p-2">
                                  <p className="font-medium">{t.title}</p>
                                  <p className="text-muted-foreground">{t.status} · {new Date(t.created_at).toLocaleDateString('pt-BR')}</p>
                                </div>
                              ))}
                            </div>
                          ) : <p className="text-sm text-muted-foreground italic">Sem chamados abertos</p>}
                        </div>

                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3 flex items-center gap-1"><Wrench size={12} /> Obras / Manutenções</h4>
                          <p className="text-sm text-muted-foreground italic">Nenhuma obra em andamento</p>
                        </div>

                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3 flex items-center gap-1"><FileText size={12} /> Documentos da Unidade</h4>
                          <p className="text-sm text-muted-foreground italic">Nenhum documento vinculado</p>
                          <Button variant="outline" size="sm" className="mt-2 gap-1 text-xs"><Upload size={12} /> Adicionar documento</Button>
                        </div>
                      </>
                    )}
                  </div>
                </>
              );
            })()}
          </SheetContent>
        </Sheet>

        {/* Edit Dialog */}
        <Dialog open={showEdit} onOpenChange={setShowEdit}>
          <DialogContent>
            <DialogHeader><DialogTitle>Editar Contrato — {selectedContract?.unit_id}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label className="text-xs">Locatário</Label><Input value={editForm.tenant} onChange={e => setEditForm(p => ({ ...p, tenant: e.target.value }))} /></div>
              <div><Label className="text-xs">Tipo</Label>
                <Select value={editForm.type} onValueChange={v => setEditForm(p => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="net">Net</SelectItem>
                    <SelectItem value="gross">Gross</SelectItem>
                    <SelectItem value="semi-gross">Semi-gross</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Área (m²)</Label><Input type="number" value={editForm.area} onChange={e => setEditForm(p => ({ ...p, area: e.target.value }))} /></div>
              <div><Label className="text-xs">R$/m²</Label><Input type="number" value={editForm.price} onChange={e => setEditForm(p => ({ ...p, price: e.target.value }))} /></div>
              <div><Label className="text-xs">Data Início</Label><Input type="date" value={editForm.start} onChange={e => setEditForm(p => ({ ...p, start: e.target.value }))} /></div>
              <div className="col-span-2"><Label className="text-xs">Data Fim</Label><Input type="date" value={editForm.end} onChange={e => setEditForm(p => ({ ...p, end: e.target.value }))} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEdit(false)}>Cancelar</Button>
              <Button onClick={() => { setShowEdit(false); toast.success("Contrato atualizado!"); }}>Salvar alterações</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Renew Dialog */}
        <Dialog open={showRenew} onOpenChange={setShowRenew}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Renovar contrato de {selectedContract?.tenant_name} — {selectedContract?.unit_id}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-xs">Nova data de fim</Label><Input type="date" value={renewForm.endDate} onChange={e => setRenewForm(p => ({ ...p, endDate: e.target.value }))} /></div>
              <div><Label className="text-xs">Valor mensal atual (R$)</Label><Input type="number" value={renewForm.value} onChange={e => setRenewForm(p => ({ ...p, value: e.target.value }))} /></div>
              <div><Label className="text-xs">Índice de reajuste (%)</Label><Input type="number" step="0.01" value={renewForm.index} onChange={e => setRenewForm(p => ({ ...p, index: e.target.value }))} /></div>
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Novo valor após reajuste:</p>
                <p className="text-lg font-bold">{fmt(renewPreviewValue)}</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRenew(false)}>Cancelar</Button>
              <Button onClick={() => { setShowRenew(false); toast.success("Contrato renovado com sucesso!"); }}>Confirmar Renovação</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Novo Ativo */}
        <Dialog open={showNewBuilding} onOpenChange={setShowNewBuilding}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar ativo</DialogTitle>
              <DialogDescription>Cadastre um novo ativo no portfólio do fundo.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label className="text-xs">Nome do ativo</Label><Input value={newBuilding.name} onChange={e => setNewBuilding(p => ({ ...p, name: e.target.value }))} placeholder="Ex.: Edifício Faria Lima 3477" /></div>
              <div className="col-span-2"><Label className="text-xs">Endereço</Label><Input value={newBuilding.address} onChange={e => setNewBuilding(p => ({ ...p, address: e.target.value }))} /></div>
              <div><Label className="text-xs">Município</Label><Input value={newBuilding.city} onChange={e => setNewBuilding(p => ({ ...p, city: e.target.value }))} /></div>
              <div><Label className="text-xs">UF</Label><Input value={newBuilding.state} onChange={e => setNewBuilding(p => ({ ...p, state: e.target.value }))} maxLength={2} /></div>
              <div><Label className="text-xs">Segmento</Label>
                <Select value={newBuilding.segment} onValueChange={v => setNewBuilding(p => ({ ...p, segment: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="office">Escritório</SelectItem>
                    <SelectItem value="logistics">Logística</SelectItem>
                    <SelectItem value="retail">Varejo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Andares / conjuntos</Label><Input type="number" value={newBuilding.floors} onChange={e => setNewBuilding(p => ({ ...p, floors: e.target.value }))} /></div>
              <div className="col-span-2"><Label className="text-xs">ABL / GLA (m²)</Label><Input type="number" value={newBuilding.gla} onChange={e => setNewBuilding(p => ({ ...p, gla: e.target.value }))} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewBuilding(false)}>Cancelar</Button>
              <Button
                disabled={!newBuilding.name}
                onClick={() => { setShowNewBuilding(false); toast.success(`Ativo ${newBuilding.name} cadastrado.`); setNewBuilding({ name: '', city: '', state: '', segment: 'office', floors: '', gla: '', address: '' }); }}
              >
                Salvar ativo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Novo Locatário */}
        <Dialog open={showNewTenant} onOpenChange={setShowNewTenant}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar locatário — {building?.name}</DialogTitle>
              <DialogDescription>Vincule um locatário a uma unidade do ativo selecionado.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label className="text-xs">Locatário</Label><Input value={newTenant.name} onChange={e => setNewTenant(p => ({ ...p, name: e.target.value }))} /></div>
              <div><Label className="text-xs">Unidade</Label><Input value={newTenant.unit} onChange={e => setNewTenant(p => ({ ...p, unit: e.target.value }))} placeholder="Ex.: 1201" /></div>
              <div><Label className="text-xs">Andar / conjunto</Label><Input type="number" value={newTenant.floor} onChange={e => setNewTenant(p => ({ ...p, floor: e.target.value }))} /></div>
              <div><Label className="text-xs">Área (m²)</Label><Input type="number" value={newTenant.area} onChange={e => setNewTenant(p => ({ ...p, area: e.target.value }))} /></div>
              <div><Label className="text-xs">R$/m²</Label><Input type="number" value={newTenant.pricePerM2} onChange={e => setNewTenant(p => ({ ...p, pricePerM2: e.target.value }))} /></div>
              <div><Label className="text-xs">Início do contrato</Label><Input type="date" value={newTenant.start} onChange={e => setNewTenant(p => ({ ...p, start: e.target.value }))} /></div>
              <div><Label className="text-xs">Fim do contrato</Label><Input type="date" value={newTenant.end} onChange={e => setNewTenant(p => ({ ...p, end: e.target.value }))} /></div>
              <div><Label className="text-xs">Contato</Label><Input value={newTenant.contact} onChange={e => setNewTenant(p => ({ ...p, contact: e.target.value }))} /></div>
              <div><Label className="text-xs">E-mail</Label><Input type="email" value={newTenant.email} onChange={e => setNewTenant(p => ({ ...p, email: e.target.value }))} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewTenant(false)}>Cancelar</Button>
              <Button
                disabled={!newTenant.name || !newTenant.unit}
                onClick={() => { setShowNewTenant(false); toast.success(`Locatário ${newTenant.name} vinculado à unidade ${newTenant.unit}.`); setNewTenant({ name: '', unit: '', floor: '', area: '', pricePerM2: '', start: '', end: '', contact: '', email: '' }); }}
              >
                Salvar locatário
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default ProprietarioEdificios;
