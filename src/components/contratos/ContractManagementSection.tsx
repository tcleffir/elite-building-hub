import { useState, useMemo, useRef, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Pencil, Plus, FileText, Upload, History, TrendingUp, RotateCcw, Info } from "lucide-react";
import { toast } from "sonner";
import type { TenantContract } from "@/lib/mock-data";
import {
  mockAditivos, aditivoTipoLabels, aditivoTipoBadgeColor,
  mockLogsEdicao, getEffectiveContract,
  type Aditivo, type AditivoTipo, type LogEdicao,
} from "@/lib/contract-management-data";
import {
  mockAlteracoesValor, tipoAlteracaoLabels,
  type AlteracaoValor, type AlteracaoValorTipo,
} from "@/lib/revisionais-data";
import HistoricoContratual from "@/components/contratos/HistoricoContratual";
import { mockBuildings } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

const USUARIO_ATUAL = 'Natalia Landi';

function fmtBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}
function fmtDate(d?: string | null) {
  if (!d) return '—';
  return format(new Date(d), 'dd/MM/yyyy');
}

interface Props {
  contract: TenantContract;
  /** força re-render do pai após mutação */
  onMutate?: () => void;
  /** abre automaticamente um fluxo ao entrar (menu contextual da tabela) */
  autoOpen?: 'edit' | 'aditivo' | null;
}

