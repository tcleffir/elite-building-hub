import { getHGRE11PortfolioBuildings } from "@/lib/mock-data";

export type ParcelaStatus = "pago" | "a_vencer" | "em_atraso";
export type CndStatus = "valida" | "vencida" | "impedida";

export interface IptuParcela {
  numero: number;
  vencimento: string; // dd/MM/yyyy
  valor: number;
  status: ParcelaStatus;
}

export interface IptuDebitoAnterior {
  exercicio: number;
  principal: number;
  multa: number;
  juros: number;
  correcao: number;
  dividaAtiva: boolean;
  processo?: string;
}

export interface IptuAlerta {
  tipo: "zoneamento" | "aliquota" | "valor_venal";
  titulo: string;
  detalhe: string;
  data: string;
  severidade: "alta" | "media";
}

export interface IptuAtivo {
  buildingId: string;
  building: string;
  municipio: string;
  uf: string;
  inscricao: string;
  areaConstruidaM2: number;
  areaTerrenoM2: number;
  exercicio: number;
  lancado: boolean;
  dataLancamento: string;
  valorVenal: number;
  aliquota: number;
  valorTotal: number;
  valorCotaUnica: number;
  parcelas: IptuParcela[];
  debitosAnteriores: IptuDebitoAnterior[];
  cnd: CndStatus;
  cndValidade: string;
  alertas: IptuAlerta[];
  origem: "API Prefeitura" | "Controle interno";
}

const pad = (n: number) => n.toString().padStart(2, "0");

/** Base determinística por ativo — substituível pela API da prefeitura. */
export const getIptuAtivos = (competencia: string): IptuAtivo[] => {
  const [yearStr, monthStr] = competencia.split("-");
  const exercicio = Number(yearStr);
  const mesAtual = Number(monthStr);

  return getHGRE11PortfolioBuildings().map((b, i) => {
    const areaConstruida = b.gla_m2 ?? b.total_area_m2;
    const areaTerreno = Math.round(areaConstruida * (0.28 + (i % 4) * 0.06));
    const valorVenal = Math.round(areaConstruida * (5200 + (i % 6) * 340));
    const aliquota = 1.0 + (i % 3) * 0.2;
    const valorTotal = Math.round((valorVenal * aliquota) / 100);
    const totalParcelas = 10;
    const valorParcela = Math.round(valorTotal / totalParcelas);
    const lancado = i % 11 !== 0;

    const parcelas: IptuParcela[] = Array.from({ length: totalParcelas }, (_, k) => {
      const numero = k + 1;
      const mesVenc = numero + 1; // fev..nov
      let status: ParcelaStatus;
      if (mesVenc < mesAtual) status = (i + numero) % 9 === 0 ? "em_atraso" : "pago";
      else if (mesVenc === mesAtual) status = i % 3 === 0 ? "a_vencer" : "pago";
      else status = "a_vencer";
      return {
        numero,
        vencimento: `10/${pad(mesVenc)}/${exercicio}`,
        valor: valorParcela,
        status,
      };
    });

    const temDebito = i % 4 === 0;
    const debitosAnteriores: IptuDebitoAnterior[] = temDebito
      ? [
          {
            exercicio: exercicio - 1,
            principal: Math.round(valorParcela * (1 + (i % 3))),
            multa: Math.round(valorParcela * 0.2),
            juros: Math.round(valorParcela * 0.11),
            correcao: Math.round(valorParcela * 0.06),
            dividaAtiva: i % 8 === 0,
            processo: i % 8 === 0 ? `DA ${exercicio - 1}/${1000 + i * 13}` : undefined,
          },
        ]
      : [];

    const cnd: CndStatus = debitosAnteriores.some((d) => d.dividaAtiva)
      ? "impedida"
      : temDebito
        ? "vencida"
        : "valida";

    const alertas: IptuAlerta[] = [];
    if (i % 5 === 0) {
      alertas.push({
        tipo: "valor_venal",
        titulo: "Reavaliação de valor venal",
        detalhe: `Prefeitura de ${b.city} elevou o valor venal em ${8 + (i % 5)}% para o exercício ${exercicio}.`,
        data: `15/01/${exercicio}`,
        severidade: "alta",
      });
    }
    if (i % 6 === 2) {
      alertas.push({
        tipo: "aliquota",
        titulo: "Mudança de alíquota",
        detalhe: `Alíquota ajustada de ${(aliquota - 0.2).toFixed(1)}% para ${aliquota.toFixed(1)}%.`,
        data: `02/02/${exercicio}`,
        severidade: "media",
      });
    }
    if (i % 7 === 3) {
      alertas.push({
        tipo: "zoneamento",
        titulo: "Revisão de zoneamento",
        detalhe: "Imóvel incluído em nova zona de uso misto — revisar impacto tributário.",
        data: `20/03/${exercicio}`,
        severidade: "media",
      });
    }

    return {
      buildingId: b.id,
      building: b.name,
      municipio: b.city,
      uf: b.state,
      inscricao: `${100 + i}.${(234 + i * 7).toString().padStart(3, "0")}.${(10 + i).toString().padStart(4, "0")}-${i % 10}`,
      areaConstruidaM2: areaConstruida,
      areaTerrenoM2: areaTerreno,
      exercicio,
      lancado,
      dataLancamento: lancado ? `05/01/${exercicio}` : "—",
      valorVenal,
      aliquota,
      valorTotal,
      valorCotaUnica: Math.round(valorTotal * 0.95),
      parcelas,
      debitosAnteriores,
      cnd,
      cndValidade: cnd === "valida" ? `30/${pad(Math.min(12, mesAtual + 3))}/${exercicio}` : "—",
      alertas,
      origem: i % 4 === 0 ? "Controle interno" : "API Prefeitura",
    };
  });
};

export const parcelaStatusLabel: Record<ParcelaStatus, string> = {
  pago: "Pago",
  a_vencer: "A vencer",
  em_atraso: "Em atraso",
};

export const parcelaStatusClass: Record<ParcelaStatus, string> = {
  pago: "bg-emerald-100 text-emerald-700",
  a_vencer: "bg-sky-100 text-sky-700",
  em_atraso: "bg-red-100 text-red-700",
};

export const cndLabel: Record<CndStatus, string> = {
  valida: "CND válida",
  vencida: "CND vencida",
  impedida: "CND impedida (dívida ativa)",
};

export const cndClass: Record<CndStatus, string> = {
  valida: "bg-emerald-100 text-emerald-700",
  vencida: "bg-amber-100 text-amber-700",
  impedida: "bg-red-100 text-red-700",
};

export const debitoTotal = (d: IptuDebitoAnterior) => d.principal + d.multa + d.juros + d.correcao;
