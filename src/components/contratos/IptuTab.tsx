import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Bell, Building2, ChevronDown, ChevronRight, Download, FileCheck2, Landmark, RefreshCw, Scale } from "lucide-react";
import { COMPETENCIAS, CURRENT_COMPETENCIA, competenciaLabel } from "@/lib/portfolio-competencia";
import { getHGRE11PortfolioBuildings } from "@/lib/mock-data";
import {
  getIptuAtivos, parcelaStatusLabel, parcelaStatusClass, cndLabel, cndClass, debitoTotal,
  type ParcelaStatus,
} from "@/lib/iptu-data";
import { exportExcel } from "@/lib/export-service";
import { toast } from "sonner";

const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);
const num = (v: number) => v.toLocaleString("pt-BR");

const IptuTab = () => {
  const [competencia, setCompetencia] = useState(CURRENT_COMPETENCIA);
  const [ativo, setAtivo] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | ParcelaStatus>("all");

  const all = useMemo(() => getIptuAtivos(competencia), [competencia]);
  const rows = all.filter((r) => ativo === "all" || r.buildingId === ativo);
  const visible = rows.filter(
    (r) => statusFilter === "all" || r.parcelas.some((p) => p.status === statusFilter),
  );

  const totalEmitido = rows.reduce((s, r) => s + r.valorTotal, 0);
  const emAtraso = rows.flatMap((r) => r.parcelas.filter((p) => p.status === "em_atraso"));
  const dividaAtiva = rows.filter((r) => r.debitosAnteriores.some((d) => d.dividaAtiva));
  const debitosAnteriores = rows.reduce(
    (s, r) => s + r.debitosAnteriores.reduce((a, d) => a + debitoTotal(d), 0),
    0,
  );
  const cndPendentes = rows.filter((r) => r.cnd !== "valida");
  const alertas = rows.flatMap((r) => r.alertas.map((a) => ({ ...a, building: r.building })));

  const handleExport = () => {
    exportExcel({
      fileName: `iptu-${competencia}`,
      sheets: [
        {
          sheetName: "Cadastro e exercício",
          columns: [
            { header: "Ativo", get: (r: typeof rows[number]) => r.building },
            { header: "Município", get: (r: typeof rows[number]) => `${r.municipio}/${r.uf}` },
            { header: "Inscrição imobiliária", get: (r: typeof rows[number]) => r.inscricao },
            { header: "Área construída (m²)", get: (r: typeof rows[number]) => r.areaConstruidaM2 },
            { header: "Área terreno (m²)", get: (r: typeof rows[number]) => r.areaTerrenoM2 },
            { header: "Valor venal (R$)", get: (r: typeof rows[number]) => r.valorVenal },
            { header: "Alíquota (%)", get: (r: typeof rows[number]) => r.aliquota },
            { header: "Lançamento", get: (r: typeof rows[number]) => (r.lancado ? "Lançado" : "Não lançado") },
            { header: "IPTU total (R$)", get: (r: typeof rows[number]) => r.valorTotal },
            { header: "Cota única (R$)", get: (r: typeof rows[number]) => r.valorCotaUnica },
            { header: "Débitos anteriores (R$)", get: (r: typeof rows[number]) => r.debitosAnteriores.reduce((a, d) => a + debitoTotal(d), 0) },
            { header: "Dívida ativa", get: (r: typeof rows[number]) => (r.debitosAnteriores.some((d) => d.dividaAtiva) ? "Sim" : "Não") },
            { header: "CND", get: (r: typeof rows[number]) => cndLabel[r.cnd] },
            { header: "Origem do dado", get: (r: typeof rows[number]) => r.origem },
          ],
          rows,
        },
        {
          sheetName: "Parcelas",
          columns: [
            { header: "Ativo", get: (p: any) => p.building },
            { header: "Parcela", get: (p: any) => p.numero },
            { header: "Vencimento", get: (p: any) => p.vencimento },
            { header: "Valor (R$)", get: (p: any) => p.valor },
            { header: "Status", get: (p: any) => parcelaStatusLabel[p.status as ParcelaStatus] },
          ],
          rows: rows.flatMap((r) => r.parcelas.map((p) => ({ ...p, building: r.building }))),
        },
      ],
    });
    toast.success("Planilha de IPTU exportada");
  };

  return (
    <div className="space-y-5">
      {/* Header + ações */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Landmark size={16} /> IPTU por ativo
          </h2>
          <p className="text-xs text-muted-foreground">
            Cadastro municipal, exercício {competenciaLabel(competencia)}, dívida ativa e certidões
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => toast.info("Sincronização com a prefeitura pendente de credencial de acesso")}
          >
            <RefreshCw size={14} /> Sincronizar prefeitura
          </Button>
          <Button size="sm" className="gap-2" onClick={handleExport}>
            <Download size={14} /> Exportar Excel
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <Select value={competencia} onValueChange={setCompetencia}>
          <SelectTrigger className="w-[150px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            {COMPETENCIAS.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={ativo} onValueChange={setAtivo}>
          <SelectTrigger className="w-[220px] h-9 text-sm"><SelectValue placeholder="Ativo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os ativos</SelectItem>
            {getHGRE11PortfolioBuildings().map((b) => (
              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="w-[170px] h-9 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="pago">Com parcelas pagas</SelectItem>
            <SelectItem value="a_vencer">Com parcelas a vencer</SelectItem>
            <SelectItem value="em_atraso">Com parcelas em atraso</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "IPTU emitido no exercício", value: brl(totalEmitido) },
          { label: "Parcelas em atraso", value: `${emAtraso.length}` },
          { label: "Débitos de exercícios anteriores", value: brl(debitosAnteriores) },
          { label: "Ativos em dívida ativa", value: `${dividaAtiva.length} de ${rows.length}` },
          { label: "CNDs pendentes", value: `${cndPendentes.length}` },
        ].map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{k.label}</p>
              <p className="text-lg font-bold text-foreground mt-1">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
      {/* Lista por ativo */}
      <div className="min-w-0 space-y-3">
        {visible.map((r) => {
          const debitos = r.debitosAnteriores.reduce((a, d) => a + debitoTotal(d), 0);
          const atrasadas = r.parcelas.filter((p) => p.status === "em_atraso").length;
          return (
            <Collapsible key={r.buildingId}>
              <Card>
                <CollapsibleTrigger className="w-full text-left">
                  <div className="p-4 flex items-start justify-between gap-3 flex-wrap hover:bg-muted/40">
                    <div className="text-left">
                      <p className="font-semibold text-foreground flex items-center gap-2">
                        <Building2 size={15} /> {r.building}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {r.municipio}/{r.uf} — Inscrição {r.inscricao} · Construída {num(r.areaConstruidaM2)} m² · Terreno {num(r.areaTerrenoM2)} m²
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">{r.lancado ? `Lançado em ${r.dataLancamento}` : "Não lançado"}</Badge>
                      <Badge variant="outline">{brl(r.valorTotal)}</Badge>
                      {atrasadas > 0 && <Badge className="bg-red-100 text-red-700">{atrasadas} em atraso</Badge>}
                      {debitos > 0 && <Badge className="bg-amber-100 text-amber-700">Débitos {brl(debitos)}</Badge>}
                      <Badge className={cndClass[r.cnd]}>{cndLabel[r.cnd]}</Badge>
                      <ChevronDown size={16} className="text-muted-foreground" />
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-5">
                    {/* 1. Cadastro + 2. Situação do exercício */}
                    <div className="grid md:grid-cols-4 gap-3 text-sm text-left">
                      {[
                        { l: "Valor venal", v: brl(r.valorVenal) },
                        { l: "Alíquota", v: `${r.aliquota.toFixed(1)}%` },
                        { l: "Total emitido", v: brl(r.valorTotal) },
                        { l: "Cota única (com desconto)", v: brl(r.valorCotaUnica) },
                      ].map((c) => (
                        <div key={c.l} className="rounded-lg border p-3">
                          <p className="text-xs text-muted-foreground">{c.l}</p>
                          <p className="font-semibold text-foreground mt-0.5">{c.v}</p>
                        </div>
                      ))}
                    </div>

                    {/* Calendário de parcelamento */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2 text-left">
                        Calendário de parcelamento ({r.parcelas.length} parcelas)
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                        {r.parcelas.map((p) => (
                          <div key={p.numero} className="rounded-lg border p-2.5 text-left">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-medium">Parcela {p.numero}</span>
                              <Badge className={`${parcelaStatusClass[p.status]} text-[10px] px-1.5`}>
                                {parcelaStatusLabel[p.status]}
                              </Badge>
                            </div>
                            <p className="text-sm font-semibold mt-1">{brl(p.valor)}</p>
                            <p className="text-[11px] text-muted-foreground">Venc. {p.vencimento}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 3. Débitos e dívida ativa */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2 text-left flex items-center gap-1.5">
                        <Scale size={13} /> Débitos de exercícios anteriores e dívida ativa
                      </p>
                      {r.debitosAnteriores.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-left">Nenhum débito pendente de exercícios anteriores.</p>
                      ) : (
                        <div className="divide-y rounded-lg border">
                          {r.debitosAnteriores.map((d) => (
                            <div key={d.exercicio} className="p-3 grid sm:grid-cols-6 gap-2 text-sm text-left">
                              <span className="font-medium">Exercício {d.exercicio}</span>
                              <span>Principal {brl(d.principal)}</span>
                              <span>Multa {brl(d.multa)}</span>
                              <span>Juros {brl(d.juros)}</span>
                              <span>Correção {brl(d.correcao)}</span>
                              <span className="flex items-center gap-2">
                                <strong>{brl(debitoTotal(d))}</strong>
                                {d.dividaAtiva && <Badge className="bg-red-100 text-red-700">{d.processo}</Badge>}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 4. Certidões */}
                    <div className="flex items-center gap-3 flex-wrap text-sm">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <FileCheck2 size={14} /> Certidão Negativa de Débitos:
                      </span>
                      <Badge className={cndClass[r.cnd]}>{cndLabel[r.cnd]}</Badge>
                      <span className="text-xs text-muted-foreground">Validade: {r.cndValidade}</span>
                      <span className="text-xs text-muted-foreground">· Origem: {r.origem}</span>
                    </div>

                    {r.alertas.length > 0 && (
                      <div className="space-y-1.5">
                        {r.alertas.map((a, idx) => (
                          <p key={idx} className="text-sm text-left flex items-start gap-2">
                            <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
                            <span><strong>{a.titulo}:</strong> {a.detalhe} <span className="text-xs text-muted-foreground">({a.data})</span></span>
                          </p>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
        {visible.length === 0 && (
          <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhum lançamento de IPTU para o filtro.</CardContent></Card>
        )}
      </div>

      {/* Painel lateral de alertas fiscais */}
      {(alertas.length > 0 || dividaAtiva.length > 0) && (
        <Card className="min-w-0 overflow-hidden xl:sticky xl:top-4">
          <CardHeader className="border-b bg-accent/5 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bell size={15} className="text-accent" /> Alertas ativos
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge className="bg-accent text-accent-foreground">{alertas.length + dividaAtiva.length}</Badge>
                <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 text-xs">
                  Ver todos <ChevronRight size={13} />
                </Button>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">Fiscal e notificações das prefeituras</p>
          </CardHeader>
          <ScrollArea className="h-[520px] max-h-[65vh]">
            <CardContent className="divide-y p-0">
              {dividaAtiva.map((r) => (
                <div key={`da-${r.buildingId}`} className="flex items-start gap-2.5 px-4 py-3 text-left">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-destructive" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <AlertTriangle size={12} className="text-destructive" /> Dívida ativa
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {r.building} — {r.debitosAnteriores.filter((d) => d.dividaAtiva).map((d) => d.processo).join(", ")}
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground">{r.municipio}/{r.uf}</p>
                  </div>
                </div>
              ))}
              {alertas.map((a, idx) => (
                <div key={`${a.building}-${a.tipo}-${idx}`} className="flex items-start gap-2.5 px-4 py-3 text-left">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${a.severidade === "alta" ? "bg-destructive" : "bg-accent"}`} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <AlertTriangle size={12} className={a.severidade === "alta" ? "text-destructive" : "text-accent"} /> {a.titulo}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{a.detalhe}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">{a.building} · {a.data}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </ScrollArea>
        </Card>
      )}
      </div>

      <p className="text-xs text-muted-foreground text-left">
        Dados do controle interno da plataforma. Ao habilitar a integração com as prefeituras, os lançamentos capturados
        automaticamente passam a ser identificados na coluna de origem.
      </p>
    </div>
  );
};

export default IptuTab;
