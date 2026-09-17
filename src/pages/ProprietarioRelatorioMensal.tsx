import { useState, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  TrendingUp, TrendingDown, Download, FileText, DollarSign,
  Ticket, AlertTriangle, Calendar, BarChart3, Sparkles, Building2,
  CheckCircle2, ArrowUpRight, ArrowDownRight, Target, Flag
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ComposedChart
} from "recharts";
import { monthlySnapshots, mockTenantContracts, getHGRE11PortfolioBuildings } from "@/lib/mock-data";
import { generateReport, type ReportConfig, type ReportSection } from "@/lib/pdf-report-service";
import { toast } from "sonner";
import html2canvas from "html2canvas";

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);
const fmtCompact = (v: number) => `R$ ${(v / 1000).toFixed(0)}k`;
const pct = (a: number, b: number) => b === 0 ? 0 : ((a - b) / b) * 100;

function DeltaPill({ delta, invert = false, suffix = '%' }: { delta: number; invert?: boolean; suffix?: string }) {
  const positive = delta >= 0;
  const good = invert ? !positive : positive;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded ${good ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
      <Icon size={11} /> {Math.abs(delta).toFixed(1)}{suffix}
    </span>
  );
}

function KpiCard({ icon, label, value, delta, invert, sub }: { icon: React.ReactNode; label: string; value: string; delta?: number; invert?: boolean; sub?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">{icon}</div>
        {delta !== undefined && <DeltaPill delta={delta} invert={invert} />}
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold text-foreground mt-0.5">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

export default function ProprietarioRelatorioMensal() {
  const [selectedPeriod, setSelectedPeriod] = useState(monthlySnapshots.length - 1);
  const current = monthlySnapshots[selectedPeriod];
  const previous = selectedPeriod > 0 ? monthlySnapshots[selectedPeriod - 1] : null;
  const trend = monthlySnapshots.slice(Math.max(0, selectedPeriod - 5), selectedPeriod + 1);

  const [narrative, setNarrative] = useState(
    `O mês de ${current.period} apresentou ocupação de ${current.occupancy.toFixed(1)}% com receita total de ${fmt(current.revenue)}. ` +
    `O SLA de atendimento ficou em ${current.sla_compliance.toFixed(1)}% e a equipe resolveu ${current.chamados_resolved} chamados no período. ` +
    `Destaque para os ${current.contracts_started} novo(s) contrato(s) iniciado(s) e ${current.adjustments_applied} reajuste(s) aplicado(s).`
  );

  const chartRevenueRef = useRef<HTMLDivElement>(null);
  const chartOccRef = useRef<HTMLDivElement>(null);
  const chartTicketsRef = useRef<HTMLDivElement>(null);

  // Insights automáticos
  const insights = useMemo(() => {
    if (!previous) return { highlights: [], attention: [] };
    const highlights: string[] = [];
    const attention: string[] = [];
    const revDelta = pct(current.revenue, previous.revenue);
    const occDelta = pct(current.occupancy, previous.occupancy);
    const slaDelta = pct(current.sla_compliance, previous.sla_compliance);
    const vacDelta = pct(current.vacancy_m2, previous.vacancy_m2);

    if (revDelta >= 0) highlights.push(`Receita cresceu ${revDelta.toFixed(1)}% vs mês anterior (+${fmt(current.revenue - previous.revenue)})`);
    else attention.push(`Receita caiu ${Math.abs(revDelta).toFixed(1)}% vs mês anterior`);

    if (occDelta >= 0) highlights.push(`Ocupação subiu ${occDelta.toFixed(1)} p.p. para ${current.occupancy.toFixed(1)}%`);
    else attention.push(`Ocupação recuou ${Math.abs(occDelta).toFixed(1)} p.p.`);

    if (slaDelta >= 0) highlights.push(`SLA melhorou para ${current.sla_compliance.toFixed(1)}%`);
    else attention.push(`SLA caiu para ${current.sla_compliance.toFixed(1)}%`);

    if (vacDelta < 0) highlights.push(`Vacância reduziu em ${Math.abs(current.vacancy_m2 - previous.vacancy_m2).toLocaleString('pt-BR')} m²`);
    else if (vacDelta > 0) attention.push(`Vacância aumentou em ${(current.vacancy_m2 - previous.vacancy_m2).toLocaleString('pt-BR')} m²`);

    if (current.alerts_new > 2) attention.push(`${current.alerts_new} alertas novos exigem atenção`);
    if (current.contracts_started > 0) highlights.push(`${current.contracts_started} novo(s) contrato(s) assinado(s)`);

    return { highlights: highlights.slice(0, 4), attention: attention.slice(0, 4) };
  }, [current, previous]);

  const captureChart = async (ref: React.RefObject<HTMLDivElement>): Promise<string | null> => {
    if (!ref.current) return null;
    try {
      const canvas = await html2canvas(ref.current, { backgroundColor: '#ffffff', scale: 2, logging: false });
      return canvas.toDataURL('image/png');
    } catch (e) {
      console.error('Chart capture error:', e);
      return null;
    }
  };

  const handleExportPDF = async () => {
    toast.info("Gerando relatório mensal PDF...");
    const revChart = await captureChart(chartRevenueRef);
    const occChart = await captureChart(chartOccRef);
    const ticketChart = await captureChart(chartTicketsRef);

    const config: ReportConfig = {
      title: 'Relatório Mensal Executivo',
      subtitle: `Período: ${current.period}`,
      period: current.period,
      module: 'Relatório Mensal',
      gestorName: 'Natalia Landi',
      fundName: 'Safra FII',
      tableOfContents: [
        { page: 2, title: 'Resumo Executivo & Destaques' },
        { page: 3, title: 'Performance Financeira' },
        { page: 4, title: 'Ocupação & Contratos' },
        { page: 5, title: 'Operação & Chamados' },
        { page: 6, title: 'Narrativa do Gestor' },
      ],
      previewKpis: [
        { value: `${current.occupancy.toFixed(1)}%`, label: 'Ocupação' },
        { value: fmt(current.revenue), label: 'Receita' },
        { value: `${current.sla_compliance.toFixed(1)}%`, label: 'SLA' },
        { value: String(current.alerts_new), label: 'Alertas' },
      ],
    };

    const sections: ReportSection[] = [
      {
        title: 'Resumo Executivo',
        type: 'kpi-cards',
        kpis: [
          { value: `${current.occupancy.toFixed(1)}%`, label: 'Ocupação', sub: previous ? `Δ ${pct(current.occupancy, previous.occupancy).toFixed(1)}%` : '' },
          { value: fmt(current.revenue), label: 'Receita Mensal', sub: previous ? `Δ ${pct(current.revenue, previous.revenue).toFixed(1)}%` : '' },
          { value: `${current.vacancy_m2.toLocaleString('pt-BR')} m²`, label: 'Vacância', sub: `WAULT ${current.wault.toFixed(1)} m` },
          { value: `${current.sla_compliance.toFixed(1)}%`, label: 'SLA', sub: `${current.chamados_resolved}/${current.chamados_opened} resolvidos` },
        ],
      },
      {
        title: 'Destaques do Período',
        type: 'table',
        tableHeaders: ['Tipo', 'Observação'],
        tableRows: [
          ...insights.highlights.map(h => ['✓ Destaque', h] as [string, string]),
          ...insights.attention.map(a => ['! Atenção', a] as [string, string]),
        ],
        columnWidths: [30, 144],
      },
      ...(revChart ? [{ title: 'Receita vs Despesa (últimos meses)', type: 'chart-image' as const, chartImageBase64: revChart, footnote: 'Valores em R$' }] : []),
      ...(occChart ? [{ title: 'Evolução de Ocupação e WAULT', type: 'chart-image' as const, chartImageBase64: occChart }] : []),
      {
        title: 'Contratos',
        type: 'table',
        tableHeaders: ['Métrica', 'Este Mês', 'Mês Anterior', 'Variação'],
        tableRows: [
          ['Contratos Iniciados', String(current.contracts_started), previous ? String(previous.contracts_started) : '—', previous ? `${current.contracts_started - previous.contracts_started > 0 ? '+' : ''}${current.contracts_started - previous.contracts_started}` : '—'],
          ['Contratos Encerrados', String(current.contracts_ended), previous ? String(previous.contracts_ended) : '—', previous ? `${current.contracts_ended - previous.contracts_ended > 0 ? '+' : ''}${current.contracts_ended - previous.contracts_ended}` : '—'],
          ['Reajustes Aplicados', String(current.adjustments_applied), previous ? String(previous.adjustments_applied) : '—', previous ? `${current.adjustments_applied - previous.adjustments_applied > 0 ? '+' : ''}${current.adjustments_applied - previous.adjustments_applied}` : '—'],
        ],
      },
      ...(ticketChart ? [{ title: 'Chamados — Abertos vs Resolvidos', type: 'chart-image' as const, chartImageBase64: ticketChart }] : []),
      {
        title: 'Operação & SLA',
        type: 'table',
        tableHeaders: ['Métrica', 'Este Mês', 'Mês Anterior'],
        tableRows: [
          ['Chamados Abertos', String(current.chamados_opened), previous ? String(previous.chamados_opened) : '—'],
          ['Chamados Resolvidos', String(current.chamados_resolved), previous ? String(previous.chamados_resolved) : '—'],
          ['SLA Compliance', `${current.sla_compliance.toFixed(1)}%`, previous ? `${previous.sla_compliance.toFixed(1)}%` : '—'],
          ['Documentos Renovados', String(current.docs_renewed), previous ? String(previous.docs_renewed) : '—'],
          ['Documentos Expirados', String(current.docs_expired), previous ? String(previous.docs_expired) : '—'],
        ],
      },
      {
        title: 'Financeiro Consolidado',
        type: 'kpi-cards',
        kpis: [
          { value: fmt(current.revenue), label: 'Receita', sub: previous ? `Δ ${pct(current.revenue, previous.revenue).toFixed(1)}%` : '' },
          { value: fmt(current.expenses), label: 'Despesas', sub: previous ? `Δ ${pct(current.expenses, previous.expenses).toFixed(1)}%` : '' },
          { value: fmt(current.revenue - current.expenses), label: 'NOI', sub: `Margem ${((current.revenue - current.expenses) / current.revenue * 100).toFixed(1)}%` },
        ],
      },
      {
        title: 'Narrativa do Gestor',
        type: 'text',
        text: narrative,
      },
    ];

    await generateReport(config, sections);
    toast.success("Relatório PDF exportado com sucesso!");
  };

  const revenueChartData = trend.map(t => ({
    period: t.period.split('/')[0],
    Receita: t.revenue,
    Despesa: t.expenses,
    NOI: t.revenue - t.expenses,
  }));

  const occChartData = trend.map(t => ({
    period: t.period.split('/')[0],
    Ocupação: t.occupancy,
    WAULT: t.wault,
  }));

  const ticketChartData = trend.map(t => ({
    period: t.period.split('/')[0],
    Abertos: t.chamados_opened,
    Resolvidos: t.chamados_resolved,
    SLA: t.sla_compliance,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="text-primary" size={22} /> Relatório Mensal Executivo
          </h1>
          <p className="text-sm text-muted-foreground">Performance consolidada com destaques, gráficos e narrativa para exportação em PDF</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={String(selectedPeriod)} onValueChange={(v) => setSelectedPeriod(Number(v))}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {monthlySnapshots.map((s, i) => (
                <SelectItem key={i} value={String(i)}>{s.period}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" className="gap-2 text-xs bg-primary hover:bg-primary/90" onClick={handleExportPDF}>
            <Download size={14} /> Exportar PDF
          </Button>
        </div>
      </div>

      {/* Hero banner */}
      <div className="rounded-2xl bg-gradient-to-br from-[#0B2A3D] to-[#1e3a5f] text-white p-6 shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-white/70 mb-1">
              <Calendar size={12} /> Período de referência
            </div>
            <h2 className="text-3xl font-bold">{current.period}</h2>
            {previous && <p className="text-sm text-white/70 mt-1">Comparativo com {previous.period}</p>}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-[11px] text-white/60">Ocupação</p>
              <p className="text-2xl font-bold">{current.occupancy.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-[11px] text-white/60">Receita</p>
              <p className="text-2xl font-bold">{fmtCompact(current.revenue)}</p>
            </div>
            <div>
              <p className="text-[11px] text-white/60">NOI</p>
              <p className="text-2xl font-bold">{fmtCompact(current.revenue - current.expenses)}</p>
            </div>
            <div>
              <p className="text-[11px] text-white/60">SLA</p>
              <p className="text-2xl font-bold">{current.sla_compliance.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Insights / Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-emerald-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-emerald-700">
              <Sparkles size={16} /> Destaques do mês
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {insights.highlights.length === 0 && <p className="text-xs text-muted-foreground">Sem destaques positivos no período.</p>}
            {insights.highlights.map((h, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle2 size={14} className="text-emerald-600 mt-0.5 shrink-0" />
                <span>{h}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="border-amber-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-700">
              <Flag size={16} /> Pontos de atenção
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {insights.attention.length === 0 && <p className="text-xs text-muted-foreground">Nenhum ponto crítico identificado.</p>}
            {insights.attention.map((a, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
                <span>{a}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard icon={<Building2 size={16} />} label="Ocupação" value={`${current.occupancy.toFixed(1)}%`} delta={previous ? pct(current.occupancy, previous.occupancy) : undefined} />
        <KpiCard icon={<DollarSign size={16} />} label="Receita" value={fmtCompact(current.revenue)} delta={previous ? pct(current.revenue, previous.revenue) : undefined} />
        <KpiCard icon={<TrendingDown size={16} />} label="Despesa" value={fmtCompact(current.expenses)} delta={previous ? pct(current.expenses, previous.expenses) : undefined} invert />
        <KpiCard icon={<Target size={16} />} label="WAULT" value={`${current.wault.toFixed(1)}m`} delta={previous ? pct(current.wault, previous.wault) : undefined} />
        <KpiCard icon={<Ticket size={16} />} label="SLA" value={`${current.sla_compliance.toFixed(1)}%`} delta={previous ? pct(current.sla_compliance, previous.sla_compliance) : undefined} />
        <KpiCard icon={<AlertTriangle size={16} />} label="Alertas" value={String(current.alerts_new)} delta={previous ? pct(current.alerts_new, previous.alerts_new) : undefined} invert />
      </div>

      {/* Tabs: Gráficos / Detalhes / Narrativa */}
      <Tabs defaultValue="charts">
        <TabsList>
          <TabsTrigger value="charts" className="gap-2"><BarChart3 size={14} /> Gráficos</TabsTrigger>
          <TabsTrigger value="details" className="gap-2"><FileText size={14} /> Detalhes</TabsTrigger>
          <TabsTrigger value="narrative" className="gap-2"><Sparkles size={14} /> Narrativa</TabsTrigger>
        </TabsList>

        <TabsContent value="charts" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Receita vs Despesa — últimos {trend.length} meses</CardTitle></CardHeader>
            <CardContent>
              <div ref={chartRevenueRef} className="bg-white p-2">
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Receita" fill="#0B2A3D" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Despesa" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="NOI" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Ocupação & WAULT</CardTitle></CardHeader>
              <CardContent>
                <div ref={chartOccRef} className="bg-white p-2">
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={occChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Area type="monotone" dataKey="Ocupação" stroke="#0B2A3D" fill="#0B2A3D" fillOpacity={0.15} strokeWidth={2} />
                      <Line type="monotone" dataKey="WAULT" stroke="#8b5cf6" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Chamados & SLA</CardTitle></CardHeader>
              <CardContent>
                <div ref={chartTicketsRef} className="bg-white p-2">
                  <ResponsiveContainer width="100%" height={220}>
                    <ComposedChart data={ticketChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                      <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} domain={[0, 100]} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar yAxisId="left" dataKey="Abertos" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="left" dataKey="Resolvidos" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Line yAxisId="right" type="monotone" dataKey="SLA" stroke="#0B2A3D" strokeWidth={2} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="details" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Comparativo detalhado</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-left">Indicador</TableHead>
                    <TableHead className="text-left">Este Mês</TableHead>
                    <TableHead className="text-left">Mês Anterior</TableHead>
                    <TableHead className="text-left">Variação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { l: 'Ocupação', c: `${current.occupancy.toFixed(1)}%`, p: previous ? `${previous.occupancy.toFixed(1)}%` : '—', d: previous ? pct(current.occupancy, previous.occupancy) : null },
                    { l: 'Receita', c: fmt(current.revenue), p: previous ? fmt(previous.revenue) : '—', d: previous ? pct(current.revenue, previous.revenue) : null },
                    { l: 'Despesa', c: fmt(current.expenses), p: previous ? fmt(previous.expenses) : '—', d: previous ? pct(current.expenses, previous.expenses) : null, invert: true },
                    { l: 'NOI', c: fmt(current.revenue - current.expenses), p: previous ? fmt(previous.revenue - previous.expenses) : '—', d: previous ? pct(current.revenue - current.expenses, previous.revenue - previous.expenses) : null },
                    { l: 'Vacância (m²)', c: current.vacancy_m2.toLocaleString('pt-BR'), p: previous ? previous.vacancy_m2.toLocaleString('pt-BR') : '—', d: previous ? pct(current.vacancy_m2, previous.vacancy_m2) : null, invert: true },
                    { l: 'WAULT', c: `${current.wault.toFixed(1)} m`, p: previous ? `${previous.wault.toFixed(1)} m` : '—', d: previous ? pct(current.wault, previous.wault) : null },
                    { l: 'Contratos Iniciados', c: String(current.contracts_started), p: previous ? String(previous.contracts_started) : '—', d: null },
                    { l: 'Contratos Encerrados', c: String(current.contracts_ended), p: previous ? String(previous.contracts_ended) : '—', d: null },
                    { l: 'Reajustes Aplicados', c: String(current.adjustments_applied), p: previous ? String(previous.adjustments_applied) : '—', d: null },
                    { l: 'Chamados Abertos', c: String(current.chamados_opened), p: previous ? String(previous.chamados_opened) : '—', d: null },
                    { l: 'Chamados Resolvidos', c: String(current.chamados_resolved), p: previous ? String(previous.chamados_resolved) : '—', d: null },
                    { l: 'SLA Compliance', c: `${current.sla_compliance.toFixed(1)}%`, p: previous ? `${previous.sla_compliance.toFixed(1)}%` : '—', d: previous ? pct(current.sla_compliance, previous.sla_compliance) : null },
                    { l: 'Documentos Renovados', c: String(current.docs_renewed), p: previous ? String(previous.docs_renewed) : '—', d: null },
                    { l: 'Documentos Expirados', c: String(current.docs_expired), p: previous ? String(previous.docs_expired) : '—', d: null, invert: true },
                    { l: 'Alertas Novos', c: String(current.alerts_new), p: previous ? String(previous.alerts_new) : '—', d: null, invert: true },
                  ].map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-left font-medium">{r.l}</TableCell>
                      <TableCell className="text-left">{r.c}</TableCell>
                      <TableCell className="text-left text-muted-foreground">{r.p}</TableCell>
                      <TableCell className="text-left">{r.d !== null ? <DeltaPill delta={r.d} invert={r.invert} /> : <span className="text-muted-foreground">—</span>}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="narrative" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Narrativa do Gestor</CardTitle>
              <p className="text-xs text-muted-foreground">Este texto será incluído no PDF exportado. Personalize com observações específicas do período.</p>
            </CardHeader>
            <CardContent>
              <Textarea
                value={narrative}
                onChange={(e) => setNarrative(e.target.value)}
                className="min-h-[200px] text-sm"
                placeholder="Descreva os principais acontecimentos do mês, decisões tomadas e perspectivas para o próximo período..."
              />
              <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                <span>{narrative.length} caracteres</span>
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => setNarrative('')}>Limpar</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
