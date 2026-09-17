// ============================================================================
// KPI CARDS — definição, hierarquia e drill-down
// Camada de apresentação derivada do modelo relacional (kpi-engine.ts).
// ============================================================================

import {
  KpiAggregate, RelationalModel, CapexBlock, fmtBRL, fmtBRLShort, fmtM2, fmtPct,
} from "@/lib/kpi-engine";

export type KpiKey =
  | "noi" | "ocupacao" | "vacancia" | "receita_contratada" | "inadimplencia"
  | "walt" | "exposicao" | "a_vencer" | "capex" | "tir" | "contratos";

export interface KpiCardModel {
  key: KpiKey;
  label: string;
  value: string;
  unit?: string;
  sub?: string;
  description: string;
  deltaLabel: string | null;
  direction: "up" | "down" | "flat";
  positive: boolean;
  tier: "primary" | "secondary";
}

const delta = (
  atual: number, anterior: number,
  kind: "pp" | "pct" | "brl" | "abs" | "months",
  higherIsBetter = true,
): Pick<KpiCardModel, "deltaLabel" | "direction" | "positive"> => {
  if (!isFinite(anterior) || anterior === 0 && atual === 0) {
    return { deltaLabel: null, direction: "flat", positive: true };
  }
  const diff = atual - anterior;
  const dir = Math.abs(diff) < 1e-9 ? "flat" : diff > 0 ? "up" : "down";
  const abs = Math.abs(diff);
  let txt: string;
  if (kind === "pp") txt = `${abs.toFixed(1).replace(".", ",")} p.p.`;
  else if (kind === "pct") txt = `${((abs / Math.abs(anterior)) * 100).toFixed(1).replace(".", ",")}%`;
  else if (kind === "brl") txt = fmtBRLShort(abs);
  else if (kind === "months") txt = `${abs.toFixed(1).replace(".", ",")} meses`;
  else txt = abs.toLocaleString("pt-BR");
  return {
    deltaLabel: `${dir === "down" ? "↓" : dir === "up" ? "↑" : "→"} ${txt} vs. período anterior`,
    direction: dir,
    positive: dir === "flat" ? true : higherIsBetter ? diff > 0 : diff < 0,
  };
};

