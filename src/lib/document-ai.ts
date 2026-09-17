import { mockReportFolders, ReportFolder, getHGRE11PortfolioBuildings } from "@/lib/mock-data";

export interface AiField { rotulo: string; valor: string | number | null; grupo: string }
export interface AiClause { titulo: string; resumo: string }

export interface AiDocumentAnalysis {
  docType?: string;
  docTypeKey?: string;
  nome?: string;
  resumo?: string;
  destino?: { categoria?: string; subpasta?: string };
  ativo?: string;
  empresa?: string;
  contraparte?: string;
  documentoNumero?: string | null;
  dataEmissao?: string | null;
  dataValidade?: string | null;
  financeiro?: {
    valorAluguel?: number | null; valorPorM2?: number | null; areaM2?: number | null;
    valorTotal?: number | null; moeda?: string;
  };
  reajuste?: {
    indice?: string | null; periodicidade?: string | null; mesAniversario?: string | null;
    proximaDataReajuste?: string | null; ultimoReajusteAplicado?: string | null; percentualUltimoReajuste?: number | null;
  };
  prazos?: {
    dataInicio?: string | null; dataFim?: string | null; prazoMeses?: number | null;
    carenciaMeses?: number | null; proximaRevisional?: string | null;
  };
  garantia?: { tipo?: string | null; valor?: number | null; validade?: string | null };
  camposAdicionais?: AiField[];
  clausulas?: AiClause[];
  alertas?: string[];
  tags?: string[];
  confianca?: number;
}

/** Flat taxonomy: category > subfolder, built from the document library tree. */
export interface TaxonomyEntry { categoryId: string; category: string; subfolderId: string; subfolder: string }

export const buildTaxonomy = (folders: ReportFolder[] = mockReportFolders): TaxonomyEntry[] => {
  const out: TaxonomyEntry[] = [];
  for (const f of folders) {
    for (const sub of f.children || []) {
      out.push({ categoryId: f.id, category: f.name, subfolderId: sub.id, subfolder: sub.name });
    }
  }
  return out;
};

export const taxonomyAsText = (entries = buildTaxonomy()) =>
  entries.map(e => `- ${e.category} > ${e.subfolder}`).join("\n");

export const assetsAsText = () => getHGRE11PortfolioBuildings().map(b => `- ${b.name}`).join("\n");

/** Resolve the AI-suggested destination to a real folder in the library tree. */
export const resolveDestination = (
  destino: { categoria?: string; subpasta?: string } | undefined,
  docTypeKey?: string,
): TaxonomyEntry | null => {
  const entries = buildTaxonomy();
  const norm = (s?: string) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  if (destino?.categoria) {
    const exact = entries.find(e => norm(e.category) === norm(destino.categoria) && norm(e.subfolder) === norm(destino.subpasta));
    if (exact) return exact;
    const bySub = entries.find(e => norm(e.subfolder) === norm(destino.subpasta));
    if (bySub) return bySub;
    const byCat = entries.find(e => norm(e.category) === norm(destino.categoria));
    if (byCat) return byCat;
  }

  const fallbackByType: Record<string, [string, string]> = {
    contrato_locacao: ["Gestão de Ativos", "Contratos de Locação"],
    aditivo: ["Gestão de Ativos", "Contratos de Locação"],
    seguro: ["Segurança e Compliance", "Licenças e Alvarás"],
    laudo_tecnico: ["Técnico / Engenharia", "Laudos e Inspeções"],
    avcb: ["Técnico / Engenharia", "Laudos e Inspeções"],
    pmoc: ["Técnico / Engenharia", "PMOC"],
    art: ["Técnico / Engenharia", "ART / RRT"],
    alvara: ["Segurança e Compliance", "Licenças e Alvarás"],
    iptu: ["Financeiro", "Orçamento e Despesas"],
    nota_fiscal: ["Financeiro", "Orçamento e Despesas"],
    boleto: ["Financeiro", "Receita de Locação"],
    fatura_utilities: ["ESG & Sustentabilidade", "Consumo de Energia"],
    relatorio: ["Gestão de Ativos", "Chamados e Manutenção"],
    planilha: ["Financeiro", "Orçamento e Despesas"],
    foto_ativo: ["Técnico / Engenharia", "Laudos e Inspeções"],
  };
  const fb = fallbackByType[docTypeKey || ""] || ["Gestão de Ativos", "Contratos de Locação"];
  return entries.find(e => e.category === fb[0] && e.subfolder === fb[1]) || entries[0] || null;
};

