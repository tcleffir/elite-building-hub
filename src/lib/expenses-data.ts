// Despesas imobiliárias — base para o cálculo do NOI.
// NÃO é contas a pagar: aqui só importamos, classificamos e conciliamos despesas.
import { edificiosRec } from "@/lib/reconciliation-data";
import { getHGRE11PortfolioBuildings } from "@/lib/mock-data";


export type StatusDespesa = 'conciliado' | 'parcial' | 'pendente' | 'divergencia';

export interface CategoriaDespesaConfig {
  id: string;
  label: string;
  cls: string;
}

export const CATEGORIAS_DESPESA_PADRAO: CategoriaDespesaConfig[] = [
  { id: 'condominio',         label: 'Condomínio',          cls: 'bg-sky-100 text-sky-700' },
  { id: 'iptu',               label: 'IPTU',                cls: 'bg-amber-100 text-amber-700' },
  { id: 'manutencao',         label: 'Manutenção',          cls: 'bg-orange-100 text-orange-700' },
  { id: 'seguros',            label: 'Seguros',             cls: 'bg-violet-100 text-violet-700' },
  { id: 'utilities',          label: 'Utilities',           cls: 'bg-emerald-100 text-emerald-700' },
  { id: 'property_management',label: 'Property Management', cls: 'bg-blue-100 text-blue-700' },
  { id: 'juridico',           label: 'Jurídico',            cls: 'bg-rose-100 text-rose-700' },
  { id: 'outros',             label: 'Outros',              cls: 'bg-slate-100 text-slate-700' },
];

export interface DespesaRec {
  id: string;
  competencia: string;      // YYYY-MM
  fundoId: string;
  edificioId: string;
  data: string;             // YYYY-MM-DD — data do documento
  categoriaId: string;
  fornecedor: string;
  descricao: string;
  valorEsperado: number;
  valorRealizado: number | null;
  dataPagamento: string | null;
  origem: 'manual' | 'import';
  arquivoOrigem?: string | null;
}

export const STATUS_DESPESA_META: Record<StatusDespesa, { label: string; cls: string }> = {
  conciliado:  { label: 'Conciliado',  cls: 'bg-emerald-100 text-emerald-700' },
  parcial:     { label: 'Parcial',     cls: 'bg-sky-100 text-sky-700' },
  pendente:    { label: 'Pendente',    cls: 'bg-amber-100 text-amber-700' },
  divergencia: { label: 'Divergência', cls: 'bg-rose-100 text-rose-700' },
};

export function statusDespesa(d: DespesaRec): StatusDespesa {
  const real = d.valorRealizado;
  if (real == null || real === 0) return 'pendente';
  const diff = real - d.valorEsperado;
  if (Math.abs(diff) <= 0.5) return 'conciliado';
  if (real < d.valorEsperado) return 'parcial';
  return 'divergencia';
}

/** Colunas aceitas no template de importação (.xlsx / .csv). */
export const TEMPLATE_DESPESAS_COLUNAS = [
  'Competência', 'Fundo', 'Ativo', 'Data', 'Categoria', 'Fornecedor',
  'Descrição', 'Valor esperado', 'Valor realizado', 'Data do pagamento',
];

// ---------- Seed (12 competências) ----------

const PERFIL: { categoriaId: string; fornecedor: string; descricao: string; base: number }[] = [
  { categoriaId: 'condominio',          fornecedor: 'Adm. Predial Sigma',   descricao: 'Cota condominial mensal',          base: 18500 },
  { categoriaId: 'iptu',                fornecedor: 'Prefeitura Municipal', descricao: 'Parcela mensal de IPTU',           base: 9200 },
  { categoriaId: 'manutencao',          fornecedor: 'TecFacilities',        descricao: 'Manutenção predial preventiva',    base: 12400 },
  { categoriaId: 'seguros',             fornecedor: 'Porto Seguro',         descricao: 'Seguro patrimonial',               base: 4300 },
  { categoriaId: 'utilities',           fornecedor: 'Enel / Sabesp',        descricao: 'Energia e água áreas comuns',      base: 7600 },
  { categoriaId: 'property_management', fornecedor: 'Patria Property Mgmt',  descricao: 'Taxa de property management',      base: 6800 },
  { categoriaId: 'juridico',            fornecedor: 'Vaz & Associados',     descricao: 'Assessoria jurídica de locação',   base: 3100 },
  { categoriaId: 'outros',              fornecedor: 'Diversos',             descricao: 'Despesas diversas do ativo',       base: 2200 },
];

// Derivado da fonte única de verdade (edificiosRec / mockBuildings): peso
// proporcional à ABL de cada ativo, para que os valores nunca divirjam entre módulos.
const EDIFICIOS_FUNDO: { edificioId: string; fundoId: string; peso: number }[] =
  edificiosRec.map((e) => {
    const b = getHGRE11PortfolioBuildings().find((x) => x.id === e.id);
    const gla = b?.gla_m2 ?? b?.total_area_m2 ?? 0;
    return {
      edificioId: e.id,
      fundoId: e.fundoId,
      peso: Math.max(0.08, Math.round((gla / 22810) * 100) / 100),
    };
  });


const COMPETENCIAS = [
  '2025-05', '2025-06', '2025-07', '2025-08', '2025-09', '2025-10',
  '2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04',
];

function seasonal(comp: string, i: number) {
  const m = Number(comp.slice(-2));
  return 1 + Math.sin((m + i) / 2.1) * 0.06;
}

export const despesasSeed: DespesaRec[] = COMPETENCIAS.flatMap(comp =>
  EDIFICIOS_FUNDO.flatMap(ef =>
    PERFIL.map((p, i) => {
      const [y, m] = comp.split('-').map(Number);
      const esperado = Math.round(p.base * ef.peso * seasonal(comp, i));
      // Competência atual (2026-04) tem itens pendentes/parciais/divergentes.
      const atual = comp === '2026-04';
      let realizado: number | null = esperado;
      let pagamento: string | null = new Date(y, m - 1, 10 + (i % 8)).toISOString().slice(0, 10);
      if (atual) {
        if (i % 4 === 1) { realizado = null; pagamento = null; }
        else if (i % 4 === 2) { realizado = Math.round(esperado * 0.6); }
        else if (i % 4 === 3) { realizado = Math.round(esperado * 1.08); }
      } else if (i === 5 && comp === '2025-10') {
        realizado = Math.round(esperado * 1.12);
      }
      return {
        id: `dsp-${ef.edificioId}-${comp}-${p.categoriaId}`,
        competencia: comp,
        fundoId: ef.fundoId,
        edificioId: ef.edificioId,
        data: new Date(y, m - 1, 5 + (i % 10)).toISOString().slice(0, 10),
        categoriaId: p.categoriaId,
        fornecedor: p.fornecedor,
        descricao: p.descricao,
        valorEsperado: esperado,
        valorRealizado: realizado,
        dataPagamento: pagamento,
        origem: 'import' as const,
        arquivoOrigem: 'despesas-historico.xlsx',
      };
    })
  )
);

export function novoIdDespesa() {
  return 'dsp-' + Math.random().toString(36).slice(2, 8);
}
