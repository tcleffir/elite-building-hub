import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useFinance } from "@/contexts/FinanceContext";
import { contratosRec, inquilinosRec, unidadesRec, edificiosRec } from "@/lib/reconciliation-data";
import { mockTenantContracts } from "@/lib/mock-data";
import { getUnitStackingData } from "@/lib/stacking-plan-data";
import { HOJE, MESES_ABREV, fmtBRL, fmtDateBR } from "@/lib/finance-core";

type St = "pago" | "a_vencer" | "em_atraso";
const ST_META: Record<St, { label: string; cls: string; dot: string }> = {
  pago: { label: "Pago", cls: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  a_vencer: { label: "A vencer", cls: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-400" },
  em_atraso: { label: "Em atraso", cls: "bg-rose-100 text-rose-700 border-rose-200", dot: "bg-rose-500" },
};
const ANO = 2026;

interface Parcela { n: number; comp: string; vencimento: string; valor: number; status: St; pagoEm: string | null }
interface UnidadeIptu {
  id: string; edificioId: string; ativo: string; conjunto: string; num: number;
  devedor: string; vago: boolean; anual: number; parcelas: Parcela[];
}

export default function IptuUnidades() {
  const { cobrancas } = useFinance();
  const [ativo, setAtivo] = useState("b12");
  const [status, setStatus] = useState<"all" | St>("all");
  const [ordem, setOrdem] = useState<"asc" | "desc">("asc");
  const [sel, setSel] = useState<UnidadeIptu | null>(null);

  const unidades = useMemo<UnidadeIptu[]>(() => {
    const out: UnidadeIptu[] = contratosRec.map(ct => {
      const un = ct.unidadeIds.map(u => unidadesRec.find(x => x.id === u)?.identificacao).filter(Boolean).join(", ");
      const parcelas: Parcela[] = [];
      for (let i = 0; i < ct.iptuParcelas; i++) {
        const m = ct.iptuPrimeiraParcelaMes + i;
        if (m > 12) break;
        const comp = `${ANO}-${String(m).padStart(2, "0")}`;
        const cob = cobrancas.find(c => c.contratoId === ct.id && c.competencia === comp);
        const venc = cob?.dataVencimento ?? new Date(ANO, m - 1, ct.diaVencimento).toISOString().slice(0, 10);
        const pago = (cob?.valorRecebido ?? 0) > 0;
        const st: St = pago ? "pago" : new Date(venc + "T12:00:00") < HOJE ? "em_atraso" : "a_vencer";
        parcelas.push({ n: i + 1, comp, vencimento: venc, valor: Math.round(ct.iptuValorAnual / ct.iptuParcelas), status: st, pagoEm: pago ? cob?.dataPagamentoEfetiva ?? venc : null });
      }
      return {
        id: ct.id, edificioId: ct.edificioId, ativo: edificiosRec.find(e => e.id === ct.edificioId)?.nome ?? "—",
        conjunto: un || "—", num: Number(un.match(/\d+/)?.[0] ?? 0),
        devedor: inquilinosRec.find(i => i.id === ct.inquilinoId)?.nome ?? "—", vago: false,
        anual: ct.iptuValorAnual, parcelas,
      };
    });
    // Unidades vagas: IPTU fica com o proprietário (fundo) e é pago pela administradora.
    mockTenantContracts.filter(c => c.building_id === "b12" && (c.status === "vacant" || !c.tenant_name)).forEach(c => {
      const st = getUnitStackingData(c);
      const mensal = Math.round(c.area_m2 * st.iptuM2);
      out.push({
        id: c.id, edificioId: "b12", ativo: edificiosRec.find(e => e.id === "b12")?.nome ?? "Chucri Zaidan",
        conjunto: c.unit_id, num: Number(c.unit_id.match(/\d+/)?.[0] ?? 0), devedor: "HGRE11 (unidade vaga)", vago: true,
        anual: mensal * 12,
        parcelas: Array.from({ length: 12 }, (_, i) => {
          const venc = new Date(ANO, i, 10).toISOString().slice(0, 10);
          const pago = new Date(venc + "T12:00:00") < HOJE;
          return { n: i + 1, comp: `${ANO}-${String(i + 1).padStart(2, "0")}`, vencimento: venc, valor: mensal, status: (pago ? "pago" : "a_vencer") as St, pagoEm: pago ? venc : null };
        }),
      });
    });
    return out;
  }, [cobrancas]);

  const doAtivo = unidades.filter(u => ativo === "all" || u.edificioId === ativo);
  const visiveis = doAtivo
    .filter(u => status === "all" || u.parcelas.some(p => p.status === status))
    .sort((a, b) => (ordem === "asc" ? 1 : -1) * (a.ativo.localeCompare(b.ativo) || a.num - b.num));

  const todas = doAtivo.flatMap(u => u.parcelas);
  const soma = (s: St) => todas.filter(p => p.status === s).reduce((t, p) => t + p.valor, 0);
  const total = doAtivo.reduce((t, u) => t + u.anual, 0);
  const ativosComUnid = Array.from(new Set(unidades.map(u => u.edificioId)));

  const kpis = [
    { label: "IPTU anual (soma das unidades)", value: fmtBRL(total), cls: "text-foreground" },
    { label: "Pago", value: fmtBRL(soma("pago")), cls: "text-emerald-600" },
    { label: "A vencer", value: fmtBRL(soma("a_vencer")), cls: "text-amber-600" },
    { label: "Em atraso", value: fmtBRL(soma("em_atraso")), cls: "text-rose-600" },
    { label: "Unidades com atraso", value: `${doAtivo.filter(u => u.parcelas.some(p => p.status === "em_atraso")).length} de ${doAtivo.length}`, cls: "text-foreground" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-3 sm:flex sm:flex-wrap">
        <Select value={ativo} onValueChange={setAtivo}>
          <SelectTrigger className="h-9 w-full text-sm sm:w-[220px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os ativos</SelectItem>
            {ativosComUnid.map(id => <SelectItem key={id} value={id}>{edificiosRec.find(e => e.id === id)?.nome}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={v => setStatus(v as typeof status)}>
          <SelectTrigger className="h-9 w-full text-sm sm:w-[190px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as unidades</SelectItem>
            <SelectItem value="em_atraso">Com parcela em atraso</SelectItem>
            <SelectItem value="a_vencer">Com parcela a vencer</SelectItem>
            <SelectItem value="pago">Com parcela paga</SelectItem>
          </SelectContent>
        </Select>
        <Select value={ordem} onValueChange={v => setOrdem(v as "asc" | "desc")}>
          <SelectTrigger className="h-9 w-full text-sm sm:w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Conjunto: menor → maior</SelectItem>
            <SelectItem value="desc">Conjunto: maior → menor</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {kpis.map(k => (
          <Card key={k.label}><CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{k.label}</p>
            <p className={`mt-1 text-lg font-bold ${k.cls}`}>{k.value}</p>
            <p className="text-[11px] text-muted-foreground">Exercício {ANO}</p>
          </CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Parcelas por unidade — {ANO}</CardTitle>
          <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
            {(Object.keys(ST_META) as St[]).map(s => (
              <span key={s} className="flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-sm ${ST_META[s].dot}`} />{ST_META[s].label}</span>
            ))}
            <span>· Clique na unidade para ver cada parcela</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 p-3">
          {visiveis.length === 0 && <p className="p-4 text-sm text-muted-foreground">Nenhuma unidade para o filtro.</p>}
          {visiveis.map(u => {
            const pago = u.parcelas.filter(p => p.status === "pago").reduce((t, p) => t + p.valor, 0);
            const atraso = u.parcelas.filter(p => p.status === "em_atraso").reduce((t, p) => t + p.valor, 0);
            return (
              <button key={u.id} onClick={() => setSel(u)}
                className="w-full rounded-md border p-3 text-left transition-colors hover:bg-muted/40">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                  <div className="min-w-0 lg:w-64">
                    <div className="font-semibold">{u.conjunto}{ativo === "all" && <span className="ml-1 text-xs font-normal text-muted-foreground">· {u.ativo}</span>}</div>
                    <div className="truncate text-xs text-muted-foreground">{u.devedor}</div>
                  </div>
                  <div className="grid flex-1 grid-cols-12 gap-1">
                    {Array.from({ length: 12 }, (_, i) => {
                      const p = u.parcelas.find(x => Number(x.comp.slice(5)) === i + 1);
                      return (
                        <div key={i} className="text-center" title={p ? `${MESES_ABREV[i]}: ${ST_META[p.status].label} · ${fmtBRL(p.valor)}` : `${MESES_ABREV[i]}: sem parcela`}>
                          <div className={`h-5 rounded-sm ${p ? ST_META[p.status].dot : "bg-muted"}`} />
                          <div className="mt-0.5 text-[9px] text-muted-foreground">{MESES_ABREV[i].slice(0, 1)}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs lg:w-80">
                    <div><span className="block text-muted-foreground">Anual</span><strong>{fmtBRL(u.anual)}</strong></div>
                    <div><span className="block text-muted-foreground">Pago</span><strong className="text-emerald-600">{fmtBRL(pago)}</strong></div>
                    <div><span className="block text-muted-foreground">Em atraso</span><strong className="text-rose-600">{fmtBRL(atraso)}</strong></div>
                  </div>
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>

      <Sheet open={!!sel} onOpenChange={o => !o && setSel(null)}>
        <SheetContent side="center" className="w-full sm:max-w-lg">
          {sel && (<>
            <SheetHeader>
              <SheetTitle>IPTU {ANO} — {sel.conjunto}</SheetTitle>
              <p className="text-left text-sm text-muted-foreground">{sel.ativo} · Devedor: {sel.devedor}</p>
            </SheetHeader>
            <div className="mt-4 max-h-[60vh] overflow-y-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-xs text-muted-foreground">
                  {["Parcela", "Vencimento", "Valor", "Status", "Pago em"].map(h => <th key={h} className="py-2 text-left font-medium">{h}</th>)}
                </tr></thead>
                <tbody>
                  {sel.parcelas.map(p => (
                    <tr key={p.n} className="border-b last:border-0">
                      <td className="py-2">{p.n}/{sel.parcelas.length}</td>
                      <td className="py-2">{fmtDateBR(p.vencimento)}</td>
                      <td className="py-2">{fmtBRL(p.valor)}</td>
                      <td className="py-2"><Badge variant="outline" className={ST_META[p.status].cls}>{ST_META[p.status].label}</Badge></td>
                      <td className="py-2">{fmtDateBR(p.pagoEm)}</td>
                    </tr>
                  ))}
                  <tr className="font-semibold"><td className="py-2" colSpan={2}>Total</td><td className="py-2">{fmtBRL(sel.anual)}</td><td colSpan={2} /></tr>
                </tbody>
              </table>
            </div>
          </>)}
        </SheetContent>
      </Sheet>
    </div>
  );
}
