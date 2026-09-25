import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import type { Building } from "@/lib/mock-data";
import {
  PortfolioContext,
  loadPortfolioState,
  savePortfolioState,
  type PortfolioBuildingExtra,
  type PortfolioContract,
  type PortfolioState,
  type PortfolioStore,
  type PortfolioTenant,
  type PortfolioUnit,
} from "@/lib/portfolio-store";

const EXTRA_BUILDINGS_KEY = "patria:portfolio-extra-buildings:v1";

function loadExtraBuildings(): Building[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(EXTRA_BUILDINGS_KEY) || "[]") as Building[];
  } catch {
    return [];
  }
}

export const PortfolioProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<PortfolioState>(() => loadPortfolioState());
  const [extraBuildings, setExtraBuildings] = useState<Building[]>(() => loadExtraBuildings());

  useEffect(() => savePortfolioState(state), [state]);
  useEffect(() => {
    try { window.localStorage.setItem(EXTRA_BUILDINGS_KEY, JSON.stringify(extraBuildings)); } catch { /* quota */ }
  }, [extraBuildings]);

  const addTenant = useCallback((t: PortfolioTenant) => {
    setState((prev) => ({ ...prev, tenants: [...prev.tenants.filter((x) => x.id !== t.id), t] }));
  }, []);

  const addContract = useCallback((c: PortfolioContract) => {
    setState((prev) => ({ ...prev, contracts: [...prev.contracts.filter((x) => x.id !== c.id), c] }));
  }, []);

  const addUnit = useCallback((u: PortfolioUnit) => {
    setState((prev) => ({ ...prev, units: [...prev.units.filter((x) => x.id !== u.id), u] }));
  }, []);

  const addBuilding = useCallback((b: Building, extra: PortfolioBuildingExtra, units: PortfolioUnit[]) => {
    setExtraBuildings((prev) => [...prev.filter((x) => x.id !== b.id), b]);
    setState((prev) => ({
      ...prev,
      extras: [...prev.extras.filter((x) => x.buildingId !== extra.buildingId), extra],
      units: [...prev.units.filter((u) => u.buildingId !== extra.buildingId), ...units],
    }));
  }, []);

  const updateContract = useCallback((id: string, patch: Partial<PortfolioContract>) => {
    setState((prev) => ({
      ...prev,
      contracts: prev.contracts.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  }, []);

  const setContractStatus = useCallback((id: string, status: PortfolioContract["status"]) => {
    setState((prev) => ({
      ...prev,
      contracts: prev.contracts.map((c) => (c.id === id ? { ...c, status } : c)),
    }));
  }, []);

  const value = useMemo<PortfolioStore>(() => ({
    ...state,
    extraBuildings,
    addTenant,
    addContract,
    addUnit,
    addBuilding,
    updateContract,
    setContractStatus,
  }), [state, extraBuildings, addTenant, addContract, addUnit, addBuilding, updateContract, setContractStatus]);

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
};
