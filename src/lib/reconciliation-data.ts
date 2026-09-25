// Mock data for the Conciliação Financeira module.
// Hierarchy: Fundo → Ativo → Unidade → Contrato → Cobrança.
// IMPORTANTE: nomes, endereços e vínculo de fundo dos ativos vêm SEMPRE de
// mock-data (getHGRE11PortfolioBuildings) — fonte única de verdade do portfólio.
import { getHGRE11PortfolioBuildings, mockTenantContracts } from "@/lib/mock-data";
import { getUnitStackingData } from "@/lib/stacking-plan-data";


export type StatusCobranca =
  | 'conciliado'
  | 'divergencia'
  | 'aberto_banco'
  | 'aberto_cliente'
  | 'inadimplente'
  | 'antecipado';

export type SubStatus =
  | 'contestado_banco'
  | 'cobranca_preparada'
  | 'cobranca_banco'
  | 'cobranca_cliente'
  | 'cobranca_juridica'
  | 'antecipacao_confirmada'
  | 'credito_aceito'
  | 'divergencia_aceita'
  | 'divergencia_cobrada'
  | null;

export interface Fundo { id: string; nome: string }
export interface EdificioRec { id: string; fundoId: string; nome: string; endereco: string }
export interface UnidadeRec { id: string; edificioId: string; identificacao: string }
export interface InquilinoRec {
  id: string; nome: string; documento: string; email: string; telefone: string;
}
export interface DescontoRule { valor: number; meses: string[] }
export interface RevisionalRule { dataInicio: string; novoValor: number }
export interface ContratoRec {
  id: string;
  inquilinoId: string;
  unidadeIds: string[];
  edificioId: string;
  valorAluguelBase: number;
  indiceReajuste: 'IGPM' | 'IPCA';
  dataBaseReajuste: string;   // ISO yyyy-mm-dd — aniversário do reajuste
  diaVencimento: number;
  descontos: DescontoRule[];
  carenciaInicio?: string;
  carenciaFim?: string;
  revisionais: RevisionalRule[];
  iptuValorAnual: number;
  iptuParcelas: number;       // ex.: 10
  iptuPrimeiraParcelaMes: number; // 1..12 — mês da 1ª parcela
}

export type TipoAjuste =
  | 'desconto_negociado'
  | 'inadimplencia_arrastada'
  | 'credito_antecipado'
  | 'condicao_especial'
  | 'ajuste_manual';

export interface AjusteMensal {
  id: string;
  tipo: TipoAjuste;
  descricao: string;
  valor: number; // positivo soma; negativo abate
  origem: 'automatico' | 'manual';
  observacao?: string;
}

export interface CobrancaRec {
  id: string;
  contratoId: string;
  competencia: string;        // YYYY-MM
  aluguelEsperado: number;
  iptuEsperado: number;
  ajustes?: AjusteMensal[];   // computado pelo engine + manuais persistidos
  ajustesManuais?: AjusteMensal[]; // somente os manuais (persistem)
  totalEsperado: number;
  valorCobradoBoleto: number | null;
  valorRecebido: number | null;
  status: StatusCobranca;
  subStatus: SubStatus;
  creditoAntecipadoOrigem?: string | null;
  grupoId?: string | null;    // pertence a um GrupoCobranca (split payment)
  /** Identificador único gerado ao "Preparar cobrança" (disponível para exportação). */
  identificadorCobranca?: string | null;
  cobrancaPreparadaEm?: string | null;
  dataCobrancaBancoEsperada: string;
  dataEnvioBancoEfetiva: string | null;
  dataVencimento: string;
  dataPagamentoEfetiva: string | null;
}

/** Crédito gerado por pagamento antecipado / a maior — fica atrelado ao locatário+contrato. */
export interface CreditoFuturo {
  id: string;
  contratoId: string;
  inquilinoId: string;
  origemEntradaId?: string | null;
  origemCobrancaId?: string | null;
  competenciaOrigem: string;
  valor: number;
  valorUtilizado: number;
  criadoEm: string;
  responsavel: string;
}


export interface AcaoRegistro {
  id: string;
  cobrancaId: string;
  tipoAcao: string;
  responsavel: string;
  data: string;
  observacao?: string;
  resposta?: string;
}

