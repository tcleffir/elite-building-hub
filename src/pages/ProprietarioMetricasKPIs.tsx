import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import {
  TrendingUp, TrendingDown, Minus, ArrowRight, Building2, FileText, Users,
  FilePlus2, Filter, Percent, Clock, AlertTriangle, Layers, PieChart as PieIcon,
  CalendarClock, Wallet, Activity, Hammer,
} from "lucide-react";
import { toast } from "sonner";
import { useFund } from "@/contexts/FundContext";
import {
  buildRelationalModel, filterModel, aggregate, buildCapex, buildTir, buildSerie,
  prevCompetencia, competenciaLabel, CURRENT_COMPETENCIA, COMPETENCIAS,
  PORTFOLIO_OPTIONS, TIPO_ATIVO_OPTIONS, fmtDateBR,
  type KpiFilters,
} from "@/lib/kpi-engine";
import { buildKpiCards, buildDrillDown, type KpiKey } from "@/lib/kpi-cards";
import { addToBasket } from "@/lib/report-basket";

const KPI_ICON: Record<KpiKey, typeof TrendingUp> = {
  noi: TrendingUp,
  ocupacao: Building2,
  vacancia: Layers,
  receita_contratada: Wallet,
  inadimplencia: AlertTriangle,
  walt: Clock,
  exposicao: Percent,
  a_vencer: CalendarClock,
  capex: Hammer,
  tir: Activity,
  contratos: FileText,
};

const TONE_CLS: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border-red-200",
  warning: "bg-amber-100 text-amber-700 border-amber-200",
  ok: "bg-emerald-100 text-emerald-700 border-emerald-200",
  neutral: "bg-muted text-muted-foreground border-border",
};

const DATA_BASE = new Date();

