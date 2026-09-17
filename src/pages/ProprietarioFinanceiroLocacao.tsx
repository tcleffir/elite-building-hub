import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, Legend, Cell,
} from "recharts";
import {
  FileSpreadsheet, Mail, Phone, AlertTriangle, TrendingUp, CircleDollarSign,
  Wallet, Percent, MessageSquarePlus, Send,
} from "lucide-react";
import { toast } from "sonner";
import { useFinance } from "@/contexts/FinanceContext";
import {
  buildFechamento, buildInadimplencia, calcIndiceInadimplencia,
  competenciasAte, compLabel, fmtBRL, fmtDateBR, COMPETENCIA_ATUAL,
  METODOLOGIA_LABEL, type EscopoFinanceiro, type FechamentoMes,
  type InadimplenciaRow, type MetodologiaInadimplencia, type StatusContato,
} from "@/lib/finance-core";
import { fundos, edificiosRec, contratosRec } from "@/lib/reconciliation-data";
import { exportExcel, TEMPLATE_PADRAO } from "@/lib/export-service";

const STATUS_CONTATO_META: Record<StatusContato, { label: string; cls: string }> = {
  nao_contatado: { label: "Não contatado", cls: "bg-slate-100 text-slate-700 border-slate-200" },
  contatado:     { label: "Contatado",     cls: "bg-sky-100 text-sky-700 border-sky-200" },
  prometeu:      { label: "Prometeu pagar", cls: "bg-amber-100 text-amber-700 border-amber-200" },
  acordo:        { label: "Acordo firmado", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
};

interface ContatoLog { id: string; data: string; canal: string; texto: string; }

export default function ProprietarioFinanceiroLocacao() {
  const { cobrancas, politica, metodologiaInad, setMetodologiaInad } = useFinance();

  const [fundoId, setFundoId] = useState("all");
  const [edificioId, setEdificioId] = useState("all");
  const [competencia, setCompetencia] = useState(COMPETENCIA_ATUAL);
  const [mesDetalhe, setMesDetalhe] = useState<FechamentoMes | null>(null);

  const escopo: EscopoFinanceiro = useMemo(() => ({ fundoId, edificioId }), [fundoId, edificioId]);
  const competencias = useMemo(() => competenciasAte(competencia, 12), [competencia]);
  const serie = useMemo(
    () => buildFechamento(cobrancas, escopo, competencias, politica),
    [cobrancas, escopo, competencias, politica],
  );
  const mesAtual = serie.find(s => s.competencia === competencia);

  const edificiosOpts = useMemo(
    () => fundoId === "all" ? edificiosRec : edificiosRec.filter(e => e.fundoId === fundoId),
    [fundoId],
  );
  const competenciaOpts = useMemo(() => competenciasAte(COMPETENCIA_ATUAL, 18), []);

  const inadRows = useMemo(
    () => buildInadimplencia(cobrancas, escopo, { pol: politica }),
    [cobrancas, escopo, politica],
  );
  const indice = useMemo(
    () => calcIndiceInadimplencia(inadRows, serie, metodologiaInad, competencia),
    [inadRows, serie, metodologiaInad, competencia],
  );

  const chartData = serie.map(m => ({
    competencia: m.competencia,
    label: m.label,
    Esperado: Math.round(m.esperado.total),
    Recebido: m.futuro ? null : Math.round(m.recebido.aluguel + m.recebido.iptu),
    futuro: m.futuro,
    ref: m,
  }));

  function exportarFechamento() {
    exportExcel({
      fileName: `fechamento-mensal-${competencia}`,
      sheets: [{
        ...TEMPLATE_PADRAO.fechamento,
        rows: serie.map(m => ({
          competencia: m.label,
          aluguelEsp: Math.round(m.esperado.aluguel),
          iptuEsp: Math.round(m.esperado.iptu),
          ajustes: Math.round(m.esperado.ajustes),
          esperado: Math.round(m.esperado.total),
          aluguelRec: Math.round(m.recebido.aluguel),
          iptuRec: Math.round(m.recebido.iptu),
          multa: Math.round(m.recebido.multa),
          juros: Math.round(m.recebido.juros),
          recebido: Math.round(m.recebido.total),
          aberto: Math.round(m.aberto),
          pct: Number(m.pctRecebido.toFixed(1)),
        })),
      }],
    });
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 py-1 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fechamento Mensal</h1>
          <p className="text-sm text-muted-foreground">
            Esperado (contratos) x Recebido (conciliação) por competência, com a inadimplência derivada da diferença vencida.
          </p>
        </div>
        <div className="grid w-full grid-cols-1 gap-2 min-[360px]:grid-cols-2 sm:flex sm:w-auto sm:flex-wrap">
          <Select value={fundoId} onValueChange={v => { setFundoId(v); setEdificioId("all"); }}>
            <SelectTrigger className="w-full sm:w-[190px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os fundos</SelectItem>
              {fundos.map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={edificioId} onValueChange={setEdificioId}>
            <SelectTrigger className="w-full sm:w-[190px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os ativos</SelectItem>
              {edificiosOpts.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={competencia} onValueChange={setCompetencia}>
            <SelectTrigger className="w-full sm:w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {competenciaOpts.slice().reverse().map(c => (
                <SelectItem key={c} value={c}>{compLabel(c)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="esperado" className="space-y-4">
        <TabsList>
          <TabsTrigger value="esperado">Esperado x Realizado</TabsTrigger>
          <TabsTrigger value="inadimplencia">Inadimplência</TabsTrigger>
        </TabsList>

        {/* ---------------- Esperado x Realizado ---------------- */}
        <TabsContent value="esperado" className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Esperado", valor: fmtBRL(mesAtual?.esperado.total ?? 0), icon: CircleDollarSign, cls: "text-foreground" },
              { label: "Recebido", valor: fmtBRL((mesAtual?.recebido.aluguel ?? 0) + (mesAtual?.recebido.iptu ?? 0)), icon: Wallet, cls: "text-emerald-600" },
              { label: "Em aberto", valor: fmtBRL(mesAtual?.aberto ?? 0), icon: AlertTriangle, cls: "text-rose-600" },
              { label: "% recebido", valor: `${(mesAtual?.pctRecebido ?? 0).toFixed(1)}%`, icon: Percent, cls: "text-primary" },
            ].map(k => {
              const Icon = k.icon;
              return (
                <Card key={k.label}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">{k.label}</div>
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className={`text-lg font-bold mt-1 ${k.cls}`}>{k.valor}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{compLabel(competencia)}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Esperado x Recebido — últimos 12 meses
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Clique em uma competência para ver o detalhamento (aluguel, IPTU, multa, juros, ajustes).
              </p>
            </CardHeader>
            <CardContent className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
                  onClick={(e: any) => {
                    const p = e?.activePayload?.[0]?.payload;
                    if (p?.ref) setMesDetalhe(p.ref);
                  }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} />
                  <RTooltip
                    formatter={(v: any, n: any) => [v == null ? "—" : fmtBRL(Number(v)), n]}
                    labelFormatter={(l) => `Competência ${l}`}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Esperado" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} cursor="pointer" />
                  <Bar dataKey="Recebido" radius={[4, 4, 0, 0]} cursor="pointer">
                    {chartData.map((d, i) => (
                      <Cell key={i} fill={d.futuro ? "transparent" : "hsl(var(--primary))"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 flex-row items-center justify-between">
              <CardTitle className="text-base">Série por competência</CardTitle>
              <Button variant="outline" size="sm" onClick={exportarFechamento}>
                <FileSpreadsheet className="w-4 h-4 mr-1.5" /> Exportar Excel
              </Button>
            </CardHeader>
            <CardContent className="p-3 sm:p-0">
              <div className="hidden sm:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="text-left py-2 px-3 font-medium">Competência</th>
                      <th className="text-left py-2 px-3 font-medium">Esperado</th>
                      <th className="text-left py-2 px-3 font-medium">Recebido</th>
                      <th className="text-left py-2 px-3 font-medium">Em aberto</th>
                      <th className="text-left py-2 px-3 font-medium">% recebido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serie.slice().reverse().map(m => (
                      <tr key={m.competencia}
                        className="border-b last:border-0 hover:bg-muted/40 cursor-pointer"
                        onClick={() => setMesDetalhe(m)}>
                        <td className="py-2.5 px-3 font-medium">
                          {m.label}
                          {m.futuro && <span className="ml-2 text-[11px] text-muted-foreground">(projetado)</span>}
                        </td>
                        <td className="py-2.5 px-3">{fmtBRL(m.esperado.total)}</td>
                        <td className="py-2.5 px-3 text-emerald-600">
                          {m.futuro ? "—" : fmtBRL(m.recebido.aluguel + m.recebido.iptu)}
                        </td>
                        <td className="py-2.5 px-3 text-rose-600">{m.futuro ? "—" : fmtBRL(m.aberto)}</td>
                        <td className="py-2.5 px-3">{m.futuro ? "—" : `${m.pctRecebido.toFixed(1)}%`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="space-y-2 sm:hidden">
                {serie.slice().reverse().map(m => (
                  <button key={m.competencia} onClick={() => setMesDetalhe(m)} className="w-full rounded-md border p-3 text-left active:bg-muted/50">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{m.label}</span>
                      <span className="text-sm font-medium">{m.futuro ? "Projetado" : `${m.pctRecebido.toFixed(1)}% recebido`}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                      <div><span className="block text-muted-foreground">Esperado</span><strong>{fmtBRL(m.esperado.total)}</strong></div>
                      <div><span className="block text-muted-foreground">Recebido</span><strong className="text-emerald-600">{m.futuro ? "—" : fmtBRL(m.recebido.aluguel + m.recebido.iptu)}</strong></div>
                      <div className="col-span-2"><span className="block text-muted-foreground">Em aberto</span><strong className="text-rose-600">{m.futuro ? "—" : fmtBRL(m.aberto)}</strong></div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------- Inadimplência ---------------- */}
        <TabsContent value="inadimplencia">
          <InadimplenciaPanel
            rows={inadRows}
            indice={indice}
            metodologia={metodologiaInad}
            setMetodologia={setMetodologiaInad}
          />
        </TabsContent>
      </Tabs>

      {/* Detalhamento do mês */}
      <Sheet open={!!mesDetalhe} onOpenChange={o => !o && setMesDetalhe(null)}>
        <SheetContent side="center" className="w-full sm:max-w-lg">
          {mesDetalhe && (
            <>
              <SheetHeader>
                <SheetTitle>Detalhamento — {mesDetalhe.label}</SheetTitle>
              </SheetHeader>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="text-left py-2 font-medium">Linha</th>
                      <th className="text-left py-2 font-medium">Esperado</th>
                      <th className="text-left py-2 font-medium">Recebido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {([
                      ["Aluguel", mesDetalhe.esperado.aluguel, mesDetalhe.recebido.aluguel],
                      ["IPTU", mesDetalhe.esperado.iptu, mesDetalhe.recebido.iptu],
                      ["Multa", 0, mesDetalhe.recebido.multa],
                      ["Juros", 0, mesDetalhe.recebido.juros],
                      ["Ajustes", mesDetalhe.esperado.ajustes, 0],
                    ] as [string, number, number][]).map(([k, e, r]) => (
                      <tr key={k} className="border-b last:border-0">
                        <td className="py-2 font-medium">{k}</td>
                        <td className="py-2">{fmtBRL(e)}</td>
                        <td className="py-2">{mesDetalhe.futuro ? "—" : fmtBRL(r)}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 font-semibold">
                      <td className="py-2">Total</td>
                      <td className="py-2">{fmtBRL(mesDetalhe.esperado.total)}</td>
                      <td className="py-2">{mesDetalhe.futuro ? "—" : fmtBRL(mesDetalhe.recebido.total)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Em aberto</div>
                  <div className="font-semibold text-rose-600">{fmtBRL(mesDetalhe.aberto)}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">% recebido</div>
                  <div className="font-semibold">{mesDetalhe.pctRecebido.toFixed(1)}%</div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* ======================= Inadimplência ======================= */

function InadimplenciaPanel({ rows, indice, metodologia, setMetodologia }: {
  rows: InadimplenciaRow[];
  indice: { pct: number; numerador: number; denominador: number; descricao: string };
  metodologia: MetodologiaInadimplencia;
  setMetodologia: (m: MetodologiaInadimplencia) => void;
}) {
  const [sel, setSel] = useState<string[]>([]);
  const [detalhe, setDetalhe] = useState<InadimplenciaRow | null>(null);
  const [statusPorInquilino, setStatusPorInquilino] = useState<Record<string, StatusContato>>({});
  const [contatos, setContatos] = useState<Record<string, ContatoLog[]>>({});
  const [comentarios, setComentarios] = useState<Record<string, string>>({});
  const [novoComentario, setNovoComentario] = useState("");
  const [prazo, setPrazo] = useState<Record<string, string>>({});

  const totalAberto = rows.reduce((s, r) => s + r.valorAberto, 0);
  const totalDevido = rows.reduce((s, r) => s + r.totalDevido, 0);
  const statusDe = (r: InadimplenciaRow) => statusPorInquilino[r.inquilinoId] ?? "nao_contatado";
  const ultimoContato = (r: InadimplenciaRow) => (contatos[r.inquilinoId] ?? [])[0]?.data ?? null;

  const toggle = (id: string) => setSel(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleTodos = () => setSel(p => p.length === rows.length ? [] : rows.map(r => r.id));

  /** Monta o e-mail de UM único locatário — sem qualquer dado de terceiros. */
  function mailtoIndividual(r: InadimplenciaRow) {
    const assunto = `Cobrança de aluguel em aberto — ${compLabel(r.competencia)}`;
    const corpo = [
      `Prezado(a) ${r.inquilinoNome},`,
      ``,
      `Identificamos valor em aberto referente ao seu contrato de locação:`,
      ``,
      `Imóvel: ${r.edificioNome}${r.unidade ? ` — ${r.unidade}` : ""}`,
      `Competência: ${compLabel(r.competencia)}`,
      `Vencimento: ${fmtDateBR(r.dataVencimento)}`,
      `Dias em atraso: ${r.diasAtraso}`,
      `Valor em aberto: ${fmtBRL(r.valorAberto)}`,
      `Multa: ${fmtBRL(r.multa)}`,
      `Juros: ${fmtBRL(r.juros)}`,
      `Total devido: ${fmtBRL(r.totalDevido)}`,
      ``,
      `Caso o pagamento já tenha sido efetuado, favor desconsiderar e encaminhar o comprovante.`,
      ``,
      `Atenciosamente,`,
      `Patria Real Estate`,
    ].join("\n");
    return `mailto:${r.inquilinoEmail}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
  }

  function cobrarSelecionados() {
    if (sel.length === 0) { toast.error("Selecione pelo menos um inadimplente."); return; }
    const alvo = rows.filter(r => sel.includes(r.id));
    const hoje = new Date().toISOString().slice(0, 10);
    setStatusPorInquilino(prev => {
      const next = { ...prev };
      alvo.forEach(r => { if ((next[r.inquilinoId] ?? "nao_contatado") === "nao_contatado") next[r.inquilinoId] = "contatado"; });
      return next;
    });
    setContatos(prev => {
      const next = { ...prev };
      alvo.forEach(r => {
        next[r.inquilinoId] = [{
          id: `ct-${Date.now()}-${r.id}`, data: hoje, canal: "E-mail individual",
          texto: `Cobrança individual enviada — ${compLabel(r.competencia)}, ${fmtBRL(r.totalDevido)}.`,
        }, ...(next[r.inquilinoId] ?? [])];
      });
      return next;
    });

    // Um e-mail por locatário: cada destinatário recebe apenas os próprios dados.
    const comEmail = alvo.filter(r => !!r.inquilinoEmail);
    const semEmail = alvo.length - comEmail.length;
    comEmail.forEach((r, i) => {
      window.setTimeout(() => {
        const w = window.open(mailtoIndividual(r), "_blank");
        if (!w) window.location.href = mailtoIndividual(r);
      }, i * 700);
    });

    toast.success(
      `${comEmail.length} e-mail(s) individual(is) preparado(s) — um por locatário, sem cópia entre eles.`
      + (semEmail > 0 ? ` ${semEmail} locatário(s) sem e-mail cadastrado.` : ""),
    );
    setSel([]);
  }

  function exportar() {
    exportExcel({
      fileName: "inadimplencia",
      sheets: [{
        ...TEMPLATE_PADRAO.inadimplencia,
        rows: rows.map(r => ({
          edificio: r.edificioNome,
          locatario: r.inquilinoNome,
          unidade: r.unidade,
          competencia: compLabel(r.competencia),
          vencimento: fmtDateBR(r.dataVencimento),
          valorEsperado: Math.round(r.valorEsperado),
          valorRecebido: Math.round(r.valorRecebido),
          valorAberto: Math.round(r.valorAberto),
          dias: r.diasAtraso,
          multa: Math.round(r.multa),
          juros: Math.round(r.juros),
          total: Math.round(r.totalDevido),
          ultimoContato: ultimoContato(r) ? fmtDateBR(ultimoContato(r)!) : "—",
          status: STATUS_CONTATO_META[statusDe(r)].label,
        })),
      }],
    });
  }

  function addComentario(r: InadimplenciaRow) {
    if (!novoComentario.trim()) return;
    setComentarios(prev => ({ ...prev, [r.inquilinoId]: novoComentario.trim() }));
    setContatos(prev => ({
      ...prev,
      [r.inquilinoId]: [{
        id: `ct-${Date.now()}`, data: new Date().toISOString().slice(0, 10),
        canal: "Comentário interno", texto: novoComentario.trim(),
      }, ...(prev[r.inquilinoId] ?? [])],
    }));
    setNovoComentario("");
    toast.success("Comentário registrado.");
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Total em aberto (vencido)</div>
          <div className="text-lg font-bold text-rose-600 mt-1">{fmtBRL(totalAberto)}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Total devido com encargos</div>
          <div className="text-lg font-bold mt-1">{fmtBRL(totalDevido)}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Cobranças vencidas</div>
          <div className="text-lg font-bold mt-1">{rows.length}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Inadimplência (%)</div>
          <div className="text-lg font-bold text-amber-600 mt-1">{indice.pct.toFixed(1)}%</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">{indice.descricao}</div>
        </CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Metodologia do indicador</Label>
              <Select value={metodologia} onValueChange={v => setMetodologia(v as MetodologiaInadimplencia)}>
                <SelectTrigger className="w-[340px] h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(METODOLOGIA_LABEL).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={cobrarSelecionados} disabled={sel.length === 0}>
                <Send className="w-4 h-4 mr-1.5" /> Cobrar selecionados ({sel.length})
              </Button>
              <Button variant="outline" size="sm" onClick={exportar}>
                <FileSpreadsheet className="w-4 h-4 mr-1.5" /> Exportar Excel
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="py-2 px-2 w-8 text-left">
                    <Checkbox checked={rows.length > 0 && sel.length === rows.length} onCheckedChange={toggleTodos} />
                  </th>
                  <th className="text-left py-2 px-2 font-medium">Ativo</th>
                  <th className="text-left py-2 px-2 font-medium">Locatário</th>
                  <th className="text-left py-2 px-2 font-medium">Competência</th>
                  <th className="text-left py-2 px-2 font-medium">Vencimento</th>
                  <th className="text-left py-2 px-2 font-medium">Esperado</th>
                  <th className="text-left py-2 px-2 font-medium">Recebido</th>
                  <th className="text-left py-2 px-2 font-medium">Aberto</th>
                  <th className="text-left py-2 px-2 font-medium">Encargos</th>
                  <th className="text-left py-2 px-2 font-medium">Dias</th>
                  <th className="text-left py-2 px-2 font-medium">Último contato</th>
                  <th className="text-left py-2 px-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="py-2.5 px-2" onClick={e => e.stopPropagation()}>
                      <Checkbox checked={sel.includes(r.id)} onCheckedChange={() => toggle(r.id)} />
                    </td>
                    <td className="py-2.5 px-2 text-muted-foreground cursor-pointer" onClick={() => setDetalhe(r)}>{r.edificioNome}</td>
                    <td className="py-2.5 px-2 cursor-pointer" onClick={() => setDetalhe(r)}>
                      <div className="font-medium text-primary hover:underline">{r.inquilinoNome}</div>
                      <div className="text-[11px] text-muted-foreground">{r.unidade}</div>
                    </td>
                    <td className="py-2.5 px-2 cursor-pointer" onClick={() => setDetalhe(r)}>{compLabel(r.competencia)}</td>
                    <td className="py-2.5 px-2">{fmtDateBR(r.dataVencimento)}</td>
                    <td className="py-2.5 px-2">{fmtBRL(r.valorEsperado)}</td>
                    <td className="py-2.5 px-2">{fmtBRL(r.valorRecebido)}</td>
                    <td className="py-2.5 px-2 font-semibold text-rose-600">{fmtBRL(r.valorAberto)}</td>
                    <td className="py-2.5 px-2 text-muted-foreground">{fmtBRL(r.multa + r.juros)}</td>
                    <td className="py-2.5 px-2">{r.diasAtraso}</td>
                    <td className="py-2.5 px-2 text-muted-foreground">
                      {ultimoContato(r) ? fmtDateBR(ultimoContato(r)!) : "—"}
                    </td>
                    <td className="py-2.5 px-2">
                      <Badge variant="outline" className={STATUS_CONTATO_META[statusDe(r)].cls}>
                        {STATUS_CONTATO_META[statusDe(r)].label}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={12} className="py-8 text-center text-sm text-muted-foreground">
                    Nenhuma cobrança vencida em aberto no escopo selecionado.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detalhe do inadimplente */}
      <Sheet open={!!detalhe} onOpenChange={o => !o && setDetalhe(null)}>
        <SheetContent side="center" className="w-full sm:max-w-2xl">
          {detalhe && (
            <>
              <SheetHeader>
                <SheetTitle>{detalhe.inquilinoNome}</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  {[
                    ["Ativo", detalhe.edificioNome],
                    ["Unidade", detalhe.unidade],
                    ["Competência", compLabel(detalhe.competencia)],
                    ["Vencimento", fmtDateBR(detalhe.dataVencimento)],
                    ["Valor em aberto", fmtBRL(detalhe.valorAberto)],
                    ["Total devido", fmtBRL(detalhe.totalDevido)],
                    ["Multa", fmtBRL(detalhe.multa)],
                    ["Juros", fmtBRL(detalhe.juros)],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-lg border p-3">
                      <div className="text-xs text-muted-foreground">{k}</div>
                      <div className="font-medium mt-0.5">{v}</div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <a href={`mailto:${detalhe.inquilinoEmail}`}>
                      <Mail className="w-4 h-4 mr-1.5" /> {detalhe.inquilinoEmail}
                    </a>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <a href={`tel:${detalhe.inquilinoTelefone.replace(/\D/g, "")}`}>
                      <Phone className="w-4 h-4 mr-1.5" /> {detalhe.inquilinoTelefone}
                    </a>
                  </Button>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Status do contato</Label>
                    <Select value={statusDe(detalhe)}
                      onValueChange={v => setStatusPorInquilino(p => ({ ...p, [detalhe.inquilinoId]: v as StatusContato }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_CONTATO_META).map(([k, m]) => (
                          <SelectItem key={k} value={k}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Próximo prazo de pagamento</Label>
                    <Input type="date" value={prazo[detalhe.inquilinoId] ?? ""}
                      onChange={e => setPrazo(p => ({ ...p, [detalhe.inquilinoId]: e.target.value }))} />
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Comentário</Label>
                  <Textarea rows={2} value={novoComentario} onChange={e => setNovoComentario(e.target.value)}
                    placeholder="Registrar tratativa, acordo, contato…" />
                  <Button size="sm" className="mt-2" onClick={() => addComentario(detalhe)}>
                    <MessageSquarePlus className="w-4 h-4 mr-1.5" /> Registrar
                  </Button>
                  {comentarios[detalhe.inquilinoId] && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Última nota: {comentarios[detalhe.inquilinoId]}
                    </p>
                  )}
                </div>

                <div>
                  <div className="text-sm font-semibold mb-2">Linha do tempo de contatos</div>
                  <div className="space-y-2">
                    {(contatos[detalhe.inquilinoId] ?? []).map(c => (
                      <div key={c.id} className="rounded-lg border p-3 text-sm">
                        <div className="font-medium">{c.canal}</div>
                        <div className="text-xs text-muted-foreground">{fmtDateBR(c.data)}</div>
                        <div className="text-muted-foreground mt-1">{c.texto}</div>
                      </div>
                    ))}
                    {(contatos[detalhe.inquilinoId] ?? []).length === 0 && (
                      <p className="text-xs text-muted-foreground">Nenhum contato registrado ainda.</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
