import { useState, useMemo, useRef } from "react";
import { getHGRE11PortfolioBuildings, mockTenantContracts, type TenantContract } from "@/lib/mock-data";
import {
  mockGuarantees, mockInsurances, mockIPTUs, mockCommonAreaContracts,
  mockReajustes, mockContractDocuments,
  guaranteeTypeLabels, guaranteeTypeBadgeColor, contractTypeLabels, iptuResponsibleLabels,
  type ContractDocumentFile, type ContractGuarantee,
} from "@/lib/contract-finance-data";
import { getContractHealth, getDocumentHealth, healthColors, healthLabels, daysUntil } from "@/lib/health-utils";
import { generateReport, type ReportConfig, type ReportSection } from "@/lib/pdf-report-service";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Search, FileText, Upload, Download, Info, RefreshCw, ChevronUp, ChevronDown, ChevronsUpDown, AlertTriangle, Building2, CalendarIcon, Shield, Eye, Pencil, ChevronRight, MoreVertical, Plus, History, TrendingUp } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, Cell } from "recharts";
import { mockAlteracoesValor } from "@/lib/revisionais-data";
import { toast } from "sonner";
import RevisionaisTab from "@/components/contratos/RevisionaisTab";
import CompetenciaTab from "@/components/contratos/CompetenciaTab";
import ContractManagementSection from "@/components/contratos/ContractManagementSection";
import IptuTab from "@/components/contratos/IptuTab";
import { MesReajusteChart, ConcentracaoRevisionaisChart } from "@/components/contratos/PatriaContractCharts";

type ContractStatus = 'all' | 'active' | 'expiring' | 'expired' | 'negotiation' | 'inactive';
type SortKey = 'tenant' | 'unit' | 'area' | 'rpsm2' | 'value' | 'monthsRemaining';
type SortDir = 'asc' | 'desc';
type GuaranteeFilter = 'all' | 'fianca_bancaria' | 'caucao' | 'seguro_fianca' | 'titulo_capitalizacao' | 'expiring' | 'expired';

const INACTIVE_KEY = 'patria:inactive-contracts:v1';
const STATUS_OVERRIDE_KEY = 'patria:contract-status-override:v1';

type ManualStatus = 'active' | 'expiring' | 'expired' | 'negotiation';

const manualStatusInfo: Record<ManualStatus, { label: string; status: 'healthy' | 'warning' | 'critical' }> = {
  active: { label: 'Ativo', status: 'healthy' },
  expiring: { label: 'Vencendo', status: 'warning' },
  expired: { label: 'Vencido', status: 'critical' },
  negotiation: { label: 'Em negociação', status: 'warning' },
};
function unitNumber(u: string): number {
  const n = parseInt((u.match(/\d+/g) || []).join('') || '', 10);
  return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER;
}

const statusFilters: { value: ContractStatus; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Ativos' },
  { value: 'expiring', label: 'Vencendo' },
  { value: 'expired', label: 'Vencidos' },
  { value: 'negotiation', label: 'Em Negociação' },
  { value: 'inactive', label: 'Inativos' },
];

const guaranteeFilters: { value: GuaranteeFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'fianca_bancaria', label: 'Fiança Bancária' },
  { value: 'caucao', label: 'Caução' },
  { value: 'seguro_fianca', label: 'Seguro Fiança' },
  { value: 'titulo_capitalizacao', label: 'Título' },
  { value: 'expiring', label: 'Vencendo' },
  { value: 'expired', label: 'Vencidas' },
];

function monthsDiff(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  return (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth());
}

