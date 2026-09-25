import { useState, useMemo, Fragment } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  CheckCircle2, AlertTriangle, AlertOctagon, ChevronLeft, ChevronRight,
  ChevronDown, ChevronUp, Banknote, UserX, Clock, RefreshCw, Mail,
} from "lucide-react";
import { toast } from "sonner";
import {
  fundos, edificiosRec, unidadesRec, inquilinosRec, contratosRec,
  entradasBancariasSeed, vinculosSeed, gruposSeed,
  type CobrancaRec, type StatusCobranca, type SubStatus, type AcaoRegistro,
  type EntradaBancaria, type VinculoConciliacao, type GrupoCobranca,
  type AjusteMensal, type TipoAjuste,
} from "@/lib/reconciliation-data";
import {
  enrichCobranca, cobrancasSeed, isInadimplenteRecorrente, diffDias,
  calcAluguelEsperado, calcIptuEsperado, tryAutoMatch, splitGrupo,
} from "@/lib/reconciliation-engine";
import { useFinance } from "@/contexts/FinanceContext";
import { CATEGORIAS_ORDEM, CATEGORIA_META_PADRAO, type CategoriaOutroRecebimento } from "@/lib/other-receipts-data";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Link2, Upload, Plus, Trash2, Layers, FileSpreadsheet, Download, Receipt } from "lucide-react";
import { exportExcel, exportOFX, TEMPLATE_PADRAO } from "@/lib/export-service";


const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const fmt = (v: number | null | undefined) =>
  v == null ? '—' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const fmtDate = (s: string | null | undefined) =>
  !s ? '—' : new Date(s).toLocaleDateString('pt-BR');

