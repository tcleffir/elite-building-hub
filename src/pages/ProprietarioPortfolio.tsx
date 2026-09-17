import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2, Maximize2, TrendingUp, DollarSign, Calendar,
  AlertTriangle, ChevronRight, MapPin, Download, Clock,
  BarChart3, RefreshCw, FileText, Eye, ArrowUpDown
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { mockBuildingDocuments } from "@/lib/mock-data";
import { getPortfolioSnapshot, COMPETENCIAS, CURRENT_COMPETENCIA, competenciaLabel, getCompetenciaWindow, getCompetenciaRange, periodRangeLabel, PERIOD_PRESETS } from "@/lib/portfolio-competencia";
import PeriodFilter, { type PeriodFilterValue } from "@/components/filters/PeriodFilter";

import { getContractHealth, getDocumentHealth, getOccupancyStatus, daysUntil, healthColors, healthLabels, HealthStatus } from "@/lib/health-utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { generateReport, ReportConfig, ReportSection } from "@/lib/pdf-report-service";
import ReportExportDialog, { type ExportSectionOption } from "@/components/reports/ReportExportDialog";

import { captureChartAsBase64 } from "@/lib/chart-capture";
import PortfolioAnalytics from "@/components/portfolio/PortfolioAnalytics";
import BrazilAssetsMap from "@/components/portfolio/BrazilAssetsMap";
import { useFund } from "@/contexts/FundContext";

const fmt = (v: number) => v >= 1000000 ? `R$ ${(v / 1000000).toFixed(2).replace('.', ',')}M` : `R$ ${v.toLocaleString('pt-BR')}`;

interface Alert {
  severity: HealthStatus;
  type: string;
  building: string;
  item: string;
  daysLeft: number;
}

