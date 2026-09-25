// ============================================================================
// PORTFOLIO STORE — fonte única de verdade compartilhada pelas duas visões
// (Administradora CBRE / Super Admin e Natalia Landi / Gestora do Fundo).
//
// Hierarquia: Ativo > Andares > Conjuntos (unidades) > Locatário > Contrato
// > IPTU por conjunto. Todos os números de um ativo (ABL, ocupação, aluguel,
// IPTU, conjuntos vagos/ocupados) são DERIVADOS dos conjuntos — nunca
// digitados em separado. Persistido em localStorage; ambas as visões leem e
// gravam aqui, então qualquer cadastro aparece nas duas.
// ============================================================================
import { createContext, useContext } from "react";
import { getHGRE11PortfolioBuildings, type Building } from "@/lib/mock-data";

// ─── Tipos ──────────────────────────────────────────────────────────────────

export interface PortfolioTenant {
  id: string;
  nome: string;
  cnpj?: string;
  segmento?: string;
  contatoNome?: string;
  contatoEmail?: string;
  contatoTelefone?: string;
}

export interface PortfolioContract {
  id: string;
  tenantId: string | null;
  tipo: "net" | "gross" | "semi-gross" | null;
  natureza?: "tipico" | "atipico";
  aluguelM2: number | null;
  inicio?: string;          // YYYY-MM-DD
  fim?: string;             // YYYY-MM-DD
  indiceReajuste?: "IPCA" | "IGP-M" | "INPC" | "IGP-DI" | "Fixo";
  dataBaseReajuste?: string; // YYYY-MM-DD — mês do reajuste anual
  periodicidadeReajuste?: "anual" | "semestral" | "bienal";
  revisionalEm?: string;    // YYYY-MM-DD — data da revisional
  garantia?: "Fiança bancária" | "Seguro fiança" | "Depósito caução" | "Fiador" | "Sem garantia";
  fiador?: string;
  diaVencimento?: number;
  carenciaDias?: number;
  vagas?: number;
  status: "active" | "inactive" | "renewal" | "termination" | "closed";
}

export interface PortfolioUnit {
  id: string;               // ex.: "b12-71"
  buildingId: string;
  andar: number;            // 1..N
  conjunto: string;         // ex.: "71", "101", "102"
  areaM2: number;
  tenantId: string | null;
  contractId: string | null;
  iptuAnual: number;        // IPTU do conjunto (devedor = locatário quando ocupado)
  iptuMatricula?: string;   // inscrição imobiliária do conjunto
  status: "occupied" | "vacant";
}

export interface PortfolioBuildingExtra {
  buildingId: string;
  andares: number;
  iptuMatriculaTerreno?: string;
  iptuMatriculaConstrucao?: string;
}

export interface PortfolioState {
  tenants: PortfolioTenant[];
  contracts: PortfolioContract[];
  units: PortfolioUnit[];
  extras: PortfolioBuildingExtra[];
}

export interface PortfolioStore extends PortfolioState {
  addTenant: (t: PortfolioTenant) => void;
  addContract: (c: PortfolioContract) => void;
  addUnit: (u: PortfolioUnit) => void;
  addBuilding: (b: Building, extra: PortfolioBuildingExtra, units: PortfolioUnit[]) => void;
  updateContract: (id: string, patch: Partial<PortfolioContract>) => void;
  setContractStatus: (id: string, status: PortfolioContract["status"]) => void;
  extraBuildings: Building[]; // ativos cadastrados manualmente (além dos 13 HGRE11)
}

// ─── Seed: Chucri Zaidan 100% preenchido (ativo modelo) ────────────────────
// 17 andares; conjuntos nomeados por andar (11, 21, 31… 171). Conjunto 71
// (7º andar) fica VAGO para o teste de cadastro via leitura de IA.

