import React, { createContext, useContext, useMemo, useState, ReactNode, useCallback } from "react";
import { toast } from "sonner";
import {
  contratosRec, inquilinosRec,
  entradasBancariasSeed, vinculosSeed, gruposSeed, creditosSeed,
  type CobrancaRec, type StatusCobranca, type SubStatus, type AcaoRegistro,
  type EntradaBancaria, type VinculoConciliacao, type GrupoCobranca,
  type AjusteMensal, type CreditoFuturo,
} from "@/lib/reconciliation-data";
import { enrichCobranca, calcAluguelEsperado, calcIptuEsperado, tryAutoMatch } from "@/lib/reconciliation-engine";
import {
  buildCobrancasIniciais, competenciaSeguinte, HOJE,
  POLITICA_PADRAO, type PoliticaEncargos, type MetodologiaInadimplencia,
} from "@/lib/finance-core";
import {
  outrosRecebimentosSeed, recalcStatus, novoIdRecebimento, novoIdParcela,
  CATEGORIA_META_PADRAO, type CategoriaConfig, type CategoriaOutroRecebimento,
  type OutroRecebimento,
} from "@/lib/other-receipts-data";
import {
  despesasSeed, CATEGORIAS_DESPESA_PADRAO, novoIdDespesa,
  type DespesaRec, type CategoriaDespesaConfig,
} from "@/lib/expenses-data";

const USUARIO = 'Gestor Proprietário';
const hojeISO = () => new Date().toISOString().slice(0, 10);

interface FinanceCtx {
  // ---- Conciliação (fonte do "recebido") ----
  cobrancas: CobrancaRec[];
  acoes: AcaoRegistro[];
  entradas: EntradaBancaria[];
  vinculos: VinculoConciliacao[];
  grupos: GrupoCobranca[];
  creditos: CreditoFuturo[];

  registrarAcao: (cobrancaId: string, tipoAcao: string, observacao?: string) => void;
  aplicarSubStatus: (cobrancaId: string, sub: NonNullable<SubStatus>, label: string, obs?: string) => void;
  prepararCobranca: (cobrancaId: string) => void;
  prepararCobrancasEmLote: (cobrancaIds: string[]) => void;
  reemitirBoleto: (cobrancaId: string) => void;
  addAjusteManual: (cobrancaId: string, ajuste: Omit<AjusteMensal, 'id' | 'origem'>) => void;
  removerAjusteManual: (cobrancaId: string, ajusteId: string) => void;
  agruparCobrancas: (cobrancaIds: string[]) => void;
  aceitarCredito: (cobrancaId: string) => void;

  addEntradas: (novas: EntradaBancaria[]) => void;
  vincularEntrada: (args: {
    entradaId: string; cobrancaId: string; valorAplicado: number;
    tipo: 'automatico' | 'manual'; modo: 'total' | 'parcial' | 'antecipado';
  }) => void;
  autoMatchTudo: () => void;
  classificarComoOutroRecebimento: (
    entradaId: string,
    dados: { categoria: CategoriaOutroRecebimento; fundoId?: string | null; edificioId?: string | null; contratoId?: string | null; locatarioId?: string | null; descricao: string },
  ) => void;

  // ---- Outros recebimentos ----
  outros: OutroRecebimento[];
  setOutros: React.Dispatch<React.SetStateAction<OutroRecebimento[]>>;
  categoriaConfig: Record<CategoriaOutroRecebimento, CategoriaConfig>;
  updateCategoriaConfig: (cat: CategoriaOutroRecebimento, patch: Partial<CategoriaConfig>) => void;

  // ---- Despesas ----
  despesas: DespesaRec[];
  setDespesas: React.Dispatch<React.SetStateAction<DespesaRec[]>>;
  categoriasDespesa: CategoriaDespesaConfig[];
  addCategoriaDespesa: (label: string) => void;
  removeCategoriaDespesa: (id: string) => void;
  importarDespesas: (rows: DespesaRec[]) => void;

  // ---- Parâmetros compartilhados ----
  politica: PoliticaEncargos;
  setPolitica: (p: PoliticaEncargos) => void;
  metodologiaInad: MetodologiaInadimplencia;
  setMetodologiaInad: (m: MetodologiaInadimplencia) => void;
}

