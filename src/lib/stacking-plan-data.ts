// ============================================================================
// STACKING PLAN — dados por unidade/andar (áreas BOMA e NBR, custos por m²,
// contato do locatário, histórico da unidade).
// Valores derivados de forma determinística do contrato (dados demonstrativos
// quando não há cadastro real do locatário).
// ============================================================================
import type { TenantContract } from "@/lib/mock-data";

export interface UnitContact {
  nome: string;
  cargo: string;
  email: string;
  telefone: string;
  demo: boolean;
}

export interface UnitHistoryEvent {
  date: string;      // YYYY-MM-DD
  tipo: "Locatário" | "Obra" | "Operação" | "Contrato" | "Vistoria";
  descricao: string;
}

export interface UnitStackingData {
  unitId: string;
  areaNbr: number;        // área privativa NBR 12721
  areaBoma: number;       // área BOMA (rentável, com fator de perda)
  fatorBoma: number;
  aluguelM2: number;
  iptuM2: number;
  condominioM2: number;
  garantiaModalidade: string;
  garantiaMeses: number;
  garantiaValor: number;
  contato: UnitContact;
  historico: UnitHistoryEvent[];
}

const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100000;
  return h;
};

const primeiroNomes = ["Ana", "Carlos", "Juliana", "Rafael", "Marcos", "Beatriz", "Fernanda", "Diego", "Patrícia", "Luiz"];
const sobrenomes = ["Almeida", "Ribeiro", "Moraes", "Camargo", "Tavares", "Bianchi", "Nogueira", "Prado", "Barbosa", "Fontes"];
const cargos = ["Facilities Manager", "Gerente Administrativo", "Coordenador de Operações", "Head de Infraestrutura", "Analista Predial"];
const garantias = ["Fiança bancária", "Seguro fiança", "Depósito caução", "Título de capitalização"];

const slug = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "");

/** Dados de stacking plan de uma unidade. */
export function getUnitStackingData(c: TenantContract): UnitStackingData {
  const h = hash(c.id + c.unit_id);
  const areaNbr = c.area_m2;
  const fatorBoma = 1.06 + (h % 7) / 100;                   // 1,06 – 1,12
  const aluguelM2 = c.price_per_m2 ?? 118 + (h % 45);
  const iptuM2 = Math.round((aluguelM2 * (0.06 + (h % 5) / 100)) * 100) / 100;
  const condominioM2 = Math.round((aluguelM2 * (0.18 + (h % 8) / 100)) * 100) / 100;
  const garantiaMeses = [3, 6, 12][h % 3];
  const nome = `${primeiroNomes[h % primeiroNomes.length]} ${sobrenomes[(h >> 3) % sobrenomes.length]}`;
  const empresaSlug = c.tenant_name ? slug(c.tenant_name).slice(0, 14) : "portfolio";
  const isVacant = c.status === "vacant" || !c.tenant_name;

  const startYear = c.contract_start ? new Date(c.contract_start).getFullYear() : 2022;
  const historico: UnitHistoryEvent[] = isVacant
    ? [
        { date: `${startYear}-03-12`, tipo: "Contrato", descricao: "Encerramento do contrato anterior e devolução da área" },
        { date: `${startYear}-05-20`, tipo: "Obra", descricao: "Retrofit de piso elevado e forro — entrega em padrão shell & core" },
        { date: `${startYear}-07-02`, tipo: "Vistoria", descricao: "Vistoria de disponibilização concluída sem pendências" },
      ]
    : [
        { date: c.contract_start ?? `${startYear}-01-15`, tipo: "Locatário", descricao: `Início da locação — ${c.tenant_name}` },
        { date: `${startYear}-04-08`, tipo: "Obra", descricao: `Obra de layout aprovada (${20 + (h % 40)} posições de trabalho)` },
        { date: `${startYear + 1}-02-11`, tipo: "Operação", descricao: `Revisão de HVAC e ajuste de carga elétrica (${8 + (h % 12)} kW adicionais)` },
        { date: `${startYear + 1}-09-27`, tipo: "Contrato", descricao: `Reajuste aplicado pelo ${c.indice_reajuste ?? "IPCA"} sobre o aluguel base` },
      ];

  return {
    unitId: c.unit_id,
    areaNbr,
    areaBoma: Math.round(areaNbr * fatorBoma),
    fatorBoma,
    aluguelM2,
    iptuM2,
    condominioM2,
    garantiaModalidade: c.garantia ?? (isVacant ? "—" : garantias[h % garantias.length]),
    garantiaMeses: isVacant ? 0 : garantiaMeses,
    garantiaValor: isVacant ? 0 : Math.round(areaNbr * aluguelM2 * garantiaMeses),
    contato: {
      nome: isVacant ? "Equipe de Locação Patria" : nome,
      cargo: isVacant ? "Comercial / Locação" : cargos[h % cargos.length],
      email: isVacant ? "locacao@patriareal.com.br" : `${slug(nome).replace(/\s/g, ".")}@${empresaSlug}.com.br`,
      telefone: `(11) 9${(4000 + (h % 5000)).toString()}-${(1000 + (h % 8999)).toString()}`,
      demo: true,
    },
    historico,
  };
}