// ----- Recebimentos / Vínculo -----

export type TipoEntrada = 'boleto' | 'TED' | 'PIX' | 'outro';

export interface EntradaBancaria {
  id: string;
  data: string;                  // YYYY-MM-DD
  valor: number;
  tipo: TipoEntrada;
  identificadorBoleto?: string | null;
  descricaoExtrato: string;
  pagadorNome?: string;
  pagadorDocumento?: string;
  origem: 'api' | 'upload';
  arquivoOrigem?: string;
}

export interface VinculoConciliacao {
  id: string;
  entradaId: string;
  cobrancaId: string;
  valorAplicado: number;
  tipoMatch: 'automatico' | 'manual';
  responsavel: string;
  data: string;
}

export interface GrupoCobranca {
  id: string;
  inquilinoId: string;
  competencia: string;
  cobrancaIds: string[];
  identificadorBoleto?: string;
}


// ---------- Seed ----------

export const HGRE11_FUNDO_ID = 'f1';

export const fundos: Fundo[] = [
  { id: HGRE11_FUNDO_ID, nome: 'HGRE11 — Patria Escritórios FII' },
];

// Derivado da fonte única de verdade: os 13 ativos do HGRE11.
export const edificiosRec: EdificioRec[] = getHGRE11PortfolioBuildings().map((b) => ({
  id: b.id,
  fundoId: HGRE11_FUNDO_ID,
  nome: b.name,
  endereco: b.full_address ?? b.address,
}));


export const unidadesRec: UnidadeRec[] = [
  { id: 'u-b2-701', edificioId: 'b2', identificacao: 'Conjunto 701' },
  { id: 'u-b2-1202', edificioId: 'b2', identificacao: 'Conjunto 1202' },
  { id: 'u-b4-401', edificioId: 'b4', identificacao: 'Conjunto 401' },
  { id: 'u-b4-902', edificioId: 'b4', identificacao: 'Conjunto 902' },
  { id: 'u-b5-301', edificioId: 'b5', identificacao: 'Conjunto 301' },
  { id: 'u-b3-1501', edificioId: 'b3', identificacao: 'Conjunto 1501' },
];

// ---------- Chucri Zaidan (b12) — ativo modelo ----------
// Derivado de mockTenantContracts (mesma base do Stacking Plan e de Contratos):
// aluguel = área × R$/m² do contrato; IPTU mensal = área × IPTU/m² do Stacking Plan.
const czOcupados = mockTenantContracts.filter(c => c.building_id === 'b12' && c.status !== 'vacant' && c.tenant_name);
const czSlug = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '');
const czTenantNames = Array.from(new Set(czOcupados.map(c => c.tenant_name!)));
const czInquilinoId = (nome: string) => `i-cz-${czSlug(nome).slice(0, 16)}`;
unidadesRec.push(...czOcupados.map(c => ({ id: `u-${c.id}`, edificioId: 'b12', identificacao: c.unit_id })));

export const inquilinosRec: InquilinoRec[] = [
  { id: 'i1', nome: 'Vivo (Telefônica Brasil)',        documento: '11.260.134/0001-50', email: 'financeiro@vivo.com.br', telefone: '(11) 3000-1100' },
  { id: 'i2', nome: 'Capital & Energia S/A',   documento: '23.456.789/0001-01', email: 'pagamentos@capitaleenergia.com.br', telefone: '(11) 3000-2200' },
  { id: 'i3', nome: 'YouInc Participações',    documento: '34.567.890/0001-12', email: 'ap@youinc.com.br', telefone: '(11) 3000-3300' },
  { id: 'i4', nome: 'Mercatto Consultoria',    documento: '45.678.901/0001-23', email: 'fin@mercatto.com.br', telefone: '(11) 3000-4400' },
  { id: 'i5', nome: 'Northbridge Advisors',    documento: '56.789.012/0001-34', email: 'ap@northbridge.com.br', telefone: '(11) 3000-5500' },
  { id: 'i6', nome: 'Sigma Tech Brasil',       documento: '67.890.123/0001-45', email: 'financeiro@sigmatech.com.br', telefone: '(11) 3000-6600' },
  ...czTenantNames.map(nome => {
    const ct = czOcupados.find(c => c.tenant_name === nome)!;
    const st = getUnitStackingData(ct);
    return { id: czInquilinoId(nome), nome, documento: ct.tenant_cnpj ?? '—', email: st.contato.email, telefone: st.contato.telefone };
  }),
];

