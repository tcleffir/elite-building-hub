import { useEffect, useState } from "react";
import {
  mockAssets, mockMaintenances, mockAssetLogs, defaultCategoryLabels,
  type Asset, type AssetMaintenance, type AssetChangeLog,
} from "@/lib/assets-data";

const STORAGE_KEYS = {
  assets: "luxcondo:assets:v1",
  maintenances: "luxcondo:asset-maintenances:v1",
  logs: "luxcondo:asset-logs:v1",
  categories: "luxcondo:asset-categories:v1",
} as const;

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
}

export interface CategoryEntry {
  key: string;        // unique slug, e.g. "climatizacao" or "iluminacao"
  label: string;      // user-facing
  builtin?: boolean;  // built-in cannot be deleted
}

const defaultCategories: CategoryEntry[] = Object.entries(defaultCategoryLabels).map(
  ([key, label]) => ({ key, label, builtin: true })
);

export function useAssetsStore() {
  const [assets, setAssets] = useState<Asset[]>(() => load(STORAGE_KEYS.assets, mockAssets));
  const [maintenances, setMaintenances] = useState<AssetMaintenance[]>(() =>
    load(STORAGE_KEYS.maintenances, mockMaintenances)
  );
  const [logs, setLogs] = useState<AssetChangeLog[]>(() => load(STORAGE_KEYS.logs, mockAssetLogs));
  const [categories, setCategories] = useState<CategoryEntry[]>(() =>
    load(STORAGE_KEYS.categories, defaultCategories)
  );

  useEffect(() => save(STORAGE_KEYS.assets, assets), [assets]);
  useEffect(() => save(STORAGE_KEYS.maintenances, maintenances), [maintenances]);
  useEffect(() => save(STORAGE_KEYS.logs, logs), [logs]);
  useEffect(() => save(STORAGE_KEYS.categories, categories), [categories]);

  return {
    assets, setAssets,
    maintenances, setMaintenances,
    logs, setLogs,
    categories, setCategories,
  };
}

export function slugifyCategory(input: string): string {
  return input
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40) || `cat_${Date.now()}`;
}