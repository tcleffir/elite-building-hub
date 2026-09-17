import { createContext, useContext, useState, ReactNode } from "react";

export interface Fund {
  ticker: string;
  name: string;
}

export const FUNDS: Fund[] = [
  { ticker: "VISC11", name: "Vinci Shopping Centers" },
  { ticker: "VILG11", name: "Vinci Logística" },
  { ticker: "VINO11", name: "Vinci Offices" },
  { ticker: "VIGT11", name: "Vinci Imóveis Urbanos" },
  { ticker: "VICA11", name: "Vinci Crédito Imobiliário" },
  { ticker: "VIUR11", name: "Vinci Urban Habitat" },
  { ticker: "VCRI11", name: "Vinci Crédito Imob. CRI" },
  { ticker: "VORE", name: "Vinci Offices Real Estate" },
  { ticker: "VIMO", name: "Vinci Imobiliário" },
  { ticker: "VFDL", name: "Vinci FoF Desenvolvimento Logístico" },
  { ticker: "VIOL", name: "Vinci Óleo & Logística" },
  { ticker: "MAV4F", name: "MAV IV — Feeder" },
  { ticker: "MAV4M", name: "MAV IV — Master" },
];

interface FundCtx {
  selectedFund: Fund;
  setSelectedFund: (f: Fund) => void;
}

const Ctx = createContext<FundCtx | null>(null);

export const FundProvider = ({ children }: { children: ReactNode }) => {
  const [selectedFund, setSelectedFund] = useState<Fund>(
    FUNDS.find((f) => f.ticker === "VILG11") || FUNDS[0]
  );
  return <Ctx.Provider value={{ selectedFund, setSelectedFund }}>{children}</Ctx.Provider>;
};

export const useFund = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useFund must be used within FundProvider");
  return c;
};
