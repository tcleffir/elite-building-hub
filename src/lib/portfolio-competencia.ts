import { Building, TenantContract, getHGRE11PortfolioBuildings, mockTenantContracts } from "@/lib/mock-data";

/**
 * Camada de competência (snapshot mensal) da página Portfólio.
 *
 * Regra: cada competência é um recorte congelado. Alterações contratuais
 * feitas posteriormente NÃO alteram os valores de uma competência já fechada —
 * por isso os fatores/índices abaixo são tabelados por competência e não
 * recalculados a partir do estado atual dos contratos.
 */

export interface CompetenciaOption {
  value: string; // YYYY-MM
  label: string; // MM/AAAA
}

/** Competência corrente (última fechada) */
export const CURRENT_COMPETENCIA = "2026-04";

const MONTH_LABEL = (value: string) => {
  const [y, m] = value.split("-");
  return `${m}/${y}`;
};

/**
 * Fator de reajuste acumulado congelado por competência.
 * Base 1,0000 na competência corrente; competências anteriores carregam o
 * valor vigente naquele mês (antes dos reajustes/revisionais posteriores).
 */
const INDEX_FACTOR: Record<string, number> = {
  "2025-02": 0.9128,
  "2025-03": 0.9128,
  "2025-04": 0.9215,
  "2025-05": 0.9215,
  "2025-06": 0.9302,
  "2025-07": 0.9302,
  "2025-08": 0.9418,
  "2025-09": 0.9418,
  "2025-10": 0.9536,
  "2025-11": 0.9536,
  "2025-12": 0.9671,
  "2026-01": 0.9802,
  "2026-02": 0.9802,
  "2026-03": 0.9924,
  "2026-04": 1.0,
};

export const COMPETENCIAS: CompetenciaOption[] = Object.keys(INDEX_FACTOR)
  .sort()
  .reverse()
  .map((value) => ({ value, label: MONTH_LABEL(value) }));

export const competenciaLabel = (value: string) => MONTH_LABEL(value);

/** Competências em ordem cronológica (mais antiga → mais recente). */
export const COMPETENCIAS_ASC = Object.keys(INDEX_FACTOR).sort();

/** Presets de janela de competência usados nos filtros de período. */
export type PeriodPreset = "1m" | "3m" | "6m" | "12m" | "custom";

export const PERIOD_PRESETS: { value: PeriodPreset; label: string; months: number }[] = [
  { value: "1m", label: "Competência atual", months: 1 },
  { value: "3m", label: "Últimos 3 meses", months: 3 },
  { value: "6m", label: "Últimos 6 meses", months: 6 },
  { value: "12m", label: "Últimos 12 meses", months: 12 },
];

/**
 * Lista de competências da janela selecionada (ordem cronológica).
 * `end` é a competência de fechamento; `months` o tamanho da janela.
 */
export function getCompetenciaWindow(end: string, months: number): string[] {
  const idx = COMPETENCIAS_ASC.indexOf(end);
  if (idx < 0) return [end];
  return COMPETENCIAS_ASC.slice(Math.max(0, idx - months + 1), idx + 1);
}

/** Competências entre duas datas (inclusive), ordem cronológica. */
export function getCompetenciaRange(start: string, end: string): string[] {
  const a = COMPETENCIAS_ASC.indexOf(start);
  const b = COMPETENCIAS_ASC.indexOf(end);
  if (a < 0 || b < 0) return [end];
  const [from, to] = a <= b ? [a, b] : [b, a];
  return COMPETENCIAS_ASC.slice(from, to + 1);
}

/** Rótulo legível de uma janela de competências. */
export function periodRangeLabel(window: string[]): string {
  if (window.length === 0) return "—";
  if (window.length === 1) return MONTH_LABEL(window[0]);
  return `${MONTH_LABEL(window[0])} – ${MONTH_LABEL(window[window.length - 1])}`;
}


/**
 * Ocupação financeira por competência (%).
 * Indicador calculado pelo módulo financeiro (receita faturada / receita
 * potencial da competência). Esta estrutura é apenas o ponto de entrada do
 * valor — nenhuma fórmula é derivada aqui.
 */
export const OCUPACAO_FINANCEIRA_POR_COMPETENCIA: Record<string, number> = {
  "2025-02": 91.4,
  "2025-03": 92.0,
  "2025-04": 92.6,
  "2025-05": 93.1,
  "2025-06": 92.4,
  "2025-07": 93.8,
  "2025-08": 94.2,
  "2025-09": 93.5,
  "2025-10": 94.7,
  "2025-11": 95.1,
  "2025-12": 94.3,
  "2026-01": 95.4,
  "2026-02": 95.9,
  "2026-03": 96.2,
  "2026-04": 96.8,
};

/** Retorna a ocupação financeira da competência, ou null se ainda não apurada. */
export const getOcupacaoFinanceira = (competencia: string): number | null =>
  OCUPACAO_FINANCEIRA_POR_COMPETENCIA[competencia] ?? null;

