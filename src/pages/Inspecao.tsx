import { useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Camera, Plus, ClipboardCheck, TrendingUp, Calendar, HardHat, Upload, ArrowLeft, MapPin, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MobileTabSelect } from "@/components/MobileTabSelect";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp } from "@/contexts/AppContext";
import { permissionsByRole } from "@/lib/role-config";
import { canSeeScope, getScopeBadge, type ScopeFilter, type ScopeType } from "@/lib/permissions-data";
import { toast } from "sonner";

const systems = [
  { name: 'Fachada e Áreas Externas', items: ['Estado geral da fachada', 'Pintura externa', 'Calçada e acessos', 'Iluminação externa'] },
  { name: 'Lobby e Circulações', items: ['Piso e revestimentos', 'Iluminação do lobby', 'Sinalização', 'Mobiliário'] },
  { name: 'Elevadores e Escadas', items: ['Funcionamento dos elevadores', 'Indicadores de andar', 'Corrimãos das escadas', 'Iluminação de emergência'] },
  { name: 'Sistemas Elétricos', items: ['Quadro geral', 'Disjuntores', 'Tomadas áreas comuns', 'Gerador de emergência'] },
  { name: 'Sistemas Hidráulicos', items: ['Reservatórios', 'Bombas', 'Tubulações aparentes', 'Ralos e escoamento'] },
  { name: 'HVAC / Climatização', items: ['Chiller', 'Fan coils', 'Dutos e grelhas', 'Temperatura ambiente'] },
  { name: 'Sistema de Incêndio', items: ['Extintores (validade)', 'Hidrantes', 'Sprinklers', 'Alarmes e detectores'] },
  { name: 'CFTV e Controle de Acesso', items: ['Câmeras operacionais', 'Gravação funcional', 'Catracas', 'Leitores de acesso'] },
];

const obraChecklist = [
  'Projeto executivo da obra (PDF)',
  'ART/RRT do engenheiro responsável',
  'Cronograma físico-financeiro',
  'Plano de gerenciamento de resíduos',
  'Seguro de responsabilidade civil',
  'Horários de trabalho propostos',
  'Lista de prestadores de serviço com documentação',
  'Aprovação do corpo de bombeiros (se aplicável)',
];

type ItemStatus = 'ok' | 'attention' | 'noncompliant' | 'na' | null;

// ─── Mock inspection history with scopes ──────────
interface InspectionRecord {
  id: string;
  date: string;
  inspector: string;
  conformity: number;
  items: number;
  scope: ScopeFilter;
}

const mockInspections: InspectionRecord[] = [
  { id: 'insp-1', date: '15/03/2026', inspector: 'Tatiana Caracciolo', conformity: 92, items: 32, scope: { scope_type: 'building', scope_floors: [] } },
  { id: 'insp-2', date: '10/03/2026', inspector: 'Daniel Amaro', conformity: 88, items: 16, scope: { scope_type: 'floor', scope_floors: [7] } },
  { id: 'insp-3', date: '05/03/2026', inspector: 'Tatiana Caracciolo', conformity: 95, items: 12, scope: { scope_type: 'floor', scope_floors: [13] } },
  { id: 'insp-4', date: '01/03/2026', inspector: 'Daniel Amaro', conformity: 78, items: 20, scope: { scope_type: 'floor', scope_floors: [2, 4] } },
  { id: 'insp-5', date: '15/02/2026', inspector: 'Tatiana Caracciolo', conformity: 85, items: 32, scope: { scope_type: 'building', scope_floors: [] } },
  { id: 'insp-6', date: '10/02/2026', inspector: 'Tatiana Caracciolo', conformity: 90, items: 8, scope: { scope_type: 'management', scope_floors: [] } },
];

