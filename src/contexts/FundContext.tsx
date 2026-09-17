import { createContext, useContext, useState, ReactNode } from "react";

export interface FundFundamentals {
  cnpj: string;
  gestor: string;
  administrador: string;
  taxaGestao: string;
  tipoAnbima: string;
  patrimonioLiquido: number;   // R$
  cotasEmitidas: number;
  vpPorCota: number;           // R$ / cota
  ablTotal: number;            // m²
  numAtivos: number;
  vacanciaFisica: number;      // %
  aluguelMedioM2: number;      // R$/m²
  valorPatrimonialM2: number;  // R$/m²
  waleAnos: number;
  dividendYield: number;       // % a.a.
}

export interface Fund {
  ticker: string;
  name: string;
  segment?: "tijolo" | "papel";
  fundamentals?: FundFundamentals;
}

export const FUNDS: Fund[] = [
  // ─── Tijolo ───
  {
    ticker: "HGRE11",
    name: "Patria Escritórios FII",
    segment: "tijolo",
    fundamentals: {
      cnpj: "09.072.017/0001-29",
      gestor: "Patria Investimentos",
      administrador: "Banco Genial S.A.",
      taxaGestao: "1,00% a.a.",
      tipoAnbima: "Tijolo — Renda — Gestão Ativa",
      patrimonioLiquido: 1466386050,
      cotasEmitidas: 11817767,
      vpPorCota: 124.08,
      ablTotal: 143387,
      numAtivos: 13,
      vacanciaFisica: 6.6,
      aluguelMedioM2: 78.94,
      valorPatrimonialM2: 7738,
      waleAnos: 4.6,
      dividendYield: 8.6,
    },
  },
  { ticker: "HGLG11", name: "Patria Log FII", segment: "tijolo" },
  { ticker: "HGPO11", name: "Patria Prime Offices FII", segment: "tijolo" },
  { ticker: "HGRU11", name: "Patria Renda Urbana FII", segment: "tijolo" },
  { ticker: "BLCA11", name: "Bluecap Renda Corporativa FII", segment: "tijolo" },
  { ticker: "BLMO11", name: "Bluemacaw Office FII", segment: "tijolo" },
  { ticker: "CBOP11", name: "Castello Branco Office Park FII", segment: "tijolo" },
  { ticker: "CENU11", name: "Centro Têxtil Internacional FII", segment: "tijolo" },
  { ticker: "LVBI11", name: "VBI Logístico FII", segment: "tijolo" },
  { ticker: "PATC11", name: "Patria Corporate Offices FII", segment: "tijolo" },
  { ticker: "PATL11", name: "Patria Logística FII", segment: "tijolo" },
  { ticker: "PLAG11", name: "Patria Agro FII", segment: "tijolo" },
  { ticker: "PMLL11", name: "Patria Malls FII", segment: "tijolo" },
  { ticker: "PVBI11", name: "VBI Prime Properties FII", segment: "tijolo" },
  // ─── Papel ───
  { ticker: "HGCR11", name: "Patria Recebíveis Imobiliários FII", segment: "papel" },
  { ticker: "AVBI11", name: "VBI Alpha Recebíveis FII", segment: "papel" },
  { ticker: "MVBI11", name: "VBI Multiestratégia FII", segment: "papel" },
  { ticker: "PCIP11", name: "Patria Crédito Imobiliário Plus FII", segment: "papel" },
  { ticker: "PSEC11", name: "Patria Securities FII", segment: "papel" },
  { ticker: "RBRR11", name: "RBR Rendimento High Grade FII", segment: "papel" },
  { ticker: "RBRX11", name: "RBR Crédito Imobiliário Estruturado FII", segment: "papel" },
  { ticker: "RBRY11", name: "RBR Crédito Imobiliário FII", segment: "papel" },
  { ticker: "RCFF11", name: "RB Capital Fundo de Fundos FII", segment: "papel" },
  { ticker: "ROPP11", name: "Riza Opportunity FII", segment: "papel" },
  { ticker: "RPRI11", name: "RBR Private Credit FII", segment: "papel" },
  { ticker: "VCJR11", name: "Vectis Juros Real FII", segment: "papel" },
];

interface FundCtx {
  selectedFund: Fund;
  setSelectedFund: (f: Fund) => void;
}

const Ctx = createContext<FundCtx | null>(null);

export const FundProvider = ({ children }: { children: ReactNode }) => {
  const [selectedFund, setSelectedFund] = useState<Fund>(
    FUNDS.find((f) => f.ticker === "HGRE11") || FUNDS[0]
  );
  return <Ctx.Provider value={{ selectedFund, setSelectedFund }}>{children}</Ctx.Provider>;
};

export const useFund = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useFund must be used within FundProvider");
  return c;
};
