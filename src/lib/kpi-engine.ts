// ============================================================================
// KPI ENGINE — camada relacional Fundo → Portfólio → Ativo → Contrato → Locatário
// ----------------------------------------------------------------------------
// Todos os KPIs da tela "Métricas e KPIs" são DERIVADOS desta estrutura,
// nunca de números soltos. Isso mantém o drill-down consistente:
//   KPI → detalhamento → ativo → contrato → locatário
//
// Fonte dos dados:
//   - Ativos/contratos: snapshot de competência (portfolio-competencia.ts)
//   - Contratos sintéticos: gerados de forma determinística para os ativos que
//     ainda não possuem cadastro unidade-a-unidade (mock estruturado).
//   - Inadimplência: derivada por contrato de forma determinística (mock).
// Preparado para substituição por dados reais: basta trocar os dois builders
// `buildRelationalModel` e `buildInadimplenciaMock`.
// ============================================================================

import { TenantContract } from "@/lib/mock-data";
import {
  getPortfolioSnapshot, COMPETENCIAS, CURRENT_COMPETENCIA, competenciaLabel,
} from "@/lib/portfolio-competencia";

export { COMPETENCIAS };

// ─── Helpers ────────────────────────────────────────────────────────────────

export const fmtBRLShort = (v: number) => {
  if (!isFinite(v)) return "—";
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `R$ ${(v / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi`;
  if (abs >= 1_000) return `R$ ${(v / 1_000).toLocaleString("pt-BR", { maximumFractionDigits: 0 })} mil`;
  return `R$ ${v.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;
};
export const fmtBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);
export const fmtM2 = (v: number) => `${Math.round(v).toLocaleString("pt-BR")} m²`;
export const fmtPct = (v: number, dec = 1) => `${v.toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec })}%`;
export const fmtDateBR = (s?: string | null) =>
  !s ? "—" : new Date(`${s.slice(0, 10)}T12:00:00`).toLocaleDateString("pt-BR");

export const prevCompetencia = (comp: string) => {
  const [y, m] = comp.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100000;
  return h;
};

// ─── Modelo relacional ──────────────────────────────────────────────────────

export interface AssetNode {
  id: string;
  name: string;
  city: string;
  state: string;
  segment: string;
  fundTicker: string;
  areaTotal: number;
  areaOcupada: number;
  areaVaga: number;
  receitaContratada: number;   // mensal
  receitaPotencial: number;    // mensal a 100% de ocupação
  noi: number;                 // mensal
  ocupacaoPct: number;
  waltMonths: number;
  inadimplencia: number;
  contratos: ContractNode[];
}

export interface ContractNode {
  id: string;
  assetId: string;
  assetName: string;
  unit: string;
  tenant: string;
  segmentoLocatario: string;
  area: number;
  precoM2: number;
  receitaMensal: number;
  indice: string;
  natureza: "tipico" | "atipico";
  inicio: string | null;
  vencimento: string | null;
  garantia: string;
  status: "active" | "vacant" | "renewal" | "termination" | "closed";
  mesesRestantes: number;
  vacante: boolean;
}

export interface TenantNode {
  name: string;
  contratos: number;
  ativos: string[];
  area: number;
  receitaMensal: number;
  inadimplencia: number;
}

export interface RelationalModel {
  competencia: string;
  assets: AssetNode[];
  contracts: ContractNode[];
  tenants: TenantNode[];
  inadimplencia: InadimplenciaItem[];
}

export interface InadimplenciaItem {
  contractId: string;
  assetId: string;
  assetName: string;
  tenant: string;
  unit: string;
  valorAberto: number;
  diasAtraso: number;
  vencimento: string;
  status: "vencido" | "negociacao" | "acordo" | "juridico";
}

const INDICES = ["IPCA", "IGP-M", "IPCA", "IGP-M", "INPC"];
const GARANTIAS = ["Fiança bancária", "Seguro fiança", "Depósito caução", "Fiador"];
const SEGMENTOS = ["Logística 3PL", "Varejo", "E-commerce", "Indústria", "Alimentos"];

const monthsBetween = (from: Date, to: Date) =>
  (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());

/** Converte um TenantContract (cadastro real) em nó de contrato. */
function fromTenantContract(tc: TenantContract, assetName: string, ref: Date): ContractNode {
  const preco = tc.price_per_m2 ?? 0;
  const end = tc.contract_end ? new Date(`${tc.contract_end}T00:00:00`) : null;
  const h = hash(tc.id);
  return {
    id: tc.id,
    assetId: tc.building_id,
    assetName,
    unit: tc.unit_id,
    tenant: tc.tenant_name ?? "Vago",
    segmentoLocatario: tc.tenant_segment ?? SEGMENTOS[h % SEGMENTOS.length],
    area: tc.area_m2,
    precoM2: preco,
    receitaMensal: tc.status === "vacant" ? 0 : tc.area_m2 * preco,
    indice: tc.indice_reajuste ?? INDICES[h % INDICES.length],
    natureza: tc.lease_nature ?? (h % 3 === 0 ? "atipico" : "tipico"),
    inicio: tc.contract_start ?? null,
    vencimento: tc.contract_end ?? null,
    garantia: tc.garantia ?? GARANTIAS[h % GARANTIAS.length],
    status: tc.status,
    mesesRestantes: end ? Math.max(0, monthsBetween(ref, end)) : 0,
    vacante: tc.status === "vacant" || !tc.tenant_name,
  };
}

/**
 * Gera contratos determinísticos para ativos sem cadastro unidade-a-unidade.
 * Mantém coerência com GLA, ocupação e receita do ativo no snapshot.
 */
function syntheticContracts(
  asset: { id: string; name: string; gla: number; occupancyPct: number; revenue: number },
  ref: Date,
): ContractNode[] {
  const h = hash(asset.id);
  const nUnits = 3 + (h % 3); // 3–5 unidades
  const occupiedArea = asset.gla * (asset.occupancyPct / 100);
  const out: ContractNode[] = [];
  const shares = Array.from({ length: nUnits }, (_, i) => 1 + ((h + i * 17) % 7) / 10);
  const shareSum = shares.reduce((s, x) => s + x, 0);

  shares.forEach((share, i) => {
    const area = Math.round((occupiedArea * share) / shareSum);
    const hh = hash(`${asset.id}-${i}`);
    const monthsLeft = 4 + (hh % 52);
    const end = new Date(ref.getFullYear(), ref.getMonth() + monthsLeft, 28);
    const start = new Date(end.getFullYear() - 5, end.getMonth(), 1);
    const preco = occupiedArea > 0 ? asset.revenue / occupiedArea : 0;
    out.push({
      id: `${asset.id}-ct${i + 1}`,
      assetId: asset.id,
      assetName: asset.name,
      unit: `Galpão ${String.fromCharCode(65 + i)}`,
      tenant: TENANT_POOL[(hh + i) % TENANT_POOL.length],
      segmentoLocatario: SEGMENTOS[hh % SEGMENTOS.length],
      area,
      precoM2: Math.round(preco * 100) / 100,
      receitaMensal: Math.round(area * preco),
      indice: INDICES[hh % INDICES.length],
      natureza: hh % 3 === 0 ? "atipico" : "tipico",
      inicio: start.toISOString().slice(0, 10),
      vencimento: end.toISOString().slice(0, 10),
      garantia: GARANTIAS[hh % GARANTIAS.length],
      status: "active",
      mesesRestantes: monthsLeft,
      vacante: false,
    });
  });

  const vacantArea = Math.max(0, Math.round(asset.gla - occupiedArea));
  if (vacantArea > 0) {
    out.push({
      id: `${asset.id}-vago`,
      assetId: asset.id,
      assetName: asset.name,
      unit: "Área disponível",
      tenant: "Vago",
      segmentoLocatario: "—",
      area: vacantArea,
      precoM2: 0,
      receitaMensal: 0,
      indice: "—",
      natureza: "tipico",
      inicio: null,
      vencimento: null,
      garantia: "—",
      status: "vacant",
      mesesRestantes: 0,
      vacante: true,
    });
  }
  return out;
}

const TENANT_POOL = [
  "Ambev S.A.", "DHL", "Solistica (Grupo FEMSA)", "Magazine Luiza", "Tok&Stok",
  "Sierra Log", "Caedu", "Supporte", "Mercado Livre", "GPA Logística",
  "Unilever", "Natura", "Grupo Boticário", "JSL Logística",
];

/** Monta o modelo relacional completo para uma competência. */
export function buildRelationalModel(competencia: string): RelationalModel {
  const snap = getPortfolioSnapshot(competencia);
  const ref = new Date(`${competencia}-01T00:00:00`);

  const assets: AssetNode[] = snap.buildings.map((b) => {
    const gla = b.gla_m2 || b.total_area_m2 || 0;
    const detail = snap.contracts.filter((c) => c.building_id === b.id);
    const contratos = detail.length
      ? detail.map((tc) => fromTenantContract(tc, b.name, ref))
      : syntheticContracts(
          { id: b.id, name: b.name, gla, occupancyPct: b.occupancy_pct ?? 0, revenue: b.monthly_revenue ?? 0 },
          ref,
        );

    const areaOcupada = contratos.filter((c) => !c.vacante).reduce((s, c) => s + c.area, 0);
    const areaVaga = Math.max(0, gla - areaOcupada);
    const receitaContratada = contratos.reduce((s, c) => s + c.receitaMensal, 0);
    const precoMedio = areaOcupada > 0 ? receitaContratada / areaOcupada : 0;
    const noiRatio = b.monthly_revenue && b.monthly_noi ? b.monthly_noi / b.monthly_revenue : 0.82;
    const waltBase = contratos.filter((c) => !c.vacante);
    const walt = areaOcupada > 0
      ? waltBase.reduce((s, c) => s + c.mesesRestantes * c.receitaMensal, 0) /
        Math.max(1, waltBase.reduce((s, c) => s + c.receitaMensal, 0))
      : 0;

    return {
      id: b.id,
      name: b.name,
      city: b.city,
      state: b.state,
      segment: b.segment ?? "logistics",
      fundTicker: (b.fund_name ?? "VILG11").split(" ")[0],
      areaTotal: gla,
      areaOcupada,
      areaVaga,
      receitaContratada,
      receitaPotencial: receitaContratada + areaVaga * precoMedio,
      noi: Math.round(receitaContratada * noiRatio),
      ocupacaoPct: gla > 0 ? (areaOcupada / gla) * 100 : 0,
      waltMonths: Math.round(walt),
      inadimplencia: 0,
      contratos,
    };
  });

  const contracts = assets.flatMap((a) => a.contratos);
  const inadimplencia = buildInadimplenciaMock(contracts, competencia);

  for (const a of assets) {
    a.inadimplencia = inadimplencia
      .filter((i) => i.assetId === a.id)
      .reduce((s, i) => s + i.valorAberto, 0);
  }

  const byTenant = new Map<string, TenantNode>();
  for (const c of contracts) {
    if (c.vacante) continue;
    const t = byTenant.get(c.tenant) ?? {
      name: c.tenant, contratos: 0, ativos: [], area: 0, receitaMensal: 0, inadimplencia: 0,
    };
    t.contratos += 1;
    if (!t.ativos.includes(c.assetName)) t.ativos.push(c.assetName);
    t.area += c.area;
    t.receitaMensal += c.receitaMensal;
    t.inadimplencia += inadimplencia.filter((i) => i.contractId === c.id).reduce((s, i) => s + i.valorAberto, 0);
    byTenant.set(c.tenant, t);
  }

  return {
    competencia,
    assets,
    contracts,
    tenants: [...byTenant.values()].sort((a, b) => b.receitaMensal - a.receitaMensal),
    inadimplencia,
  };
}

/** Inadimplência determinística por contrato (substituível por dados reais). */
function buildInadimplenciaMock(contracts: ContractNode[], competencia: string): InadimplenciaItem[] {
  const [y, m] = competencia.split("-").map(Number);
  const statuses: InadimplenciaItem["status"][] = ["vencido", "negociacao", "acordo", "juridico"];
  return contracts
    .filter((c) => !c.vacante && c.receitaMensal > 0)
    .map((c) => {
      const h = hash(`${c.id}-${competencia}`);
      if (h % 100 >= 14) return null; // ~14% dos contratos com saldo em aberto
      const dias = 5 + (h % 115);
      const pct = 0.35 + ((h % 66) / 100);
      const venc = new Date(y, m - 1, 5);
      venc.setDate(venc.getDate() - dias);
      return {
        contractId: c.id,
        assetId: c.assetId,
        assetName: c.assetName,
        tenant: c.tenant,
        unit: c.unit,
        valorAberto: Math.round(c.receitaMensal * pct),
        diasAtraso: dias,
        vencimento: venc.toISOString().slice(0, 10),
        status: statuses[h % statuses.length],
      } as InadimplenciaItem;
    })
    .filter((x): x is InadimplenciaItem => x !== null)
    .sort((a, b) => b.valorAberto - a.valorAberto);
}

// ─── Filtros ────────────────────────────────────────────────────────────────

export interface KpiFilters {
  portfolio: string;   // 'all' | 'logistica' | 'corporativo'
  fundo: string;       // 'all' | ticker
  ativoId: string;     // 'all' | assetId
  tipoAtivo: string;   // 'all' | segment
  from: string;        // competência inicial
  to: string;          // competência final (base dos KPIs)
}

export const PORTFOLIO_OPTIONS = [
  { value: "all", label: "Todos os portfólios" },
  { value: "logistics", label: "Portfólio Logístico" },
  { value: "offices", label: "Portfólio Corporativo" },
];

export const TIPO_ATIVO_OPTIONS = [
  { value: "all", label: "Todos os tipos" },
  { value: "logistics", label: "Galpão logístico" },
  { value: "offices", label: "Lajes corporativas" },
  { value: "mixed", label: "Uso misto" },
];


export function filterModel(model: RelationalModel, f: KpiFilters): RelationalModel {
  const assets = model.assets.filter((a) => {
    if (f.ativoId !== "all" && a.id !== f.ativoId) return false;
    if (f.fundo !== "all" && a.fundTicker !== f.fundo) return false;
    if (f.tipoAtivo !== "all" && a.segment !== f.tipoAtivo) return false;
    if (f.portfolio !== "all" && a.segment !== f.portfolio) return false;
    return true;
  });
  const ids = new Set(assets.map((a) => a.id));
  const contracts = model.contracts.filter((c) => ids.has(c.assetId));
  const inadimplencia = model.inadimplencia.filter((i) => ids.has(i.assetId));
  const byTenant = new Map<string, TenantNode>();
  for (const t of model.tenants) {
    const own = contracts.filter((c) => c.tenant === t.name);
    if (!own.length) continue;
    byTenant.set(t.name, {
      name: t.name,
      contratos: own.length,
      ativos: [...new Set(own.map((c) => c.assetName))],
      area: own.reduce((s, c) => s + c.area, 0),
      receitaMensal: own.reduce((s, c) => s + c.receitaMensal, 0),
      inadimplencia: inadimplencia.filter((i) => i.tenant === t.name).reduce((s, i) => s + i.valorAberto, 0),
    });
  }
  return {
    competencia: model.competencia,
    assets, contracts, inadimplencia,
    tenants: [...byTenant.values()].sort((a, b) => b.receitaMensal - a.receitaMensal),
  };
}

// ─── Agregados de KPI ───────────────────────────────────────────────────────

export interface KpiAggregate {
  competencia: string;
  areaTotal: number;
  areaOcupada: number;
  areaVaga: number;
  ocupacaoPct: number;
  ocupacaoFinanceiraPct: number | null;
  vacanciaPct: number;
  receitaContratada: number;
  receitaAnualizada: number;
  noi: number;
  noiMargem: number;
  inadimplenciaValor: number;
  inadimplenciaPct: number;
  walt: number;
  contratosVigentes: number;
  contratosAVencer12m: number;
  receitaAVencer12m: number;
  areaAVencer12m: number;
  exposicao: { indice: string; receita: number; pct: number }[];
}

export function aggregate(model: RelationalModel): KpiAggregate {
  const snapOcupFin = getPortfolioSnapshot(model.competencia).ocupacaoFinanceira;
  const areaTotal = model.assets.reduce((s, a) => s + a.areaTotal, 0);
  const areaOcupada = model.assets.reduce((s, a) => s + a.areaOcupada, 0);
  const areaVaga = Math.max(0, areaTotal - areaOcupada);
  const receitaContratada = model.contracts.reduce((s, c) => s + c.receitaMensal, 0);
  const noi = model.assets.reduce((s, a) => s + a.noi, 0);
  const inadValor = model.inadimplencia.reduce((s, i) => s + i.valorAberto, 0);
  const ativos = model.contracts.filter((c) => !c.vacante);
  const walt = receitaContratada > 0
    ? ativos.reduce((s, c) => s + c.mesesRestantes * c.receitaMensal, 0) / receitaContratada
    : 0;
  const aVencer = ativos.filter((c) => c.mesesRestantes <= 12);

  const byIndex = new Map<string, number>();
  for (const c of ativos) byIndex.set(c.indice, (byIndex.get(c.indice) ?? 0) + c.receitaMensal);
  const exposicao = [...byIndex.entries()]
    .map(([indice, receita]) => ({ indice, receita, pct: receitaContratada > 0 ? (receita / receitaContratada) * 100 : 0 }))
    .sort((a, b) => b.receita - a.receita);

  return {
    competencia: model.competencia,
    areaTotal, areaOcupada, areaVaga,
    ocupacaoPct: areaTotal > 0 ? (areaOcupada / areaTotal) * 100 : 0,
    ocupacaoFinanceiraPct: snapOcupFin,
    vacanciaPct: areaTotal > 0 ? (areaVaga / areaTotal) * 100 : 0,
    receitaContratada,
    receitaAnualizada: receitaContratada * 12,
    noi,
    noiMargem: receitaContratada > 0 ? (noi / receitaContratada) * 100 : 0,
    inadimplenciaValor: inadValor,
    inadimplenciaPct: receitaContratada > 0 ? (inadValor / receitaContratada) * 100 : 0,
    walt,
    contratosVigentes: ativos.length,
    contratosAVencer12m: aVencer.length,
    receitaAVencer12m: aVencer.reduce((s, c) => s + c.receitaMensal, 0),
    areaAVencer12m: aVencer.reduce((s, c) => s + c.area, 0),
    exposicao,
  };
}

// ─── CAPEX / TIR (mock estruturado, preparado para dados reais) ─────────────

export interface CapexBlock {
  realizado: number;
  orcado: number;
  comprometido: number;
  forecast: number;
  variacaoPct: number;
  porAtivo: { assetId: string; assetName: string; realizado: number; orcado: number }[];
}

export function buildCapex(model: RelationalModel): CapexBlock {
  const porAtivo = model.assets.map((a) => {
    const h = hash(`capex-${a.id}`);
    const orcado = 250_000 + (h % 40) * 25_000;
    const realizado = Math.round(orcado * (0.45 + ((h % 40) / 100)));
    return { assetId: a.id, assetName: a.name, realizado, orcado };
  });
  const realizado = porAtivo.reduce((s, x) => s + x.realizado, 0);
  const orcado = porAtivo.reduce((s, x) => s + x.orcado, 0);
  const comprometido = Math.round(orcado * 0.18);
  const forecast = realizado + comprometido;
  return {
    realizado, orcado, comprometido, forecast,
    variacaoPct: orcado > 0 ? ((forecast - orcado) / orcado) * 100 : 0,
    porAtivo: porAtivo.sort((a, b) => b.orcado - a.orcado),
  };
}

export function buildTir(model: RelationalModel) {
  const h = hash(`tir-${model.assets.length}-${model.competencia}`);
  const tir = 12 + (h % 60) / 10;
  return {
    tir,
    tirAlvo: 14.5,
    porAtivo: model.assets.map((a) => ({
      assetId: a.id, assetName: a.name,
      tir: 9 + (hash(`tir-${a.id}`) % 90) / 10,
    })).sort((x, y) => y.tir - x.tir),
  };
}

// ─── Série histórica (para evolução dentro do drill-down) ───────────────────

export interface SeriePonto {
  competencia: string;
  label: string;
  ocupacao: number;
  vacancia: number;
  receita: number;
  noi: number;
  inadimplenciaPct: number;
  inadimplenciaValor: number;
}

export function buildSerie(f: KpiFilters): SeriePonto[] {
  const comps = COMPETENCIAS.map((c) => c.value).filter((v) => v >= f.from && v <= f.to).sort();
  return comps.map((comp) => {
    const agg = aggregate(filterModel(buildRelationalModel(comp), { ...f, to: comp }));
    return {
      competencia: comp,
      label: competenciaLabel(comp),
      ocupacao: Number(agg.ocupacaoPct.toFixed(1)),
      vacancia: Number(agg.vacanciaPct.toFixed(1)),
      receita: Math.round(agg.receitaContratada),
      noi: Math.round(agg.noi),
      inadimplenciaPct: Number(agg.inadimplenciaPct.toFixed(2)),
      inadimplenciaValor: Math.round(agg.inadimplenciaValor),
    };
  });
}

export { CURRENT_COMPETENCIA, competenciaLabel };