export default function ProprietarioMetricasKPIs() {
  const navigate = useNavigate();
  const { selectedFund } = useFund();

  const [filters, setFilters] = useState<KpiFilters>({
    portfolio: "all",
    fundo: "all",
    ativoId: "all",
    tipoAtivo: "all",
    from: "2026-01",
    to: CURRENT_COMPETENCIA,
  });
  const [openKpi, setOpenKpi] = useState<KpiKey | null>(null);

  const baseModel = useMemo(() => buildRelationalModel(filters.to), [filters.to]);
  const prevModel = useMemo(() => buildRelationalModel(prevCompetencia(filters.to)), [filters.to]);

  const model = useMemo(() => filterModel(baseModel, filters), [baseModel, filters]);
  const modelAnt = useMemo(() => filterModel(prevModel, filters), [prevModel, filters]);

  const agg = useMemo(() => aggregate(model), [model]);
  const aggAnt = useMemo(() => aggregate(modelAnt), [modelAnt]);
  const capex = useMemo(() => buildCapex(model), [model]);
  const capexAnt = useMemo(() => buildCapex(modelAnt), [modelAnt]);
  const tir = useMemo(() => buildTir(model), [model]);
  const tirAnt = useMemo(() => buildTir(modelAnt), [modelAnt]);
  const serie = useMemo(() => buildSerie(filters), [filters]);

  const cards = useMemo(
    () => buildKpiCards(agg, aggAnt, capex, capexAnt, tir, tirAnt),
    [agg, aggAnt, capex, capexAnt, tir, tirAnt],
  );

  const drill = useMemo(
    () => (openKpi ? buildDrillDown(openKpi, model, agg, capex, tir) : null),
    [openKpi, model, agg, capex, tir],
  );

  const fundoOptions = useMemo(() => {
    const tickers = [...new Set(baseModel.assets.map((a) => a.fundTicker))];
    return tickers;
  }, [baseModel]);

  const escopoLabel = useMemo(() => {
    const ativos = filters.ativoId === "all" ? `${model.assets.length} ativos` : model.assets[0]?.name ?? "—";
    return `${ativos} · ${competenciaLabel(filters.from)} → ${competenciaLabel(filters.to)}`;
  }, [filters, model]);

  const primary = cards.filter((c) => c.tier === "primary");
  const secondary = cards.filter((c) => c.tier === "secondary");

  const handleAddToReport = () => {
    if (!drill || !openKpi) return;
    addToBasket({
      kpi: openKpi,
      label: drill.title,
      escopo: escopoLabel,
      competencia: filters.to,
      resumo: drill.summary.map((s) => `${s.label}: ${s.value}`).join(" · "),
    });
    toast.success("Detalhamento adicionado ao relatório", {
      description: "Disponível em Relatórios de Locação → Seções do KPI.",
      action: { label: "Abrir relatórios", onClick: () => navigate("/proprietario/relatorios-locacao") },
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Métricas e KPIs</h1>
          <p className="text-sm text-muted-foreground">
            Indicadores derivados da estrutura Fundo → Portfólio → Ativo → Contrato → Locatário.
            {selectedFund ? ` Fundo em contexto: ${selectedFund.ticker}.` : ""}
          </p>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <div>Competência base: <span className="font-semibold text-foreground">{competenciaLabel(filters.to)}</span></div>
          <div>Dados atualizados em {fmtDateBR(DATA_BASE.toISOString())}</div>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3 text-sm font-medium text-foreground">
            <Filter className="w-4 h-4 text-primary" /> Filtros
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Portfólio</Label>
              <Select value={filters.portfolio} onValueChange={(v) => setFilters((f) => ({ ...f, portfolio: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PORTFOLIO_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Fundo</Label>
              <Select value={filters.fundo} onValueChange={(v) => setFilters((f) => ({ ...f, fundo: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os fundos</SelectItem>
                  {fundoOptions.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Ativo</Label>
              <Select value={filters.ativoId} onValueChange={(v) => setFilters((f) => ({ ...f, ativoId: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os ativos</SelectItem>
                  {baseModel.assets.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Tipo de ativo</Label>
              <Select value={filters.tipoAtivo} onValueChange={(v) => setFilters((f) => ({ ...f, tipoAtivo: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPO_ATIVO_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Período</Label>
              <div className="flex items-center gap-1 mt-1">
                <Select value={filters.from} onValueChange={(v) => setFilters((f) => ({ ...f, from: v > f.to ? f.to : v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COMPETENCIAS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                <Select value={filters.to} onValueChange={(v) => setFilters((f) => ({ ...f, to: v, from: v < f.from ? v : f.from }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COMPETENCIAS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            Escopo aplicado: {escopoLabel} · {model.contracts.filter((c) => !c.vacante).length} contratos · {model.tenants.length} locatários
          </div>
        </CardContent>
      </Card>

      {/* KPIs primários */}
      <div>
        <div className="text-sm font-semibold text-foreground mb-2">Indicadores operacionais e financeiros</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {primary.map((c) => {
            const Icon = KPI_ICON[c.key];
            const TrendIcon = c.direction === "up" ? TrendingUp : c.direction === "down" ? TrendingDown : Minus;
            return (
              <Card
                key={c.key}
                onClick={() => setOpenKpi(c.key)}
                className="cursor-pointer transition-shadow hover:shadow-md"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] text-muted-foreground">{c.label}</span>
                  </div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-foreground">{c.value}</span>
                    {c.unit && <span className="text-xs text-muted-foreground">{c.unit}</span>}
                  </div>
                  {c.sub && <div className="text-xs text-muted-foreground mt-0.5">{c.sub}</div>}
                  <div className={`mt-2 flex items-center gap-1 text-xs ${c.deltaLabel ? (c.positive ? "text-emerald-600" : "text-red-600") : "text-muted-foreground"}`}>
                    <TrendIcon className="w-3 h-3" />
                    {c.deltaLabel ?? "Sem variação apurada"}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-2 leading-snug">{c.description}</div>
                  <div className="text-[10px] text-muted-foreground mt-2">
                    Dados atualizados em {fmtDateBR(DATA_BASE.toISOString())}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* KPIs secundários */}
      <div>
        <div className="text-sm font-semibold text-foreground mb-2">Indicadores complementares</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {secondary.map((c) => {
            const Icon = KPI_ICON[c.key];
            const TrendIcon = c.direction === "up" ? TrendingUp : c.direction === "down" ? TrendingDown : Minus;
            return (
              <Card key={c.key} onClick={() => setOpenKpi(c.key)} className="cursor-pointer bg-muted/30 transition-shadow hover:shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Icon className="w-4 h-4 text-primary" /> {c.label}
                    </div>
                    <div className={`flex items-center gap-1 text-[11px] ${c.deltaLabel ? (c.positive ? "text-emerald-600" : "text-red-600") : "text-muted-foreground"}`}>
                      <TrendIcon className="w-3 h-3" />
                    </div>
                  </div>
                  <div className="mt-2 text-xl font-bold text-foreground">{c.value}</div>
                  {c.sub && <div className="text-[11px] text-muted-foreground">{c.sub}</div>}
                  <div className="text-[10px] text-muted-foreground mt-1">{c.description}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Evolução no período */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-foreground">Evolução no período</div>
            <Badge variant="outline" className="text-[10px]">
              {competenciaLabel(filters.from)} → {competenciaLabel(filters.to)}
            </Badge>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={serie} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="pct" tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                <YAxis yAxisId="brl" orientation="right" tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}mi`} />
                <Tooltip
                  formatter={(v: number, name) =>
                    name === "Receita contratada" || name === "NOI"
                      ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v)
                      : `${v}%`}
                />
                <Line yAxisId="pct" dataKey="ocupacao" name="Ocupação" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                <Line yAxisId="pct" dataKey="inadimplenciaPct" name="Inadimplência" stroke="#dc2626" strokeWidth={2} dot={false} />
                <Line yAxisId="brl" dataKey="receita" name="Receita contratada" stroke="#0ea5e9" strokeWidth={2} dot={false} />
                <Line yAxisId="brl" dataKey="noi" name="NOI" stroke="#16a34a" strokeWidth={2} strokeDasharray="4 3" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Drill-down */}
      <Sheet open={!!openKpi} onOpenChange={(o) => !o && setOpenKpi(null)}>
        <SheetContent side="center" className="overflow-y-auto">
          {drill && (
            <>
              <SheetHeader>
                <SheetTitle>{drill.title}</SheetTitle>
                <SheetDescription>{escopoLabel} · competência {competenciaLabel(filters.to)}</SheetDescription>
              </SheetHeader>

              <div className="mt-4 space-y-5">
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={handleAddToReport}>
                    <FilePlus2 className="w-4 h-4 mr-1" /> Adicionar ao relatório
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => navigate("/proprietario/portfolio")}>
                    <Building2 className="w-4 h-4 mr-1" /> Ver portfólio
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => navigate("/proprietario/contratos")}>
                    <FileText className="w-4 h-4 mr-1" /> Ver contratos
                  </Button>
                </div>

                {/* Resumo */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {drill.summary.map((s) => (
                    <div key={s.label} className="rounded-lg border p-3">
                      <div className="text-[11px] text-muted-foreground">{s.label}</div>
                      <div className="text-base font-semibold text-foreground mt-0.5">{s.value}</div>
                    </div>
                  ))}
                </div>

                {/* Distribuições */}
                {drill.distribuicoes.length > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {drill.distribuicoes.map((d) => (
                      <div key={d.title} className="rounded-lg border p-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                          <PieIcon className="w-4 h-4 text-primary" /> {d.title}
                        </div>
                        <div className="space-y-2">
                          {d.items.slice(0, 8).map((i) => (
                            <div key={i.label}>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-foreground truncate pr-2">{i.label}</span>
                                <span className="text-muted-foreground shrink-0">{i.value}</span>
                              </div>
                              <div className="h-1.5 rounded bg-muted mt-1">
                                <div className="h-1.5 rounded bg-primary" style={{ width: `${Math.min(100, i.pct)}%` }} />
                              </div>
                            </div>
                          ))}
                          {d.items.length === 0 && (
                            <div className="text-xs text-muted-foreground">Sem dados no escopo selecionado.</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tabela navegável */}
                <div className="rounded-lg border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {drill.columns.map((c) => <TableHead key={c} className="text-left">{c}</TableHead>)}
                        <TableHead className="text-left">Navegar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {drill.rows.slice(0, 40).map((r, idx) => (
                        <TableRow key={`${r.contractId ?? r.assetId ?? idx}`}>
                          {r.cells.map((cell, i) => (
                            <TableCell key={i} className="text-left text-xs">
                              {cell || (r.badge && i === r.cells.length - 1
                                ? <Badge variant="outline" className={TONE_CLS[r.badge.tone]}>{r.badge.label}</Badge>
                                : "—")}
                            </TableCell>
                          ))}
                          <TableCell className="text-left">
                            <div className="flex items-center gap-1">
                              {r.assetId && (
                                <Button size="icon" variant="ghost" className="min-h-9 min-w-9"
                                  aria-label="Ver ativo" onClick={() => navigate(`/proprietario/portfolio?ativo=${r.assetId}`)}>
                                  <Building2 className="w-4 h-4" />
                                </Button>
                              )}
                              {r.contractId && (
                                <Button size="icon" variant="ghost" className="min-h-9 min-w-9"
                                  aria-label="Ver contrato" onClick={() => navigate(`/proprietario/contratos?contrato=${r.contractId}`)}>
                                  <FileText className="w-4 h-4" />
                                </Button>
                              )}
                              {r.tenant && (
                                <Button size="icon" variant="ghost" className="min-h-9 min-w-9"
                                  aria-label="Ver locatário" onClick={() => navigate(`/proprietario/contratos?locatario=${encodeURIComponent(r.tenant!)}`)}>
                                  <Users className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {drill.rows.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={drill.columns.length + 1} className="text-left text-xs text-muted-foreground">
                            Nenhum registro no escopo selecionado.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  {drill.rows.length > 40 && (
                    <div className="p-2 text-[11px] text-muted-foreground">
                      Exibindo 40 de {drill.rows.length} registros.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
