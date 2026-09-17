import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import { Search, Download, FileText, Plus, ArrowUpDown, ArrowUp, ArrowDown, X, SlidersHorizontal, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import StatusBadge from "@/components/StatusBadge";
import ContractDrawer from "@/components/ContractDrawer";
import { mockContracts, Contract } from "@/lib/mock-data";
import { useApp } from "@/contexts/AppContext";
import { permissionsByRole } from "@/lib/role-config";

const statusFilters = [
  { key: '', label: 'Todos' },
  { key: 'active', label: 'Ativos' },
  { key: 'expiring', label: 'Vencendo' },
  { key: 'expired', label: 'Vencidos' },
  { key: 'negotiation', label: 'Em Negociação' },
];

type SortKey = 'tenant_asc' | 'tenant_desc' | 'floor_asc' | 'floor_desc' | 'value_asc' | 'value_desc' | 'expiry' | 'start_desc';

const sortOptions: { key: SortKey; label: string }[] = [
  { key: 'tenant_asc', label: 'A–Z Locatário' },
  { key: 'tenant_desc', label: 'Z–A Locatário' },
  { key: 'floor_asc', label: 'Andar (crescente)' },
  { key: 'floor_desc', label: 'Andar (decrescente)' },
  { key: 'value_asc', label: 'Valor/mês (menor → maior)' },
  { key: 'value_desc', label: 'Valor/mês (maior → menor)' },
  { key: 'expiry', label: 'Vencimento mais próximo' },
  { key: 'start_desc', label: 'Data de início (mais recente)' },
];

type ColSortKey = 'tenant' | 'floor' | 'value';

const tenantOptions = ['Lux Energia', 'Capitale Energia', 'You Intermediação', 'Windmöller & Hölscher', 'Apex Partners', 'Sul América', 'Geribá Energy'];
const adjustmentIndices = ['IGPM', 'IPCA', 'IPC', 'Fixo'];
const contractStatuses = [
  { value: 'active', label: 'Ativo' },
  { value: 'negotiation', label: 'Em negociação' },
  { value: 'expired', label: 'Encerrado' },
];
const allFloors = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];