export const contratosRec: ContratoRec[] = [
  {
    id: 'c1', inquilinoId: 'i1', unidadeIds: ['u-b2-701'], edificioId: 'b2',
    valorAluguelBase: 42000, indiceReajuste: 'IGPM', dataBaseReajuste: '2025-03-01',
    diaVencimento: 5, descontos: [], revisionais: [],
    iptuValorAnual: 24000, iptuParcelas: 10, iptuPrimeiraParcelaMes: 2,
  },
  {
    id: 'c2', inquilinoId: 'i2', unidadeIds: ['u-b2-1202'], edificioId: 'b2',
    valorAluguelBase: 58000, indiceReajuste: 'IPCA', dataBaseReajuste: '2025-04-01',
    diaVencimento: 10, descontos: [], revisionais: [],
    iptuValorAnual: 36000, iptuParcelas: 12, iptuPrimeiraParcelaMes: 1,
  },
  {
    id: 'c3', inquilinoId: 'i3', unidadeIds: ['u-b4-401'], edificioId: 'b4',
    valorAluguelBase: 31500, indiceReajuste: 'IGPM', dataBaseReajuste: '2025-09-01',
    diaVencimento: 5, descontos: [{ valor: 5000, meses: ['2026-02'] }], revisionais: [],
    iptuValorAnual: 18000, iptuParcelas: 10, iptuPrimeiraParcelaMes: 2,
  },
  {
    id: 'c4', inquilinoId: 'i4', unidadeIds: ['u-b4-902'], edificioId: 'b4',
    valorAluguelBase: 27800, indiceReajuste: 'IPCA', dataBaseReajuste: '2025-05-01',
    diaVencimento: 10, descontos: [], revisionais: [{ dataInicio: '2026-03-01', novoValor: 29500 }],
    iptuValorAnual: 15000, iptuParcelas: 10, iptuPrimeiraParcelaMes: 2,
  },
  {
    id: 'c5', inquilinoId: 'i5', unidadeIds: ['u-b5-301'], edificioId: 'b5',
    valorAluguelBase: 38000, indiceReajuste: 'IGPM', dataBaseReajuste: '2025-08-01',
    diaVencimento: 8, descontos: [], revisionais: [],
    iptuValorAnual: 22000, iptuParcelas: 11, iptuPrimeiraParcelaMes: 2,
  },
  {
    id: 'c6', inquilinoId: 'i6', unidadeIds: ['u-b3-1501'], edificioId: 'b3',
    valorAluguelBase: 47500, indiceReajuste: 'IPCA', dataBaseReajuste: '2025-06-01',
    diaVencimento: 5, descontos: [], revisionais: [],
    iptuValorAnual: 30000, iptuParcelas: 10, iptuPrimeiraParcelaMes: 2,
  },
  ...czOcupados.map((c): ContratoRec => {
    const st = getUnitStackingData(c);
    const mesBase = (c.data_base_reajuste ?? c.contract_start ?? '2023-01-01').slice(5, 7);
    return {
      id: c.id, inquilinoId: czInquilinoId(c.tenant_name!), unidadeIds: [`u-${c.id}`], edificioId: 'b12',
      valorAluguelBase: Math.round(c.area_m2 * (c.price_per_m2 ?? 0)),
      indiceReajuste: c.indice_reajuste === 'IGP-M' ? 'IGPM' : 'IPCA',
      // Último aniversário aplicado em 2025 — o próximo reajuste incide no aniversário de 2026.
      dataBaseReajuste: `2025-${mesBase}-01`,
      diaVencimento: c.dia_vencimento ?? 5, descontos: [], revisionais: [],
      iptuValorAnual: Math.round(c.area_m2 * st.iptuM2 * 12), iptuParcelas: 12, iptuPrimeiraParcelaMes: 1,
    };
  }),
];

