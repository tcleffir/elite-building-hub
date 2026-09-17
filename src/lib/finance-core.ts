// ============================================================================
// FONTE ÚNICA DOS DADOS FINANCEIROS
// ----------------------------------------------------------------------------
// Contratos            → valor contratual esperado  (reconciliation-engine)
// Conciliação          → valor efetivamente recebido (CobrancaRec.valorRecebido)
// Fechamento Mensal    → consome ambos (buildFechamento)
// Inadimplência        → diferença VENCIDA entre esperado e recebido
// Outros Recebimentos  → valores fora da receita normal de locação
// Despesas & NOI       → receita conciliada − despesas conciliadas
// ============================================================================

import {
  contratosRec, edificiosRec, inquilinosRec, unidadesRec,
  cobrancasSeed, cobrancasHistoricas,
  type CobrancaRec,
} from "./reconciliation-data";
import { enrichCobranca } from "./reconciliation-engine";
import type { OutroRecebimento } from "./other-receipts-data";
import { CATEGORIA_META } from "./other-receipts-data";

/** Data de referência do mock (a plataforma "hoje"). */
export const HOJE = new Date('2026-04-15');
export const COMPETENCIA_ATUAL = '2026-04';

export const MESES_ABREV = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const fmtBRL = (v: number | null | undefined) =>
  v == null ? '—' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
export const fmtDateBR = (s: string | null | undefined) =>
  !s ? '—' : new Date(s + (s.length === 10 ? 'T12:00:00' : '')).toLocaleDateString('pt-BR');

export function compLabel(comp: string) {
  const [y, m] = comp.split('-').map(Number);
  return `${MESES_ABREV[m - 1]}/${y}`;
}

/** Lista as N competências terminando em `fim` (inclusive), em ordem crescente. */
export function competenciasAte(fim: string, n = 12): string[] {
  const [y, m] = fim.split('-').map(Number);
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(y, m - 1 - i, 1);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return out;
}

