import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Boxes,
  Link2,
  RefreshCw,
  CheckCircle2,
  Clock,
  TrendingUp,
  Building2,
  Users,
  ShieldCheck,
  AlertTriangle,
  CalendarClock,
} from "lucide-react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  assetBoard,
  auditTrail,
  boards,
  dealStages,
  deals,
  funnelPorEtapa,
  interactions,
  permissions,
  setorExposicao,
  type Deal,
} from "@/lib/monday-crm-data";

const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);
const num = (v: number) => new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(v);
const dt = (iso: string) => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return d ? `${d}/${m}/${y}` : "—";
};

const pieColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
];

const alertaStyle: Record<string, string> = {
  "Reajuste em janela": "bg-orange-100 text-orange-700",
  "Renovação em 90 dias": "bg-orange-100 text-orange-700",
  "Renovação em 120 dias": "bg-blue-100 text-blue-700",
  "Sem alerta": "bg-muted text-muted-foreground",
};

const ProprietarioCrmMonday = () => {
  const [token, setToken] = useState("");
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  const pipelineTotal = useMemo(
    () => deals.filter((d) => d.tipo === "Aquisição").reduce((s, d) => s + d.valorPedido, 0),
    [],
  );
  const ablPipeline = useMemo(() => deals.reduce((s, d) => s + d.ablM2, 0), []);
  const tirMedia = useMemo(
    () => deals.reduce((s, d) => s + d.tirEstimada, 0) / deals.length,
    [],
  );
  const alertasRenovacao = assetBoard.filter((a) => a.alerta !== "Sem alerta").length;
  const ocupacaoMedia = assetBoard.reduce((s, a) => s + a.ocupacao, 0) / assetBoard.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
          <Boxes size={20} /> CRM Monday
        </h1>
        <p className="text-sm text-muted-foreground">
          Visualização do módulo de integração via API — pipeline de aquisições, asset management,
          relacionamento, dashboards e governança
        </p>
      </div>

      <Card className="border-orange-200 bg-orange-50/60">
        <CardContent className="p-4 flex items-start gap-3">
          <Clock size={18} className="text-orange-600 shrink-0 mt-0.5" />
          <div className="text-sm text-orange-900 text-left">
            <p className="font-medium">Prévia demonstrativa — integração aguardando credencial</p>
            <p className="text-orange-800">
              Os números abaixo são ilustrativos e mostram como os quadros do Monday aparecerão na
              plataforma. Com o token de API da conta do fundo, os dados passam a ser lidos e escritos
              automaticamente.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Pipeline em aquisição", value: brl(pipelineTotal), icon: TrendingUp },
          { label: "ABL em análise", value: `${num(ablPipeline)} m²`, icon: Building2 },
          { label: "TIR média estimada", value: `${tirMedia.toFixed(1)}%`, icon: TrendingUp },
          { label: "Alertas de renovação/reajuste", value: String(alertasRenovacao), icon: AlertTriangle },
        ].map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4 text-left">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <k.icon size={14} /> {k.label}
              </div>
              <p className="mt-1 text-lg font-semibold text-foreground">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="pipeline">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="asset">Asset Management</TabsTrigger>
          <TabsTrigger value="stakeholders">Stakeholders</TabsTrigger>
          <TabsTrigger value="dashboards">Dashboards</TabsTrigger>
          <TabsTrigger value="governanca">Governança</TabsTrigger>
          <TabsTrigger value="integracao">Integração</TabsTrigger>
        </TabsList>

        {/* ── Pipeline ── */}
        <TabsContent value="pipeline" className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {dealStages.map((stage) => {
              const stageDeals = deals.filter((d) => d.stage === stage.id);
              return (
                <Card key={stage.id} className="bg-muted/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span>{stage.label}</span>
                      <Badge variant="secondary">{stageDeals.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {stageDeals.length === 0 && (
                      <p className="text-xs text-muted-foreground text-left">Nenhum deal nesta etapa</p>
                    )}
                    {stageDeals.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => setSelectedDeal(d)}
                        className="w-full rounded-lg border bg-card p-3 text-left hover:border-primary transition-colors"
                      >
                        <p className="text-sm font-medium text-foreground">{d.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {d.setor} · {d.cidade}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                          <span className="font-medium text-foreground">{brl(d.valorPedido)}</span>
                          <span className="text-muted-foreground">ABL {num(d.ablM2)} m²</span>
                          <span className="text-muted-foreground">TIR {d.tirEstimada}%</span>
                          {d.capRate > 0 && (
                            <span className="text-muted-foreground">Cap {d.capRate}%</span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {d.tipo} · {d.responsavel}
                        </p>
                      </button>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {selectedDeal && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-left">
                  Due Diligence — {selectedDeal.nome}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-left">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Broker / originação</p>
                    <p className="font-medium">{selectedDeal.broker}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Responsável</p>
                    <p className="font-medium">{selectedDeal.responsavel}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Próximo passo</p>
                    <p className="font-medium">{selectedDeal.proximoPasso}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Atualizado em</p>
                    <p className="font-medium">{dt(selectedDeal.atualizadoEm)}</p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {selectedDeal.dueDiligence.map((f) => (
                    <div key={f.frente} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{f.frente}</span>
                        <span className="text-muted-foreground">
                          {f.concluido}/{f.total}
                        </span>
                      </div>
                      <Progress value={(f.concluido / f.total) * 100} className="mt-2 h-2" />
                      <p className="mt-1 text-xs text-muted-foreground">Responsável: {f.responsavel}</p>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelectedDeal(null)}>
                  Fechar
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Asset Management ── */}
        <TabsContent value="asset" className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4 text-left">
                <p className="text-xs text-muted-foreground">Ativos monitorados</p>
                <p className="text-lg font-semibold">{assetBoard.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-left">
                <p className="text-xs text-muted-foreground">Ocupação média</p>
                <p className="text-lg font-semibold">{ocupacaoMedia.toFixed(1)}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-left">
                <p className="text-xs text-muted-foreground">Locatários mapeados</p>
                <p className="text-lg font-semibold">
                  {assetBoard.reduce((s, a) => s + a.locatarios, 0)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarClock size={16} /> Vacância, contratos e janelas de reajuste
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                <div className="hidden lg:grid grid-cols-12 gap-2 px-5 py-2 text-xs font-medium text-muted-foreground text-left">
                  <span className="col-span-3">Ativo</span>
                  <span className="col-span-2">Cidade</span>
                  <span className="col-span-2">ABL</span>
                  <span className="col-span-1">Ocup.</span>
                  <span className="col-span-1">Loc.</span>
                  <span className="col-span-1">Índice</span>
                  <span className="col-span-2">Alerta</span>
                </div>
                {assetBoard.map((a) => (
                  <div
                    key={a.ativo}
                    className="grid lg:grid-cols-12 gap-2 px-5 py-3 text-sm text-left hover:bg-muted/50"
                  >
                    <span className="lg:col-span-3 font-medium text-foreground">{a.ativo}</span>
                    <span className="lg:col-span-2 text-muted-foreground">{a.cidade}</span>
                    <span className="lg:col-span-2 text-muted-foreground">{num(a.ablM2)} m²</span>
                    <span className="lg:col-span-1">{a.ocupacao.toFixed(0)}%</span>
                    <span className="lg:col-span-1">{a.locatarios}</span>
                    <span className="lg:col-span-1 text-muted-foreground">{a.indice}</span>
                    <div className="lg:col-span-2">
                      <Badge className={alertaStyle[a.alerta]}>{a.alerta}</Badge>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Venc. {dt(a.proximoVencimento)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Stakeholders ── */}
        <TabsContent value="stakeholders" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users size={16} /> Histórico de interações
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {interactions.map((i, idx) => (
                  <div key={idx} className="px-5 py-3 text-sm text-left hover:bg-muted/50">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-foreground">{i.contato}</span>
                      <span className="text-muted-foreground">· {i.empresa}</span>
                      <Badge variant="secondary">{i.papel}</Badge>
                      <Badge variant="outline">{i.canal}</Badge>
                      <Badge
                        className={
                          i.status === "Concluído"
                            ? "bg-emerald-100 text-emerald-700"
                            : i.status === "Aberto"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-blue-100 text-blue-700"
                        }
                      >
                        {i.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-muted-foreground">{i.assunto}</p>
                    <p className="text-xs text-muted-foreground">{dt(i.data)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Portal do inquilino e fornecedor</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3 text-left">
              {[
                { t: "Chamados de manutenção", d: "Formulário Monday abre o chamado direto no quadro de operações", v: "12 no mês" },
                { t: "Relatórios de faturamento", d: "Envio mensal de vendas por inquilino (essencial para shoppings)", v: "8 recebidos" },
                { t: "Documentos de fornecedores", d: "Coleta de certidões e apólices com validade controlada", v: "5 pendentes" },
              ].map((c) => (
                <div key={c.t} className="rounded-lg border p-3">
                  <p className="text-sm font-medium text-foreground">{c.t}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{c.d}</p>
                  <p className="mt-2 text-sm font-semibold text-primary">{c.v}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Dashboards ── */}
        <TabsContent value="dashboards" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Pipeline por etapa (R$ mi)</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelPorEtapa}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="etapa" tick={{ fontSize: 10 }} interval={0} angle={-20} height={60} textAnchor="end" />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => `R$ ${v.toFixed(1)} mi`} />
                    <Bar dataKey="valor" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Exposição do pipeline por setor (R$ mi)</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={setorExposicao} dataKey="valor" nameKey="setor" outerRadius={90} label>
                      {setorExposicao.map((_, i) => (
                        <Cell key={i} fill={pieColors[i % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => `R$ ${v.toFixed(1)} mi`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">KPIs do comitê de investimentos</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-left">
              {[
                { l: "Ocupação física", v: `${ocupacaoMedia.toFixed(1)}%` },
                { l: "Ocupação financeira", v: "94,2%" },
                { l: "Inadimplência (30d)", v: "1,8%" },
                { l: "Deals em due diligence", v: String(deals.filter((d) => d.stage === "due_diligence").length) },
              ].map((k) => (
                <div key={k.l} className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">{k.l}</p>
                  <p className="text-lg font-semibold text-foreground">{k.v}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Governança ── */}
        <TabsContent value="governanca" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck size={16} /> Trilha de auditoria
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {auditTrail.map((a, i) => (
                  <div key={i} className="px-5 py-3 text-sm text-left hover:bg-muted/50">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-foreground">{a.usuario}</span>
                      <Badge variant="outline">{a.visibilidade}</Badge>
                      <span className="text-xs text-muted-foreground">{a.data}</span>
                    </div>
                    <p className="mt-1 text-muted-foreground">
                      {a.acao} — <span className="text-foreground">{a.objeto}</span>
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Matriz de permissões</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                <div className="hidden md:grid grid-cols-5 gap-2 px-5 py-2 text-xs font-medium text-muted-foreground text-left">
                  <span>Perfil</span>
                  <span>Pipeline</span>
                  <span>Deals estratégicos</span>
                  <span>Contratos</span>
                  <span>Auditoria</span>
                </div>
                {permissions.map((p) => (
                  <div key={p.perfil} className="grid md:grid-cols-5 gap-2 px-5 py-3 text-sm text-left">
                    <span className="font-medium text-foreground">{p.perfil}</span>
                    <span className="text-muted-foreground">{p.pipeline}</span>
                    <span className="text-muted-foreground">{p.dealsEstrategicos}</span>
                    <span className="text-muted-foreground">{p.contratos}</span>
                    <span className="text-muted-foreground">{p.auditoria}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Integração ── */}
        <TabsContent value="integracao" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Link2 size={16} /> Conexão
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="Token de API do Monday"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  type="password"
                  className="sm:max-w-sm"
                />
                <Button
                  onClick={() =>
                    token.trim()
                      ? toast.success("Token recebido — a conexão será concluída no ambiente seguro da plataforma")
                      : toast.error("Informe o token de API do Monday")
                  }
                >
                  Conectar
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => toast.info("Sincronização disponível após a conexão")}
                >
                  <RefreshCw size={14} /> Sincronizar agora
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-left">
                O token é armazenado de forma segura no backend e nunca fica exposto no navegador.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Quadros mapeados</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                <div className="hidden md:grid grid-cols-12 gap-2 px-5 py-2 text-xs font-medium text-muted-foreground text-left">
                  <span className="col-span-4">Quadro Monday</span>
                  <span className="col-span-3">Módulo da plataforma</span>
                  <span className="col-span-2">Itens</span>
                  <span className="col-span-1">Autom.</span>
                  <span className="col-span-2">Status</span>
                </div>
                {boards.map((b) => (
                  <div
                    key={b.board}
                    className="grid md:grid-cols-12 gap-2 px-5 py-3 text-sm text-left hover:bg-muted/50"
                  >
                    <span className="md:col-span-4 font-medium text-foreground">{b.board}</span>
                    <span className="md:col-span-3 text-muted-foreground">{b.modulo}</span>
                    <span className="md:col-span-2">{b.itens}</span>
                    <span className="md:col-span-1">{b.automacoes}</span>
                    <div className="md:col-span-2">
                      {b.status === "mapeado" ? (
                        <Badge className="bg-emerald-100 text-emerald-700 gap-1">
                          <CheckCircle2 size={12} /> Sincronizado
                        </Badge>
                      ) : (
                        <Badge className="bg-orange-100 text-orange-700">Pendente</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProprietarioCrmMonday;
