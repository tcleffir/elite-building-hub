import {
  ContratoRec, CobrancaRec, StatusCobranca, AjusteMensal, EntradaBancaria,
  contratosRec, cobrancasSeed, inquilinosRec,
} from "./reconciliation-data";


// Índices simulados de reajuste acumulado nos últimos 12 meses (mock).
const indicesAcum = { IGPM: 0.057, IPCA: 0.048 };

function ymToDate(competencia: string): Date {
  const [y, m] = competencia.split('-').map(Number);
  return new Date(y, m - 1, 1);
}

/** Calcula aluguel esperado considerando reajuste, desconto, carência e revisional. */
export function calcAluguelEsperado(contrato: ContratoRec, competencia: string): number {
  const compDate = ymToDate(competencia);

  // Carência: zera.
  if (contrato.carenciaInicio && contrato.carenciaFim) {
    const ini = new Date(contrato.carenciaInicio);
    const fim = new Date(contrato.carenciaFim);
    if (compDate >= ini && compDate <= fim) return 0;
  }

  // Revisional vigente (último com dataInicio <= compDate).
  const rev = [...contrato.revisionais]
    .filter(r => new Date(r.dataInicio) <= compDate)
    .sort((a, b) => a.dataInicio.localeCompare(b.dataInicio))
    .pop();

  let base = rev ? rev.novoValor : contrato.valorAluguelBase;

  // Reajuste anual: aplica se a competência for >= aniversário do reajuste seguinte à data-base.
  const dataBase = new Date(contrato.dataBaseReajuste);
  const proxAniv = new Date(dataBase.getFullYear() + 1, dataBase.getMonth(), 1);
  if (compDate >= proxAniv && !rev) {
    base = Math.round(base * (1 + indicesAcum[contrato.indiceReajuste]));
  }

  // Desconto do mês.
  const desc = contrato.descontos.find(d => d.meses.includes(competencia));
  if (desc) base -= desc.valor;

  return Math.max(0, base);
}

/** Calcula IPTU esperado para a competência (parcela mensal dentro da janela). */
export function calcIptuEsperado(contrato: ContratoRec, competencia: string): number {
  const [, m] = competencia.split('-').map(Number);
  const primeira = contrato.iptuPrimeiraParcelaMes;
  const ultima = primeira + contrato.iptuParcelas - 1;
  if (m < primeira || m > ultima) return 0;
  return Math.round(contrato.iptuValorAnual / contrato.iptuParcelas);
}

export function calcTotalEsperado(contrato: ContratoRec, competencia: string): number {
  return calcAluguelEsperado(contrato, competencia) + calcIptuEsperado(contrato, competencia);
}