const CZ_TENANTS: PortfolioTenant[] = [
  { id: "cz-t1", nome: "Vivo (Telefônica Brasil)", cnpj: "11.260.134/0001-50", segmento: "Telecomunicações", contatoNome: "Rafael Camargo", contatoEmail: "rafael.camargo@vivo.com.br", contatoTelefone: "(11) 94120-3381" },
  { id: "cz-t2", nome: "Totvs S.A.", cnpj: "07.526.557/0001-00", segmento: "Tecnologia", contatoNome: "Juliana Moraes", contatoEmail: "juliana.moraes@totvs.com.br", contatoTelefone: "(11) 94877-1024" },
  { id: "cz-t3", nome: "Befly Viagens", cnpj: "13.453.928/0001-77", segmento: "Serviços Corporativos", contatoNome: "Diego Fontes", contatoEmail: "diego.fontes@befly.com.br", contatoTelefone: "(11) 95502-7719" },
  { id: "cz-t4", nome: "Hospital Sírio-Libanês", cnpj: "54.137.319/0001-03", segmento: "Saúde", contatoNome: "Beatriz Nogueira", contatoEmail: "beatriz.nogueira@hsl.org.br", contatoTelefone: "(11) 93314-8850" },
  { id: "cz-t5", nome: "BP Brasil", cnpj: "04.870.532/0001-66", segmento: "Energia", contatoNome: "Marcos Tavares", contatoEmail: "marcos.tavares@bp.com", contatoTelefone: "(11) 96641-2093" },
  { id: "cz-t6", nome: "DHL Supply Chain", cnpj: "03.420.926/0001-08", segmento: "Logística", contatoNome: "Fernanda Prado", contatoEmail: "fernanda.prado@dhl.com", contatoTelefone: "(11) 97708-4412" },
  { id: "cz-t7", nome: "WeWork Brasil", cnpj: "08.913.572/0001-19", segmento: "Coworking", contatoNome: "Carlos Bianchi", contatoEmail: "carlos.bianchi@wework.com", contatoTelefone: "(11) 98223-5567" },
  { id: "cz-t8", nome: "Deloitte Brasil", cnpj: "05.629.244/0001-50", segmento: "Consultoria", contatoNome: "Patrícia Almeida", contatoEmail: "patricia.almeida@deloitte.com", contatoTelefone: "(11) 99360-1148" },
  { id: "cz-t9", nome: "Nubank", cnpj: "18.236.120/0001-58", segmento: "Serviços Financeiros", contatoNome: "Luiz Barbosa", contatoEmail: "luiz.barbosa@nubank.com.br", contatoTelefone: "(11) 91587-6630" },
  { id: "cz-t10", nome: "Ambev", cnpj: "07.526.557/0002-81", segmento: "Bebidas", contatoNome: "Ana Ribeiro", contatoEmail: "ana.ribeiro@ambev.com.br", contatoTelefone: "(11) 92745-9016" },
];

interface CzSpec {
  conjunto: string; andar: number; area: number; tenant: string | null;
  aluguelM2: number | null; inicio?: string; fim?: string;
  indice?: PortfolioContract["indiceReajuste"]; dataBase?: string;
  garantia?: PortfolioContract["garantia"]; fiador?: string;
  natureza?: "tipico" | "atipico"; diaVenc?: number; carencia?: number; vagas?: number;
}

