import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Award, ShieldCheck, Leaf, Zap, Download, ExternalLink, Mail, Calendar, AlertTriangle, CheckCircle2, Clock, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, BarChart, Bar, ComposedChart, ReferenceLine } from "recharts";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { mockESGData, mockLEEDCertData, mockMercadoLivreData, mockIRECData } from "@/lib/mock-data";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const fmtDate = (d: string | null) => d ? format(new Date(d), 'dd/MM/yyyy', { locale: ptBR }) : "—";
const fmtCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const fmtNumber = (v: number, decimals = 1) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(v);
const daysUntil = (d: string) => differenceInDays(new Date(d), new Date());

const DeadlineAlert = ({ label, date, icon }: { label: string; date: string; icon?: string }) => {
  const days = daysUntil(date);
  const variant = days < 15 ? "destructive" : undefined;
  const className = days >= 15 && days <= 45
    ? "bg-amber-50 border-amber-400 dark:bg-amber-950 dark:border-amber-600"
    : days > 45
    ? "bg-green-50 border-green-400 dark:bg-green-950 dark:border-green-600"
    : "";
  return (
    <Alert variant={variant} className={className}>
      <AlertDescription className="flex items-center justify-between text-sm">
        <span>{icon} {label} — {fmtDate(date)}</span>
        <Badge variant={days < 15 ? "destructive" : "secondary"} className="ml-2">
          {days <= 0 ? "Vencido" : `${days} dias`}
        </Badge>
      </AlertDescription>
    </Alert>
  );
};

