// ============================================================================
// MODELOS DE RELATÓRIO + RELATÓRIOS AGENDADOS (mock estruturado)
// ============================================================================

export type ReportModelId =
  | "mensal" | "inadimplencia" | "vencimentos" | "contratos"
  | "performance" | "executivo" | "personalizado";

export interface ReportModel {
  id: ReportModelId;
  label: string;
  description: string;
  /** Seções recomendadas (keys das seções da tela) */
  sections: string[];
}

export const REPORT_MODELS: ReportModel[] = [
  {
    id: "mensal",
    label: "Relatório Mensal de Locação",
    description: "Visão completa do mês: cadastro, contratos, financeiro e vencimentos.",
    sections: ["cadastral", "contract", "reajustes", "guarantee", "iptu", "payments", "default", "receita_contratada", "receita_realizada", "alerts"],
  },
  {
    id: "inadimplencia",
    label: "Relatório de Inadimplência",
    description: "Foco em saldos em aberto, encargos e histórico de pagamentos.",
    sections: ["cadastral", "payments", "default", "btg", "receita_realizada"],
  },
  {
    id: "vencimentos",
    label: "Relatório de Vencimentos",
    description: "Contratos, garantias e reajustes com vencimento no horizonte selecionado.",
    sections: ["contract", "guarantee", "insurance", "alerts", "reajustes_futuros", "expiracao", "renovacao"],
  },
  {
    id: "contratos",
    label: "Relatório de Contratos",
    description: "Cadastro contratual, condições especiais, reajustes e obrigações.",
    sections: ["cadastral", "contract", "notes", "reajustes", "obrigacoes", "guarantee"],
  },
  {
    id: "performance",
    label: "Relatório de Performance do Ativo",
    description: "Receita contratada e realizada, inadimplência e ocupação do ativo.",
    sections: ["contract", "receita_contratada", "receita_realizada", "default", "alerts"],
  },
  {
    id: "executivo",
    label: "Relatório Executivo",
    description: "Resumo objetivo para comitê: receita, inadimplência e vencimentos.",
    sections: ["contract", "receita_contratada", "default", "alerts", "expiracao"],
  },
  {
    id: "personalizado",
    label: "Relatório Personalizado",
    description: "Seleção livre das seções.",
    sections: [],
  },
];

export interface ScheduledReport {
  id: string;
  model: ReportModelId;
  modelLabel: string;
  escopo: string;
  periodicidade: "Mensal" | "Trimestral" | "Semanal";
  proximaGeracao: string; // YYYY-MM-DD
  destinatarios: string[];
  formato: "pdf" | "excel";
  status: "ativo" | "pausado";
}

export const mockScheduledReports: ScheduledReport[] = [
  {
    id: "sch-1", model: "mensal", modelLabel: "Relatório Mensal de Locação",
    escopo: "Sêneca", periodicidade: "Mensal", proximaGeracao: "2026-09-05",
    destinatarios: ["Gestão", "Comitê"], formato: "pdf", status: "ativo",
  },
  {
    id: "sch-2", model: "inadimplencia", modelLabel: "Relatório de Inadimplência",
    escopo: "Todos os ativos — HGRE11", periodicidade: "Mensal", proximaGeracao: "2026-09-10",
    destinatarios: ["Gestão", "Administradora"], formato: "excel", status: "ativo",
  },
  {
    id: "sch-3", model: "vencimentos", modelLabel: "Relatório de Vencimentos",
    escopo: "Chucri Zaidan", periodicidade: "Trimestral", proximaGeracao: "2026-10-01",
    destinatarios: ["Comitê"], formato: "pdf", status: "pausado",
  },
];
