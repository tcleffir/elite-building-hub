import { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  BarChart, Bar, Line, ComposedChart, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Upload, FileSpreadsheet, Plus, Download, TrendingUp, Wallet, CircleDollarSign, Percent,
} from "lucide-react";
import { toast } from "sonner";
import { useFinance } from "@/contexts/FinanceContext";
import {
  buildFechamento, receitaImobiliariaDoMes, competenciasAte, compLabel,
  fmtBRL, fmtDateBR, COMPETENCIA_ATUAL, type EscopoFinanceiro,
} from "@/lib/finance-core";
import {
  statusDespesa, STATUS_DESPESA_META, novoIdDespesa,
  TEMPLATE_DESPESAS_COLUNAS, type DespesaRec,
} from "@/lib/expenses-data";
import { fundos, edificiosRec } from "@/lib/reconciliation-data";
import { exportExcel, TEMPLATE_PADRAO } from "@/lib/export-service";

export default function ProprietarioDespesas() {
  const {
    despesas, setDespesas, importarDespesas,
    categoriasDespesa, addCategoriaDespesa, removeCategoriaDespesa,
    cobrancas, outros, politica,
  } = useFinance();

  const [fundoId, setFundoId] = useState("all");
  const [edificioId, setEdificioId] = useState("all");
  const [competencia, setCompetencia] = useState(COMPETENCIA_ATUAL);
  const [agrupamento, setAgrupamento] = useState<"fundo" | "ativo">("fundo");
  const [novoAberto, setNovoAberto] = useState(false);
  const [catAberto, setCatAberto] = useState(false);
  const [detalhe, setDetalhe] = useState<DespesaRec | null>(null);
  const [novaCategoria, setNovaCategoria] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const escopo: EscopoFinanceiro = useMemo(() => ({ fundoId, edificioId }), [fundoId, edificioId]);
  const competencias = useMemo(() => competenciasAte(competencia, 12), [competencia]);
  const competenciaOpts = useMemo(() => competenciasAte(COMPETENCIA_ATUAL, 18), []);
  const edificiosOpts = useMemo(
    () => fundoId === "all" ? edificiosRec : edificiosRec.filter(e => e.fundoId === fundoId),
    [fundoId],
  );
  const catLabel = (id: string) => categoriasDespesa.find(c => c.id === id)?.label ?? id;
  const catCls = (id: string) => categoriasDespesa.find(c => c.id === id)?.cls ?? "bg-slate-100 text-slate-700";
  const nomeEdificio = (id: string) => edificiosRec.find(e => e.id === id)?.nome ?? "—";
  const nomeFundo = (id: string) => fundos.find(f => f.id === id)?.nome ?? "—";

  const inEscopo = (d: DespesaRec) =>
    (fundoId === "all" || d.fundoId === fundoId) &&
    (edificioId === "all" || d.edificioId === edificioId);

  const serieLocacao = useMemo(
    () => buildFechamento(cobrancas, escopo, competencias, politica),
    [cobrancas, escopo, competencias, politica],
  );

  /** Série de 12 meses: Receita Imobiliária x Despesas Imobiliárias x NOI. */
  const serieNOI = useMemo(() => competencias.map(comp => {
    const receita = receitaImobiliariaDoMes(
      serieLocacao.find(s => s.competencia === comp), outros, escopo, comp);
    const desp = despesas
      .filter(inEscopo)
      .filter(d => d.competencia === comp)
      .reduce((s, d) => s + (d.valorRealizado ?? 0), 0);
    const noi = receita - desp;
    return {
      competencia: comp,
      label: compLabel(comp),
      Receita: Math.round(receita),
      Despesas: Math.round(desp),
      NOI: Math.round(noi),
      margem: receita > 0 ? (noi / receita) * 100 : 0,
    };
  }), [competencias, serieLocacao, outros, escopo, despesas, fundoId, edificioId]);

  const mes = serieNOI.find(m => m.competencia === competencia);

  const doMes = useMemo(
    () => despesas.filter(inEscopo).filter(d => d.competencia === competencia),
    [despesas, competencia, fundoId, edificioId],
  );

  const porCategoria = useMemo(() => {
    const map = new Map<string, number>();
    doMes.forEach(d => map.set(d.categoriaId, (map.get(d.categoriaId) ?? 0) + (d.valorRealizado ?? 0)));
    return [...map.entries()].map(([id, v]) => ({ id, label: catLabel(id), valor: v }))
      .sort((a, b) => b.valor - a.valor);
  }, [doMes, categoriasDespesa]);

  const consolidado = useMemo(() => {
    const chaves = agrupamento === "fundo"
      ? fundos.map(f => ({ id: f.id, nome: f.nome }))
      : edificiosOpts.map(e => ({ id: e.id, nome: e.nome }));
    return chaves.map(k => {
      const desp = despesas
        .filter(d => d.competencia === competencia)
        .filter(d => agrupamento === "fundo" ? d.fundoId === k.id : d.edificioId === k.id)
        .reduce((s, d) => s + (d.valorRealizado ?? 0), 0);
      const esc: EscopoFinanceiro = agrupamento === "fundo"
        ? { fundoId: k.id, edificioId: "all" }
        : { fundoId: "all", edificioId: k.id };
      const serie = buildFechamento(cobrancas, esc, [competencia], politica);
      const receita = receitaImobiliariaDoMes(serie[0], outros, esc, competencia);
      const noi = receita - desp;
      return { ...k, receita, desp, noi, margem: receita > 0 ? (noi / receita) * 100 : 0 };
    }).filter(r => r.receita > 0 || r.desp > 0);
  }, [agrupamento, competencia, despesas, cobrancas, outros, politica, edificiosOpts]);

  /* -------- Importação .xlsx / .csv -------- */
  function baixarTemplate() {
    exportExcel({
      fileName: "template-despesas",
      sheets: [{
        sheetName: "Despesas",
        columns: TEMPLATE_DESPESAS_COLUNAS.map(h => ({ header: h, get: () => "" })),
        rows: [{}],
      }],
    });
    toast.success("Template baixado — preencha e importe.");
  }

  async function importar(file: File) {
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const rows = XLSX.utils.sheet_to_json<any>(wb.Sheets[wb.SheetNames[0]], { defval: "" });
      const parsed: DespesaRec[] = [];
      for (const r of rows) {
        const get = (k: string) => {
          const key = Object.keys(r).find(x => x.toLowerCase().startsWith(k.toLowerCase()));
          return key ? String(r[key]).trim() : "";
        };
        const comp = get("Compet");
        const valorEsp = Number(String(get("Valor esperado")).replace(/\./g, "").replace(",", "."));
        if (!comp || !valorEsp) continue;
        const nomeFundoRaw = get("Fundo");
        const nomeAtivo = get("Ativo") || get("Edif");
        const fundo = fundos.find(f => f.nome.toLowerCase().includes(nomeFundoRaw.toLowerCase()) || f.id === nomeFundoRaw);
        const ativo = edificiosRec.find(e => e.nome.toLowerCase().includes(nomeAtivo.toLowerCase()) || e.id === nomeAtivo);
        const catRaw = get("Categoria");
        const cat = categoriasDespesa.find(c =>
          c.label.toLowerCase() === catRaw.toLowerCase() || c.id === catRaw.toLowerCase());
        const realRaw = get("Valor realizado");
        parsed.push({
          id: novoIdDespesa(),
          competencia: comp.slice(0, 7),
          fundoId: fundo?.id ?? ativo ? (fundo?.id ?? edificiosRec.find(e => e.id === ativo?.id)?.fundoId ?? "f1") : "f1",
          edificioId: ativo?.id ?? edificiosRec[0].id,
          data: get("Data") ? String(get("Data")).slice(0, 10) : `${comp.slice(0, 7)}-01`,
          categoriaId: cat?.id ?? "outros",
          fornecedor: get("Fornecedor") || "—",
          descricao: get("Descri") || "Despesa importada",
          valorEsperado: valorEsp,
          valorRealizado: realRaw ? Number(String(realRaw).replace(/\./g, "").replace(",", ".")) : null,
          dataPagamento: get("Data do pagamento") ? String(get("Data do pagamento")).slice(0, 10) : null,
          origem: "import",
          arquivoOrigem: file.name,
        });
      }
      if (parsed.length === 0) { toast.error("Nenhuma linha válida encontrada no arquivo."); return; }
      importarDespesas(parsed);
    } catch {
      toast.error("Não foi possível ler o arquivo. Use o template .xlsx/.csv.");
    }
  }

  function exportarDespesas() {
    exportExcel({
      fileName: `despesas-${competencia}`,
      sheets: [
        {
          ...TEMPLATE_PADRAO.despesas,
          rows: doMes.map(d => ({
            competencia: compLabel(d.competencia),
            fundo: nomeFundo(d.fundoId),
            edificio: nomeEdificio(d.edificioId),
            data: fmtDateBR(d.data),
            categoria: catLabel(d.categoriaId),
            fornecedor: d.fornecedor,
            descricao: d.descricao,
            valorEsperado: d.valorEsperado,
            valorRealizado: d.valorRealizado ?? 0,
            diferenca: (d.valorRealizado ?? 0) - d.valorEsperado,
            dataPagamento: d.dataPagamento ? fmtDateBR(d.dataPagamento) : "—",
            status: STATUS_DESPESA_META[statusDespesa(d)].label,
          })),
        },
        {
          ...TEMPLATE_PADRAO.noi,
          rows: serieNOI.map(m => ({
            competencia: m.label, receita: m.Receita, despesas: m.Despesas,
            noi: m.NOI, margem: Number(m.margem.toFixed(1)),
          })),
        },
      ],
    });
  }

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-[1400px] mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Despesas &amp; NOI</h1>
          <p className="text-sm text-muted-foreground">
            Despesas imobiliárias importadas e NOI = Receita Imobiliária − Despesas Imobiliárias.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={fundoId} onValueChange={v => { setFundoId(v); setEdificioId("all"); }}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os fundos</SelectItem>
              {fundos.map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={edificioId} onValueChange={setEdificioId}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os ativos</SelectItem>
              {edificiosOpts.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={competencia} onValueChange={setCompetencia}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {competenciaOpts.slice().reverse().map(c => (
                <SelectItem key={c} value={c}>{compLabel(c)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Receita Imobiliária", valor: fmtBRL(mes?.Receita ?? 0), icon: CircleDollarSign, cls: "text-emerald-600" },
          { label: "Despesas Imobiliárias", valor: fmtBRL(mes?.Despesas ?? 0), icon: Wallet, cls: "text-rose-600" },
          { label: "NOI", valor: fmtBRL(mes?.NOI ?? 0), icon: TrendingUp, cls: "text-primary" },
          { label: "Margem NOI", valor: `${(mes?.margem ?? 0).toFixed(1)}%`, icon: Percent, cls: "text-foreground" },
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

      <Tabs defaultValue="noi" className="space-y-4">
        <TabsList>
          <TabsTrigger value="noi">NOI</TabsTrigger>
          <TabsTrigger value="despesas">Despesas</TabsTrigger>
        </TabsList>

        {/* -------- NOI -------- */}
        <TabsContent value="noi" className="space-y-4">
          <Card>
            <CardHeader className="pb-2 flex-row items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-base">Receita, Despesas e NOI — 12 meses</CardTitle>
                <p className="text-xs text-muted-foreground">Consolidação por {agrupamento === "fundo" ? "Fundo" : "Ativo"}.</p>
              </div>
              <div className="flex gap-2">
                <Select value={agrupamento} onValueChange={v => setAgrupamento(v as "fundo" | "ativo")}>
                  <SelectTrigger className="w-[150px] h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fundo">Por Fundo</SelectItem>
                    <SelectItem value="ativo">Por Ativo</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={exportarDespesas}>
                  <FileSpreadsheet className="w-4 h-4 mr-1.5" /> Exportar Excel
                </Button>
              </div>
            </CardHeader>
            <CardContent className="h-[330px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={serieNOI} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} />
                  <RTooltip formatter={(v: any, n: any) => [fmtBRL(Number(v)), n]}
                    labelFormatter={l => `Competência ${l}`} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Despesas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="NOI" stroke="hsl(var(--foreground))" strokeWidth={2} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  NOI por {agrupamento === "fundo" ? "Fundo" : "Ativo"} — {compLabel(competencia)}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-xs text-muted-foreground">
                        <th className="text-left py-2 px-3 font-medium">{agrupamento === "fundo" ? "Fundo" : "Ativo"}</th>
                        <th className="text-left py-2 px-3 font-medium">Receita</th>
                        <th className="text-left py-2 px-3 font-medium">Despesas</th>
                        <th className="text-left py-2 px-3 font-medium">NOI</th>
                        <th className="text-left py-2 px-3 font-medium">Margem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {consolidado.map(r => (
                        <tr key={r.id} className="border-b last:border-0">
                          <td className="py-2.5 px-3 font-medium">{r.nome}</td>
                          <td className="py-2.5 px-3 text-emerald-600">{fmtBRL(r.receita)}</td>
                          <td className="py-2.5 px-3 text-rose-600">{fmtBRL(r.desp)}</td>
                          <td className="py-2.5 px-3 font-semibold">{fmtBRL(r.noi)}</td>
                          <td className="py-2.5 px-3">{r.margem.toFixed(1)}%</td>
                        </tr>
                      ))}
                      {consolidado.length === 0 && (
                        <tr><td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                          Sem dados nesta competência.
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Despesas por categoria — {compLabel(competencia)}</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={porCategoria} layout="vertical" margin={{ left: 40, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
                    <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} />
                    <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={130} />
                    <RTooltip formatter={(v: any) => fmtBRL(Number(v))} />
                    <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Realizado" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* -------- Despesas -------- */}
        <TabsContent value="despesas">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm text-muted-foreground">
                  {doMes.length} despesa(s) em {compLabel(competencia)}
                </div>
                <div className="flex flex-wrap gap-2">
                  <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) importar(f); e.target.value = ""; }} />
                  <Button variant="outline" size="sm" onClick={baixarTemplate}>
                    <Download className="w-4 h-4 mr-1.5" /> Template
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                    <Upload className="w-4 h-4 mr-1.5" /> Importar (.xlsx/.csv)
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCatAberto(true)}>Categorias</Button>
                  <Button size="sm" onClick={() => setNovoAberto(true)}>
                    <Plus className="w-4 h-4 mr-1.5" /> Nova despesa
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="text-left py-2 px-2 font-medium">Data</th>
                      <th className="text-left py-2 px-2 font-medium">Ativo</th>
                      <th className="text-left py-2 px-2 font-medium">Categoria</th>
                      <th className="text-left py-2 px-2 font-medium">Fornecedor</th>
                      <th className="text-left py-2 px-2 font-medium">Descrição</th>
                      <th className="text-left py-2 px-2 font-medium">Esperado</th>
                      <th className="text-left py-2 px-2 font-medium">Realizado</th>
                      <th className="text-left py-2 px-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doMes.map(d => {
                      const st = statusDespesa(d);
                      return (
                        <tr key={d.id} className="border-b last:border-0 hover:bg-muted/40 cursor-pointer"
                          onClick={() => setDetalhe(d)}>
                          <td className="py-2.5 px-2">{fmtDateBR(d.data)}</td>
                          <td className="py-2.5 px-2 text-muted-foreground">{nomeEdificio(d.edificioId)}</td>
                          <td className="py-2.5 px-2">
                            <Badge variant="outline" className={catCls(d.categoriaId)}>{catLabel(d.categoriaId)}</Badge>
                          </td>
                          <td className="py-2.5 px-2 text-muted-foreground">{d.fornecedor}</td>
                          <td className="py-2.5 px-2">{d.descricao}</td>
                          <td className="py-2.5 px-2">{fmtBRL(d.valorEsperado)}</td>
                          <td className="py-2.5 px-2 font-semibold">
                            {d.valorRealizado == null ? "—" : fmtBRL(d.valorRealizado)}
                          </td>
                          <td className="py-2.5 px-2">
                            <Badge variant="outline" className={STATUS_DESPESA_META[st].cls}>
                              {STATUS_DESPESA_META[st].label}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                    {doMes.length === 0 && (
                      <tr><td colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                        Nenhuma despesa nesta competência. Importe um arquivo para começar.
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detalhe da despesa */}
      <Sheet open={!!detalhe} onOpenChange={o => !o && setDetalhe(null)}>
        <SheetContent side="center" className="w-full sm:max-w-lg">
          {detalhe && (
            <>
              <SheetHeader><SheetTitle>{detalhe.descricao}</SheetTitle></SheetHeader>
              <div className="mt-4 grid sm:grid-cols-2 gap-3 text-sm">
                {[
                  ["Competência", compLabel(detalhe.competencia)],
                  ["Fundo", nomeFundo(detalhe.fundoId)],
                  ["Ativo", nomeEdificio(detalhe.edificioId)],
                  ["Categoria", catLabel(detalhe.categoriaId)],
                  ["Fornecedor", detalhe.fornecedor],
                  ["Valor esperado", fmtBRL(detalhe.valorEsperado)],
                  ["Valor realizado", detalhe.valorRealizado == null ? "—" : fmtBRL(detalhe.valorRealizado)],
                  ["Data do pagamento", detalhe.dataPagamento ? fmtDateBR(detalhe.dataPagamento) : "—"],
                  ["Origem", detalhe.origem === "import" ? `Importado (${detalhe.arquivoOrigem ?? "arquivo"})` : "Manual"],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">{k}</div>
                    <div className="font-medium mt-0.5">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Label className="text-xs">Registrar valor realizado</Label>
                <div className="flex gap-2 mt-1">
                  <Input id="real" type="number" defaultValue={detalhe.valorRealizado ?? ""} />
                  <Button onClick={() => {
                    const el = document.getElementById("real") as HTMLInputElement;
                    const v = Number(el.value);
                    setDespesas(prev => prev.map(d => d.id === detalhe.id
                      ? { ...d, valorRealizado: v, dataPagamento: d.dataPagamento ?? new Date().toISOString().slice(0, 10) }
                      : d));
                    setDetalhe(null);
                    toast.success("Valor realizado atualizado.");
                  }}>Salvar</Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <NovaDespesaDialog open={novoAberto} onOpenChange={setNovoAberto} competencia={competencia} />

      {/* Categorias */}
      <Dialog open={catAberto} onOpenChange={setCatAberto}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Categorias de despesa</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {categoriasDespesa.map(c => (
              <div key={c.id} className="flex items-center justify-between rounded-lg border p-2.5">
                <Badge variant="outline" className={c.cls}>{c.label}</Badge>
                <Button size="sm" variant="ghost" onClick={() => removeCategoriaDespesa(c.id)}>Remover</Button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input value={novaCategoria} onChange={e => setNovaCategoria(e.target.value)} placeholder="Nova categoria" />
            <Button onClick={() => { if (novaCategoria.trim()) { addCategoriaDespesa(novaCategoria.trim()); setNovaCategoria(""); } }}>
              Adicionar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NovaDespesaDialog({ open, onOpenChange, competencia }: {
  open: boolean; onOpenChange: (o: boolean) => void; competencia: string;
}) {
  const { setDespesas, categoriasDespesa } = useFinance();
  const [edificioId, setEdificioId] = useState(edificiosRec[0].id);
  const [categoriaId, setCategoriaId] = useState(categoriasDespesa[0]?.id ?? "outros");
  const [fornecedor, setFornecedor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valorEsperado, setValorEsperado] = useState("");
  const [valorRealizado, setValorRealizado] = useState("");
  const [data, setData] = useState(`${competencia}-05`);

  function salvar() {
    const esp = Number(valorEsperado);
    if (!descricao.trim() || !esp) { toast.error("Informe descrição e valor esperado."); return; }
    const ed = edificiosRec.find(e => e.id === edificioId)!;
    setDespesas(prev => [{
      id: novoIdDespesa(),
      competencia,
      fundoId: ed.fundoId,
      edificioId,
      data,
      categoriaId,
      fornecedor: fornecedor || "—",
      descricao,
      valorEsperado: esp,
      valorRealizado: valorRealizado ? Number(valorRealizado) : null,
      dataPagamento: valorRealizado ? data : null,
      origem: "manual",
      arquivoOrigem: null,
    }, ...prev]);
    toast.success("Despesa lançada.");
    onOpenChange(false);
    setDescricao(""); setValorEsperado(""); setValorRealizado(""); setFornecedor("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Nova despesa — {compLabel(competencia)}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Ativo</Label>
              <Select value={edificioId} onValueChange={setEdificioId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {edificiosRec.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Categoria</Label>
              <Select value={categoriaId} onValueChange={setCategoriaId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categoriasDespesa.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Fornecedor</Label>
              <Input value={fornecedor} onChange={e => setFornecedor(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Data</Label>
              <Input type="date" value={data} onChange={e => setData(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Valor esperado</Label>
              <Input type="number" value={valorEsperado} onChange={e => setValorEsperado(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Valor realizado (opcional)</Label>
              <Input type="number" value={valorRealizado} onChange={e => setValorRealizado(e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Descrição</Label>
            <Input value={descricao} onChange={e => setDescricao(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={salvar}>Lançar despesa</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
