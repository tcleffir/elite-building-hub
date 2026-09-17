import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, Upload, Download, Plus, FileText, Edit, RefreshCw, Leaf, Zap, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { mockBuildings, mockTenantContracts, mockBuildingDocuments, mockLuxReports, TenantContract, BuildingDocument } from "@/lib/mock-data";
import { getContractHealth, getDocumentHealth, getOccupancyStatus, daysUntil, healthColors, healthLabels, HealthStatus } from "@/lib/health-utils";
import { toast } from "sonner";

const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR')}`;

const contractTypeLabels: Record<string, string> = {
  net: 'Net',
  gross: 'Gross',
  'semi-gross': 'Semi-gross',
};

const contractTypeTooltips: Record<string, string> = {
  net: 'Locatário arca com todas as despesas operacionais',
  gross: 'Proprietário arca com todas as despesas operacionais',
  'semi-gross': 'Despesas operacionais compartilhadas entre locatário e proprietário',
};

const docTypeOptions = [
  'AVCB', 'PMOC', 'Laudo de Elevadores', 'Laudo SPDA', 'Seguro Predial',
  'Alvará de Funcionamento', 'Habite-se', 'Certificado de Vistoria',
  'Laudo de Para-raios', 'Outro',
];

const BuildingDetail = () => {
  const { buildingId } = useParams<{ buildingId: string }>();
  const navigate = useNavigate();
  const building = mockBuildings.find(b => b.id === buildingId);

  const [selectedContract, setSelectedContract] = useState<TenantContract | null>(null);
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [contractFilter, setContractFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('ocupacao');

  const contracts = useMemo(() => mockTenantContracts.filter(c => c.building_id === buildingId), [buildingId]);
  const docs = useMemo(() => mockBuildingDocuments.filter(d => d.building_id === buildingId), [buildingId]);
  const luxReportsList = useMemo(() => mockLuxReports.filter(r => r.building_id === buildingId), [buildingId]);

  const activeContracts = useMemo(() => contracts.filter(c => c.status === 'active'), [contracts]);

  const waultMonths = useMemo(() => {
    const now = Date.now();
    let weightedSum = 0, totalAreaCalc = 0;
    activeContracts.forEach(c => {
      if (c.contract_end) {
        const remaining = Math.max(0, (new Date(c.contract_end).getTime() - now) / (1000 * 60 * 60 * 24 * 30));
        weightedSum += remaining * c.area_m2;
        totalAreaCalc += c.area_m2;
      }
    });
    return totalAreaCalc > 0 ? weightedSum / totalAreaCalc : 0;
  }, [activeContracts]);

  const filteredContracts = useMemo(() => {
    let result = [...contracts];
    if (contractFilter === 'critical') result = result.filter(c => c.contract_end && getContractHealth(c.contract_end) === 'critical');
    else if (contractFilter === 'active') result = result.filter(c => c.status === 'active');
    else if (contractFilter === 'vacant') result = result.filter(c => c.status === 'vacant');
    result.sort((a, b) => {
      if (a.status === 'vacant') return 1;
      if (b.status === 'vacant') return -1;
      if (!a.contract_end || !b.contract_end) return 0;
      const ha = getContractHealth(a.contract_end);
      const hb = getContractHealth(b.contract_end);
      const order: Record<HealthStatus, number> = { critical: 0, warning: 1, healthy: 2 };
      return order[ha] - order[hb];
    });
    return result;
  }, [contracts, contractFilter]);

  const sortedDocs = useMemo(() => {
    return [...docs].sort((a, b) => {
      const ha = getDocumentHealth(a.valid_until);
      const hb = getDocumentHealth(b.valid_until);
      const order: Record<HealthStatus, number> = { critical: 0, warning: 1, healthy: 2 };
      return order[ha] - order[hb];
    });
  }, [docs]);

  const floors = useMemo(() => {
    const floorMap = new Map<number, TenantContract[]>();
    contracts.forEach(c => {
      const floor = parseInt(c.unit_id.replace(/\D/g, '').charAt(0)) || 1;
      if (!floorMap.has(floor)) floorMap.set(floor, []);
      floorMap.get(floor)!.push(c);
    });
    return Array.from(floorMap.entries()).sort((a, b) => a[0] - b[0]);
  }, [contracts]);

  const totalSavings = useMemo(() => luxReportsList.reduce((s, r) => s + r.savings_amount, 0), [luxReportsList]);

  if (!building) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">Ativo não encontrado.</p>
        <Button variant="ghost" onClick={() => navigate('/portfolio')} className="mt-4">← Voltar ao Portfólio</Button>
      </div>
    );
  }

  const occStatus = getOccupancyStatus(building.occupancy_pct || 0);
  const occupiedArea = activeContracts.reduce((s, c) => s + c.area_m2, 0);
  const totalGla = building.gla_m2 || building.total_area_m2;
  const occupancyPct = totalGla > 0 ? (occupiedArea / totalGla * 100) : 0;
  const totalMonthlyRevenue = activeContracts.reduce((s, c) => s + (c.area_m2 * (c.price_per_m2 || 0)), 0);

  const criticalContracts = activeContracts.filter(c => c.contract_end && getContractHealth(c.contract_end) === 'critical').length;
  const warningContracts = activeContracts.filter(c => c.contract_end && getContractHealth(c.contract_end) === 'warning').length;

  const tabItems = [
    { value: 'ocupacao', label: 'Ocupação & Contratos' },
    { value: 'documentos', label: 'Documentos' },
    { value: 'esg', label: 'Utilidades & ESG' },
  ];
  if (building.lux_client) tabItems.push({ value: 'lux', label: 'Relatórios Lux' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/portfolio')} className="gap-1">
          <ArrowLeft size={16} /> Portfólio
        </Button>
        <span className="text-muted-foreground">/</span>
        <div className="flex items-center gap-2">
          <Building2 size={18} className="text-primary" />
          <h1 className="text-lg font-bold text-foreground">{building.name}</h1>
          <Badge className={`${healthColors[occStatus].badge} text-xs`}>
            {building.occupancy_pct}%
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start">
          {tabItems.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-xs sm:text-sm">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Tab 1: Ocupação & Contratos */}
        <TabsContent value="ocupacao" className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-card rounded-lg border p-4">
              <p className="text-[10px] text-muted-foreground uppercase">GLA Ocupado</p>
              <p className="text-lg font-bold">{occupiedArea.toLocaleString('pt-BR')} / {totalGla.toLocaleString('pt-BR')} m²</p>
            </div>
            <div className="bg-card rounded-lg border p-4">
              <p className="text-[10px] text-muted-foreground uppercase">Taxa Ocupação</p>
              <p className={`text-lg font-bold ${healthColors[occStatus].text}`}>{occupancyPct.toFixed(1)}%</p>
            </div>
            <div className="bg-card rounded-lg border p-4">
              <p className="text-[10px] text-muted-foreground uppercase">Receita Mensal</p>
              <p className="text-lg font-bold">{fmt(totalMonthlyRevenue)}</p>
            </div>
            <div className="bg-card rounded-lg border p-4">
              <p className="text-[10px] text-muted-foreground uppercase">WAULT</p>
              <p className="text-lg font-bold">{(waultMonths / 12).toFixed(1)} anos</p>
            </div>
            <div className="bg-card rounded-lg border p-4">
              <p className="text-[10px] text-muted-foreground uppercase">Contratos</p>
              <div className="flex gap-1">
                {criticalContracts > 0 && <Badge className="bg-rose-100 text-rose-700 text-[10px]">🔴 {criticalContracts}</Badge>}
                {warningContracts > 0 && <Badge className="bg-amber-100 text-amber-700 text-[10px]">🟡 {warningContracts}</Badge>}
                {criticalContracts === 0 && warningContracts === 0 && <span className="text-xs text-emerald-600">✅ OK</span>}
              </div>
            </div>
          </div>

          {/* Unit Map */}
          <div className="bg-card rounded-xl border p-5">
            <h3 className="text-sm font-semibold mb-4">Mapa de Unidades</h3>
            {floors.map(([floor, units]) => (
              <div key={floor} className="mb-4">
                <p className="text-xs text-muted-foreground font-medium mb-2">{floor}º Andar</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {units.map(unit => {
                    const health = unit.contract_end ? getContractHealth(unit.contract_end) : undefined;
                    const isVacant = unit.status === 'vacant';
                    return (
                      <button
                        key={unit.id}
                        onClick={() => !isVacant && setSelectedContract(unit)}
                        className={`rounded-lg border p-3 text-left transition-all hover:shadow-md ${
                          isVacant ? 'bg-muted/50 border-dashed cursor-default' :
                          health ? `${healthColors[health].bg} border-current` : 'bg-card'
                        }`}
                      >
                        <p className="text-xs font-semibold">{unit.unit_id}</p>
                        <p className={`text-[10px] truncate ${isVacant ? 'text-muted-foreground italic' : 'text-foreground'}`}>
                          {isVacant ? 'VAGA' : unit.tenant_name}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{unit.area_m2} m²</p>
                        {health && <Badge className={`${healthColors[health].badge} text-[9px] mt-1`}>{healthLabels[health].pt}</Badge>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Contracts Table */}
          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-sm font-semibold">Contratos</h3>
              <div className="flex gap-2">
                {['all', 'critical', 'active', 'vacant'].map(f => (
                  <Button key={f} variant={contractFilter === f ? 'default' : 'outline'} size="sm" className="text-xs h-7"
                    onClick={() => setContractFilter(f)}>
                    {f === 'all' ? 'Todos' : f === 'critical' ? '🔴 Críticos' : f === 'active' ? 'Ativos' : 'Vagos'}
                  </Button>
                ))}
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Unidade</TableHead>
                  <TableHead className="text-xs">Locatário</TableHead>
                  <TableHead className="text-xs text-right">m²</TableHead>
                  <TableHead className="text-xs text-right">R$/m²</TableHead>
                  <TableHead className="text-xs text-right">Total</TableHead>
                  <TableHead className="text-xs">Tipo</TableHead>
                  <TableHead className="text-xs">Vencimento</TableHead>
                  <TableHead className="text-xs text-center">Saúde</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContracts.map(c => {
                  const health = c.contract_end ? getContractHealth(c.contract_end) : undefined;
                  const isVacant = c.status === 'vacant';
                  return (
                    <TableRow key={c.id} className={`cursor-pointer ${!isVacant && health ? `hover:${healthColors[health].bg}` : 'hover:bg-muted/50'}`}
                      onClick={() => !isVacant && setSelectedContract(c)}>
                      <TableCell className="text-sm font-medium">{c.unit_id}</TableCell>
                      <TableCell className="text-sm">{isVacant ? <span className="text-muted-foreground italic">VAGA</span> : c.tenant_name}</TableCell>
                      <TableCell className="text-sm text-right">{c.area_m2}</TableCell>
                      <TableCell className="text-sm text-right">{c.price_per_m2 ? `R$ ${c.price_per_m2}` : '-'}</TableCell>
                      <TableCell className="text-sm text-right">{c.price_per_m2 ? fmt(c.area_m2 * c.price_per_m2) : '-'}</TableCell>
                      <TableCell className="text-sm">{c.contract_type ? contractTypeLabels[c.contract_type] : '-'}</TableCell>
                      <TableCell className="text-sm">{c.contract_end ? new Date(c.contract_end).toLocaleDateString('pt-BR') : '-'}</TableCell>
                      <TableCell className="text-center">
                        {health ? <Badge className={`${healthColors[health].badge} text-[9px]`}>{healthLabels[health].pt}</Badge> : '-'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Tab 2: Documentos */}
        <TabsContent value="documentos" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Documentos do Ativo</h3>
            <Button size="sm" className="gap-1 text-xs" onClick={() => setShowAddDoc(true)}>
              <Plus size={14} /> Adicionar Documento
            </Button>
          </div>

          <div className="space-y-3">
            {sortedDocs.map(doc => {
              const health = getDocumentHealth(doc.valid_until);
              const days = daysUntil(doc.valid_until);
              return (
                <div key={doc.id} className={`bg-card rounded-xl border p-4 flex items-center gap-4 ${healthColors[health].bg}`}>
                  <div className={`w-2 h-full min-h-[40px] rounded-full ${healthColors[health].dot}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{doc.doc_name}</p>
                      <Badge className={`${healthColors[health].badge} text-[10px]`}>{healthLabels[health].pt}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Validade: {new Date(doc.valid_until).toLocaleDateString('pt-BR')} ·{' '}
                      <span className={healthColors[health].text}>
                        {days > 0 ? `${days} dias restantes` : `🔴 VENCIDO há ${Math.abs(days)} dias`}
                      </span>
                    </p>
                    {doc.uploaded_by && <p className="text-[10px] text-muted-foreground">Enviado por: {doc.uploaded_by} em {doc.uploaded_at}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => toast.info("Upload em desenvolvimento")}>
                      <Upload size={12} /> Enviar
                    </Button>
                    {doc.pdf_url && (
                      <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => toast.info("Download iniciado")}>
                        <Download size={12} />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
            {sortedDocs.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">
                <FileText size={40} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum documento cadastrado</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab 3: ESG */}
        <TabsContent value="esg" className="space-y-4">
          <div className="bg-card rounded-xl border p-6 text-center">
            <Leaf size={40} className="mx-auto mb-3 text-emerald-500 opacity-60" />
            <h3 className="text-base font-semibold mb-2">Utilidades & ESG</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Visualize os dados de consumo de energia, água e gás deste ativo no módulo de Sustentabilidade.
            </p>
            <div className="flex items-center justify-center gap-3 mb-4">
              <Badge className="bg-emerald-100 text-emerald-700">ESG Score: {building.esg_score || '-'}/100</Badge>
            </div>
            <Button onClick={() => navigate('/esg')} className="gap-2">
              <Leaf size={16} /> Ir para Sustentabilidade
            </Button>
          </div>
        </TabsContent>

        {/* Tab 4: Lux Reports */}
        {building.lux_client && (
          <TabsContent value="lux" className="space-y-4">
            {building.lux_client ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-card rounded-lg border p-4">
                    <p className="text-[10px] text-muted-foreground uppercase">Economia Acumulada (Ano)</p>
                    <p className="text-xl font-bold text-emerald-600">{fmt(totalSavings)}</p>
                  </div>
                  <div className="bg-card rounded-lg border p-4">
                    <p className="text-[10px] text-muted-foreground uppercase">Relatórios Publicados</p>
                    <p className="text-xl font-bold">{luxReportsList.length}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {luxReportsList.map(r => (
                    <div key={r.id} className="bg-card rounded-xl border p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">📊 Relatório Lux Energia — {new Date(r.reference_month).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                        <p className="text-xs text-muted-foreground">Economia: <span className="text-emerald-600 font-medium">{fmt(r.savings_amount)}</span> · Publicado em {new Date(r.published_at).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => toast.info("Download do relatório iniciado")}>
                        <Download size={14} /> PDF
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="bg-card rounded-xl border p-8 text-center">
                <Zap size={40} className="mx-auto mb-3 text-amber-500 opacity-60" />
                <h3 className="text-base font-semibold mb-2">💡 Mercado Livre de Energia</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Este ativo ainda não está no Mercado Livre de Energia.<br />
                  Entre em contato com a equipe Lux Energia para uma análise gratuita.
                </p>
                <Button onClick={() => toast.info("Solicitação enviada! A equipe Lux Energia entrará em contato.")}>
                  Solicitar análise
                </Button>
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* Contract Detail Drawer */}
      <Sheet open={!!selectedContract} onOpenChange={() => setSelectedContract(null)}>
        <SheetContent side="center" className="overflow-y-auto">
          {selectedContract && (() => {
            const health = selectedContract.contract_end ? getContractHealth(selectedContract.contract_end) : undefined;
            const days = selectedContract.contract_end ? daysUntil(selectedContract.contract_end) : 0;
            const monthlyTotal = selectedContract.area_m2 * (selectedContract.price_per_m2 || 0);
            return (
              <>
                <SheetHeader>
                  <SheetTitle>Detalhes do Contrato — {selectedContract.unit_id}</SheetTitle>
                </SheetHeader>
                <div className="space-y-5 mt-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Locatário</p>
                      <p className="font-semibold">{selectedContract.tenant_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Unidade</p>
                      <p className="font-semibold">{selectedContract.unit_id} · {selectedContract.area_m2} m²</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        Tipo de contrato
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger><Info size={12} className="text-muted-foreground" /></TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>{selectedContract.contract_type ? contractTypeTooltips[selectedContract.contract_type] : ''}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </p>
                      <p className="font-semibold">{selectedContract.contract_type ? contractTypeLabels[selectedContract.contract_type] : '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Valor por m²</p>
                      <p className="font-semibold">{selectedContract.price_per_m2 ? `R$ ${selectedContract.price_per_m2}/m²` : '-'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Valor total mensal</p>
                      <p className="font-semibold text-lg">{monthlyTotal > 0 ? fmt(monthlyTotal) : '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Início</p>
                      <p className="font-semibold">{selectedContract.contract_start ? new Date(selectedContract.contract_start).toLocaleDateString('pt-BR') : '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Fim</p>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{selectedContract.contract_end ? new Date(selectedContract.contract_end).toLocaleDateString('pt-BR') : '-'}</p>
                        {health && <Badge className={`${healthColors[health].badge} text-[9px]`}>{healthLabels[health].pt}</Badge>}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Tempo restante</p>
                      <p className={`font-semibold ${health ? healthColors[health].text : ''}`}>
                        {days > 0 ? `${days} dias (${(days / 30).toFixed(1)} meses)` : `Vencido há ${Math.abs(days)} dias`}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button variant="outline" className="w-full gap-2 text-sm" onClick={() => toast.info("Selecione o arquivo PDF do contrato para upload")}>
                      <Upload size={16} /> Upload de Contrato
                    </Button>
                    <Button variant="outline" className="w-full gap-2 text-sm" onClick={() => toast.info("Download do contrato iniciado")}>
                      <Download size={16} /> Download Contrato
                    </Button>
                    <Button variant="outline" className="w-full gap-2 text-sm" onClick={() => toast.info("Modo de edição ativado")}>
                      <Edit size={16} /> Editar informações
                    </Button>
                    <Button className="w-full gap-2 text-sm" onClick={() => toast.info("Status alterado para 'Em renovação'")}>
                      <RefreshCw size={16} /> Renovar Contrato
                    </Button>
                  </div>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* Add Document Dialog */}
      <Dialog open={showAddDoc} onOpenChange={setShowAddDoc}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Documento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Tipo de documento</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {docTypeOptions.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Nome</Label>
              <Input placeholder="Nome do documento" />
            </div>
            <div>
              <Label className="text-xs">Data de validade *</Label>
              <Input type="date" />
            </div>
            <div>
              <Label className="text-xs">Arquivo PDF *</Label>
              <Input type="file" accept=".pdf" />
            </div>
            <div>
              <Label className="text-xs">Observações</Label>
              <Textarea placeholder="Observações opcionais..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDoc(false)}>Cancelar</Button>
            <Button onClick={() => { setShowAddDoc(false); toast.success("Documento salvo com sucesso!"); }}>Salvar Documento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BuildingDetail;
