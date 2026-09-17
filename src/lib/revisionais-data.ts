// Dados e helpers para o módulo de Revisionais
// Regra: contrato precisa de 3 anos (36 meses) sem alteração de valor
// além do reajuste por índice. Acordo amigável zera a contagem.

export type AlteracaoValorTipo = 'reajuste_indice' | 'acordo_amigavel' | 'revisional' | 'reajuste_negociado';

export interface AlteracaoValor {
  id: string;
  contrato_id: string;
  data: string; // YYYY-MM-DD
  tipo: AlteracaoValorTipo;
  valor_anterior: number;
  valor_novo: number;
  observacao?: string;
}

export type RevisionalMotivo = 'desvalorizacao_imovel' | 'mudanca_entorno' | 'crise_inflacao';
export type RevisionalStatus =
  | 'elegivel'
  | 'em_analise'
  | 'negociacao_iniciada'
  | 'proposta_enviada'
  | 'acordo'
  | 'encerrada'
  | 'concluida'
  | 'rejeitada';

export interface Revisional {
  id: string;
  contrato_id: string;
  data_solicitacao: string;
  motivo: RevisionalMotivo;
  descricao: string;
  valor_pleiteado: number;
  valor_acordado?: number;
  status: RevisionalStatus;
  data_conclusao?: string;
}

export const motivoLabels: Record<RevisionalMotivo, string> = {
  desvalorizacao_imovel: 'Desvalorização do imóvel',
  mudanca_entorno: 'Mudança no entorno',
  crise_inflacao: 'Crise ou inflação',
};

export const motivoDescricoes: Record<RevisionalMotivo, string> = {
  desvalorizacao_imovel: 'Falta de manutenção estrutural ou problemas graves na vizinhança',
  mudanca_entorno: 'Desvalorização do bairro, criminalidade ou fechamento de comércios',
  crise_inflacao: 'Índices de reajuste subiram de forma desproporcional ao mercado local',
};

// Histórico de alterações de valor (mock). Reajustes por índice NÃO zeram o prazo.
export const mockAlteracoesValor: AlteracaoValor[] = [
  // tc1 — Magazine Luiza (assinado 2022-03-01): só reajustes anuais → ELEGÍVEL
  { id: 'av1', contrato_id: 'tc1', data: '2023-03-01', tipo: 'reajuste_indice', valor_anterior: 180000, valor_novo: 188100, observacao: 'IPCA +4.5%' },
  { id: 'av2', contrato_id: 'tc1', data: '2024-03-01', tipo: 'reajuste_indice', valor_anterior: 188100, valor_novo: 195124, observacao: 'IPCA +3.73%' },
  { id: 'av3', contrato_id: 'tc1', data: '2025-03-01', tipo: 'reajuste_indice', valor_anterior: 195124, valor_novo: 203105, observacao: 'IPCA +4.09%' },

  // tc2 — Ambev (assinado 2021-08-01): teve ACORDO AMIGÁVEL em 2024-01-15 → PRAZO REINICIADO
  { id: 'av4', contrato_id: 'tc2', data: '2022-08-01', tipo: 'reajuste_indice', valor_anterior: 207000, valor_novo: 220000 },
  { id: 'av5', contrato_id: 'tc2', data: '2023-08-01', tipo: 'reajuste_indice', valor_anterior: 220000, valor_novo: 228500 },
  { id: 'av6', contrato_id: 'tc2', data: '2024-01-15', tipo: 'acordo_amigavel', valor_anterior: 228500, valor_novo: 215000, observacao: 'Acordo de redução pós-pandemia' },
  { id: 'av7', contrato_id: 'tc2', data: '2025-01-15', tipo: 'reajuste_indice', valor_anterior: 215000, valor_novo: 223000 },

  // tc3 — Solistica (assinado 2023-01-01): só reajustes → ELEGÍVEL desde jan/2026
  { id: 'av8', contrato_id: 'tc3', data: '2024-01-01', tipo: 'reajuste_indice', valor_anterior: 162500, valor_novo: 168750 },
  { id: 'av9', contrato_id: 'tc3', data: '2025-01-01', tipo: 'reajuste_indice', valor_anterior: 168750, valor_novo: 175500 },

  // tc4 — Tok&Stok (assinado 2022-11-01): elegível, mas já existe revisional aberta
  { id: 'av10', contrato_id: 'tc4', data: '2023-11-01', tipo: 'reajuste_indice', valor_anterior: 127600, valor_novo: 132300 },
  { id: 'av11', contrato_id: 'tc4', data: '2024-11-01', tipo: 'reajuste_indice', valor_anterior: 132300, valor_novo: 137600 },

  // tc6 — DHL (assinado 2023-06-01): só reajustes → 36 meses em jun/2026 (ELEGÍVEL)
  { id: 'av12', contrato_id: 'tc6', data: '2024-06-01', tipo: 'reajuste_indice', valor_anterior: 202800, valor_novo: 211000 },
  { id: 'av13', contrato_id: 'tc6', data: '2025-06-01', tipo: 'reajuste_indice', valor_anterior: 211000, valor_novo: 219500 },
];

// Revisionais já solicitadas (ativas)
export const mockRevisionais: Revisional[] = [
  {
    id: 'rv1',
    contrato_id: 'tc4',
    data_solicitacao: '2026-04-15',
    motivo: 'mudanca_entorno',
    descricao: 'Fechamento do polo logístico vizinho impactou movimento e segurança da região.',
    valor_pleiteado: 120000,
    status: 'em_analise',
  },
];

