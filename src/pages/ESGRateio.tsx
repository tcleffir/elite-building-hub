import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import {
  ArrowLeft, Check, FileText, FileSpreadsheet, RotateCcw,
  AlertTriangle, Pencil, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MobileTabSelect } from "@/components/MobileTabSelect";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import {
  utilityConfig, methodConfig, statusConfig,
  seedRateioConfigs, seedTariffHistory, seedRateioHistory,
  activeTenants, totalArea, getBuildingReading, calculateRateio, monthlyConsumption,
  type UtilityType, type RateioMethod, type RateioStatus, type ConsumptionRateio, type RateioConfig
} from "@/lib/rateio-data";

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const PIE_COLORS = ['hsl(var(--interactive))','hsl(var(--success))','hsl(var(--warning))','hsl(var(--destructive))','hsl(var(--operational))','#8B5CF6','#EC4899','#F97316','#06B6D4','#84CC16','#6366F1','#EF4444','#14B8A6','#A855F7','#F59E0B'];

const ESGRateio = () => {
  const navigate = useNavigate();
  const { user } = useApp();
  const isManager = ['super_admin', 'building_manager'].includes(user.role);
  const isOwner = user.role === 'owner';
  const isTenant = user.role === 'tenant_admin' || user.role === 'tenant_employee';
  const canManage = isManager; // only managers can calculate/configure
  const [tab, setTab] = useState(canManage ? 'calc' : 'myunit');

  // ── Tab 1: Calcular ──
  const [selectedMonth, setSelectedMonth] = useState(3);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedUtility, setSelectedUtility] = useState<UtilityType>('energy');
  const [selectedMethod, setSelectedMethod] = useState<RateioMethod>('individual');
  const [manualOverride, setManualOverride] = useState<number | null>(null);
  const [overrideJustification, setOverrideJustification] = useState('');
  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [autoCharge, setAutoCharge] = useState(true);
  const [periodStatus, setPeriodStatus] = useState<RateioStatus>('draft');
  const [includeCommonAreas, setIncludeCommonAreas] = useState(true);

  // ── Tab 2: Histórico ──
  const [histUtilityFilter, setHistUtilityFilter] = useState('all');
  const [histYearFilter, setHistYearFilter] = useState('all');
  const [histStatusFilter, setHistStatusFilter] = useState('all');
  const [selectedRateio, setSelectedRateio] = useState<ConsumptionRateio | null>(null);
  const [histChartUtility, setHistChartUtility] = useState<UtilityType>('energy');

  // ── Tab 3: Config ──
  const [configs, setConfigs] = useState<RateioConfig[]>(seedRateioConfigs);

  const config = configs.find(c => c.utilityType === selectedUtility);
  const tariff = config?.tariffValue ?? 0;

  const reading = useMemo(() => getBuildingReading(selectedUtility), [selectedUtility]);
  const totalValue = manualOverride ?? reading.value;

  const items = useMemo(
    () => calculateRateio(selectedUtility, selectedMethod, totalValue, tariff),
    [selectedUtility, selectedMethod, totalValue, tariff]
  );

  const allocatedTotal = items.reduce((s, i) => s + i.attributedValue, 0);
  const allocationPct = totalValue > 0 ? (allocatedTotal / totalValue) * 100 : 0;
  const isFullyAllocated = Math.abs(allocationPct - 100) < 0.5;

  const filteredHistory = seedRateioHistory.filter(r => {
    if (histUtilityFilter !== 'all' && r.utilityType !== histUtilityFilter) return false;
    if (histYearFilter !== 'all' && r.periodYear.toString() !== histYearFilter) return false;
    if (histStatusFilter !== 'all' && r.status !== histStatusFilter) return false;
    return true;
  });

  const handleConfirmRateio = () => {
    setPeriodStatus('confirmed');
    setShowConfirmModal(false);
    toast.success(`✅ Rateio de ${utilityConfig[selectedUtility].label} — ${MONTHS[selectedMonth - 1]} ${selectedYear} confirmado para ${items.length} locatários`);
  };

  const formatBrl = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rateio de Consumo</h1>
          <p className="text-sm text-muted-foreground">
            {isTenant ? `Consumo da sua unidade — ${user.company || 'Sua empresa'}` :
             isOwner ? 'Acompanhe o rateio do seu ativo' :
             'Calcule, configure e acompanhe o rateio mensal de utilities'}
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <MobileTabSelect
          tabs={[
            ...((isTenant || isOwner) ? [{ value: 'myunit', label: '📊 Minha Unidade' }] : []),
            ...(canManage ? [{ value: 'calc', label: '⚖️ Calcular Rateio' }] : []),
            { value: 'history', label: '📅 Histórico' },
            ...(canManage ? [{ value: 'config', label: '⚙️ Configurações' }] : []),
          ]}
          value={tab}
          onValueChange={setTab}
        >
          <TabsList>
            {(isTenant || isOwner) && <TabsTrigger value="myunit">📊 Minha Unidade</TabsTrigger>}
            {canManage && <TabsTrigger value="calc">⚖️ Calcular Rateio</TabsTrigger>}
            <TabsTrigger value="history">📅 Histórico</TabsTrigger>
            {canManage && <TabsTrigger value="config">⚙️ Configurações</TabsTrigger>}
          </TabsList>
        </MobileTabSelect>

        {/* ═══════════════ ABA MINHA UNIDADE (tenant/owner) ═══════════════ */}
        {(isTenant || isOwner) && (
          <TabsContent value="myunit" className="mt-4 space-y-5">
            <div className="bg-card rounded-2xl p-5 premium-shadow animate-fade-in">
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Período:</Label>
                  <Select value={`${selectedMonth}-${selectedYear}`} onValueChange={v => { const [m, y] = v.split('-'); setSelectedMonth(+m); setSelectedYear(+y); }}>
                    <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[3,2,1].map(m => <SelectItem key={`${m}-2026`} value={`${m}-2026`}>{MONTHS[m-1]} 2026</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-1">
                  {(['energy','water','gas'] as UtilityType[]).map(u => (
                    <button key={u} onClick={() => setSelectedUtility(u)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedUtility === u ? 'bg-interactive/10 text-interactive' : 'text-muted-foreground hover:bg-muted/50'}`}>
                      {utilityConfig[u].icon} {utilityConfig[u].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Show only this tenant's/owner's unit data */}
              {(() => {
                const userFloors = user.floors || [];
                const tenantItem = items.find(item =>
                  userFloors.length > 0 && item.tenantId &&
                  activeTenants.find(t => t.id === item.tenantId && t.floors.some(f => userFloors.includes(f)))
                ) || items.find(item => {
                  const tenant = activeTenants.find(t => t.id === item.tenantId);
                  return tenant && tenant.name.toLowerCase().includes((user.company || '').toLowerCase());
                });

                if (!tenantItem) {
                  return (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">Nenhum dado de rateio encontrado para a sua unidade neste período.</p>
                      <p className="text-xs mt-1">Verifique com a gestão de portfólio se o rateio deste mês já foi processado.</p>
                    </div>
                  );
                }

                const tenant = activeTenants.find(t => t.id === tenantItem.tenantId);
                const prevMonthVariation = ((Math.random() - 0.5) * 20).toFixed(1);
                const isUp = parseFloat(prevMonthVariation) > 0;

                return (
                  <div className="space-y-4">
                    {/* Main card */}
                    <div className="p-5 rounded-2xl border-2 border-interactive/20 bg-interactive/5">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-foreground">🏢 {tenant?.name || user.company} — {tenant?.floors.map(f => `${f}º`).join(', ') || ''} Andar</h3>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${periodStatus === 'confirmed' ? 'bg-success/10 text-success' : 'bg-amber-100 text-amber-700'}`}>
                          {periodStatus === 'confirmed' ? '✅ Confirmado' : '🟡 Pendente'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-background rounded-xl p-3 text-center">
                          <p className="text-xs text-muted-foreground">Consumo atribuído</p>
                          <p className="text-xl font-bold text-foreground">{tenantItem.attributedValue.toLocaleString('pt-BR')} {utilityConfig[selectedUtility].unit}</p>
                        </div>
                        <div className="bg-background rounded-xl p-3 text-center">
                          <p className="text-xs text-muted-foreground">Participação</p>
                          <p className="text-xl font-bold text-interactive">{tenantItem.participationPct.toFixed(1)}%</p>
                        </div>
                        <div className="bg-background rounded-xl p-3 text-center">
                          <p className="text-xs text-muted-foreground">Valor estimado</p>
                          <p className="text-xl font-bold text-foreground">{formatBrl(tenantItem.calculatedAmountBrl)}</p>
                        </div>
                        <div className="bg-background rounded-xl p-3 text-center">
                          <p className="text-xs text-muted-foreground">vs. mês anterior</p>
                          <p className={`text-xl font-bold ${isUp ? 'text-destructive' : 'text-success'}`}>
                            {isUp ? '↑' : '↓'} {Math.abs(parseFloat(prevMonthVariation))}%
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">
                        Tarifa aplicada: {formatBrl(tariff)}/{utilityConfig[selectedUtility].unit} • Total do ativo: {totalValue.toLocaleString('pt-BR')} {utilityConfig[selectedUtility].unit}
                      </p>
                    </div>

                    {/* Other utilities summary */}
                    <h4 className="text-sm font-semibold text-foreground mt-4">Resumo por utility — {MONTHS[selectedMonth - 1]} {selectedYear}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {(['energy', 'water', 'gas'] as UtilityType[]).map(u => {
                        const uConfig = configs.find(c => c.utilityType === u);
                        const uTariff = uConfig?.tariffValue ?? 0;
                        const uReading = getBuildingReading(u);
                        const uItems = calculateRateio(u, 'individual', uReading.value, uTariff);
                        const uItem = uItems.find(it => it.tenantId === tenantItem.tenantId);
                        if (!uItem) return null;
                        return (
                          <div key={u} className={`p-4 rounded-xl border ${selectedUtility === u ? 'border-interactive bg-interactive/5' : 'border-border'}`}>
                            <p className="text-xs text-muted-foreground">{utilityConfig[u].icon} {utilityConfig[u].label}</p>
                            <p className="text-lg font-bold text-foreground">{uItem.attributedValue.toLocaleString('pt-BR')} {utilityConfig[u].unit}</p>
                            <p className="text-sm font-semibold text-interactive">{formatBrl(uItem.calculatedAmountBrl)}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          </TabsContent>
        )}

        {/* ═══════════════ ABA 1 — CALCULAR ═══════════════ */}
        {canManage && (
        <TabsContent value="calc" className="mt-4 space-y-5">
          {/* Period + Utility Selector */}
          <div className="bg-card rounded-2xl p-5 premium-shadow animate-fade-in">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">Período:</Label>
                <Select value={`${selectedMonth}-${selectedYear}`} onValueChange={v => { const [m, y] = v.split('-'); setSelectedMonth(+m); setSelectedYear(+y); }}>
                  <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[3,2,1].map(m => (
                      <SelectItem key={`${m}-2026`} value={`${m}-2026`}>{MONTHS[m-1]} 2026</SelectItem>
                    ))}
                    {[12,11,10].map(m => (
                      <SelectItem key={`${m}-2025`} value={`${m}-2025`}>{MONTHS[m-1]} 2025</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-1 bg-muted rounded-lg p-1">
                {(['energy','water','gas'] as UtilityType[]).map(u => (
                  <button
                    key={u}
                    onClick={() => { setSelectedUtility(u); setSelectedMethod(configs.find(c => c.utilityType === u)?.defaultMethod ?? 'ideal_fraction'); }}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${selectedUtility === u ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {utilityConfig[u].icon} {utilityConfig[u].label}
                  </button>
                ))}
              </div>

              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusConfig[periodStatus].color}`}>
                {statusConfig[periodStatus].icon} {statusConfig[periodStatus].label}
              </span>
            </div>
          </div>

          {/* Reading Card */}
          <div className="bg-card rounded-2xl p-5 premium-shadow animate-fade-in">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Leitura total do ativo</p>
                <p className="text-3xl font-bold text-foreground">
                  {totalValue.toLocaleString('pt-BR')} <span className="text-lg font-normal text-muted-foreground">{utilityConfig[selectedUtility].unit}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Período: 01/{selectedMonth.toString().padStart(2,'0')}/{selectedYear} → {new Date(selectedYear, selectedMonth, 0).getDate()}/{selectedMonth.toString().padStart(2,'0')}/{selectedYear}
                </p>
                <p className="text-xs mt-1">
                  Fonte: <span className={`font-semibold ${reading.source === 'telemetry' ? 'text-success' : 'text-amber-600'}`}>
                    {reading.source === 'telemetry' ? '🟢 Automático (telemetria)' : '🟡 Manual'}
                  </span>
                  {manualOverride !== null && <span className="ml-2 text-warning">✏️ Override manual aplicado</span>}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowOverrideForm(!showOverrideForm)}>
                  <Pencil size={14} className="mr-1" /> Corrigir leitura
                </Button>
              </div>
            </div>
            {showOverrideForm && (
              <div className="mt-4 p-4 bg-muted/50 rounded-xl space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Novo valor ({utilityConfig[selectedUtility].unit})</Label>
                    <Input type="number" value={manualOverride ?? ''} onChange={e => setManualOverride(e.target.value ? +e.target.value : null)} placeholder={reading.value.toString()} />
                  </div>
                  <div>
                    <Label className="text-xs">Justificativa</Label>
                    <Input value={overrideJustification} onChange={e => setOverrideJustification(e.target.value)} placeholder="Ex: Leitura corrigida após manutenção" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setShowOverrideForm(false)}>Aplicar</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setManualOverride(null); setOverrideJustification(''); setShowOverrideForm(false); }}>Limpar</Button>
                </div>
              </div>
            )}
            {totalValue === 0 && (
              <div className="mt-3 p-3 bg-warning/10 border border-warning/30 rounded-xl flex items-center gap-2 text-warning text-sm">
                <AlertTriangle size={16} /> Sem leitura para este mês. Insira manualmente ou verifique a telemetria.
              </div>
            )}
          </div>

          {/* Method Selector */}
          <div className="bg-card rounded-2xl p-5 premium-shadow animate-fade-in">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Método de Rateio</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {(['individual','ideal_fraction','simple','solar_credit'] as RateioMethod[]).map(m => (
                <button
                  key={m}
                  onClick={() => setSelectedMethod(m)}
                  className={`p-3 rounded-xl border-2 text-left transition-colors ${selectedMethod === m ? 'border-interactive bg-interactive/5' : 'border-border hover:border-interactive/50'}`}
                >
                  <span className="text-sm font-semibold text-foreground">{methodConfig[m].name}</span>
                  <span className="block text-xs mt-0.5 px-2 py-0.5 rounded-full bg-muted text-muted-foreground w-fit">{methodConfig[m].badge}</span>
                </button>
              ))}
            </div>
            {selectedMethod === 'individual' && (
              <div className="mt-3 flex items-center gap-2">
                <Switch checked={includeCommonAreas} onCheckedChange={setIncludeCommonAreas} />
                <Label className="text-xs text-muted-foreground">Ratear consumo de áreas comuns igualmente entre locatários</Label>
              </div>
            )}
          </div>

          {/* Preview Results */}
          <div className="bg-card rounded-2xl p-5 premium-shadow animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Prévia do Rateio — {MONTHS[selectedMonth-1]} {selectedYear}</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Total: {totalValue.toLocaleString('pt-BR')} {utilityConfig[selectedUtility].unit} | Distribuído: {allocatedTotal.toLocaleString('pt-BR')} ({allocationPct.toFixed(1)}%)
                </span>
                {isFullyAllocated
                  ? <span className="text-xs font-semibold text-success">✅</span>
                  : <span className="text-xs font-semibold text-destructive">⚠️ {(totalValue - allocatedTotal).toLocaleString('pt-BR')} não alocados</span>
                }
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {items.map(item => (
                <div key={item.tenantId} className="p-4 rounded-xl border border-border bg-background">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-foreground">🏢 {item.tenantName}</span>
                    <span className="text-xs text-muted-foreground">{item.floors.map(f => `${f}º`).join(', ')} Andar</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Consumo atribuído:</span>
                      <span className="font-medium">{item.attributedValue.toLocaleString('pt-BR')} {utilityConfig[selectedUtility].unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Participação:</span>
                      <span className="font-medium">{item.participationPct.toFixed(1)}%</span>
                    </div>
                    {item.variationVsPrev !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Variação:</span>
                        <span className={`font-medium ${item.variationVsPrev > 0 ? 'text-destructive' : 'text-success'}`}>
                          {item.variationVsPrev > 0 ? '↑' : '↓'} {Math.abs(item.variationVsPrev)}%
                        </span>
                      </div>
                    )}
                    <Separator className="my-1" />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valor estimado:</span>
                      <span className="font-bold text-foreground">{formatBrl(item.calculatedAmountBrl)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">(tarifa: {formatBrl(tariff)}/{utilityConfig[selectedUtility].unit})</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-5">
              <Button
                className="premium-gradient"
                disabled={!isFullyAllocated || periodStatus === 'confirmed'}
                onClick={() => setShowConfirmModal(true)}
              >
                <Check size={16} className="mr-1" /> Confirmar Rateio
              </Button>
            </div>
          </div>
        </TabsContent>
        )}

        {/* ═══════════════ ABA 2 — HISTÓRICO ═══════════════ */}
        <TabsContent value="history" className="mt-4 space-y-5">
          {/* Annual Chart */}
          <div className="bg-card rounded-2xl p-5 premium-shadow animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Comparativo Anual</h3>
              <div className="flex gap-1 bg-muted rounded-lg p-1">
                {(['energy','water','gas'] as UtilityType[]).map(u => (
                  <button key={u} onClick={() => setHistChartUtility(u)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${histChartUtility === u ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}>
                    {utilityConfig[u].icon}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyConsumption[histChartUtility]}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="lux" name="Lux Energy" stroke="hsl(var(--interactive))" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="capitale" name="Capitale" stroke="hsl(var(--success))" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="youinc" name="You.inc" stroke="hsl(var(--warning))" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="common" name="Áreas Comuns" stroke="hsl(var(--muted-foreground))" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <Select value={histUtilityFilter} onValueChange={setHistUtilityFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Utility" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {(['energy','water','gas'] as UtilityType[]).map(u => (
                  <SelectItem key={u} value={u}>{utilityConfig[u].icon} {utilityConfig[u].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={histYearFilter} onValueChange={setHistYearFilter}>
              <SelectTrigger className="w-[120px]"><SelectValue placeholder="Ano" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
              </SelectContent>
            </Select>
            <Select value={histStatusFilter} onValueChange={setHistStatusFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="confirmed">Confirmado</SelectItem>
                <SelectItem value="closed">Fechado</SelectItem>
                <SelectItem value="reopened">Reaberto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="bg-card rounded-2xl premium-shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Período</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Utility</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Método</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Total</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Confirmado por</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map(r => (
                    <tr key={r.id} className="border-b border-border/50 hover:bg-muted/30 cursor-pointer" onClick={() => setSelectedRateio(r)}>
                      <td className="px-5 py-3 text-sm font-medium">{MONTHS[r.periodMonth - 1].slice(0,3)}/{r.periodYear}</td>
                      <td className="px-5 py-3 text-sm">{utilityConfig[r.utilityType].icon} {utilityConfig[r.utilityType].label}</td>
                      <td className="px-5 py-3 text-sm text-muted-foreground">{methodConfig[r.method].name}</td>
                      <td className="px-5 py-3 text-sm text-right font-semibold">{r.totalBuildingValue.toLocaleString('pt-BR')} {r.totalBuildingUnit}</td>
                      <td className="px-5 py-3 text-sm text-muted-foreground">{r.confirmedBy}</td>
                      <td className="px-5 py-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusConfig[r.status].color}`}>
                          {statusConfig[r.status].icon} {statusConfig[r.status].label}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredHistory.length === 0 && (
                    <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhum rateio encontrado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detail Drawer */}
          <Sheet open={!!selectedRateio} onOpenChange={() => setSelectedRateio(null)}>
            <SheetContent side="center" className="overflow-y-auto">
              {selectedRateio && (
                <>
                  <SheetHeader>
                    <SheetTitle>
                      {utilityConfig[selectedRateio.utilityType].icon} Rateio — {MONTHS[selectedRateio.periodMonth - 1]} {selectedRateio.periodYear}
                    </SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-5">
                    {/* Pie Chart */}
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={selectedRateio.items} dataKey="participationPct" nameKey="tenantName" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}%`}>
                            {selectedRateio.items.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Items */}
                    <div className="space-y-2">
                      {selectedRateio.items.map(item => (
                        <div key={item.tenantId} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                          <div>
                            <span className="text-sm font-semibold">{item.tenantName}</span>
                            <span className="text-xs text-muted-foreground ml-2">{item.participationPct.toFixed(1)}%</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-semibold">{item.attributedValue.toLocaleString('pt-BR')} {selectedRateio.totalBuildingUnit}</span>
                            <span className="block text-xs text-muted-foreground">{formatBrl(item.calculatedAmountBrl)}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Timeline */}
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <p>📝 Calculado em {selectedRateio.createdAt}</p>
                      {selectedRateio.confirmedBy && <p>✅ Confirmado por {selectedRateio.confirmedBy} em {selectedRateio.confirmedAt}</p>}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline"><FileText size={14} className="mr-1" /> Exportar PDF</Button>
                      <Button size="sm" variant="outline"><FileSpreadsheet size={14} className="mr-1" /> Exportar Excel</Button>
                      {selectedRateio.status === 'confirmed' && (
                        <Button size="sm" variant="outline" className="text-warning">
                          <RotateCcw size={14} className="mr-1" /> Reabrir rateio
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </SheetContent>
          </Sheet>
        </TabsContent>

        {/* ═══════════════ ABA 3 — CONFIGURAÇÕES ═══════════════ */}
        {canManage && (
        <TabsContent value="config" className="mt-4 space-y-5">
          {/* Default methods */}
          <div className="bg-card rounded-2xl p-5 premium-shadow animate-fade-in">
            <h3 className="text-base font-semibold text-foreground mb-4">Método Padrão por Utility</h3>
            <div className="grid gap-4 md:grid-cols-3">
              {(['energy','water','gas'] as UtilityType[]).map(u => {
                const c = configs.find(x => x.utilityType === u)!;
                return (
                  <div key={u} className="p-4 rounded-xl border border-border">
                    <p className="text-sm font-semibold mb-2">{utilityConfig[u].icon} {utilityConfig[u].label}</p>
                    <Select value={c.defaultMethod} onValueChange={v => setConfigs(prev => prev.map(x => x.utilityType === u ? { ...x, defaultMethod: v as RateioMethod } : x))}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(['individual','ideal_fraction','simple','solar_credit'] as RateioMethod[]).map(m => (
                          <SelectItem key={m} value={m}>{methodConfig[m].name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tariffs */}
          <div className="bg-card rounded-2xl p-5 premium-shadow animate-fade-in">
            <h3 className="text-base font-semibold text-foreground mb-4">Tarifas Vigentes</h3>
            <div className="grid gap-4 md:grid-cols-3">
              {(['energy','water','gas'] as UtilityType[]).map(u => {
                const c = configs.find(x => x.utilityType === u)!;
                return (
                  <div key={u} className="p-4 rounded-xl border border-border">
                    <p className="text-sm font-semibold mb-2">{utilityConfig[u].icon} {utilityConfig[u].label} (R$/{utilityConfig[u].unit})</p>
                    <Input
                      type="number"
                      step="0.01"
                      value={c.tariffValue}
                      onChange={e => setConfigs(prev => prev.map(x => x.utilityType === u ? { ...x, tariffValue: +e.target.value } : x))}
                    />
                    <div className="mt-3">
                      <p className="text-xs text-muted-foreground font-semibold mb-1">Histórico de Tarifas</p>
                      {seedTariffHistory[u].map((h, i) => (
                        <div key={i} className="flex justify-between text-xs text-muted-foreground py-0.5">
                          <span>{new Date(h.date).toLocaleDateString('pt-BR')}</span>
                          <span className="font-medium">R$ {h.value.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Frações Ideais */}
          <div className="bg-card rounded-2xl p-5 premium-shadow animate-fade-in">
            <h3 className="text-base font-semibold text-foreground mb-4">Frações Ideais</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Locatário</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Andar</th>
                    <th className="text-right px-4 py-2 text-xs font-semibold text-muted-foreground">Área (m²)</th>
                    <th className="text-right px-4 py-2 text-xs font-semibold text-muted-foreground">Fração (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTenants.map(t => (
                    <tr key={t.id} className="border-b border-border/50">
                      <td className="px-4 py-2 text-sm font-medium">{t.name}</td>
                      <td className="px-4 py-2 text-sm text-muted-foreground">{t.floors.map(f => `${f}º`).join(', ')}</td>
                      <td className="px-4 py-2 text-sm text-right">{t.areaM2.toLocaleString('pt-BR')}</td>
                      <td className="px-4 py-2 text-sm text-right font-semibold">{((t.areaM2 / totalArea) * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                  <tr className="bg-muted/30">
                    <td className="px-4 py-2 text-sm font-bold" colSpan={2}>Total</td>
                    <td className="px-4 py-2 text-sm text-right font-bold">{totalArea.toLocaleString('pt-BR')}</td>
                    <td className="px-4 py-2 text-sm text-right font-bold">100,0%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Alertas */}
          <div className="bg-card rounded-2xl p-5 premium-shadow animate-fade-in">
            <h3 className="text-base font-semibold text-foreground mb-4">Alertas Automáticos</h3>
            <div className="space-y-4">
              {(['energy','water','gas'] as UtilityType[]).map(u => {
                const c = configs.find(x => x.utilityType === u)!;
                return (
                  <div key={u} className="p-4 rounded-xl border border-border space-y-3">
                    <p className="text-sm font-semibold">{utilityConfig[u].icon} {utilityConfig[u].label}</p>
                    <div className="flex items-center gap-3">
                      <Switch defaultChecked />
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Alertar quando variação &gt;</span>
                        <Input type="number" className="w-16 h-8" value={c.alertVariancePct}
                          onChange={e => setConfigs(prev => prev.map(x => x.utilityType === u ? { ...x, alertVariancePct: +e.target.value } : x))} />
                        <span>%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch defaultChecked />
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Alertar se não confirmado até dia</span>
                        <Input type="number" className="w-16 h-8" value={c.alertDueDay}
                          onChange={e => setConfigs(prev => prev.map(x => x.utilityType === u ? { ...x, alertDueDay: +e.target.value } : x))} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <Button className="mt-4 premium-gradient" onClick={() => toast.success('Configurações salvas!')}>Salvar Configurações</Button>
          </div>
        </TabsContent>
        )}
      </Tabs>

      {/* ═══ Confirm Modal ═══ */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Rateio</DialogTitle>
            <DialogDescription>
              Confirmar o rateio de {utilityConfig[selectedUtility].label} para {MONTHS[selectedMonth-1]} {selectedYear}?
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Isso irá gerar lançamentos financeiros para cada locatário.</p>
          <div className="flex items-center gap-2 mt-2">
            <Switch checked={autoCharge} onCheckedChange={setAutoCharge} />
            <Label className="text-sm">Gerar cobranças financeiras automaticamente</Label>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowConfirmModal(false)}>Cancelar</Button>
            <Button className="premium-gradient" onClick={handleConfirmRateio}>
              {autoCharge ? 'Confirmar e Gerar' : 'Confirmar sem gerar cobranças'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ESGRateio;
