// ─── Dados demonstrativos do módulo CRM Monday (HGRE11 — Patria) ───
// Todos os dados são ilustrativos e servem de referência visual da integração.
import { getHGRE11PortfolioBuildings, mockTenantContracts } from "@/lib/mock-data";

export type DealStage =
  | "originacao"
  | "analise"
  | "due_diligence"
  | "comite"
  | "fechamento"
  | "desinvestimento";

export const dealStages: { id: DealStage; label: string }[] = [
  { id: "originacao", label: "Originação" },
  { id: "analise", label: "Análise / Qualificação" },
  { id: "due_diligence", label: "Due Diligence" },
  { id: "comite", label: "Comitê de Investimentos" },
  { id: "fechamento", label: "Fechamento" },
  { id: "desinvestimento", label: "Desinvestimento" },
];

export interface DueDiligenceItem {
  frente: "Jurídica" | "Técnica" | "Ambiental" | "Fiscal";
  concluido: number;
  total: number;
  responsavel: string;
}

export interface Deal {
  id: string;
  nome: string;
  cidade: string;
  setor: "Lajes Corporativas" | "Galpão Logístico" | "Terreno" | "Shopping";
  tipo: "Aquisição" | "Desinvestimento";
  stage: DealStage;
  ablM2: number;
  valorPedido: number;
  capRate: number;
  tirEstimada: number;
  broker: string;
  responsavel: string;
  proximoPasso: string;
  atualizadoEm: string;
  dueDiligence: DueDiligenceItem[];
}

export const deals: Deal[] = [
  {
    id: "dl1",
    nome: "Torre Faria Lima 3200",
    cidade: "São Paulo — SP",
    setor: "Lajes Corporativas",
    tipo: "Aquisição",
    stage: "due_diligence",
    ablM2: 14200,
    valorPedido: 268000000,
    capRate: 8.4,
    tirEstimada: 13.6,
    broker: "JLL Capital Markets",
    responsavel: "Mariana Alves",
    proximoPasso: "Fechar parecer jurídico da matrícula",
    atualizadoEm: "2026-09-15",
    dueDiligence: [
      { frente: "Jurídica", concluido: 7, total: 9, responsavel: "Pinheiro & Assoc." },
      { frente: "Técnica", concluido: 5, total: 6, responsavel: "Engebras" },
      { frente: "Ambiental", concluido: 3, total: 5, responsavel: "EcoAudit" },
      { frente: "Fiscal", concluido: 4, total: 4, responsavel: "Interno" },
    ],
  },
  {
    id: "dl2",
    nome: "Galpão Extrema BR-381",
    cidade: "Extrema — MG",
    setor: "Galpão Logístico",
    tipo: "Aquisição",
    stage: "analise",
    ablM2: 42500,
    valorPedido: 189500000,
    capRate: 9.1,
    tirEstimada: 14.8,
    broker: "Cushman & Wakefield",
    responsavel: "Rafael Nunes",
    proximoPasso: "Validar premissas de rent roll com o vendedor",
    atualizadoEm: "2026-09-16",
    dueDiligence: [
      { frente: "Jurídica", concluido: 2, total: 9, responsavel: "Pendente" },
      { frente: "Técnica", concluido: 1, total: 6, responsavel: "Engebras" },
      { frente: "Ambiental", concluido: 0, total: 5, responsavel: "Pendente" },
      { frente: "Fiscal", concluido: 1, total: 4, responsavel: "Interno" },
    ],
  },
  {
    id: "dl3",
    nome: "Conjunto Berrini Corporate",
    cidade: "São Paulo — SP",
    setor: "Lajes Corporativas",
    tipo: "Aquisição",
    stage: "comite",
    ablM2: 9800,
    valorPedido: 152000000,
    capRate: 8.0,
    tirEstimada: 12.9,
    broker: "CBRE",
    responsavel: "Mariana Alves",
    proximoPasso: "Apresentar memorando ao comitê de 30/09",
    atualizadoEm: "2026-09-17",
    dueDiligence: [
      { frente: "Jurídica", concluido: 9, total: 9, responsavel: "Pinheiro & Assoc." },
      { frente: "Técnica", concluido: 6, total: 6, responsavel: "Engebras" },
      { frente: "Ambiental", concluido: 5, total: 5, responsavel: "EcoAudit" },
      { frente: "Fiscal", concluido: 4, total: 4, responsavel: "Interno" },
    ],
  },
  {
    id: "dl4",
    nome: "Terreno Marginal Pinheiros",
    cidade: "São Paulo — SP",
    setor: "Terreno",
    tipo: "Aquisição",
    stage: "originacao",
    ablM2: 6400,
    valorPedido: 74000000,
    capRate: 0,
    tirEstimada: 16.2,
    broker: "Originação direta",
    responsavel: "Bruno Carvalho",
    proximoPasso: "Agendar visita técnica com o proprietário",
    atualizadoEm: "2026-09-12",
    dueDiligence: [
      { frente: "Jurídica", concluido: 0, total: 9, responsavel: "Pendente" },
      { frente: "Técnica", concluido: 0, total: 6, responsavel: "Pendente" },
      { frente: "Ambiental", concluido: 0, total: 5, responsavel: "Pendente" },
      { frente: "Fiscal", concluido: 0, total: 4, responsavel: "Pendente" },
    ],
  },
  {
    id: "dl5",
    nome: "Edifício Paulista 1450 (venda parcial)",
    cidade: "São Paulo — SP",
    setor: "Lajes Corporativas",
    tipo: "Desinvestimento",
    stage: "desinvestimento",
    ablM2: 5200,
    valorPedido: 96500000,
    capRate: 7.4,
    tirEstimada: 11.1,
    broker: "Newmark",
    responsavel: "Rafael Nunes",
    proximoPasso: "Receber propostas vinculantes até 10/10",
    atualizadoEm: "2026-09-14",
    dueDiligence: [
      { frente: "Jurídica", concluido: 6, total: 9, responsavel: "Interno" },
      { frente: "Técnica", concluido: 4, total: 6, responsavel: "Engebras" },
      { frente: "Ambiental", concluido: 2, total: 5, responsavel: "EcoAudit" },
      { frente: "Fiscal", concluido: 3, total: 4, responsavel: "Interno" },
    ],
  },
  {
    id: "dl6",
    nome: "Shopping Vale Sul (participação minoritária)",
    cidade: "São José dos Campos — SP",
    setor: "Shopping",
    tipo: "Aquisição",
    stage: "fechamento",
    ablM2: 11300,
    valorPedido: 128000000,
    capRate: 8.7,
    tirEstimada: 13.2,
    broker: "JLL Capital Markets",
    responsavel: "Bruno Carvalho",
    proximoPasso: "Assinatura de escritura em 25/09",
    atualizadoEm: "2026-09-17",
    dueDiligence: [
      { frente: "Jurídica", concluido: 9, total: 9, responsavel: "Pinheiro & Assoc." },
      { frente: "Técnica", concluido: 6, total: 6, responsavel: "Engebras" },
      { frente: "Ambiental", concluido: 5, total: 5, responsavel: "EcoAudit" },
      { frente: "Fiscal", concluido: 4, total: 4, responsavel: "Interno" },
    ],
  },
];