/** Computa ajustes automáticos do mês (condições especiais, descontos, crédito, inadimplência arrastada). */
export function computeAjustesAutomaticos(
  c: CobrancaRec,
  todas: CobrancaRec[],
): AjusteMensal[] {
  const contrato = contratosRec.find(x => x.id === c.contratoId);
  if (!contrato) return [];
  const ajustes: AjusteMensal[] = [];

  // Desconto pontual do contrato no mês
  const desc = contrato.descontos.find(d => d.meses.includes(c.competencia));
  if (desc) ajustes.push({
    id: `aj-desc-${c.id}`, tipo: 'desconto_negociado', origem: 'automatico',
    descricao: `Desconto contratual aplicado em ${c.competencia}`,
    valor: -desc.valor,
  });

  // Carência (já zera aluguel no engine, mas itemiza explicitamente)
  if (contrato.carenciaInicio && contrato.carenciaFim) {
    const compDate = new Date(c.competencia + '-01');
    if (compDate >= new Date(contrato.carenciaInicio) && compDate <= new Date(contrato.carenciaFim)) {
      ajustes.push({
        id: `aj-car-${c.id}`, tipo: 'condicao_especial', origem: 'automatico',
        descricao: 'Carência contratual vigente', valor: 0,
      });
    }
  }

  // Revisional vigente
  const rev = [...contrato.revisionais]
    .filter(r => new Date(r.dataInicio) <= new Date(c.competencia + '-01'))
    .sort((a, b) => a.dataInicio.localeCompare(b.dataInicio))
    .pop();
  if (rev) ajustes.push({
    id: `aj-rev-${c.id}`, tipo: 'condicao_especial', origem: 'automatico',
    descricao: `Revisional desde ${rev.dataInicio}`, valor: 0,
  });

  // Inadimplência arrastada: saldo em aberto da competência anterior
  const [y, m] = c.competencia.split('-').map(Number);
  const prevDate = new Date(y, m - 2, 1);
  const prevComp = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
  const anterior = todas.find(x => x.contratoId === c.contratoId && x.competencia === prevComp);
  if (anterior) {
    const esperadoAnt = (anterior.aluguelEsperado || 0) + (anterior.iptuEsperado || 0);
    const recebidoAnt = anterior.valorRecebido ?? 0;
    const saldo = esperadoAnt - recebidoAnt;
    if (saldo > 0.5 && (anterior.status === 'inadimplente' || anterior.status === 'aberto_cliente')) {
      ajustes.push({
        id: `aj-arr-${c.id}`, tipo: 'inadimplencia_arrastada', origem: 'automatico',
        descricao: `Saldo em aberto de ${prevComp}`, valor: saldo,
      });
    }
  }

  // Crédito antecipado
  if (c.creditoAntecipadoOrigem) {
    const origem = todas.find(x => x.id === c.creditoAntecipadoOrigem);
    const credito = origem?.valorRecebido ?? 0;
    if (credito > 0) ajustes.push({
      id: `aj-cred-${c.id}`, tipo: 'credito_antecipado', origem: 'automatico',
      descricao: `Crédito de pagamento antecipado (${origem?.competencia ?? '—'})`,
      valor: -credito,
    });
  }

  return ajustes;
}

/** Enriquece uma cobrança com esperados + ajustes automáticos. */
export function enrichCobranca(c: CobrancaRec, todas?: CobrancaRec[]): CobrancaRec {
  const contrato = contratosRec.find(x => x.id === c.contratoId)!;
  const aluguelEsperado = calcAluguelEsperado(contrato, c.competencia);
  const iptuEsperado = calcIptuEsperado(contrato, c.competencia);
  const base = aluguelEsperado + iptuEsperado;
  const auto = todas ? computeAjustesAutomaticos({ ...c, aluguelEsperado, iptuEsperado, totalEsperado: base }, todas) : [];
  const manuais = c.ajustesManuais ?? [];
  const ajustes = [...auto, ...manuais];
  const totalEsperado = base + ajustes.reduce((s, a) => s + a.valor, 0);
  return {
    ...c,
    aluguelEsperado,
    iptuEsperado,
    ajustes,
    ajustesManuais: manuais,
    totalEsperado,
  };
}


/** Diagnostica status a partir dos dados (regra: hoje = referência da competência). */
export function diagnoseStatus(c: CobrancaRec, hoje: Date = new Date('2026-04-15')): StatusCobranca {
  if (c.status === 'antecipado') return 'antecipado';
  const venc = new Date(c.dataVencimento);

  if (c.valorCobradoBoleto == null) return 'aberto_banco';
  if (Math.abs(c.valorCobradoBoleto - c.totalEsperado) > 0.5) return 'divergencia';

  if (c.valorRecebido == null || c.valorRecebido < c.totalEsperado - 0.5) {
    return hoje > venc ? 'inadimplente' : 'aberto_cliente';
  }
  return 'conciliado';
}

/** Retorna true se o inquilino tem 3+ competências consecutivas inadimplentes nos dados. */
export function isInadimplenteRecorrente(inquilinoId: string, todas: CobrancaRec[]): boolean {
  const contratosDoInq = contratosRec.filter(c => c.inquilinoId === inquilinoId).map(c => c.id);
  const minhas = todas
    .filter(c => contratosDoInq.includes(c.contratoId))
    .sort((a, b) => a.competencia.localeCompare(b.competencia));

  let streak = 0;
  let max = 0;
  for (const c of minhas) {
    if (c.status === 'inadimplente') { streak++; max = Math.max(max, streak); }
    else if (c.status === 'conciliado') streak = 0;
  }
  return max >= 3;
}

