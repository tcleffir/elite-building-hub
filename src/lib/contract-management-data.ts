// Camada de dados para gestão manual de contratos:
// - Aditivos (extensão, alteração de área, alteração de valor)
// - Log de edição manual (auditoria)
// - Cálculo de valores vigentes a partir do contrato + aditivos + reajustes
// - Snapshot por competência (recorte mensal)

import type { TenantContract } from "@/lib/mock-data";
import { mockAlteracoesValor, type AlteracaoValor } from "@/lib/revisionais-data";
import { exportExcel } from "@/lib/export-service";

export type AditivoTipo = 'extensao_prazo' | 'alteracao_area' | 'alteracao_valor' | 'outro';

export interface Aditivo {
  id: string;
  contrato_id: string;
  numero: number; // 1º, 2º, ... aditivo
  tipo: AditivoTipo;
  data_assinatura: string; // YYYY-MM-DD
  nova_vigencia_fim?: string;
  nova_area_m2?: number;
  novo_valor?: number; // valor mensal
  novo_indice?: string;
  nova_garantia?: string;
  documento?: string; // file name
  observacao?: string;
}

export const aditivoTipoLabels: Record<AditivoTipo, string> = {
  extensao_prazo: 'Extensão de prazo',
  alteracao_area: 'Alteração de área',
  alteracao_valor: 'Alteração de valor',
  outro: 'Outro',
};

export const aditivoTipoBadgeColor: Record<AditivoTipo, string> = {
  extensao_prazo: 'bg-blue-100 text-blue-700 border-blue-200',
  alteracao_area: 'bg-purple-100 text-purple-700 border-purple-200',
  alteracao_valor: 'bg-amber-100 text-amber-700 border-amber-200',
  outro: 'bg-slate-100 text-slate-700 border-slate-200',
};

export interface LogEdicao {
  id: string;
  contrato_id: string;
  usuario: string;
  data: string; // ISO timestamp
  campos_alterados: Array<{ campo: string; antes: string; depois: string }>;
}

// ── MOCKS ──────────────────────────────────────────────────────

export const mockAditivos: Aditivo[] = [
  // tc1 — Magazine Luiza: aditivo de extensão em 2024 + alteração de área em 2025
  {
    id: 'ad1', contrato_id: 'tc1', numero: 1,
    tipo: 'extensao_prazo', data_assinatura: '2024-06-15',
    nova_vigencia_fim: '2029-03-01',
    documento: 'aditivo-1-magalu.pdf',
    observacao: 'Extensão de 24 meses no prazo original.',
  },
  {
    id: 'ad2', contrato_id: 'tc1', numero: 2,
    tipo: 'alteracao_area', data_assinatura: '2025-09-01',
    nova_area_m2: 1850,
    novo_valor: 215000,
    documento: 'aditivo-2-magalu.pdf',
    observacao: 'Expansão para o pavimento superior (+250 m²).',
  },
  // tc3 — Solistica: aditivo de extensão
  {
    id: 'ad3', contrato_id: 'tc3', numero: 1,
    tipo: 'extensao_prazo', data_assinatura: '2025-04-10',
    nova_vigencia_fim: '2028-01-01',
    documento: 'aditivo-1-solistica.pdf',
    observacao: 'Renovação antecipada por mais 36 meses.',
  },
];

export const mockLogsEdicao: LogEdicao[] = [
  {
    id: 'le1', contrato_id: 'tc1',
    usuario: 'Gestor Proprietário',
    data: '2025-09-02T14:23:00Z',
    campos_alterados: [
      { campo: 'dia_vencimento', antes: '5', depois: '10' },
    ],
  },
  {
    id: 'le2', contrato_id: 'tc2',
    usuario: 'Gestor Proprietário',
    data: '2024-11-18T10:05:00Z',
    campos_alterados: [
      { campo: 'observacoes', antes: '—', depois: 'Cliente solicitou nota fiscal eletrônica via portal.' },
    ],
  },
];