const CZ_UNITS: CzSpec[] = [
  { conjunto: "11",  andar: 1,  area: 1450, tenant: "cz-t9",  aluguelM2: 128, inicio: "2023-02-01", fim: "2028-01-31", indice: "IPCA",  dataBase: "2023-02-01", garantia: "Fiança bancária", natureza: "atipico", diaVenc: 10, vagas: 28 },
  { conjunto: "21",  andar: 2,  area: 1380, tenant: "cz-t10", aluguelM2: 124, inicio: "2022-06-01", fim: "2027-05-31", indice: "IPCA",  dataBase: "2022-06-01", garantia: "Seguro fiança",   natureza: "tipico",  diaVenc: 5,  vagas: 26 },
  { conjunto: "31",  andar: 3,  area: 1420, tenant: "cz-t1",  aluguelM2: 118, inicio: "2022-03-01", fim: "2027-02-28", indice: "IGP-M", dataBase: "2022-03-01", garantia: "Fiança bancária", natureza: "tipico",  diaVenc: 5,  vagas: 30 },
  { conjunto: "41",  andar: 4,  area: 1390, tenant: "cz-t1",  aluguelM2: 118, inicio: "2022-03-01", fim: "2027-02-28", indice: "IGP-M", dataBase: "2022-03-01", garantia: "Fiança bancária", natureza: "tipico",  diaVenc: 5,  vagas: 30 },
  { conjunto: "51",  andar: 5,  area: 1410, tenant: "cz-t2",  aluguelM2: 112, inicio: "2021-08-01", fim: "2026-07-31", indice: "IPCA",  dataBase: "2021-08-01", garantia: "Depósito caução", natureza: "atipico", diaVenc: 10, vagas: 27 },
  { conjunto: "61",  andar: 6,  area: 1370, tenant: "cz-t2",  aluguelM2: 112, inicio: "2021-08-01", fim: "2026-07-31", indice: "IPCA",  dataBase: "2021-08-01", garantia: "Depósito caução", natureza: "atipico", diaVenc: 10, vagas: 27 },
  { conjunto: "71",  andar: 7,  area: 1350, tenant: null,     aluguelM2: null }, // VAGO — reservado para o teste de leitura de IA
  { conjunto: "81",  andar: 8,  area: 1400, tenant: "cz-t3",  aluguelM2: 121, inicio: "2023-01-01", fim: "2028-12-31", indice: "IPCA",  dataBase: "2023-01-01", garantia: "Seguro fiança",   natureza: "atipico", diaVenc: 10, vagas: 25 },
  { conjunto: "91",  andar: 9,  area: 1330, tenant: "cz-t4",  aluguelM2: 109, inicio: "2022-11-01", fim: "2026-10-31", indice: "IPCA",  dataBase: "2022-11-01", garantia: "Fiança bancária", natureza: "tipico",  diaVenc: 5,  vagas: 24 },
  { conjunto: "101", andar: 10, area: 1360, tenant: "cz-t4",  aluguelM2: 109, inicio: "2022-11-01", fim: "2026-10-31", indice: "IPCA",  dataBase: "2022-11-01", garantia: "Fiança bancária", natureza: "tipico",  diaVenc: 5,  vagas: 24 },
  { conjunto: "111", andar: 11, area: 1340, tenant: "cz-t5",  aluguelM2: 104, inicio: "2024-02-01", fim: "2027-01-31", indice: "IGP-M", dataBase: "2024-02-01", garantia: "Fiador",          fiador: "BP Energy do Brasil Ltda.", natureza: "tipico", diaVenc: 5, carencia: 90, vagas: 22 },
  { conjunto: "121", andar: 12, area: 1380, tenant: "cz-t6",  aluguelM2: 126, inicio: "2023-06-01", fim: "2028-05-31", indice: "IPCA",  dataBase: "2023-06-01", garantia: "Fiança bancária", natureza: "atipico", diaVenc: 10, vagas: 26 },
  { conjunto: "131", andar: 13, area: 1320, tenant: "cz-t6",  aluguelM2: 126, inicio: "2023-06-01", fim: "2028-05-31", indice: "IPCA",  dataBase: "2023-06-01", garantia: "Fiança bancária", natureza: "atipico", diaVenc: 10, vagas: 26 },
  { conjunto: "141", andar: 14, area: 1350, tenant: "cz-t7",  aluguelM2: 113, inicio: "2024-04-01", fim: "2027-03-31", indice: "IPCA",  dataBase: "2024-04-01", garantia: "Sem garantia",    natureza: "tipico",  diaVenc: 10, vagas: 20 },
  { conjunto: "151", andar: 15, area: 1300, tenant: "cz-t8",  aluguelM2: 108, inicio: "2023-09-01", fim: "2026-08-31", indice: "IPCA",  dataBase: "2023-09-01", garantia: "Fiança bancária", natureza: "tipico",  diaVenc: 5,  vagas: 23 },
  { conjunto: "161", andar: 16, area: 1330, tenant: "cz-t8",  aluguelM2: 108, inicio: "2023-09-01", fim: "2026-08-31", indice: "IPCA",  dataBase: "2023-09-01", garantia: "Fiança bancária", natureza: "tipico",  diaVenc: 5,  vagas: 23 },
  { conjunto: "171", andar: 17, area: 1290, tenant: "cz-t5",  aluguelM2: 104, inicio: "2024-02-01", fim: "2027-01-31", indice: "IGP-M", dataBase: "2024-02-01", garantia: "Fiador",          fiador: "BP Energy do Brasil Ltda.", natureza: "tipico", diaVenc: 5, carencia: 90, vagas: 22 },
];