export const docTypeLabels: Record<string, string> = {
  contrato_locacao: "Contrato de Locação",
  aditivo: "Aditivo Contratual",
  seguro: "Apólice de Seguro",
  laudo_tecnico: "Laudo Técnico",
  avcb: "AVCB",
  pmoc: "PMOC",
  art: "ART / RRT",
  alvara: "Alvará / Licença",
  iptu: "IPTU",
  nota_fiscal: "Nota Fiscal",
  boleto: "Boleto",
  fatura_utilities: "Fatura de Utilities",
  relatorio: "Relatório",
  planilha: "Planilha",
  foto_ativo: "Foto de Ativo",
  outro: "Documento",
};

/** Which field groups matter per document type — drives the review layout. */
export const relevantGroups = (docTypeKey?: string): string[] => {
  switch (docTypeKey) {
    case "contrato_locacao":
    case "aditivo":
      return ["Identificação", "Financeiro", "Reajuste", "Prazos", "Garantias", "Outros"];
    case "seguro":
      return ["Identificação", "Financeiro", "Prazos", "Garantias", "Outros"];
    case "avcb":
    case "pmoc":
    case "art":
    case "alvara":
    case "laudo_tecnico":
      return ["Identificação", "Técnico", "Compliance", "Prazos", "Outros"];
    case "fatura_utilities":
    case "nota_fiscal":
    case "boleto":
    case "iptu":
      return ["Identificação", "Financeiro", "Prazos", "Outros"];
    default:
      return ["Identificação", "Financeiro", "Reajuste", "Prazos", "Garantias", "Técnico", "Compliance", "Outros"];
  }
};

export const brl = (v?: number | null) =>
  typeof v === "number" && !Number.isNaN(v)
    ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 })
    : "—";

export const ptDate = (v?: string | null) => {
  if (!v) return "—";
  const d = new Date(`${v}T00:00:00`);
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleDateString("pt-BR");
};

