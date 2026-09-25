// ============================================================================
// STACKING PLAN — visualização andar por andar (ou galpão por galpão) com
// divisão lado a lado quando o pavimento tem mais de um locatário.
// Traz áreas BOMA e NBR, custo por m² (aluguel, IPTU, condomínio), garantia,
// contato do locatário, histórico da unidade e chamados/alertas.
// ============================================================================
import { useMemo, useState } from "react";
import { Building2, FileText, Mail, Phone, Ticket as TicketIcon, User, History, Ruler } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatusBadge from "@/components/StatusBadge";
import { getContractHealth, daysUntil, healthColors, healthLabels } from "@/lib/health-utils";
import { getUnitStackingData } from "@/lib/stacking-plan-data";
import type { TenantContract } from "@/lib/mock-data";

const brl = (v: number) => `R$ ${Math.round(v).toLocaleString("pt-BR")}`;
const brl2 = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface Ticket { id: string; title: string; category?: string; status: string; priority?: string; floor?: number; created_at: string }

interface Props {
  buildingName: string;
  totalFloors?: number;
  contracts: TenantContract[];
  tickets?: Ticket[];
  /** rótulo do nível: andar (escritório) ou conjunto (logístico) */
  levelLabel?: "andar" | "conjunto";
  onOpenContract?: (c: TenantContract) => void;
}

const floorOf = (unitId: string) => {
  const digits = unitId.replace(/\D/g, "");
  if (!digits) return 1;
  return digits.length >= 3 ? parseInt(digits.slice(0, digits.length - 2)) || 1 : parseInt(digits.charAt(0)) || 1;
};

import { floorOfContract } from "@/lib/mock-data";