// Helper para construir uma cobrança seed (esperado é recalculado pelo engine na renderização).
function mkCobranca(
  contratoId: string,
  competencia: string,
  partial: Partial<CobrancaRec>
): CobrancaRec {
  const [y, m] = competencia.split('-').map(Number);
  const c = contratosRec.find(x => x.id === contratoId)!;
  const venc = new Date(y, m - 1, c.diaVencimento).toISOString().slice(0, 10);
  const emit = new Date(y, m - 1, Math.max(1, c.diaVencimento - 4)).toISOString().slice(0, 10);
  return {
    id: `${contratoId}-${competencia}`,
    contratoId,
    competencia,
    aluguelEsperado: 0, iptuEsperado: 0, totalEsperado: 0,
    valorCobradoBoleto: null,
    valorRecebido: null,
    status: 'aberto_cliente',
    subStatus: null,
    creditoAntecipadoOrigem: null,
    dataCobrancaBancoEsperada: emit,
    dataEnvioBancoEfetiva: null,
    dataVencimento: venc,
    dataPagamentoEfetiva: null,
    ...partial,
  };
}

// Competências: 2026-02, 2026-03, 2026-04.
// Casos distribuídos para cobrir TODOS os status.
export const cobrancasSeed: CobrancaRec[] = [
  // c1 Lux — Fev/Mar conciliado; Abr divergência (boleto R$ 500 a mais).
  mkCobranca('c1', '2026-02', {
    valorCobradoBoleto: 44400, valorRecebido: 44400,
    dataEnvioBancoEfetiva: '2026-01-30', dataPagamentoEfetiva: '2026-02-05',
    status: 'conciliado',
  }),
  mkCobranca('c1', '2026-03', {
    valorCobradoBoleto: 44400, valorRecebido: 44400,
    dataEnvioBancoEfetiva: '2026-02-28', dataPagamentoEfetiva: '2026-03-04',
    status: 'conciliado',
  }),
  mkCobranca('c1', '2026-04', {
    valorCobradoBoleto: 44900, valorRecebido: 44900,
    dataEnvioBancoEfetiva: '2026-03-30', dataPagamentoEfetiva: '2026-04-05',
    status: 'divergencia',
  }),

  // c2 Capital — aberto_banco em Abr (sem emissão).
  mkCobranca('c2', '2026-02', {
    valorCobradoBoleto: 61000, valorRecebido: 61000,
    dataEnvioBancoEfetiva: '2026-01-29', dataPagamentoEfetiva: '2026-02-10',
    status: 'conciliado',
  }),
  mkCobranca('c2', '2026-03', {
    valorCobradoBoleto: 61000, valorRecebido: 61000,
    dataEnvioBancoEfetiva: '2026-02-28', dataPagamentoEfetiva: '2026-03-09',
    status: 'conciliado',
  }),
  mkCobranca('c2', '2026-04', {
    valorCobradoBoleto: null, valorRecebido: null,
    dataEnvioBancoEfetiva: null,
    status: 'aberto_banco',
  }),

  // c3 YouInc — Fev desconto, conciliado; Mar aberto_cliente; Abr conciliado.
  mkCobranca('c3', '2026-02', {
    valorCobradoBoleto: 28300, valorRecebido: 28300,
    dataEnvioBancoEfetiva: '2026-02-01', dataPagamentoEfetiva: '2026-02-05',
    status: 'conciliado',
  }),
  mkCobranca('c3', '2026-03', {
    valorCobradoBoleto: 33300, valorRecebido: null,
    dataEnvioBancoEfetiva: '2026-03-02',
    status: 'aberto_cliente',
  }),
  mkCobranca('c3', '2026-04', {
    valorCobradoBoleto: 33300, valorRecebido: 33300,
    dataEnvioBancoEfetiva: '2026-03-30', dataPagamentoEfetiva: '2026-04-05',
    status: 'conciliado',
  }),

  // c4 Mercatto — INADIMPLENTE 3 meses seguidos → dispara recorrência.
  mkCobranca('c4', '2026-02', {
    valorCobradoBoleto: 29200, valorRecebido: null,
    dataEnvioBancoEfetiva: '2026-01-30',
    status: 'inadimplente',
  }),
  mkCobranca('c4', '2026-03', {
    valorCobradoBoleto: 30900, valorRecebido: null,
    dataEnvioBancoEfetiva: '2026-02-28',
    status: 'inadimplente',
  }),
  mkCobranca('c4', '2026-04', {
    valorCobradoBoleto: 30900, valorRecebido: null,
    dataEnvioBancoEfetiva: '2026-03-30',
    status: 'inadimplente',
    subStatus: 'cobranca_juridica',
  }),

  // c5 Northbridge — Fev conciliado; Mar ANTECIPADO (paga Abr em Mar); Abr aparece como antecipado.
  mkCobranca('c5', '2026-02', {
    valorCobradoBoleto: 39800, valorRecebido: 39800,
    dataEnvioBancoEfetiva: '2026-01-30', dataPagamentoEfetiva: '2026-02-08',
    status: 'conciliado',
  }),
  mkCobranca('c5', '2026-03', {
    valorCobradoBoleto: 39800, valorRecebido: 39800,
    dataEnvioBancoEfetiva: '2026-02-28', dataPagamentoEfetiva: '2026-03-07',
    status: 'conciliado',
  }),
  mkCobranca('c5', '2026-04', {
    valorCobradoBoleto: 39800, valorRecebido: 39800,
    dataEnvioBancoEfetiva: '2026-03-30',
    dataPagamentoEfetiva: '2026-03-28', // pago antes do vencimento de Abr
    status: 'antecipado',
    creditoAntecipadoOrigem: 'c5-2026-03',
  }),

  // c6 Sigma — Fev conciliado; Mar conciliado com atraso do Banco; Abr aberto_cliente recém-vencido.
  mkCobranca('c6', '2026-02', {
    valorCobradoBoleto: 49700, valorRecebido: 49700,
    dataEnvioBancoEfetiva: '2026-01-30', dataPagamentoEfetiva: '2026-02-05',
    status: 'conciliado',
  }),
  mkCobranca('c6', '2026-03', {
    valorCobradoBoleto: 49700, valorRecebido: 49700,
    dataEnvioBancoEfetiva: '2026-03-04', // atrasou 5 dias
    dataPagamentoEfetiva: '2026-03-08',
    status: 'conciliado',
  }),
  mkCobranca('c6', '2026-04', {
    valorCobradoBoleto: 49700, valorRecebido: null,
    dataEnvioBancoEfetiva: '2026-03-30',
    status: 'aberto_cliente',
  }),

  // Chucri Zaidan — Fev–Abr: maioria conciliada; casos reais de atraso e inadimplência.
  ...czOcupados.flatMap(c => (['2026-02', '2026-03', '2026-04'] as const).map(comp => {
    const [y, m] = comp.split('-').map(Number);
    const dia = c.dia_vencimento ?? 5;
    const envio = new Date(y, m - 1, Math.max(1, dia - 4)).toISOString().slice(0, 10);
    const pago = (d: number) => new Date(y, m - 1, d).toISOString().slice(0, 10);
    const base = { valorCobradoBoleto: -1, dataEnvioBancoEfetiva: envio, identificadorCobranca: `COB-${c.id}-${comp}` };
    // WeWork (cj 141): abril em aberto, vencido — inadimplente.
    if (c.id === 'b12-ct141' && comp === '2026-04')
      return mkCobranca(c.id, comp, { ...base, valorRecebido: null, status: 'inadimplente' });
    // Befly (cj 81): março pago com 12 dias de atraso (gera multa e juros).
    if (c.id === 'b12-ct81' && comp === '2026-03')
      return mkCobranca(c.id, comp, { ...base, valorRecebido: -1, dataPagamentoEfetiva: pago(dia + 12), status: 'conciliado' });
    // DHL (cj 131): abril ainda aguardando pagamento dentro do prazo de tolerância.
    if (c.id === 'b12-ct131' && comp === '2026-04')
      return mkCobranca(c.id, comp, { ...base, valorRecebido: null, status: 'aberto_cliente' });
    return mkCobranca(c.id, comp, { ...base, valorRecebido: -1, dataPagamentoEfetiva: pago(dia), status: 'conciliado' });
  })),
];