// ── HELPERS ─────────────────────────────────────────────────────

export interface EffectiveContract {
  contrato_id: string;
  area_m2: number;
  valor_mensal: number;
  valor_m2: number;
  vigencia_inicio: string;
  vigencia_fim: string | null;
  indice: string;
  garantia: string;
  vigente_em: string; // data de referência
  is_vigente: boolean;
  aditivos_aplicados: number;
  reajustes_aplicados: number;
}

/** Calcula o estado vigente do contrato em uma data de referência,
 *  aplicando todos os aditivos e alterações de valor até essa data. */
export function getEffectiveContract(
  contract: TenantContract,
  referenceDate: Date = new Date(),
  aditivos: Aditivo[] = mockAditivos,
  alteracoes: AlteracaoValor[] = mockAlteracoesValor,
): EffectiveContract {
  const refIso = referenceDate.toISOString().slice(0, 10);
  let area = contract.area_m2;
  let valor = (contract.price_per_m2 || 0) * contract.area_m2;
  let vigenciaFim = contract.contract_end || null;
  let indice: string = contract.indice_reajuste || (contract.contract_type === 'net' ? 'IGP-M' : 'IPCA');
  let garantia: string = contract.garantia || 'Sem garantia';
  const vigenciaInicio = contract.contract_start || '';

  // Aditivos cronológicos até a data de referência
  const aplicaveis = aditivos
    .filter(a => a.contrato_id === contract.id && a.data_assinatura <= refIso)
    .sort((a, b) => a.data_assinatura.localeCompare(b.data_assinatura));
  for (const a of aplicaveis) {
    if (a.nova_area_m2 != null) area = a.nova_area_m2;
    if (a.nova_vigencia_fim) vigenciaFim = a.nova_vigencia_fim;
    if (a.novo_valor != null) valor = a.novo_valor;
    if (a.novo_indice) indice = a.novo_indice;
    if (a.nova_garantia) garantia = a.nova_garantia;
  }

  // Alterações de valor (reajustes índice/negociado) até a data
  const reajustes = alteracoes
    .filter(a => a.contrato_id === contract.id && a.data <= refIso)
    .sort((a, b) => a.data.localeCompare(b.data));
  for (const r of reajustes) valor = r.valor_novo;

  const is_vigente = !!vigenciaFim
    && vigenciaInicio <= refIso
    && vigenciaFim >= refIso;

  return {
    contrato_id: contract.id,
    area_m2: area,
    valor_mensal: valor,
    valor_m2: area > 0 ? valor / area : 0,
    vigencia_inicio: vigenciaInicio,
    vigencia_fim: vigenciaFim,
    indice,
    garantia,
    vigente_em: refIso,
    is_vigente,
    aditivos_aplicados: aplicaveis.length,
    reajustes_aplicados: reajustes.length,
  };
}

// ── HISTÓRICO CONTRATUAL UNIFICADO ──────────────────────────────

export type HistoricoEventoTipo =
  | 'inicio' | 'reajuste_indice' | 'reajuste_negociado' | 'acordo_amigavel'
  | 'revisional' | 'desconto' | 'aditivo' | 'edicao_manual';

export interface HistoricoEvento {
  id: string;
  data: string; // YYYY-MM-DD ou ISO
  tipo: HistoricoEventoTipo;
  titulo: string;
  valor_anterior?: number | string;
  valor_novo?: number | string;
  percentual?: number;
  motivo?: string;
  usuario?: string;
  documento?: string;
  detalhes?: Array<{ campo: string; antes: string; depois: string }>;
}

export const historicoTipoLabels: Record<HistoricoEventoTipo, string> = {
  inicio: 'Início do contrato',
  reajuste_indice: 'Reajuste por índice',
  reajuste_negociado: 'Reajuste negociado',
  acordo_amigavel: 'Acordo amigável',
  revisional: 'Revisional',
  desconto: 'Desconto',
  aditivo: 'Aditivo',
  edicao_manual: 'Alteração manual',
};