// ─── Asset management: vacância e renovações por ativo ───
export interface AssetBoardRow {
  ativo: string;
  cidade: string;
  ablM2: number;
  ocupacao: number;
  locatarios: number;
  proximoVencimento: string;
  indice: "IPCA" | "IGP-M";
  alerta: "Reajuste em janela" | "Renovação em 90 dias" | "Renovação em 120 dias" | "Sem alerta";
}

const indices: AssetBoardRow["indice"][] = ["IPCA", "IGP-M"];
const alertas: AssetBoardRow["alerta"][] = [
  "Renovação em 90 dias",
  "Reajuste em janela",
  "Sem alerta",
  "Renovação em 120 dias",
];

export const assetBoard: AssetBoardRow[] = getHGRE11PortfolioBuildings().map((b, i) => ({
  ativo: b.short_name || b.name,
  cidade: `${b.city} — ${b.state}`,
  ablM2: b.gla_m2 ?? b.total_area_m2,
  ocupacao: b.occupancy_pct ?? b.occupancy_rate,
  locatarios: mockTenantContracts.filter((c) => c.building_id === b.id).length || 3 + (i % 5),
  proximoVencimento: b.next_expiry_date || "2027-06-30",
  indice: indices[i % indices.length],
  alerta: alertas[i % alertas.length],
}));

// ─── Stakeholders / relacionamento ───
export interface Interaction {
  data: string;
  contato: string;
  empresa: string;
  papel: "Broker" | "Inquilino" | "Proprietário" | "Administradora" | "Fornecedor";
  canal: "E-mail" | "Reunião" | "Formulário Monday" | "Telefone";
  assunto: string;
  status: "Aberto" | "Em andamento" | "Concluído";
}