export function competenciaSeguinte(comp: string) {
  const [y, m] = comp.split('-').map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Substitui placeholders (-1) do seed histórico pelo esperado calculado do contrato. */
function normalize(c: CobrancaRec): CobrancaRec {
  const e = enrichCobranca(c);
  return {
    ...c,
    valorCobradoBoleto: c.valorCobradoBoleto === -1 ? e.totalEsperado : c.valorCobradoBoleto,
    valorRecebido: c.valorRecebido === -1 ? e.totalEsperado : c.valorRecebido,
  };
}

/** Base inicial de cobranças: histórico (12m) + competências hand-crafted, já enriquecidas. */
export function buildCobrancasIniciais(): CobrancaRec[] {
  const base = [...cobrancasHistoricas, ...cobrancasSeed].map(normalize).map(c => enrichCobranca(c));
  return base.map(c => enrichCobranca(c, base));
}

// ---------------------------------------------------------------------------
// Escopo / filtros
// ---------------------------------------------------------------------------

export interface EscopoFinanceiro {
  fundoId?: string;    // 'all' | id
  edificioId?: string; // 'all' | id
}

export function contratoInEscopo(contratoId: string, esc: EscopoFinanceiro): boolean {
  const ct = contratosRec.find(x => x.id === contratoId);
  if (!ct) return false;
  if (esc.edificioId && esc.edificioId !== 'all' && ct.edificioId !== esc.edificioId) return false;
  if (esc.fundoId && esc.fundoId !== 'all') {
    const ed = edificiosRec.find(e => e.id === ct.edificioId);
    if (!ed || ed.fundoId !== esc.fundoId) return false;
  }
  return true;
}

export function edificioDoContrato(contratoId: string) {
  const ct = contratosRec.find(x => x.id === contratoId);
  return ct ? edificiosRec.find(e => e.id === ct.edificioId) : undefined;
}
export function inquilinoDoContrato(contratoId: string) {
  const ct = contratosRec.find(x => x.id === contratoId);
  return ct ? inquilinosRec.find(i => i.id === ct.inquilinoId) : undefined;
}
export function unidadesDoContrato(contratoId: string) {
  const ct = contratosRec.find(x => x.id === contratoId);
  if (!ct) return '—';
  return ct.unidadeIds
    .map(uid => unidadesRec.find(u => u.id === uid)?.identificacao)
    .filter(Boolean).join(', ') || '—';
}

// ---------------------------------------------------------------------------
// Política de multa e juros (parametrizável)
// ---------------------------------------------------------------------------

export interface PoliticaEncargos {
  multaPct: number;   // % sobre o valor em aberto
  jurosAmPct: number; // % ao mês, pro rata die
}
export const POLITICA_PADRAO: PoliticaEncargos = { multaPct: 2, jurosAmPct: 1 };

export function calcEncargos(valorAberto: number, diasAtraso: number, pol = POLITICA_PADRAO) {
  if (valorAberto <= 0 || diasAtraso <= 0) return { multa: 0, juros: 0 };
  return {
    multa: valorAberto * (pol.multaPct / 100),
    juros: valorAberto * (pol.jurosAmPct / 100) * (diasAtraso / 30),
  };
}

export function diasEmAtraso(dataVencimento: string, hoje = HOJE) {
  return Math.max(0, Math.round((hoje.getTime() - new Date(dataVencimento + 'T12:00:00').getTime()) / 86400000));
}

// ---------------------------------------------------------------------------
// FECHAMENTO MENSAL — Esperado x Recebido
// ---------------------------------------------------------------------------

export interface FechamentoBreakdown {
  aluguel: number;
  iptu: number;
  multa: number;
  juros: number;
  ajustes: number;
  total: number;
}

export interface FechamentoMes {
  competencia: string;
  label: string;
  esperado: FechamentoBreakdown;
  recebido: FechamentoBreakdown;
  aberto: number;
  pctRecebido: number;
  futuro: boolean;
}

/**
 * Constrói a série mensal do Fechamento.
 * Esperado vem da posição contratual da competência (aluguel + IPTU + ajustes).
 * Recebido vem da conciliação (valorRecebido), rateado entre aluguel/IPTU e
 * acrescido dos encargos efetivamente pagos quando houve atraso.
 */
export function buildFechamento(
  cobrancas: CobrancaRec[],
  esc: EscopoFinanceiro,
  competencias: string[],
  pol = POLITICA_PADRAO,
  hoje = HOJE,
): FechamentoMes[] {
  return competencias.map(comp => {
    const doMes = cobrancas.filter(c => c.competencia === comp && contratoInEscopo(c.contratoId, esc));

    const esperado: FechamentoBreakdown = { aluguel: 0, iptu: 0, multa: 0, juros: 0, ajustes: 0, total: 0 };
    const recebido: FechamentoBreakdown = { aluguel: 0, iptu: 0, multa: 0, juros: 0, ajustes: 0, total: 0 };

    for (const c of doMes) {
      const ajustes = (c.ajustes ?? []).reduce((s, a) => s + a.valor, 0);
      esperado.aluguel += c.aluguelEsperado;
      esperado.iptu += c.iptuEsperado;
      esperado.ajustes += ajustes;

      const rec = c.valorRecebido ?? 0;
      if (rec > 0) {
        const base = c.aluguelEsperado + c.iptuEsperado;
        const ratio = base > 0 ? c.aluguelEsperado / base : 1;
        // Encargos: pagos apenas quando o pagamento ocorreu após o vencimento.
        let multa = 0, juros = 0;
        if (c.dataPagamentoEfetiva) {
          const atraso = Math.max(0, Math.round(
            (new Date(c.dataPagamentoEfetiva + 'T12:00:00').getTime()
              - new Date(c.dataVencimento + 'T12:00:00').getTime()) / 86400000));
          if (atraso > 0) {
            const enc = calcEncargos(c.totalEsperado, atraso, pol);
            multa = enc.multa; juros = enc.juros;
          }
        }
        const principal = Math.max(0, rec);
        recebido.aluguel += principal * ratio;
        recebido.iptu += principal * (1 - ratio);
        recebido.multa += multa;
        recebido.juros += juros;
      }
    }

    esperado.total = esperado.aluguel + esperado.iptu + esperado.ajustes;
    recebido.total = recebido.aluguel + recebido.iptu + recebido.multa + recebido.juros;

    const [y, m] = comp.split('-').map(Number);
    const futuro = new Date(y, m - 1, 1) > new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const aberto = Math.max(0, esperado.total - (recebido.aluguel + recebido.iptu));

    return {
      competencia: comp,
      label: compLabel(comp),
      esperado, recebido, aberto,
      pctRecebido: esperado.total > 0 ? ((recebido.aluguel + recebido.iptu) / esperado.total) * 100 : 0,
      futuro,
    };
  });
}

// ---------------------------------------------------------------------------
// INADIMPLÊNCIA — derivada da diferença VENCIDA entre esperado e recebido
// ---------------------------------------------------------------------------

export type MetodologiaInadimplencia =
  | 'aberto_vencido_sobre_esperado'
  | 'aberto_vencido_sobre_receita_contratada'
  | 'acima_30d_sobre_esperado';

export const METODOLOGIA_LABEL: Record<MetodologiaInadimplencia, string> = {
  aberto_vencido_sobre_esperado: 'Aberto vencido ÷ esperado da competência',
  aberto_vencido_sobre_receita_contratada: 'Aberto vencido ÷ receita contratada (12m)',
  acima_30d_sobre_esperado: 'Aberto vencido > 30 dias ÷ esperado da competência',
};

export type StatusContato = 'nao_contatado' | 'contatado' | 'prometeu' | 'acordo';

export interface InadimplenciaRow {
  id: string;              // = cobrancaId
  cobrancaId: string;
  contratoId: string;
  edificioId: string;
  edificioNome: string;
  inquilinoId: string;
  inquilinoNome: string;
  inquilinoEmail: string;
  inquilinoTelefone: string;
  unidade: string;
  competencia: string;
  dataVencimento: string;
  valorEsperado: number;
  valorRecebido: number;
  valorAberto: number;
  diasAtraso: number;
  multa: number;
  juros: number;
  totalDevido: number;
}

/** Todas as cobranças vencidas com saldo em aberto dentro do escopo. */
export function buildInadimplencia(
  cobrancas: CobrancaRec[],
  esc: EscopoFinanceiro,
  opts: { competencias?: string[]; pol?: PoliticaEncargos; hoje?: Date } = {},
): InadimplenciaRow[] {
  const pol = opts.pol ?? POLITICA_PADRAO;
  const hoje = opts.hoje ?? HOJE;
  return cobrancas
    .filter(c => contratoInEscopo(c.contratoId, esc))
    .filter(c => !opts.competencias || opts.competencias.includes(c.competencia))
    .map(c => {
      const aberto = c.totalEsperado - (c.valorRecebido ?? 0);
      const dias = diasEmAtraso(c.dataVencimento, hoje);
      if (aberto <= 0.5 || dias <= 0) return null;
      const ed = edificioDoContrato(c.contratoId);
      const inq = inquilinoDoContrato(c.contratoId);
      const enc = calcEncargos(aberto, dias, pol);
      return {
        id: c.id,
        cobrancaId: c.id,
        contratoId: c.contratoId,
        edificioId: ed?.id ?? '',
        edificioNome: ed?.nome ?? '—',
        inquilinoId: inq?.id ?? '',
        inquilinoNome: inq?.nome ?? '—',
        inquilinoEmail: inq?.email ?? '',
        inquilinoTelefone: inq?.telefone ?? '',
        unidade: unidadesDoContrato(c.contratoId),
        competencia: c.competencia,
        dataVencimento: c.dataVencimento,
        valorEsperado: c.totalEsperado,
        valorRecebido: c.valorRecebido ?? 0,
        valorAberto: aberto,
        diasAtraso: dias,
        multa: enc.multa,
        juros: enc.juros,
        totalDevido: aberto + enc.multa + enc.juros,
      } as InadimplenciaRow;
    })
    .filter((x): x is InadimplenciaRow => x !== null)
    .sort((a, b) => b.diasAtraso - a.diasAtraso);
}

/** Indicador Inadimplência (%) — metodologia parametrizável. */
export function calcIndiceInadimplencia(
  rows: InadimplenciaRow[],
  serie: FechamentoMes[],
  metodologia: MetodologiaInadimplencia,
  competenciaAtual: string,
): { pct: number; numerador: number; denominador: number; descricao: string } {
  const mesAtual = serie.find(s => s.competencia === competenciaAtual);
  const esperadoMes = mesAtual?.esperado.total ?? 0;
  const receita12m = serie.reduce((s, m) => s + m.esperado.total, 0);

  let numerador = rows.reduce((s, r) => s + r.valorAberto, 0);
  let denominador = esperadoMes;

  if (metodologia === 'aberto_vencido_sobre_receita_contratada') denominador = receita12m;
  if (metodologia === 'acima_30d_sobre_esperado') {
    numerador = rows.filter(r => r.diasAtraso > 30).reduce((s, r) => s + r.valorAberto, 0);
  }

  return {
    pct: denominador > 0 ? (numerador / denominador) * 100 : 0,
    numerador, denominador,
    descricao: METODOLOGIA_LABEL[metodologia],
  };
}

// ---------------------------------------------------------------------------
// RECEITA IMOBILIÁRIA (base do NOI) — conciliada + outros recebimentos elegíveis
// ---------------------------------------------------------------------------

export function receitaImobiliariaDoMes(
  serieMes: FechamentoMes | undefined,
  outros: OutroRecebimento[],
  esc: EscopoFinanceiro,
  competencia: string,
): number {
  const locacao = serieMes ? serieMes.recebido.total : 0;
  const extra = outros
    .filter(o => CATEGORIA_META[o.categoria]?.compoeReceita)
    .filter(o => !esc.edificioId || esc.edificioId === 'all' || o.edificioId === esc.edificioId)
    .filter(o => !esc.fundoId || esc.fundoId === 'all' || o.fundoId === esc.fundoId)
    .flatMap(o => o.parcelas)
    .filter(p => p.status === 'recebido' && p.vencimento.slice(0, 7) === competencia)
    .reduce((s, p) => s + p.valor, 0);
  return locacao + extra;
}