/**
 * Valor de referência de mercado em R$/m² por competência (logística).
 * Variável por competência — estrutura preparada para receber/importar
 * a referência externa de mercado. Não deve ser tratado como constante.
 */
export const MERCADO_M2_POR_COMPETENCIA: Record<string, number> = {
  "2025-02": 22.4,
  "2025-03": 22.6,
  "2025-04": 22.9,
  "2025-05": 23.1,
  "2025-06": 23.3,
  "2025-07": 23.6,
  "2025-08": 23.8,
  "2025-09": 24.0,
  "2025-10": 24.2,
  "2025-11": 24.5,
  "2025-12": 24.7,
  "2026-01": 24.9,
  "2026-02": 25.1,
  "2026-03": 25.4,
  "2026-04": 25.7,
};

/** Referência de mercado (R$/m²) da competência, ou null se não importada. */
export const getMercadoRefM2 = (competencia: string): number | null =>
  MERCADO_M2_POR_COMPETENCIA[competencia] ?? null;

export interface PortfolioSnapshot {
  competencia: string;
  label: string;
  buildings: Building[];
  contracts: TenantContract[];
  mercadoM2: number | null;
  ocupacaoFinanceira: number | null;
}

const monthStart = (competencia: string) => new Date(`${competencia}-01T00:00:00`);
const monthEnd = (competencia: string) => {
  const d = monthStart(competencia);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
};

const monthsBetween = (from: Date, to: Date) =>
  (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());

/**
 * Retorna o recorte congelado do portfólio para a competência informada:
 * contratos vigentes no mês, R$/m² vigente, ocupação, receita e WAULT.
 */
export function getPortfolioSnapshot(competencia: string): PortfolioSnapshot {
  const factor = INDEX_FACTOR[competencia] ?? 1;
  const start = monthStart(competencia);
  const end = monthEnd(competencia);
  const current = monthStart(CURRENT_COMPETENCIA);
  const monthsShift = monthsBetween(start, current); // >= 0 para competências passadas

  const baseBuildings = getHGRE11PortfolioBuildings();
  const buildingIds = new Set(baseBuildings.map((b) => b.id));

  // Contratos vigentes na competência (vagas permanecem para cálculo de vacância)
  const contracts: TenantContract[] = mockTenantContracts
    .filter((c) => buildingIds.has(c.building_id))
    .filter((c) => {
      if (c.status === "vacant") return true;
      const cStart = c.contract_start ? new Date(`${c.contract_start}T00:00:00`) : null;
      const cEnd = c.contract_end ? new Date(`${c.contract_end}T00:00:00`) : null;
      if (cStart && cStart > end) return false;
      if (cEnd && cEnd < start) return false;
      return true;
    })
    .map((c) => ({
      ...c,
      price_per_m2: c.price_per_m2 == null ? null : Math.round(c.price_per_m2 * factor),
    }));

  const buildings: Building[] = baseBuildings.map((b) => {
    const bContracts = contracts.filter((c) => c.building_id === b.id);
    const occupied = bContracts.filter((c) => c.status !== "vacant" && c.tenant_name);
    const gla = b.gla_m2 || b.total_area_m2 || 0;

    const hasDetail = bContracts.length > 0;
    const occupiedArea = occupied.reduce((s, c) => s + c.area_m2, 0);
    const contractRevenue = occupied.reduce((s, c) => s + c.area_m2 * (c.price_per_m2 || 0), 0);

    const occupancy_pct = hasDetail && gla > 0
      ? Math.round((occupiedArea / gla) * 1000) / 10
      : b.occupancy_pct;

    const monthly_revenue = hasDetail
      ? contractRevenue
      : Math.round((b.monthly_revenue || 0) * factor);

    const noiRatio = b.monthly_revenue && b.monthly_noi ? b.monthly_noi / b.monthly_revenue : 0.82;

    // WAULT congelado: na competência passada os contratos tinham mais prazo a correr
    const wault_months = hasDetail && occupiedArea > 0
      ? Math.round(
          occupied.reduce((s, c) => {
            const cEnd = c.contract_end ? new Date(`${c.contract_end}T00:00:00`) : null;
            const remaining = cEnd ? Math.max(0, monthsBetween(start, cEnd)) : 0;
            return s + remaining * c.area_m2;
          }, 0) / occupiedArea
        )
      : (b.wault_months || 0) + monthsShift;

    return {
      ...b,
      occupancy_pct,
      monthly_revenue,
      monthly_noi: Math.round(monthly_revenue * noiRatio),
      wault_months,
    };
  });

  return {
    competencia,
    label: MONTH_LABEL(competencia),
    buildings,
    contracts,
    mercadoM2: getMercadoRefM2(competencia),
    ocupacaoFinanceira: getOcupacaoFinanceira(competencia),
  };
}