function daysDiff(dateStr: string | null): number {
  if (!dateStr) return 99999; // caução never expires
  return Math.floor((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function getNextAdjustmentDate(contractStart: string): Date {
  const start = new Date(contractStart);
  const now = new Date();
  const anniversary = new Date(now.getFullYear(), start.getMonth(), start.getDate());
  if (anniversary <= now) {
    anniversary.setFullYear(anniversary.getFullYear() + 1);
  }
  return anniversary;
}

function formatMonthYear(d: Date) {
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function getContractMonthlyValue(c: TenantContract) {
  return c.price_per_m2 ? c.area_m2 * c.price_per_m2 : 0;
}

function getContractStatusInfo(c: TenantContract) {
  if (!c.contract_end) return { label: 'Vago', status: 'critical' as const, months: -999 };
  const months = monthsDiff(c.contract_end);
  if (months < 0) return { label: 'Vencido', status: 'critical' as const, months };
  if (months <= 6) return { label: 'Vencendo', status: 'warning' as const, months };
  return { label: 'Ativo', status: 'healthy' as const, months };
}

function getGuaranteeStatus(g: ContractGuarantee): { label: string; color: string } {
  if (g.type === 'fianca_bancaria' && !g.documentUrl) return { label: 'Sem doc.', color: 'bg-gray-100 text-gray-600' };
  const days = daysDiff(g.valid_until);
  if (days < 0) return { label: 'VENCIDA', color: 'bg-red-100 text-red-700' };
  if (days < 30) return { label: 'Crítico', color: 'bg-red-100 text-red-700' };
  if (days < 60) return { label: 'Vencendo', color: 'bg-amber-100 text-amber-700' };
  return { label: 'Válida', color: 'bg-emerald-100 text-emerald-700' };
}

export default function ProprietarioContratos() {
  const buildings = getHGRE11PortfolioBuildings();
  const portfolioBuildingIds = new Set(buildings.map((b) => b.id));
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<ContractStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [showNewContract, setShowNewContract] = useState(false);
  const [newContract, setNewContract] = useState({
    tenant: '', buildingId: '', unit: '', area: '', pricePerM2: '', type: 'net',
    start: '', end: '', index: 'IPCA', guarantee: 'fianca_bancaria',
  });
  const [newContractFile, setNewContractFile] = useState<File | null>(null);
  const [drawerTab, setDrawerTab] = useState('resumo');
  const [drawerAction, setDrawerAction] = useState<'edit' | 'aditivo' | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('monthsRemaining');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<TenantContract | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const showAllBuildings = selectedBuildingId === 'all';

  // Guarantee tab state
  const [guaranteeFilter, setGuaranteeFilter] = useState<GuaranteeFilter>('all');
  const [renewalDialogOpen, setRenewalDialogOpen] = useState(false);
  const [renewalTarget, setRenewalTarget] = useState<ContractGuarantee | null>(null);
  const [renewalDate, setRenewalDate] = useState<Date>();
  const [renewalValue, setRenewalValue] = useState('');
  const [renewalCertificate, setRenewalCertificate] = useState('');
  const [renewalFile, setRenewalFile] = useState<File | null>(null);
  const [renewalNotes, setRenewalNotes] = useState('');
  const renewalFileRef = useRef<HTMLInputElement>(null);

  // Aplicar reajuste (calculado x negociado)
  const [applyAdjTarget, setApplyAdjTarget] = useState<any>(null);
  const [applyAdjMode, setApplyAdjMode] = useState<'calculado' | 'negociado'>('calculado');
  const [applyAdjValue, setApplyAdjValue] = useState('');
  const [applyAdjReason, setApplyAdjReason] = useState('');

  // ── Inativos (manual) ──
  const [inactiveIds, setInactiveIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(INACTIVE_KEY) || '[]'); } catch { return []; }
  });
  const toggleInactive = (id: string) => {
    setInactiveIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem(INACTIVE_KEY, JSON.stringify(next));
      toast.success(prev.includes(id) ? 'Contrato reativado' : 'Contrato marcado como inativo');
      return next;
    });
  };

  // ── Status manual (override) ──
  const [statusOverrides, setStatusOverrides] = useState<Record<string, ManualStatus>>(() => {
    try { return JSON.parse(localStorage.getItem(STATUS_OVERRIDE_KEY) || '{}'); } catch { return {}; }
  });
  const setManualStatus = (id: string, value: ManualStatus | 'inactive' | 'auto') => {
    if (value === 'inactive') {
      if (!inactiveIds.includes(id)) toggleInactive(id);
      setStatusOverrides(prev => {
        const next = { ...prev }; delete next[id];
        localStorage.setItem(STATUS_OVERRIDE_KEY, JSON.stringify(next));
        return next;
      });
      return;
    }
    if (inactiveIds.includes(id)) toggleInactive(id);
    setStatusOverrides(prev => {
      const next = { ...prev };
      if (value === 'auto') delete next[id]; else next[id] = value;
      localStorage.setItem(STATUS_OVERRIDE_KEY, JSON.stringify(next));
      return next;
    });
    if (value !== 'auto') toast.success(`Status alterado para "${manualStatusInfo[value as ManualStatus].label}"`);
  };
  const effectiveInfo = (c: TenantContract) => {
    const ov = statusOverrides[c.id];
    if (ov) {
      const m = manualStatusInfo[ov];
      return { label: m.label, status: m.status, months: c.contract_end ? monthsDiff(c.contract_end) : -999, manual: true };
    }
    return { ...getContractStatusInfo(c), manual: false };
  };

  // ── Tenant contracts filtered ──
  const tenantContracts = useMemo(() => {
    let filtered = mockTenantContracts.filter(c => c.tenant_name);
    if (!showAllBuildings) {
      filtered = filtered.filter(c => c.building_id === selectedBuildingId);
    } else {
      filtered = filtered.filter(c => portfolioBuildingIds.has(c.building_id));
    }
    if (statusFilter === 'inactive') {
      filtered = filtered.filter(c => inactiveIds.includes(c.id));
    } else {
      filtered = filtered.filter(c => !inactiveIds.includes(c.id));
    }
    if (statusFilter !== 'all' && statusFilter !== 'inactive') {
      filtered = filtered.filter(c => {
        const info = getContractStatusInfo(c);
        if (statusFilter === 'expiring') return info.status === 'warning';
        if (statusFilter === 'expired') return info.months < 0;
        if (statusFilter === 'active') return info.status === 'healthy';
        return false;
      });
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.tenant_name?.toLowerCase().includes(q) ||
        c.tenant_cnpj?.toLowerCase().includes(q) ||
        c.unit_id.toLowerCase().includes(q)
      );
    }
    filtered.sort((a, b) => {
      let va: number, vb: number;
      switch (sortKey) {
        case 'tenant': {
          const cmp = (a.tenant_name || '').localeCompare(b.tenant_name || '');
          return sortDir === 'asc' ? cmp : -cmp;
        }
        case 'unit': {
          const na = unitNumber(a.unit_id), nb = unitNumber(b.unit_id);
          const cmp = na !== nb ? na - nb : a.unit_id.localeCompare(b.unit_id, 'pt-BR', { numeric: true });
          return sortDir === 'asc' ? cmp : -cmp;
        }
        case 'area': va = a.area_m2; vb = b.area_m2; break;
        case 'rpsm2': va = a.price_per_m2 || 0; vb = b.price_per_m2 || 0; break;
        case 'value': va = getContractMonthlyValue(a); vb = getContractMonthlyValue(b); break;
        case 'monthsRemaining':
          va = a.contract_end ? monthsDiff(a.contract_end) : -9999;
          vb = b.contract_end ? monthsDiff(b.contract_end) : -9999;
          break;
        default: return 0;
      }
      return sortDir === 'asc' ? va - vb : vb - va;
    });
    return filtered;
  }, [selectedBuildingId, statusFilter, searchQuery, sortKey, sortDir, showAllBuildings, portfolioBuildingIds, inactiveIds]);

  // ── Common area contracts ──
  const commonContracts = useMemo(() => {
    if (showAllBuildings) return mockCommonAreaContracts.filter(c => portfolioBuildingIds.has(c.building_id));
    return mockCommonAreaContracts.filter(c => c.building_id === selectedBuildingId);
  }, [selectedBuildingId, showAllBuildings, portfolioBuildingIds]);

  // ── Guarantees for current building selection ──
  const allGuarantees = useMemo(() => {
    const contractIds = new Set(
      mockTenantContracts
        .filter(c => c.tenant_name && (showAllBuildings ? portfolioBuildingIds.has(c.building_id) : c.building_id === selectedBuildingId))
        .map(c => c.id)
    );
    return mockGuarantees.filter(g => contractIds.has(g.contract_id));
  }, [selectedBuildingId, showAllBuildings, portfolioBuildingIds]);

  const filteredGuarantees = useMemo(() => {
    let list = allGuarantees;
    if (guaranteeFilter === 'expiring') {
      list = list.filter(g => { const d = daysDiff(g.valid_until); return d >= 0 && d <= 60; });
    } else if (guaranteeFilter === 'expired') {
      list = list.filter(g => daysDiff(g.valid_until) < 0);
    } else if (guaranteeFilter !== 'all') {
      list = list.filter(g => g.type === guaranteeFilter);
    }
    return list;
  }, [allGuarantees, guaranteeFilter]);

  // Guarantee KPIs
  const guaranteeKpis = useMemo(() => {
    const active = allGuarantees.filter(g => daysDiff(g.valid_until) >= 0 || g.valid_until === null);
    const expiring = allGuarantees.filter(g => { const d = daysDiff(g.valid_until); return d >= 0 && d <= 60; });
    const expired = allGuarantees.filter(g => daysDiff(g.valid_until) < 0);
    const totalValue = active.reduce((s, g) => s + g.value, 0);
    return { active: active.length, expiring: expiring.length, expired: expired.length, totalValue };
  }, [allGuarantees]);

  // ── KPI calculations ──
  const kpis = useMemo(() => {
    const activeContracts = tenantContracts.filter(c => c.contract_end && monthsDiff(c.contract_end) >= 0);
    const criticalContracts = tenantContracts.filter(c => {
      if (!c.contract_end) return false;
      const m = monthsDiff(c.contract_end);
      return m < 2;
    });
    const totalRevenue = activeContracts.reduce((s, c) => s + getContractMonthlyValue(c), 0);
    const totalArea = activeContracts.reduce((s, c) => s + c.area_m2, 0);
    const rpsm2Medio = totalArea > 0 ? Math.round(totalRevenue / totalArea) : 0;
    
    const selectedBldg = showAllBuildings ? null : buildings.find(b => b.id === selectedBuildingId);
    const totalGLA = showAllBuildings
      ? buildings.reduce((s, b) => s + (b.gla_m2 || b.total_area_m2), 0)
      : (selectedBldg?.gla_m2 || selectedBldg?.total_area_m2 || 1);
    const glaPct = Math.round((totalArea / totalGLA) * 100);

    let nextAdj: Date | null = null;
    let nextAdjIndex = '';
    tenantContracts.forEach(c => {
      if (c.contract_start && c.contract_end && monthsDiff(c.contract_end) > 0) {
        const adj = getNextAdjustmentDate(c.contract_start);
        if (!nextAdj || adj < nextAdj) {
          nextAdj = adj;
          nextAdjIndex = c.contract_type === 'net' ? 'IGP-M' : 'IPCA';
        }
      }
    });
    const adjDaysAway = nextAdj ? Math.floor((nextAdj.getTime() - Date.now()) / (1000*60*60*24)) : 999;

    let nextExpiry: Date | null = null;
    let nextExpiryTenant = '';
    activeContracts.forEach(c => {
      if (!c.contract_end) return;
      const d = new Date(c.contract_end);
      if (!nextExpiry || d < nextExpiry) { nextExpiry = d; nextExpiryTenant = c.tenant_name || c.unit_id; }
    });
    const expiryDaysAway = nextExpiry ? Math.floor(((nextExpiry as Date).getTime() - Date.now()) / (1000*60*60*24)) : 999;

    return {
      total: tenantContracts.length,
      activeCount: activeContracts.length,
      commonCount: commonContracts.length,
      criticalCount: criticalContracts.length,
      totalRevenue,
      rpsm2Medio,
      totalArea,
      glaPct,
      nextAdj,
      nextAdjIndex,
      adjDaysAway,
      nextExpiry: nextExpiry as Date | null,
      nextExpiryTenant,
      expiryDaysAway,
    };
  }, [tenantContracts, commonContracts, buildings, selectedBuildingId, showAllBuildings]);

  const commonKpis = useMemo(() => {
    const totalRevenue = commonContracts.reduce((s, c) => s + c.monthly_revenue, 0);
    const totalArea = commonContracts.reduce((s, c) => s + c.area_m2, 0);
    let nextExpiry: Date | null = null;
    commonContracts.forEach(c => {
      const d = new Date(c.contract_end);
      if (!nextExpiry || d < nextExpiry) nextExpiry = d;
    });
    return { count: commonContracts.length, totalRevenue, totalArea, nextExpiry };
  }, [commonContracts]);

  const selectedContract = selectedContractId
    ? mockTenantContracts.find(c => c.id === selectedContractId) || mockCommonAreaContracts.find(c => c.id === selectedContractId) as any
    : null;

  const guarantee = selectedContract ? mockGuarantees.find(g => g.contract_id === selectedContract.id) : null;
  const insurance = selectedContract ? mockInsurances.find(i => i.contract_id === selectedContract.id) : null;
  const iptu = selectedContract ? mockIPTUs.find(i => i.contract_id === selectedContract.id) : null;
  const contractDocs = selectedContract ? mockContractDocuments.filter(d => d.contractId === selectedContract.id) : [];

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ChevronsUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortDir === 'asc' ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />;
  };

  const handleUploadOpen = (c: TenantContract) => {
    setUploadTarget(c);
    setUploadFile(null);
    setUploadDialogOpen(true);
  };

  const handleUploadConfirm = () => {
    if (!uploadFile || !uploadTarget) return;
    const newDoc: ContractDocumentFile = {
      id: `cd-${Date.now()}`,
      contractId: uploadTarget.id,
      fileName: uploadFile.name,
      fileSize: `${(uploadFile.size / (1024 * 1024)).toFixed(1)} MB`,
      uploadDate: new Date().toISOString().slice(0, 10),
      type: 'contract_pdf',
    };
    mockContractDocuments.push(newDoc);
    setUploadDialogOpen(false);
    toast.success("Contrato anexado com sucesso");
  };

  const handleDownload = (c: TenantContract) => {
    const docs = mockContractDocuments.filter(d => d.contractId === c.id);
    if (docs.length === 0) {
      toast.info("Nenhum documento anexado ainda");
      handleUploadOpen(c);
    } else {
      toast.success(`Download: ${docs[0].fileName}`);
    }
  };

  const handleCriticalClick = () => {
    setStatusFilter('expired');
  };

  const handleExportPDF = async () => {
    const bldgName = showAllBuildings ? 'Portfólio Completo' : (buildings.find(b => b.id === selectedBuildingId)?.name || '');
    const config: ReportConfig = {
      title: 'Relatório de Contratos',
      subtitle: `Visão Consolidada — ${bldgName}`,
      period: new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      module: 'Contratos',
      gestorName: 'Natalia Landi',
      fundName: 'Safra FII',
      tableOfContents: [
        { page: 2, title: 'Sumário Executivo' },
        { page: 3, title: 'Contratos de Locatários' },
        { page: 4, title: 'Vencimentos' },
        { page: 5, title: 'Calendário de Reajustes' },
      ],
      previewKpis: [
        { value: String(kpis.total), label: 'Contratos' },
        { value: `R$ ${(kpis.totalRevenue / 1000).toFixed(0)}k`, label: 'Receita/Mês' },
        { value: kpis.nextExpiry ? formatMonthYear(kpis.nextExpiry) : '—', label: 'Próx. Vencimento' },
        { value: kpis.nextAdj ? formatMonthYear(kpis.nextAdj) : '—', label: 'Próx. Reajuste' },
      ],
    };
    const sections: ReportSection[] = [
      {
        title: 'Sumário Executivo',
        type: 'kpi-cards',
        kpis: [
          { value: String(kpis.total), label: 'Total de Contratos', sub: `${kpis.activeCount} vigentes` },
          { value: String(kpis.criticalCount), label: 'Contratos Críticos', color: kpis.criticalCount > 0 ? [239,68,68] : [16,185,129] },
          { value: `R$ ${kpis.totalRevenue.toLocaleString('pt-BR')}`, label: 'Receita Contratada', sub: `R$/m² médio: R$ ${kpis.rpsm2Medio}` },
          { value: kpis.nextExpiry ? formatMonthYear(kpis.nextExpiry) : '—', label: 'Próximo Vencimento', sub: kpis.nextExpiryTenant },
          { value: kpis.nextAdj ? formatMonthYear(kpis.nextAdj) : '—', label: 'Próximo Reajuste', sub: kpis.nextAdjIndex },
        ],
      },
      {
        title: 'Contratos de Locatários',
        type: 'table',
        tableHeaders: ['Locatário', 'Unidade', 'Área (m²)', 'R$/m²', 'Valor/Mês', 'Índice', 'Vigência', 'Meses Rest.', 'Saúde'],
        tableRows: tenantContracts.map(c => {
          const info = getContractStatusInfo(c);
          return [
            c.tenant_name || '—', c.unit_id, String(c.area_m2),
            c.price_per_m2 ? `R$ ${c.price_per_m2}` : '—',
            `R$ ${getContractMonthlyValue(c).toLocaleString('pt-BR')}`,
            c.contract_type === 'net' ? 'IGP-M' : 'IPCA',
            c.contract_start && c.contract_end ? `${new Date(c.contract_start).toLocaleDateString('pt-BR', { month: '2-digit', year: '2-digit' })} → ${new Date(c.contract_end).toLocaleDateString('pt-BR', { month: '2-digit', year: '2-digit' })}` : '—',
            info.months < 0 ? 'VENCIDO' : `${info.months}m`,
            info.label,
          ];
        }),
        rowHealthCodes: tenantContracts.map(c => {
          const info = getContractStatusInfo(c);
          return info.status === 'healthy' ? 'S' : info.status === 'warning' ? 'A' : 'C';
        }),
      },
      {
        title: 'Áreas Comuns',
        type: 'table',
        tableHeaders: ['Área', 'Operador', 'Área (m²)', 'Receita/Mês', 'Índice', 'Vigência', 'Saúde'],
        tableRows: commonContracts.map(c => [
          c.area_name, c.operator, String(c.area_m2),
          `R$ ${c.monthly_revenue.toLocaleString('pt-BR')}`, c.adjustment_index,
          `${new Date(c.contract_start).toLocaleDateString('pt-BR', { month: '2-digit', year: '2-digit' })} → ${new Date(c.contract_end).toLocaleDateString('pt-BR', { month: '2-digit', year: '2-digit' })}`,
          healthLabels[getContractHealth(c.contract_end)].pt,
        ]),
      },
    ];
    await generateReport(config, sections);
    toast.success("PDF gerado com sucesso");
  };

  // ── Timeline data (24 months) ──
  const timelineData = useMemo(() => {
    const now = new Date();
    const months: { key: string; label: string; date: Date }[] = [];
    for (let i = 0; i < 24; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: `${['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'][d.getMonth()]}/${String(d.getFullYear()).slice(2)}`, date: d });
    }
    const contracts = tenantContracts.filter(c => c.contract_end);
    return { months, contracts };
  }, [tenantContracts]);

  // ── Reajustes data ──
  const reajustesData = useMemo(() => {
    const IGPM_RATE = 5.8;
    const IPCA_RATE = 4.2;
    return tenantContracts
      .filter(c => c.contract_start && c.contract_end && monthsDiff(c.contract_end) > 0)
      .map(c => {
        const nextDate = getNextAdjustmentDate(c.contract_start!);
        const index = c.contract_type === 'net' ? 'IGP-M' : 'IPCA';
        const rate = index === 'IGP-M' ? IGPM_RATE : IPCA_RATE;
        const currentValue = getContractMonthlyValue(c);
        const newValue = Math.round(currentValue * (1 + rate / 100));
        const daysAway = Math.floor((nextDate.getTime() - Date.now()) / (1000*60*60*24));
        return { ...c, nextDate, index, rate, currentValue, newValue, daysAway, status: daysAway <= 30 ? 'Aplicar' as const : 'Programado' as const };
      })
      .sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime());
  }, [tenantContracts]);

  const building = buildings.find(b => b.id === selectedBuildingId);
  const getBuildingName = (bid: string) => buildings.find(b => b.id === bid)?.short_name || buildings.find(b => b.id === bid)?.name || '';

  // Guarantee helpers
  const getContractForGuarantee = (g: ContractGuarantee) => mockTenantContracts.find(c => c.id === g.contract_id);

  const openRenewalDialog = (g: ContractGuarantee) => {
    setRenewalTarget(g);
    setRenewalDate(undefined);
    setRenewalValue(String(g.value));
    setRenewalCertificate(g.certificateNumber || '');
    setRenewalFile(null);
    setRenewalNotes('');
    setRenewalDialogOpen(true);
  };

  const handleRenewalSave = () => {
    if (!renewalTarget || !renewalDate) return;
    const idx = mockGuarantees.findIndex(g => g.id === renewalTarget.id);
    if (idx >= 0) {
      // Add old to renewal history
      mockGuarantees[idx].renewalHistory.push({
        year: new Date().getFullYear(),
        expiryDate: mockGuarantees[idx].valid_until || '',
        documentUrl: mockGuarantees[idx].documentUrl || null,
        uploadDate: mockGuarantees[idx].documentUploadDate || null,
      });
      mockGuarantees[idx].valid_until = renewalDate.toISOString().slice(0, 10);
      mockGuarantees[idx].value = Number(renewalValue) || mockGuarantees[idx].value;
      if (renewalCertificate) mockGuarantees[idx].certificateNumber = renewalCertificate;
      if (renewalFile) {
        mockGuarantees[idx].documentUrl = renewalFile.name;
        mockGuarantees[idx].documentUploadDate = new Date().toISOString().slice(0, 10);
      }
    }
    setRenewalDialogOpen(false);
    toast.success(`Garantia renovada com sucesso. Próximo vencimento: ${format(renewalDate, 'dd/MM/yyyy')}`);
  };

  const openContract = (id: string, action: 'edit' | 'aditivo' | null) => {
    setDrawerAction(null);
    setSelectedContractId(id);
    setDrawerTab('resumo');
    if (action) setTimeout(() => setDrawerAction(action), 120);
  };

  const openApplyAdjustment = (r: any) => {
    setApplyAdjTarget(r);
    setApplyAdjMode('calculado');
    setApplyAdjValue(String(r.newValue));
    setApplyAdjReason('');
  };

  const handleApplyAdjustment = () => {
    if (!applyAdjTarget) return;
    const novo = Number(applyAdjValue) || 0;
    if (novo <= 0) { toast.error('Informe um novo valor válido.'); return; }
    const negociado = applyAdjMode === 'negociado';
    if (negociado && !applyAdjReason.trim()) { toast.error('Informe o motivo da negociação.'); return; }

    mockAlteracoesValor.push({
      id: `av-${Date.now()}`,
      contrato_id: applyAdjTarget.id,
      data: new Date().toISOString().slice(0, 10),
      tipo: negociado ? 'reajuste_negociado' : 'reajuste_indice',
      valor_anterior: applyAdjTarget.currentValue,
      valor_novo: novo,
      observacao: negociado
        ? applyAdjReason
        : `${applyAdjTarget.index} +${applyAdjTarget.rate}%`,
    });

    const contrato = mockTenantContracts.find(c => c.id === applyAdjTarget.id);
    if (contrato && contrato.area_m2 > 0) {
      contrato.price_per_m2 = Number((novo / contrato.area_m2).toFixed(2));
    }

    toast.success(
      negociado
        ? `Reajuste negociado aplicado (R$ ${novo.toLocaleString('pt-BR')}). Contagem de revisionais reiniciada.`
        : `Reajuste por ${applyAdjTarget.index} aplicado (R$ ${novo.toLocaleString('pt-BR')}).`
    );
    setApplyAdjTarget(null);
  };

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contratos</h1>
          <p className="text-muted-foreground text-sm">
            {showAllBuildings ? `Portfólio completo — ${buildings.length} ativos` : 'Gestão de contratos de locação e áreas comuns'}
          </p>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center">
          <Button size="sm" className="gap-2" onClick={() => setShowNewContract(true)}>
            <Plus className="h-4 w-4" /> Adicionar Contrato
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-2">
            <Download className="h-4 w-4" /> Exportar PDF
          </Button>
          <Select value={selectedBuildingId} onValueChange={setSelectedBuildingId}>
            <SelectTrigger className="col-span-2 w-full sm:w-64"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2"><Building2 className="h-4 w-4" /> Todos os ativos</div>
              </SelectItem>
              {buildings.map(b => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <KpiCard title="Total de Contratos" value={String(kpis.total)} sub={`${kpis.activeCount} vigentes`} accentColor="hsl(var(--primary))" />
        <KpiCard
          title="Contratos Críticos"
          value={String(kpis.criticalCount)}
          sub="Requerem ação imediata"
          accentColor={kpis.criticalCount > 0 ? '#EF4444' : '#10B981'}
          valueColor={kpis.criticalCount > 0 ? 'text-red-600' : 'text-emerald-600'}
          onClick={handleCriticalClick}
          clickable
        />
        <KpiCard title="Receita Contratada" value={`R$ ${(kpis.totalRevenue / 1000).toFixed(0)}k`} sub={`R$/m² médio: R$ ${kpis.rpsm2Medio}`} accentColor="#1E3A5F" />
        <KpiCard
          title="Próximo Vencimento"
          value={kpis.nextExpiry ? formatMonthYear(kpis.nextExpiry) : '—'}
          sub={kpis.nextExpiryTenant || '—'}
          accentColor={kpis.expiryDaysAway < 180 ? '#F59E0B' : '#3B82F6'}
        />
        <KpiCard
          title="Próximo Reajuste"
          value={kpis.nextAdj ? formatMonthYear(kpis.nextAdj) : '—'}
          sub={kpis.nextAdjIndex}
          accentColor={kpis.adjDaysAway < 60 ? '#F59E0B' : '#10B981'}
        />
      </div>

      {/* ── TABS ── */}
      <Tabs defaultValue="locatarios">
        <TabsList className="grid grid-cols-2 min-[360px]:grid-cols-3 sm:flex">
          <TabsTrigger value="locatarios">Locatários</TabsTrigger>
          <TabsTrigger value="reajustes">Reajustes</TabsTrigger>
          <TabsTrigger value="garantias_tab">Garantias</TabsTrigger>
          <TabsTrigger value="revisionais">Revisionais</TabsTrigger>
          <TabsTrigger value="competencia">Por Competência</TabsTrigger>
          <TabsTrigger value="timeline">Vencimentos</TabsTrigger>
          <TabsTrigger value="iptu_tab">IPTU</TabsTrigger>
        </TabsList>

        {/* ══════ TAB IPTU ══════ */}
        <TabsContent value="iptu_tab" className="space-y-4 mt-4">
          <IptuTab />
        </TabsContent>

        {/* ══════ TAB LOCATÁRIOS ══════ */}
        <TabsContent value="locatarios" className="space-y-4 mt-4">
          <div className="flex flex-wrap gap-2 items-center">
            {statusFilters.map(f => (
              <Button key={f.value} variant={statusFilter === f.value ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(f.value)}>
                {f.label}
              </Button>
            ))}
            <Select value={sortKey === 'unit' ? sortDir : 'none'} onValueChange={v => { if (v !== 'none') { setSortKey('unit'); setSortDir(v as SortDir); } }}>
              <SelectTrigger className="h-9 w-full sm:w-52"><SelectValue placeholder="Ordenar por conjunto" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ordenar por conjunto</SelectItem>
                <SelectItem value="asc">Conjunto: menor → maior</SelectItem>
                <SelectItem value="desc">Conjunto: maior → menor</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative w-full sm:ml-auto sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar locatário, CNPJ ou unidade..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 sm:w-72" />
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="hidden md:block"><Table>
                <TableHeader>
                  <TableRow>
                    {showAllBuildings && <TableHead>Ativo</TableHead>}
                    <TableHead className="cursor-pointer select-none" onClick={() => handleSort('tenant')}>
                      <span className="flex items-center">Locatário <SortIcon k="tenant" /></span>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => handleSort('unit')}>
                      <span className="flex items-center">Conjunto <SortIcon k="unit" /></span>
                    </TableHead>
                    <TableHead className="text-right cursor-pointer select-none" onClick={() => handleSort('area')}>
                      <span className="flex items-center justify-end">Área (m²) <SortIcon k="area" /></span>
                    </TableHead>
                    <TableHead className="text-right cursor-pointer select-none" onClick={() => handleSort('rpsm2')}>
                      <span className="flex items-center justify-end">R$/m² <SortIcon k="rpsm2" /></span>
                    </TableHead>
                    <TableHead className="text-right cursor-pointer select-none" onClick={() => handleSort('value')}>
                      <span className="flex items-center justify-end">Valor/Mês <SortIcon k="value" /></span>
                    </TableHead>
                    <TableHead>Índice</TableHead>
                    <TableHead>Vigência</TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => handleSort('monthsRemaining')}>
                      <span className="flex items-center">Meses Rest. <SortIcon k="monthsRemaining" /></span>
                    </TableHead>
                    <TableHead>Prox. Reajuste</TableHead>
                    <TableHead>Garantia</TableHead>
                    <TableHead>Saúde</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenantContracts.map(c => {
                    const info = getContractStatusInfo(c);
                    const g = mockGuarantees.find(g => g.contract_id === c.id);
                    const rpsm2 = c.price_per_m2 || 0;
                    const rpsm2Color = rpsm2 >= 110 ? 'text-emerald-600' : rpsm2 >= 90 ? 'text-amber-600' : 'text-red-600';
                    const monthsRem = c.contract_end ? monthsDiff(c.contract_end) : -999;
                    const mColor = monthsRem < 0 ? 'text-red-600 font-bold' : monthsRem <= 6 ? 'text-red-600' : monthsRem <= 12 ? 'text-amber-600' : 'text-emerald-600';
                    const nextAdj = c.contract_start ? getNextAdjustmentDate(c.contract_start) : null;
                    const adjDays = nextAdj ? Math.floor((nextAdj.getTime() - Date.now()) / (1000*60*60*24)) : 999;
                    const isExpired = info.status === 'critical' && monthsRem < 0;
                    const isExpiring = info.status === 'warning';

                    return (
                      <TableRow
                        key={c.id}
                        className={`cursor-pointer hover:bg-muted/50 ${isExpired ? 'bg-red-50 border-l-4 border-l-red-500' : isExpiring ? 'bg-amber-50 border-l-4 border-l-amber-400' : ''}`}
                        onClick={() => { setSelectedContractId(c.id); setDrawerTab('resumo'); }}
                      >
                        {showAllBuildings && <TableCell className="text-xs">{getBuildingName(c.building_id)}</TableCell>}
                        <TableCell className="font-medium">{c.tenant_name}</TableCell>
                        <TableCell>{c.unit_id}</TableCell>
                        <TableCell className="text-right">{c.area_m2.toLocaleString('pt-BR')}</TableCell>
                        <TableCell className={`text-right ${rpsm2Color}`}>R$ {rpsm2}</TableCell>
                        <TableCell className="text-right">R$ {getContractMonthlyValue(c).toLocaleString('pt-BR')}</TableCell>
                        <TableCell>{c.contract_type === 'net' ? 'IGP-M' : 'IPCA'}</TableCell>
                        <TableCell className="text-sm">
                          {c.contract_start && c.contract_end
                            ? `${new Date(c.contract_start).toLocaleDateString('pt-BR', { month: '2-digit', year: '2-digit' })} → ${new Date(c.contract_end).toLocaleDateString('pt-BR', { month: '2-digit', year: '2-digit' })}`
                            : '—'}
                        </TableCell>
                        <TableCell className={mColor}>
                          {monthsRem < 0 ? 'VENCIDO' : `${monthsRem}m`}
                        </TableCell>
                        <TableCell className={monthsRem < 0 ? 'text-muted-foreground' : adjDays < 60 ? 'text-amber-600' : 'text-muted-foreground'}>
                          {monthsRem < 0 ? '—' : nextAdj ? formatMonthYear(nextAdj) : '—'}
                        </TableCell>
                        <TableCell>
                          {g ? (
                            <Badge className={guaranteeTypeBadgeColor[g.type] + ' text-xs'}>
                              {guaranteeTypeLabels[g.type].split(' ')[0]}
                            </Badge>
                          ) : <span className="text-muted-foreground text-xs">—</span>}
                        </TableCell>
                        <TableCell>
                          {inactiveIds.includes(c.id)
                            ? <Badge variant="secondary">Inativo</Badge>
                            : <Badge className={healthColors[info.status].badge}>{info.label}</Badge>}
                        </TableCell>
                        <TableCell onClick={e => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-7 w-7">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                              <DropdownMenuItem onClick={() => openContract(c.id, null)}>
                                <Eye className="h-3.5 w-3.5 mr-2" /> Ver contrato
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openContract(c.id, 'edit')}>
                                <Pencil className="h-3.5 w-3.5 mr-2" /> Editar contrato
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openContract(c.id, 'aditivo')}>
                                <Plus className="h-3.5 w-3.5 mr-2" /> Adicionar aditivo
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openContract(c.id, null)}>
                                <History className="h-3.5 w-3.5 mr-2" /> Ver histórico
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleInactive(c.id)}>
                                <Shield className="h-3.5 w-3.5 mr-2" /> {inactiveIds.includes(c.id) ? 'Reativar contrato' : 'Marcar como inativo'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleUploadOpen(c)}>
                                <Upload className="h-3.5 w-3.5 mr-2" /> Anexar documento
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownload(c)}>
                                <Download className="h-3.5 w-3.5 mr-2" /> Baixar contrato
                              </DropdownMenuItem>
                              {(isExpired || monthsRem < 8) && (
                                <DropdownMenuItem onClick={() => toast.info("Fluxo de renovação em breve")}>
                                  <RefreshCw className="h-3.5 w-3.5 mr-2" /> Iniciar renovação
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {tenantContracts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={showAllBuildings ? 14 : 13} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="h-10 w-10 text-muted-foreground/40" />
                          <p className="font-medium text-muted-foreground">Nenhum contrato encontrado</p>
                          <p className="text-xs text-muted-foreground">
                            {statusFilter !== 'all'
                              ? `Não há contratos ${statusFilters.find(f => f.value === statusFilter)?.label.toLowerCase()} para este ativo`
                              : 'Tente alterar os filtros ou o ativo selecionado'}
                          </p>
                          {statusFilter !== 'all' && (
                            <Button variant="outline" size="sm" onClick={() => setStatusFilter('all')}>Limpar filtros</Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table></div>
              <div className="divide-y md:hidden">
                {tenantContracts.map(c => {
                  const info = getContractStatusInfo(c);
                  const monthsRem = c.contract_end ? monthsDiff(c.contract_end) : -999;
                  return (
                    <button key={c.id} onClick={() => { setSelectedContractId(c.id); setDrawerTab('resumo'); }} className="block min-h-11 w-full space-y-3 p-4 text-left active:bg-muted/50">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0"><p className="break-words text-sm font-semibold">{c.tenant_name}</p><p className="mt-1 text-xs text-muted-foreground">{getBuildingName(c.building_id)} · {c.unit_id}</p></div>
                        <Badge className={`${healthColors[info.status].badge} shrink-0`}>{info.label}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div><span className="block text-muted-foreground">Valor mensal</span><strong>R$ {getContractMonthlyValue(c).toLocaleString('pt-BR')}</strong></div>
                        <div><span className="block text-muted-foreground">Área</span><strong>{c.area_m2.toLocaleString('pt-BR')} m²</strong></div>
                        <div><span className="block text-muted-foreground">Vencimento</span><strong>{c.contract_end ? new Date(c.contract_end).toLocaleDateString('pt-BR') : '—'}</strong></div>
                        <div><span className="block text-muted-foreground">Prazo restante</span><strong>{monthsRem < 0 ? 'Vencido' : `${monthsRem} meses`}</strong></div>
                      </div>
                    </button>
                  );
                })}
                {tenantContracts.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">Nenhum contrato encontrado</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════ TAB TIMELINE ══════ */}
        <TabsContent value="timeline" className="space-y-4 mt-4">
          {/* Exposição da receita por vencimento */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold">Exposição da Receita por Vencimento</h3>
              <p className="text-xs text-muted-foreground mb-3">Receita mensal contratada que vence em cada ano</p>
              {(() => {
                const buckets = ['2026', '2027', '2028', '2029+'];
                const data = buckets.map(b => ({ ano: b, receita: 0, contratos: 0 }));
                tenantContracts.forEach(c => {
                  if (!c.contract_end) return;
                  const y = new Date(c.contract_end).getFullYear();
                  const idx = y <= 2026 ? 0 : y === 2027 ? 1 : y === 2028 ? 2 : 3;
                  data[idx].receita += getContractMonthlyValue(c);
                  data[idx].contratos += 1;
                });
                const totalRec = data.reduce((s, d) => s + d.receita, 0);
                const colors = ['#EF4444', '#F59E0B', '#3B82F6', '#10B981'];
                return (
                  <>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="ano" fontSize={11} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                        <YAxis fontSize={11} tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                        <RTooltip
                          formatter={(v: number) => [`R$ ${v.toLocaleString('pt-BR')}/mês`, 'Receita exposta']}
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                        />
                        <Bar dataKey="receita" radius={[4, 4, 0, 0]}>
                          {data.map((_, i) => <Cell key={i} fill={colors[i]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      {data.map((d, i) => (
                        <div key={d.ano} className="rounded-md border p-2">
                          <p className="text-[10px] text-muted-foreground uppercase">{d.ano}</p>
                          <p className="text-sm font-semibold tabular-nums" style={{ color: colors[i] }}>
                            R$ {(d.receita / 1000).toFixed(0)}k
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {d.contratos} contrato(s) · {totalRec > 0 ? ((d.receita / totalRec) * 100).toFixed(0) : 0}% da receita
                          </p>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </CardContent>
          </Card>

          <h3 className="text-lg font-semibold">Calendário de Vencimentos — Próximos 24 Meses</h3>
          <Card>
            <CardContent className="p-4 overflow-x-auto">
              <div className="min-w-[900px]">
                <div className="flex">
                  <div className="w-[160px] flex-shrink-0 text-xs font-semibold text-muted-foreground py-1">Contrato</div>
                  <div className="flex-1 flex">
                    {timelineData.months.map(m => (
                      <div key={m.key} className="flex-1 text-center text-[10px] text-muted-foreground py-1 border-l border-border/30">{m.label}</div>
                    ))}
                  </div>
                </div>
                {/* Expired contracts section */}
                {(() => {
                  const expiredContracts = timelineData.contracts.filter(c => monthsDiff(c.contract_end!) < 0);
                  if (expiredContracts.length === 0) return null;
                  return (
                    <>
                      <div className="flex items-center bg-[#FEF2F2] py-1.5 px-2 border-t border-red-200">
                        <span className="text-xs font-semibold text-red-600">⚡ Contratos Vencidos — Ação Imediata</span>
                      </div>
                      {expiredContracts.map(c => {
                        const daysExpired = Math.abs(Math.floor((new Date(c.contract_end!).getTime() - Date.now()) / (1000*60*60*24)));
                        return (
                          <div key={c.id} className="flex items-center border-t border-red-200 bg-[#FEE2E2]">
                            <div className="w-[160px] flex-shrink-0 py-2 pr-2">
                              <p className="text-xs font-medium truncate">{c.tenant_name}</p>
                              <p className="text-[10px] text-muted-foreground">{c.unit_id}</p>
                            </div>
                            <div className="flex-1 relative h-8 flex items-center gap-2">
                              <div className="h-5 w-5 rounded bg-muted-foreground/30 border border-dashed border-muted-foreground/50" />
                              <Badge className="bg-red-100 text-red-700 text-[10px] h-5">VENCIDO há {daysExpired}d</Badge>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  );
                })()}

                {/* Active contracts */}
                {timelineData.contracts.filter(c => monthsDiff(c.contract_end!) >= 0).map(c => {
                  const monthsRem = monthsDiff(c.contract_end!);
                  const totalMonths = 24;
                  const barWidth = Math.min(100, Math.max(2, (monthsRem / totalMonths) * 100));
                  const barColor = monthsRem <= 6 ? 'bg-red-400' : monthsRem <= 12 ? 'bg-amber-400' : 'bg-emerald-400';
                  return (
                    <div key={c.id} className="flex items-center border-t border-border/30">
                      <div className="w-[160px] flex-shrink-0 py-2 pr-2">
                        <p className="text-xs font-medium truncate">{c.tenant_name}</p>
                        <p className="text-[10px] text-muted-foreground">{c.unit_id}</p>
                      </div>
                      <div className="flex-1 relative h-8 flex items-center">
                        <div className={`h-5 rounded ${barColor}`} style={{ width: `${barWidth}%` }} />
                        <span className="absolute text-[9px] font-medium text-muted-foreground" style={{ left: `${barWidth}%`, transform: 'translateX(4px)' }}>
                          {monthsRem}m
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mês</TableHead>
                    <TableHead>Contratos Vencendo</TableHead>
                    <TableHead className="text-right">GLA em Risco (m²)</TableHead>
                    <TableHead className="text-right">Receita em Risco</TableHead>
                    <TableHead>Ação Recomendada</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Expired contracts summary row */}
                  {(() => {
                    const expired = timelineData.contracts.filter(c => monthsDiff(c.contract_end!) < 0);
                    if (expired.length === 0) return null;
                    const gla = expired.reduce((s, c) => s + c.area_m2, 0);
                    const revenue = expired.reduce((s, c) => s + getContractMonthlyValue(c), 0);
                    return (
                      <TableRow className="bg-[#FEE2E2]">
                        <TableCell className="font-medium text-red-600">Em atraso</TableCell>
                        <TableCell className="text-red-600">{expired.length} ({expired.map(c => c.tenant_name).join(', ')})</TableCell>
                        <TableCell className="text-right text-red-600">{gla.toLocaleString('pt-BR')} m²</TableCell>
                        <TableCell className="text-right text-red-600">R$ {revenue.toLocaleString('pt-BR')}</TableCell>
                        <TableCell><span className="text-red-600 font-bold">Renovação imediata</span></TableCell>
                      </TableRow>
                    );
                  })()}
                  {timelineData.months.slice(0, 18).map(m => {
                    const expiring = timelineData.contracts.filter(c => {
                      const end = new Date(c.contract_end!);
                      return end.getMonth() === m.date.getMonth() && end.getFullYear() === m.date.getFullYear();
                    });
                    if (expiring.length === 0) return null;
                    const gla = expiring.reduce((s, c) => s + c.area_m2, 0);
                    const revenue = expiring.reduce((s, c) => s + getContractMonthlyValue(c), 0);
                    return (
                      <TableRow key={m.key}>
                        <TableCell className="font-medium">{m.label}</TableCell>
                        <TableCell>{expiring.length} ({expiring.map(c => c.tenant_name).join(', ')})</TableCell>
                        <TableCell className="text-right">{gla.toLocaleString('pt-BR')} m²</TableCell>
                        <TableCell className="text-right">R$ {revenue.toLocaleString('pt-BR')}</TableCell>
                        <TableCell>
                          {expiring.some(c => monthsDiff(c.contract_end!) <= 3)
                            ? <span className="text-red-600 font-medium">Renovação urgente</span>
                            : <span className="text-amber-600">Iniciar negociação</span>}
                        </TableCell>
                      </TableRow>
                    );
                  }).filter(Boolean)}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════ TAB REAJUSTES ══════ */}
        <TabsContent value="reajustes" className="space-y-4 mt-4">
          <MesReajusteChart contracts={tenantContracts} />
          <h3 className="text-lg font-semibold">Calendário de Reajustes Contratuais</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <KpiCard
              title="Próximo Reajuste"
              value={reajustesData[0] ? formatMonthYear(reajustesData[0].nextDate) : '—'}
              sub={reajustesData[0]?.tenant_name || ''}
              accentColor="#F59E0B"
            />
            <KpiCard title="IGP-M acum. 12m" value="5,8%" sub="Índice Geral de Preços — Mercado" accentColor="#3B82F6" />
            <KpiCard title="IPCA acum. 12m" value="4,2%" sub="Índice de Preços ao Consumidor" accentColor="#8B5CF6" />
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    {showAllBuildings && <TableHead>Ativo</TableHead>}
                    <TableHead>Locatário</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead className="text-right">Valor Atual</TableHead>
                    <TableHead>Índice</TableHead>
                    <TableHead>Prox. Data</TableHead>
                    <TableHead className="text-right">% Estimado</TableHead>
                    <TableHead className="text-right">Novo Valor Est.</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reajustesData.map(r => {
                    const bldgName = getBuildingName(r.building_id);
                    return (
                      <TableRow key={r.id}>
                        {showAllBuildings && <TableCell className="text-xs">{bldgName}</TableCell>}
                        <TableCell className="font-medium">{r.tenant_name}</TableCell>
                        <TableCell>{r.unit_id}</TableCell>
                        <TableCell className="text-right">R$ {r.currentValue.toLocaleString('pt-BR')}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{r.index}</Badge></TableCell>
                        <TableCell>{formatMonthYear(r.nextDate)}</TableCell>
                        <TableCell className="text-right text-emerald-600">+{r.rate}%</TableCell>
                        <TableCell className="text-right font-medium">R$ {r.newValue.toLocaleString('pt-BR')}</TableCell>
                        <TableCell>
                          <Badge className={r.status === 'Aplicar' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}>
                            {r.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm" className="h-7 text-xs gap-1"
                              onClick={() => openApplyAdjustment(r)}
                            >
                              <TrendingUp className="h-3.5 w-3.5" /> Aplicar reajuste
                            </Button>
                            <Button
                              size="sm" variant="outline" className="h-7 text-xs gap-1"
                              onClick={() => {
                                const subject = encodeURIComponent(`Reajuste Contratual — ${r.unit_id} — ${bldgName}`);
                                const body = encodeURIComponent(
                                  `Prezado(a) ${r.tenant_name},\n\n` +
                                  `Informamos que o reajuste contratual referente à unidade ${r.unit_id} no ativo ${bldgName} será aplicado conforme segue:\n\n` +
                                  `• Valor atual: R$ ${r.currentValue.toLocaleString('pt-BR')}\n` +
                                  `• Índice: ${r.index}\n` +
                                  `• Percentual: +${r.rate}%\n` +
                                  `• Novo valor: R$ ${r.newValue.toLocaleString('pt-BR')}\n` +
                                  `• Vigência a partir de: ${formatMonthYear(r.nextDate)}\n\n` +
                                  `Atenciosamente,\nGestão Safra FII`
                                );
                                window.open(`mailto:?subject=${subject}&body=${body}`);
                                toast.success(`E-mail de reajuste preparado para ${r.tenant_name}`);
                              }}
                            >
                              📧 Notificar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground text-center">
            Percentuais estimados com base no acumulado dos últimos 12 meses. Valores finais sujeitos à publicação oficial dos índices.
          </p>

          {/* Dialog: aplicar reajuste (calculado x negociado) */}
          <Dialog open={!!applyAdjTarget} onOpenChange={(o) => !o && setApplyAdjTarget(null)}>
            <DialogContent className="sm:max-w-[520px]">
              <DialogHeader>
                <DialogTitle>Aplicar reajuste</DialogTitle>
                <DialogDescription>
                  {applyAdjTarget && (
                    <>{applyAdjTarget.tenant_name} — {applyAdjTarget.unit_id} · vigência {formatMonthYear(applyAdjTarget.nextDate)}</>
                  )}
                </DialogDescription>
              </DialogHeader>
              {applyAdjTarget && (
                <div className="space-y-4 py-1">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-md border p-3">
                      <p className="text-[10px] text-muted-foreground uppercase">Valor atual</p>
                      <p className="font-semibold">R$ {applyAdjTarget.currentValue.toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="rounded-md border p-3">
                      <p className="text-[10px] text-muted-foreground uppercase">Calculado ({applyAdjTarget.index} +{applyAdjTarget.rate}%)</p>
                      <p className="font-semibold">R$ {applyAdjTarget.newValue.toLocaleString('pt-BR')}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm">Tipo de aplicação</Label>
                    <Select value={applyAdjMode} onValueChange={(v: 'calculado' | 'negociado') => {
                      setApplyAdjMode(v);
                      if (v === 'calculado') setApplyAdjValue(String(applyAdjTarget.newValue));
                    }}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="calculado">Reajuste calculado pelo índice</SelectItem>
                        <SelectItem value="negociado">Reajuste negociado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm">Novo valor mensal (R$)</Label>
                    <Input
                      className="mt-1"
                      value={applyAdjValue}
                      disabled={applyAdjMode === 'calculado'}
                      onChange={e => setApplyAdjValue(e.target.value)}
                    />
                    {applyAdjMode === 'negociado' && (
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Diferença vs. calculado: R$ {((Number(applyAdjValue) || 0) - applyAdjTarget.newValue).toLocaleString('pt-BR')}
                      </p>
                    )}
                  </div>

                  {applyAdjMode === 'negociado' && (
                    <div>
                      <Label className="text-sm">Motivo da negociação</Label>
                      <Textarea className="mt-1" rows={3} value={applyAdjReason} onChange={e => setApplyAdjReason(e.target.value)}
                        placeholder="Ex.: acordo comercial para manutenção do locatário…" />
                      <p className="text-[11px] text-amber-600 mt-1">
                        Reajuste negociado zera a contagem de 36 meses das revisionais.
                      </p>
                    </div>
                  )}
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setApplyAdjTarget(null)}>Cancelar</Button>
                <Button onClick={handleApplyAdjustment}>Aplicar reajuste</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ══════ TAB GARANTIAS ══════ */}
        <TabsContent value="garantias_tab" className="space-y-4 mt-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KpiCard title="Garantias Ativas" value={String(guaranteeKpis.active)} sub="Cobertura em vigor" accentColor="#10B981" />
            <KpiCard
              title="Vencendo em Breve"
              value={String(guaranteeKpis.expiring)}
              sub="Renovação necessária"
              accentColor={guaranteeKpis.expiring > 0 ? '#F59E0B' : '#10B981'}
              valueColor={guaranteeKpis.expiring > 0 ? 'text-amber-600' : 'text-emerald-600'}
              onClick={() => setGuaranteeFilter('expiring')}
              clickable
            />
            <KpiCard
              title="Garantias Vencidas"
              value={String(guaranteeKpis.expired)}
              sub="Risco jurídico imediato"
              accentColor={guaranteeKpis.expired > 0 ? '#EF4444' : '#10B981'}
              valueColor={guaranteeKpis.expired > 0 ? 'text-red-600' : 'text-emerald-600'}
              onClick={() => setGuaranteeFilter('expired')}
              clickable
            />
            <KpiCard title="Valor Total em Garantia" value={`R$ ${(guaranteeKpis.totalValue / 1000).toFixed(0)}k`} sub="Cobertura total do portfólio" accentColor="#1E3A5F" />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {guaranteeFilters.map(f => (
              <Button key={f.value} variant={guaranteeFilter === f.value ? "default" : "outline"} size="sm" onClick={() => setGuaranteeFilter(f.value)}>
                {f.label}
              </Button>
            ))}
          </div>

          {/* Guarantees Table */}
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {showAllBuildings && <TableHead>Ativo</TableHead>}
                    <TableHead>Locatário</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Banco/Emissor</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Emissão</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Dias Rest.</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGuarantees.map(g => {
                    const contract = getContractForGuarantee(g);
                    if (!contract) return null;
                    const days = daysDiff(g.valid_until);
                    const status = getGuaranteeStatus(g);
                    const isExpiredG = days < 0;
                    const isExpiringG = days >= 0 && days < 60; // includes Crítico (<30) and Vencendo (30-60)
                    const isMissingDoc = g.type === 'fianca_bancaria' && !g.documentUrl;

                    const daysLabel = g.valid_until === null ? '∞' :
                      days < 0 ? 'VENCIDA' : `${days}d`;
                    const daysColor = g.valid_until === null ? 'text-emerald-600' :
                      days < 0 ? 'text-red-600 font-bold' :
                      days <= 30 ? 'text-red-600' :
                      days <= 60 ? 'text-amber-600' : 'text-emerald-600';

                    return (
                      <TooltipProvider key={g.id}>
                        <TableRow
                          onClick={() => { setSelectedContractId(contract.id); setDrawerTab('garantias'); }}
                          title="Abrir contrato vinculado"
                          className={cn(
                            'group hover:bg-muted/50 cursor-pointer',
                            isExpiredG && 'bg-[#FEE2E2] border-l-4 border-l-red-500',
                            !isExpiredG && days >= 0 && days < 30 && 'bg-[#FEE2E2] border-l-4 border-l-red-500',
                            !isExpiredG && days >= 30 && days < 60 && 'bg-[#FEF3C7] border-l-4 border-l-amber-400',
                          )}
                        >
                          {showAllBuildings && <TableCell className="text-xs">{getBuildingName(contract.building_id)}</TableCell>}
                          <TableCell className="font-medium">{contract.tenant_name}</TableCell>
                          <TableCell>{contract.unit_id}</TableCell>
                          <TableCell>
                            <Badge className={guaranteeTypeBadgeColor[g.type] + ' text-xs'}>{guaranteeTypeLabels[g.type]}</Badge>
                          </TableCell>
                          <TableCell>{g.guarantor}</TableCell>
                          <TableCell className="text-right">R$ {g.value.toLocaleString('pt-BR')}</TableCell>
                          <TableCell className="text-sm">{new Date(g.issueDate).toLocaleDateString('pt-BR')}</TableCell>
                          <TableCell className="text-sm">{g.valid_until ? new Date(g.valid_until).toLocaleDateString('pt-BR') : 'N/A'}</TableCell>
                          <TableCell>
                            <span className={cn('text-sm', daysColor)}>
                              {days >= 0 && days <= 30 && <AlertTriangle className="inline h-3 w-3 mr-1" />}
                              {daysLabel}
                            </span>
                          </TableCell>
                          <TableCell onClick={e => e.stopPropagation()}>
                            {g.documentUrl ? (
                              <div className="flex items-center gap-1">
                                <FileText className="h-4 w-4 text-red-500 cursor-pointer" onClick={() => toast.success(`Abrindo: ${g.documentUrl}`)} />
                                {g.certificateNumber && <span className="text-[10px] text-muted-foreground">{g.certificateNumber}</span>}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                {isMissingDoc && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                                <Button size="sm" variant="outline" className="text-xs h-6 px-2 text-amber-600" onClick={() => openRenewalDialog(g)}>
                                  Anexar
                                </Button>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={status.color + ' text-xs'}>{status.label}</Badge>
                          </TableCell>
                          <TableCell onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {g.documentUrl && (
                                <Tooltip><TooltipTrigger asChild>
                                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toast.success(`Visualizando: ${g.documentUrl}`)}>
                                    <Eye className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger><TooltipContent>Ver Documento</TooltipContent></Tooltip>
                              )}
                              <Tooltip><TooltipTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openRenewalDialog(g)}>
                                  <RefreshCw className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger><TooltipContent>Atualizar</TooltipContent></Tooltip>
                              <Tooltip><TooltipTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setSelectedContractId(contract.id); setDrawerTab('garantias'); }}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger><TooltipContent>Editar</TooltipContent></Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      </TooltipProvider>
                    );
                  })}
                  {filteredGuarantees.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={showAllBuildings ? 13 : 12} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2">
                          <Shield className="h-10 w-10 text-muted-foreground/40" />
                          <p className="font-medium text-muted-foreground">Nenhuma garantia encontrada</p>
                          <p className="text-xs text-muted-foreground">
                            {guaranteeFilter !== 'all' ? 'Tente alterar o filtro selecionado' : 'Nenhuma garantia registrada para este ativo'}
                          </p>
                          {guaranteeFilter !== 'all' && (
                            <Button variant="outline" size="sm" onClick={() => setGuaranteeFilter('all')}>Limpar filtros</Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════ TAB REVISIONAIS ══════ */}
        <TabsContent value="revisionais" className="space-y-4 mt-4">
          <ConcentracaoRevisionaisChart contracts={tenantContracts} />
          <RevisionaisTab
            tenantContracts={tenantContracts}
            buildings={buildings}
          />
        </TabsContent>

        {/* ══════ TAB POR COMPETÊNCIA ══════ */}
        <TabsContent value="competencia" className="space-y-4 mt-4">
          <CompetenciaTab
            contracts={tenantContracts}
            showAllBuildings={showAllBuildings}
            getBuildingName={getBuildingName}
          />
        </TabsContent>
      </Tabs>

      {/* ── CONTRACT DETAIL DRAWER ── */}
      <Sheet open={!!selectedContractId} onOpenChange={() => { setSelectedContractId(null); setDrawerAction(null); }}>
        <SheetContent side="center" className="overflow-y-auto">
          {selectedContract && (() => {
            const isTenant = 'tenant_name' in selectedContract;
            const name = isTenant ? selectedContract.tenant_name : (selectedContract as any).operator;
            const unitId = isTenant ? selectedContract.unit_id : (selectedContract as any).area_name;
            const bldg = buildings.find(b => b.id === selectedContract.building_id);
            const endDate = isTenant ? selectedContract.contract_end : (selectedContract as any).contract_end;
            const info = endDate ? getContractStatusInfo({ ...selectedContract, contract_end: endDate } as TenantContract) : null;

            return (
              <>
                <SheetHeader>
                  <div className="flex items-center gap-2">
                    <SheetTitle className="text-lg">{name}</SheetTitle>
                    {info && <Badge className={healthColors[info.status].badge}>{info.label}</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{bldg?.name} — {unitId}</p>
                </SheetHeader>

                <Tabs value={drawerTab} onValueChange={setDrawerTab} className="mt-6">
                  <TabsList className="w-full grid grid-cols-4">
                    <TabsTrigger value="resumo">Resumo</TabsTrigger>
                    <TabsTrigger value="garantias">Garantias</TabsTrigger>
                    <TabsTrigger value="iptu">IPTU</TabsTrigger>
                    <TabsTrigger value="documentos">Docs</TabsTrigger>
                  </TabsList>

                  <TabsContent value="resumo" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-3">
                      <InfoField label="Área (m²)" value={`${selectedContract.area_m2} m²`} />
                      <InfoField label="R$/m²" value={selectedContract.price_per_m2 ? `R$ ${selectedContract.price_per_m2}` : '—'} />
                      <InfoField label="Valor/Mês" value={selectedContract.price_per_m2 ? `R$ ${(selectedContract.area_m2 * selectedContract.price_per_m2).toLocaleString('pt-BR')}` : '—'} />
                      <InfoField label="Tipo" value={selectedContract.contract_type ? contractTypeLabels[selectedContract.contract_type]?.label || '—' : '—'} />
                      <InfoField label="Índice" value={selectedContract.contract_type === 'net' ? 'IGP-M' : 'IPCA'} />
                      <InfoField label="Vigência" value={
                        selectedContract.contract_start && endDate
                          ? `${new Date(selectedContract.contract_start).toLocaleDateString('pt-BR')} → ${new Date(endDate).toLocaleDateString('pt-BR')}`
                          : '—'
                      } />
                      <InfoField label="Meses Restantes" value={endDate ? (monthsDiff(endDate) < 0 ? 'VENCIDO' : `${monthsDiff(endDate)} meses`) : '—'} />
                      <InfoField label="Próximo Reajuste" value={endDate && monthsDiff(endDate) < 0 ? '—' : selectedContract.contract_start ? formatMonthYear(getNextAdjustmentDate(selectedContract.contract_start)) : '—'} />
                    </div>
                    {isTenant && (
                      <>
                        <Separator />
                        <ContractManagementSection contract={selectedContract as TenantContract} autoOpen={drawerAction} />
                      </>
                    )}
                  </TabsContent>

                  <TabsContent value="garantias" className="space-y-6 mt-4">
                    {/* Enhanced Guarantee Section */}
                    {guarantee ? (
                      <GuaranteeDrawerSection guarantee={guarantee} onRenew={() => openRenewalDialog(guarantee)} />
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhuma garantia registrada</p>
                    )}
                    <Separator />
                    <div>
                      <h3 className="text-sm font-semibold mb-3">Seguro Patrimonial</h3>
                      {insurance ? (
                        <div className="grid grid-cols-2 gap-3">
                          <InfoField label="Seguradora" value={insurance.insurer} />
                          <InfoField label="Apólice" value={insurance.policy_number} />
                          <InfoField label="Valor Segurado" value={`R$ ${insurance.insured_value.toLocaleString('pt-BR')}`} />
                          <InfoField label="Vigência" value={`${new Date(insurance.start_date).toLocaleDateString('pt-BR')} → ${new Date(insurance.end_date).toLocaleDateString('pt-BR')}`} />
                          <div>
                            <span className="text-xs text-muted-foreground">Saúde</span>
                            <div><Badge className={healthColors[getDocumentHealth(insurance.end_date)].badge}>
                              {healthLabels[getDocumentHealth(insurance.end_date)].pt}
                            </Badge></div>
                          </div>
                        </div>
                      ) : <p className="text-sm text-muted-foreground">Nenhum seguro registrado</p>}
                    </div>
                  </TabsContent>

                  <TabsContent value="iptu" className="space-y-4 mt-4">
                    {iptu ? (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <InfoField label="Responsável" value={iptuResponsibleLabels[iptu.responsible]} />
                          <InfoField label="Valor Anual" value={`R$ ${iptu.annual_value.toLocaleString('pt-BR')}`} />
                          <InfoField label="Valor Mensal" value={`R$ ${Math.round(iptu.annual_value / 12).toLocaleString('pt-BR')}`} />
                          <InfoField label="Nº Contribuinte" value={iptu.taxpayer_number} />
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Mês</TableHead>
                              <TableHead className="text-right">Valor</TableHead>
                              <TableHead>Vencimento</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {iptu.parcels.map(p => {
                              const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
                              return (
                                <TableRow key={p.month}>
                                  <TableCell>{months[p.month - 1]}</TableCell>
                                  <TableCell className="text-right">R$ {p.value.toLocaleString('pt-BR')}</TableCell>
                                  <TableCell>{new Date(p.due_date).toLocaleDateString('pt-BR')}</TableCell>
                                  <TableCell>
                                    <Badge className={p.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : p.status === 'overdue' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}>
                                      {p.status === 'paid' ? 'Pago' : p.status === 'overdue' ? 'Em Atraso' : 'Pendente'}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </>
                    ) : <p className="text-sm text-muted-foreground">Nenhum registro de IPTU</p>}
                  </TabsContent>

                  <TabsContent value="documentos" className="space-y-4 mt-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Documentos do Contrato</h3>
                      <Button size="sm" variant="outline" onClick={() => handleUploadOpen(selectedContract as TenantContract)}>
                        <Upload className="h-4 w-4 mr-1" /> Anexar
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {contractDocs.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-red-500" />
                            <div>
                              <p className="text-sm font-medium">{doc.fileName}</p>
                              <p className="text-xs text-muted-foreground">{doc.fileSize} — {new Date(doc.uploadDate).toLocaleDateString('pt-BR')}</p>
                            </div>
                          </div>
                          <Button size="sm" variant="ghost"><Download className="h-4 w-4" /></Button>
                        </div>
                      ))}
                      {contractDocs.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">Nenhum documento anexado</p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex items-center gap-2 mt-6 pt-4 border-t">
                  <Button variant="outline" onClick={() => setSelectedContractId(null)} className="flex-1">Fechar</Button>
                  <Button variant="default" onClick={() => toast.info("Exportação de contrato individual em breve")} className="flex-1 gap-2">
                    <FileText className="h-4 w-4" /> Exportar PDF
                  </Button>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* ── UPLOAD DIALOG ── */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anexar Contrato — {uploadTarget?.tenant_name} {uploadTarget?.unit_id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={e => setUploadFile(e.target.files?.[0] || null)}
            />
            <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
              {uploadFile ? uploadFile.name : 'Selecionar arquivo (.pdf, .docx)'}
            </Button>
            {uploadFile && (
              <p className="text-sm text-muted-foreground">
                {uploadFile.name} — {(uploadFile.size / (1024 * 1024)).toFixed(1)} MB
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>Cancelar</Button>
            <Button disabled={!uploadFile} onClick={handleUploadConfirm}>Confirmar Upload</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── RENEWAL DIALOG ── */}
      <Dialog open={renewalDialogOpen} onOpenChange={setRenewalDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Renovar Garantia — {renewalTarget ? `${getContractForGuarantee(renewalTarget)?.tenant_name || ''} | ${getContractForGuarantee(renewalTarget)?.unit_id || ''}` : ''}</DialogTitle>
            <DialogDescription>
              {renewalTarget && `Tipo: ${guaranteeTypeLabels[renewalTarget.type]} · Vencimento atual: ${renewalTarget.valid_until ? new Date(renewalTarget.valid_until).toLocaleDateString('pt-BR') : 'N/A'}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nova data de vencimento *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !renewalDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {renewalDate ? format(renewalDate, "dd/MM/yyyy") : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={renewalDate} onSelect={setRenewalDate} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Novo valor da garantia (R$)</Label>
              <Input type="number" value={renewalValue} onChange={e => setRenewalValue(e.target.value)} placeholder="162.000" />
            </div>
            <div className="space-y-2">
              <Label>Número do certificado/carta</Label>
              <Input value={renewalCertificate} onChange={e => setRenewalCertificate(e.target.value)} placeholder="FB-2026-XXXXX" />
            </div>
            <div className="space-y-2">
              <Label>{renewalTarget?.type === 'fianca_bancaria' ? 'Upload do documento *' : 'Upload do documento'}</Label>
              <input ref={renewalFileRef} type="file" accept=".pdf,.docx" className="hidden" onChange={e => setRenewalFile(e.target.files?.[0] || null)} />
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => renewalFileRef.current?.click()}
              >
                {renewalFile ? (
                  <div>
                    <FileText className="h-6 w-6 mx-auto mb-2 text-red-500" />
                    <p className="text-sm font-medium">{renewalFile.name}</p>
                    <p className="text-xs text-muted-foreground">{(renewalFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Arraste a carta de fiança ou clique para selecionar</p>
                    <p className="text-xs text-muted-foreground mt-1">.pdf, .docx</p>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea value={renewalNotes} onChange={e => setRenewalNotes(e.target.value)} placeholder="Observações sobre a renovação..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenewalDialogOpen(false)}>Cancelar</Button>
            <Button
              disabled={!renewalDate || (renewalTarget?.type === 'fianca_bancaria' && !renewalFile)}
              onClick={handleRenewalSave}
            >
              Salvar Renovação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── NOVO CONTRATO ── */}
      <Dialog open={showNewContract} onOpenChange={setShowNewContract}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Adicionar contrato</DialogTitle>
            <DialogDescription>
              Cadastre manualmente ou anexe o PDF para leitura automática dos dados pela IA.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-xs">Locatário</Label>
              <Input value={newContract.tenant} onChange={e => setNewContract(p => ({ ...p, tenant: e.target.value }))} placeholder="Razão social do locatário" />
            </div>
            <div>
              <Label className="text-xs">Ativo</Label>
              <Select value={newContract.buildingId} onValueChange={v => setNewContract(p => ({ ...p, buildingId: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione o ativo" /></SelectTrigger>
                <SelectContent>
                  {buildings.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Unidade / conjunto</Label>
              <Input value={newContract.unit} onChange={e => setNewContract(p => ({ ...p, unit: e.target.value }))} placeholder="Ex.: 1201" />
            </div>
            <div>
              <Label className="text-xs">Área (m²)</Label>
              <Input type="number" value={newContract.area} onChange={e => setNewContract(p => ({ ...p, area: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">R$/m²</Label>
              <Input type="number" value={newContract.pricePerM2} onChange={e => setNewContract(p => ({ ...p, pricePerM2: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Tipo de contrato</Label>
              <Select value={newContract.type} onValueChange={v => setNewContract(p => ({ ...p, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="net">Net</SelectItem>
                  <SelectItem value="gross">Gross</SelectItem>
                  <SelectItem value="semi-gross">Semi-gross</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Índice de reajuste</Label>
              <Select value={newContract.index} onValueChange={v => setNewContract(p => ({ ...p, index: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="IPCA">IPCA</SelectItem>
                  <SelectItem value="IGP-M">IGP-M</SelectItem>
                  <SelectItem value="INPC">INPC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Início</Label>
              <Input type="date" value={newContract.start} onChange={e => setNewContract(p => ({ ...p, start: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Fim</Label>
              <Input type="date" value={newContract.end} onChange={e => setNewContract(p => ({ ...p, end: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Garantia</Label>
              <Select value={newContract.guarantee} onValueChange={v => setNewContract(p => ({ ...p, guarantee: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(guaranteeTypeLabels).map(([k, l]) => (
                    <SelectItem key={k} value={k}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Contrato em PDF (opcional — leitura por IA)</Label>
              <Input type="file" accept="application/pdf" onChange={e => {
                const f = e.target.files?.[0] || null;
                setNewContractFile(f);
                if (f) toast.success(`${f.name} anexado — os campos podem ser preenchidos pela leitura automática.`);
              }} />
              {newContractFile && <p className="text-xs text-muted-foreground mt-1">{newContractFile.name}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewContract(false)}>Cancelar</Button>
            <Button
              disabled={!newContract.tenant || !newContract.buildingId}
              onClick={() => {
                setShowNewContract(false);
                toast.success(`Contrato de ${newContract.tenant} cadastrado.`);
                setNewContract({ tenant: '', buildingId: '', unit: '', area: '', pricePerM2: '', type: 'net', start: '', end: '', index: 'IPCA', guarantee: 'fianca_bancaria' });
                setNewContractFile(null);
              }}
            >
              Salvar contrato
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Enhanced Guarantee Section for Drawer ──
function GuaranteeDrawerSection({ guarantee, onRenew }: { guarantee: ContractGuarantee; onRenew: () => void }) {
  const days = daysDiff(guarantee.valid_until);
  const isExpired = days < 0;
  const isExpiring = days >= 0 && days <= 60;
  const status = getGuaranteeStatus(guarantee);

  // Progress calculation
  const totalDays = guarantee.valid_until && guarantee.issueDate
    ? Math.floor((new Date(guarantee.valid_until).getTime() - new Date(guarantee.issueDate).getTime()) / (1000*60*60*24))
    : 365;
  const elapsed = guarantee.issueDate
    ? Math.floor((Date.now() - new Date(guarantee.issueDate).getTime()) / (1000*60*60*24))
    : 0;
  const progressPct = totalDays > 0 ? Math.min(100, Math.max(0, (elapsed / totalDays) * 100)) : 100;
  const progressColor = days > 60 ? 'bg-emerald-500' : days > 30 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="space-y-4">
      {/* Alert Banner */}
      {isExpired && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-700">⚠ Garantia VENCIDA há {Math.abs(days)} dias. O locatário está sem cobertura.</p>
            <Button size="sm" variant="destructive" className="mt-2 h-7 text-xs" onClick={onRenew}>Registrar Nova Garantia</Button>
          </div>
        </div>
      )}
      {isExpiring && !isExpired && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-700">Esta garantia vence em {days} dias. Solicite a renovação ao locatário.</p>
            <Button size="sm" className="mt-2 h-7 text-xs bg-amber-600 hover:bg-amber-700" onClick={onRenew}>Registrar Renovação</Button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Garantia Contratual</h3>
        <Badge className={status.color + ' text-xs'}>{status.label}{isExpiring && !isExpired ? ` em ${days}d` : ''}</Badge>
      </div>

      {/* Data Grid */}
      <div className="grid grid-cols-2 gap-3">
        <InfoField label="Tipo" value={guaranteeTypeLabels[guarantee.type]} />
        <InfoField label="Banco/Emissor" value={guarantee.guarantor} />
        <InfoField label="Valor" value={`R$ ${guarantee.value.toLocaleString('pt-BR')}`} />
        <InfoField label="N° Certificado" value={guarantee.certificateNumber || '—'} />
        <InfoField label="Emissão" value={new Date(guarantee.issueDate).toLocaleDateString('pt-BR')} />
        <InfoField label="Vencimento" value={guarantee.valid_until ? new Date(guarantee.valid_until).toLocaleDateString('pt-BR') : 'N/A (Caução)'} />
      </div>

      {/* Progress Bar */}
      {guarantee.valid_until && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Dias restantes</span>
            <span className={days < 0 ? 'text-red-600 font-bold' : days <= 30 ? 'text-red-600' : days <= 60 ? 'text-amber-600' : 'text-emerald-600'}>
              {days < 0 ? `Vencida há ${Math.abs(days)}d` : `${days}d`}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${progressColor}`} style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      )}

      {/* Document Card */}
      <div>
        {guarantee.documentUrl ? (
          <div className="border rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm font-medium">{guarantee.documentUrl}</p>
                {guarantee.documentUploadDate && (
                  <p className="text-xs text-muted-foreground">Upload em {new Date(guarantee.documentUploadDate).toLocaleDateString('pt-BR')}</p>
                )}
              </div>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => toast.success(`Visualizando: ${guarantee.documentUrl}`)}>
                <Eye className="h-3.5 w-3.5 mr-1" /> Ver
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => toast.success(`Download: ${guarantee.documentUrl}`)}>
                <Download className="h-3.5 w-3.5 mr-1" /> Baixar
              </Button>
            </div>
          </div>
        ) : guarantee.type === 'fianca_bancaria' ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-700">Carta de fiança não anexada</p>
                <p className="text-xs text-amber-600 mt-1">Para fiança bancária, o documento original deve estar arquivado.</p>
                <Button size="sm" variant="outline" className="mt-2 h-7 text-xs" onClick={onRenew}>
                  <Upload className="h-3 w-3 mr-1" /> Anexar Carta de Fiança
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Renewal History */}
      {guarantee.renewalHistory.length > 0 && (
        <Collapsible>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full">
            <ChevronRight className="h-4 w-4 transition-transform data-[state=open]:rotate-90" />
            Ver histórico de renovações ({guarantee.renewalHistory.length})
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-2">
            {guarantee.renewalHistory
              .sort((a, b) => b.year - a.year)
              .map((entry, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 border rounded text-sm">
                  <div>
                    <span className="font-medium">{entry.year}</span>
                    <span className="text-muted-foreground ml-2">Venceu: {entry.expiryDate ? new Date(entry.expiryDate).toLocaleDateString('pt-BR') : '—'}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {entry.documentUrl ? (
                      <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => toast.success(`Abrindo: ${entry.documentUrl}`)}>
                        <FileText className="h-3 w-3 mr-1" /> ver PDF
                      </Button>
                    ) : (
                      <span className="text-amber-500">Sem documento</span>
                    )}
                  </div>
                </div>
              ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

// ── KPI Card Component ──
function KpiCard({ title, value, sub, accentColor, valueColor, onClick, clickable }: {
  title: string; value: string; sub: string; accentColor: string;
  valueColor?: string; onClick?: () => void; clickable?: boolean;
}) {
  return (
    <div
      className={`bg-muted/30 border rounded-xl p-4 relative overflow-hidden ${clickable ? 'cursor-pointer hover:bg-muted/50 transition-colors' : ''}`}
      onClick={onClick}
    >
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl" style={{ backgroundColor: accentColor }} />
      <span className="text-xs font-semibold text-muted-foreground">{title}</span>
      <p className={`text-xl font-bold mt-1 ${valueColor || 'text-foreground'}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