const Ctx = createContext<FinanceCtx | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [cobrancas, setCobrancas] = useState<CobrancaRec[]>(buildCobrancasIniciais);
  const [acoes, setAcoes] = useState<AcaoRegistro[]>([]);
  const [entradas, setEntradas] = useState<EntradaBancaria[]>(entradasBancariasSeed);
  const [vinculos, setVinculos] = useState<VinculoConciliacao[]>(vinculosSeed);
  const [grupos, setGrupos] = useState<GrupoCobranca[]>(gruposSeed);
  const [creditos, setCreditos] = useState<CreditoFuturo[]>(creditosSeed);

  const [outros, setOutros] = useState<OutroRecebimento[]>(outrosRecebimentosSeed);
  const [categoriaConfig, setCategoriaConfig] =
    useState<Record<CategoriaOutroRecebimento, CategoriaConfig>>({ ...CATEGORIA_META_PADRAO });

  const [despesas, setDespesas] = useState<DespesaRec[]>(despesasSeed);
  const [categoriasDespesa, setCategoriasDespesa] = useState<CategoriaDespesaConfig[]>(CATEGORIAS_DESPESA_PADRAO);

  const [politica, setPolitica] = useState<PoliticaEncargos>(POLITICA_PADRAO);
  const [metodologiaInad, setMetodologiaInad] =
    useState<MetodologiaInadimplencia>('aberto_vencido_sobre_esperado');

  /** Reenriquece toda a lista para manter esperado/ajustes consistentes. */
  const reenrich = (list: CobrancaRec[]) => list.map(c => enrichCobranca(c, list));

  const registrarAcao = useCallback((cobrancaId: string, tipoAcao: string, observacao?: string) => {
    setAcoes(prev => [...prev, {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      cobrancaId, tipoAcao, responsavel: USUARIO, data: hojeISO(), observacao,
    }]);
  }, []);

  const aplicarSubStatus = useCallback((cobrancaId: string, sub: NonNullable<SubStatus>, label: string, obs?: string) => {
    setCobrancas(prev => reenrich(prev.map(c => c.id === cobrancaId ? { ...c, subStatus: sub } : c)));
    registrarAcao(cobrancaId, label, obs);
    toast.success(`${label} — registrado`);
  }, [registrarAcao]);

  /** Preparar cobrança: valida esperado, gera identificador único e registra competência. */
  const prepararCobranca = useCallback((cobrancaId: string) => {
    setCobrancas(prev => {
      const alvo = prev.find(c => c.id === cobrancaId);
      if (!alvo) return prev;
      if (alvo.totalEsperado <= 0) {
        toast.error('Valor esperado inválido para esta competência — cobrança não preparada.');
        return prev;
      }
      const ident = alvo.identificadorCobranca
        ?? `COB-${alvo.contratoId.toUpperCase()}-${alvo.competencia.replace('-', '')}-${String(Date.now()).slice(-4)}`;
      const next = prev.map(c => c.id !== cobrancaId ? c : {
        ...c,
        identificadorCobranca: ident,
        cobrancaPreparadaEm: hojeISO(),
        valorCobradoBoleto: c.totalEsperado,
        subStatus: 'cobranca_preparada' as NonNullable<SubStatus>,
      });
      toast.success(`Cobrança preparada — ${ident}`);
      return reenrich(next);
    });
    registrarAcao(cobrancaId, 'Preparar cobrança');
  }, [registrarAcao]);

  const prepararCobrancasEmLote = useCallback((ids: string[]) => {
    setCobrancas(prev => {
      let n = 0;
      const next = prev.map(c => {
        if (!ids.includes(c.id) || c.totalEsperado <= 0) return c;
        n++;
        return {
          ...c,
          identificadorCobranca: c.identificadorCobranca
            ?? `COB-${c.contratoId.toUpperCase()}-${c.competencia.replace('-', '')}-${String(Date.now()).slice(-4)}${n}`,
          cobrancaPreparadaEm: hojeISO(),
          valorCobradoBoleto: c.totalEsperado,
          subStatus: 'cobranca_preparada' as NonNullable<SubStatus>,
        };
      });
      toast.success(`${n} cobrança(s) preparada(s).`);
      return reenrich(next);
    });
  }, []);

  const reemitirBoleto = useCallback((cobrancaId: string) => {
    setCobrancas(prev => reenrich(prev.map(c =>
      c.id === cobrancaId ? { ...c, valorCobradoBoleto: c.totalEsperado } : c
    )));
    registrarAcao(cobrancaId, 'Corrigir cobrança para o valor esperado');
    toast.success('Cobrança corrigida com o valor esperado.');
  }, [registrarAcao]);

  const addAjusteManual = useCallback((cobrancaId: string, ajuste: Omit<AjusteMensal, 'id' | 'origem'>) => {
    setCobrancas(prev => reenrich(prev.map(c => c.id !== cobrancaId ? c : {
      ...c,
      ajustesManuais: [...(c.ajustesManuais ?? []), { ...ajuste, id: `aj-man-${Date.now()}`, origem: 'manual' as const }],
    })));
    registrarAcao(cobrancaId, `Ajuste manual: ${ajuste.descricao}`,
      `${ajuste.tipo} ${ajuste.valor >= 0 ? '+' : ''}${ajuste.valor}`);
    toast.success('Ajuste manual adicionado.');
  }, [registrarAcao]);

  const removerAjusteManual = useCallback((cobrancaId: string, ajusteId: string) => {
    setCobrancas(prev => reenrich(prev.map(c => c.id !== cobrancaId ? c : {
      ...c, ajustesManuais: (c.ajustesManuais ?? []).filter(a => a.id !== ajusteId),
    })));
    toast.success('Ajuste manual removido.');
  }, []);

  const agruparCobrancas = useCallback((cobrancaIds: string[]) => {
    if (cobrancaIds.length < 2) { toast.error('Selecione pelo menos 2 cobranças.'); return; }
    setCobrancas(prev => {
      const sel = prev.filter(c => cobrancaIds.includes(c.id));
      const inqIds = new Set(sel.map(c => contratosRec.find(x => x.id === c.contratoId)!.inquilinoId));
      const comps = new Set(sel.map(c => c.competencia));
      if (inqIds.size !== 1 || comps.size !== 1) {
        toast.error('Só é possível agrupar cobranças do mesmo locatário na mesma competência.');
        return prev;
      }
      const grupoId = `gr-${Date.now()}`;
      const grupo: GrupoCobranca = {
        id: grupoId,
        inquilinoId: [...inqIds][0],
        competencia: [...comps][0],
        cobrancaIds,
        identificadorBoleto: `COB-GRP-${grupoId.slice(-6)}`,
      };
      setGrupos(g => [...g, grupo]);
      toast.success(`${cobrancaIds.length} cobranças consolidadas em ${grupo.identificadorBoleto}.`);
      return reenrich(prev.map(c => cobrancaIds.includes(c.id) ? { ...c, grupoId } : c));
    });
  }, []);

  /** Cria crédito futuro atrelado ao locatário/contrato. */
  const criarCredito = useCallback((c: CobrancaRec, valor: number, entradaId?: string) => {
    const ct = contratosRec.find(x => x.id === c.contratoId);
    if (!ct || valor <= 0.5) return;
    setCreditos(prev => [...prev, {
      id: `cr-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      contratoId: c.contratoId,
      inquilinoId: ct.inquilinoId,
      origemEntradaId: entradaId ?? null,
      origemCobrancaId: c.id,
      competenciaOrigem: c.competencia,
      valor, valorUtilizado: 0,
      criadoEm: hojeISO(), responsavel: USUARIO,
    }]);
  }, []);

  /** Aceitar crédito: leva o excedente/antecipado para a competência seguinte. */
  const aceitarCredito = useCallback((cobrancaId: string) => {
    setCobrancas(prev => {
      const atual = prev.find(c => c.id === cobrancaId);
      if (!atual) return prev;
      const nextComp = competenciaSeguinte(atual.competencia);
      const contrato = contratosRec.find(x => x.id === atual.contratoId)!;
      const aluguelEsp = calcAluguelEsperado(contrato, nextComp);
      const iptuEsp = calcIptuEsperado(contrato, nextComp);
      const totalEsp = aluguelEsp + iptuEsp;
      const creditoDisp = atual.valorRecebido ?? atual.valorCobradoBoleto ?? 0;
      const bate = totalEsp > 0 && creditoDisp >= totalEsp - 0.5;
      const idx = prev.findIndex(c => c.contratoId === atual.contratoId && c.competencia === nextComp);
      const [ny, nm] = nextComp.split('-').map(Number);
      const venc = new Date(ny, nm - 1, contrato.diaVencimento).toISOString().slice(0, 10);
      const emit = new Date(ny, nm - 1, Math.max(1, contrato.diaVencimento - 4)).toISOString().slice(0, 10);
      const merged: CobrancaRec = {
        id: `${atual.contratoId}-${nextComp}`,
        contratoId: atual.contratoId,
        competencia: nextComp,
        aluguelEsperado: aluguelEsp,
        iptuEsperado: iptuEsp,
        totalEsperado: totalEsp,
        valorCobradoBoleto: bate ? totalEsp : (idx >= 0 ? prev[idx].valorCobradoBoleto : null),
        valorRecebido: bate ? totalEsp : (idx >= 0 ? prev[idx].valorRecebido : null),
        status: bate ? 'conciliado' : (idx >= 0 ? prev[idx].status : 'aberto_banco'),
        subStatus: idx >= 0 ? prev[idx].subStatus : null,
        creditoAntecipadoOrigem: atual.id,
        identificadorCobranca: idx >= 0 ? prev[idx].identificadorCobranca : null,
        cobrancaPreparadaEm: idx >= 0 ? prev[idx].cobrancaPreparadaEm : null,
        dataCobrancaBancoEsperada: idx >= 0 ? prev[idx].dataCobrancaBancoEsperada : emit,
        dataEnvioBancoEfetiva: idx >= 0 ? prev[idx].dataEnvioBancoEfetiva : null,
        dataVencimento: idx >= 0 ? prev[idx].dataVencimento : venc,
        dataPagamentoEfetiva: bate ? (atual.dataPagamentoEfetiva ?? null) : (idx >= 0 ? prev[idx].dataPagamentoEfetiva : null),
      };
      const next = [...prev];
      if (idx >= 0) next[idx] = merged; else next.push(merged);
      const marcado = next.map(c => c.id === cobrancaId ? { ...c, subStatus: 'credito_aceito' as NonNullable<SubStatus> } : c);
      toast.success(bate
        ? `Crédito aceito — ${nextComp} conciliado automaticamente.`
        : `Crédito aceito — registrado para ${nextComp}.`);
      return reenrich(marcado);
    });
    registrarAcao(cobrancaId, 'Aceitar crédito (abate competência seguinte)');
  }, [registrarAcao]);

  const addEntradas = useCallback((novas: EntradaBancaria[]) => {
    setEntradas(prev => [...prev, ...novas]);
  }, []);

  const vincularEntrada = useCallback(({ entradaId, cobrancaId, valorAplicado, tipo, modo }: {
    entradaId: string; cobrancaId: string; valorAplicado: number;
    tipo: 'automatico' | 'manual'; modo: 'total' | 'parcial' | 'antecipado';
  }) => {
    setVinculos(prev => [...prev, {
      id: `v-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      entradaId, cobrancaId, valorAplicado, tipoMatch: tipo,
      responsavel: USUARIO, data: hojeISO(),
    }]);
    setCobrancas(prev => {
      const next = prev.map(c => {
        if (c.id !== cobrancaId) return c;
        const ent = entradas.find(e => e.id === entradaId);
        const aplicado = modo === 'antecipado' ? Math.min(valorAplicado, c.totalEsperado) : valorAplicado;
        const novoRecebido = (c.valorRecebido ?? 0) + aplicado;
        return {
          ...c,
          valorRecebido: novoRecebido,
          dataPagamentoEfetiva: c.dataPagamentoEfetiva ?? ent?.data ?? null,
          status: novoRecebido >= c.totalEsperado - 0.5 ? 'conciliado' as StatusCobranca : c.status,
        };
      });
      // Excedente vira crédito futuro atrelado ao locatário/contrato.
      if (modo === 'antecipado') {
        const alvo = prev.find(c => c.id === cobrancaId);
        if (alvo) {
          const excedente = valorAplicado - Math.max(0, alvo.totalEsperado - (alvo.valorRecebido ?? 0));
          if (excedente > 0.5) criarCredito(alvo, excedente, entradaId);
        }
      }
      return reenrich(next);
    });
    const msg = modo === 'parcial'
      ? 'Pagamento parcial conciliado — saldo permanece em aberto.'
      : modo === 'antecipado'
        ? 'Competência conciliada e excedente registrado como crédito futuro.'
        : `Vínculo ${tipo === 'manual' ? 'manual' : 'automático'} registrado.`;
    toast.success(msg);
  }, [entradas, criarCredito]);

  const autoMatchTudo = useCallback(() => {
    const naoVinculadas = entradas.filter(e => !vinculos.some(v => v.entradaId === e.id));
    let casadas = 0;
    for (const ent of naoVinculadas) {
      const m = tryAutoMatch(ent, cobrancas);
      if (m && m.confianca !== 'baixa') {
        vincularEntrada({ entradaId: ent.id, cobrancaId: m.cobrancaId, valorAplicado: ent.valor, tipo: 'automatico', modo: 'total' });
        casadas++;
      }
    }
    if (casadas === 0) toast.info('Nenhuma entrada com casamento confiável encontrada.');
  }, [entradas, vinculos, cobrancas, vincularEntrada]);

  /** Move uma entrada bancária não identificada para Outros Recebimentos. */
  const classificarComoOutroRecebimento = useCallback((entradaId: string, dados: {
    categoria: CategoriaOutroRecebimento; fundoId?: string | null; edificioId?: string | null;
    contratoId?: string | null; locatarioId?: string | null; descricao: string;
  }) => {
    const ent = entradas.find(e => e.id === entradaId);
    if (!ent) return;
    const id = novoIdRecebimento();
    const novo: OutroRecebimento = {
      id,
      categoria: dados.categoria,
      valorTotal: ent.valor,
      parcelado: false,
      numParcelas: 1,
      fundoId: dados.fundoId ?? null,
      edificioId: dados.edificioId ?? null,
      unidadeId: null,
      contratoId: dados.contratoId ?? null,
      locatarioId: dados.locatarioId ?? null,
      contraparteNome: ent.pagadorNome ?? null,
      descricao: dados.descricao || ent.descricaoExtrato,
      observacao: `Originado da entrada bancária ${ent.id} (${ent.tipo}).`,
      status: 'recebido',
      origem: 'conciliacao',
      criadoEm: new Date().toISOString(),
      parcelas: [{
        id: novoIdParcela(), outroRecebimentoId: id, numero: 1,
        valor: ent.valor, vencimento: ent.data, status: 'recebido', entradaId: ent.id,
      }],
      audit: [{ id: 'a1', acao: 'classificado_na_conciliacao', usuario: USUARIO, data: new Date().toISOString() }],
    };
    setOutros(prev => [novo, ...prev]);
    setVinculos(prev => [...prev, {
      id: `v-or-${Date.now()}`, entradaId, cobrancaId: `outro:${id}`,
      valorAplicado: ent.valor, tipoMatch: 'manual', responsavel: USUARIO, data: hojeISO(),
    }]);
    toast.success('Entrada transferida para Outros Recebimentos.');
  }, [entradas]);

  const updateCategoriaConfig = useCallback((cat: CategoriaOutroRecebimento, patch: Partial<CategoriaConfig>) => {
    setCategoriaConfig(prev => ({ ...prev, [cat]: { ...prev[cat], ...patch } }));
  }, []);

  const addCategoriaDespesa = useCallback((label: string) => {
    const id = label.toLowerCase().normalize('NFD').replace(/[^\w]+/g, '_');
    setCategoriasDespesa(prev => prev.some(c => c.id === id) ? prev
      : [...prev, { id, label, cls: 'bg-slate-100 text-slate-700' }]);
  }, []);
  const removeCategoriaDespesa = useCallback((id: string) => {
    setCategoriasDespesa(prev => prev.filter(c => c.id !== id));
  }, []);

  const importarDespesas = useCallback((rows: DespesaRec[]) => {
    setDespesas(prev => [...rows, ...prev]);
    toast.success(`${rows.length} despesa(s) importada(s).`);
  }, []);

  const value = useMemo<FinanceCtx>(() => ({
    cobrancas, acoes, entradas, vinculos, grupos, creditos,
    registrarAcao, aplicarSubStatus, prepararCobranca, prepararCobrancasEmLote,
    reemitirBoleto, addAjusteManual, removerAjusteManual, agruparCobrancas, aceitarCredito,
    addEntradas, vincularEntrada, autoMatchTudo, classificarComoOutroRecebimento,
    outros, setOutros, categoriaConfig, updateCategoriaConfig,
    despesas, setDespesas, categoriasDespesa, addCategoriaDespesa, removeCategoriaDespesa, importarDespesas,
    politica, setPolitica, metodologiaInad, setMetodologiaInad,
  }), [
    cobrancas, acoes, entradas, vinculos, grupos, creditos,
    registrarAcao, aplicarSubStatus, prepararCobranca, prepararCobrancasEmLote,
    reemitirBoleto, addAjusteManual, removerAjusteManual, agruparCobrancas, aceitarCredito,
    addEntradas, vincularEntrada, autoMatchTudo, classificarComoOutroRecebimento,
    outros, categoriaConfig, updateCategoriaConfig,
    despesas, categoriasDespesa, addCategoriaDespesa, removeCategoriaDespesa, importarDespesas,
    politica, metodologiaInad,
  ]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFinance() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useFinance must be used within FinanceProvider');
  return c;
}

export { HOJE, inquilinosRec };
