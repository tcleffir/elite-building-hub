// ============================================================================
// REPORT BASKET — ponte KPI → Relatórios
// Guarda os detalhamentos de KPI que o usuário quer incorporar a um relatório.
// Persistido em localStorage para sobreviver à navegação entre as telas.
// ============================================================================

export interface ReportBasketItem {
  id: string;
  kpi: string;
  label: string;
  escopo: string;
  competencia: string;
  resumo: string;
  addedAt: string;
  relatorioId?: string | null;
  relatorioNome?: string | null;
}

const KEY = "vinci.report-basket.v1";

const read = (): ReportBasketItem[] => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ReportBasketItem[]) : [];
  } catch {
    return [];
  }
};

const write = (items: ReportBasketItem[]) => {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("report-basket-changed"));
};

export const listBasket = read;

export const addToBasket = (item: Omit<ReportBasketItem, "id" | "addedAt">) => {
  const items = read();
  const novo: ReportBasketItem = {
    ...item,
    id: `rb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    addedAt: new Date().toISOString(),
  };
  write([novo, ...items]);
  return novo;
};

export const removeFromBasket = (id: string) => write(read().filter((i) => i.id !== id));
export const clearBasket = () => write([]);

export const subscribeBasket = (cb: () => void) => {
  window.addEventListener("report-basket-changed", cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener("report-basket-changed", cb);
    window.removeEventListener("storage", cb);
  };
};