export const acoesSeed: AcaoRegistro[] = [
  {
    id: 'a1', cobrancaId: 'c4-2026-04', tipoAcao: 'Enviar para jurídico',
    responsavel: 'Natalia Landi', data: '2026-04-12',
    observacao: 'Terceira competência consecutiva sem pagamento.',
  },
];
// ---------- Seed de Entradas Bancárias (mock) ----------
// Mistura: boletos identificados, TEDs/PIX casáveis por valor+data+pagador,
// e entradas órfãs para vínculo manual.
export const entradasBancariasSeed: EntradaBancaria[] = [
  // Casam pelo identificador do boleto (auto-match perfeito)
  {
    id: 'eb1', data: '2026-04-05', valor: 44900, tipo: 'boleto',
    identificadorBoleto: 'BOL-c1-2026-04', descricaoExtrato: 'LIQ BOLETO BOL-c1-2026-04',
    pagadorNome: 'Vivo (Telefônica Brasil)', pagadorDocumento: '11.260.134/0001-50',
    origem: 'api',
  },
  // TED casa por valor + janela de data + nome do pagador
  {
    id: 'eb2', data: '2026-04-07', valor: 33300, tipo: 'TED',
    descricaoExtrato: 'TED 341 - YOUINC PARTICIPACOES',
    pagadorNome: 'YouInc Participações', pagadorDocumento: '34.567.890/0001-12',
    origem: 'api',
  },
  // PIX órfão — valor sem cobrança casando exata; precisa vínculo manual
  {
    id: 'eb3', data: '2026-04-10', valor: 15000, tipo: 'PIX',
    descricaoExtrato: 'PIX RECEBIDO - REF ADIANTAMENTO',
    pagadorNome: 'Mercatto Consultoria', pagadorDocumento: '45.678.901/0001-23',
    origem: 'api',
  },
  // Entrada de upload — TED do Sigma cobrindo abril
  {
    id: 'eb4', data: '2026-04-06', valor: 49700, tipo: 'TED',
    descricaoExtrato: 'TED RECEBIDA - SIGMA TECH BRASIL LTDA',
    pagadorNome: 'Sigma Tech Brasil', pagadorDocumento: '67.890.123/0001-45',
    origem: 'upload', arquivoOrigem: 'extrato-abril-2026.ofx',
  },
];