/** Diff em dias (b - a). Negativo = antecipado. */
export function diffDias(a: string | null, b: string | null): number | null {
  if (!a || !b) return null;
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

/** Agrega contagens de status por ativo. */
export function aggregateByEdificio(cobrancas: CobrancaRec[]) {
  const acc: Record<string, Record<StatusCobranca, number>> = {};
  cobrancas.forEach(c => {
    const contrato = contratosRec.find(x => x.id === c.contratoId);
    if (!contrato) return;
    const eid = contrato.edificioId;
    if (!acc[eid]) acc[eid] = {
      conciliado: 0, divergencia: 0, aberto_banco: 0, aberto_cliente: 0, inadimplente: 0, antecipado: 0,
    };
    acc[eid][c.status]++;
  });
  return acc;
}

export { cobrancasSeed };
// ===================== Vínculo de entradas bancárias =====================

export interface MatchResult {
  cobrancaId: string;
  confianca: 'alta' | 'media' | 'baixa';
  motivo: string;
}

/** Tenta casar uma entrada com uma cobrança. */
export function tryAutoMatch(
  entrada: EntradaBancaria,
  cobrancas: CobrancaRec[],
): MatchResult | null {
  // 1) Match exato por identificador de boleto
  if (entrada.identificadorBoleto) {
    const alvo = cobrancas.find(c =>
      `BOL-${c.contratoId}-${c.competencia}` === entrada.identificadorBoleto
    );
    if (alvo) return { cobrancaId: alvo.id, confianca: 'alta', motivo: 'Identificador do boleto' };
  }

  // 2) Match por valor exato + pagador (CNPJ ou nome) + janela ±10 dias do vencimento
  const candidatas = cobrancas.filter(c => {
    if (c.valorRecebido != null) return false;
    if (Math.abs((c.valorCobradoBoleto ?? c.totalEsperado) - entrada.valor) > 0.5) return false;
    const contrato = contratosRec.find(x => x.id === c.contratoId);
    if (!contrato) return false;
    const inq = inquilinosRec.find(i => i.id === contrato.inquilinoId);
    if (!inq) return false;
    if (entrada.pagadorDocumento && inq.documento === entrada.pagadorDocumento) return true;
    if (entrada.pagadorNome && inq.nome.toLowerCase().includes(entrada.pagadorNome.toLowerCase().slice(0, 6))) return true;
    return false;
  });
  if (candidatas.length === 1) {
    const c = candidatas[0];
    const venc = new Date(c.dataVencimento).getTime();
    const ent = new Date(entrada.data).getTime();
    const dias = Math.abs((ent - venc) / 86400000);
    return {
      cobrancaId: c.id,
      confianca: dias <= 10 ? 'alta' : 'media',
      motivo: `Valor + pagador (${entrada.tipo})`,
    };
  }

  // 3) Match por valor exato apenas (baixa confiança)
  const porValor = cobrancas.filter(c =>
    c.valorRecebido == null &&
    Math.abs((c.valorCobradoBoleto ?? c.totalEsperado) - entrada.valor) <= 0.5
  );
  if (porValor.length === 1) {
    return { cobrancaId: porValor[0].id, confianca: 'baixa', motivo: 'Valor exato (sem pagador)' };
  }

  return null;
}

/** Distribui o valor recebido entre as cobranças de um grupo (split proporcional ao esperado). */
export function splitGrupo(
  cobrancasDoGrupo: CobrancaRec[],
  valorRecebido: number,
): { cobrancaId: string; valor: number }[] {
  const total = cobrancasDoGrupo.reduce((s, c) => s + c.totalEsperado, 0);
  if (total <= 0) return [];
  return cobrancasDoGrupo.map(c => ({
    cobrancaId: c.id,
    valor: Math.round((c.totalEsperado / total) * valorRecebido),
  }));
}