export default function ContractManagementSection({ contract, onMutate, autoOpen }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [aditivoOpen, setAditivoOpen] = useState(false);
  const [reajusteOpen, setReajusteOpen] = useState(false);
  const [tick, setTick] = useState(0);
  const bump = () => { setTick(t => t + 1); onMutate?.(); };

  useEffect(() => {
    if (autoOpen === 'edit') setEditOpen(true);
    if (autoOpen === 'aditivo') setAditivoOpen(true);
  }, [autoOpen, contract.id]);

  const effective = useMemo(
    () => getEffectiveContract(contract),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [contract.id, tick],
  );

  const aditivos = useMemo(
    () => mockAditivos.filter(a => a.contrato_id === contract.id).sort((a, b) => a.data_assinatura.localeCompare(b.data_assinatura)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [contract.id, tick],
  );

  const reajustes = useMemo(
    () => mockAlteracoesValor.filter(a => a.contrato_id === contract.id).sort((a, b) => b.data.localeCompare(a.data)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [contract.id, tick],
  );

  const logs = useMemo(
    () => mockLogsEdicao.filter(l => l.contrato_id === contract.id).sort((a, b) => b.data.localeCompare(a.data)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [contract.id, tick],
  );

  const valorBase = (contract.price_per_m2 || 0) * contract.area_m2;
  const houveAlteracaoEfetiva = effective.aditivos_aplicados > 0 || effective.reajustes_aplicados > 0;

  return (
    <div className="space-y-5">
      {/* Valores vigentes */}
      <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Valores vigentes (hoje)</span>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setEditOpen(true)}>
            <Pencil className="h-3 w-3" /> Editar contrato
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-[10px] text-muted-foreground">Área</p>
            <p className="font-semibold">{effective.area_m2.toLocaleString('pt-BR')} m²</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Aluguel/mês</p>
            <p className="font-semibold">{fmtBRL(effective.valor_mensal)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Vigência fim</p>
            <p className="font-semibold">{fmtDate(effective.vigencia_fim)}</p>
          </div>
        </div>
        {houveAlteracaoEfetiva && (
          <p className="text-[11px] text-muted-foreground flex items-center gap-1 pt-1 border-t">
            <Info className="h-3 w-3" />
            Inclui {effective.aditivos_aplicados} aditivo(s) e {effective.reajustes_aplicados} reajuste(s) sobre o valor base ({fmtBRL(valorBase)}).
          </p>
        )}
      </div>

      {/* Aditivos */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold">Aditivos</h4>
            <p className="text-[11px] text-muted-foreground">Alterações formais sobre o contrato original</p>
          </div>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setAditivoOpen(true)}>
            <Plus className="h-3 w-3" /> Adicionar aditivo
          </Button>
        </div>
        <div className="relative pl-4 border-l-2 border-border space-y-3">
          {/* contrato original */}
          <div className="relative">
            <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-primary border-2 border-background" />
            <div className="rounded-md border bg-card p-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">Contrato original</span>
                <span className="text-[10px] text-muted-foreground">{fmtDate(contract.contract_start)}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {contract.area_m2.toLocaleString('pt-BR')} m² · {fmtBRL(valorBase)}/mês · vigência até {fmtDate(contract.contract_end)}
              </p>
            </div>
          </div>
          {aditivos.map(a => (
            <div key={a.id} className="relative">
              <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-blue-500 border-2 border-background" />
              <div className="rounded-md border bg-card p-2 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">{a.numero}º Aditivo</span>
                    <Badge variant="outline" className={cn('text-[10px] h-4 px-1.5', aditivoTipoBadgeColor[a.tipo])}>
                      {aditivoTipoLabels[a.tipo]}
                    </Badge>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{fmtDate(a.data_assinatura)}</span>
                </div>
                <div className="text-[11px] text-muted-foreground space-y-0.5">
                  {a.nova_area_m2 != null && <p>Nova área: <span className="text-foreground">{a.nova_area_m2.toLocaleString('pt-BR')} m²</span></p>}
                  {a.novo_valor != null && <p>Novo valor: <span className="text-foreground">{fmtBRL(a.novo_valor)}/mês</span></p>}
                  {a.nova_vigencia_fim && <p>Nova vigência: <span className="text-foreground">até {fmtDate(a.nova_vigencia_fim)}</span></p>}
                  {a.observacao && <p className="italic">"{a.observacao}"</p>}
                  {a.documento && (
                    <p className="flex items-center gap-1 pt-1">
                      <FileText className="h-3 w-3" /> {a.documento}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
          {aditivos.length === 0 && (
            <p className="text-[11px] text-muted-foreground pl-1">Sem aditivos registrados.</p>
          )}
        </div>
      </div>

      <Separator />

      {/* Reajustes */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" /> Histórico de reajustes</h4>
            <p className="text-[11px] text-muted-foreground">Índice automático + reajustes manuais/negociados</p>
          </div>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setReajusteOpen(true)}>
            <Plus className="h-3 w-3" /> Lançar reajuste manual
          </Button>
        </div>
        <div className="space-y-1.5">
          {reajustes.map(r => {
            const delta = r.valor_anterior > 0 ? ((r.valor_novo - r.valor_anterior) / r.valor_anterior) * 100 : 0;
            const isManual = r.tipo === 'reajuste_negociado' || r.tipo === 'acordo_amigavel';
            return (
              <div key={r.id} className="flex items-center justify-between p-2 border rounded-md text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-muted-foreground tabular-nums w-20 shrink-0">{fmtDate(r.data)}</span>
                  <Badge variant="outline" className={cn('text-[10px] h-4 px-1.5', isManual ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-600 border-slate-200')}>
                    {tipoAlteracaoLabels[r.tipo]}
                  </Badge>
                  {r.observacao && <span className="text-muted-foreground truncate">{r.observacao}</span>}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-medium">{fmtBRL(r.valor_novo)}</p>
                  <p className={cn('text-[10px]', delta >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
                    {delta >= 0 ? '+' : ''}{delta.toFixed(1)}% (de {fmtBRL(r.valor_anterior)})
                  </p>
                </div>
              </div>
            );
          })}
          {reajustes.length === 0 && (
            <p className="text-[11px] text-muted-foreground">Sem reajustes registrados.</p>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground flex items-start gap-1 pt-1">
          <Info className="h-3 w-3 mt-0.5 shrink-0" />
          Reajuste negociado zera a contagem de 3 anos das revisionais. Reajuste por índice não zera.
        </p>
      </div>

      <Separator />

      {/* Histórico contratual unificado */}
      <HistoricoContratual contract={contract} refreshKey={tick} />

      <Separator />

      {/* Log de edições */}
      <Collapsible>
        <CollapsibleTrigger className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground w-full">
          <History className="h-3.5 w-3.5" />
          Ver auditoria de edições ({logs.length})
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 space-y-1.5">
          {logs.map(l => (
            <div key={l.id} className="p-2 border rounded-md text-[11px] space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-medium">{l.usuario}</span>
                <span className="text-muted-foreground">{format(new Date(l.data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
              </div>
              {l.campos_alterados.map((c, i) => (
                <p key={i} className="text-muted-foreground">
                  <span className="font-medium text-foreground">{c.campo}:</span> {c.antes} → {c.depois}
                </p>
              ))}
            </div>
          ))}
          {logs.length === 0 && <p className="text-[11px] text-muted-foreground">Nenhuma edição manual registrada.</p>}
        </CollapsibleContent>
      </Collapsible>


      {/* Dialogs */}
      <EditContractDialog
        open={editOpen} onOpenChange={setEditOpen}
        contract={contract} onSaved={bump}
      />
      <AditivoDialog
        open={aditivoOpen} onOpenChange={setAditivoOpen}
        contract={contract} onSaved={bump}
        currentValue={effective.valor_mensal}
        currentArea={effective.area_m2}
        currentEnd={effective.vigencia_fim}
        nextNumero={aditivos.length + 1}
      />
      <ReajusteManualDialog
        open={reajusteOpen} onOpenChange={setReajusteOpen}
        contract={contract} onSaved={bump}
        valorAtual={effective.valor_mensal}
      />
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// EDIT CONTRACT DIALOG
// ────────────────────────────────────────────────────────────────
function EditContractDialog({
  open, onOpenChange, contract, onSaved,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  contract: TenantContract; onSaved: () => void;
}) {
  const [tenantName, setTenantName] = useState(contract.tenant_name || '');
  const [cnpj, setCnpj] = useState(contract.tenant_cnpj || '');
  const [buildingId, setBuildingId] = useState(contract.building_id);
  const [unidade, setUnidade] = useState(contract.unit_id);
  const [area, setArea] = useState(String(contract.area_m2));
  const [precoM2, setPrecoM2] = useState(String(contract.price_per_m2 || 0));
  const [valorMensal, setValorMensal] = useState(String(Math.round((contract.price_per_m2 || 0) * contract.area_m2)));
  const [tipo, setTipo] = useState<'net' | 'gross' | 'semi-gross'>(contract.contract_type || 'net');
  const [indice, setIndice] = useState<string>(contract.indice_reajuste || (contract.contract_type === 'net' ? 'IGP-M' : 'IPCA'));
  const [periodicidade, setPeriodicidade] = useState<string>(contract.periodicidade_reajuste || 'anual');
  const [dataBase, setDataBase] = useState(contract.data_base_reajuste || contract.contract_start || '');
  const [garantia, setGarantia] = useState<string>(contract.garantia || 'Sem garantia');
  const [statusContrato, setStatusContrato] = useState<TenantContract['status']>(contract.status);
  const [diaVenc, setDiaVenc] = useState(String(contract.dia_vencimento ?? 5));
  const [condicao, setCondicao] = useState(contract.condicao_comercial || '');
  const [inicio, setInicio] = useState(contract.contract_start || '');
  const [fim, setFim] = useState(contract.contract_end || '');
  const [notes, setNotes] = useState(contract.notes || '');

  /** Mantém área × R$/m² × valor mensal coerentes */
  const onAreaChange = (v: string) => {
    setArea(v);
    const a = Number(v) || 0;
    if (a > 0 && Number(precoM2) > 0) setValorMensal(String(Math.round(a * Number(precoM2))));
  };
  const onPrecoChange = (v: string) => {
    setPrecoM2(v);
    const a = Number(area) || 0;
    if (a > 0) setValorMensal(String(Math.round(a * (Number(v) || 0))));
  };
  const onValorMensalChange = (v: string) => {
    setValorMensal(v);
    const a = Number(area) || 0;
    if (a > 0) setPrecoM2((( Number(v) || 0) / a).toFixed(2));
  };

  const handleSave = () => {
    const changes: Array<{ campo: string; antes: string; depois: string }> = [];
    const apply = <K extends keyof TenantContract>(k: K, depois: TenantContract[K], label: string) => {
      const antes = (contract as any)[k];
      if (String(antes ?? '') !== String(depois ?? '')) {
        changes.push({ campo: label, antes: String(antes ?? '—'), depois: String(depois ?? '—') });
        (contract as any)[k] = depois;
      }
    };
    apply('tenant_name', tenantName || null, 'Locatário');
    apply('tenant_cnpj', cnpj || undefined, 'CNPJ');
    apply('building_id', buildingId, 'Ativo');
    apply('unit_id', unidade, 'Unidade/Conjunto');
    apply('area_m2', Number(area) || contract.area_m2, 'Área (m²)');
    apply('price_per_m2', Number(precoM2) || null, 'R$/m²');
    apply('contract_type', tipo, 'Tipo de contrato');
    apply('indice_reajuste', indice as TenantContract['indice_reajuste'], 'Índice de reajuste');
    apply('periodicidade_reajuste', periodicidade as TenantContract['periodicidade_reajuste'], 'Periodicidade');
    apply('data_base_reajuste', dataBase || undefined, 'Data-base de reajuste');
    apply('garantia', garantia as TenantContract['garantia'], 'Garantia');
    apply('status', statusContrato, 'Status do contrato');
    apply('dia_vencimento', Number(diaVenc) || undefined, 'Dia de vencimento');
    apply('condicao_comercial', condicao || undefined, 'Condição comercial');
    apply('contract_start', inicio || undefined, 'Vigência início');
    apply('contract_end', fim || undefined, 'Vigência fim');
    apply('notes', notes || undefined, 'Observações');

    if (changes.length === 0) {
      toast.info('Nenhuma alteração detectada.');
      onOpenChange(false);
      return;
    }
    mockLogsEdicao.push({
      id: `le-${Date.now()}`,
      contrato_id: contract.id,
      usuario: USUARIO_ATUAL,
      data: new Date().toISOString(),
      campos_alterados: changes,
    });
    toast.success(`${changes.length} campo(s) atualizado(s) e registrados na auditoria.`);
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar contrato manualmente</DialogTitle>
          <DialogDescription>
            Qualquer alteração gera um registro de auditoria (data, usuário, valor anterior e novo). A leitura automática do PDF é preservada.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1">
            <Label className="text-xs">Locatário</Label>
            <Input value={tenantName} onChange={e => setTenantName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">CNPJ</Label>
            <Input value={cnpj} onChange={e => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Ativo</Label>
            <Select value={buildingId} onValueChange={setBuildingId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {mockBuildings.map(b => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Unidade / Conjunto</Label>
            <Input value={unidade} onChange={e => setUnidade(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Área locada (m²)</Label>
            <Input type="number" value={area} onChange={e => onAreaChange(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Aluguel atual (R$/mês)</Label>
            <Input type="number" value={valorMensal} onChange={e => onValorMensalChange(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Valor por m² (R$)</Label>
            <Input type="number" value={precoM2} onChange={e => onPrecoChange(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Data de início</Label>
            <Input type="date" value={inicio} onChange={e => setInicio(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Data de vencimento</Label>
            <Input type="date" value={fim} onChange={e => setFim(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Data-base de reajuste</Label>
            <Input type="date" value={dataBase} onChange={e => setDataBase(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Índice de reajuste</Label>
            <Select value={indice} onValueChange={setIndice}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="IPCA">IPCA</SelectItem>
                <SelectItem value="IGP-M">IGP-M</SelectItem>
                <SelectItem value="INPC">INPC</SelectItem>
                <SelectItem value="IGP-DI">IGP-DI</SelectItem>
                <SelectItem value="Fixo">Fixo (sem índice)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Periodicidade</Label>
            <Select value={periodicidade} onValueChange={setPeriodicidade}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="anual">Anual</SelectItem>
                <SelectItem value="semestral">Semestral</SelectItem>
                <SelectItem value="bienal">Bienal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Garantia</Label>
            <Select value={garantia} onValueChange={setGarantia}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Fiança bancária">Fiança bancária</SelectItem>
                <SelectItem value="Seguro fiança">Seguro fiança</SelectItem>
                <SelectItem value="Depósito caução">Depósito caução</SelectItem>
                <SelectItem value="Fiador">Fiador</SelectItem>
                <SelectItem value="Sem garantia">Sem garantia</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Status do contrato</Label>
            <Select value={statusContrato} onValueChange={(v: any) => setStatusContrato(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="renewal">Em renovação</SelectItem>
                <SelectItem value="termination">Em rescisão</SelectItem>
                <SelectItem value="closed">Encerrado</SelectItem>
                <SelectItem value="vacant">Vago</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Tipo de contrato</Label>
            <Select value={tipo} onValueChange={(v: any) => setTipo(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="net">Net</SelectItem>
                <SelectItem value="gross">Gross</SelectItem>
                <SelectItem value="semi-gross">Semi-gross</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Dia de vencimento</Label>
            <Input type="number" min={1} max={31} value={diaVenc} onChange={e => setDiaVenc(e.target.value)} />
          </div>
          <div className="col-span-2 space-y-1">
            <Label className="text-xs">Condição comercial</Label>
            <Input value={condicao} onChange={e => setCondicao(e.target.value)} placeholder="ex.: carência de 3 meses, degrau de aluguel no 1º ano" />
          </div>
          <div className="col-span-2 space-y-1">
            <Label className="text-xs">Observações</Label>
            <Textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


// ────────────────────────────────────────────────────────────────
// ADITIVO DIALOG
// ────────────────────────────────────────────────────────────────
function AditivoDialog({
  open, onOpenChange, contract, onSaved, currentValue, currentArea, currentEnd, nextNumero,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  contract: TenantContract; onSaved: () => void;
  currentValue: number; currentArea: number; currentEnd: string | null; nextNumero: number;
}) {
  const [tipo, setTipo] = useState<AditivoTipo>('extensao_prazo');
  const [dataAssinatura, setDataAssinatura] = useState<Date>();
  const [novaVigenciaFim, setNovaVigenciaFim] = useState<Date>();
  const [novaArea, setNovaArea] = useState('');
  const [novoValor, setNovoValor] = useState('');
  const [novoIndice, setNovoIndice] = useState('');
  const [novaGarantia, setNovaGarantia] = useState('');
  const [observacao, setObservacao] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setTipo('extensao_prazo'); setDataAssinatura(undefined);
    setNovaVigenciaFim(undefined); setNovaArea(''); setNovoValor('');
    setNovoIndice(''); setNovaGarantia('');
    setObservacao(''); setFile(null);
  };

  const handleSave = () => {
    if (!dataAssinatura) { toast.error('Informe a data de assinatura'); return; }
    const novo: Aditivo = {
      id: `ad-${Date.now()}`,
      contrato_id: contract.id,
      numero: nextNumero,
      tipo,
      data_assinatura: dataAssinatura.toISOString().slice(0, 10),
      nova_vigencia_fim: novaVigenciaFim ? novaVigenciaFim.toISOString().slice(0, 10) : undefined,
      nova_area_m2: novaArea ? Number(novaArea) : undefined,
      novo_valor: novoValor ? Number(novoValor) : undefined,
      novo_indice: novoIndice || undefined,
      nova_garantia: novaGarantia || undefined,

      observacao: observacao || undefined,
      documento: file?.name,
    };
    mockAditivos.push(novo);
    toast.success(`${nextNumero}º aditivo registrado. Valores vigentes recalculados.`);
    reset();
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Adicionar aditivo</DialogTitle>
          <DialogDescription>
            O aditivo fica vinculado ao mesmo contrato e atualiza automaticamente os valores vigentes.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Tipo *</Label>
              <Select value={tipo} onValueChange={(v: any) => setTipo(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="extensao_prazo">Extensão de prazo</SelectItem>
                  <SelectItem value="alteracao_area">Alteração de área</SelectItem>
                  <SelectItem value="alteracao_valor">Alteração de valor</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Data de assinatura *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('justify-start text-left font-normal', !dataAssinatura && 'text-muted-foreground')}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataAssinatura ? format(dataAssinatura, 'dd/MM/yyyy') : 'Selecione'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dataAssinatura} onSelect={setDataAssinatura} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {(tipo === 'extensao_prazo' || tipo === 'outro') && (
            <div className="space-y-1">
              <Label className="text-xs">Nova vigência fim (atual: {fmtDate(currentEnd)})</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !novaVigenciaFim && 'text-muted-foreground')}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {novaVigenciaFim ? format(novaVigenciaFim, 'dd/MM/yyyy') : 'Selecione a nova data'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={novaVigenciaFim} onSelect={setNovaVigenciaFim} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          )}
          {(tipo === 'alteracao_area' || tipo === 'outro') && (
            <div className="space-y-1">
              <Label className="text-xs">Nova área m² (atual: {currentArea.toLocaleString('pt-BR')})</Label>
              <Input type="number" value={novaArea} onChange={e => setNovaArea(e.target.value)} placeholder="ex.: 1850" />
            </div>
          )}
          {(tipo === 'alteracao_valor' || tipo === 'alteracao_area' || tipo === 'outro') && (
            <div className="space-y-1">
              <Label className="text-xs">Novo valor mensal R$ (atual: {fmtBRL(currentValue)})</Label>
              <Input type="number" value={novoValor} onChange={e => setNovoValor(e.target.value)} placeholder="ex.: 215000" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Novo índice (opcional)</Label>
              <Select value={novoIndice || 'manter'} onValueChange={v => setNovoIndice(v === 'manter' ? '' : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manter">Manter atual</SelectItem>
                  <SelectItem value="IPCA">IPCA</SelectItem>
                  <SelectItem value="IGP-M">IGP-M</SelectItem>
                  <SelectItem value="INPC">INPC</SelectItem>
                  <SelectItem value="IGP-DI">IGP-DI</SelectItem>
                  <SelectItem value="Fixo">Fixo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Nova garantia (opcional)</Label>
              <Select value={novaGarantia || 'manter'} onValueChange={v => setNovaGarantia(v === 'manter' ? '' : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manter">Manter atual</SelectItem>
                  <SelectItem value="Fiança bancária">Fiança bancária</SelectItem>
                  <SelectItem value="Seguro fiança">Seguro fiança</SelectItem>
                  <SelectItem value="Depósito caução">Depósito caução</SelectItem>
                  <SelectItem value="Fiador">Fiador</SelectItem>
                  <SelectItem value="Sem garantia">Sem garantia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>



          <div className="space-y-1">
            <Label className="text-xs">Documento do aditivo</Label>
            <input ref={fileRef} type="file" accept=".pdf,.docx" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
            <div
              className="border-2 border-dashed rounded-md p-3 text-center cursor-pointer hover:bg-muted/40 text-xs text-muted-foreground"
              onClick={() => fileRef.current?.click()}
            >
              {file ? <span className="flex items-center justify-center gap-1"><FileText className="h-3.5 w-3.5" /> {file.name}</span> : <span className="flex items-center justify-center gap-1"><Upload className="h-3.5 w-3.5" /> Anexar PDF/DOCX</span>}
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Observação</Label>
            <Textarea rows={2} value={observacao} onChange={e => setObservacao(e.target.value)} placeholder="Contexto/justificativa do aditivo" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar aditivo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ────────────────────────────────────────────────────────────────
// REAJUSTE MANUAL DIALOG
// ────────────────────────────────────────────────────────────────
function ReajusteManualDialog({
  open, onOpenChange, contract, onSaved, valorAtual,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  contract: TenantContract; onSaved: () => void; valorAtual: number;
}) {
  const [data, setData] = useState<Date>();
  const [modo, setModo] = useState<'valor' | 'percentual'>('valor');
  const [novoValor, setNovoValor] = useState('');
  const [percentual, setPercentual] = useState('');
  const [tipo, setTipo] = useState<AlteracaoValorTipo>('reajuste_negociado');
  const [observacao, setObservacao] = useState('');

  const valorCalculado = useMemo(() => {
    if (modo === 'valor') return Number(novoValor) || 0;
    const pct = Number(percentual) || 0;
    return Math.round(valorAtual * (1 + pct / 100));
  }, [modo, novoValor, percentual, valorAtual]);

  const handleSave = () => {
    if (!data) { toast.error('Informe a data de vigência'); return; }
    if (valorCalculado <= 0) { toast.error('Informe o novo valor ou percentual'); return; }
    const nova: AlteracaoValor = {
      id: `av-${Date.now()}`,
      contrato_id: contract.id,
      data: data.toISOString().slice(0, 10),
      tipo,
      valor_anterior: valorAtual,
      valor_novo: valorCalculado,
      observacao: observacao || undefined,
    };
    mockAlteracoesValor.push(nova);
    const msg = tipo === 'reajuste_negociado'
      ? 'Reajuste negociado lançado. Prazo de 3 anos das revisionais foi reiniciado.'
      : 'Reajuste lançado no histórico.';
    toast.success(msg);
    setData(undefined); setNovoValor(''); setPercentual(''); setObservacao('');
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Lançar reajuste manual</DialogTitle>
          <DialogDescription>
            Reajuste negociado reinicia o prazo de 3 anos das revisionais. Reajuste por índice não reinicia.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Data de vigência *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('justify-start text-left font-normal', !data && 'text-muted-foreground')}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {data ? format(data, 'dd/MM/yyyy') : 'Selecione'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={data} onSelect={setData} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tipo</Label>
              <Select value={tipo} onValueChange={(v: any) => setTipo(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="reajuste_negociado">Negociado (zera 3 anos)</SelectItem>
                  <SelectItem value="reajuste_indice">Índice (não zera)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant={modo === 'valor' ? 'default' : 'outline'} onClick={() => setModo('valor')}>Por valor</Button>
            <Button size="sm" variant={modo === 'percentual' ? 'default' : 'outline'} onClick={() => setModo('percentual')}>Por %</Button>
          </div>
          {modo === 'valor' ? (
            <div className="space-y-1">
              <Label className="text-xs">Novo valor mensal R$ (atual: {fmtBRL(valorAtual)})</Label>
              <Input type="number" value={novoValor} onChange={e => setNovoValor(e.target.value)} />
            </div>
          ) : (
            <div className="space-y-1">
              <Label className="text-xs">Percentual (ex.: 5 ou -5)</Label>
              <Input type="number" value={percentual} onChange={e => setPercentual(e.target.value)} />
              <p className="text-[11px] text-muted-foreground">Novo valor estimado: <span className="font-medium text-foreground">{fmtBRL(valorCalculado)}</span></p>
            </div>
          )}
          <div className="space-y-1">
            <Label className="text-xs">Observação</Label>
            <Textarea rows={2} value={observacao} onChange={e => setObservacao(e.target.value)} placeholder="Motivo / contexto do reajuste" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} className="gap-1">
            <RotateCcw className="h-3.5 w-3.5" /> Lançar reajuste
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