export const interactions: Interaction[] = [
  { data: "2026-09-17", contato: "Camila Prado", empresa: "JLL Capital Markets", papel: "Broker", canal: "E-mail", assunto: "Teaser de laje na Faria Lima", status: "Em andamento" },
  { data: "2026-09-16", contato: "Eduardo Lima", empresa: "Totvs S.A.", papel: "Inquilino", canal: "Formulário Monday", assunto: "Chamado de manutenção — climatização 8º andar", status: "Aberto" },
  { data: "2026-09-15", contato: "Sandra Beltrão", empresa: "Cushman & Wakefield", papel: "Broker", canal: "Reunião", assunto: "Pipeline logístico Extrema", status: "Em andamento" },
  { data: "2026-09-12", contato: "Marcos Vidal", empresa: "Vivo (Telefônica Brasil)", papel: "Inquilino", canal: "Reunião", assunto: "Negociação de renovação antecipada", status: "Em andamento" },
  { data: "2026-09-10", contato: "Adm. Prisma", empresa: "Prisma Administradora", papel: "Administradora", canal: "E-mail", assunto: "Prestação de contas do condomínio — agosto", status: "Concluído" },
  { data: "2026-09-08", contato: "Helena Souza", empresa: "Grupo Zenith", papel: "Proprietário", canal: "Telefone", assunto: "Interesse em venda de participação", status: "Aberto" },
];

// ─── Governança / trilha de auditoria ───
export interface AuditEntry {
  data: string;
  usuario: string;
  acao: string;
  objeto: string;
  visibilidade: "Restrito ao comitê" | "Equipe de Real Estate" | "Todos";
}

export const auditTrail: AuditEntry[] = [
  { data: "2026-09-17 16:42", usuario: "Bruno Carvalho", acao: "Alterou valor pedido de R$ 131,0 mi para R$ 128,0 mi", objeto: "Shopping Vale Sul", visibilidade: "Restrito ao comitê" },
  { data: "2026-09-17 11:05", usuario: "Mariana Alves", acao: "Anexou laudo de avaliação", objeto: "Conjunto Berrini Corporate", visibilidade: "Restrito ao comitê" },
  { data: "2026-09-16 18:20", usuario: "Rafael Nunes", acao: "Aprovou waiver de cláusula de garantia", objeto: "Galpão Extrema BR-381", visibilidade: "Restrito ao comitê" },
  { data: "2026-09-16 09:48", usuario: "Integração Monday", acao: "Sincronizou 27 contratos", objeto: "Quadro Contratos e Renovações", visibilidade: "Todos" },
  { data: "2026-09-15 14:12", usuario: "Camila Prado (externo)", acao: "Enviou proposta via formulário", objeto: "Torre Faria Lima 3200", visibilidade: "Equipe de Real Estate" },
];

export interface PermissionRow {
  perfil: string;
  pipeline: string;
  dealsEstrategicos: string;
  contratos: string;
  auditoria: string;
}

export const permissions: PermissionRow[] = [
  { perfil: "Fund Manager", pipeline: "Total", dealsEstrategicos: "Total", contratos: "Total", auditoria: "Total" },
  { perfil: "Comitê de Investimentos", pipeline: "Leitura", dealsEstrategicos: "Leitura", contratos: "Leitura", auditoria: "Leitura" },
  { perfil: "Real Estate / Asset", pipeline: "Edição", dealsEstrategicos: "Sem acesso", contratos: "Edição", auditoria: "Parcial" },
  { perfil: "Property Manager", pipeline: "Sem acesso", dealsEstrategicos: "Sem acesso", contratos: "Leitura", auditoria: "Sem acesso" },
  { perfil: "Inquilinos / Fornecedores", pipeline: "Sem acesso", dealsEstrategicos: "Sem acesso", contratos: "Formulários", auditoria: "Sem acesso" },
];

// ─── Quadros mapeados ───
export interface BoardMap {
  board: string;
  modulo: string;
  itens: number;
  automacoes: number;
  status: "mapeado" | "pendente";
}

export const boards: BoardMap[] = [
  { board: "Pipeline de Aquisições (Dealflow)", modulo: "Portfólio / Comitê", itens: 6, automacoes: 8, status: "pendente" },
  { board: "Contratos e Renovações", modulo: "Contratos", itens: 27, automacoes: 5, status: "pendente" },
  { board: "Vacância e Locatários", modulo: "Mapa de Ativos", itens: 41, automacoes: 4, status: "pendente" },
  { board: "Relacionamento com Stakeholders", modulo: "Comunicação", itens: 118, automacoes: 3, status: "pendente" },
  { board: "Due Diligence Imobiliária", modulo: "Documentos", itens: 63, automacoes: 6, status: "pendente" },
  { board: "Cobrança e Inadimplência", modulo: "Fechamento Mensal", itens: 19, automacoes: 4, status: "pendente" },
];

export const setorExposicao = [
  { setor: "Lajes Corporativas", valor: 546.5 },
  { setor: "Galpão Logístico", valor: 189.5 },
  { setor: "Shopping", valor: 128 },
  { setor: "Terreno", valor: 74 },
];

export const funnelPorEtapa = dealStages.map((s) => ({
  etapa: s.label,
  valor: deals.filter((d) => d.stage === s.id).reduce((sum, d) => sum + d.valorPedido, 0) / 1_000_000,
  quantidade: deals.filter((d) => d.stage === s.id).length,
}));