const Inspecao = () => {
  const { user } = useApp();
  const permissions = permissionsByRole[user.role];
  const isTenant = user.role === 'tenant_admin' || user.role === 'tenant_employee';
  const isManager = user.role === 'super_admin' || user.role === 'building_manager';
  const [activeTab, setActiveTab] = useState(isTenant ? 'obra' : 'dashboard');
  const [checklist, setChecklist] = useState<Record<string, ItemStatus>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [observations, setObservations] = useState<Record<string, string>>({});
  const [generalObservation, setGeneralObservation] = useState('');
  const [obraOpen, setObraOpen] = useState(false);
  const [obraData, setObraData] = useState({ title: '', description: '', floor: '', duration: '' });
  const [obraChecks, setObraChecks] = useState<Record<number, boolean>>({});
  const [locationFilter, setLocationFilter] = useState<string>('all');

  // New inspection location dialog
  const [newInspOpen, setNewInspOpen] = useState(false);
  const [newInspLocation, setNewInspLocation] = useState<ScopeType>('building');
  const [newInspFloors, setNewInspFloors] = useState<number[]>([]);

  const userFloors = user.floors || user.managed_floors || [];
  const isSoleProprietor = user.is_sole_proprietor || false;

  // Filter inspections by scope
  const visibleInspections = mockInspections.filter(insp =>
    canSeeScope(user.role, userFloors, isSoleProprietor, insp.scope)
  ).filter(insp => {
    if (locationFilter === 'all') return true;
    if (locationFilter === 'building') return insp.scope.scope_type === 'building';
    if (locationFilter === 'management') return insp.scope.scope_type === 'management';
    const floor = parseInt(locationFilter);
    if (!isNaN(floor)) return insp.scope.scope_floors.includes(floor);
    return true;
  });

  const totalItems = systems.reduce((s, sys) => s + sys.items.length, 0);
  const inspectedCount = Object.values(checklist).filter(v => v !== null).length;
  const okCount = Object.values(checklist).filter(v => v === 'ok').length;
  const attentionCount = Object.values(checklist).filter(v => v === 'attention').length;
  const ncCount = Object.values(checklist).filter(v => v === 'noncompliant').length;

  const setItemStatus = (key: string, status: ItemStatus) => {
    setChecklist(prev => ({ ...prev, [key]: status }));
  };

  const statusButtons: { status: ItemStatus; label: string; cls: string }[] = [
    { status: 'ok', label: '✅', cls: 'bg-success/10 text-success border-success/30 hover:bg-success/20' },
    { status: 'attention', label: '⚠️', cls: 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200' },
    { status: 'noncompliant', label: '❌', cls: 'bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20' },
    { status: 'na', label: 'N/A', cls: 'bg-muted text-muted-foreground border-border hover:bg-muted/80' },
  ];

  const obraChecklistComplete = obraChecklist.every((_, i) => obraChecks[i]);

  const handleSubmitObra = () => {
    toast.success('Solicitação de obra enviada para aprovação da gestão de portfólio.');
    setObraOpen(false);
    setObraData({ title: '', description: '', floor: '', duration: '' });
    setObraChecks({});
  };

  const handleStartNewInspection = () => {
    const scopeLabel = newInspLocation === 'building' ? 'Área Comum' :
      newInspLocation === 'management' ? 'Gestão Interna' :
      `Andar(es) ${newInspFloors.map(f => `${f}º`).join(', ')}`;
    toast.success(`Nova inspeção criada para: ${scopeLabel}`);
    setNewInspOpen(false);
    setActiveTab('checklist');
  };

  // Unique floors across all visible inspections for filter
  const allVisibleFloors = [...new Set(visibleInspections.flatMap(i => i.scope.scope_floors))].sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">
            {isTenant ? 'Inspeção / Obras' : 'Inspeção Predial'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isTenant
              ? 'Inspeções da sua unidade e áreas comuns'
              : isManager
                ? 'Checklists e vistorias do ativo — todas as unidades'
                : 'Checklists e vistorias do ativo'}
          </p>
        </div>
        {permissions.canManageInspections && (
          <Button className="premium-gradient gap-2" onClick={() => setNewInspOpen(true)}>
            <Plus size={16} />Nova Inspeção
          </Button>
        )}
        {isTenant && (
          <Button className="premium-gradient gap-2" onClick={() => setObraOpen(true)}>
            <HardHat size={16} />Solicitar Obra
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <MobileTabSelect
          tabs={[
            ...(!isTenant ? [{ value: 'dashboard', label: 'Dashboard' }, { value: 'checklist', label: 'Checklist em Campo' }] : []),
            { value: 'historico', label: 'Histórico' },
            { value: 'obra', label: '🏗️ Obras' },
          ]}
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList>
            {!isTenant && <TabsTrigger value="dashboard">Dashboard</TabsTrigger>}
            {!isTenant && <TabsTrigger value="checklist">Checklist em Campo</TabsTrigger>}
            <TabsTrigger value="historico">Histórico</TabsTrigger>
            <TabsTrigger value="obra">🏗️ Obras</TabsTrigger>
          </TabsList>
        </MobileTabSelect>

        {!isTenant && (
          <TabsContent value="dashboard">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card><CardContent className="pt-6 text-center">
                <CheckCircle2 size={24} className="mx-auto text-success mb-1" />
                <p className="text-2xl font-bold text-success">{okCount}</p>
                <p className="text-xs text-muted-foreground">Conformes</p>
              </CardContent></Card>
              <Card><CardContent className="pt-6 text-center">
                <XCircle size={24} className="mx-auto text-destructive mb-1" />
                <p className="text-2xl font-bold text-destructive">{ncCount}</p>
                <p className="text-xs text-muted-foreground">Não Conformes</p>
              </CardContent></Card>
              <Card><CardContent className="pt-6 text-center">
                <ClipboardCheck size={24} className="mx-auto text-interactive mb-1" />
                <p className="text-2xl font-bold text-foreground">{visibleInspections.length}</p>
                <p className="text-xs text-muted-foreground">Inspeções Visíveis</p>
              </CardContent></Card>
              <Card><CardContent className="pt-6 text-center">
                <Calendar size={24} className="mx-auto text-amber-500 mb-1" />
                <p className="text-sm font-bold text-foreground">28/03/2026</p>
                <p className="text-xs text-muted-foreground">Próxima Inspeção</p>
              </CardContent></Card>
            </div>
          </TabsContent>
        )}

        {!isTenant && (
          <TabsContent value="checklist">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Progresso da Inspeção</CardTitle>
                  <span className="text-xs text-muted-foreground">{inspectedCount} de {totalItems} itens ({totalItems > 0 ? Math.round((inspectedCount/totalItems)*100) : 0}%)</span>
                </div>
                <Progress value={totalItems > 0 ? (inspectedCount / totalItems) * 100 : 0} className="h-2" />
              </CardHeader>
              <CardContent className="space-y-4">
                {systems.map((sys, si) => (
                  <details key={si} className="group">
                    <summary className="flex items-center justify-between p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 list-none">
                      <span className="text-sm font-semibold text-foreground">{sys.name}</span>
                      <span className="text-xs text-muted-foreground">{sys.items.filter((_, ii) => checklist[`${si}-${ii}`]).length}/{sys.items.length}</span>
                    </summary>
                    <div className="mt-2 space-y-2 pl-2">
                      {sys.items.map((item, ii) => {
                        const key = `${si}-${ii}`;
                        const current = checklist[key] || null;
                        return (
                          <div key={ii} className="p-3 rounded-lg border border-border/40 space-y-2">
                            <p className="text-sm text-foreground">{item}</p>
                            <div className="flex gap-1.5 flex-wrap">
                              {statusButtons.map(btn => (
                                <button key={btn.status} onClick={() => setItemStatus(key, btn.status!)}
                                  className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${current === btn.status ? btn.cls + ' ring-2 ring-offset-1' : 'border-border text-muted-foreground hover:bg-muted/50'}`}>
                                  {btn.label}
                                </button>
                              ))}
                              <button className="px-2.5 py-1 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted/50 flex items-center gap-1">
                                <Camera size={12} /> Foto
                              </button>
                            </div>
                            <div className="relative">
                              <Textarea
                                placeholder="Descreva o que foi observado neste item..."
                                value={observations[key] || ''}
                                onChange={e => setObservations(prev => ({ ...prev, [key]: e.target.value.slice(0, 500) }))}
                                className={`min-h-[50px] text-xs ${(current === 'attention' || current === 'noncompliant') && !observations[key] ? 'border-destructive/50' : ''}`}
                              />
                              <span className="absolute bottom-1.5 right-2 text-[10px] text-muted-foreground">{(observations[key] || '').length}/500</span>
                            </div>
                            {(current === 'attention' || current === 'noncompliant') && !observations[key] && (
                              <p className="text-[10px] text-destructive">⚠️ Observação obrigatória para itens com atenção ou não conformidade</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </details>
                ))}

                <div className="mt-6 p-4 bg-muted/30 rounded-xl space-y-2 border border-border/40">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">📝 Observações Gerais da Inspeção</h4>
                  <p className="text-xs text-muted-foreground">Registre aqui observações gerais sobre a inspeção, contexto, condições do dia, pontos de atenção não cobertos pelo checklist...</p>
                  <Textarea
                    value={generalObservation}
                    onChange={e => setGeneralObservation(e.target.value)}
                    placeholder="Observações gerais..."
                    className="min-h-[120px] text-sm"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-4">
                  <Button className="premium-gradient flex-1 w-full sm:w-auto h-12 sm:h-10" onClick={() => toast.success('Relatório de inspeção gerado com sucesso! PDF disponível para download.')}>Gerar Relatório de Inspeção</Button>
                  <Button variant="outline" className="w-full sm:w-auto h-12 sm:h-10" onClick={() => toast.success('Relatório publicado na biblioteca do ativo!')}>Publicar na Biblioteca</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="historico">
          <Card>
            <CardContent className="pt-6">
              {/* Location filter */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Filter size={14} className="text-muted-foreground" />
                <button
                  onClick={() => setLocationFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${locationFilter === 'all' ? 'bg-interactive/10 text-interactive' : 'text-muted-foreground hover:bg-muted/50'}`}>
                  Todas
                </button>
                <button
                  onClick={() => setLocationFilter('building')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${locationFilter === 'building' ? 'bg-success/10 text-success' : 'text-muted-foreground hover:bg-muted/50'}`}>
                  🟢 Áreas Comuns
                </button>
                {isManager && (
                  <button
                    onClick={() => setLocationFilter('management')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${locationFilter === 'management' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}>
                    🔒 Gestão
                  </button>
                )}
                {allVisibleFloors.map(f => (
                  <button key={f}
                    onClick={() => setLocationFilter(String(f))}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${locationFilter === String(f) ? 'bg-interactive/10 text-interactive' : 'text-muted-foreground hover:bg-muted/50'}`}>
                    {f}º Andar
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {visibleInspections.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhuma inspeção encontrada para o filtro selecionado.</p>
                ) : (
                  visibleInspections.map((insp) => {
                    const badge = getScopeBadge(insp.scope);
                    return (
                      <div key={insp.id} className="flex items-center justify-between p-3 rounded-lg border border-border/40 hover:bg-muted/20 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">{insp.date}</p>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${badge.color}`}>{badge.label}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Inspetor: {insp.inspector} • {insp.items} itens</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${insp.conformity >= 90 ? 'text-success' : insp.conformity >= 80 ? 'text-amber-500' : 'text-destructive'}`}>{insp.conformity}%</span>
                          <TrendingUp size={14} className="text-success" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="obra">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Solicitações de Obra</h2>
              {isTenant && (
                <Button className="premium-gradient gap-2" onClick={() => setObraOpen(true)}>
                  <HardHat size={16} />Nova Solicitação
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {[
                { id: 'obra-1', title: 'Reforma de layout — 7º andar', status: 'Em análise', statusCls: 'bg-amber-100 text-amber-700', solicitante: 'Lux Energia', floor: 7, duration: 30, docs: 6, totalDocs: 8 },
                { id: 'obra-2', title: 'Instalação nova sala de reunião — 13º andar', status: 'Aprovada', statusCls: 'bg-success/10 text-success', solicitante: 'Capitale', floor: 13, duration: 15, docs: 8, totalDocs: 8 },
              ]
                .filter(obra => canSeeScope(user.role, userFloors, isSoleProprietor, { scope_type: 'floor', scope_floors: [obra.floor] }))
                .map(obra => (
                <div key={obra.id} className="bg-card rounded-2xl p-5 premium-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-foreground">{obra.title}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${obra.statusCls}`}>{obra.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">Solicitante: {obra.solicitante} • Andar: {obra.floor}º • Duração estimada: {obra.duration} dias</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>📋 {obra.docs}/{obra.totalDocs} documentos enviados</span>
                    <Progress value={(obra.docs / obra.totalDocs) * 100} className="h-1.5 w-24" />
                  </div>
                </div>
              ))}
              {[
                { id: 'obra-1', floor: 7 },
                { id: 'obra-2', floor: 17 },
              ].filter(obra => canSeeScope(user.role, userFloors, isSoleProprietor, { scope_type: 'floor', scope_floors: [obra.floor] })).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhuma solicitação de obra encontrada para sua unidade.</p>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* New Inspection Location Dialog */}
      <Dialog open={newInspOpen} onOpenChange={setNewInspOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><MapPin size={18} /> Localização da Inspeção</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-xs text-muted-foreground">Defina o escopo da inspeção. Isso determina quem poderá visualizá-la.</p>
            <div className="space-y-2">
              {[
                { value: 'building' as ScopeType, label: '🟢 Área Comum', desc: 'Visível para todos do ativo' },
                { value: 'floor' as ScopeType, label: '🔵 Andar Específico', desc: 'Visível apenas para o(s) andar(es) selecionado(s)' },
                { value: 'management' as ScopeType, label: '🔒 Gestão Interna', desc: 'Visível apenas para Gestores e Super Admin' },
              ].map(opt => (
                <button key={opt.value} onClick={() => { setNewInspLocation(opt.value); if (opt.value !== 'floor') setNewInspFloors([]); }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    newInspLocation === opt.value ? 'border-interactive bg-interactive/5 ring-1 ring-interactive' : 'border-border hover:bg-muted/30'
                  }`}>
                  <span className="text-lg">{opt.label.split(' ')[0]}</span>
                  <div>
                    <p className="text-sm font-semibold">{opt.label.slice(2)}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {newInspLocation === 'floor' && (
              <div className="space-y-2">
                <Label className="text-xs">Selecione o(s) andar(es)</Label>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 19 }, (_, i) => i + 1).map(floor => (
                    <button key={floor} onClick={() => {
                      setNewInspFloors(prev => prev.includes(floor) ? prev.filter(f => f !== floor) : [...prev, floor]);
                    }}
                      className={`w-9 h-9 rounded-lg text-xs font-semibold transition-colors ${
                        newInspFloors.includes(floor) ? 'bg-interactive text-white' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                      }`}>
                      {floor}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewInspOpen(false)}>Cancelar</Button>
            <Button className="premium-gradient" onClick={handleStartNewInspection}
              disabled={newInspLocation === 'floor' && newInspFloors.length === 0}>
              <Plus size={14} className="mr-1" />Iniciar Inspeção
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Solicitar Obra Dialog */}
      <Dialog open={obraOpen} onOpenChange={setObraOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><HardHat size={20} /> Solicitar Obra no Andar</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm">Título da obra</Label>
              <Input className="mt-1" value={obraData.title} onChange={e => setObraData(p => ({ ...p, title: e.target.value }))} placeholder="Ex: Reforma de layout do escritório" />
            </div>
            <div>
              <Label className="text-sm">Andar</Label>
              <Input className="mt-1" value={obraData.floor} onChange={e => setObraData(p => ({ ...p, floor: e.target.value }))} placeholder="Ex: 7º andar" />
            </div>
            <div>
              <Label className="text-sm">Duração estimada (dias)</Label>
              <Input className="mt-1" type="number" value={obraData.duration} onChange={e => setObraData(p => ({ ...p, duration: e.target.value }))} placeholder="Ex: 30" />
            </div>
            <div>
              <Label className="text-sm">Descrição do escopo</Label>
              <Textarea className="mt-1 min-h-[80px]" value={obraData.description} onChange={e => setObraData(p => ({ ...p, description: e.target.value }))} placeholder="Descreva a obra, escopo e necessidades..." />
            </div>

            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-semibold text-foreground">📋 Checklist de Documentos Obrigatórios</h4>
              <p className="text-xs text-muted-foreground">Todos os documentos devem ser enviados para a obra ser aprovada.</p>
              {obraChecklist.map((item, i) => (
                <label key={i} className="flex items-start gap-3 cursor-pointer group">
                  <Checkbox checked={!!obraChecks[i]} onCheckedChange={(v) => setObraChecks(p => ({ ...p, [i]: !!v }))} className="mt-0.5" />
                  <div className="flex-1">
                    <span className="text-sm text-foreground group-hover:text-interactive transition-colors">{item}</span>
                    <div className="mt-1">
                      <button className="text-xs text-interactive flex items-center gap-1 hover:underline">
                        <Upload size={10} /> Fazer upload
                      </button>
                    </div>
                  </div>
                </label>
              ))}
              <div className="flex items-center gap-2 pt-2">
                <Progress value={Object.values(obraChecks).filter(Boolean).length / obraChecklist.length * 100} className="h-2 flex-1" />
                <span className="text-xs text-muted-foreground">{Object.values(obraChecks).filter(Boolean).length}/{obraChecklist.length}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setObraOpen(false)}>Cancelar</Button>
            <Button className="premium-gradient" onClick={handleSubmitObra} disabled={!obraData.title.trim() || !obraChecklistComplete}>
              <HardHat size={14} className="mr-2" />Enviar Solicitação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inspecao;