const StackingPlan = ({ buildingName, totalFloors, contracts, tickets = [], levelLabel = "andar", onOpenContract }: Props) => {
  const [selected, setSelected] = useState<TenantContract | null>(null);

  const floors = useMemo(() => {
    const map = new Map<number, TenantContract[]>();
    contracts.forEach((c) => {
      const f = floorOfContract(c);
      if (!map.has(f)) map.set(f, []);
      map.get(f)!.push(c);
    });
    const maxFloor = Math.max(...Array.from(map.keys()), 0);
    const upTo = Math.max(maxFloor, Math.min(totalFloors || maxFloor, 25));
    for (let f = 1; f <= upTo; f++) if (!map.has(f)) map.set(f, []);
    return Array.from(map.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([floor, units]) => ({
        floor,
        units: units.sort((a, b) => a.unit_id.localeCompare(b.unit_id)),
        area: units.reduce((s, u) => s + u.area_m2, 0),
        tickets: tickets.filter((t) => t.floor === floor).length,
      }));
  }, [contracts, totalFloors, tickets]);

  const totals = useMemo(() => {
    const rows = contracts.map((c) => ({ c, d: getUnitStackingData(c) }));
    const nbr = rows.reduce((s, r) => s + r.d.areaNbr, 0);
    const boma = rows.reduce((s, r) => s + r.d.areaBoma, 0);
    const ocupada = rows.filter((r) => r.c.status !== "vacant").reduce((s, r) => s + r.d.areaNbr, 0);
    const aluguel = rows.filter((r) => r.c.status !== "vacant").reduce((s, r) => s + r.d.areaNbr * r.d.aluguelM2, 0);
    const iptu = rows.reduce((s, r) => s + r.d.areaNbr * r.d.iptuM2, 0);
    const cond = rows.reduce((s, r) => s + r.d.areaNbr * r.d.condominioM2, 0);
    return { nbr, boma, ocupada, aluguel, iptu, cond, aluguelM2: ocupada ? aluguel / ocupada : 0 };
  }, [contracts]);

  const unitColor = (c: TenantContract) => {
    if (c.status === "vacant" || !c.tenant_name) return "bg-muted border-border text-muted-foreground";
    const health = c.contract_end ? getContractHealth(c.contract_end) : "healthy";
    if (health === "critical") return "bg-rose-50 border-rose-300 text-rose-800 dark:bg-rose-950/30 dark:text-rose-200";
    if (health === "warning") return "bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200";
    return "bg-emerald-50 border-emerald-300 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100";
  };

  const sel = selected ? getUnitStackingData(selected) : null;
  const selTickets = selected ? tickets.filter((t) => t.floor === floorOfContract(selected)) : [];

  return (
    <div className="space-y-4">
      {/* Resumo de áreas e custos */}
      <div className="grid grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          { l: "Área NBR 12721", v: `${totals.nbr.toLocaleString("pt-BR")} m²` },
          { l: "Área BOMA (rentável)", v: `${totals.boma.toLocaleString("pt-BR")} m²` },
          { l: "Área ocupada", v: `${totals.ocupada.toLocaleString("pt-BR")} m²` },
          { l: "Aluguel médio", v: `${brl2(totals.aluguelM2)}/m²` },
          { l: "IPTU", v: `${brl(totals.iptu)}/mês` },
          { l: "Condomínio", v: `${brl(totals.cond)}/mês` },
        ].map((k) => (
          <div key={k.l} className="rounded-xl border bg-card p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{k.l}</p>
            <p className="text-sm font-semibold text-foreground">{k.v}</p>
          </div>
        ))}
      </div>

      {/* Empilhamento */}
      <div className="rounded-2xl border bg-card p-4 md:p-6">
        <p className="text-xs text-muted-foreground mb-3">
          {buildingName} — clique em uma área para ver locatário, áreas BOMA/NBR, custos, contato e histórico.
        </p>
        <div className="flex flex-col gap-1">
          <div className="h-3 rounded-t-xl premium-gradient" />
          {floors.map((f) => (
            <div key={f.floor} className="flex items-stretch gap-1.5 sm:gap-2">
              <div className="w-10 shrink-0 flex items-center justify-center rounded-md bg-muted/60 text-xs font-bold text-foreground sm:w-14">
                {f.floor}º
              </div>
              {f.units.length === 0 ? (
                <div className="flex-1 rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
                  Sem unidade cadastrada neste {levelLabel}
                </div>
              ) : (
                <div className="grid min-w-0 flex-1 grid-cols-1 gap-1 sm:flex">
                  {f.units.map((u) => {
                    const d = getUnitStackingData(u);
                    const isVacant = u.status === "vacant" || !u.tenant_name;
                    return (
                      <button
                        key={u.id}
                        onClick={() => setSelected(u)}
                        style={{ flexGrow: Math.max(u.area_m2, 1), flexBasis: 0 }}
                        className={`min-h-11 min-w-[60px] rounded-md border px-2.5 py-2 text-left transition-all hover:shadow-md ${unitColor(u)}`}
                      >
                        <p className="text-[11px] font-semibold truncate">
                          {isVacant ? "DISPONÍVEL" : u.tenant_name}
                        </p>
                        <p className="text-[10px] opacity-80 truncate">
                          {u.unit_id} · {d.areaNbr.toLocaleString("pt-BR")} m² NBR · {d.areaBoma.toLocaleString("pt-BR")} m² BOMA
                        </p>
                        <p className="text-[10px] opacity-80 truncate">
                          {isVacant ? "Sem receita" : `${brl2(d.aluguelM2)}/m² · ${brl(d.areaNbr * d.aluguelM2)}/mês`}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
              <div className="hidden w-16 shrink-0 items-center justify-end sm:flex">
                {f.tickets > 0 && (
                  <span className="text-[10px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-full">
                    {f.tickets} chamado{f.tickets > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          ))}
          <div className="h-4 rounded-b-xl bg-foreground/10 flex items-center justify-center">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Base / Térreo</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mt-4 text-xs">
          {[
            { l: "Contrato saudável", c: "bg-emerald-100 border-emerald-300" },
            { l: "Vence em até 12 meses", c: "bg-amber-100 border-amber-300" },
            { l: "Crítico / vencido", c: "bg-rose-100 border-rose-300" },
            { l: "Vago", c: "bg-muted border-border" },
          ].map((l) => (
            <span key={l.l} className="flex items-center gap-2">
              <span className={`w-4 h-4 rounded border ${l.c}`} /> {l.l}
            </span>
          ))}
        </div>
      </div>

      {/* Detalhe da unidade */}
      <Sheet open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <SheetContent side="center" className="overflow-y-auto p-0">
          {selected && sel && (
            <>
              <div className="sticky top-0 z-10 bg-card border-b p-5">
                <SheetHeader>
                  <SheetTitle className="text-left flex items-center gap-2">
                    {selected.unit_id} — {selected.tenant_name || "Área disponível"}
                  </SheetTitle>
                </SheetHeader>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge variant="secondary" className="text-[10px]">{floorOfContract(selected)}º {levelLabel}</Badge>
                  {selected.contract_end ? (
                    <Badge className={`${healthColors[getContractHealth(selected.contract_end)].badge} text-[10px]`}>
                      {healthLabels[getContractHealth(selected.contract_end)].pt} · {daysUntil(selected.contract_end)}d
                    </Badge>
                  ) : (
                    <Badge className="bg-violet-100 text-violet-700 text-[10px]">Disponível para locação</Badge>
                  )}
                </div>
              </div>

              <Tabs defaultValue="areas">
                <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-5 h-auto py-0 overflow-x-auto">
                  <TabsTrigger value="areas" className="rounded-none border-b-2 border-transparent data-[state=active]:border-interactive data-[state=active]:bg-transparent py-3 text-sm">Áreas & custos</TabsTrigger>
                  <TabsTrigger value="contato" className="rounded-none border-b-2 border-transparent data-[state=active]:border-interactive data-[state=active]:bg-transparent py-3 text-sm">Contato</TabsTrigger>
                  <TabsTrigger value="historico" className="rounded-none border-b-2 border-transparent data-[state=active]:border-interactive data-[state=active]:bg-transparent py-3 text-sm">Histórico</TabsTrigger>
                  <TabsTrigger value="chamados" className="rounded-none border-b-2 border-transparent data-[state=active]:border-interactive data-[state=active]:bg-transparent py-3 text-sm">Chamados</TabsTrigger>
                </TabsList>

                <TabsContent value="areas" className="p-5 mt-0 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { l: "Área NBR 12721", v: `${sel.areaNbr.toLocaleString("pt-BR")} m²` },
                      { l: "Área BOMA", v: `${sel.areaBoma.toLocaleString("pt-BR")} m² (fator ${sel.fatorBoma.toFixed(2).replace(".", ",")})` },
                      { l: "Aluguel", v: `${brl2(sel.aluguelM2)}/m²` },
                      { l: "Total de aluguel", v: `${brl(sel.areaNbr * sel.aluguelM2)}/mês` },
                      { l: "IPTU", v: `${brl2(sel.iptuM2)}/m² · ${brl(sel.areaNbr * sel.iptuM2)}/mês` },
                      { l: "Condomínio", v: `${brl2(sel.condominioM2)}/m² · ${brl(sel.areaNbr * sel.condominioM2)}/mês` },
                    ].map((k) => (
                      <div key={k.l} className="bg-muted/50 rounded-xl p-3">
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Ruler size={11} /> {k.l}</p>
                        <p className="text-sm font-semibold">{k.v}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl border p-3">
                    <p className="text-xs text-muted-foreground">Garantia</p>
                    <p className="text-sm font-semibold">
                      {sel.garantiaModalidade}
                      {sel.garantiaMeses > 0 && ` · ${sel.garantiaMeses} meses · ${brl(sel.garantiaValor)}`}
                    </p>
                  </div>
                  {onOpenContract && selected.tenant_name && (
                    <Button variant="outline" className="w-full gap-2 text-sm" onClick={() => { onOpenContract(selected); setSelected(null); }}>
                      <FileText size={14} /> Abrir contrato da unidade
                    </Button>
                  )}
                </TabsContent>

                <TabsContent value="contato" className="p-5 mt-0 space-y-3">
                  <div className="rounded-xl border p-4 space-y-2">
                    <p className="text-sm font-semibold flex items-center gap-2"><User size={14} /> {sel.contato.nome}</p>
                    <p className="text-xs text-muted-foreground">{sel.contato.cargo}{selected.tenant_name ? ` · ${selected.tenant_name}` : ""}</p>
                    <p className="text-sm flex items-center gap-2"><Mail size={14} className="text-muted-foreground" /> {sel.contato.email}</p>
                    <p className="text-sm flex items-center gap-2"><Phone size={14} className="text-muted-foreground" /> {sel.contato.telefone}</p>
                  </div>
                  {sel.contato.demo && (
                    <p className="text-[11px] text-muted-foreground">
                      Contato demonstrativo — será substituído pelo cadastro oficial do locatário.
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="historico" className="p-5 mt-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs text-left">Data</TableHead>
                        <TableHead className="text-xs text-left">Tipo</TableHead>
                        <TableHead className="text-xs text-left">Evento</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sel.historico.map((h, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs text-left whitespace-nowrap">{new Date(h.date).toLocaleDateString("pt-BR")}</TableCell>
                          <TableCell className="text-xs text-left"><Badge variant="secondary" className="text-[10px]">{h.tipo}</Badge></TableCell>
                          <TableCell className="text-xs text-left">{h.descricao}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <p className="text-[11px] text-muted-foreground mt-3 flex items-center gap-1">
                    <History size={11} /> Histórico demonstrativo da unidade (mudanças de locatário, obras e operações).
                  </p>
                </TabsContent>

                <TabsContent value="chamados" className="p-5 mt-0">
                  {selTickets.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Nenhum chamado neste {levelLabel}</p>
                  ) : (
                    <div className="space-y-2">
                      {selTickets.map((t) => (
                        <div key={t.id} className="flex items-center justify-between gap-2 p-3 bg-muted/50 rounded-xl">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate flex items-center gap-1"><TicketIcon size={12} /> {t.id} — {t.title}</p>
                            <p className="text-xs text-muted-foreground">{t.category}</p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            {t.priority && <StatusBadge status={t.priority} type="priority" />}
                            <StatusBadge status={t.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>

      {contracts.length === 0 && (
        <div className="flex flex-col items-center py-12 text-center">
          <Building2 size={36} className="text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">Nenhuma unidade cadastrada para este ativo</p>
        </div>
      )}
    </div>
  );
};

export default StackingPlan;