function seedChucriZaidan(state: PortfolioState) {
  const buildingId = "b12";
  state.extras.push({
    buildingId,
    andares: 17,
    iptuMatriculaTerreno: "028.018.0045-1",
    iptuMatriculaConstrucao: "028.018.0046-2",
  });
  CZ_UNITS.forEach((u, i) => {
    const unitId = `b12-cj${u.conjunto}`;
    let contractId: string | null = null;
    if (u.tenant) {
      contractId = `b12-ct${u.conjunto}`;
      // Revisional típica: 3 anos após o início (locações típicas) — demonstrativo
      const revYear = u.inicio ? Number(u.inicio.slice(0, 4)) + 3 : 2027;
      state.contracts.push({
        id: contractId,
        tenantId: u.tenant,
        tipo: "net",
        natureza: u.natureza,
        aluguelM2: u.aluguelM2,
        inicio: u.inicio,
        fim: u.fim,
        indiceReajuste: u.indice,
        dataBaseReajuste: u.dataBase,
        periodicidadeReajuste: "anual",
        revisionalEm: `${revYear}${u.inicio?.slice(4) ?? "-01-01"}`,
        garantia: u.garantia,
        fiador: u.fiador,
        diaVencimento: u.diaVenc,
        carenciaDias: u.carencia,
        vagas: u.vagas,
        status: "active",
      });
    }
    state.units.push({
      id: unitId,
      buildingId,
      andar: u.andar,
      conjunto: u.conjunto,
      areaM2: u.area,
      tenantId: u.tenant,
      contractId,
      iptuAnual: Math.round(u.area * 9.4 * 12) / 1, // ~R$ 9,40/m²/mês de IPTU (demonstrativo)
      iptuMatricula: `028.018.${(100 + i).toString()}-${i % 10}`,
      status: u.tenant ? "occupied" : "vacant",
    });
  });
}

// ─── Seed: demais 12 ativos HGRE11 (conjuntos derivados deterministicamente) ─

const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100000;
  return h;
};

const SEED_TENANT_NAMES = [
  "PagBank PagSeguro", "Mercado Livre", "Itaú Unibanco", "Bradesco Saúde",
  "Suzano Papel e Celulose", "Raízen", "Localiza", "Rumo Logística",
  "B3", "Cielo", "Lojas Renner", "Magazine Luiza",
];

function seedGenericBuilding(state: PortfolioState, b: Building) {
  const h = hash(b.id);
  const andares = Math.max(1, b.total_floors || 1);
  const gla = b.gla_m2 || b.total_area_m2 || 0;
  if (gla <= 0) {
    state.extras.push({ buildingId: b.id, andares });
    return; // ativo sem ABL cadastrada (ex.: Alegria) — sem conjuntos ainda
  }
  const conjuntosPorAndar = gla / andares > 1800 ? 2 : 1;
  const totalConjuntos = andares * conjuntosPorAndar;
  const areaPorConjunto = Math.round(gla / totalConjuntos);
  const ocupacao = (b.occupancy_pct ?? b.occupancy_rate ?? 0) / 100;
  const ocupados = Math.round(totalConjuntos * ocupacao);
  const aluguelMedio = b.monthly_revenue && ocupados > 0
    ? Math.round((b.monthly_revenue / (ocupados * areaPorConjunto)) * 100) / 100
    : 95 + (h % 35);

  state.extras.push({
    buildingId: b.id,
    andares,
    iptuMatriculaTerreno: `0${10 + (h % 80)}.0${h % 90}.0001-0`,
    iptuMatriculaConstrucao: `0${10 + (h % 80)}.0${h % 90}.0002-1`,
  });

  for (let andar = 1; andar <= andares; andar++) {
    for (let c = 1; c <= conjuntosPorAndar; c++) {
      const conjunto = conjuntosPorAndar === 1 ? `${andar}1` : `${andar}0${c}`.slice(-3);
      const idx = (andar - 1) * conjuntosPorAndar + (c - 1);
      const occupied = idx < ocupados;
      const unitId = `${b.id}-cj${conjunto}`;
      let tenantId: string | null = null;
      let contractId: string | null = null;
      if (occupied) {
        tenantId = `${b.id}-t${idx}`;
        contractId = `${b.id}-ct${conjunto}`;
        const tName = SEED_TENANT_NAMES[(h + idx) % SEED_TENANT_NAMES.length];
        state.tenants.push({
          id: tenantId,
          nome: `${tName} (${b.short_name ?? b.name})`,
          segmento: "Corporativo",
          contatoEmail: `contato@${tName.toLowerCase().normalize("NFD").replace(/[^a-z]/g, "").slice(0, 12)}.com.br`,
        });
        const startYear = 2021 + ((h + idx) % 4);
        const month = ((h + idx * 7) % 12) + 1;
        state.contracts.push({
          id: contractId,
          tenantId,
          tipo: "net",
          natureza: (h + idx) % 3 === 0 ? "atipico" : "tipico",
          aluguelM2: aluguelMedio,
          inicio: `${startYear}-${String(month).padStart(2, "0")}-01`,
          fim: `${startYear + 5}-${String(month).padStart(2, "0")}-01`,
          indiceReajuste: (h + idx) % 4 === 0 ? "IGP-M" : "IPCA",
          dataBaseReajuste: `${startYear}-${String(month).padStart(2, "0")}-01`,
          periodicidadeReajuste: "anual",
          revisionalEm: `${startYear + 3}-${String(month).padStart(2, "0")}-01`,
          garantia: ["Fiança bancária", "Seguro fiança", "Depósito caução"][(h + idx) % 3] as PortfolioContract["garantia"],
          diaVencimento: (h + idx) % 2 === 0 ? 5 : 10,
          status: "active",
        });
      }
      state.units.push({
        id: unitId,
        buildingId: b.id,
        andar,
        conjunto,
        areaM2: areaPorConjunto,
        tenantId,
        contractId,
        iptuAnual: Math.round(areaPorConjunto * 8.8 * 12),
        iptuMatricula: `0${10 + (h % 80)}.0${h % 90}.${(100 + idx).toString()}-${idx % 10}`,
        status: occupied ? "occupied" : "vacant",
      });
    }
  }
}

