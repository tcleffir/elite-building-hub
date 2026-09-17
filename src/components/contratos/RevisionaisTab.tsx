import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Scale, AlertCircle, CheckCircle2, RefreshCcw, Upload, Info, History, FileText, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { toast } from "sonner";
import type { TenantContract } from "@/lib/mock-data";
import {
  mockAlteracoesValor, mockRevisionais, mockHistoricoRevisionais,
  motivoLabels, motivoDescricoes,
  calcRevisionalRow, statusLabels, statusBadgeColor, statusBarColor,
  statusRevisionalLabels, statusRevisionalColor, tipoAlteracaoLabels,
  revisionalStatusOptions,
  type Revisional, type RevisionalMotivo, type RevisionalRow, type AlteracaoValor,
  type RevisionalStatus,
} from "@/lib/revisionais-data";

interface Props {
  tenantContracts: TenantContract[];
  buildings: { id: string; name: string }[];
}

function fmtDate(d: string) {
  return format(new Date(d), "dd/MM/yyyy", { locale: ptBR });
}
function fmtBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);
}

export default function RevisionaisTab({ tenantContracts, buildings }: Props) {
  const [revisionais, setRevisionais] = useState<Revisional[]>(mockRevisionais);
  const [onlyEligible, setOnlyEligible] = useState(false);
  const [dialogContractId, setDialogContractId] = useState<string | null>(null);
  const [historyContractId, setHistoryContractId] = useState<string | null>(null);

  // Form state
  const [formMotivo, setFormMotivo] = useState<RevisionalMotivo>("desvalorizacao_imovel");
  const [formStatus, setFormStatus] = useState<RevisionalStatus>("em_analise");
  const [formDescricao, setFormDescricao] = useState("");
  const [formValor, setFormValor] = useState("");
  const [formArquivos, setFormArquivos] = useState<File[]>([]);

  const rows: (RevisionalRow & { contract: TenantContract })[] = useMemo(() => {
    const data = tenantContracts
      .filter(c => c.contract_start)
      .map(c => ({
        ...calcRevisionalRow(c.id, c.contract_start!, mockAlteracoesValor, revisionais),
        contract: c,
      }));
    const filtered = onlyEligible
      ? data.filter(r => r.status === "elegivel")
      : data;
    // Ordenar: elegíveis primeiro, depois por meses_restantes asc
    return filtered.sort((a, b) => {
      const aElig = a.status === "elegivel" ? 0 : 1;
      const bElig = b.status === "elegivel" ? 0 : 1;
      if (aElig !== bElig) return aElig - bElig;
      return a.meses_restantes - b.meses_restantes;
    });
  }, [tenantContracts, revisionais, onlyEligible]);

  const kpis = useMemo(() => {
    const all = tenantContracts
      .filter(c => c.contract_start)
      .map(c => calcRevisionalRow(c.id, c.contract_start!, mockAlteracoesValor, revisionais));
    return {
      elegivel: all.filter(r => r.status === "elegivel").length,
      reiniciado: all.filter(r => r.status === "prazo_reiniciado").length,
      solicitada: all.filter(r => r.status === "revisional_solicitada").length,
      andamento: all.filter(r => r.status === "em_andamento").length,
    };
  }, [tenantContracts, revisionais]);

  const dialogContract = dialogContractId ? tenantContracts.find(c => c.id === dialogContractId) : null;

  const resetForm = () => {
    setFormMotivo("desvalorizacao_imovel");
    setFormStatus("em_analise");
    setFormDescricao("");
    setFormValor("");
    setFormArquivos([]);
  };

  const handleOpenDialog = (contractId: string) => {
    resetForm();
    setDialogContractId(contractId);
  };

  const handleSubmitRevisional = () => {
    if (!dialogContractId) return;
    if (!formDescricao.trim()) {
      toast.error("Descreva o caso antes de enviar.");
      return;
    }
    const valor = parseFloat(formValor.replace(/\./g, "").replace(",", "."));
    if (!valor || valor <= 0) {
      toast.error("Informe um valor pleiteado válido.");
      return;
    }
    const nova: Revisional = {
      id: `rv-${Date.now()}`,
      contrato_id: dialogContractId,
      data_solicitacao: new Date().toISOString().slice(0, 10),
      motivo: formMotivo,
      descricao: formDescricao,
      valor_pleiteado: valor,
      status: formStatus,
    };
    setRevisionais(prev => [...prev, nova]);
    toast.success(`Revisional registrada como "${statusRevisionalLabels[formStatus]}".`);
    setDialogContractId(null);
    resetForm();
  };

  return (
    <TooltipProvider>
      {/* KPIs resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiMini label="Elegíveis" value={kpis.elegivel} color="text-emerald-600" icon={<CheckCircle2 size={16} />} />
        <KpiMini label="Em andamento" value={kpis.andamento} color="text-slate-600" icon={<Scale size={16} />} />
        <KpiMini label="Prazo reiniciado" value={kpis.reiniciado} color="text-amber-600" icon={<RefreshCcw size={16} />} />
        <KpiMini label="Revisional solicitada" value={kpis.solicitada} color="text-blue-600" icon={<AlertCircle size={16} />} />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 ml-auto">
          <Label htmlFor="only-eligible" className="text-sm text-muted-foreground">Ver só elegíveis</Label>
          <Switch id="only-eligible" checked={onlyEligible} onCheckedChange={setOnlyEligible} />
        </div>
      </div>

      {/* Lista SLA */}
      <Card>
        <CardContent className="p-0 divide-y">
          {rows.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Nenhum contrato encontrado com os filtros atuais.
            </div>
          )}
          {rows.map(row => {
            const bldg = buildings.find(b => b.id === row.contract.building_id);
            const isEligible = row.status === "elegivel";
            return (
              <div key={row.contract.id} className="p-4 md:p-5 hover:bg-muted/30 transition-colors">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                  {/* Locatário */}
                  <div className="md:col-span-3">
                    <button
                      onClick={() => setHistoryContractId(row.contract.id)}
                      className="font-semibold text-foreground hover:text-primary hover:underline text-left flex items-center gap-1.5 group"
                      title="Ver histórico de revisionais"
                    >
                      {row.contract.tenant_name}
                      <History size={12} className="opacity-0 group-hover:opacity-60 transition-opacity" />
                    </button>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {bldg?.name} · {row.contract.unit_id}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Valor atual: {fmtBRL(row.contract.area_m2 * row.contract.price_per_m2)}/mês
                    </p>
                  </div>

                  {/* Datas */}
                  <div className="md:col-span-2 text-xs">
                    <div className="text-muted-foreground">Assinatura</div>
                    <div className="font-medium text-foreground">{fmtDate(row.data_assinatura)}</div>
                    {row.prazo_reiniciado && (
                      <div className="mt-1">
                        <div className="text-amber-600 flex items-center gap-1">
                          <RefreshCcw size={11} /> Reiniciado
                        </div>
                        <div className="font-medium text-amber-700">{fmtDate(row.data_base)}</div>
                      </div>
                    )}
                  </div>

                  {/* Barra SLA */}
                  <div className="md:col-span-4">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help">
                          <div className="relative h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full ${statusBarColor[row.status]} transition-all`}
                              style={{ width: `${row.progresso * 100}%` }}
                            />
                            {/* Marcador "hoje" */}
                            <div
                              className="absolute top-0 h-full w-0.5 bg-foreground/70"
                              style={{ left: `${row.progresso * 100}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                            <span>0m</span>
                            <span>18m</span>
                            <span>36m</span>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs space-y-0.5">
                          <div><strong>Data-base:</strong> {fmtDate(row.data_base)}</div>
                          <div><strong>Decorridos:</strong> {row.meses_decorridos} meses</div>
                          <div><strong>Restantes:</strong> {row.meses_restantes} meses</div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Tempo + status */}
                  <div className="md:col-span-2 text-sm">
                    {isEligible ? (
                      <div className="font-semibold text-emerald-600">Elegível</div>
                    ) : row.status === "revisional_solicitada" ? (
                      <div className="text-blue-600 font-medium">Em análise</div>
                    ) : (
                      <div>
                        <div className="font-semibold text-foreground">faltam {row.meses_restantes} meses</div>
                        <div className="text-[11px] text-muted-foreground">{row.meses_decorridos}/36 m</div>
                      </div>
                    )}
                    <Badge variant="outline" className={`mt-1 text-[10px] ${statusBadgeColor[row.status]}`}>
                      {statusLabels[row.status]}
                    </Badge>
                  </div>

                  {/* Ação */}
                  <div className="md:col-span-1 flex md:justify-end">
                    {isEligible && (
                      <Button size="sm" className="whitespace-nowrap" onClick={() => handleOpenDialog(row.contract.id)}>
                        Registrar revisional
                      </Button>
                    )}
                    {row.status === "revisional_solicitada" && row.revisional && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setHistoryContractId(row.contract.id)}
                        title="Ver detalhes e histórico"
                      >
                        <History size={14} className="mr-1" /> Ver
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Dialog: Registrar revisional */}
      <Dialog open={!!dialogContractId} onOpenChange={(o) => !o && setDialogContractId(null)}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Registrar revisional</DialogTitle>
            <DialogDescription>
              {dialogContract && (
                <>Contrato: <strong>{dialogContract.tenant_name}</strong> — {dialogContract.unit_id}</>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm">Motivo</Label>
              <Select value={formMotivo} onValueChange={(v: RevisionalMotivo) => setFormMotivo(v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(motivoLabels) as RevisionalMotivo[]).map(m => (
                    <SelectItem key={m} value={m}>{motivoLabels[m]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">{motivoDescricoes[formMotivo]}</p>
            </div>

            <div>
              <Label className="text-sm">Status</Label>
              <Select value={formStatus} onValueChange={(v: RevisionalStatus) => setFormStatus(v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {revisionalStatusOptions.map(s => (
                    <SelectItem key={s} value={s}>{statusRevisionalLabels[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Acompanhe a evolução: Elegível → Em análise → Negociação iniciada → Proposta enviada → Acordo → Encerrada.
              </p>
            </div>


            <div>
              <Label className="text-sm">Descrição do caso</Label>
              <Textarea
                className="mt-1"
                rows={4}
                placeholder="Detalhe os fatos que justificam a revisional…"
                value={formDescricao}
                onChange={(e) => setFormDescricao(e.target.value)}
              />
            </div>

            <div>
              <Label className="text-sm">Valor pleiteado (R$/mês)</Label>
              <Input
                className="mt-1"
                placeholder="Ex.: 150.000"
                value={formValor}
                onChange={(e) => setFormValor(e.target.value)}
              />
            </div>

            <div>
              <Label className="text-sm">Anexos</Label>
              <label className="mt-1 flex items-center gap-2 border border-dashed rounded-lg p-3 cursor-pointer hover:bg-muted/40">
                <Upload size={14} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {formArquivos.length > 0
                    ? `${formArquivos.length} arquivo(s) selecionado(s)`
                    : "Selecionar laudos, fotos, comprovantes…"}
                </span>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => setFormArquivos(Array.from(e.target.files || []))}
                />
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogContractId(null)}>Cancelar</Button>
            <Button onClick={handleSubmitRevisional}>Registrar revisional</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Histórico de Revisionais e Alterações de Valor */}
      <HistoricoDialog
        contractId={historyContractId}
        onClose={() => setHistoryContractId(null)}
        tenantContracts={tenantContracts}
        buildings={buildings}
        revisionaisAtivas={revisionais}
      />
    </TooltipProvider>
  );
}

function KpiMini({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className={color}>{icon}</span>
        </div>
        <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
// Dialog: Histórico de Revisionais e Alterações de Valor
// ─────────────────────────────────────────────────────────────
interface HistoricoDialogProps {
  contractId: string | null;
  onClose: () => void;
  tenantContracts: TenantContract[];
  buildings: { id: string; name: string }[];
  revisionaisAtivas: Revisional[];
}

interface TimelineItem {
  date: string;
  type: 'assinatura' | 'alteracao' | 'revisional';
  label: string;
  icon: React.ReactNode;
  color: string;
  detail?: React.ReactNode;
}

function HistoricoDialog({ contractId, onClose, tenantContracts, buildings, revisionaisAtivas }: HistoricoDialogProps) {
  const contract = contractId ? tenantContracts.find(c => c.id === contractId) : null;
  if (!contract) return null;
  const bldg = buildings.find(b => b.id === contract.building_id);

  const alteracoes = mockAlteracoesValor.filter(a => a.contrato_id === contract.id);
  const revisionaisDoContrato: Revisional[] = [
    ...revisionaisAtivas.filter(r => r.contrato_id === contract.id),
    ...mockHistoricoRevisionais.filter(r => r.contrato_id === contract.id),
  ];

  const timeline: TimelineItem[] = [];

  if (contract.contract_start) {
    timeline.push({
      date: contract.contract_start,
      type: 'assinatura',
      label: 'Assinatura do contrato',
      icon: <FileText size={14} />,
      color: 'bg-slate-100 text-slate-700 border-slate-200',
      detail: <span className="text-xs text-muted-foreground">Valor inicial: {fmtBRL(contract.area_m2 * contract.price_per_m2)}/mês</span>,
    });
  }

  alteracoes.forEach(a => {
    const delta = a.valor_novo - a.valor_anterior;
    const pct = (delta / a.valor_anterior) * 100;
    timeline.push({
      date: a.data,
      type: 'alteracao',
      label: tipoAlteracaoLabels[a.tipo],
      icon: a.tipo === 'acordo_amigavel' ? <RefreshCcw size={14} /> : <TrendingUp size={14} />,
      color: a.tipo === 'acordo_amigavel'
        ? 'bg-amber-100 text-amber-700 border-amber-200'
        : 'bg-slate-100 text-slate-700 border-slate-200',
      detail: (
        <div className="text-xs space-y-0.5">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">{fmtBRL(a.valor_anterior)}</span>
            <span className="text-muted-foreground">→</span>
            <span className="font-medium text-foreground">{fmtBRL(a.valor_novo)}</span>
            <span className={`flex items-center gap-0.5 ${delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-rose-600' : 'text-muted-foreground'}`}>
              {delta > 0 ? <TrendingUp size={11} /> : delta < 0 ? <TrendingDown size={11} /> : <Minus size={11} />}
              {pct.toFixed(2)}%
            </span>
          </div>
          {a.observacao && <div className="text-muted-foreground italic">{a.observacao}</div>}
        </div>
      ),
    });
  });

  revisionaisDoContrato.forEach(r => {
    timeline.push({
      date: r.data_solicitacao,
      type: 'revisional',
      label: `Revisional — ${motivoLabels[r.motivo]}`,
      icon: <Scale size={14} />,
      color: statusRevisionalColor[r.status],
      detail: (
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={`text-[10px] ${statusRevisionalColor[r.status]}`}>
              {statusRevisionalLabels[r.status]}
            </Badge>
            <span className="text-muted-foreground">Pleiteado: <strong className="text-foreground">{fmtBRL(r.valor_pleiteado)}</strong></span>
            {r.valor_acordado != null && (
              <span className="text-muted-foreground">Acordado: <strong className="text-emerald-700">{fmtBRL(r.valor_acordado)}</strong></span>
            )}
          </div>
          <p className="text-muted-foreground">{r.descricao}</p>
          {r.data_conclusao && (
            <p className="text-[11px] text-muted-foreground">Concluída em {fmtDate(r.data_conclusao)}</p>
          )}
        </div>
      ),
    });
  });

  timeline.sort((a, b) => b.date.localeCompare(a.date));

  const totalRevisionais = revisionaisDoContrato.length;
  const concluidas = revisionaisDoContrato.filter(r => r.status === 'concluida').length;
  const emAnalise = revisionaisDoContrato.filter(r => r.status === 'em_analise').length;
  const rejeitadas = revisionaisDoContrato.filter(r => r.status === 'rejeitada').length;

  return (
    <Dialog open={!!contractId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[680px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History size={18} /> Histórico — {contract.tenant_name}
          </DialogTitle>
          <DialogDescription>
            {bldg?.name} · {contract.unit_id} · Assinado em {contract.contract_start ? fmtDate(contract.contract_start) : '—'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-4 gap-2 py-2">
          <div className="rounded-lg border p-2 text-center">
            <p className="text-[10px] text-muted-foreground uppercase">Total</p>
            <p className="text-lg font-bold text-foreground">{totalRevisionais}</p>
          </div>
          <div className="rounded-lg border p-2 text-center">
            <p className="text-[10px] text-muted-foreground uppercase">Em análise</p>
            <p className="text-lg font-bold text-blue-600">{emAnalise}</p>
          </div>
          <div className="rounded-lg border p-2 text-center">
            <p className="text-[10px] text-muted-foreground uppercase">Concluídas</p>
            <p className="text-lg font-bold text-emerald-600">{concluidas}</p>
          </div>
          <div className="rounded-lg border p-2 text-center">
            <p className="text-[10px] text-muted-foreground uppercase">Rejeitadas</p>
            <p className="text-lg font-bold text-rose-600">{rejeitadas}</p>
          </div>
        </div>

        <div className="relative pl-6 space-y-4 py-2">
          <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-slate-200" />
          {timeline.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhum evento registrado.</p>
          )}
          {timeline.map((item, idx) => (
            <div key={idx} className="relative">
              <div className={`absolute -left-[18px] top-0.5 w-4 h-4 rounded-full border-2 border-background flex items-center justify-center ${item.color}`}>
                <div className="scale-75">{item.icon}</div>
              </div>
              <div className="text-[11px] text-muted-foreground">{fmtDate(item.date)}</div>
              <div className="font-medium text-sm text-foreground">{item.label}</div>
              {item.detail && <div className="mt-1">{item.detail}</div>}
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