export const vinculosSeed: VinculoConciliacao[] = [];

export const gruposSeed: GrupoCobranca[] = [];

export const creditosSeed: CreditoFuturo[] = [];

// ---------- Histórico (12 meses) ----------
// Competências 2025-05 .. 2026-01 conciliadas, para alimentar séries de 12 meses
// no Fechamento Mensal e no histórico de NOI. As competências 2026-02..04 são
// as hand-crafted acima (cobrem todos os status).
const HIST_COMPETENCIAS = [
  '2025-05', '2025-06', '2025-07', '2025-08', '2025-09',
  '2025-10', '2025-11', '2025-12', '2026-01',
];

/** Fator de realização por mês (mock) — alguns meses recebem menos que o esperado. */
const HIST_FATOR: Record<string, number> = {
  '2025-05': 1, '2025-06': 1, '2025-07': 0.94, '2025-08': 1, '2025-09': 1,
  '2025-10': 0.97, '2025-11': 1, '2025-12': 1, '2026-01': 0.98,
};

export const cobrancasHistoricas: CobrancaRec[] = HIST_COMPETENCIAS.flatMap(comp =>
  contratosRec.map((ct, idx) => {
    const fator = HIST_FATOR[comp] ?? 1;
    // Um contrato por mês "atrasa" quando o fator < 1.
    const atrasa = fator < 1 && idx === Number(comp.slice(-2)) % contratosRec.length;
    const [y, m] = comp.split('-').map(Number);
    const pgto = new Date(y, m - 1, Math.min(28, ct.diaVencimento + 1)).toISOString().slice(0, 10);
    return mkCobranca(ct.id, comp, {
      valorCobradoBoleto: -1,       // placeholder: o engine recalcula o esperado
      valorRecebido: atrasa ? 0 : -1,
      dataEnvioBancoEfetiva: new Date(y, m - 1, Math.max(1, ct.diaVencimento - 4)).toISOString().slice(0, 10),
      dataPagamentoEfetiva: atrasa ? null : pgto,
      status: atrasa ? 'inadimplente' : 'conciliado',
      identificadorCobranca: `COB-${ct.id}-${comp}`,
      cobrancaPreparadaEm: new Date(y, m - 1, 1).toISOString().slice(0, 10),
    });
  })
);
