// Outros recebimentos — valores que NÃO pertencem à receita normal de locação.
// Entradas bancárias não identificadas nascem na Conciliação Financeira e só
// migram para cá quando o usuário escolhe "Classificar como outro recebimento".

export type CategoriaOutroRecebimento =
  | 'caucao'
  | 'multa_extraordinaria'
  | 'indenizacao'
  | 'reembolso'
  | 'benfeitoria'
  | 'outros';

export type StatusParcela = 'a_receber' | 'recebido';
export type StatusRecebimento = 'pendente' | 'parcial' | 'recebido';
export type OrigemRecebimento = 'manual' | 'conciliacao';

export interface AuditEntry {
  id: string;
  acao: string;
  usuario: string;
  data: string; // ISO
  detalhes?: string;
}

export interface ParcelaRecebimento {
  id: string;
  outroRecebimentoId: string;
  numero: number;
  valor: number;
  vencimento: string; // YYYY-MM-DD
  status: StatusParcela;
  entradaId?: string | null; // vínculo com EntradaBancaria
}

export interface OutroRecebimento {
  id: string;
  categoria: CategoriaOutroRecebimento;
  valorTotal: number;
  parcelado: boolean;
  numParcelas: number;
  fundoId?: string | null;
  edificioId?: string | null;
  unidadeId?: string | null;
  contratoId?: string | null;   // contrato vinculado (opcional)
  locatarioId?: string | null;  // locatário / contraparte
  contraparteNome?: string | null;
  descricao: string;
  observacao?: string;
  status: StatusRecebimento;
  origem: OrigemRecebimento;
  criadoEm: string;
  parcelas: ParcelaRecebimento[];
  audit: AuditEntry[];
}

/** Configuração por categoria — editável pelo usuário na tela. */
export interface CategoriaConfig {
  label: string;
  cls: string;
  compoeReceita: boolean;        // Compõe Receita Imobiliária
  compoeInadimplencia: boolean;  // Compõe Inadimplência Locatícia
}

export const CATEGORIA_META_PADRAO: Record<CategoriaOutroRecebimento, CategoriaConfig> = {
  caucao:               { label: 'Caução',              cls: 'bg-violet-100 text-violet-700', compoeReceita: false, compoeInadimplencia: false },
  multa_extraordinaria: { label: 'Multa extraordinária', cls: 'bg-rose-100 text-rose-700',    compoeReceita: true,  compoeInadimplencia: true },
  indenizacao:          { label: 'Indenização',          cls: 'bg-amber-100 text-amber-700',  compoeReceita: true,  compoeInadimplencia: false },
  reembolso:            { label: 'Reembolso',            cls: 'bg-emerald-100 text-emerald-700', compoeReceita: true, compoeInadimplencia: false },
  benfeitoria:          { label: 'Benfeitoria',          cls: 'bg-sky-100 text-sky-700',      compoeReceita: true,  compoeInadimplencia: false },
  outros:               { label: 'Outros',               cls: 'bg-slate-100 text-slate-700',  compoeReceita: true,  compoeInadimplencia: false },
};

/** Config vigente (mutável em runtime pela tela de Outros Recebimentos). */
export const CATEGORIA_META: Record<CategoriaOutroRecebimento, CategoriaConfig> =
  { ...CATEGORIA_META_PADRAO };

export const CATEGORIAS_ORDEM: CategoriaOutroRecebimento[] = [
  'caucao', 'multa_extraordinaria', 'indenizacao', 'reembolso', 'benfeitoria', 'outros',
];

// ---------- Seed inicial ----------

export const outrosRecebimentosSeed: OutroRecebimento[] = [
  {
    id: 'or-001',
    categoria: 'caucao',
    valorTotal: 45000,
    parcelado: true,
    numParcelas: 3,
    fundoId: 'f1',
    edificioId: 'b2',
    unidadeId: 'u-b2-701',
    contratoId: 'c1',
    locatarioId: 'i1',
    descricao: 'Caução contratual — 3x',
    observacao: 'Acordo de caução depositada em 3 parcelas mensais.',
    status: 'parcial',
    origem: 'manual',
    criadoEm: '2026-02-10T10:00:00Z',
    parcelas: [
      { id: 'p-001-1', outroRecebimentoId: 'or-001', numero: 1, valor: 15000, vencimento: '2026-02-15', status: 'recebido', entradaId: null },
      { id: 'p-001-2', outroRecebimentoId: 'or-001', numero: 2, valor: 15000, vencimento: '2026-03-15', status: 'recebido', entradaId: null },
      { id: 'p-001-3', outroRecebimentoId: 'or-001', numero: 3, valor: 15000, vencimento: '2026-04-15', status: 'a_receber', entradaId: null },
    ],
    audit: [
      { id: 'a1', acao: 'criado', usuario: 'Natalia Landi', data: '2026-02-10T10:00:00Z' },
    ],
  },
  {
    id: 'or-002',
    categoria: 'reembolso',
    valorTotal: 8200,
    parcelado: false,
    numParcelas: 1,
    fundoId: 'f1',
    edificioId: 'b4',
    unidadeId: 'u-b4-401',
    contratoId: null,
    locatarioId: 'i2',
    descricao: 'Reembolso de obra de adequação',
    status: 'recebido',
    origem: 'manual',
    criadoEm: '2026-03-22T14:00:00Z',
    parcelas: [
      { id: 'p-002-1', outroRecebimentoId: 'or-002', numero: 1, valor: 8200, vencimento: '2026-03-22', status: 'recebido', entradaId: null },
    ],
    audit: [
      { id: 'a1', acao: 'criado', usuario: 'Natalia Landi', data: '2026-03-22T14:00:00Z' },
    ],
  },
];

export function novoIdRecebimento() {
  return 'or-' + Math.random().toString(36).slice(2, 8);
}
export function novoIdParcela() {
  return 'p-' + Math.random().toString(36).slice(2, 8);
}

export function recalcStatus(r: OutroRecebimento): StatusRecebimento {
  const recebidos = r.parcelas.filter(p => p.status === 'recebido').length;
  if (recebidos === 0) return 'pendente';
  if (recebidos === r.parcelas.length) return 'recebido';
  return 'parcial';
}