export const historicoTipoColor: Record<HistoricoEventoTipo, string> = {
  inicio: 'bg-slate-100 text-slate-700 border-slate-200',
  reajuste_indice: 'bg-slate-50 text-slate-600 border-slate-200',
  reajuste_negociado: 'bg-amber-100 text-amber-700 border-amber-200',
  acordo_amigavel: 'bg-amber-50 text-amber-700 border-amber-200',
  revisional: 'bg-violet-100 text-violet-700 border-violet-200',
  desconto: 'bg-rose-100 text-rose-700 border-rose-200',
  aditivo: 'bg-blue-100 text-blue-700 border-blue-200',
  edicao_manual: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

/** Constrói a timeline cronológica completa do contrato (nunca sobrescreve eventos). */
export function buildHistoricoContratual(
  contract: TenantContract,
  aditivos: Aditivo[] = mockAditivos,
  alteracoes: AlteracaoValor[] = mockAlteracoesValor,
  logs: LogEdicao[] = mockLogsEdicao,
): HistoricoEvento[] {
  const eventos: HistoricoEvento[] = [];
  const valorBase = (contract.price_per_m2 || 0) * contract.area_m2;

  if (contract.contract_start) {
    eventos.push({
      id: `h-inicio-${contract.id}`,
      data: contract.contract_start,
      tipo: 'inicio',
      titulo: 'Assinatura do contrato original',
      valor_novo: valorBase,
      motivo: `${contract.area_m2.toLocaleString('pt-BR')} m² · vigência até ${contract.contract_end || '—'}`,
      documento: contract.contract_pdf_url,
    });
  }

  for (const a of alteracoes.filter(x => x.contrato_id === contract.id)) {
    const pct = a.valor_anterior > 0 ? ((a.valor_novo - a.valor_anterior) / a.valor_anterior) * 100 : undefined;
    eventos.push({
      id: `h-av-${a.id}`,
      data: a.data,
      tipo: a.tipo as HistoricoEventoTipo,
      titulo: pct != null && pct < 0 ? 'Redução de aluguel' : 'Alteração de valor de aluguel',
      valor_anterior: a.valor_anterior,
      valor_novo: a.valor_novo,
      percentual: pct,
      motivo: a.observacao,
      usuario: 'Gestor Proprietário',
    });
  }

  for (const a of aditivos.filter(x => x.contrato_id === contract.id)) {
    eventos.push({
      id: `h-ad-${a.id}`,
      data: a.data_assinatura,
      tipo: 'aditivo',
      titulo: `${a.numero}º Aditivo — ${aditivoTipoLabels[a.tipo]}`,
      valor_anterior: undefined,
      valor_novo: a.novo_valor,
      motivo: a.observacao,
      documento: a.documento,
      usuario: 'Gestor Proprietário',
      detalhes: [
        ...(a.nova_area_m2 != null ? [{ campo: 'Área', antes: `${contract.area_m2.toLocaleString('pt-BR')} m²`, depois: `${a.nova_area_m2.toLocaleString('pt-BR')} m²` }] : []),
        ...(a.nova_vigencia_fim ? [{ campo: 'Vigência fim', antes: contract.contract_end || '—', depois: a.nova_vigencia_fim }] : []),
        ...(a.novo_indice ? [{ campo: 'Índice', antes: contract.indice_reajuste || '—', depois: a.novo_indice }] : []),
        ...(a.nova_garantia ? [{ campo: 'Garantia', antes: contract.garantia || '—', depois: a.nova_garantia }] : []),
      ],
    });
  }

  for (const l of logs.filter(x => x.contrato_id === contract.id)) {
    eventos.push({
      id: `h-le-${l.id}`,
      data: l.data,
      tipo: 'edicao_manual',
      titulo: `Alteração manual (${l.campos_alterados.length} campo(s))`,
      usuario: l.usuario,
      detalhes: l.campos_alterados,
    });
  }

  return eventos.sort((a, b) => b.data.localeCompare(a.data));
}


/** Último dia do mês da competência */
export function getCompetenciaEndDate(year: number, monthZeroBased: number): Date {
  return new Date(year, monthZeroBased + 1, 0);
}

export function formatCompetencia(year: number, monthZeroBased: number): string {
  const m = String(monthZeroBased + 1).padStart(2, '0');
  return `${m}/${year}`;
}

export function getNextCompetencia(year: number, monthZeroBased: number): { year: number; month: number; label: string } {
  const next = new Date(year, monthZeroBased + 1, 1);
  return { year: next.getFullYear(), month: next.getMonth(), label: formatCompetencia(next.getFullYear(), next.getMonth()) };
}

/** Recorte: contratos vigentes ao fim da competência, com valor congelado. */
export function getSnapshotCompetencia(
  contracts: TenantContract[],
  year: number,
  monthZeroBased: number,
): Array<TenantContract & { effective: EffectiveContract }> {
  const refDate = getCompetenciaEndDate(year, monthZeroBased);
  return contracts
    .map(c => ({ ...c, effective: getEffectiveContract(c, refDate) }))
    .filter(x => x.effective.is_vigente);
}

export function exportSnapshotCSV(
  rows: Array<TenantContract & { effective: EffectiveContract }>,
  competenciaLabel: string,
  getBuildingName: (id: string) => string,
): void {
  const header = ['Competência', 'Ativo', 'Locatário', 'Unidade', 'Área (m²)', 'Valor Mensal (R$)', 'R$/m²', 'Índice', 'Garantia', 'Vigência Início', 'Vigência Fim', 'Aditivos Aplicados', 'Reajustes Aplicados'];
  const lines = rows.map(r => [
    competenciaLabel,
    getBuildingName(r.building_id),
    r.tenant_name || '',
    r.unit_id,
    r.effective.area_m2.toString(),
    r.effective.valor_mensal.toFixed(2).replace('.', ','),
    r.effective.valor_m2.toFixed(2).replace('.', ','),
    r.effective.indice,
    r.effective.garantia,
    r.effective.vigencia_inicio,
    r.effective.vigencia_fim || '',
    String(r.effective.aditivos_aplicados),
    String(r.effective.reajustes_aplicados),
  ]);
  const csv = [header, ...lines].map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `recorte-competencia-${competenciaLabel.replace('/', '-')}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Exporta o recorte imutável da competência em Excel (.xlsx) */
export function exportSnapshotExcel(
  rows: Array<TenantContract & { effective: EffectiveContract }>,
  competenciaLabel: string,
  getBuildingName: (id: string) => string,
): void {
  exportExcel({
    fileName: `recorte-competencia-${competenciaLabel.replace('/', '-')}.xlsx`,
    sheets: [{
      sheetName: `Competência ${competenciaLabel.replace('/', '-')}`,
      columns: [
        { header: 'Competência', get: () => competenciaLabel },
        { header: 'Ativo', get: (r: any) => getBuildingName(r.building_id) },
        { header: 'Locatário', get: (r: any) => r.tenant_name ?? '' },
        { header: 'Unidade', get: (r: any) => r.unit_id },
        { header: 'Área (m²)', get: (r: any) => r.effective.area_m2 },
        { header: 'Valor Mensal (R$)', get: (r: any) => r.effective.valor_mensal },
        { header: 'R$/m²', get: (r: any) => Number(r.effective.valor_m2.toFixed(2)) },
        { header: 'Índice', get: (r: any) => r.effective.indice },
        { header: 'Garantia', get: (r: any) => r.effective.garantia },
        { header: 'Vigência Início', get: (r: any) => r.effective.vigencia_inicio },
        { header: 'Vigência Fim', get: (r: any) => r.effective.vigencia_fim ?? '' },
        { header: 'Aditivos Aplicados', get: (r: any) => r.effective.aditivos_aplicados },
        { header: 'Reajustes Aplicados', get: (r: any) => r.effective.reajustes_aplicados },
      ],
      rows,
    }],
  });
}