/** Deterministic demo analysis used when the AI call is unavailable. */
export const mockAnalysisFor = (fileName: string): AiDocumentAnalysis => {
  const n = fileName.toLowerCase();
  if (n.includes("contrato") || n.includes("locacao") || n.includes("locação")) {
    return {
      docType: "Contrato de Locação Atípico (BTS)",
      docTypeKey: "contrato_locacao",
      nome: "Contrato de Locação — Totvs S.A. — Chucri Zaidan (Módulo 3)",
      resumo:
        "Contrato de locação atípico (built to suit) do Módulo 3 do Chucri Zaidan firmado com Totvs S.A., com prazo de 120 meses, aluguel mensal de R$ 1.180.000,00, reajuste anual pelo IPCA no aniversário de março e garantia por fiança bancária equivalente a 6 aluguéis.",
      destino: { categoria: "Gestão de Ativos", subpasta: "Contratos de Locação" },
      ativo: "Chucri Zaidan",
      empresa: "Patria / HGRE11",
      contraparte: "Totvs S.A.",
      documentoNumero: "CTR-2024-0187",
      dataEmissao: "2024-03-01",
      dataValidade: "2034-02-28",
      financeiro: { valorAluguel: 1180000, valorPorM2: 24.6, areaM2: 47967, valorTotal: 141600000, moeda: "BRL" },
      reajuste: {
        indice: "IPCA", periodicidade: "anual", mesAniversario: "03",
        proximaDataReajuste: "2027-03-01", ultimoReajusteAplicado: "2026-03-01", percentualUltimoReajuste: 4.62,
      },
      prazos: { dataInicio: "2024-03-01", dataFim: "2034-02-28", prazoMeses: 120, carenciaMeses: 3, proximaRevisional: "2027-03-01" },
      garantia: { tipo: "fiança bancária", valor: 7080000, validade: "2027-02-28" },
      camposAdicionais: [
        { rotulo: "Tipo de contrato", valor: "Atípico (BTS)", grupo: "Identificação" },
        { rotulo: "Unidade / Módulo", valor: "Módulo 3", grupo: "Identificação" },
        { rotulo: "Segmento do locatário", valor: "Bebidas / Consumo", grupo: "Identificação" },
        { rotulo: "Multa rescisória", valor: "Aluguéis remanescentes integrais", grupo: "Garantias" },
        { rotulo: "Step rent", valor: "Sem degrau — valor linear", grupo: "Financeiro" },
        { rotulo: "IPTU / Condomínio", valor: "Por conta do locatário", grupo: "Financeiro" },
      ],
      clausulas: [
        { titulo: "Cláusula 6 — Reajuste", resumo: "Reajuste anual pelo IPCA acumulado, aplicado no mês de aniversário (março)." },
        { titulo: "Cláusula 9 — Renúncia à revisional", resumo: "Locatário renuncia à ação revisional durante a vigência (contrato atípico)." },
        { titulo: "Cláusula 14 — Garantia", resumo: "Fiança bancária de 6 aluguéis, renovável anualmente." },
      ],
      alertas: ["Fiança bancária vence em 28/02/2027 — exigir renovação 60 dias antes.", "Reajuste IPCA de março/2027 a projetar no orçamento."],
      tags: ["atípico", "BTS", "IPCA", "logístico"],
      confianca: 88,
    };
  }
  if (n.includes("avcb") || n.includes("bombeiro")) {
    return {
      docType: "AVCB — Auto de Vistoria do Corpo de Bombeiros",
      docTypeKey: "avcb",
      nome: "AVCB — Chucri Zaidan 2026",
      resumo: "Auto de Vistoria do Corpo de Bombeiros do Chucri Zaidan, emitido em 15/01/2026 com validade até 22/05/2026, sem apontamentos pendentes de regularização.",
      destino: { categoria: "Técnico / Engenharia", subpasta: "Laudos e Inspeções" },
      ativo: "Chucri Zaidan",
      empresa: "Corpo de Bombeiros — CBMERJ",
      documentoNumero: "AVCB 2026/004512",
      dataEmissao: "2026-01-15",
      dataValidade: "2026-05-22",
      camposAdicionais: [
        { rotulo: "Ocupação/uso", valor: "Depósito — Grupo J-4", grupo: "Técnico" },
        { rotulo: "Área vistoriada", valor: "47.967 m²", grupo: "Técnico" },
        { rotulo: "Responsável técnico", valor: "Eng. Marcos Silva — CREA 512389", grupo: "Compliance" },
        { rotulo: "Apontamentos", valor: "Nenhum", grupo: "Compliance" },
      ],
      alertas: ["Validade em menos de 120 dias — iniciar processo de renovação."],
      tags: ["compliance", "bombeiros"],
      confianca: 84,
    };
  }
  return {
    docType: "Fatura de Energia Elétrica",
    docTypeKey: "fatura_utilities",
    nome: "Fatura de Energia — Chucri Zaidan — Abr/2026",
    resumo: "Fatura de energia elétrica da unidade consumidora do Chucri Zaidan referente ao consumo de abril/2026, com 184.320 kWh medidos e valor total de R$ 156.672,00, vencimento em 15/05/2026.",
    destino: { categoria: "ESG & Sustentabilidade", subpasta: "Consumo de Energia" },
    ativo: "Chucri Zaidan",
    empresa: "Light S/A",
    documentoNumero: "UC 3004512889",
    dataEmissao: "2026-04-30",
    dataValidade: "2026-05-15",
    financeiro: { valorTotal: 156672, moeda: "BRL" },
    camposAdicionais: [
      { rotulo: "Consumo medido", valor: "184.320 kWh", grupo: "Financeiro" },
      { rotulo: "Período de consumo", valor: "01/04/2026 a 30/04/2026", grupo: "Prazos" },
      { rotulo: "Modalidade tarifária", valor: "Verde A4", grupo: "Financeiro" },
      { rotulo: "Bandeira", valor: "Amarela", grupo: "Financeiro" },
    ],
    alertas: ["Consumo 8% acima do mesmo mês do ano anterior."],
    tags: ["utilities", "energia", "ESG"],
    confianca: 80,
  };
};