const STATUS_META: Record<StatusCobranca, { label: string; cls: string; icon: any }> = {
  conciliado:     { label: 'Conciliado',         cls: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  divergencia:    { label: 'Divergência',        cls: 'bg-amber-100 text-amber-700',     icon: AlertTriangle },
  aberto_banco:   { label: 'Em aberto — Banco',  cls: 'bg-orange-100 text-orange-700',   icon: Banknote },
  aberto_cliente: { label: 'Em aberto — Cliente',cls: 'bg-sky-100 text-sky-700',         icon: Clock },
  inadimplente:   { label: 'Inadimplente',       cls: 'bg-rose-100 text-rose-700',       icon: UserX },
  antecipado:     { label: 'Antecipado',         cls: 'bg-violet-100 text-violet-700',   icon: CheckCircle2 },
};

const SUBSTATUS_LABEL: Record<NonNullable<SubStatus>, string> = {
  contestado_banco: 'Contestado (aguardando Banco)',
  cobranca_preparada: 'Cobrança preparada',

  cobranca_banco: 'Em cobrança (Banco)',
  cobranca_cliente: 'Em cobrança (cliente)',
  cobranca_juridica: 'Em cobrança jurídica',
  antecipacao_confirmada: 'Antecipação confirmada',
  credito_aceito: 'Crédito aceito (abate mês seguinte)',
  divergencia_aceita: 'Divergência aceita',
  divergencia_cobrada: 'Divergência cobrada do cliente',
};

const ACTION_BY_STATUS: Partial<Record<StatusCobranca, { label: string; sub: NonNullable<SubStatus> }>> = {
  divergencia:    { label: 'Notificar Banco',              sub: 'contestado_banco' },
  aberto_banco:   { label: 'Preparar cobrança',             sub: 'cobranca_preparada' },
  aberto_cliente: { label: 'Reenviar cobrança ao cliente', sub: 'cobranca_cliente' },
  inadimplente:   { label: 'Enviar para jurídico',         sub: 'cobranca_juridica' },
  antecipado:     { label: 'Confirmar antecipação',        sub: 'antecipacao_confirmada' },
};

const ACTION_RECORRENTE = { label: 'Notificar cliente diretamente', sub: 'cobranca_cliente' as NonNullable<SubStatus> };

type Acao = { label: string; sub: NonNullable<SubStatus>; variant?: 'default' | 'outline' };

/** Ações disponíveis para uma linha em função dos status (primário + extras). */
function actionsForLine(statuses: StatusCobranca[]): Acao[] {
  const set = new Set(statuses);
  const out: Acao[] = [];
  if (set.has('divergencia')) {
    out.push({ label: 'Aceitar divergência',  sub: 'divergencia_aceita' });
    out.push({ label: 'Cobrar divergência',   sub: 'divergencia_cobrada' });
    out.push({ label: 'Notificar Banco',      sub: 'contestado_banco' });
    out.push({ label: 'Notificar cliente',    sub: 'cobranca_cliente' });
  }
  if (set.has('aberto_banco'))   out.push({ label: 'Preparar cobrança',             sub: 'cobranca_preparada' });
  if (set.has('aberto_cliente')) out.push({ label: 'Reenviar cobrança ao cliente', sub: 'cobranca_cliente' });
  if (set.has('inadimplente'))   out.push({ label: 'Enviar para jurídico',         sub: 'cobranca_juridica' });
  if (set.has('antecipado')) {
    out.push({ label: 'Aceitar Crédito (abate mês seguinte)', sub: 'credito_aceito' });
    out.push({ label: 'Confirmar antecipação',                 sub: 'antecipacao_confirmada' });
  }
  return out;
}

type Categoria = 'aluguel' | 'iptu';

interface Linha {
  key: string;
  cobranca: CobrancaRec;
  categoria: Categoria;
  esperado: number;
  cobrado: number | null;
  recebido: number | null;
  status: StatusCobranca;
  /** Status adicionais (ex.: antecipado + divergência simultâneos). */
  extras: StatusCobranca[];
}

function diagnoseLinha(
  esperado: number,
  cobrado: number | null,
  recebido: number | null,
  c: CobrancaRec,
  hoje: Date = new Date('2026-04-15'),
): { status: StatusCobranca; extras: StatusCobranca[] } {
  const extras: StatusCobranca[] = [];
  // Detecta divergência independentemente (mesmo em antecipado).
  const diverge = cobrado != null && esperado > 0 && Math.abs(cobrado - esperado) > 0.5;

  if (c.status === 'antecipado') {
    if (diverge) extras.push('divergencia');
    return { status: 'antecipado', extras };
  }
  if (esperado === 0) return { status: 'conciliado', extras };
  if (cobrado == null) return { status: 'aberto_banco', extras };
  if (diverge) return { status: 'divergencia', extras };
  if (recebido == null || recebido < esperado - 0.5) {
    return { status: hoje > new Date(c.dataVencimento) ? 'inadimplente' : 'aberto_cliente', extras };
  }
  return { status: 'conciliado', extras };
}

function buildLinhas(c: CobrancaRec, categoriaFiltro: Categoria | 'all'): Linha[] {
  const ratioAlu = c.totalEsperado > 0 ? c.aluguelEsperado / c.totalEsperado : 1;
  const items: Linha[] = [];
  if (c.aluguelEsperado > 0 && categoriaFiltro !== 'iptu') {
    const cobrado = c.valorCobradoBoleto != null ? Math.round(c.valorCobradoBoleto * ratioAlu) : null;
    const recebido = c.valorRecebido != null ? Math.round(c.valorRecebido * ratioAlu) : null;
    const d = diagnoseLinha(c.aluguelEsperado, cobrado, recebido, c);
    items.push({
      key: `${c.id}-aluguel`, cobranca: c, categoria: 'aluguel',
      esperado: c.aluguelEsperado, cobrado, recebido,
      status: d.status, extras: d.extras,
    });
  }
  if (c.iptuEsperado > 0 && categoriaFiltro !== 'aluguel') {
    const cobradoAlu = c.valorCobradoBoleto != null ? Math.round(c.valorCobradoBoleto * ratioAlu) : null;
    const cobrado = c.valorCobradoBoleto != null && cobradoAlu != null ? c.valorCobradoBoleto - cobradoAlu : null;
    const recebidoAlu = c.valorRecebido != null ? Math.round(c.valorRecebido * ratioAlu) : null;
    const recebido = c.valorRecebido != null && recebidoAlu != null ? c.valorRecebido - recebidoAlu : null;
    const d = diagnoseLinha(c.iptuEsperado, cobrado, recebido, c);
    items.push({
      key: `${c.id}-iptu`, cobranca: c, categoria: 'iptu',
      esperado: c.iptuEsperado, cobrado, recebido,
      status: d.status, extras: d.extras,
    });
  }
  return items;
}

export default function ProprietarioConciliacaoFinanceira() {
  

  // ----- estado compartilhado (fonte única: FinanceContext) -----
  const {
    cobrancas, acoes, entradas, vinculos, grupos,
    registrarAcao, aplicarSubStatus, aceitarCredito,
    prepararCobranca, prepararCobrancasEmLote, reemitirBoleto,
    addAjusteManual, removerAjusteManual, agruparCobrancas,
    addEntradas, vincularEntrada, autoMatchTudo, classificarComoOutroRecebimento,
  } = useFinance();

  const [vincDialog, setVincDialog] = useState<EntradaBancaria | null>(null);
  const [agruparDialog, setAgruparDialog] = useState(false);
  const [ajusteDialog, setAjusteDialog] = useState<CobrancaRec | null>(null);
  const [classificarDialog, setClassificarDialog] = useState<EntradaBancaria | null>(null);

  const [fundoId, setFundoId] = useState<string>('all');
  const [edificioId, setEdificioId] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState(3); // Abr
  const [selectedYear] = useState(2026);
  const [soPendencias, setSoPendencias] = useState(false);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [categoriaFiltro, setCategoriaFiltro] = useState<Categoria | 'all'>('all');
  const [statusFiltro, setStatusFiltro] = useState<StatusCobranca | 'all'>('all');
  const [acaoFiltro, setAcaoFiltro] = useState<'all' | 'com_acao' | 'sem_acao' | NonNullable<SubStatus>>('all');
  const [ordenarPor, setOrdenarPor] = useState<'inquilino' | 'conjunto'>('inquilino');
  const [ordenarInquilino, setOrdenarInquilino] = useState<'asc' | 'desc'>('asc');

  const [actionDialog, setActionDialog] = useState<{ cobrancaId: string; status: StatusCobranca } | null>(null);
  const [actionOverride, setActionOverride] = useState<{ label: string; sub: NonNullable<SubStatus> } | null>(null);
  const [obs, setObs] = useState('');

  // ----- derivadas -----
  const competencia = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;

  const edificiosDoFundo = useMemo(
    () => fundoId === 'all' ? edificiosRec : edificiosRec.filter(e => e.fundoId === fundoId),
    [fundoId]
  );

  const cobrancasFiltradas = useMemo(() => {
    return cobrancas.filter(c => {
      if (c.competencia !== competencia) return false;
      const contrato = contratosRec.find(x => x.id === c.contratoId)!;
      if (edificioId !== 'all' && contrato.edificioId !== edificioId) return false;
      if (fundoId !== 'all') {
        const ed = edificiosRec.find(e => e.id === contrato.edificioId);
        if (!ed || ed.fundoId !== fundoId) return false;
      }
      return true;
    });
  }, [cobrancas, competencia, edificioId, fundoId, soPendencias]);

  // Linhas (split por categoria) + ordenação e filtros adicionais.
  const linhas = useMemo(() => {
    const all: Linha[] = cobrancasFiltradas.flatMap(c => buildLinhas(c, categoriaFiltro));
    return all.filter(l => {
      if (statusFiltro !== 'all' && l.status !== statusFiltro && !l.extras.includes(statusFiltro)) return false;
      if (acaoFiltro === 'com_acao' && !l.cobranca.subStatus) return false;
      if (acaoFiltro === 'sem_acao' && l.cobranca.subStatus) return false;
      if (acaoFiltro !== 'all' && acaoFiltro !== 'com_acao' && acaoFiltro !== 'sem_acao'
          && l.cobranca.subStatus !== acaoFiltro) return false;
      if (soPendencias && l.status === 'conciliado' && l.extras.length === 0) return false;
      if (soPendencias && l.status === 'antecipado' && !l.extras.includes('divergencia')) return false;
      return true;
    }).sort((a, b) => {
      const ca = contratosRec.find(x => x.id === a.cobranca.contratoId)!;
      const cb = contratosRec.find(x => x.id === b.cobranca.contratoId)!;
      const ia = inquilinosRec.find(i => i.id === ca.inquilinoId)!;
      const ib = inquilinosRec.find(i => i.id === cb.inquilinoId)!;
      const cmp = ia.nome.localeCompare(ib.nome, 'pt-BR');
      return ordenarInquilino === 'asc' ? cmp : -cmp;
    });
  }, [cobrancasFiltradas, categoriaFiltro, statusFiltro, acaoFiltro, soPendencias, ordenarInquilino]);

  // KPIs
  const totalEsperado = linhas.reduce((s, l) => s + l.esperado, 0);
  const totalRecebido = linhas.reduce((s, l) => s + (l.recebido ?? 0), 0);
  const pendencias = linhas.filter(l => l.status !== 'conciliado' && l.status !== 'antecipado').length;
  const inadimplentesMes = linhas.filter(l => l.status === 'inadimplente').length;

  // Total contratado para o ano (com reajuste, revisionais, descontos e IPTU já considerados).
  const totalAnualContratado = useMemo(() => {
    const contratos = contratosRec.filter(ct => {
      if (edificioId !== 'all' && ct.edificioId !== edificioId) return false;
      if (fundoId !== 'all') {
        const ed = edificiosRec.find(e => e.id === ct.edificioId);
        if (!ed || ed.fundoId !== fundoId) return false;
      }
      return true;
    });
    let aluguel = 0, iptu = 0;
    for (const ct of contratos) {
      for (let m = 1; m <= 12; m++) {
        const comp = `${selectedYear}-${String(m).padStart(2, '0')}`;
        if (categoriaFiltro !== 'iptu') aluguel += calcAluguelEsperado(ct, comp);
        if (categoriaFiltro !== 'aluguel') iptu += calcIptuEsperado(ct, comp);
      }
    }
    return { aluguel, iptu, total: aluguel + iptu };
  }, [fundoId, edificioId, selectedYear, categoriaFiltro]);

  // Inadimplência recorrente (avalia em TODAS as competências dos dados, não só na atual)
  const recorrentes = useMemo(() => {
    const set = new Set<string>();
    inquilinosRec.forEach(i => {
      if (isInadimplenteRecorrente(i.id, cobrancas)) set.add(i.id);
    });
    return set;
  }, [cobrancas]);

  // ----- ações -----
  function openAction(cobrancaId: string, status: StatusCobranca) {
    setObs('');
    setActionOverride(null);
    setActionDialog({ cobrancaId, status });
  }

  function openOverrideAction(cobrancaId: string, status: StatusCobranca, override: { label: string; sub: NonNullable<SubStatus> }) {
    setObs('');
    setActionOverride(override);
    setActionDialog({ cobrancaId, status });
  }

  function confirmAction() {
    if (!actionDialog) return;
    const cfg = actionOverride ?? ACTION_BY_STATUS[actionDialog.status];
    if (!cfg) { setActionDialog(null); return; }

    if (cfg.sub === 'cobranca_preparada') {
      prepararCobranca(actionDialog.cobrancaId);
      if (obs) registrarAcao(actionDialog.cobrancaId, cfg.label, obs);
    } else if (cfg.sub === 'credito_aceito') {
      aceitarCredito(actionDialog.cobrancaId);
      if (obs) registrarAcao(actionDialog.cobrancaId, cfg.label, obs);
    } else {
      aplicarSubStatus(actionDialog.cobrancaId, cfg.sub, cfg.label, obs || undefined);
    }
    setActionDialog(null);
    setActionOverride(null);
  }

  function syncBanco() {
    // Mock Open Finance: gera entradas aleatórias adicionais
    const novas: EntradaBancaria[] = [
      {
        id: `eb-of-${Date.now()}`, data: '2026-04-08', valor: 61000, tipo: 'TED',
        descricaoExtrato: 'TED RECEBIDA - CAPITAL E ENERGIA S/A (Open Finance)',
        pagadorNome: 'Capital & Energia S/A', pagadorDocumento: '23.456.789/0001-01',
        origem: 'api',
      },
    ];
    addEntradas(novas);
    toast.success(`Open Finance: ${novas.length} entrada(s) importada(s).`);
  }

  function importarArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Mock: parseia o arquivo e gera entradas
    const nova: EntradaBancaria = {
      id: `eb-up-${Date.now()}`, data: '2026-04-09', valor: 30900, tipo: 'TED',
      descricaoExtrato: `TED RECEBIDA - MERCATTO (${file.name})`,
      pagadorNome: 'Mercatto Consultoria', pagadorDocumento: '45.678.901/0001-23',
      origem: 'upload', arquivoOrigem: file.name,
    };
    addEntradas([nova]);
    toast.success(`Arquivo ${file.name} importado — 1 entrada adicionada.`);
    e.target.value = '';
  }

  // ----- render -----
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Conciliação Financeira</h1>
          <p className="text-muted-foreground text-sm">
            Conferência contrato a contrato: valor combinado × boleto emitido × valor recebido.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Switch id="so-pend" checked={soPendencias} onCheckedChange={setSoPendencias} />
            <label htmlFor="so-pend" className="text-sm text-muted-foreground cursor-pointer">Ver só pendências</label>
          </div>
          <Button variant="outline" size="sm" onClick={syncBanco}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Sincronizar com Banco
          </Button>
        </div>
      </div>

      {/* Filtros em cascata */}
      <Card>
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Fundo</span>
            <Select value={fundoId} onValueChange={(v) => { setFundoId(v); setEdificioId('all'); }}>
            <SelectTrigger className="w-full sm:w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Fundos</SelectItem>
                {fundos.map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Ativo</span>
            <Select value={edificioId} onValueChange={setEdificioId}>
            <SelectTrigger className="w-full sm:w-64"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Ativos</SelectItem>
                {edificiosDoFundo.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Competência</span>
            <div className="flex h-11 w-full items-center justify-between gap-1 rounded-md border px-2 sm:h-10 sm:w-auto">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedMonth(m => Math.max(0, m - 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium w-24 text-center">{months[selectedMonth]}/{selectedYear}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedMonth(m => Math.min(11, m + 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Total Esperado" value={fmt(totalEsperado)} icon={Banknote} />
        <KpiCard title="Total Recebido" value={fmt(totalRecebido)} icon={CheckCircle2} valueColor="text-emerald-600" />
        <KpiCard title="Pendências" value={String(pendencias)} icon={AlertTriangle} valueColor={pendencias ? 'text-amber-600' : ''} />
        <KpiCard title="Inadimplentes (mês)" value={String(inadimplentesMes)} icon={UserX} valueColor={inadimplentesMes ? 'text-rose-600' : ''} />
      </div>

      {/* Total contratado no ano */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Total Contratado · {selectedYear}</div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Soma anual já considerando reajustes, revisionais, descontos e parcelas de IPTU previstas em contrato.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-right">
              <div>
                <div className="text-[10px] text-muted-foreground uppercase">Aluguel</div>
                <div className="text-sm font-semibold text-foreground">{fmt(totalAnualContratado.aluguel)}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase">IPTU</div>
                <div className="text-sm font-semibold text-foreground">{fmt(totalAnualContratado.iptu)}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase">Total</div>
                <div className="text-base font-bold text-primary">{fmt(totalAnualContratado.total)}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>


      <Tabs defaultValue="cobrancas" className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <TabsList>
            <TabsTrigger value="cobrancas">Cobranças</TabsTrigger>
            <TabsTrigger value="entradas">
              Entradas bancárias
              <Badge variant="outline" className="ml-2 text-[10px]">
                {entradas.filter(e => !vinculos.some(v => v.entradaId === e.id)).length} pendentes
              </Badge>
            </TabsTrigger>
          </TabsList>
          <ExportButtons cobrancas={cobrancas} entradas={entradas} vinculos={vinculos} grupos={grupos} competencia={competencia} />
        </div>

        <TabsContent value="cobrancas" className="space-y-4">
          {/* Filtros adicionais: categoria, status, ação, ordenação */}
          <Card>
            <CardContent className="p-4 flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Categoria</span>
                <Select value={categoriaFiltro} onValueChange={(v) => setCategoriaFiltro(v as Categoria | 'all')}>
                  <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Aluguel + IPTU</SelectItem>
                    <SelectItem value="aluguel">Somente Aluguel</SelectItem>
                    <SelectItem value="iptu">Somente IPTU</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Status</span>
                <Select value={statusFiltro} onValueChange={(v) => setStatusFiltro(v as StatusCobranca | 'all')}>
                  <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    {(Object.keys(STATUS_META) as StatusCobranca[]).map(s => (
                      <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Ação</span>
                <Select value={acaoFiltro} onValueChange={(v) => setAcaoFiltro(v as typeof acaoFiltro)}>
                  <SelectTrigger className="w-full sm:w-56"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="sem_acao">Sem ação registrada</SelectItem>
                    <SelectItem value="com_acao">Com ação registrada</SelectItem>
                    {(Object.keys(SUBSTATUS_LABEL) as NonNullable<SubStatus>[]).map(s => (
                      <SelectItem key={s} value={s}>{SUBSTATUS_LABEL[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Ordenar por Inquilino</span>
                <Select value={ordenarInquilino} onValueChange={(v) => setOrdenarInquilino(v as 'asc' | 'desc')}>
                  <SelectTrigger className="w-full sm:w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">A → Z</SelectItem>
                    <SelectItem value="desc">Z → A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="ml-auto flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setAgruparDialog(true)}>
                  <Layers className="h-3.5 w-3.5 mr-1" /> Agrupar cobranças (boleto único)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const alvo = cobrancasFiltradas
                      .filter(c => c.valorCobradoBoleto == null && c.totalEsperado > 0)
                      .map(c => c.id);
                    if (alvo.length === 0) { toast.info('Nenhuma cobrança pendente de preparação nesta competência.'); return; }
                    prepararCobrancasEmLote(alvo);
                  }}
                >
                  <Banknote className="h-3.5 w-3.5 mr-1" /> Preparar cobranças da competência
                </Button>
              </div>

            </CardContent>
          </Card>

          {/* Tabela principal */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8"></TableHead>
                      <TableHead>Inquilino / Unidade</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Esperado</TableHead>
                      <TableHead>Cobrado</TableHead>
                      <TableHead>Recebido</TableHead>
                      <TableHead>Pago em</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {linhas.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                          Nenhuma cobrança para os filtros selecionados.
                        </TableCell>
                      </TableRow>
                    )}
                    {linhas.map(l => {
                      const c = l.cobranca;
                      const contrato = contratosRec.find(x => x.id === c.contratoId)!;
                      const inquilino = inquilinosRec.find(i => i.id === contrato.inquilinoId)!;
                      const unidades = contrato.unidadeIds
                        .map(uid => unidadesRec.find(u => u.id === uid)?.identificacao).filter(Boolean).join(', ');
                      const meta = STATUS_META[l.status];
                      const Icon = meta.icon;
                      const isOpen = expandido === l.key;
                      const acoesDisponiveis = actionsForLine([l.status, ...l.extras]);
                      const recorrente = recorrentes.has(inquilino.id);
                      const acoesDaCobranca = acoes.filter(a => a.cobrancaId === c.id);
                      const grupoDaCobranca = grupos.find(g => g.id === c.grupoId);

                      return (
                        <Fragment key={l.key}>
                          <TableRow className="cursor-pointer" onClick={() => setExpandido(isOpen ? null : l.key)}>
                            <TableCell className="py-2">
                              {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                            </TableCell>
                            <TableCell className="py-2">
                              <div className="flex items-center gap-1.5">
                                <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                                  {recorrente && (
                                    <TooltipProvider delayDuration={150}>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <AlertOctagon className="h-4 w-4 text-amber-600" aria-label="Inadimplência recorrente" />
                                        </TooltipTrigger>
                                        <TooltipContent side="top">
                                          <div className="text-xs">
                                            Inadimplência recorrente (3+ meses)
                                            {c.subStatus && <div className="text-muted-foreground">{SUBSTATUS_LABEL[c.subStatus]}</div>}
                                          </div>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-foreground flex items-center gap-1.5">
                                    {inquilino.nome}
                                    {grupoDaCobranca && (
                                      <Badge variant="outline" className="text-[10px]">
                                        <Layers className="h-2.5 w-2.5 mr-0.5" /> {grupoDaCobranca.identificadorBoleto}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground">{unidades}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-2">
                              <Badge variant="outline" className="text-[11px] uppercase">{l.categoria}</Badge>
                            </TableCell>
                            <TableCell className="py-2 text-sm">{fmt(l.esperado)}</TableCell>
                            <TableCell className="py-2 text-sm">{fmt(l.cobrado)}</TableCell>
                            <TableCell className="py-2 text-sm">{fmt(l.recebido)}</TableCell>
                            <TableCell className="py-2 text-xs text-muted-foreground">{fmtDate(c.dataPagamentoEfetiva)}</TableCell>
                            <TableCell className="py-2">
                              <div className="flex flex-col gap-1 items-start">
                                <Badge className={`text-[11px] ${meta.cls} flex items-center gap-1`}>
                                  <Icon className="h-3 w-3" /> {meta.label}
                                </Badge>
                                {l.extras.map(s => {
                                  const m = STATUS_META[s];
                                  const I = m.icon;
                                  return (
                                    <Badge key={s} className={`text-[11px] ${m.cls} flex items-center gap-1`}>
                                      <I className="h-3 w-3" /> {m.label}
                                    </Badge>
                                  );
                                })}
                              </div>
                            </TableCell>
                            <TableCell className="py-2" onClick={(e) => e.stopPropagation()}>
                              {l.status === 'conciliado' && l.extras.length === 0 ? (
                                <span className="text-xs text-muted-foreground">—</span>
                              ) : (
                                <div className="flex flex-col items-start gap-1">
                                  {l.status === 'divergencia' && (
                                    <Button size="sm" variant="outline" className="h-7 text-[11px] border-emerald-400 text-emerald-700 hover:bg-emerald-50"
                                      onClick={() => reemitirBoleto(c.id)}>
                                      <RefreshCw className="h-3 w-3 mr-1" /> Corrigir para o valor esperado
                                    </Button>
                                  )}
                                  {!c.subStatus && acoesDisponiveis.map(a => (
                                    <Button key={a.sub} size="sm" variant="outline" className="h-7 text-[11px]"
                                      onClick={() => openOverrideAction(c.id, l.status, a)}>
                                      {a.label}
                                    </Button>
                                  ))}
                                  {recorrente && l.status === 'inadimplente' && (
                                    <Button size="sm" variant="outline" className="h-7 text-[11px] border-amber-400 text-amber-700 hover:bg-amber-50"
                                      onClick={() => openOverrideAction(c.id, l.status, ACTION_RECORRENTE)}>
                                      <Mail className="h-3 w-3 mr-1" /> {ACTION_RECORRENTE.label}
                                    </Button>
                                  )}
                                  {c.subStatus && (
                                    <span className="text-xs text-muted-foreground">{SUBSTATUS_LABEL[c.subStatus]}</span>
                                  )}
                                </div>
                              )}
                            </TableCell>
                          </TableRow>

                          {isOpen && (
                            <TableRow className="bg-muted/20">
                              <TableCell colSpan={9} className="py-4">
                                <ExpandedDetail
                                  cobranca={c}
                                  acoes={acoesDaCobranca}
                                  grupo={grupoDaCobranca}
                                  cobrancasGrupo={grupoDaCobranca ? cobrancas.filter(x => grupoDaCobranca.cobrancaIds.includes(x.id)) : []}
                                  onAddAjuste={() => setAjusteDialog(c)}
                                  onRemoveAjuste={(aid) => removerAjusteManual(c.id, aid)}
                                />
                              </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entradas" className="space-y-4">
          <EntradasBancariasTab
            entradas={entradas}
            vinculos={vinculos}
            cobrancas={cobrancas}
            onSync={syncBanco}
            onUpload={importarArquivo}
            onAutoMatch={autoMatchTudo}
            onVincularManual={(e) => setVincDialog(e)}
            onClassificar={(e) => setClassificarDialog(e)}
          />
        </TabsContent>
      </Tabs>


      {/* Dialog de ação */}
      <Dialog open={!!actionDialog} onOpenChange={(o) => !o && setActionDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionDialog && (actionOverride?.label ?? ACTION_BY_STATUS[actionDialog.status]?.label)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Observação (opcional)</label>
            <Textarea value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Descreva o motivo ou contexto" rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>Cancelar</Button>
            <Button onClick={confirmAction}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Vincular entrada bancária a uma cobrança */}
      <VincularEntradaDialog
        entrada={vincDialog}
        cobrancas={cobrancas}
        onClose={() => setVincDialog(null)}
        onConfirm={(cobrancaId, valor, modo) => {
          if (vincDialog) {
            vincularEntrada({ entradaId: vincDialog.id, cobrancaId, valorAplicado: valor, tipo: 'manual', modo });
          }
          setVincDialog(null);
        }}
        onClassificar={() => { setClassificarDialog(vincDialog); setVincDialog(null); }}
      />

      {/* Agrupar cobranças (split payment) */}
      <AgruparCobrancasDialog
        open={agruparDialog}
        cobrancas={cobrancas.filter(c => c.competencia === competencia && !c.grupoId)}
        onClose={() => setAgruparDialog(false)}
        onConfirm={(ids) => { agruparCobrancas(ids); setAgruparDialog(false); }}
      />

      {/* Classificar entrada como outro recebimento */}
      <ClassificarEntradaDialog
        entrada={classificarDialog}
        onClose={() => setClassificarDialog(null)}
        onConfirm={(dados) => {
          if (classificarDialog) classificarComoOutroRecebimento(classificarDialog.id, dados);
          setClassificarDialog(null);
        }}
      />

      {/* Ajuste manual */}
      <AjusteManualDialog
        cobranca={ajusteDialog}
        onClose={() => setAjusteDialog(null)}
        onConfirm={(aj) => {
          if (ajusteDialog) addAjusteManual(ajusteDialog.id, aj);
          setAjusteDialog(null);
        }}
      />
    </div>
  );
}


// ---------- Subcomponents ----------

function KpiCard({ title, value, icon: Icon, valueColor }: { title: string; value: string; icon: any; valueColor?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">{title}</span>
          <Icon className="h-4 w-4 text-gray-400" />
        </div>
        <p className={`text-xl font-bold ${valueColor || ''}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

const TIPO_AJUSTE_META: Record<TipoAjuste, { label: string; cls: string }> = {
  desconto_negociado:      { label: 'Desconto negociado',       cls: 'bg-blue-100 text-blue-700' },
  inadimplencia_arrastada: { label: 'Inadimplência arrastada',  cls: 'bg-rose-100 text-rose-700' },
  credito_antecipado:      { label: 'Crédito antecipado',       cls: 'bg-violet-100 text-violet-700' },
  condicao_especial:       { label: 'Condição especial',        cls: 'bg-amber-100 text-amber-700' },
  ajuste_manual:           { label: 'Ajuste manual',            cls: 'bg-slate-200 text-slate-700' },
};

function ExpandedDetail({
  cobranca: c, acoes, grupo, cobrancasGrupo, onAddAjuste, onRemoveAjuste,
}: {
  cobranca: CobrancaRec;
  acoes: AcaoRegistro[];
  grupo?: GrupoCobranca;
  cobrancasGrupo?: CobrancaRec[];
  onAddAjuste?: () => void;
  onRemoveAjuste?: (ajusteId: string) => void;
}) {
  // Componentes (Aluguel / IPTU)
  // Cobrado total — distribuímos proporcionalmente entre aluguel e iptu para visualização.
  const cobradoAluguel = c.valorCobradoBoleto != null && c.totalEsperado > 0
    ? Math.round(c.valorCobradoBoleto * (c.aluguelEsperado / c.totalEsperado))
    : null;
  const cobradoIptu = c.valorCobradoBoleto != null && cobradoAluguel != null
    ? c.valorCobradoBoleto - cobradoAluguel
    : null;
  const recebidoAluguel = c.valorRecebido != null && c.totalEsperado > 0
    ? Math.round(c.valorRecebido * (c.aluguelEsperado / c.totalEsperado))
    : null;
  const recebidoIptu = c.valorRecebido != null && recebidoAluguel != null
    ? c.valorRecebido - recebidoAluguel
    : null;

  const slaBanco = diffDias(c.dataCobrancaBancoEsperada, c.dataEnvioBancoEfetiva);
  const slaCliente = diffDias(c.dataVencimento, c.dataPagamentoEfetiva);

  const divergeAluguel = cobradoAluguel != null && Math.abs(cobradoAluguel - c.aluguelEsperado) > 0.5;
  const divergeIptu = cobradoIptu != null && Math.abs(cobradoIptu - c.iptuEsperado) > 0.5;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10 px-2 sm:px-4">
      {/* Componentes */}
      <div className="lg:col-span-2 min-w-0">
        <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide h-5 flex items-center">
          Componentes
        </h4>
        <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="py-3">Componente</TableHead>
              <TableHead className="py-3">Esperado</TableHead>
              <TableHead className="py-3">Cobrado</TableHead>
              <TableHead className="py-3">Recebido</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="text-sm font-medium py-3">Aluguel</TableCell>
              <TableCell className="text-sm py-3">{fmt(c.aluguelEsperado)}</TableCell>
              <TableCell className={`text-sm py-3 ${divergeAluguel ? 'text-rose-600 font-semibold' : ''}`}>{fmt(cobradoAluguel)}</TableCell>
              <TableCell className="text-sm py-3">{fmt(recebidoAluguel)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="text-sm font-medium py-3">IPTU</TableCell>
              <TableCell className="text-sm py-3">{fmt(c.iptuEsperado)}</TableCell>
              <TableCell className={`text-sm py-3 ${divergeIptu ? 'text-rose-600 font-semibold' : ''}`}>{fmt(cobradoIptu)}</TableCell>
              <TableCell className="text-sm py-3">{fmt(recebidoIptu)}</TableCell>
            </TableRow>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableCell className="text-sm font-bold py-3">Total</TableCell>
              <TableCell className="text-sm font-bold py-3">{fmt(c.totalEsperado)}</TableCell>
              <TableCell className="text-sm font-bold py-3">{fmt(c.valorCobradoBoleto)}</TableCell>
              <TableCell className="text-sm font-bold py-3">{fmt(c.valorRecebido)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
        </div>

        {c.creditoAntecipadoOrigem && (
          <p className="text-xs text-violet-700 bg-violet-50 border border-violet-200 rounded-md p-3 mt-4">
            Pagamento por antecipação — crédito originado em {c.creditoAntecipadoOrigem}.
          </p>
        )}

        {/* Composição do esperado (ajustes mensais) */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Composição do esperado
            </h4>
            {onAddAjuste && (
              <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={onAddAjuste}>
                <Plus className="h-3 w-3 mr-1" /> Ajuste manual
              </Button>
            )}
          </div>
          <div className="rounded-lg border bg-card divide-y">
            <div className="flex items-center justify-between px-3 py-2 text-sm">
              <span className="text-muted-foreground">Aluguel base</span>
              <span className="font-medium">{fmt(c.aluguelEsperado)}</span>
            </div>
            {c.iptuEsperado > 0 && (
              <div className="flex items-center justify-between px-3 py-2 text-sm">
                <span className="text-muted-foreground">IPTU (parcela)</span>
                <span className="font-medium">{fmt(c.iptuEsperado)}</span>
              </div>
            )}
            {(c.ajustes ?? []).map(a => {
              const meta = TIPO_AJUSTE_META[a.tipo];
              return (
                <div key={a.id} className="flex items-center justify-between px-3 py-2 text-sm gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge className={`text-[10px] ${meta.cls} shrink-0`}>{meta.label}</Badge>
                    <span className="text-muted-foreground truncate">{a.descricao}</span>
                    {a.origem === 'manual' && onRemoveAjuste && (
                      <Button size="icon" variant="ghost" className="h-5 w-5 text-rose-500"
                        onClick={() => onRemoveAjuste(a.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <span className={`font-medium whitespace-nowrap ${a.valor < 0 ? 'text-emerald-600' : a.valor > 0 ? 'text-rose-600' : 'text-muted-foreground'}`}>
                    {a.valor > 0 ? '+' : ''}{fmt(a.valor)}
                  </span>
                </div>
              );
            })}
            <div className="flex items-center justify-between px-3 py-2.5 bg-muted/30">
              <span className="text-sm font-bold">Total esperado</span>
              <span className="text-sm font-bold text-primary">{fmt(c.totalEsperado)}</span>
            </div>
          </div>
        </div>

        {/* Visão de grupo / split payment */}
        {grupo && cobrancasGrupo && cobrancasGrupo.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" /> Boleto consolidado — {grupo.identificadorBoleto}
              </h4>
              <Badge variant="outline" className="text-[10px]">
                {cobrancasGrupo.length} contratos
              </Badge>
            </div>
            <div className="rounded-lg border bg-card divide-y">
              {cobrancasGrupo.map(cg => {
                const ct = contratosRec.find(x => x.id === cg.contratoId)!;
                const un = ct.unidadeIds.map(uid => unidadesRec.find(u => u.id === uid)?.identificacao).filter(Boolean).join(', ');
                return (
                  <div key={cg.id} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span className="text-muted-foreground">Contrato {cg.contratoId} · {un}</span>
                    <span className="font-medium">{fmt(cg.totalEsperado)}</span>
                  </div>
                );
              })}
              <div className="flex items-center justify-between px-3 py-2.5 bg-muted/30">
                <span className="text-sm font-bold">Total do boleto</span>
                <span className="text-sm font-bold text-primary">
                  {fmt(cobrancasGrupo.reduce((s, x) => s + x.totalEsperado, 0))}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">
              No recebimento, o valor é dividido proporcionalmente entre os contratos do grupo.
            </p>
          </div>
        )}
      </div>


      {/* Datas + SLAs */}
      <div className="min-w-0 lg:border-l lg:pl-8">
        <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide h-5 flex items-center">
          Datas &amp; SLAs
        </h4>
        <div className="space-y-2.5 text-sm rounded-lg border bg-card p-4">
          <DateRow label="Banco — deveria emitir" value={fmtDate(c.dataCobrancaBancoEsperada)} />
          <DateRow label="Banco — emissão efetiva" value={fmtDate(c.dataEnvioBancoEfetiva)} />
          <DateRow label="Vencimento" value={fmtDate(c.dataVencimento)} />
          <DateRow label="Pagamento efetivo" value={fmtDate(c.dataPagamentoEfetiva)} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <SlaBadge label="SLA Banco" dias={slaBanco} positivoEhRuim />
          <SlaBadge label="SLA Cliente" dias={slaCliente} positivoEhRuim />
        </div>

        {acoes.length > 0 && (
          <>
            <h4 className="text-xs font-semibold text-muted-foreground mt-6 mb-3 uppercase tracking-wide">Histórico de ações</h4>
            <ul className="space-y-2 text-xs">
              {acoes.map(a => (
                <li key={a.id} className="border-l-2 border-primary/40 pl-3 py-1">
                  <div className="font-medium text-foreground">{a.tipoAcao}</div>
                  <div className="text-muted-foreground">{fmtDate(a.data)} · {a.responsavel}</div>
                  {a.observacao && <div className="text-muted-foreground italic">"{a.observacao}"</div>}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

function DateRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center gap-3 border-b border-border/40 pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground text-xs sm:text-sm">{label}</span>
      <span className="font-medium text-foreground text-xs sm:text-sm whitespace-nowrap">{value}</span>
    </div>
  );
}

function SlaBadge({ label, dias, positivoEhRuim }: { label: string; dias: number | null; positivoEhRuim?: boolean }) {
  if (dias == null) {
    return (
      <div className="border rounded-lg p-3 text-center bg-card">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{label}</div>
        <div className="text-sm font-bold text-muted-foreground">—</div>
      </div>
    );
  }
  const ruim = positivoEhRuim ? dias > 0 : dias < 0;
  const otimo = positivoEhRuim ? dias <= 0 : dias >= 0;
  const cls = ruim ? 'text-rose-600' : otimo ? 'text-emerald-600' : 'text-muted-foreground';
  return (
    <div className="border rounded-lg p-3 text-center bg-card">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{label}</div>
      <div className={`text-sm font-bold ${cls}`}>{dias > 0 ? `+${dias}` : dias} dias</div>
    </div>
  );
}
// ===================== Entradas bancárias (vínculo) =====================

const TIPO_ENTRADA_CLS: Record<string, string> = {
  boleto: 'bg-sky-100 text-sky-700',
  TED:    'bg-emerald-100 text-emerald-700',
  PIX:    'bg-violet-100 text-violet-700',
  outro:  'bg-slate-200 text-slate-700',
};

function EntradasBancariasTab({
  entradas, vinculos, cobrancas, onSync, onUpload, onAutoMatch, onVincularManual, onClassificar,
}: {
  entradas: EntradaBancaria[];
  vinculos: VinculoConciliacao[];
  cobrancas: CobrancaRec[];
  onSync: () => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAutoMatch: () => void;
  onVincularManual: (e: EntradaBancaria) => void;
  onClassificar: (e: EntradaBancaria) => void;
}) {
  const total = entradas.length;
  const vinculadas = entradas.filter(e => vinculos.some(v => v.entradaId === e.id)).length;
  const pendentes = total - vinculadas;
  const valorTotal = entradas.reduce((s, e) => s + e.valor, 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-6">
            <div>
              <div className="text-[10px] text-muted-foreground uppercase">Total</div>
              <div className="text-base font-semibold">{total}</div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground uppercase">Vinculadas</div>
              <div className="text-base font-semibold text-emerald-600">{vinculadas}</div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground uppercase">Pendentes</div>
              <div className="text-base font-semibold text-amber-600">{pendentes}</div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground uppercase">Valor</div>
              <div className="text-base font-semibold">{fmt(valorTotal)}</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={onAutoMatch}>
              <Link2 className="h-3.5 w-3.5 mr-1" /> Conciliar automaticamente
            </Button>
            <Button variant="outline" size="sm" onClick={onSync}>
              <RefreshCw className="h-3.5 w-3.5 mr-1" /> Sincronizar Open Finance
            </Button>
            <Button variant="outline" size="sm" asChild>
              <label className="cursor-pointer">
                <Upload className="h-3.5 w-3.5 mr-1" /> Importar arquivo
                <input type="file" className="hidden" accept=".xlsx,.ofx,.cnab,.pdf,.csv" onChange={onUpload} />
              </label>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Identificador</TableHead>
                  <TableHead>Pagador</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Vínculo</TableHead>
                  <TableHead>Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entradas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      Nenhuma entrada bancária. Sincronize via Open Finance ou importe um arquivo.
                    </TableCell>
                  </TableRow>
                )}
                {entradas.map(e => {
                  const v = vinculos.find(x => x.entradaId === e.id);
                  const cobr = v ? cobrancas.find(c => c.id === v.cobrancaId) : null;
                  const contrato = cobr ? contratosRec.find(x => x.id === cobr.contratoId) : null;
                  const inq = contrato ? inquilinosRec.find(i => i.id === contrato.inquilinoId) : null;
                  return (
                    <TableRow key={e.id}>
                      <TableCell className="text-sm">{fmtDate(e.data)}</TableCell>
                      <TableCell className="text-sm font-medium">{fmt(e.valor)}</TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] ${TIPO_ENTRADA_CLS[e.tipo]}`}>{e.tipo}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{e.identificadorBoleto ?? '—'}</TableCell>
                      <TableCell className="text-sm">
                        <div>{e.pagadorNome ?? '—'}</div>
                        <div className="text-[10px] text-muted-foreground">{e.pagadorDocumento}</div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[240px] truncate">{e.descricaoExtrato}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] uppercase">{e.origem}</Badge>
                      </TableCell>
                      <TableCell>
                        {v ? (
                          <div className="text-xs">
                            <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">
                              <CheckCircle2 className="h-3 w-3 mr-0.5" /> {v.tipoMatch}
                            </Badge>
                            <div className="text-muted-foreground mt-0.5">
                              {inq?.nome} · {fmt(v.valorAplicado)}
                            </div>
                          </div>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-700 text-[10px]">Pendente</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {!v && (
                          <div className="flex flex-col items-start gap-1">
                            <Button size="sm" variant="outline" className="h-7 text-[11px]"
                              onClick={() => onVincularManual(e)}>
                              <Link2 className="h-3 w-3 mr-1" /> Vincular
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 text-[11px]"
                              onClick={() => onClassificar(e)}>
                              <Receipt className="h-3 w-3 mr-1" /> Classificar como outro recebimento
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function VincularEntradaDialog({
  entrada, cobrancas, onClose, onConfirm, onClassificar,
}: {
  entrada: EntradaBancaria | null;
  cobrancas: CobrancaRec[];
  onClose: () => void;
  onConfirm: (cobrancaId: string, valor: number, modo: 'total' | 'parcial' | 'antecipado') => void;
  onClassificar: () => void;
}) {
  const [busca, setBusca] = useState('');
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const [valorAplicado, setValorAplicado] = useState<string>('');
  const cobrancaSel = cobrancas.find(c => c.id === selecionada) ?? null;
  const saldoSel = cobrancaSel ? cobrancaSel.totalEsperado - (cobrancaSel.valorRecebido ?? 0) : 0;
  const valorNum = Number(valorAplicado || 0);
  const modo: 'total' | 'parcial' | 'antecipado' =
    !cobrancaSel ? 'total'
      : valorNum > saldoSel + 0.5 ? 'antecipado'
        : valorNum < saldoSel - 0.5 ? 'parcial' : 'total';

  const sugestao = useMemo(() => {
    if (!entrada) return null;
    return tryAutoMatch(entrada, cobrancas);
  }, [entrada, cobrancas]);

  const cobrancasFiltradas = useMemo(() => {
    if (!entrada) return [];
    const q = busca.toLowerCase().trim();
    return cobrancas.filter(c => {
      if (c.valorRecebido != null && Math.abs(c.valorRecebido - c.totalEsperado) <= 0.5) return false;
      const contrato = contratosRec.find(x => x.id === c.contratoId)!;
      const inq = inquilinosRec.find(i => i.id === contrato.inquilinoId)!;
      if (!q) return true;
      return inq.nome.toLowerCase().includes(q)
        || c.contratoId.toLowerCase().includes(q)
        || String(c.totalEsperado).includes(q)
        || c.competencia.includes(q);
    }).slice(0, 30);
  }, [busca, cobrancas, entrada]);

  if (!entrada) return null;

  return (
    <Dialog open={!!entrada} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Vincular entrada bancária</DialogTitle>
        </DialogHeader>
        <div className="rounded-md border p-3 bg-muted/30 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Entrada</span>
            <span className="font-medium">{fmt(entrada.valor)} · {entrada.tipo} · {fmtDate(entrada.data)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Pagador</span>
            <span>{entrada.pagadorNome ?? '—'}</span>
          </div>
          {sugestao && (
            <div className="text-xs text-emerald-700 pt-1">
              Sugestão automática: {sugestao.motivo} (confiança {sugestao.confianca}).
            </div>
          )}
        </div>

        <Input
          placeholder="Buscar por locatário, contrato, valor ou competência…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />

        <div className="max-h-72 overflow-y-auto border rounded-md divide-y">
          {cobrancasFiltradas.map(c => {
            const contrato = contratosRec.find(x => x.id === c.contratoId)!;
            const inq = inquilinosRec.find(i => i.id === contrato.inquilinoId)!;
            const isSel = selecionada === c.id;
            const isSug = sugestao?.cobrancaId === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setSelecionada(c.id);
                  setValorAplicado(String(entrada.valor));
                }}
                className={`w-full text-left px-3 py-2 hover:bg-muted/40 transition ${isSel ? 'bg-primary/10' : ''}`}
              >
                <div className="flex justify-between text-sm">
                  <div>
                    <div className="font-medium">{inq.nome} {isSug && <Badge className="ml-1 bg-emerald-100 text-emerald-700 text-[10px]">sugestão</Badge>}</div>
                    <div className="text-xs text-muted-foreground">
                      {c.contratoId} · {c.competencia} · venc {fmtDate(c.dataVencimento)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{fmt(c.totalEsperado)}</div>
                    <div className="text-[10px] text-muted-foreground">recebido: {fmt(c.valorRecebido)}</div>
                  </div>
                </div>
              </button>
            );
          })}
          {cobrancasFiltradas.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">Nenhuma cobrança encontrada.</div>
          )}
        </div>

        {selecionada && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Valor aplicado (R$):</label>
            <Input
              type="number"
              value={valorAplicado}
              onChange={(e) => setValorAplicado(e.target.value)}
              className="w-40"
            />
            <span className="text-xs text-muted-foreground">
              Saldo em aberto: {fmt(saldoSel)}
            </span>
          </div>
        )}

        {selecionada && (
          <div className="rounded-md border p-3 text-xs bg-muted/30">
            {modo === 'parcial' && (
              <span className="text-amber-700">
                Pagamento parcial: a cobrança permanece com saldo em aberto de {fmt(saldoSel - valorNum)}.
              </span>
            )}
            {modo === 'antecipado' && (
              <span className="text-violet-700">
                Excedente de {fmt(valorNum - saldoSel)} será registrado como crédito futuro do locatário.
              </span>
            )}
            {modo === 'total' && <span className="text-emerald-700">Quitação integral da competência.</span>}
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="ghost" className="sm:mr-auto" onClick={onClassificar}>
            <Receipt className="h-4 w-4 mr-1.5" /> Classificar como outro recebimento
          </Button>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            disabled={!selecionada || !valorAplicado || Number(valorAplicado) <= 0}
            onClick={() => onConfirm(selecionada!, Number(valorAplicado), modo)}
          >
            Vincular
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AgruparCobrancasDialog({
  open, cobrancas, onClose, onConfirm,
}: {
  open: boolean;
  cobrancas: CobrancaRec[];
  onClose: () => void;
  onConfirm: (cobrancaIds: string[]) => void;
}) {
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set());

  // Agrupa visualmente por inquilino
  const porInquilino = useMemo(() => {
    const map = new Map<string, CobrancaRec[]>();
    cobrancas.forEach(c => {
      const inqId = contratosRec.find(x => x.id === c.contratoId)!.inquilinoId;
      if (!map.has(inqId)) map.set(inqId, []);
      map.get(inqId)!.push(c);
    });
    return [...map.entries()].filter(([_, arr]) => arr.length >= 2);
  }, [cobrancas]);

  const toggle = (id: string) => {
    const next = new Set(selecionadas);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelecionadas(next);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setSelecionadas(new Set()); onClose(); } }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Agrupar cobranças em um único boleto</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Selecione 2+ cobranças do mesmo locatário para emitir um boleto consolidado (split payment).
        </p>
        <div className="max-h-80 overflow-y-auto border rounded-md divide-y">
          {porInquilino.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Nenhum locatário com 2+ contratos não agrupados nesta competência.
            </div>
          )}
          {porInquilino.map(([inqId, arr]) => {
            const inq = inquilinosRec.find(i => i.id === inqId)!;
            return (
              <div key={inqId} className="p-3">
                <div className="text-sm font-medium mb-2">{inq.nome}</div>
                <div className="space-y-1">
                  {arr.map(c => {
                    const ct = contratosRec.find(x => x.id === c.contratoId)!;
                    const un = ct.unidadeIds.map(uid => unidadesRec.find(u => u.id === uid)?.identificacao).filter(Boolean).join(', ');
                    return (
                      <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/30 rounded px-2 py-1">
                        <input
                          type="checkbox"
                          checked={selecionadas.has(c.id)}
                          onChange={() => toggle(c.id)}
                        />
                        <span className="flex-1">{c.contratoId} · {un}</span>
                        <span className="font-medium">{fmt(c.totalEsperado)}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setSelecionadas(new Set()); onClose(); }}>Cancelar</Button>
          <Button disabled={selecionadas.size < 2} onClick={() => { onConfirm([...selecionadas]); setSelecionadas(new Set()); }}>
            Agrupar ({selecionadas.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AjusteManualDialog({
  cobranca, onClose, onConfirm,
}: {
  cobranca: CobrancaRec | null;
  onClose: () => void;
  onConfirm: (a: Omit<AjusteMensal, 'id' | 'origem'>) => void;
}) {
  const [tipo, setTipo] = useState<TipoAjuste>('ajuste_manual');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [observacao, setObservacao] = useState('');

  if (!cobranca) return null;

  return (
    <Dialog open={!!cobranca} onOpenChange={(o) => { if (!o) { setDescricao(''); setValor(''); setObservacao(''); setTipo('ajuste_manual'); onClose(); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar ajuste manual</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Tipo</label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoAjuste)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ajuste_manual">Ajuste manual livre</SelectItem>
                <SelectItem value="desconto_negociado">Desconto negociado</SelectItem>
                <SelectItem value="condicao_especial">Condição especial</SelectItem>
                <SelectItem value="inadimplencia_arrastada">Inadimplência arrastada</SelectItem>
                <SelectItem value="credito_antecipado">Crédito antecipado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Descrição</label>
            <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex.: Bonificação por antecipação" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">
              Valor (R$ — use negativo para abater)
            </label>
            <Input type="number" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="Ex.: -1500" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Observação (opcional)</label>
            <Textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            disabled={!descricao || !valor || isNaN(Number(valor))}
            onClick={() => {
              onConfirm({ tipo, descricao, valor: Number(valor), observacao: observacao || undefined });
              setDescricao(''); setValor(''); setObservacao(''); setTipo('ajuste_manual');
            }}
          >
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Botões de exportação (Excel / OFX) ───────────────
function ExportButtons({
  cobrancas, entradas, vinculos, grupos, competencia,
}: {
  cobrancas: CobrancaRec[];
  entradas: EntradaBancaria[];
  vinculos: VinculoConciliacao[];
  grupos: GrupoCobranca[];
  competencia: string;
}) {
  function rowsCobrancas() {
    return cobrancas.map((c) => {
      const contrato = contratosRec.find((x) => x.id === c.contratoId);
      const ed = edificiosRec.find((e) => e.id === contrato?.edificioId);
      const fu = ed ? fundos.find((f) => f.id === ed.fundoId) : null;
      const un = unidadesRec.find((u) => contrato?.unidadeIds?.includes(u.id));
      const inq = inquilinosRec.find((i) => i.id === contrato?.inquilinoId);
      return {
        fundo: fu?.nome ?? '',
        edificio: ed?.nome ?? '',
        unidade: un?.identificacao ?? '',
        contrato: c.contratoId,
        locatario: inq?.nome ?? '',
        competencia: c.competencia,
        categoria: '',
        valorEsperado: c.totalEsperado,
        valorCobrado: c.valorCobradoBoleto ?? 0,
        valorRecebido: c.valorRecebido ?? 0,
        status: c.status,
        vencimento: c.dataVencimento,
        pagoEm: c.dataPagamentoEfetiva ?? '',
      };
    });
  }

  function rowsEntradas() {
    return entradas.map((e) => ({
      data: e.data,
      tipo: e.tipo,
      pagador: e.pagadorNome ?? '',
      documento: e.pagadorDocumento ?? '',
      valor: e.valor,
      identificador: e.identificadorBoleto ?? '',
      descricao: e.descricaoExtrato,
      vinculada: vinculos.some((v) => v.entradaId === e.id) ? 'Sim' : 'Não',
    }));
  }

  function exportarExcel() {
    exportExcel({
      fileName: `conciliacao-${new Date().toISOString().slice(0, 10)}.xlsx`,
      sheets: [
        { ...TEMPLATE_PADRAO.cobrancas, rows: rowsCobrancas() },
        { ...TEMPLATE_PADRAO.entradas,  rows: rowsEntradas() },
      ],
    });
    toast.success('Excel gerado');
  }
  function exportarOFX() {
    exportOFX({
      fileName: `entradas-${new Date().toISOString().slice(0, 10)}.ofx`,
      transactions: entradas.map((e) => ({
        date: e.data,
        amount: e.valor,
        memo: e.descricaoExtrato,
        fitid: e.id,
      })),
    });
    toast.success('OFX gerado');
  }

  /** Exporta apenas as cobranças preparadas da competência — base do arquivo bancário. */
  function exportarCobrancas() {
    const preparadas = cobrancas.filter(c => c.competencia === competencia && c.identificadorCobranca);
    if (preparadas.length === 0) {
      toast.error('Nenhuma cobrança preparada nesta competência.');
      return;
    }
    exportExcel({
      fileName: `cobrancas-${competencia}.xlsx`,
      sheets: [{
        ...TEMPLATE_PADRAO.cobrancasPreparadas,
        rows: preparadas.map((c) => {
          const contrato = contratosRec.find((x) => x.id === c.contratoId);
          const ed = edificiosRec.find((e) => e.id === contrato?.edificioId);
          const fu = ed ? fundos.find((f) => f.id === ed.fundoId) : null;
          const un = unidadesRec.find((u) => contrato?.unidadeIds?.includes(u.id));
          const inq = inquilinosRec.find((i) => i.id === contrato?.inquilinoId);
          const grupo = grupos.find(g => g.id === c.grupoId);
          return {
            identificador: c.identificadorCobranca,
            competencia: c.competencia,
            fundo: fu?.nome ?? '',
            edificio: ed?.nome ?? '',
            contrato: c.contratoId,
            locatario: inq?.nome ?? '',
            documento: inq?.documento ?? '',
            unidade: un?.identificacao ?? '',
            valorEsperado: c.totalEsperado,
            vencimento: c.dataVencimento,
            preparadaEm: c.cobrancaPreparadaEm ?? '',
            grupo: grupo?.identificadorBoleto ?? '',
          };
        }),
      }],
    });
    toast.success(`${preparadas.length} cobrança(s) exportada(s).`);
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={exportarCobrancas}>
        <Banknote className="w-4 h-4 mr-2" /> Exportar cobranças
      </Button>
      <Button variant="outline" size="sm" onClick={exportarExcel}>
        <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel
      </Button>
      <Button variant="outline" size="sm" onClick={exportarOFX}>
        <Download className="w-4 h-4 mr-2" /> OFX
      </Button>
    </div>
  );
}


// ─── Classificar entrada não identificada como Outro Recebimento ───
function ClassificarEntradaDialog({
  entrada, onClose, onConfirm,
}: {
  entrada: EntradaBancaria | null;
  onClose: () => void;
  onConfirm: (dados: {
    categoria: CategoriaOutroRecebimento;
    fundoId?: string | null;
    edificioId?: string | null;
    contratoId?: string | null;
    locatarioId?: string | null;
    descricao: string;
  }) => void;
}) {
  const [categoria, setCategoria] = useState<CategoriaOutroRecebimento>('outros');
  const [edificioId, setEdificioId] = useState<string>('');
  const [locatarioId, setLocatarioId] = useState<string>('nenhum');
  const [descricao, setDescricao] = useState('');

  if (!entrada) return null;
  const edificio = edificiosRec.find(e => e.id === edificioId);

  return (
    <Dialog open={!!entrada} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Classificar como outro recebimento</DialogTitle>
        </DialogHeader>
        <div className="rounded-md border p-3 bg-muted/30 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Entrada</span>
            <span className="font-medium">{fmt(entrada.valor)} · {entrada.tipo} · {fmtDate(entrada.data)}</span>
          </div>
          <div className="text-xs text-muted-foreground">{entrada.descricaoExtrato}</div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Categoria</label>
            <Select value={categoria} onValueChange={(v) => setCategoria(v as CategoriaOutroRecebimento)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIAS_ORDEM.map(c => (
                  <SelectItem key={c} value={c}>{CATEGORIA_META_PADRAO[c].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground mt-1">
              {CATEGORIA_META_PADRAO[categoria].compoeReceita
                ? 'Compõe Receita Imobiliária (entra no NOI).'
                : 'Não compõe Receita Imobiliária.'}
            </p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Ativo</label>
            <Select value={edificioId} onValueChange={setEdificioId}>
              <SelectTrigger><SelectValue placeholder="Selecione o ativo" /></SelectTrigger>
              <SelectContent>
                {edificiosRec.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Contraparte / locatário</label>
            <Select value={locatarioId} onValueChange={setLocatarioId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="nenhum">Não vinculado</SelectItem>
                {inquilinosRec.map(i => <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Descrição</label>
            <Input value={descricao} onChange={(e) => setDescricao(e.target.value)}
              placeholder={entrada.descricaoExtrato} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onConfirm({
            categoria,
            fundoId: edificio?.fundoId ?? null,
            edificioId: edificioId || null,
            contratoId: null,
            locatarioId: locatarioId === 'nenhum' ? null : locatarioId,
            descricao,
          })}>
            Classificar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