export function buildKpiCards(
  atual: KpiAggregate,
  anterior: KpiAggregate,
  capex: CapexBlock,
  capexAnt: CapexBlock,
  tir: { tir: number; tirAlvo: number },
  tirAnt: { tir: number },
): KpiCardModel[] {
  const expAtual = atual.exposicao[0];
  const expAnt = anterior.exposicao.find((e) => e.indice === expAtual?.indice);

  return [
    {
      key: "noi",
      label: "NOI",
      value: fmtBRLShort(atual.noi),
      unit: "/mês",
      sub: `Margem NOI ${fmtPct(atual.noiMargem)}`,
      description: "Receita líquida operacional (receita imobiliária − despesas imobiliárias).",
      ...delta(atual.noi, anterior.noi, "brl", true),
      tier: "primary",
    },
    {
      key: "ocupacao",
      label: "Ocupação",
      value: fmtPct(atual.ocupacaoPct),
      sub: atual.ocupacaoFinanceiraPct != null
        ? `Financeira ${fmtPct(atual.ocupacaoFinanceiraPct)} · ${fmtM2(atual.areaOcupada)} ocupados`
        : `${fmtM2(atual.areaOcupada)} ocupados`,
      description: "Percentual de área ocupada (física). Alternável para ocupação financeira.",
      ...delta(atual.ocupacaoPct, anterior.ocupacaoPct, "pp", true),
      tier: "primary",
    },
    {
      key: "vacancia",
      label: "Vacância",
      value: fmtPct(atual.vacanciaPct),
      sub: `${fmtM2(atual.areaVaga)} de área vaga`,
      description: "Percentual e área vaga do portfólio na competência.",
      ...delta(atual.vacanciaPct, anterior.vacanciaPct, "pp", false),
      tier: "primary",
    },
    {
      key: "receita_contratada",
      label: "Receita Contratada",
      value: fmtBRLShort(atual.receitaContratada),
      unit: "/mês",
      sub: `Anualizada ${fmtBRLShort(atual.receitaAnualizada)}`,
      description: "Receita mensal contratada dos contratos vigentes e sua anualização.",
      ...delta(atual.receitaContratada, anterior.receitaContratada, "brl", true),
      tier: "primary",
    },
    {
      key: "inadimplencia",
      label: "Inadimplência",
      value: fmtPct(atual.inadimplenciaPct),
      sub: `${fmtBRLShort(atual.inadimplenciaValor)} em aberto`,
      description: "Saldo vencido em aberto sobre a receita contratada da competência.",
      ...delta(atual.inadimplenciaPct, anterior.inadimplenciaPct, "pp", false),
      tier: "primary",
    },
    {
      key: "walt",
      label: "WALT / WALE",
      value: `${atual.walt.toFixed(1).replace(".", ",")}`,
      unit: "meses",
      sub: `${(atual.walt / 12).toFixed(1).replace(".", ",")} anos ponderados`,
      description: "Prazo médio ponderado dos contratos, considerando a receita contratada.",
      ...delta(atual.walt, anterior.walt, "months", true),
      tier: "primary",
    },
    {
      key: "exposicao",
      label: "Exposição por Índice",
      value: expAtual ? fmtPct(expAtual.pct) : "—",
      sub: expAtual ? `${expAtual.indice} — maior exposição` : "Sem contratos no escopo",
      description: "Distribuição da receita contratada por índice de reajuste.",
      ...delta(expAtual?.pct ?? 0, expAnt?.pct ?? 0, "pp", false),
      tier: "primary",
    },
    {
      key: "a_vencer",
      label: "Contratos a Vencer",
      value: `${atual.contratosAVencer12m}`,
      unit: "em 12 meses",
      sub: `${fmtBRLShort(atual.receitaAVencer12m)}/mês · ${fmtM2(atual.areaAVencer12m)}`,
      description: "Contratos com vencimento nos próximos 12 meses, receita e área associadas.",
      ...delta(atual.contratosAVencer12m, anterior.contratosAVencer12m, "abs", false),
      tier: "primary",
    },
    {
      key: "capex",
      label: "CAPEX",
      value: fmtBRLShort(capex.realizado),
      sub: `Orçado ${fmtBRLShort(capex.orcado)} · Comprometido ${fmtBRLShort(capex.comprometido)}`,
      description: "CAPEX realizado, orçado, comprometido e forecast do exercício.",
      ...delta(capex.realizado, capexAnt.realizado, "brl", true),
      tier: "secondary",
    },
    {
      key: "tir",
      label: "TIR",
      value: fmtPct(tir.tir),
      sub: `Alvo ${fmtPct(tir.tirAlvo)}`,
      description: "Taxa interna de retorno estimada do portfólio no escopo selecionado.",
      ...delta(tir.tir, tirAnt.tir, "pp", true),
      tier: "secondary",
    },
    {
      key: "contratos",
      label: "Contratos Vigentes",
      value: `${atual.contratosVigentes}`,
      sub: `${fmtM2(atual.areaOcupada)} · ${fmtBRLShort(atual.receitaContratada)}/mês`,
      description: "Quantidade de contratos vigentes, área e receita contratada.",
      ...delta(atual.contratosVigentes, anterior.contratosVigentes, "abs", true),
      tier: "secondary",
    },
  ];
}

// ─── Drill-down ─────────────────────────────────────────────────────────────

export interface DrillRow {
  cells: string[];
  assetId?: string;
  contractId?: string;
  tenant?: string;
  badge?: { label: string; tone: "critical" | "warning" | "ok" | "neutral" };
}

export interface DrillDown {
  title: string;
  summary: { label: string; value: string }[];
  columns: string[];
  rows: DrillRow[];
  distribuicoes: { title: string; items: { label: string; value: string; pct: number }[] }[];
}

const tone = (dias: number): DrillRow["badge"] =>
  dias > 90 ? { label: "Jurídico", tone: "critical" }
    : dias > 60 ? { label: ">60 dias", tone: "critical" }
      : dias > 30 ? { label: "31–60 dias", tone: "warning" }
        : { label: "Até 30 dias", tone: "neutral" };

