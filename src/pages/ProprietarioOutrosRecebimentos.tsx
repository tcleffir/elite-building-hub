import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Plus, Search, FileSpreadsheet, Link2, Settings2, CheckCircle2, Clock,
} from "lucide-react";
import { toast } from "sonner";
import { useFinance } from "@/contexts/FinanceContext";
import {
  CATEGORIAS_ORDEM, recalcStatus, novoIdRecebimento, novoIdParcela,
  type CategoriaOutroRecebimento, type OutroRecebimento, type StatusRecebimento,
} from "@/lib/other-receipts-data";
import {
  fmtBRL, fmtDateBR, compLabel, competenciasAte, COMPETENCIA_ATUAL,
} from "@/lib/finance-core";
import { fundos, edificiosRec, inquilinosRec, contratosRec } from "@/lib/reconciliation-data";
import { exportExcel, TEMPLATE_PADRAO } from "@/lib/export-service";

const STATUS_META: Record<StatusRecebimento, { label: string; cls: string }> = {
  pendente: { label: "Pendente", cls: "bg-amber-100 text-amber-700 border-amber-200" },
  parcial:  { label: "Parcial",  cls: "bg-sky-100 text-sky-700 border-sky-200" },
  recebido: { label: "Recebido", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
};

const USUARIO = "Natalia Landi";
const COMPETENCIAS = competenciasAte(COMPETENCIA_ATUAL, 12).reverse();

export default function ProprietarioOutrosRecebimentos() {
  const { outros, setOutros, categoriaConfig, updateCategoriaConfig } = useFinance();

  const [busca, setBusca] = useState("");
  const [fCategoria, setFCategoria] = useState<string>("todas");
  const [fStatus, setFStatus] = useState<string>("todos");
  const [fFundo, setFFundo] = useState<string>("todos");
  const [fEdificio, setFEdificio] = useState<string>("todos");
  const [detalhe, setDetalhe] = useState<OutroRecebimento | null>(null);
  const [novoAberto, setNovoAberto] = useState(false);
  const [configAberto, setConfigAberto] = useState(false);

  const edificiosFiltrados = useMemo(
    () => fFundo === "todos" ? edificiosRec : edificiosRec.filter(e => e.fundoId === fFundo),
    [fFundo],
  );

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return outros.filter(r => {
      if (fCategoria !== "todas" && r.categoria !== fCategoria) return false;
      if (fStatus !== "todos" && r.status !== fStatus) return false;
      if (fFundo !== "todos" && r.fundoId !== fFundo) return false;
      if (fEdificio !== "todos" && r.edificioId !== fEdificio) return false;
      if (!q) return true;
      const loc = inquilinosRec.find(i => i.id === r.locatarioId)?.nome ?? r.contraparteNome ?? "";
      return [r.descricao, loc, r.id, r.observacao ?? ""].join(" ").toLowerCase().includes(q);
    });
  }, [outros, busca, fCategoria, fStatus, fFundo, fEdificio]);

  const totais = useMemo(() => {
    const total = lista.reduce((s, r) => s + r.valorTotal, 0);
    const recebido = lista.reduce((s, r) =>
      s + r.parcelas.filter(p => p.status === "recebido").reduce((a, p) => a + p.valor, 0), 0);
    const receita = lista
      .filter(r => categoriaConfig[r.categoria].compoeReceita)
      .reduce((s, r) => s + r.parcelas.filter(p => p.status === "recebido").reduce((a, p) => a + p.valor, 0), 0);
    return { total, recebido, aberto: total - recebido, receita };
  }, [lista, categoriaConfig]);

  const nomeEdificio = (id?: string | null) => edificiosRec.find(e => e.id === id)?.nome ?? "—";
  const nomeFundo = (id?: string | null) => fundos.find(f => f.id === id)?.nome ?? "—";
  const nomeContraparte = (r: OutroRecebimento) =>
    inquilinosRec.find(i => i.id === r.locatarioId)?.nome ?? r.contraparteNome ?? "—";

  function marcarParcela(recId: string, parcelaId: string) {
    setOutros(prev => prev.map(r => {
      if (r.id !== recId) return r;
      const parcelas = r.parcelas.map(p =>
        p.id === parcelaId ? { ...p, status: p.status === "recebido" ? "a_receber" as const : "recebido" as const } : p);
      const atualizado = { ...r, parcelas };
      return {
        ...atualizado,
        status: recalcStatus(atualizado),
        audit: [...r.audit, {
          id: `a-${Date.now()}`, acao: "parcela_atualizada", usuario: USUARIO,
          data: new Date().toISOString(), detalhes: `Parcela ${parcelaId}`,
        }],
      };
    }));
    setDetalhe(d => {
      if (!d || d.id !== recId) return d;
      const parcelas = d.parcelas.map(p =>
        p.id === parcelaId ? { ...p, status: p.status === "recebido" ? "a_receber" as const : "recebido" as const } : p);
      return { ...d, parcelas, status: recalcStatus({ ...d, parcelas }) };
    });
    toast.success("Parcela atualizada.");
  }

  function exportar() {
    exportExcel({
      fileName: "outros-recebimentos",
      sheets: [{
        ...TEMPLATE_PADRAO.outrosRecebimentos,
        rows: lista.map(r => ({
        id: r.id,
        categoria: categoriaConfig[r.categoria].label,
        descricao: r.descricao,
        fundo: nomeFundo(r.fundoId),
        edificio: nomeEdificio(r.edificioId),
        contraparte: nomeContraparte(r),
        valorTotal: r.valorTotal,
        recebido: r.parcelas.filter(p => p.status === "recebido").reduce((a, p) => a + p.valor, 0),
        parcelas: `${r.parcelas.filter(p => p.status === "recebido").length}/${r.parcelas.length}`,
        status: STATUS_META[r.status].label,
        compoeReceita: categoriaConfig[r.categoria].compoeReceita ? "Sim" : "Não",
        compoeInadimplencia: categoriaConfig[r.categoria].compoeInadimplencia ? "Sim" : "Não",
        origem: r.origem === "conciliacao" ? "Conciliação" : "Manual",
        })),
      }],
    });
  }

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-[1400px] mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Outros Recebimentos</h1>
          <p className="text-sm text-muted-foreground">
            Valores fora da receita normal de locação. Entradas não identificadas chegam aqui pela Conciliação Financeira.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setConfigAberto(true)}>
            <Settings2 className="w-4 h-4 mr-1.5" /> Configurações
          </Button>
          <Button variant="outline" size="sm" onClick={exportar}>
            <FileSpreadsheet className="w-4 h-4 mr-1.5" /> Exportar Excel
          </Button>
          <Button size="sm" onClick={() => setNovoAberto(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Novo recebimento
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total lançado", valor: totais.total, cls: "text-foreground" },
          { label: "Recebido", valor: totais.recebido, cls: "text-emerald-600" },
          { label: "Em aberto", valor: totais.aberto, cls: "text-amber-600" },
          { label: "Compõe Receita Imobiliária", valor: totais.receita, cls: "text-primary" },
        ].map(k => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">{k.label}</div>
              <div className={`text-lg font-bold mt-1 ${k.cls}`}>{fmtBRL(k.valor)}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input className="pl-8" placeholder="Buscar descrição ou contraparte"
                value={busca} onChange={e => setBusca(e.target.value)} />
            </div>
            <Select value={fCategoria} onValueChange={setFCategoria}>
              <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as categorias</SelectItem>
                {CATEGORIAS_ORDEM.map(c => (
                  <SelectItem key={c} value={c}>{categoriaConfig[c].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={fStatus} onValueChange={setFStatus}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="parcial">Parcial</SelectItem>
                <SelectItem value="recebido">Recebido</SelectItem>
              </SelectContent>
            </Select>
            <Select value={fFundo} onValueChange={v => { setFFundo(v); setFEdificio("todos"); }}>
              <SelectTrigger><SelectValue placeholder="Fundo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os fundos</SelectItem>
                {fundos.map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={fEdificio} onValueChange={setFEdificio}>
              <SelectTrigger><SelectValue placeholder="Ativo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os ativos</SelectItem>
                {edificiosFiltrados.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="text-left py-2 px-2 font-medium">Categoria</th>
                  <th className="text-left py-2 px-2 font-medium">Descrição</th>
                  <th className="text-left py-2 px-2 font-medium">Ativo</th>
                  <th className="text-left py-2 px-2 font-medium">Contraparte</th>
                  <th className="text-left py-2 px-2 font-medium">Valor</th>
                  <th className="text-left py-2 px-2 font-medium">Parcelas</th>
                  <th className="text-left py-2 px-2 font-medium">Receita</th>
                  <th className="text-left py-2 px-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {lista.map(r => {
                  const cfg = categoriaConfig[r.categoria];
                  const pagas = r.parcelas.filter(p => p.status === "recebido").length;
                  return (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-muted/40 cursor-pointer"
                      onClick={() => setDetalhe(r)}>
                      <td className="py-2.5 px-2">
                        <Badge variant="outline" className={cfg.cls}>{cfg.label}</Badge>
                      </td>
                      <td className="py-2.5 px-2">
                        <div className="font-medium text-foreground">{r.descricao}</div>
                        {r.origem === "conciliacao" && (
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Link2 className="w-3 h-3" /> Vindo da Conciliação
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-muted-foreground">{nomeEdificio(r.edificioId)}</td>
                      <td className="py-2.5 px-2 text-muted-foreground">{nomeContraparte(r)}</td>
                      <td className="py-2.5 px-2 font-semibold">{fmtBRL(r.valorTotal)}</td>
                      <td className="py-2.5 px-2 text-muted-foreground">{pagas}/{r.parcelas.length}</td>
                      <td className="py-2.5 px-2 text-xs">
                        {cfg.compoeReceita
                          ? <span className="text-emerald-600">Compõe</span>
                          : <span className="text-muted-foreground">Não compõe</span>}
                      </td>
                      <td className="py-2.5 px-2">
                        <Badge variant="outline" className={STATUS_META[r.status].cls}>
                          {STATUS_META[r.status].label}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
                {lista.length === 0 && (
                  <tr><td colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                    Nenhum recebimento encontrado com os filtros atuais.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="divide-y md:hidden">{lista.map(r => { const cfg = categoriaConfig[r.categoria]; const pagas = r.parcelas.filter(p => p.status === 'recebido').length; return <button key={r.id} onClick={() => setDetalhe(r)} className="block w-full space-y-3 p-4 text-left"><div className="flex items-start justify-between gap-2"><div><p className="text-sm font-semibold">{r.descricao}</p><p className="mt-1 text-xs text-muted-foreground">{nomeEdificio(r.edificioId)} · {nomeContraparte(r)}</p></div><Badge variant="outline" className={STATUS_META[r.status].cls}>{STATUS_META[r.status].label}</Badge></div><div className="grid grid-cols-3 gap-2 text-xs"><div><span className="block text-muted-foreground">Categoria</span><strong>{cfg.label}</strong></div><div><span className="block text-muted-foreground">Valor</span><strong>{fmtBRL(r.valorTotal)}</strong></div><div><span className="block text-muted-foreground">Parcelas</span><strong>{pagas}/{r.parcelas.length}</strong></div></div></button>;})}{lista.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">Nenhum recebimento encontrado.</p>}</div>
        </CardContent>
      </Card>

      {/* Detalhe */}
      <Sheet open={!!detalhe} onOpenChange={o => !o && setDetalhe(null)}>
        <SheetContent side="center" className="w-full sm:max-w-2xl">
          {detalhe && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {detalhe.descricao}
                  <Badge variant="outline" className={categoriaConfig[detalhe.categoria].cls}>
                    {categoriaConfig[detalhe.categoria].label}
                  </Badge>
                </SheetTitle>
              </SheetHeader>
              <Tabs defaultValue="dados" className="mt-4">
                <TabsList>
                  <TabsTrigger value="dados">Dados</TabsTrigger>
                  <TabsTrigger value="parcelas">Parcelas</TabsTrigger>
                  <TabsTrigger value="audit">Histórico</TabsTrigger>
                </TabsList>
                <TabsContent value="dados" className="space-y-3 mt-3">
                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    {[
                      ["Fundo", nomeFundo(detalhe.fundoId)],
                      ["Ativo", nomeEdificio(detalhe.edificioId)],
                      ["Contraparte", nomeContraparte(detalhe)],
                      ["Contrato", detalhe.contratoId ?? "—"],
                      ["Valor total", fmtBRL(detalhe.valorTotal)],
                      ["Origem", detalhe.origem === "conciliacao" ? "Conciliação Financeira" : "Lançamento manual"],
                      ["Compõe Receita Imobiliária", categoriaConfig[detalhe.categoria].compoeReceita ? "Sim" : "Não"],
                      ["Compõe Inadimplência Locatícia", categoriaConfig[detalhe.categoria].compoeInadimplencia ? "Sim" : "Não"],
                    ].map(([k, v]) => (
                      <div key={k as string} className="rounded-lg border p-3">
                        <div className="text-xs text-muted-foreground">{k}</div>
                        <div className="font-medium text-foreground mt-0.5">{v}</div>
                      </div>
                    ))}
                  </div>
                  {detalhe.observacao && (
                    <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                      {detalhe.observacao}
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="parcelas" className="mt-3">
                  <div className="space-y-2">
                    {detalhe.parcelas.map(p => (
                      <div key={p.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <div className="text-sm font-medium">
                            Parcela {p.numero}/{detalhe.parcelas.length} — {fmtBRL(p.valor)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Vencimento {fmtDateBR(p.vencimento)}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={p.status === "recebido" ? "outline" : "default"}
                          onClick={() => marcarParcela(detalhe.id, p.id)}
                        >
                          {p.status === "recebido"
                            ? <><CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" /> Recebida</>
                            : <><Clock className="w-4 h-4 mr-1.5" /> Marcar recebida</>}
                        </Button>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="audit" className="mt-3">
                  <div className="space-y-2">
                    {detalhe.audit.map(a => (
                      <div key={a.id} className="rounded-lg border p-3 text-sm">
                        <div className="font-medium">{a.acao.replace(/_/g, " ")}</div>
                        <div className="text-xs text-muted-foreground">
                          {a.usuario} · {fmtDateBR(a.data.slice(0, 10))}
                          {a.detalhes ? ` · ${a.detalhes}` : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>

      <NovoRecebimentoDialog open={novoAberto} onOpenChange={setNovoAberto} />

      {/* Configurações de categoria */}
      <Dialog open={configAberto} onOpenChange={setConfigAberto}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configurações por categoria</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-[1fr_auto_auto] gap-3 text-xs text-muted-foreground px-3">
              <span>Categoria</span><span>Compõe Receita</span><span>Compõe Inadimplência</span>
            </div>
            {CATEGORIAS_ORDEM.map(cat => {
              const cfg = categoriaConfig[cat];
              return (
                <div key={cat} className="grid grid-cols-[1fr_auto_auto] items-center gap-6 rounded-lg border p-3">
                  <Badge variant="outline" className={`${cfg.cls} w-fit`}>{cfg.label}</Badge>
                  <Switch checked={cfg.compoeReceita}
                    onCheckedChange={v => updateCategoriaConfig(cat, { compoeReceita: v })} />
                  <Switch checked={cfg.compoeInadimplencia}
                    onCheckedChange={v => updateCategoriaConfig(cat, { compoeInadimplencia: v })} />
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            "Compõe Receita Imobiliária" alimenta o cálculo de NOI. "Compõe Inadimplência Locatícia"
            define se o valor entra no índice de inadimplência do Fechamento Mensal.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NovoRecebimentoDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { setOutros, categoriaConfig } = useFinance();
  const [categoria, setCategoria] = useState<CategoriaOutroRecebimento>("caucao");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [fundoId, setFundoId] = useState<string>("");
  const [edificioId, setEdificioId] = useState<string>("");
  const [contratoId, setContratoId] = useState<string>("nenhum");
  const [locatarioId, setLocatarioId] = useState<string>("nenhum");
  const [parcelado, setParcelado] = useState(false);
  const [numParcelas, setNumParcelas] = useState("1");
  const [primeiroVenc, setPrimeiroVenc] = useState(new Date().toISOString().slice(0, 10));
  const [observacao, setObservacao] = useState("");

  const edificiosOpts = fundoId ? edificiosRec.filter(e => e.fundoId === fundoId) : edificiosRec;
  const contratosOpts = edificioId ? contratosRec.filter(c => c.edificioId === edificioId) : contratosRec;

  function salvar() {
    const total = Number(valor.replace(/\./g, "").replace(",", "."));
    if (!descricao.trim() || !total || total <= 0) {
      toast.error("Informe descrição e valor válidos."); return;
    }
    const n = parcelado ? Math.max(1, Number(numParcelas)) : 1;
    const id = novoIdRecebimento();
    const base = new Date(primeiroVenc + "T12:00:00");
    const parcelas = Array.from({ length: n }, (_, i) => {
      const d = new Date(base); d.setMonth(d.getMonth() + i);
      return {
        id: novoIdParcela(), outroRecebimentoId: id, numero: i + 1,
        valor: Math.round((total / n) * 100) / 100,
        vencimento: d.toISOString().slice(0, 10),
        status: "a_receber" as const, entradaId: null,
      };
    });
    setOutros(prev => [{
      id, categoria, valorTotal: total, parcelado, numParcelas: n,
      fundoId: fundoId || null, edificioId: edificioId || null, unidadeId: null,
      contratoId: contratoId === "nenhum" ? null : contratoId,
      locatarioId: locatarioId === "nenhum" ? null : locatarioId,
      contraparteNome: null, descricao, observacao,
      status: "pendente", origem: "manual", criadoEm: new Date().toISOString(),
      parcelas,
      audit: [{ id: "a1", acao: "criado", usuario: USUARIO, data: new Date().toISOString() }],
    }, ...prev]);
    toast.success("Recebimento lançado.");
    onOpenChange(false);
    setDescricao(""); setValor(""); setObservacao(""); setParcelado(false); setNumParcelas("1");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[88vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Novo outro recebimento</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Categoria</Label>
              <Select value={categoria} onValueChange={v => setCategoria(v as CategoriaOutroRecebimento)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIAS_ORDEM.map(c => (
                    <SelectItem key={c} value={c}>{categoriaConfig[c].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Valor total (R$)</Label>
              <Input value={valor} onChange={e => setValor(e.target.value)} placeholder="15000" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Descrição</Label>
            <Input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Ex.: Caução contratual" />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Fundo</Label>
              <Select value={fundoId} onValueChange={v => { setFundoId(v); setEdificioId(""); }}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {fundos.map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Ativo</Label>
              <Select value={edificioId} onValueChange={setEdificioId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {edificiosOpts.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Contrato (opcional)</Label>
              <Select value={contratoId} onValueChange={setContratoId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhum">Sem contrato</SelectItem>
                  {contratosOpts.map(c => <SelectItem key={c.id} value={c.id}>{c.id}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Contraparte / locatário</Label>
              <Select value={locatarioId} onValueChange={setLocatarioId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhum">Não vinculado</SelectItem>
                  {inquilinosRec.map(i => <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <div className="text-sm font-medium">Parcelado</div>
              <div className="text-xs text-muted-foreground">Gera parcelas mensais com controle individual.</div>
            </div>
            <Switch checked={parcelado} onCheckedChange={setParcelado} />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {parcelado && (
              <div>
                <Label className="text-xs">Nº de parcelas</Label>
                <Input type="number" min={1} value={numParcelas} onChange={e => setNumParcelas(e.target.value)} />
              </div>
            )}
            <div>
              <Label className="text-xs">{parcelado ? "1º vencimento" : "Vencimento"}</Label>
              <Input type="date" value={primeiroVenc} onChange={e => setPrimeiroVenc(e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Observação</Label>
            <Textarea rows={2} value={observacao} onChange={e => setObservacao(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={salvar}>Lançar recebimento</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