const Contratos = () => {
  const { user } = useApp();
  const permissions = permissionsByRole[user.role];
  const [searchParams] = useSearchParams();
  const initialFilter = searchParams.get('status') || '';
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialFilter);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>('tenant_asc');
  const [showFilters, setShowFilters] = useState(false);
  const [floorFilter, setFloorFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [valueMin, setValueMin] = useState('');
  const [valueMax, setValueMax] = useState('');
  const [newDialogOpen, setNewDialogOpen] = useState(false);

  // New contract form
  const [newForm, setNewForm] = useState({
    tenant: '',
    customTenant: '',
    floors: [] as number[],
    startDate: '',
    endDate: '',
    monthlyValue: '',
    adjustmentIndex: 'IGPM',
    status: 'active',
    pdfFile: null as File | null,
    observations: '',
  });
  const [newFormErrors, setNewFormErrors] = useState<Record<string, boolean>>({});

  // Column header sort
  const [colSort, setColSort] = useState<{ col: ColSortKey; dir: 'asc' | 'desc' } | null>(null);

  const handleColSort = (col: ColSortKey) => {
    if (colSort?.col === col) {
      if (colSort.dir === 'asc') setColSort({ col, dir: 'desc' });
      else setColSort(null);
    } else {
      setColSort({ col, dir: 'asc' });
    }
  };

  const activeSortKey: SortKey = colSort
    ? (`${colSort.col === 'tenant' ? 'tenant' : colSort.col === 'floor' ? 'floor' : 'value'}_${colSort.dir}` as SortKey)
    : sortBy;

  const hasActiveFilters = !!floorFilter || !!companyFilter || !!valueMin || !!valueMax;

  const clearFilters = () => {
    setFloorFilter(''); setCompanyFilter(''); setValueMin(''); setValueMax('');
  };

  const filtered = useMemo(() => {
    let result = mockContracts.filter(c => {
      if (search && !c.tenant_name.toLowerCase().includes(search.toLowerCase()) && !c.cnpj.includes(search) && !c.number.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter && c.status !== statusFilter) return false;
      if (floorFilter) {
        const f = parseInt(floorFilter);
        if (!isNaN(f) && !c.floors.includes(f)) return false;
      }
      if (companyFilter && !c.tenant_name.toLowerCase().includes(companyFilter.toLowerCase())) return false;
      if (valueMin && c.monthly_value < parseFloat(valueMin)) return false;
      if (valueMax && c.monthly_value > parseFloat(valueMax)) return false;
      return true;
    });

    // Sort
    const key = activeSortKey;
    result = [...result].sort((a, b) => {
      switch (key) {
        case 'tenant_asc': return a.tenant_name.localeCompare(b.tenant_name);
        case 'tenant_desc': return b.tenant_name.localeCompare(a.tenant_name);
        case 'floor_asc': return (a.floors[0] || 0) - (b.floors[0] || 0);
        case 'floor_desc': return (b.floors[0] || 0) - (a.floors[0] || 0);
        case 'value_asc': return a.monthly_value - b.monthly_value;
        case 'value_desc': return b.monthly_value - a.monthly_value;
        case 'expiry': return new Date(a.end_date).getTime() - new Date(b.end_date).getTime();
        case 'start_desc': return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
        default: return 0;
      }
    });

    return result;
  }, [search, statusFilter, floorFilter, companyFilter, valueMin, valueMax, activeSortKey]);

  const SortIcon = ({ col }: { col: ColSortKey }) => {
    if (colSort?.col === col) {
      return colSort.dir === 'asc' ? <ArrowUp size={12} className="text-interactive" /> : <ArrowDown size={12} className="text-interactive" />;
    }
    return <ArrowUpDown size={12} className="text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />;
  };

  // Check if end date is within 90 days
  const isExpiryClose = newForm.endDate
    ? (new Date(newForm.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24) < 90 && new Date(newForm.endDate) > new Date()
    : false;

  const toggleFloor = (f: number) => {
    setNewForm(prev => ({
      ...prev,
      floors: prev.floors.includes(f) ? prev.floors.filter(x => x !== f) : [...prev.floors, f].sort((a, b) => a - b),
    }));
  };

  const handleSaveContract = () => {
    const errors: Record<string, boolean> = {};
    const tenantName = newForm.tenant === '__custom__' ? newForm.customTenant.trim() : newForm.tenant;
    if (!tenantName) errors.tenant = true;
    if (!newForm.startDate) errors.startDate = true;
    if (!newForm.endDate) errors.endDate = true;
    if (!newForm.monthlyValue || parseFloat(newForm.monthlyValue) <= 0) errors.monthlyValue = true;

    setNewFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    toast.success('✅ Contrato criado com sucesso');
    setNewDialogOpen(false);
    setNewForm({ tenant: '', customTenant: '', floors: [], startDate: '', endDate: '', monthlyValue: '', adjustmentIndex: 'IGPM', status: 'active', pdfFile: null, observations: '' });
    setNewFormErrors({});
  };

  const handleExportCSV = () => {
    const headers = ['Locatário', 'CNPJ', 'Andares', 'Valor/mês', 'Data início', 'Vencimento', 'Índice', 'Status'];
    const rows = filtered.map(c => [
      c.tenant_name,
      c.cnpj,
      c.floors.join('; '),
      c.monthly_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
      new Date(c.start_date).toLocaleDateString('pt-BR'),
      new Date(c.end_date).toLocaleDateString('pt-BR'),
      c.adjustment_index,
      c.status,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const now = new Date();
    a.href = url;
    a.download = `Contratos_360JK_${now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(' de ', '')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('📊 Planilha exportada com sucesso');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">Contratos</h1>
          <p className="text-sm text-muted-foreground">{mockContracts.length} contratos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 h-11 sm:h-10" onClick={handleExportCSV}><Download size={16} />Exportar</Button>
          {permissions.canModifyAllContracts && (
            <Button className="premium-gradient gap-2 h-11 sm:h-10" onClick={() => setNewDialogOpen(true)}><Plus size={16} />Novo Contrato</Button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por locatário, CNPJ ou nº do contrato..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <select
            value={colSort ? '' : sortBy}
            onChange={e => { setSortBy(e.target.value as SortKey); setColSort(null); }}
            className="px-3 py-1.5 rounded-lg border border-input bg-background text-sm text-foreground"
          >
            {sortOptions.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-1.5">
            <SlidersHorizontal size={14} /> Filtros
            {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-interactive" />}
          </Button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {statusFilters.map(f => (
          <button key={f.key} onClick={() => setStatusFilter(f.key)} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${statusFilter === f.key ? 'bg-interactive text-interactive-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Advanced filters */}
      {showFilters && (
        <div className="bg-card rounded-xl p-4 premium-shadow border border-border/40 space-y-3 animate-fade-in">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Andar</label>
              <Input type="number" value={floorFilter} onChange={e => setFloorFilter(e.target.value)} placeholder="Ex: 7" className="h-9 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Empresa</label>
              <Input value={companyFilter} onChange={e => setCompanyFilter(e.target.value)} placeholder="Buscar empresa..." className="h-9 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Valor mín (R$)</label>
              <Input type="number" value={valueMin} onChange={e => setValueMin(e.target.value)} placeholder="0" className="h-9 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Valor máx (R$)</label>
              <Input type="number" value={valueMax} onChange={e => setValueMax(e.target.value)} placeholder="999.999" className="h-9 text-sm" />
            </div>
          </div>
        </div>
      )}

      {/* Result counter */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Exibindo <span className="font-semibold text-foreground">{filtered.length}</span> de {mockContracts.length} contratos</p>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-xs text-destructive"><X size={12} />Limpar filtros</Button>
        )}
      </div>

      {/* Mobile card view */}
      <div className="sm:hidden space-y-3">
        {filtered.map(c => (
          <div key={c.id} className="bg-card rounded-xl p-4 premium-shadow cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedContract(c)}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <FileText size={14} className="text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{c.tenant_name}</p>
                  <p className="text-xs text-muted-foreground">{c.number}</p>
                </div>
              </div>
              <StatusBadge status={c.status} />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{c.floors.join(", ")}º andar</span>
              <span>Vence: {new Date(c.end_date).toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
            </div>
            {permissions.canViewContractValues && c.monthly_value > 0 && (
              <p className="text-sm font-semibold text-foreground mt-2">R$ {c.monthly_value.toLocaleString("pt-BR")}/mês</p>
            )}
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block bg-card rounded-2xl premium-shadow overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer group" onClick={() => handleColSort('tenant')}>
                  <div className="flex items-center gap-1">Locatário <SortIcon col="tenant" /></div>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">CNPJ</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer group" onClick={() => handleColSort('floor')}>
                  <div className="flex items-center gap-1">Andares <SortIcon col="floor" /></div>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden xl:table-cell">Área (m²)</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden xl:table-cell">Vigência</th>
                {permissions.canViewContractValues && (
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer group" onClick={() => handleColSort('value')}>
                    <div className="flex items-center justify-end gap-1">Valor/mês <SortIcon col="value" /></div>
                  </th>
                )}
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Índice</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr
                  key={c.id}
                  className={`border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors cursor-pointer ${i % 2 === 1 ? "bg-muted/10" : ""}`}
                  onClick={() => setSelectedContract(c)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <FileText size={14} className="text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm font-medium text-foreground truncate block max-w-[160px]">{c.tenant_name}</span>
                        <p className="text-xs text-muted-foreground">{c.number}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">{c.cnpj}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{c.floors.join(", ")}º</td>
                  <td className="px-4 py-3 text-sm text-foreground hidden xl:table-cell">{c.area_m2.toLocaleString("pt-BR")}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground hidden xl:table-cell">
                    {new Date(c.start_date).toLocaleDateString("pt-BR")} — {new Date(c.end_date).toLocaleDateString("pt-BR")}
                  </td>
                  {permissions.canViewContractValues && (
                    <td className="px-4 py-3 text-right text-sm font-semibold text-foreground">
                      {c.monthly_value > 0 ? `R$ ${c.monthly_value.toLocaleString("pt-BR")}` : <span className="text-muted-foreground italic">A confirmar</span>}
                    </td>
                  )}
                  <td className="px-4 py-3 text-center text-sm text-muted-foreground hidden lg:table-cell">{c.adjustment_index}</td>
                  <td className="px-4 py-3 text-center"><StatusBadge status={c.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ContractDrawer contract={selectedContract} open={!!selectedContract} onClose={() => setSelectedContract(null)} />

      {/* New Contract Dialog */}
      <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
        <DialogContent className="w-full max-w-lg max-h-[90vh] overflow-y-auto sm:max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Novo Contrato</DialogTitle>
            <DialogDescription>Preencha os dados para cadastrar um novo contrato.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Locatário <span className="text-destructive">*</span></Label>
              <Select value={newForm.tenant} onValueChange={v => { setNewForm(p => ({ ...p, tenant: v })); setNewFormErrors(p => ({ ...p, tenant: false })); }}>
                <SelectTrigger className={newFormErrors.tenant ? 'border-destructive' : ''}><SelectValue placeholder="Selecione o locatário" /></SelectTrigger>
                <SelectContent>
                  {tenantOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  <SelectItem value="__custom__">+ Novo locatário</SelectItem>
                </SelectContent>
              </Select>
              {newForm.tenant === '__custom__' && (
                <Input placeholder="Nome do novo locatário" value={newForm.customTenant} onChange={e => setNewForm(p => ({ ...p, customTenant: e.target.value }))} className={`mt-2 ${newFormErrors.tenant ? 'border-destructive' : ''}`} />
              )}
              {newFormErrors.tenant && <p className="text-xs text-destructive">Campo obrigatório</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Andar(es)</Label>
              <div className="flex flex-wrap gap-1.5">
                {allFloors.map(f => (
                  <button key={f} onClick={() => toggleFloor(f)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${newForm.floors.includes(f) ? 'bg-interactive text-interactive-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Data de início <span className="text-destructive">*</span></Label>
                <Input type="date" value={newForm.startDate} onChange={e => { setNewForm(p => ({ ...p, startDate: e.target.value })); setNewFormErrors(p => ({ ...p, startDate: false })); }} className={newFormErrors.startDate ? 'border-destructive' : ''} />
                {newFormErrors.startDate && <p className="text-xs text-destructive">Campo obrigatório</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Data de vencimento <span className="text-destructive">*</span></Label>
                <Input type="date" value={newForm.endDate} onChange={e => { setNewForm(p => ({ ...p, endDate: e.target.value })); setNewFormErrors(p => ({ ...p, endDate: false })); }} className={newFormErrors.endDate ? 'border-destructive' : ''} />
                {newFormErrors.endDate && <p className="text-xs text-destructive">Campo obrigatório</p>}
                {isExpiryClose && (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-semibold"><AlertTriangle size={12} /> Próximo do vencimento</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Valor mensal (R$) <span className="text-destructive">*</span></Label>
                <Input type="number" placeholder="0,00" value={newForm.monthlyValue} onChange={e => { setNewForm(p => ({ ...p, monthlyValue: e.target.value })); setNewFormErrors(p => ({ ...p, monthlyValue: false })); }} className={newFormErrors.monthlyValue ? 'border-destructive' : ''} />
                {newFormErrors.monthlyValue && <p className="text-xs text-destructive">Campo obrigatório</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Índice de reajuste</Label>
                <Select value={newForm.adjustmentIndex} onValueChange={v => setNewForm(p => ({ ...p, adjustmentIndex: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {adjustmentIndices.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select value={newForm.status} onValueChange={v => setNewForm(p => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {contractStatuses.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Upload do contrato (PDF)</Label>
              <div className="border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-interactive/50 transition-colors cursor-pointer relative">
                <input type="file" accept=".pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setNewForm(p => ({ ...p, pdfFile: e.target.files?.[0] || null }))} />
                {newForm.pdfFile ? (
                  <div className="flex items-center gap-2 justify-center">
                    <FileText size={16} className="text-destructive" />
                    <span className="text-sm text-foreground">{newForm.pdfFile.name}</span>
                    <span className="text-xs text-muted-foreground">({(newForm.pdfFile.size / 1024).toFixed(0)} KB)</span>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Clique para selecionar ou arraste o arquivo PDF</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Observações</Label>
              <Textarea placeholder="Observações opcionais..." value={newForm.observations} onChange={e => setNewForm(p => ({ ...p, observations: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewDialogOpen(false)}>Cancelar</Button>
            <Button className="premium-gradient" onClick={handleSaveContract}>Salvar Contrato</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Contratos;
