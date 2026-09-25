import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Building2, Upload, Download, Edit, RefreshCw, Info, FileText, Ticket as TicketIcon, Wrench, Mail, ListChecks, Plus, UserPlus, Trash2, UserMinus } from "lucide-react";
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

import { mockBuildings, mockTenantContracts, mockTickets, mockUsers, isHGRE11Asset, TenantContract, upsertTenantContract, removeTenantContract, vacateTenantContract, floorOfContract, TENANT_CONTRACTS_EVENT } from "@/lib/mock-data";
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
  const emptyTenant = { name: '', cnpj: '', target: 'new', unit: '', floor: '', area: '', pricePerM2: '', start: '', end: '', contact: '', email: '', dueDay: '10', index: 'IPCA', garantia: 'Fiança bancária' };
  const [newTenant, setNewTenant] = useState<typeof emptyTenant>(emptyTenant);
  const [showNewUnit, setShowNewUnit] = useState(false);
  const [newUnit, setNewUnit] = useState({ floor: '', unit: '', area: '' });
  const [storeVersion, setStoreVersion] = useState(0);
  useEffect(() => {
    const h = () => setStoreVersion(v => v + 1);
    window.addEventListener(TENANT_CONTRACTS_EVENT, h);
    return () => window.removeEventListener(TENANT_CONTRACTS_EVENT, h);
  }, []);
  const [unitEdit, setUnitEdit] = useState<{ c: TenantContract; unit: string; floor: string; area: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<TenantContract | null>(null);
  const saveUnitEdit = () => {
    if (!unitEdit) return;
    const label = unitEdit.unit.trim();
    const unit_id = /^\d+$/.test(label) ? `Conjunto ${label}` : label;
    const floor = parseInt(unitEdit.floor); const area = parseFloat(unitEdit.area);
    if (!unit_id || !floor || !area) { toast.error('Informe conjunto, andar e área.'); return; }
    if (contracts.some(c => c.id !== unitEdit.c.id && c.unit_id.toLowerCase() === unit_id.toLowerCase())) { toast.error(`${unit_id} já existe.`); return; }
    upsertTenantContract({ ...unitEdit.c, unit_id, floor, area_m2: area });
    toast.success(`${unit_id} atualizado.`);
    setUnitEdit(null); setSelectedContract(null);
  };
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
  const contracts = useMemo(() => mockTenantContracts.filter(c => c.building_id === selectedBuildingId), [selectedBuildingId, storeVersion]);
  const vacantUnits = useMemo(() => contracts.filter(c => c.status === 'vacant' || !c.tenant_name)
    .sort((a, b) => floorOfContract(a) - floorOfContract(b) || a.unit_id.localeCompare(b.unit_id, 'pt-BR', { numeric: true })), [contracts]);

  const openNewTenant = (unit?: TenantContract) => {
    setNewTenant({ ...emptyTenant, target: unit ? unit.id : (vacantUnits[0]?.id ?? 'new') });
    setShowNewTenant(true);
  };

  const saveNewUnit = () => {
    if (!building) return;
    const floor = parseInt(newUnit.floor);
    const area = parseFloat(newUnit.area);
    const label = newUnit.unit.trim();
    if (!floor || !label || !area) { toast.error('Informe andar, conjunto e área.'); return; }
    const unit_id = /^\d+$/.test(label) ? `Conjunto ${label}` : label;
    if (contracts.some(c => c.unit_id.toLowerCase() === unit_id.toLowerCase())) { toast.error(`${unit_id} já existe neste ativo.`); return; }
    upsertTenantContract({ id: `${building.id}-u${Date.now()}`, building_id: building.id, unit_id, floor, tenant_name: null, area_m2: area, price_per_m2: null, contract_type: null, status: 'vacant' });
    toast.success(`${unit_id} cadastrado como vago no ${floor}º andar.`);
    setShowNewUnit(false); setNewUnit({ floor: '', unit: '', area: '' });
  };

  const saveNewTenant = () => {
    if (!building) return;
    const t = newTenant;
    const base = t.target !== 'new' ? contracts.find(c => c.id === t.target) : undefined;
    let unit_id = base?.unit_id ?? '';
    let floor = base ? floorOfContract(base) : parseInt(t.floor);
    let area = parseFloat(t.area) || base?.area_m2 || 0;
    if (!base) {
      const label = t.unit.trim();
      if (!label || !floor || !area) { toast.error('Informe conjunto, andar e área.'); return; }
      unit_id = /^\d+$/.test(label) ? `Conjunto ${label}` : label;
      if (contracts.some(c => c.unit_id.toLowerCase() === unit_id.toLowerCase() && c.tenant_name)) { toast.error(`${unit_id} já está ocupado.`); return; }
    }
    const occupiedSame = !base ? contracts.find(c => c.unit_id.toLowerCase() === unit_id.toLowerCase()) : undefined;
    const id = base?.id ?? occupiedSame?.id ?? `${building.id}-ct${Date.now()}`;
    const contract: TenantContract = {
      ...(base ?? occupiedSame ?? {}),
      id, building_id: building.id, unit_id, floor,
      tenant_name: t.name.trim(), tenant_cnpj: t.cnpj || undefined,
      area_m2: area, price_per_m2: parseFloat(t.pricePerM2) || null, contract_type: 'net',
      contract_start: t.start || undefined, contract_end: t.end || undefined, status: 'active',
      indice_reajuste: t.index as TenantContract['indice_reajuste'], periodicidade_reajuste: 'anual',
      data_base_reajuste: t.start || undefined, garantia: t.garantia as TenantContract['garantia'],
      dia_vencimento: parseInt(t.dueDay) || 10, tenant_contact: t.contact || undefined, tenant_email: t.email || undefined,
    };
    upsertTenantContract(contract);
    toast.success(`${contract.tenant_name} alocado em ${unit_id} (${floor}º andar).`);
    setShowNewTenant(false); setNewTenant(emptyTenant);
  };
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
  const occupiedUnits = contracts.filter(c => c.status !== 'vacant' && c.tenant_name).length;

  const openEdit = (c: TenantContract) => {
    setNewTenant({ ...emptyTenant, target: c.id, name: c.tenant_name || '', cnpj: c.tenant_cnpj || '', area: String(c.area_m2), pricePerM2: String(c.price_per_m2 ?? ''), start: c.contract_start || '', end: c.contract_end || '', contact: c.tenant_contact || '', email: c.tenant_email || '', dueDay: String(c.dia_vencimento ?? 10), index: c.indice_reajuste || 'IPCA', garantia: c.garantia || 'Fiança bancária' });
    setSelectedContract(null); setShowNewTenant(true);
    return;
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
              {(building.occupancy_pct ?? 0).toLocaleString('pt-BR')}% ocupação · {occupiedUnits}/{totalUnits} conjuntos
            </Badge>
          )}
          <div className="grid grid-cols-1 gap-2 sm:ml-auto sm:flex sm:items-center sm:flex-wrap">
            <Button size="sm" className="text-xs gap-1" onClick={() => setShowNewBuilding(true)}>
              <Plus size={12} /> Adicionar Ativo
            </Button>
            {building && (
              <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => setShowNewUnit(true)}>
                <Plus size={12} /> Adicionar Unidade
              </Button>
            )}
            {building && (
              <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => openNewTenant()}>
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
                      {(b.occupancy_pct ?? 0).toLocaleString('pt-BR')}% ocup.
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

            {vacantUnits.length > 0 && (
              <div className="bg-card rounded-2xl p-4 premium-shadow">
                <p className="text-sm font-semibold mb-2">Unidades vagas ({vacantUnits.length})</p>
                <div className="flex flex-wrap gap-2">
                  {vacantUnits.map(u => (
                    <Button key={u.id} variant="outline" size="sm" className="text-xs gap-1" onClick={() => openNewTenant(u)}>
                      <UserPlus size={12} /> {u.unit_id} · {floorOfContract(u)}º · {u.area_m2.toLocaleString('pt-BR')} m²
                    </Button>
                  ))}
                </div>
              </div>
            )}

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
                        <Button className="w-full gap-2" onClick={() => { const u = selectedContract; setSelectedContract(null); openNewTenant(u); }}><UserPlus size={16} /> Adicionar locatário</Button>
                        <Button variant="outline" className="w-full gap-2" onClick={() => toast.success('Proposta enviada à equipe de locação.')}><Mail size={16} /> Enviar Proposta</Button>
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
                    <div className="border-t pt-4 space-y-2">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase">Unidade</h4>
                      <Button variant="outline" className="w-full gap-2 text-sm" onClick={() => setUnitEdit({ c: selectedContract, unit: selectedContract.unit_id.replace(/^Conjunto\s+/i, ''), floor: String(floorOfContract(selectedContract)), area: String(selectedContract.area_m2) })}><Edit size={16} /> Editar unidade (conjunto, andar, área)</Button>
                      {!isVacant && (
                        <Button variant="outline" className="w-full gap-2 text-sm" onClick={() => { vacateTenantContract(selectedContract.id); toast.success(`${selectedContract.unit_id} agora está vago.`); setSelectedContract(null); }}><UserMinus size={16} /> Remover locatário (deixar vago)</Button>
                      )}
                      <Button variant="destructive" className="w-full gap-2 text-sm" onClick={() => setConfirmDelete(selectedContract)}><Trash2 size={16} /> Apagar unidade</Button>
                    </div>
                  </div>
                </>
              );
            })()}
          </SheetContent>
        </Sheet>

        <Dialog open={!!unitEdit} onOpenChange={(o) => !o && setUnitEdit(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Editar unidade — {unitEdit?.c.unit_id}</DialogTitle></DialogHeader>
            {unitEdit && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div><Label className="text-xs">Conjunto</Label><Input value={unitEdit.unit} onChange={e => setUnitEdit(p => p && ({ ...p, unit: e.target.value }))} /></div>
                <div><Label className="text-xs">Andar</Label><Input type="number" value={unitEdit.floor} onChange={e => setUnitEdit(p => p && ({ ...p, floor: e.target.value }))} /></div>
                <div><Label className="text-xs">Área (m²)</Label><Input type="number" value={unitEdit.area} onChange={e => setUnitEdit(p => p && ({ ...p, area: e.target.value }))} /></div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setUnitEdit(null)}>Cancelar</Button>
              <Button onClick={saveUnitEdit}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Apagar {confirmDelete?.unit_id}?</DialogTitle>
              <DialogDescription>A unidade{confirmDelete?.tenant_name ? `, o locatário ${confirmDelete.tenant_name} e o contrato` : ''} serão removidos do ativo em todas as telas.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
              <Button variant="destructive" onClick={() => { if (confirmDelete) { removeTenantContract(confirmDelete.id); toast.success(`${confirmDelete.unit_id} apagado.`); } setConfirmDelete(null); setSelectedContract(null); }}>Apagar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={showEdit} onOpenChange={setShowEdit}>
          <DialogContent>
            <DialogHeader><DialogTitle>Editar Contrato — {selectedContract?.unit_id}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[65vh] overflow-y-auto pr-1">
              <div className="sm:col-span-2"><Label className="text-xs">Unidade</Label>
                <Select value={newTenant.target} onValueChange={v => setNewTenant(p => ({ ...p, target: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {contracts.filter(u => u.id === newTenant.target && u.tenant_name).map(u => <SelectItem key={u.id} value={u.id}>{u.unit_id} — {floorOfContract(u)}º andar · {u.tenant_name}</SelectItem>)}
                    {vacantUnits.map(u => <SelectItem key={u.id} value={u.id}>{u.unit_id} — {floorOfContract(u)}º andar · {u.area_m2.toLocaleString('pt-BR')} m² (vago)</SelectItem>)}
                    <SelectItem value="new">+ Nova unidade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newTenant.target === 'new' && (<>
                <div><Label className="text-xs">Conjunto</Label><Input value={newTenant.unit} onChange={e => setNewTenant(p => ({ ...p, unit: e.target.value }))} placeholder="Ex.: 72" /></div>
                <div><Label className="text-xs">Andar</Label><Input type="number" value={newTenant.floor} onChange={e => setNewTenant(p => ({ ...p, floor: e.target.value }))} /></div>
                <div className="sm:col-span-2"><Label className="text-xs">Área (m²)</Label><Input type="number" value={newTenant.area} onChange={e => setNewTenant(p => ({ ...p, area: e.target.value }))} /></div>
              </>)}
              <div className="sm:col-span-2"><Label className="text-xs">Locatário</Label><Input value={newTenant.name} onChange={e => setNewTenant(p => ({ ...p, name: e.target.value }))} /></div>
              <div><Label className="text-xs">CNPJ</Label><Input value={newTenant.cnpj} onChange={e => setNewTenant(p => ({ ...p, cnpj: e.target.value }))} /></div>
              <div><Label className="text-xs">R$/m²</Label><Input type="number" value={newTenant.pricePerM2} onChange={e => setNewTenant(p => ({ ...p, pricePerM2: e.target.value }))} /></div>
              <div><Label className="text-xs">Início do contrato</Label><Input type="date" value={newTenant.start} onChange={e => setNewTenant(p => ({ ...p, start: e.target.value }))} /></div>
              <div><Label className="text-xs">Fim do contrato</Label><Input type="date" value={newTenant.end} onChange={e => setNewTenant(p => ({ ...p, end: e.target.value }))} /></div>
              <div><Label className="text-xs">Índice de reajuste</Label>
                <Select value={newTenant.index} onValueChange={v => setNewTenant(p => ({ ...p, index: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{['IPCA','IGP-M','INPC','IGP-DI','Fixo'].map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Garantia</Label>
                <Select value={newTenant.garantia} onValueChange={v => setNewTenant(p => ({ ...p, garantia: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{['Fiança bancária','Seguro fiança','Depósito caução','Fiador','Sem garantia'].map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Dia de vencimento</Label><Input type="number" min={1} max={31} value={newTenant.dueDay} onChange={e => setNewTenant(p => ({ ...p, dueDay: e.target.value }))} /></div>
              <div><Label className="text-xs">Contato</Label><Input value={newTenant.contact} onChange={e => setNewTenant(p => ({ ...p, contact: e.target.value }))} /></div>
              <div className="sm:col-span-2"><Label className="text-xs">E-mail</Label><Input type="email" value={newTenant.email} onChange={e => setNewTenant(p => ({ ...p, email: e.target.value }))} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewTenant(false)}>Cancelar</Button>
              <Button disabled={!newTenant.name.trim()} onClick={saveNewTenant}>Salvar locatário</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Nova Unidade */}
        <Dialog open={showNewUnit} onOpenChange={setShowNewUnit}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar unidade — {building?.name}</DialogTitle>
              <DialogDescription>A unidade entra como vaga e pode receber um locatário em seguida.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div><Label className="text-xs">Andar</Label><Input type="number" value={newUnit.floor} onChange={e => setNewUnit(p => ({ ...p, floor: e.target.value }))} /></div>
              <div><Label className="text-xs">Conjunto</Label><Input value={newUnit.unit} onChange={e => setNewUnit(p => ({ ...p, unit: e.target.value }))} placeholder="Ex.: 72" /></div>
              <div><Label className="text-xs">Área (m²)</Label><Input type="number" value={newUnit.area} onChange={e => setNewUnit(p => ({ ...p, area: e.target.value }))} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewUnit(false)}>Cancelar</Button>
              <Button onClick={saveNewUnit}>Salvar unidade</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default ProprietarioEdificios;