// Histórico de revisionais anteriores (já concluídas ou rejeitadas)
export const mockHistoricoRevisionais: Revisional[] = [
  {
    id: 'rvh1',
    contrato_id: 'tc2',
    data_solicitacao: '2023-09-10',
    motivo: 'crise_inflacao',
    descricao: 'Descompasso entre IGP-M acumulado e preços de mercado da região.',
    valor_pleiteado: 200000,
    valor_acordado: 215000,
    status: 'concluida',
    data_conclusao: '2024-01-15',
  },
  {
    id: 'rvh2',
    contrato_id: 'tc1',
    data_solicitacao: '2022-06-20',
    motivo: 'desvalorizacao_imovel',
    descricao: 'Solicitação anterior do locatário alegando problemas estruturais — não comprovado.',
    valor_pleiteado: 160000,
    status: 'rejeitada',
    data_conclusao: '2022-09-05',
  },
  {
    id: 'rvh3',
    contrato_id: 'tc6',
    data_solicitacao: '2024-02-12',
    motivo: 'mudanca_entorno',
    descricao: 'Obras viárias na região impactaram logística de entrada.',
    valor_pleiteado: 190000,
    valor_acordado: 205000,
    status: 'concluida',
    data_conclusao: '2024-05-30',
  },
];

export const statusRevisionalLabels: Record<RevisionalStatus, string> = {
  elegivel: 'Elegível',
  em_analise: 'Em análise',
  negociacao_iniciada: 'Negociação iniciada',
  proposta_enviada: 'Proposta enviada',
  acordo: 'Acordo',
  encerrada: 'Encerrada',
  concluida: 'Concluída',
  rejeitada: 'Rejeitada',
};

/** Status disponíveis para registro/edição de revisional */
export const revisionalStatusOptions: RevisionalStatus[] = [
  'elegivel', 'em_analise', 'negociacao_iniciada', 'proposta_enviada', 'acordo', 'encerrada',
];

export const statusRevisionalColor: Record<RevisionalStatus, string> = {
  elegivel: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  em_analise: 'bg-blue-100 text-blue-700 border-blue-200',
  negociacao_iniciada: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  proposta_enviada: 'bg-violet-100 text-violet-700 border-violet-200',
  acordo: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  encerrada: 'bg-slate-100 text-slate-700 border-slate-200',
  concluida: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  rejeitada: 'bg-rose-100 text-rose-700 border-rose-200',
};

export const tipoAlteracaoLabels: Record<AlteracaoValorTipo, string> = {
  reajuste_indice: 'Reajuste por índice',
  acordo_amigavel: 'Acordo amigável',
  revisional: 'Revisional',
  reajuste_negociado: 'Reajuste negociado',
};

// ─── HELPERS DE CÁLCULO ────────────────────────────────────────

export function getDataBasePrazo(contratoId: string, dataAssinatura: string, alteracoes: AlteracaoValor[]): string {
  // Acordos amigáveis e reajustes negociados zeram o prazo. Reajuste por índice NÃO zera.
  const resets = alteracoes
    .filter(a => a.contrato_id === contratoId && (a.tipo === 'acordo_amigavel' || a.tipo === 'reajuste_negociado'))
    .sort((a, b) => b.data.localeCompare(a.data));
  return resets.length > 0 ? resets[0].data : dataAssinatura;
}

export function mesesEntre(inicio: string, fim: Date = new Date()): number {
  const i = new Date(inicio);
  return (fim.getFullYear() - i.getFullYear()) * 12 + (fim.getMonth() - i.getMonth());
}

export type StatusElegibilidade = 'em_andamento' | 'elegivel' | 'prazo_reiniciado' | 'revisional_solicitada';

export interface RevisionalRow {
  contrato_id: string;
  data_assinatura: string;
  data_base: string;
  prazo_reiniciado: boolean;
  meses_decorridos: number;
  meses_restantes: number;
  progresso: number; // 0..1
  status: StatusElegibilidade;
  revisional?: Revisional;
}

export function calcRevisionalRow(
  contratoId: string,
  dataAssinatura: string,
  alteracoes: AlteracaoValor[],
  revisionais: Revisional[],
): RevisionalRow {
  const data_base = getDataBasePrazo(contratoId, dataAssinatura, alteracoes);
  const prazo_reiniciado = data_base !== dataAssinatura;
  const meses_decorridos = Math.max(0, mesesEntre(data_base));
  const meses_restantes = Math.max(0, 36 - meses_decorridos);
  const progresso = Math.min(1, meses_decorridos / 36);
  const revisional = revisionais.find(r => r.contrato_id === contratoId);

  let status: StatusElegibilidade;
  if (revisional) status = 'revisional_solicitada';
  else if (meses_decorridos >= 36) status = 'elegivel';
  else if (prazo_reiniciado) status = 'prazo_reiniciado';
  else status = 'em_andamento';

  return {
    contrato_id: contratoId,
    data_assinatura: dataAssinatura,
    data_base,
    prazo_reiniciado,
    meses_decorridos,
    meses_restantes,
    progresso,
    status,
    revisional,
  };
}

export const statusLabels: Record<StatusElegibilidade, string> = {
  em_andamento: 'Em andamento',
  elegivel: 'Elegível',
  prazo_reiniciado: 'Prazo reiniciado',
  revisional_solicitada: 'Revisional solicitada',
};

export const statusBadgeColor: Record<StatusElegibilidade, string> = {
  em_andamento: 'bg-slate-100 text-slate-700 border-slate-200',
  elegivel: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  prazo_reiniciado: 'bg-amber-100 text-amber-700 border-amber-200',
  revisional_solicitada: 'bg-blue-100 text-blue-700 border-blue-200',
};

export const statusBarColor: Record<StatusElegibilidade, string> = {
  em_andamento: 'bg-slate-400',
  elegivel: 'bg-emerald-500',
  prazo_reiniciado: 'bg-amber-500',
  revisional_solicitada: 'bg-blue-500',
};