const ESGCertificacao = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("esg");
  const [selectedMonth, setSelectedMonth] = useState(5); // index into metricas
  const [carbonStatus, setCarbonStatus] = useState(mockESGData.compensacaoCarbono.status);
  const [showCarbonDialog, setShowCarbonDialog] = useState(false);
  const [mlChartView, setMlChartView] = useState("tarifa");

  const esg = mockESGData;
  const leed = mockLEEDCertData;
  const ml = mockMercadoLivreData;
  const irec = mockIRECData;

  const currentMetric = esg.metricas[selectedMonth];
  const prevMetric = selectedMonth > 0 ? esg.metricas[selectedMonth - 1] : null;

  const delta = (curr: number, prev: number | undefined) => {
    if (prev === undefined || prev === 0) return null;
    const pct = ((curr - prev) / prev * 100);
    return pct;
  };

  // ─── I-REC exports ───
  const exportIRECXlsx = () => {
    const data = irec.certificados.map(c => ({
      ID: c.id, Período: c.periodo, MWh: c.mwh,
      Emissão: c.emissao ? fmtDate(c.emissao) : "—",
      Validade: c.validade ? fmtDate(c.validade) : "—",
      Custo: fmtCurrency(c.custo), Status: c.status === 'ativo' ? 'Ativo' : 'Pendente',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'I-REC');
    XLSX.writeFile(wb, 'IREC_Certificados.xlsx');
    toast.success("Planilha I-REC exportada com sucesso");
  };

  const exportIRECPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Relatório I-REC — Mar/2026", 14, 20);
    autoTable(doc, {
      startY: 30,
      head: [['ID', 'Período', 'MWh', 'Emissão', 'Validade', 'Custo', 'Status']],
      body: irec.certificados.map(c => [
        c.id, c.periodo, fmtNumber(c.mwh),
        c.emissao ? fmtDate(c.emissao) : "—",
        c.validade ? fmtDate(c.validade) : "—",
        fmtCurrency(c.custo),
        c.status === 'ativo' ? 'Ativo' : 'Pendente',
      ]),
    });
    const finalY = (doc as any).lastAutoTable?.finalY || 120;
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`Registrador: ${irec.resumo.registrador} · Padrão: ${irec.resumo.padrao}`, 14, finalY + 10);
    doc.save("IREC_Relatorio_Mar2026.pdf");
    toast.success("PDF I-REC gerado com sucesso");
  };

  // Mercado Livre totals
  const mlEconomiaTotal = ml.historico.reduce((s, h) => s + h.economia, 0);
  const mlLastMonth = ml.historico[ml.historico.length - 1];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/esg")}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Sustentabilidade & ESG</h1>
          <p className="text-sm text-muted-foreground">Certificações, métricas e energia renovável</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full overflow-x-auto flex-nowrap justify-start">
          <TabsTrigger value="esg" className="whitespace-nowrap gap-1"><Leaf size={14} /> ESG</TabsTrigger>
          <TabsTrigger value="leed" className="whitespace-nowrap gap-1"><Award size={14} /> LEED</TabsTrigger>
          <TabsTrigger value="mercado" className="whitespace-nowrap gap-1"><Zap size={14} /> Mercado Livre</TabsTrigger>
          <TabsTrigger value="irec" className="whitespace-nowrap gap-1"><ShieldCheck size={14} /> I-REC</TabsTrigger>
        </TabsList>

        {/* ═══════════════ ABA 1 — ESG ═══════════════ */}
        <TabsContent value="esg" className="mt-4 space-y-6">
          {/* Deadline alerts */}
          <div className="space-y-2">
            <DeadlineAlert icon="📋" label="Relatório ESG Anual vence em" date={esg.relatorioAnual.prazo} />
            <DeadlineAlert icon="🌱" label="Compensação de Carbono — prazo" date={esg.compensacaoCarbono.prazo} />
          </div>

          {/* Header + month selector */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">ESG Score</h2>
            <Select value={String(selectedMonth)} onValueChange={v => setSelectedMonth(Number(v))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {esg.metricas.map((m, i) => (
                  <SelectItem key={i} value={String(i)}>{m.mes}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Score chart + gauge */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3 bg-card rounded-2xl p-5 premium-shadow">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={esg.metricas}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="mes" fontSize={12} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis domain={[50, 100]} fontSize={12} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <RTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <ReferenceLine y={esg.score.meta} stroke="hsl(var(--destructive))" strokeDasharray="5 5" label={{ value: `Meta: ${esg.score.meta}`, fill: 'hsl(var(--destructive))', fontSize: 11 }} />
                  <Line type="monotone" dataKey="score" stroke="hsl(var(--interactive))" strokeWidth={2} dot={{ r: 4 }} name="Score ESG" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="lg:col-span-2 bg-card rounded-2xl p-6 premium-shadow text-center flex flex-col items-center justify-center">
              <p className="text-3xl font-bold text-foreground">{currentMetric.score}<span className="text-lg text-muted-foreground">/100</span></p>
              <Progress value={currentMetric.score} className="h-3 mt-3 mb-2" />
              <div className="flex justify-between w-full text-[10px] text-muted-foreground px-1">
                <span>50 Básico</span><span>60 Bronze</span><span>70 Prata</span><span>80 Ouro</span>
              </div>
              <p className="text-sm text-muted-foreground mt-3">Meta: {esg.score.meta} — Faltam {esg.score.meta - currentMetric.score} pontos</p>
            </div>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {([
              { key: 'carbono', label: 'Carbono', unit: 'tCO₂e', icon: '🌍', lower: true },
              { key: 'energia', label: 'Energia', unit: 'MWh', icon: '⚡', lower: true },
              { key: 'agua', label: 'Água', unit: 'm³', icon: '💧', lower: true },
              { key: 'residuos', label: 'Resíduos', unit: 't', icon: '♻️', lower: true },
            ] as const).map(item => {
              const curr = currentMetric[item.key];
              const prev = prevMetric ? prevMetric[item.key] : undefined;
              const d = delta(curr, prev);
              const improving = d !== null && ((item.lower && d < 0) || (!item.lower && d > 0));
              return (
                <div key={item.key} className="bg-card rounded-2xl p-4 premium-shadow">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-lg">{item.icon}</span>
                    {d !== null && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${improving ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {d > 0 ? '↑' : '↓'} {Math.abs(d).toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <p className="text-xl font-bold text-foreground">{fmtNumber(curr)}</p>
                  <p className="text-xs text-muted-foreground">{item.label} ({item.unit})</p>
                </div>
              );
            })}
          </div>

          {/* Category breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {esg.categorias.map(cat => {
              const pct = (cat.pontos / cat.meta) * 100;
              const color = pct >= 100 ? 'bg-green-600' : pct >= 70 ? 'bg-amber-500' : 'bg-red-500';
              return (
                <div key={cat.nome} className="bg-card rounded-xl p-3 premium-shadow">
                  <p className="text-xs font-medium text-muted-foreground mb-1">{cat.nome}</p>
                  <p className="text-sm font-bold text-foreground">{cat.pontos}/{cat.meta} pts</p>
                  <div className="h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Carbon compensation */}
          <div className="bg-card rounded-2xl p-5 premium-shadow border border-border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-foreground">🌱 Compensação de Carbono</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {fmtNumber(esg.compensacaoCarbono.toneladas)} tCO₂e · {fmtCurrency(esg.compensacaoCarbono.custo)} · {esg.compensacaoCarbono.fornecedor}
                </p>
              </div>
              {carbonStatus === 'pendente' && (
                <div className="flex items-center gap-3">
                  <Badge variant="destructive">Não Neutralizado</Badge>
                  <Button size="sm" onClick={() => setShowCarbonDialog(true)}>Solicitar Compensação</Button>
                </div>
              )}
              {carbonStatus === 'solicitada' && (
                <Badge className="bg-amber-100 text-amber-700 border-0">Solicitação Enviada — Aguardando confirmação</Badge>
              )}
              {carbonStatus === 'concluida' && (
                <Badge className="bg-green-100 text-green-700 border-0">Operação Neutra ✓</Badge>
              )}
            </div>
          </div>

          <Dialog open={showCarbonDialog} onOpenChange={setShowCarbonDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Solicitar Compensação de Carbono</DialogTitle>
                <DialogDescription>Confirme os dados da compensação</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Emissões</span><span className="font-semibold">{fmtNumber(esg.compensacaoCarbono.toneladas)} tCO₂e</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Custo</span><span className="font-semibold">{fmtCurrency(esg.compensacaoCarbono.custo)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Fornecedor</span><span className="font-semibold">{esg.compensacaoCarbono.fornecedor}</span></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCarbonDialog(false)}>Cancelar</Button>
                <Button onClick={() => { setCarbonStatus('solicitada'); setShowCarbonDialog(false); toast.success("Solicitação enviada para ClimaFund Brasil"); }}>Confirmar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ═══════════════ ABA 2 — LEED ═══════════════ */}
        <TabsContent value="leed" className="mt-4 space-y-6">
          {/* Deadline alerts */}
          <div className="space-y-2">
            <DeadlineAlert icon="📅" label="Reunião Assessoria" date={leed.certificacao.assessoria.reuniaoProxima} />
            <DeadlineAlert icon="📋" label="Submissão GBCI" date={leed.certificacao.prazoSubmissao} />
            <DeadlineAlert icon="🔍" label="Auditoria Prevista" date={leed.certificacao.prazoAuditoria} />
          </div>

          {/* Hero card */}
          <div className="bg-card rounded-2xl p-6 premium-shadow">
            <div className="flex items-center gap-3 mb-4">
              <Trophy size={28} className="text-amber-500" />
              <div>
                <h2 className="text-lg font-bold text-foreground">LEED {leed.certificacao.nivel} · Em Processo</h2>
                <p className="text-sm text-muted-foreground">Pontuação: {leed.certificacao.pontuacaoAtual}/{leed.certificacao.pontuacaoMaxima}</p>
              </div>
            </div>
            <div className="relative">
              <Progress value={(leed.certificacao.pontuacaoAtual / leed.certificacao.pontuacaoMaxima) * 100} className="h-4" />
              {/* Meta marker */}
              <div
                className="absolute top-0 h-4 w-0.5 bg-destructive"
                style={{ left: `${(leed.certificacao.pontuacaoMeta / leed.certificacao.pontuacaoMaxima) * 100}%` }}
                title={`Meta: ${leed.certificacao.pontuacaoMeta}`}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>GOLD (60 pts): ✓ Superado</span>
              <span>Para PLATINUM (80 pts): faltam {leed.certificacao.pontuacaoMeta - leed.certificacao.pontuacaoAtual} pontos</span>
            </div>
            <div className="mt-4 p-3 bg-muted/50 rounded-xl">
              <p className="text-xs text-muted-foreground mb-1">Assessoria</p>
              <p className="text-sm font-semibold text-foreground">{leed.certificacao.assessoria.empresa} — {leed.certificacao.assessoria.contato}</p>
              <p className="text-xs text-muted-foreground">{leed.certificacao.assessoria.email} · {leed.certificacao.assessoria.telefone}</p>
              <Button variant="outline" size="sm" className="mt-2 gap-1" onClick={() => window.open(`mailto:${leed.certificacao.assessoria.email}?subject=Agendar Reunião LEED`, '_blank')}>
                <Calendar size={12} /> Agendar Reunião
              </Button>
            </div>
          </div>

          {/* Category accordion */}
          <div className="bg-card rounded-2xl p-5 premium-shadow">
            <h3 className="text-base font-semibold text-foreground mb-4">Progresso por Categoria</h3>
            <Accordion type="multiple" className="space-y-2">
              {leed.categorias.map(cat => (
                <AccordionItem key={cat.codigo} value={cat.codigo} className="border rounded-xl px-4">
                  <AccordionTrigger className="text-sm">
                    <div className="flex items-center gap-3 flex-1">
                      <Badge variant="outline" className="font-mono text-xs">{cat.codigo}</Badge>
                      <span>{cat.nome}</span>
                      <span className="ml-auto mr-4 text-xs font-bold text-muted-foreground">{cat.pontos}/{cat.maximo}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Progress value={(cat.pontos / cat.maximo) * 100} className="h-2 mb-2" />
                    {cat.pontos < cat.maximo && (
                      <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">Em andamento — faltam {cat.maximo - cat.pontos} pts</Badge>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Actions table */}
          <div className="bg-card rounded-2xl p-5 premium-shadow">
            <h3 className="text-base font-semibold text-foreground mb-4">Ações Pendentes</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-2 font-medium">Categoria</th>
                    <th className="text-left py-2 font-medium">Ação</th>
                    <th className="text-left py-2 font-medium">Prazo</th>
                    <th className="text-left py-2 font-medium">Impacto</th>
                    <th className="text-left py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[...leed.acoesPendentes].sort((a, b) => {
                    const order = { atrasado: 0, em_andamento: 1, pendente: 2 };
                    return (order[a.status as keyof typeof order] ?? 2) - (order[b.status as keyof typeof order] ?? 2) || new Date(a.prazo).getTime() - new Date(b.prazo).getTime();
                  }).map((a, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-3"><Badge variant="outline" className="font-mono text-xs">{a.categoria}</Badge></td>
                      <td className="py-3 text-foreground">{a.acao}</td>
                      <td className="py-3">{fmtDate(a.prazo)}</td>
                      <td className="py-3 font-semibold text-green-700">+{a.impacto} pts</td>
                      <td className="py-3">
                        <Badge className={
                          a.status === 'atrasado' ? 'bg-red-100 text-red-700 border-0' :
                          a.status === 'em_andamento' ? 'bg-amber-100 text-amber-700 border-0' :
                          'bg-muted text-muted-foreground border-0'
                        }>
                          {a.status === 'atrasado' ? 'Atrasado' : a.status === 'em_andamento' ? 'Em Andamento' : 'Pendente'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Deadlines footer */}
          <div className="bg-card rounded-2xl p-5 premium-shadow">
            <h3 className="text-sm font-semibold text-foreground mb-3">Prazos</h3>
            <div className="space-y-2 text-sm">
              {[
                { label: 'Submissão GBCI', date: leed.certificacao.prazoSubmissao },
                { label: 'Auditoria', date: leed.certificacao.prazoAuditoria },
                { label: 'Próxima Reunião', date: leed.certificacao.assessoria.reuniaoProxima },
              ].map(item => {
                const days = daysUntil(item.date);
                return (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-foreground">{fmtDate(item.date)}</span>
                      <Badge variant={days < 15 ? "destructive" : "secondary"}>{days} dias</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* ═══════════════ ABA 3 — MERCADO LIVRE ═══════════════ */}
        <TabsContent value="mercado" className="mt-4 space-y-6">
          {/* Deadline alerts */}
          <div className="space-y-2">
            <DeadlineAlert icon="📝" label="Decisão de renovação" date={ml.contrato.renovacaoPrazo} />
            <DeadlineAlert icon="📄" label="Vencimento do contrato" date={ml.contrato.dataFim} />
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-card rounded-2xl p-4 premium-shadow">
              <p className="text-xs text-muted-foreground">Economia Acumulada</p>
              <p className="text-xl font-bold text-green-700">{fmtCurrency(mlEconomiaTotal)}</p>
              <p className="text-xs text-muted-foreground">6 meses</p>
            </div>
            <div className="bg-card rounded-2xl p-4 premium-shadow">
              <p className="text-xs text-muted-foreground">Economia Mar/26</p>
              <p className="text-xl font-bold text-green-700">{fmtCurrency(mlLastMonth.economia)}</p>
            </div>
            <div className="bg-card rounded-2xl p-4 premium-shadow">
              <p className="text-xs text-muted-foreground">Consumo Mar/26</p>
              <p className="text-xl font-bold text-foreground">{fmtNumber(mlLastMonth.consumo)} MWh</p>
              <p className="text-xs text-muted-foreground">Contratado: {ml.contrato.volumeContratado} — {Math.round(mlLastMonth.consumo / ml.contrato.volumeContratado * 100)}%</p>
            </div>
            <div className="bg-card rounded-2xl p-4 premium-shadow">
              <p className="text-xs text-muted-foreground">Dias p/ Vencimento</p>
              {(() => {
                const days = daysUntil(ml.contrato.dataFim);
                return (
                  <>
                    <p className="text-xl font-bold text-foreground">{days}</p>
                    <Badge variant={days < 120 ? "destructive" : days < 180 ? "secondary" : "outline"}>{days < 120 ? 'Urgente' : days < 180 ? 'Atenção' : 'OK'}</Badge>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Contract details */}
          <div className="bg-card rounded-2xl p-5 premium-shadow">
            <h3 className="text-base font-semibold text-foreground mb-4">Detalhes do Contrato</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><p className="text-xs text-muted-foreground">Número</p><p className="font-semibold">{ml.contrato.numero}</p></div>
              <div><p className="text-xs text-muted-foreground">Comercializadora</p><p className="font-semibold">{ml.contrato.comercializadora}</p></div>
              <div><p className="text-xs text-muted-foreground">Fonte</p><p className="font-semibold">{ml.contrato.fonte}</p></div>
              <div><p className="text-xs text-muted-foreground">Preço</p><p className="font-semibold">{fmtCurrency(ml.contrato.precoMwh)}/MWh</p></div>
              <div><p className="text-xs text-muted-foreground">Contato</p><p className="font-semibold">{ml.contrato.contato}</p></div>
              <div><p className="text-xs text-muted-foreground">E-mail</p><p className="font-semibold">{ml.contrato.email}</p></div>
              <div><p className="text-xs text-muted-foreground">Telefone</p><p className="font-semibold">{ml.contrato.telefone}</p></div>
              <div><p className="text-xs text-muted-foreground">Volume</p><p className="font-semibold">{ml.contrato.volumeContratado} MWh/mês</p></div>
            </div>
            <Button variant="outline" size="sm" className="mt-4 gap-1" onClick={() => window.open(`mailto:${ml.contrato.email}?subject=Contrato ${ml.contrato.numero} – Renovação`, '_blank')}>
              <Mail size={12} /> Entrar em contato
            </Button>
          </div>

          {/* Chart */}
          <div className="bg-card rounded-2xl p-5 premium-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-foreground">Histórico</h3>
              <ToggleGroup type="single" value={mlChartView} onValueChange={v => v && setMlChartView(v)} size="sm">
                <ToggleGroupItem value="tarifa">Tarifa (R$/MWh)</ToggleGroupItem>
                <ToggleGroupItem value="consumo">Consumo (MWh)</ToggleGroupItem>
                <ToggleGroupItem value="economia">Economia (R$)</ToggleGroupItem>
              </ToggleGroup>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              {mlChartView === 'tarifa' ? (
                <BarChart data={ml.historico}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="mes" fontSize={12} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis fontSize={12} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <RTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(v: number) => fmtCurrency(v)} />
                  <Bar dataKey="tarifaCativa" fill="hsl(var(--muted-foreground))" name="Tarifa Cativa" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="tarifaML" fill="hsl(var(--success))" name="Tarifa ML" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : mlChartView === 'consumo' ? (
                <ComposedChart data={ml.historico}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="mes" fontSize={12} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis fontSize={12} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <RTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Bar dataKey="consumo" fill="hsl(var(--interactive))" name="Consumo (MWh)" radius={[4, 4, 0, 0]} />
                  <ReferenceLine y={ml.contrato.volumeContratado} stroke="hsl(var(--destructive))" strokeDasharray="5 5" label={{ value: `Contratado: ${ml.contrato.volumeContratado}`, fill: 'hsl(var(--destructive))', fontSize: 11 }} />
                </ComposedChart>
              ) : (
                <BarChart data={ml.historico}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="mes" fontSize={12} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis fontSize={12} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <RTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(v: number) => fmtCurrency(v)} />
                  <Bar dataKey="economia" fill="hsl(var(--success))" name="Economia (R$)" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Reports */}
          <div className="bg-card rounded-2xl p-5 premium-shadow">
            <h3 className="text-base font-semibold text-foreground mb-4">Relatórios Lux Energia</h3>
            <div className="space-y-2">
              {ml.relatorios.map((r, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <span className="text-sm font-medium text-foreground">{r.mes}</span>
                  {r.publicado ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Publicado em {fmtDate(r.publicado)}</span>
                      <Button variant="outline" size="sm" className="gap-1" onClick={() => toast.success("PDF baixado")}>
                        <Download size={12} /> PDF
                      </Button>
                    </div>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-700 border-0">⏳ Aguardando publicação</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ═══════════════ ABA 4 — I-REC ═══════════════ */}
        <TabsContent value="irec" className="mt-4 space-y-6">
          {/* Deadline alerts */}
          <div className="space-y-2">
            <DeadlineAlert icon="📅" label="Próxima emissão I-REC" date={irec.proximaEmissao.data} />
            <DeadlineAlert icon="📋" label="Validade máxima I-REC" date={irec.validade.dataExpiracao} />
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-card rounded-2xl p-4 premium-shadow">
              <p className="text-xs text-muted-foreground">Total I-REC</p>
              <p className="text-xl font-bold text-foreground">{fmtNumber(irec.resumo.totalMwh)} MWh</p>
              <p className="text-xs text-muted-foreground">{irec.resumo.periodoInicio}–{irec.resumo.periodoFim}</p>
              <Badge className="bg-green-100 text-green-700 border-0 mt-1">● Ativo</Badge>
            </div>
            <div className="bg-card rounded-2xl p-4 premium-shadow">
              <p className="text-xs text-muted-foreground">Custo Total</p>
              <p className="text-xl font-bold text-foreground">{fmtCurrency(irec.resumo.custoTotal)}</p>
              <p className="text-xs text-muted-foreground">{fmtCurrency(irec.resumo.custoMwh)}/MWh</p>
            </div>
            <div className="bg-card rounded-2xl p-4 premium-shadow">
              <p className="text-xs text-muted-foreground">Próxima Emissão</p>
              <p className="text-xl font-bold text-foreground">{fmtDate(irec.proximaEmissao.data)}</p>
              <p className="text-xs text-muted-foreground">{daysUntil(irec.proximaEmissao.data)} dias</p>
              <Badge className="bg-green-100 text-green-700 border-0 mt-1">Agendada ✓</Badge>
            </div>
            <div className="bg-card rounded-2xl p-4 premium-shadow">
              <p className="text-xs text-muted-foreground">Validade</p>
              <p className="text-xl font-bold text-foreground">até {fmtDate(irec.validade.dataExpiracao)}</p>
              <p className="text-xs text-muted-foreground">{daysUntil(irec.validade.dataExpiracao)} dias</p>
            </div>
          </div>

          {/* LEED link */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-card rounded-2xl p-5 premium-shadow border-2 border-blue-200 dark:border-blue-800 cursor-pointer" onClick={() => setActiveTab('leed')}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Trophy size={16} className="text-amber-500" /> {irec.linkLEED.credito}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        I-REC cobrem {irec.linkLEED.cobertura} — contribuem com {irec.linkLEED.pontos} pontos EA
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="gap-1">
                      <ExternalLink size={12} /> Ver na aba LEED
                    </Button>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>98% do Scope 2 coberto = 3/5 pontos EA</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Certificates table */}
          <div className="bg-card rounded-2xl p-5 premium-shadow">
            <h3 className="text-base font-semibold text-foreground mb-4">Certificados I-REC</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-2 font-medium">ID</th>
                    <th className="text-left py-2 font-medium">Período</th>
                    <th className="text-right py-2 font-medium">MWh</th>
                    <th className="text-left py-2 font-medium">Emissão</th>
                    <th className="text-left py-2 font-medium">Validade</th>
                    <th className="text-right py-2 font-medium">Custo</th>
                    <th className="text-left py-2 font-medium">Status</th>
                    <th className="text-center py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {irec.certificados.map(cert => {
                    const validityDays = cert.validade ? daysUntil(cert.validade) : null;
                    return (
                      <tr key={cert.id} className="border-b border-border/50">
                        <td className="py-3 font-mono text-xs">{cert.id}</td>
                        <td className="py-3">{cert.periodo}</td>
                        <td className="py-3 text-right font-semibold">{fmtNumber(cert.mwh)}</td>
                        <td className="py-3">{fmtDate(cert.emissao)}</td>
                        <td className="py-3">
                          {cert.validade ? (
                            <span className="flex items-center gap-1">
                              {fmtDate(cert.validade)}
                              <Badge className={
                                validityDays! > 180 ? 'bg-green-100 text-green-700 border-0 text-[10px]' :
                                validityDays! > 90 ? 'bg-amber-100 text-amber-700 border-0 text-[10px]' :
                                'bg-red-100 text-red-700 border-0 text-[10px]'
                              }>
                                {validityDays} d
                              </Badge>
                            </span>
                          ) : "—"}
                        </td>
                        <td className="py-3 text-right">{fmtCurrency(cert.custo)}</td>
                        <td className="py-3">
                          <Badge className={cert.status === 'ativo' ? 'bg-green-100 text-green-700 border-0' : 'bg-amber-100 text-amber-700 border-0'}>
                            {cert.status === 'ativo' ? 'Ativo' : 'Pendente'}
                          </Badge>
                        </td>
                        <td className="py-3 text-center">
                          {cert.status === 'ativo' && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toast.success("Certificado I-REC baixado")}>
                              <Download size={14} />
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
              Total: {fmtNumber(irec.resumo.totalMwh)} MWh · {fmtCurrency(irec.resumo.custoTotal)} · Registrador: {irec.resumo.registrador} · {irec.resumo.padrao}
            </p>
          </div>

          {/* Chart */}
          <div className="bg-card rounded-2xl p-5 premium-shadow">
            <h3 className="text-base font-semibold text-foreground mb-4">I-REC por Mês</h3>
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={irec.certificados.filter(c => c.emissao)}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="periodo" fontSize={12} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis yAxisId="mwh" fontSize={12} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis yAxisId="custo" orientation="right" fontSize={12} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <RTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Bar yAxisId="mwh" dataKey="mwh" fill="hsl(var(--interactive))" name="MWh" radius={[4, 4, 0, 0]} />
                <Line yAxisId="custo" type="monotone" dataKey="custo" stroke="hsl(var(--operational))" strokeWidth={2} name="Custo (R$)" dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Export buttons */}
          <div className="flex gap-3">
            <Button variant="outline" size="sm" className="gap-1" onClick={exportIRECXlsx}>
              <Download size={14} /> Exportar XLSX
            </Button>
            <Button variant="outline" size="sm" className="gap-1" onClick={exportIRECPdf}>
              <Download size={14} /> PDF Consolidado
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ESGCertificacao;