const ProprietarioPortfolio = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { selectedFund } = useFund();
  const [period, setPeriod] = useState<PeriodFilterValue>({ preset: '1m', end: CURRENT_COMPETENCIA, start: CURRENT_COMPETENCIA });
  const competenciaWindow = useMemo(() => (
    period.preset === 'custom'
      ? getCompetenciaRange(period.start, period.end)
      : getCompetenciaWindow(period.end, PERIOD_PRESETS.find(p => p.value === period.preset)?.months ?? 1)
  ), [period]);
  /** Competência de fechamento da janela — base dos indicadores pontuais */
  const competencia = competenciaWindow[competenciaWindow.length - 1];
  const periodLabel = periodRangeLabel(competenciaWindow);
  const [buildingFilter, setBuildingFilter] = useState('all');

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [alertFilter, setAlertFilter] = useState('all');
  const [alertSheetFilter, setAlertSheetFilter] = useState('all');
  const [alertSheetOpen, setAlertSheetOpen] = useState(false);
  const [sortCol, setSortCol] = useState<string>('health');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 15;

  const buildingMapRef = useRef<HTMLDivElement>(null);
  const analyticsRef = useRef<HTMLDivElement>(null);
  const unitsRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Competência global da página — todos os dados abaixo são o recorte do mês
  const snapshot = useMemo(() => getPortfolioSnapshot(competencia), [competencia]);
  const portfolioBuildings = snapshot.buildings;
  const snapContracts = snapshot.contracts;

  const portfolioBuildingIds = new Set(portfolioBuildings.map((b) => b.id));
  const totalGla = portfolioBuildings.reduce((s, b) => s + (b.gla_m2 || 0), 0);

  // FIX 1: Vacância calculada a partir das unidades vagas reais
  const vacantUnitsArr = snapContracts.filter(c => portfolioBuildingIds.has(c.building_id) && c.status === 'vacant');
  const vacanciaM2 = vacantUnitsArr.reduce((sum, c) => sum + (c.area_m2 || 0), 0);
  const vacanciaPerc = totalGla > 0 ? ((vacanciaM2 / totalGla) * 100) : 0;
  const vacancyStatus: HealthStatus = vacanciaPerc < 10 ? 'healthy' : vacanciaPerc <= 20 ? 'warning' : 'critical';

  // Ocupação financeira — indicador apurado pelo módulo financeiro por competência
  const ocupacaoFinanceira = snapshot.ocupacaoFinanceira;
  const ocupFinStatus: HealthStatus = ocupacaoFinanceira === null
    ? 'warning'
    : ocupacaoFinanceira >= 95 ? 'healthy' : ocupacaoFinanceira >= 85 ? 'warning' : 'critical';


  const occupiedGla = totalGla - vacanciaM2;
  const avgOccupancy = totalGla > 0 ? (occupiedGla / totalGla * 100) : 0;
  const occStatus = getOccupancyStatus(avgOccupancy);
  const totalRevenue = portfolioBuildings.reduce((s, b) => s + (b.monthly_revenue || 0), 0);
  const avgWault = portfolioBuildings.length > 0 ? portfolioBuildings.reduce((s, b) => s + (b.wault_months || 0), 0) / portfolioBuildings.length : 0;

  // FIX 2: R$/m² médio calculado sobre área ocupada real
  const areaOcupada = snapContracts
    .filter(c => portfolioBuildingIds.has(c.building_id) && c.status !== 'vacant' && c.tenant_name)
    .reduce((sum, c) => sum + (c.area_m2 || 0), 0);
  const avgPricePerM2 = areaOcupada > 0 ? Math.round(totalRevenue / areaOcupada) : 0;

  // Estimate potential revenue for vacant units
  const vacantPotentialRevenue = useMemo(() => {
    return vacantUnitsArr.reduce((sum, c) => {
      const bContracts = snapContracts.filter(bc => bc.building_id === c.building_id && bc.status === 'active' && bc.price_per_m2);
      const avgPrice = bContracts.length > 0 ? bContracts.reduce((s, bc) => s + (bc.price_per_m2 || 0), 0) / bContracts.length : 0;
      return sum + c.area_m2 * avgPrice;
    }, 0);
  }, [snapshot, vacantUnitsArr]);

  // WAULT per building for tooltip
  const waultPerBuilding = useMemo(() => {
    return portfolioBuildings.map(b => `${b.short_name || b.name}: ${((b.wault_months || 0) / 12).toFixed(1)} anos`).join(' | ');
  }, [snapshot]);

  // Alerts
  const contractAlerts = useMemo(() => {
    return snapContracts
      .filter(c => portfolioBuildingIds.has(c.building_id) && c.status === 'active' && c.contract_end)
      .map(c => {
        const health = getContractHealth(c.contract_end!);
        const building = portfolioBuildings.find(b => b.id === c.building_id);
        return { severity: health, type: 'Contrato', building: building?.name || '', item: `${c.unit_id} — ${c.tenant_name}`, daysLeft: daysUntil(c.contract_end!) };
      })
      .filter(a => a.severity !== 'healthy');
  }, [snapshot]);

  const docAlerts = useMemo(() => {
    return mockBuildingDocuments.filter(d => portfolioBuildingIds.has(d.building_id)).map(d => {
      const health = getDocumentHealth(d.valid_until);
      const building = portfolioBuildings.find(b => b.id === d.building_id);
      return { severity: health, type: 'Documento', building: building?.name || '', item: d.doc_name, daysLeft: daysUntil(d.valid_until) };
    }).filter(a => a.severity !== 'healthy');
  }, [snapshot]);

  const allAlerts: Alert[] = useMemo(() => {
    return [...contractAlerts, ...docAlerts].sort((a, b) => {
      const order: Record<HealthStatus, number> = { critical: 0, warning: 1, healthy: 2 };
      return order[a.severity] - order[b.severity] || a.daysLeft - b.daysLeft;
    });
  }, [contractAlerts, docAlerts]);

  const filteredAlerts = alertFilter === 'all' ? allAlerts : allAlerts.filter(a => a.type === alertFilter);
  const filteredSheetAlerts = useMemo(() => {
    if (alertSheetFilter === 'all') return allAlerts;
    if (alertSheetFilter === 'Críticos') return allAlerts.filter(a => a.severity === 'critical');
    return allAlerts.filter(a => a.type === alertSheetFilter);
  }, [allAlerts, alertSheetFilter]);

  // Building alerts count
  const buildingAlertCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allAlerts.forEach(a => { counts[a.building] = (counts[a.building] || 0) + 1; });
    return counts;
  }, [allAlerts]);

  // Units table
  const allUnits = useMemo(() => {
    let units = snapContracts.filter(c => portfolioBuildingIds.has(c.building_id)).map(c => {
      const building = portfolioBuildings.find(b => b.id === c.building_id);
      const health = c.contract_end ? getContractHealth(c.contract_end) : undefined;
      const monthsLeft = c.contract_end ? Math.round((new Date(c.contract_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)) : undefined;
      const healthOrder = c.status === 'vacant' ? 3 : health === 'critical' ? 0 : health === 'warning' ? 1 : 2;
      const bContracts = snapContracts.filter(bc => bc.building_id === c.building_id && bc.status === 'active' && bc.price_per_m2);
      const avgBuildingPrice = bContracts.length > 0 ? bContracts.reduce((s, bc) => s + (bc.price_per_m2 || 0), 0) / bContracts.length : 0;
      return { ...c, buildingName: building?.name || '', buildingShort: building?.short_name || building?.name || '', health, healthOrder, monthsLeft, avgBuildingPrice };
    });
    if (buildingFilter !== 'all') units = units.filter(u => u.building_id === buildingFilter);
    if (statusFilter === 'occupied') units = units.filter(u => u.status !== 'vacant');
    if (statusFilter === 'vacant') units = units.filter(u => u.status === 'vacant');
    if (statusFilter === 'critical') units = units.filter(u => u.health === 'critical');
    if (statusFilter === 'warning') units = units.filter(u => u.health === 'warning');
    if (statusFilter === 'healthy') units = units.filter(u => u.health === 'healthy');

    units.sort((a, b) => {
      let cmp = 0;
      if (sortCol === 'health') cmp = a.healthOrder - b.healthOrder;
      else if (sortCol === 'area') cmp = a.area_m2 - b.area_m2;
      else if (sortCol === 'price') cmp = (a.price_per_m2 || 0) - (b.price_per_m2 || 0);
      else if (sortCol === 'months') cmp = (a.monthsLeft ?? 999) - (b.monthsLeft ?? 999);
      else if (sortCol === 'building') cmp = a.buildingName.localeCompare(b.buildingName);
      else if (sortCol === 'tenant') cmp = (a.tenant_name || 'zzz').localeCompare(b.tenant_name || 'zzz');
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return units;
  }, [snapshot, buildingFilter, statusFilter, sortCol, sortDir]);

  const totalPages = Math.ceil(allUnits.length / PAGE_SIZE);
  const pagedUnits = allUnits.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const totalAreaAll = allUnits.reduce((s, u) => s + u.area_m2, 0);
  const totalRevenueAll = allUnits.reduce((s, u) => s + (u.price_per_m2 ? u.area_m2 * u.price_per_m2 : 0), 0);
  const occupiedAreaAll = allUnits.filter(u => u.status !== 'vacant').reduce((s, u) => s + u.area_m2, 0);
  const avgPriceAll = occupiedAreaAll > 0 ? Math.round(totalRevenueAll / occupiedAreaAll) : 0;

  const handleSort = (col: string) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
    setPage(0);
  };

  const SortHeader = ({ col, children, className }: { col: string; children: React.ReactNode; className?: string }) => (
    <TableHead className={`text-xs cursor-pointer select-none hover:text-foreground ${className || ''}`} onClick={() => handleSort(col)}>
      <span className="flex items-center gap-1">{children} <ArrowUpDown size={10} className="opacity-40" /></span>
    </TableHead>
  );

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => ref.current?.scrollIntoView({ behavior: 'smooth' });
  const scrollToUnits = () => document.getElementById('portfolio-units')?.scrollIntoView({ behavior: 'smooth' });

  // FIX 6: KPI card click with active ring
  const handleKpiFilter = (filter: string) => {
    setStatusFilter(filter);
    setPage(0);
    setTimeout(() => scrollToUnits(), 100);
  };

  // Export PDF — seleção do conteúdo (padrão Patria)
  const [exportOpen, setExportOpen] = useState(false);

  const exportSections: ExportSectionOption[] = useMemo(() => [
    {
      id: 'sumario',
      label: 'Sumário executivo (KPIs)',
      hint: 'Ativos, GLA, vacância, ocupação, WAULT e receita mensal',
      build: () => ({
        title: 'Sumário Executivo',
        type: 'kpi-cards',
        kpis: [
          { value: String(portfolioBuildings.length), label: 'Total de Ativos', sub: `${portfolioBuildings.length} ativos gerenciados`, color: [10, 22, 110] },
          { value: `${totalGla.toLocaleString('pt-BR')} m²`, label: 'GLA Total', sub: 'Área total sob gestão', color: [27, 54, 214] },
          { value: `${vacanciaM2.toLocaleString('pt-BR')} m²`, label: 'Vacância', sub: `${vacantUnitsArr.length} unidades disponíveis`, color: [139, 92, 246] },
          { value: `${avgOccupancy.toFixed(1)}%`, label: 'Taxa de Ocupação', sub: 'Portfólio consolidado', color: [16, 185, 129] },
          { value: `${(avgWault / 12).toFixed(1)} anos`, label: 'WAULT Médio', sub: 'Prazo médio ponderado', color: [27, 54, 214] },
          { value: fmt(totalRevenue), label: 'Receita Mensal', sub: `R$/m² médio: R$ ${avgPricePerM2}`, color: [10, 22, 110] },
        ],
      }),
    },
    {
      id: 'fundamentos',
      label: 'Fundamentos do fundo',
      hint: 'PL, VP por cota, ABL, WALE, dividend yield, gestor e administrador',
      build: () => {
        const f = selectedFund.fundamentals;
        if (!f) return null;
        return {
          title: 'Fundamentos do Fundo',
          type: 'table',
          tableHeaders: ['Indicador', 'Valor'],
          tableRows: [
            ['Patrimônio Líquido', `R$ ${(f.patrimonioLiquido / 1_000_000_000).toFixed(2).replace('.', ',')} B`],
            ['VP por cota', `R$ ${f.vpPorCota.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
            ['ABL total', `${f.ablTotal.toLocaleString('pt-BR')} m²`],
            ['Aluguel médio', `R$ ${f.aluguelMedioM2.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/m²`],
            ['WALE', `${f.waleAnos.toFixed(1).replace('.', ',')} anos`],
            ['Dividend Yield', `${f.dividendYield.toFixed(1).replace('.', ',')}% a.a.`],
            ['CNPJ', f.cnpj],
            ['Gestor', f.gestor],
            ['Administrador', f.administrador],
            ['Taxa de gestão', f.taxaGestao],
            ['Categoria Anbima', f.tipoAnbima],
          ],
          columnWidths: [70, 104],
        } as ReportSection;
      },
    },
    {
      id: 'ativos',
      label: 'Portfólio de ativos',
      hint: 'GLA, ocupação, receita e WAULT por ativo',
      build: () => ({
        title: 'Portfólio de Ativos',
        type: 'table',
        tableHeaders: ['Ativo', 'GLA (m²)', 'Ocupação', 'Receita/mês', 'WAULT'],
        tableRows: portfolioBuildings.map(b => [
          b.name,
          (b.gla_m2 || 0).toLocaleString('pt-BR'),
          `${b.occupancy_pct || 0}%`,
          fmt(b.monthly_revenue || 0),
          `${((b.wault_months || 0) / 12).toFixed(1)} anos`
        ]),
        columnWidths: [55, 28, 22, 35, 28],
        totalRow: ['TOTAL', `${totalGla.toLocaleString('pt-BR')}`, `${avgOccupancy.toFixed(1)}%`, fmt(totalRevenue), `${(avgWault / 12).toFixed(1)} anos`],
        footnote: 'GLA = Gross Leasable Area | WAULT = Weighted Average Unexpired Lease Term',
      }),
    },
    {
      id: 'geografia',
      label: 'Distribuição geográfica',
      hint: 'Ativos e GLA por estado',
      build: () => {
        const byState = new Map<string, { n: number; gla: number; receita: number }>();
        portfolioBuildings.forEach(b => {
          const cur = byState.get(b.state) || { n: 0, gla: 0, receita: 0 };
          byState.set(b.state, { n: cur.n + 1, gla: cur.gla + (b.gla_m2 || 0), receita: cur.receita + (b.monthly_revenue || 0) });
        });
        return {
          title: 'Distribuição Geográfica',
          type: 'table',
          tableHeaders: ['Estado', 'Ativos', 'GLA (m²)', 'Receita/mês'],
          tableRows: Array.from(byState.entries()).map(([st, v]) => [st, String(v.n), v.gla.toLocaleString('pt-BR'), fmt(v.receita)]),
          columnWidths: [50, 30, 45, 49],
        } as ReportSection;
      },
    },
    {
      id: 'receita-chart',
      label: 'Gráfico de receita por ativo',
      hint: 'Imagem do gráfico exibido na tela',
      build: async () => {
        const img = await captureChartAsBase64('chart-receita-edificio');
        if (!img) return null;
        return {
          title: 'Análise de Receita',
          type: 'chart-image',
          chartImageBase64: img,
          footnote: 'Ativos em laranja apresentam WAULT < 2 anos.',
        } as ReportSection;
      },
    },
    {
      id: 'leakage',
      label: 'Análise de leakage',
      hint: 'Receita perdida e custos fixos das áreas vagas',
      build: () => {
        if (vacantUnitsArr.length === 0) return null;
        const rows = vacantUnitsArr.map(c => {
          const bldg = portfolioBuildings.find(b => b.id === c.building_id);
          const bContracts = snapContracts.filter(bc => bc.building_id === c.building_id && bc.status === 'active' && bc.price_per_m2);
          const avgPrice = bContracts.length > 0 ? bContracts.reduce((s, bc) => s + (bc.price_per_m2 || 0), 0) / bContracts.length : 0;
          const receitaPerdida = c.area_m2 * avgPrice;
          return [bldg?.short_name || bldg?.name || '', c.unit_id, c.area_m2.toLocaleString('pt-BR'), fmt(receitaPerdida)];
        });
        return {
          title: 'Análise de Leakage',
          type: 'table',
          tableHeaders: ['Ativo', 'Unidade', 'Área (m²)', 'Receita potencial perdida'],
          tableRows: rows,
          columnWidths: [48, 30, 34, 62],
          totalRow: ['TOTAL', `${vacantUnitsArr.length} und.`, `${vacanciaM2.toLocaleString('pt-BR')}`, fmt(vacantPotentialRevenue)],
        } as ReportSection;
      },
    },
    {
      id: 'alertas',
      label: 'Alertas de contrato e documento',
      hint: `${allAlerts.length} alertas ativos`,
      build: () => ({
        title: 'Alertas Críticos',
        type: 'table',
        tableHeaders: ['Prioridade', 'Tipo', 'Ativo', 'Item / Contrato', 'Status'],
        tableRows: allAlerts.slice(0, 20).map(a => [
          a.severity === 'critical' ? 'CRÍTICO' : a.severity === 'warning' ? 'ATENÇÃO' : 'INFO',
          a.type,
          a.building,
          a.item,
          a.daysLeft > 0 ? `${a.daysLeft}d restantes` : `Vencido há ${Math.abs(a.daysLeft)}d`
        ]),
        columnWidths: [24, 24, 40, 55, 30],
        rowHealthCodes: allAlerts.slice(0, 20).map(a =>
          a.severity === 'critical' ? 'C' : a.severity === 'warning' ? 'A' : 'S'
        ),
      }),
    },
    {
      id: 'unidades',
      label: 'Unidades e locatários',
      hint: 'Respeita os filtros aplicados na tela',
      build: () => ({
        title: 'Unidades do Portfólio',
        type: 'table',
        tableHeaders: ['Ativo', 'Unidade', 'Locatário', 'Área (m²)', 'R$/m²', 'Total/mês'],
        tableRows: allUnits.map(u => [
          u.buildingShort,
          u.unit_id,
          u.tenant_name || '— VAGO —',
          u.area_m2.toLocaleString('pt-BR'),
          u.price_per_m2 ? `R$ ${u.price_per_m2}` : '-',
          u.price_per_m2 ? fmt(u.area_m2 * u.price_per_m2) : '-',
        ]),
        columnWidths: [30, 18, 42, 22, 20, 30],
        rowHealthCodes: allUnits.map(u =>
          u.status === 'vacant' ? 'V' : u.health === 'critical' ? 'C' : u.health === 'warning' ? 'A' : 'S'
        ),
        totalRow: ['TOTAIS', `${allUnits.length} und.`, '—', `${totalAreaAll.toLocaleString('pt-BR')}`, `R$ ${avgPriceAll}/m²`, fmt(totalRevenueAll)],
        footnote: 'Unidades em roxo estão disponíveis para locação.',
      }),
    },
  ], [portfolioBuildings, totalGla, vacanciaM2, vacantUnitsArr, avgOccupancy, avgWault, totalRevenue, avgPricePerM2, allAlerts, allUnits, snapContracts, selectedFund, vacantPotentialRevenue, totalAreaAll, avgPriceAll, totalRevenueAll]);


  // Alert row renderer (shared between page and sheet)
  const renderAlertRow = (alert: Alert, i: number) => (
    <div key={i} className="px-4 py-3 flex items-center gap-3 hover:bg-muted/50 cursor-pointer group relative">
      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${healthColors[alert.severity].dot}`} />
      <span className={`text-xs font-medium w-16 shrink-0 ${healthColors[alert.severity].text}`}>{alert.type}</span>
      <span className="text-sm text-foreground shrink-0">{alert.building}</span>
      <span className="text-sm text-muted-foreground flex-1 truncate">{alert.item}</span>
      <span className={`text-xs font-medium whitespace-nowrap group-hover:hidden ${healthColors[alert.severity].text}`}>
        {alert.daysLeft > 0 ? `${alert.daysLeft}d restantes` : `Vencido há ${Math.abs(alert.daysLeft)}d`}
      </span>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden group-hover:flex gap-2 bg-background shadow-md rounded-md px-2 py-1">
        {alert.type === 'Contrato' ? (
          alert.daysLeft <= 0 ? (
            <>
              <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); toast.info("Renovação em breve"); }}>Iniciar Renovação</Button>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); toast.info("Ver contrato em breve"); }}>Ver Contrato</Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="default" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); toast.info("Agendamento em breve"); }}>Agendar Renovação</Button>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); toast.info("Ver contrato em breve"); }}>Ver Contrato</Button>
            </>
          )
        ) : (
          <>
            <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); toast.info("Regularização em breve"); }}>Regularizar</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); toast.info("Detalhes em breve"); }}>Ver Documento</Button>
          </>
        )}
      </div>
    </div>
  );

  // KPI Cards
  const kpiCards = [
    {
      icon: <Building2 size={18} className="text-primary" />,
      bg: 'bg-primary/10',
      value: portfolioBuildings.length.toString(),
      label: 'Total de Ativos',
      subtitle: `${portfolioBuildings.length} ativos gerenciados`,
      filterKey: 'all',
      onClick: () => { handleKpiFilter('all'); scrollTo(buildingMapRef); },
    },
    {
      icon: <Maximize2 size={18} className="text-emerald-500" />,
      bg: 'bg-emerald-50',
      value: totalGla.toLocaleString('pt-BR') + ' m²',
      label: 'GLA Total',
      subtitle: 'Área total sob gestão',
      tooltipContent: portfolioBuildings.map(b => `${b.short_name || b.name}: ${(b.gla_m2 || 0).toLocaleString('pt-BR')} m²`).join(' | '),
      onClick: () => scrollToUnits(),
    },
    {
      icon: <DollarSign size={18} className={ocupFinStatus === 'healthy' ? 'text-emerald-500' : ocupFinStatus === 'warning' ? 'text-amber-500' : 'text-rose-500'} />,
      bg: ocupFinStatus === 'healthy' ? 'bg-emerald-50' : ocupFinStatus === 'warning' ? 'bg-amber-50' : 'bg-rose-50',
      value: ocupacaoFinanceira !== null ? `${ocupacaoFinanceira.toFixed(1)}%` : '—',
      label: 'Ocupação Financeira',
      subtitle: `Competência ${periodLabel}`,
      badge: ocupacaoFinanceira !== null
        ? <Badge className={`${healthColors[ocupFinStatus].badge} text-[10px] mt-1`}>{healthLabels[ocupFinStatus].pt}</Badge>
        : <Badge variant="secondary" className="text-[10px] mt-1">Não apurada</Badge>,
      tooltipContent: 'Indicador apurado pelo módulo financeiro para a competência selecionada.',
      onClick: () => scrollTo(analyticsRef),
    },
    {
      icon: <TrendingUp size={18} className="text-emerald-500" />,
      bg: 'bg-emerald-50',
      value: `${avgOccupancy.toFixed(1)}%`,
      label: 'Ocupação Física',
      subtitle: '',
      badge: <Badge className={`${healthColors[occStatus].badge} text-[10px] mt-1`}>{healthLabels[occStatus].pt}</Badge>,
      filterKey: 'occupied',
      onClick: () => handleKpiFilter('occupied'),
    },

    {
      icon: <Clock size={18} className="text-amber-500" />,
      bg: 'bg-amber-50',
      value: `${(avgWault / 12).toFixed(1)} anos`,
      label: 'WAULT Médio',
      subtitle: 'Prazo médio ponderado',
      tooltipContent: waultPerBuilding,
      onClick: () => scrollTo(analyticsRef),
    },
    {
      icon: <DollarSign size={18} className="text-primary" />,
      bg: 'bg-primary/10',
      value: fmt(totalRevenue),
      label: 'Receita Mensal',
      subtitle: `R$/m² médio: R$ ${avgPricePerM2}`,
      tooltipContent: portfolioBuildings.map(b => `${b.short_name || b.name}: ${fmt(b.monthly_revenue || 0)}/mês`).join(' | '),
      onClick: () => scrollTo(analyticsRef),
    },
  ];

  return (
    <div className="space-y-6">
      {/* [7] Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl md:text-2xl font-bold text-foreground">{selectedFund.ticker}</h1>
            <Badge variant="secondary" className="text-xs">{selectedFund.name}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Visão consolidada — {portfolioBuildings.length} ativos · Período: {periodLabel}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <PeriodFilter value={period} onChange={(v) => { setPeriod(v); setPage(0); }} />

          <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={() => setExportOpen(true)}>
            <Download size={14} /> Exportar Relatório
          </Button>

        </div>
      </div>

      {/* Fundamentos do fundo (fonte: Relatório Gerencial) */}
      {selectedFund.fundamentals && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { l: "Patrimônio Líquido", v: `R$ ${(selectedFund.fundamentals.patrimonioLiquido / 1_000_000_000).toFixed(2).replace('.', ',')}B` },
                { l: "VP por Cota", v: `R$ ${selectedFund.fundamentals.vpPorCota.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` },
                { l: "ABL Total", v: `${selectedFund.fundamentals.ablTotal.toLocaleString('pt-BR')} m²` },
                { l: "Aluguel Médio", v: `R$ ${selectedFund.fundamentals.aluguelMedioM2.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/m²` },
                { l: "WALE", v: `${selectedFund.fundamentals.waleAnos.toFixed(1).replace('.', ',')} anos` },
                { l: "Dividend Yield", v: `${selectedFund.fundamentals.dividendYield.toFixed(1).replace('.', ',')}% a.a.` },
              ].map((f) => (
                <div key={f.l} className="text-left">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{f.l}</p>
                  <p className="text-sm font-semibold text-foreground">{f.v}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[10px] text-muted-foreground">
              CNPJ {selectedFund.fundamentals.cnpj} · Gestor {selectedFund.fundamentals.gestor} · Administrador {selectedFund.fundamentals.administrador} · Taxa de gestão {selectedFund.fundamentals.taxaGestao} · {selectedFund.fundamentals.tipoAnbima}
            </p>
          </CardContent>
        </Card>
      )}



      {/* [1] KPI Cards - 6 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiCards.map((kpi, i) => {
          const isActive = (kpi as any).filterKey && statusFilter === (kpi as any).filterKey && statusFilter !== 'all';
          const cardEl = (
            <button key={i} onClick={kpi.onClick} className={`bg-card rounded-xl border p-4 shadow-sm text-left hover:shadow-md transition-all w-full cursor-pointer ${isActive ? 'ring-2 ring-primary' : ''}`}>
              <div className="flex items-center gap-3 mb-1">
                <div className={`w-9 h-9 rounded-lg ${kpi.bg} flex items-center justify-center shrink-0`}>{kpi.icon}</div>
                <div className="min-w-0">
                  <p className="text-lg font-bold truncate">{kpi.value}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">{kpi.label}</p>
                </div>
              </div>
              {kpi.subtitle && <p className="text-[10px] text-muted-foreground mt-1">{kpi.subtitle}</p>}
              {kpi.badge}
            </button>
          );
          if (kpi.tooltipContent) {
            return (
              <Tooltip key={i}>
                <TooltipTrigger asChild>{cardEl}</TooltipTrigger>
                <TooltipContent className="max-w-xs"><p className="text-xs">{kpi.tooltipContent}</p></TooltipContent>
              </Tooltip>
            );
          }
          return cardEl;
        })}
      </div>

      {/* [2a] Mapa do Brasil — ativos por estado */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin size={16} /> Distribuição Geográfica — {selectedFund.ticker}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BrazilAssetsMap
            assets={portfolioBuildings.map(b => ({ id: b.id, name: b.name, state: b.state }))}
            onAssetClick={(a) => navigate(`/proprietario/edificios?building=${a.id}`)}
          />
        </CardContent>
      </Card>

      {/* [2] Mapa de Ativos - always visible */}
      <div ref={buildingMapRef}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><MapPin size={16} /> Mapa de Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {portfolioBuildings.map(b => {
                const occ = getOccupancyStatus(b.occupancy_pct || 0);
                const alerts = buildingAlertCounts[b.name] || 0;
                const buildingRevenue = b.monthly_revenue || 0;
                const waultYears = ((b.wault_months || 0) / 12).toFixed(1);
                return (
                  <button
                    key={b.id}
                    onClick={() => navigate(`/proprietario/edificios?building=${b.id}`)}
                    className="bg-card rounded-xl border text-left hover:shadow-lg transition-all cursor-pointer overflow-hidden"
                  >
                    <div className="p-4 border-b">
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 size={16} className="text-primary shrink-0" />
                        <p className="font-semibold text-sm truncate">{b.name}</p>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">{b.address}</p>
                    </div>
                    <div className="p-4 border-b space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{(b.gla_m2 || 0).toLocaleString('pt-BR')} m²</span>
                        <span className="font-medium">{fmt(buildingRevenue)}/mês</span>
                      </div>
                      <p className="text-xs text-muted-foreground">WAULT: {waultYears} anos</p>
                    </div>
                    <div className="p-4 border-b space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Ocupação</span>
                        <span className="font-medium">{b.occupancy_pct}%</span>
                      </div>
                      <Progress value={b.occupancy_pct || 0} className={`h-2 ${occ === 'healthy' ? '[&>div]:bg-emerald-500' : occ === 'warning' ? '[&>div]:bg-amber-500' : '[&>div]:bg-rose-500'}`} />
                      <Badge className={`${healthColors[occ].badge} text-[9px]`}>{healthLabels[occ].pt}</Badge>
                    </div>
                    <div className="p-3 flex items-center justify-between">
                      {alerts > 0 ? (
                        <span className="text-xs text-amber-600 font-medium">⚠ {alerts} alerta{alerts > 1 ? 's' : ''}</span>
                      ) : (
                        <span className="text-xs text-emerald-600">✅ Sem alertas</span>
                      )}
                      <span className="text-xs text-primary flex items-center gap-1">Ver detalhes <ChevronRight size={12} /></span>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leakage Analysis */}
      {vacantUnitsArr.length > 0 && (() => {
        const leakageData = vacantUnitsArr.map(c => {
          const bldg = portfolioBuildings.find(b => b.id === c.building_id);
          const bContracts = snapContracts.filter(bc => bc.building_id === c.building_id && bc.status === 'active' && bc.price_per_m2);
          const avgPrice = bContracts.length > 0 ? bContracts.reduce((s, bc) => s + (bc.price_per_m2 || 0), 0) / bContracts.length : 0;
          const totalAreaBldg = bldg?.gla_m2 || bldg?.total_area_m2 || 1;
          const iptuAnual = ({ b2: 460000, b3: 340000, b4: 190000, b5: 280000, b6: 245000, b7: 215000, b8: 180000, b9: 150000, b10: 195000, b11: 230000, b12: 150000 } as Record<string, number>)[c.building_id] || 0;
          const condMensal = ({ b2: 92000, b3: 73000, b4: 42000, b5: 61000, b6: 52000, b7: 47000, b8: 39000, b9: 33000, b10: 41000, b11: 50000, b12: 38000 } as Record<string, number>)[c.building_id] || 0;
          const fracao = c.area_m2 / totalAreaBldg;
          const receitaPerdida = c.area_m2 * avgPrice;
          const iptuVacancia = fracao * iptuAnual / 12;
          const condVacancia = fracao * condMensal;
          return {
            unitId: c.unit_id,
            building: bldg?.short_name || bldg?.name || '',
            area: c.area_m2,
            receitaPerdida,
            iptuVacancia,
            condVacancia,
            total: receitaPerdida + iptuVacancia + condVacancia,
          };
        });
        const totRecPerdida = leakageData.reduce((s, l) => s + l.receitaPerdida, 0);
        const totIptu = leakageData.reduce((s, l) => s + l.iptuVacancia, 0);
        const totCond = leakageData.reduce((s, l) => s + l.condVacancia, 0);
        const totLeakage = totRecPerdida + totIptu + totCond;

        return (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle size={16} className="text-rose-500" /> Análise de Leakage (Vazamento de Receita)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-rose-50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Receita Potencial Perdida</p>
                  <p className="text-lg font-bold text-rose-700">{fmt(totRecPerdida)}<span className="text-xs font-normal text-muted-foreground">/mês</span></p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">IPTU Vacância</p>
                  <p className="text-lg font-bold text-amber-700">{fmt(totIptu)}<span className="text-xs font-normal text-muted-foreground">/mês</span></p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Condomínio Vacância</p>
                  <p className="text-lg font-bold text-amber-700">{fmt(totCond)}<span className="text-xs font-normal text-muted-foreground">/mês</span></p>
                </div>
                <div className="bg-rose-100 rounded-lg p-3 border border-rose-200">
                  <p className="text-xs text-muted-foreground font-medium">Leakage Total</p>
                  <p className="text-lg font-bold text-rose-800">{fmt(totLeakage)}<span className="text-xs font-normal text-muted-foreground">/mês</span></p>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Ativo</TableHead>
                    <TableHead className="text-xs">Unidade</TableHead>
                    <TableHead className="text-xs text-right">Área (m²)</TableHead>
                    <TableHead className="text-xs text-right">Receita Perdida</TableHead>
                    <TableHead className="text-xs text-right">IPTU</TableHead>
                    <TableHead className="text-xs text-right">Condomínio</TableHead>
                    <TableHead className="text-xs text-right font-medium">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leakageData.map((l, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm">{l.building}</TableCell>
                      <TableCell className="text-sm font-medium">{l.unitId}</TableCell>
                      <TableCell className="text-sm text-right">{l.area.toLocaleString('pt-BR')}</TableCell>
                      <TableCell className="text-sm text-right text-rose-600">{fmt(l.receitaPerdida)}</TableCell>
                      <TableCell className="text-sm text-right text-amber-600">{fmt(l.iptuVacancia)}</TableCell>
                      <TableCell className="text-sm text-right text-amber-600">{fmt(l.condVacancia)}</TableCell>
                      <TableCell className="text-sm text-right font-bold text-rose-700">{fmt(l.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-xs text-muted-foreground">Leakage = receita que o fundo deixa de receber + custos fixos arcados sem receita correspondente. Base: R$/m² médio por ativo.</p>
            </CardContent>
          </Card>
        );
      })()}

      {/* [3] Painel Analítico */}
      <div ref={analyticsRef}>
        <PortfolioAnalytics competencia={competencia} />
      </div>

      {/* [4] Alertas Ativos */}
      {allAlerts.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" /> Alertas Ativos
              <Badge variant="secondary" className="text-xs ml-2">{allAlerts.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex gap-2 mb-3 flex-wrap">
              {['all', 'Contrato', 'Documento'].map(t => (
                <Button key={t} variant={alertFilter === t ? 'default' : 'outline'} size="sm" className="text-xs h-7" onClick={() => setAlertFilter(t)}>
                  {t === 'all' ? 'Todos' : t + 's'}
                </Button>
              ))}
            </div>
            <div className="divide-y rounded-lg border">
              {filteredAlerts.slice(0, 6).map((alert, i) => renderAlertRow(alert, i))}
            </div>
            {allAlerts.length > 6 && (
              <div className="mt-3 text-center">
                <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => setAlertSheetOpen(true)}>
                  Ver todos os {allAlerts.length} alertas <ChevronRight size={14} />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* FIX 4: Alert Sheet */}
      <Sheet open={alertSheetOpen} onOpenChange={setAlertSheetOpen}>
        <SheetContent side="center" className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              Alertas do Portfólio <Badge variant="secondary">{allAlerts.length}</Badge>
            </SheetTitle>
          </SheetHeader>
          <div className="flex gap-2 my-4 flex-wrap">
            {['all', 'Contrato', 'Documento', 'Críticos'].map(t => (
              <Button key={t} variant={alertSheetFilter === t ? 'default' : 'outline'} size="sm" className="text-xs h-7"
                onClick={() => setAlertSheetFilter(t)}>
                {t === 'all' ? 'Todos' : t === 'Críticos' ? 'Críticos' : t + 's'}
              </Button>
            ))}
          </div>
          <div className="divide-y rounded-lg border">
            {filteredSheetAlerts.map((alert, i) => renderAlertRow(alert, i))}
          </div>
          <div className="mt-4">
            <Button variant="outline" className="w-full" onClick={() => setAlertSheetOpen(false)}>Fechar</Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* [5] Tabela de Unidades */}
      <div ref={unitsRef} id="portfolio-units">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 flex-wrap gap-2">
            <CardTitle className="text-base">Unidades do Portfólio</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={buildingFilter} onValueChange={(v) => { setBuildingFilter(v); setPage(0); }}>
                <SelectTrigger className="w-[180px] h-8 text-xs"><SelectValue placeholder="Todos os ativos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os ativos</SelectItem>
                  {portfolioBuildings.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex gap-1">
                {[
                  { key: 'all', label: 'Todos' },
                  { key: 'occupied', label: 'Ocupadas' },
                  { key: 'vacant', label: 'Vagas' },
                  { key: 'critical', label: 'Crítico' },
                  { key: 'warning', label: 'Atenção' },
                  { key: 'healthy', label: 'Saudável' },
                ].map(f => (
                  <Button key={f.key} variant={statusFilter === f.key ? 'default' : 'outline'} size="sm" className="text-[10px] h-7 px-2"
                    onClick={() => { setStatusFilter(f.key); setPage(0); }}>
                    {f.label}
                  </Button>
                ))}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs h-8 gap-1"><Download size={12} /> Exportar</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => toast.info("Exportação Excel disponível em breve")}>Excel — Todas as unidades</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setExportOpen(true)}>PDF — Relatório personalizado</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortHeader col="building" className="text-left">Ativo</SortHeader>
                    <TableHead className="text-xs text-left">Unidade</TableHead>
                    <SortHeader col="tenant" className="text-left">Locatário</SortHeader>
                    <SortHeader col="area" className="text-right">Área (m²)</SortHeader>
                    <SortHeader col="price" className="text-right">R$/m²</SortHeader>
                    <TableHead className="text-xs text-right">Total Mensal</TableHead>
                    <TableHead className="text-xs text-left">Tipo</TableHead>
                    <SortHeader col="months" className="text-right">Meses Rest.</SortHeader>
                    <SortHeader col="health" className="text-center">Saúde</SortHeader>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedUnits.map(u => {
                    const isVacant = u.status === 'vacant';
                    const monthsColor = u.monthsLeft !== undefined ? (u.monthsLeft >= 12 ? 'text-muted-foreground' : u.monthsLeft >= 6 ? 'text-amber-600' : 'text-rose-600') : '';
                    return (
                      <TableRow key={u.id} className={`hover:bg-muted/50 cursor-pointer ${isVacant ? 'bg-muted/30' : ''}`}
                        onClick={() => toast.info(isVacant ? "Formulário de novo contrato em breve" : "Detalhe do contrato em breve")}>
                        <TableCell className="text-sm text-left">{u.buildingShort}</TableCell>
                        <TableCell className="text-sm font-medium text-left">{u.unit_id}</TableCell>
                        <TableCell className="text-sm text-left">
                          {isVacant ? <span className="text-muted-foreground italic">— VAGO —</span> : u.tenant_name}
                        </TableCell>
                        <TableCell className="text-sm text-right">{u.area_m2.toLocaleString('pt-BR')}</TableCell>
                        <TableCell className="text-sm text-right">{u.price_per_m2 ? `R$ ${u.price_per_m2}` : '-'}</TableCell>
                        <TableCell className="text-sm text-right">
                          {isVacant ? (
                            <span className="text-muted-foreground text-xs italic">Pot: {fmt(u.area_m2 * u.avgBuildingPrice)}</span>
                          ) : u.price_per_m2 ? fmt(u.area_m2 * u.price_per_m2) : '-'}
                        </TableCell>
                        <TableCell className="text-sm capitalize text-left">{u.contract_type || '-'}</TableCell>
                        <TableCell className={`text-sm text-right font-medium ${monthsColor}`}>
                          {u.monthsLeft !== undefined ? (u.monthsLeft > 0 ? `${u.monthsLeft}m` : 'Vencido') : '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          {isVacant ? (
                            <Badge className="bg-violet-100 text-violet-700 text-[9px]">Disponível</Badge>
                          ) : u.health ? (
                            <Badge className={`${healthColors[u.health].badge} text-[9px]`}>{healthLabels[u.health].pt}</Badge>
                          ) : '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                <TableFooter>
                  <TableRow className="bg-muted/50 font-medium">
                    <TableCell className="text-xs text-left" colSpan={3}>Totais ({allUnits.length} unidades)</TableCell>
                    <TableCell className="text-xs text-right">{totalAreaAll.toLocaleString('pt-BR')} m²</TableCell>
                    <TableCell className="text-xs text-right">R$ {avgPriceAll}/m²</TableCell>
                    <TableCell className="text-xs text-right">{fmt(totalRevenueAll)}</TableCell>
                    <TableCell colSpan={3} />
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-xs text-muted-foreground">Página {page + 1} de {totalPages}</p>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" className="text-xs h-7" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Anterior</Button>
                  <Button variant="outline" size="sm" className="text-xs h-7" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Próximo</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ReportExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        title="Relatório de Portfólio"
        subtitle={`Visão Consolidada — ${portfolioBuildings.length} Ativos`}
        module="Portfólio"
        period={periodLabel}
        fundName={selectedFund.ticker}
        previewKpis={[
          { value: String(portfolioBuildings.length), label: 'Ativos' },
          { value: `${totalGla.toLocaleString('pt-BR')} m²`, label: 'GLA Total' },
          { value: `${avgOccupancy.toFixed(1)}%`, label: 'Ocupação' },
          { value: fmt(totalRevenue), label: 'Receita Mensal' },
        ]}
        sections={exportSections}
      />
    </div>

  );
};

export default ProprietarioPortfolio;