export function buildDrillDown(
  key: KpiKey,
  model: RelationalModel,
  agg: KpiAggregate,
  capex: CapexBlock,
  tir: { tir: number; tirAlvo: number; porAtivo: { assetId: string; assetName: string; tir: number }[] },
): DrillDown {
  const share = (v: number, total: number) => (total > 0 ? (v / total) * 100 : 0);

  switch (key) {
    case "inadimplencia": {
      const rows = model.inadimplencia;
      const total = agg.inadimplenciaValor;
      const porAtivo = model.assets
        .map((a) => ({ label: a.name, raw: a.inadimplencia }))
        .filter((x) => x.raw > 0).sort((a, b) => b.raw - a.raw);
      const porLocatario = model.tenants
        .map((t) => ({ label: t.name, raw: t.inadimplencia }))
        .filter((x) => x.raw > 0).sort((a, b) => b.raw - a.raw);
      const aging = [
        { label: "Até 30 dias", raw: rows.filter((r) => r.diasAtraso <= 30).reduce((s, r) => s + r.valorAberto, 0) },
        { label: "31–60 dias", raw: rows.filter((r) => r.diasAtraso > 30 && r.diasAtraso <= 60).reduce((s, r) => s + r.valorAberto, 0) },
        { label: "61–90 dias", raw: rows.filter((r) => r.diasAtraso > 60 && r.diasAtraso <= 90).reduce((s, r) => s + r.valorAberto, 0) },
        { label: "> 90 dias", raw: rows.filter((r) => r.diasAtraso > 90).reduce((s, r) => s + r.valorAberto, 0) },
      ];
      return {
        title: "Inadimplência — detalhamento",
        summary: [
          { label: "Inadimplência total", value: fmtPct(agg.inadimplenciaPct) },
          { label: "Valor em aberto", value: fmtBRL(total) },
          { label: "Contratos afetados", value: `${rows.length}` },
          { label: "Maior atraso", value: `${Math.max(0, ...rows.map((r) => r.diasAtraso))} dias` },
        ],
        columns: ["Ativo", "Locatário", "Contrato", "Valor em atraso", "Dias em atraso", "Status"],
        rows: rows.map((r) => ({
          cells: [r.assetName, r.tenant, r.unit, fmtBRL(r.valorAberto), `${r.diasAtraso}`, ""],
          assetId: r.assetId, contractId: r.contractId, tenant: r.tenant,
          badge: tone(r.diasAtraso),
        })),
        distribuicoes: [
          { title: "Aging da inadimplência", items: aging.map((x) => ({ label: x.label, value: fmtBRL(x.raw), pct: share(x.raw, total) })) },
          { title: "Distribuição por ativo", items: porAtivo.map((x) => ({ label: x.label, value: fmtBRL(x.raw), pct: share(x.raw, total) })) },
          { title: "Distribuição por locatário", items: porLocatario.map((x) => ({ label: x.label, value: fmtBRL(x.raw), pct: share(x.raw, total) })) },
        ],
      };
    }

    case "vacancia": {
      const vagos = model.contracts.filter((c) => c.vacante && c.area > 0);
      return {
        title: "Vacância — ativos e áreas vagas",
        summary: [
          { label: "Vacância", value: fmtPct(agg.vacanciaPct) },
          { label: "Área vaga", value: fmtM2(agg.areaVaga) },
          { label: "Ativos com vacância", value: `${model.assets.filter((a) => a.areaVaga > 0).length}` },
          { label: "Receita potencial perdida", value: fmtBRL(model.assets.reduce((s, a) => s + (a.receitaPotencial - a.receitaContratada), 0)) },
        ],
        columns: ["Ativo", "Unidade", "Área vaga", "Cidade/UF", "Vacância do ativo", "Status"],
        rows: vagos.map((c) => {
          const a = model.assets.find((x) => x.id === c.assetId)!;
          return {
            cells: [c.assetName, c.unit, fmtM2(c.area), `${a.city}/${a.state}`, fmtPct(a.ocupacaoPct > 0 ? 100 - a.ocupacaoPct : 0), ""],
            assetId: c.assetId, contractId: c.id,
            badge: { label: "Disponível", tone: "warning" as const },
          };
        }),
        distribuicoes: [{
          title: "Área vaga por ativo",
          items: model.assets.filter((a) => a.areaVaga > 0).sort((a, b) => b.areaVaga - a.areaVaga)
            .map((a) => ({ label: a.name, value: fmtM2(a.areaVaga), pct: share(a.areaVaga, agg.areaVaga) })),
        }],
      };
    }

    case "ocupacao": {
      return {
        title: "Ocupação — por ativo",
        summary: [
          { label: "Ocupação física", value: fmtPct(agg.ocupacaoPct) },
          { label: "Ocupação financeira", value: agg.ocupacaoFinanceiraPct != null ? fmtPct(agg.ocupacaoFinanceiraPct) : "—" },
          { label: "Área ocupada", value: fmtM2(agg.areaOcupada) },
          { label: "Área total (GLA)", value: fmtM2(agg.areaTotal) },
        ],
        columns: ["Ativo", "GLA", "Área ocupada", "Área vaga", "Ocupação", "Status"],
        rows: model.assets.sort((a, b) => b.ocupacaoPct - a.ocupacaoPct).map((a) => ({
          cells: [a.name, fmtM2(a.areaTotal), fmtM2(a.areaOcupada), fmtM2(a.areaVaga), fmtPct(a.ocupacaoPct), ""],
          assetId: a.id,
          badge: a.ocupacaoPct >= 95 ? { label: "Saudável", tone: "ok" as const }
            : a.ocupacaoPct >= 85 ? { label: "Atenção", tone: "warning" as const }
              : { label: "Crítico", tone: "critical" as const },
        })),
        distribuicoes: [{
          title: "Área ocupada por ativo",
          items: model.assets.map((a) => ({ label: a.name, value: fmtM2(a.areaOcupada), pct: share(a.areaOcupada, agg.areaOcupada) })),
        }],
      };
    }

    case "a_vencer": {
      const rows = model.contracts.filter((c) => !c.vacante && c.mesesRestantes <= 12)
        .sort((a, b) => a.mesesRestantes - b.mesesRestantes);
      const anos = [2026, 2027, 2028];
      const buckets = anos.map((y) => ({
        label: `${y}`,
        raw: model.contracts.filter((c) => !c.vacante && c.vencimento?.startsWith(`${y}`)).reduce((s, c) => s + c.receitaMensal, 0),
      })).concat([{
        label: "2029+",
        raw: model.contracts.filter((c) => !c.vacante && c.vencimento && Number(c.vencimento.slice(0, 4)) >= 2029)
          .reduce((s, c) => s + c.receitaMensal, 0),
      }]);
      return {
        title: "Contratos a vencer — próximos 12 meses",
        summary: [
          { label: "Contratos", value: `${rows.length}` },
          { label: "Receita associada", value: `${fmtBRL(agg.receitaAVencer12m)}/mês` },
          { label: "Área associada", value: fmtM2(agg.areaAVencer12m) },
          { label: "Próximo vencimento", value: rows[0]?.vencimento ? new Date(`${rows[0].vencimento}T12:00:00`).toLocaleDateString("pt-BR") : "—" },
        ],
        columns: ["Ativo", "Locatário", "Contrato", "Área", "Receita/mês", "Vencimento"],
        rows: rows.map((c) => ({
          cells: [c.assetName, c.tenant, c.unit, fmtM2(c.area), fmtBRL(c.receitaMensal),
            c.vencimento ? new Date(`${c.vencimento}T12:00:00`).toLocaleDateString("pt-BR") : "—"],
          assetId: c.assetId, contractId: c.id, tenant: c.tenant,
          badge: c.mesesRestantes <= 6 ? { label: `${c.mesesRestantes} meses`, tone: "critical" as const }
            : { label: `${c.mesesRestantes} meses`, tone: "warning" as const },
        })),
        distribuicoes: [{
          title: "Exposição da receita por vencimento",
          items: buckets.map((b) => ({ label: b.label, value: `${fmtBRL(b.raw)}/mês`, pct: share(b.raw, agg.receitaContratada) })),
        }],
      };
    }

    case "exposicao": {
      const rows = model.contracts.filter((c) => !c.vacante).sort((a, b) => b.receitaMensal - a.receitaMensal);
      return {
        title: "Exposição por índice — contratos",
        summary: agg.exposicao.slice(0, 4).map((e) => ({ label: e.indice, value: fmtPct(e.pct) })),
        columns: ["Ativo", "Locatário", "Contrato", "Índice", "Receita/mês", "Natureza"],
        rows: rows.map((c) => ({
          cells: [c.assetName, c.tenant, c.unit, c.indice, fmtBRL(c.receitaMensal), c.natureza === "atipico" ? "Atípico" : "Típico"],
          assetId: c.assetId, contractId: c.id, tenant: c.tenant,
          badge: { label: c.indice, tone: "neutral" as const },
        })),
        distribuicoes: [{
          title: "Receita por índice de reajuste",
          items: agg.exposicao.map((e) => ({ label: e.indice, value: `${fmtBRL(e.receita)}/mês`, pct: e.pct })),
        }],
      };
    }

    case "receita_contratada": {
      const rows = model.contracts.filter((c) => !c.vacante).sort((a, b) => b.receitaMensal - a.receitaMensal);
      return {
        title: "Receita contratada — ativos e contratos",
        summary: [
          { label: "Receita mensal", value: fmtBRL(agg.receitaContratada) },
          { label: "Receita anualizada", value: fmtBRL(agg.receitaAnualizada) },
          { label: "Contratos", value: `${rows.length}` },
          { label: "R$/m² médio", value: agg.areaOcupada > 0 ? `R$ ${(agg.receitaContratada / agg.areaOcupada).toFixed(2).replace(".", ",")}` : "—" },
        ],
        columns: ["Ativo", "Locatário", "Contrato", "Área", "R$/m²", "Receita/mês"],
        rows: rows.map((c) => ({
          cells: [c.assetName, c.tenant, c.unit, fmtM2(c.area),
            `R$ ${c.precoM2.toFixed(2).replace(".", ",")}`, fmtBRL(c.receitaMensal)],
          assetId: c.assetId, contractId: c.id, tenant: c.tenant,
        })),
        distribuicoes: [
          { title: "Receita por ativo", items: model.assets.sort((a, b) => b.receitaContratada - a.receitaContratada).map((a) => ({ label: a.name, value: fmtBRL(a.receitaContratada), pct: share(a.receitaContratada, agg.receitaContratada) })) },
          { title: "Concentração por locatário", items: model.tenants.slice(0, 10).map((t) => ({ label: t.name, value: fmtBRL(t.receitaMensal), pct: share(t.receitaMensal, agg.receitaContratada) })) },
        ],
      };
    }

    case "noi": {
      return {
        title: "NOI — por ativo",
        summary: [
          { label: "NOI mensal", value: fmtBRL(agg.noi) },
          { label: "NOI anualizado", value: fmtBRL(agg.noi * 12) },
          { label: "Margem NOI", value: fmtPct(agg.noiMargem) },
          { label: "Receita imobiliária", value: fmtBRL(agg.receitaContratada) },
        ],
        columns: ["Ativo", "Receita/mês", "NOI/mês", "Margem NOI", "Ocupação", "Status"],
        rows: model.assets.sort((a, b) => b.noi - a.noi).map((a) => ({
          cells: [a.name, fmtBRL(a.receitaContratada), fmtBRL(a.noi),
            fmtPct(a.receitaContratada > 0 ? (a.noi / a.receitaContratada) * 100 : 0), fmtPct(a.ocupacaoPct), ""],
          assetId: a.id,
          badge: a.noi > 0 ? { label: "Operando", tone: "ok" as const } : { label: "Sem receita", tone: "critical" as const },
        })),
        distribuicoes: [{
          title: "NOI por ativo",
          items: model.assets.map((a) => ({ label: a.name, value: fmtBRL(a.noi), pct: share(a.noi, agg.noi) })),
        }],
      };
    }

    case "walt": {
      const rows = model.contracts.filter((c) => !c.vacante).sort((a, b) => a.mesesRestantes - b.mesesRestantes);
      return {
        title: "WALT / WALE — prazo ponderado por receita",
        summary: [
          { label: "WALT (receita)", value: `${agg.walt.toFixed(1).replace(".", ",")} meses` },
          { label: "Em anos", value: `${(agg.walt / 12).toFixed(1).replace(".", ",")} anos` },
          { label: "Contratos vigentes", value: `${agg.contratosVigentes}` },
          { label: "Receita ponderada", value: fmtBRL(agg.receitaContratada) },
        ],
        columns: ["Ativo", "Locatário", "Contrato", "Receita/mês", "Meses restantes", "Vencimento"],
        rows: rows.map((c) => ({
          cells: [c.assetName, c.tenant, c.unit, fmtBRL(c.receitaMensal), `${c.mesesRestantes}`,
            c.vencimento ? new Date(`${c.vencimento}T12:00:00`).toLocaleDateString("pt-BR") : "—"],
          assetId: c.assetId, contractId: c.id, tenant: c.tenant,
        })),
        distribuicoes: [{
          title: "WALT por ativo (meses)",
          items: model.assets.sort((a, b) => b.waltMonths - a.waltMonths)
            .map((a) => ({ label: a.name, value: `${a.waltMonths} meses`, pct: share(a.waltMonths, Math.max(1, ...model.assets.map((x) => x.waltMonths))) })),
        }],
      };
    }

    case "capex": {
      return {
        title: "CAPEX — realizado, orçado e forecast",
        summary: [
          { label: "CAPEX realizado", value: fmtBRL(capex.realizado) },
          { label: "CAPEX orçado", value: fmtBRL(capex.orcado) },
          { label: "Comprometido", value: fmtBRL(capex.comprometido) },
          { label: "Forecast", value: `${fmtBRL(capex.forecast)} (${fmtPct(capex.variacaoPct)} vs. orçamento)` },
        ],
        columns: ["Ativo", "Orçado", "Realizado", "% executado", "Saldo", "Status"],
        rows: capex.porAtivo.map((x) => {
          const pct = x.orcado > 0 ? (x.realizado / x.orcado) * 100 : 0;
          return {
            cells: [x.assetName, fmtBRL(x.orcado), fmtBRL(x.realizado), fmtPct(pct), fmtBRL(x.orcado - x.realizado), ""],
            assetId: x.assetId,
            badge: pct > 95 ? { label: "Encerrando", tone: "warning" as const } : { label: "Em execução", tone: "neutral" as const },
          };
        }),
        distribuicoes: [{
          title: "CAPEX orçado por ativo",
          items: capex.porAtivo.map((x) => ({ label: x.assetName, value: fmtBRL(x.orcado), pct: share(x.orcado, capex.orcado) })),
        }],
      };
    }

    case "tir": {
      return {
        title: "TIR — por ativo",
        summary: [
          { label: "TIR do portfólio", value: fmtPct(tir.tir) },
          { label: "TIR alvo", value: fmtPct(tir.tirAlvo) },
          { label: "Ativos acima do alvo", value: `${tir.porAtivo.filter((x) => x.tir >= tir.tirAlvo).length}` },
          { label: "Ativos abaixo do alvo", value: `${tir.porAtivo.filter((x) => x.tir < tir.tirAlvo).length}` },
        ],
        columns: ["Ativo", "TIR", "Alvo", "Gap", "NOI/mês", "Status"],
        rows: tir.porAtivo.map((x) => {
          const a = model.assets.find((m) => m.id === x.assetId);
          return {
            cells: [x.assetName, fmtPct(x.tir), fmtPct(tir.tirAlvo), fmtPct(x.tir - tir.tirAlvo), fmtBRL(a?.noi ?? 0), ""],
            assetId: x.assetId,
            badge: x.tir >= tir.tirAlvo ? { label: "Acima do alvo", tone: "ok" as const } : { label: "Abaixo do alvo", tone: "warning" as const },
          };
        }),
        distribuicoes: [],
      };
    }

    case "contratos":
    default: {
      const rows = model.contracts.filter((c) => !c.vacante);
      return {
        title: "Contratos vigentes",
        summary: [
          { label: "Contratos", value: `${rows.length}` },
          { label: "Área contratada", value: fmtM2(agg.areaOcupada) },
          { label: "Receita contratada", value: `${fmtBRL(agg.receitaContratada)}/mês` },
          { label: "Locatários", value: `${model.tenants.length}` },
        ],
        columns: ["Ativo", "Locatário", "Contrato", "Área", "Índice", "Garantia"],
        rows: rows.map((c) => ({
          cells: [c.assetName, c.tenant, c.unit, fmtM2(c.area), c.indice, c.garantia],
          assetId: c.assetId, contractId: c.id, tenant: c.tenant,
          badge: { label: c.natureza === "atipico" ? "Atípico" : "Típico", tone: "neutral" as const },
        })),
        distribuicoes: [{
          title: "Contratos por ativo",
          items: model.assets.map((a) => ({
            label: a.name,
            value: `${a.contratos.filter((c) => !c.vacante).length} contratos`,
            pct: share(a.contratos.filter((c) => !c.vacante).length, rows.length),
          })),
        }],
      };
    }
  }
}