function buildSeed(): PortfolioState {
  const state: PortfolioState = { tenants: [], contracts: [], units: [], extras: [] };
  state.tenants.push(...CZ_TENANTS);
  seedChucriZaidan(state);
  for (const b of getHGRE11PortfolioBuildings()) {
    if (b.id === "b12") continue;
    seedGenericBuilding(state, b);
  }
  return state;
}

// ─── Derivados (números do ativo SEMPRE calculados a partir dos conjuntos) ──

export interface BuildingDerived {
  buildingId: string;
  totalConjuntos: number;
  conjuntosOcupados: number;
  conjuntosVagos: number;
  areaTotal: number;
  areaLocada: number;
  ocupacaoPct: number;         // área locada / área total
  aluguelMensal: number;       // soma área × aluguel/m² dos conjuntos ocupados
  aluguelM2Medio: number;
  iptuAnualTotal: number;      // soma do IPTU dos conjuntos
}

export function deriveBuilding(state: PortfolioState, buildingId: string): BuildingDerived {
  const units = state.units.filter((u) => u.buildingId === buildingId);
  const occupied = units.filter((u) => u.status === "occupied");
  const areaTotal = units.reduce((s, u) => s + u.areaM2, 0);
  const areaLocada = occupied.reduce((s, u) => s + u.areaM2, 0);
  let aluguelMensal = 0;
  for (const u of occupied) {
    const c = state.contracts.find((ct) => ct.id === u.contractId);
    if (c?.aluguelM2) aluguelMensal += u.areaM2 * c.aluguelM2;
  }
  return {
    buildingId,
    totalConjuntos: units.length,
    conjuntosOcupados: occupied.length,
    conjuntosVagos: units.length - occupied.length,
    areaTotal,
    areaLocada,
    ocupacaoPct: areaTotal > 0 ? Math.round((areaLocada / areaTotal) * 1000) / 10 : 0,
    aluguelMensal: Math.round(aluguelMensal),
    aluguelM2Medio: areaLocada > 0 ? Math.round((aluguelMensal / areaLocada) * 100) / 100 : 0,
    iptuAnualTotal: units.reduce((s, u) => s + u.iptuAnual, 0),
  };
}

/** Ordenação por conjunto: numérica crescente (101, 102, 201…) ou decrescente. */
export function sortByConjunto<T extends { conjunto: string }>(list: T[], dir: "asc" | "desc" = "asc"): T[] {
  return [...list].sort((a, b) => {
    const na = parseInt(a.conjunto, 10) || 0;
    const nb = parseInt(b.conjunto, 10) || 0;
    return dir === "asc" ? na - nb : nb - na;
  });
}

// ─── Persistência + Context ─────────────────────────────────────────────────

const STORAGE_KEY = "patria:portfolio-store:v1";

export function loadPortfolioState(): PortfolioState {
  if (typeof window === "undefined") return buildSeed();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PortfolioState;
      if (parsed.units?.length && parsed.extras?.length) return parsed;
    }
  } catch { /* seed */ }
  return buildSeed();
}

export function savePortfolioState(state: PortfolioState) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* quota */ }
}

export function resetPortfolioState() {
  if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
}

export const PortfolioContext = createContext<PortfolioStore | null>(null);

export const usePortfolio = () => {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error("usePortfolio must be inside PortfolioProvider");
  return ctx;
};
