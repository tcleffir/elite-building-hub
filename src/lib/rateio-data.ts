import { mockContracts } from './mock-data';
import { seedMeters, type MeterType } from './telemetry-data';

// ─── Types ────────────────────────────────────────────
export type UtilityType = 'energy' | 'water' | 'gas';
export type RateioMethod = 'individual' | 'ideal_fraction' | 'simple' | 'solar_credit';
export type RateioStatus = 'draft' | 'confirmed' | 'closed' | 'reopened';
export type ReadingSource = 'telemetry' | 'manual';

export interface RateioConfig {
  id: string;
  buildingId: string;
  utilityType: UtilityType;
  defaultMethod: RateioMethod;
  tariffValue: number;
  tariffSince: string;
  alertVariancePct: number;
  alertDueDay: number;
  updatedBy: string;
  updatedAt: string;
}

export interface RateioItem {
  id: string;
  rateioId: string;
  tenantId: string;
  tenantName: string;
  floors: number[];
  areaM2: number;
  attributedValue: number;
  participationPct: number;
  calculatedAmountBrl: number;
  meterReading?: number;
  solarCreditUsed?: number;
  variationVsPrev?: number;
}

export interface ConsumptionRateio {
  id: string;
  buildingId: string;
  periodMonth: number;
  periodYear: number;
  utilityType: UtilityType;
  method: RateioMethod;
  totalBuildingValue: number;
  totalBuildingUnit: string;
  tariffValue: number;
  status: RateioStatus;
  confirmedBy?: string;
  confirmedAt?: string;
  readingSource: ReadingSource;
  manualOverrideJustification?: string;
  items: RateioItem[];
  createdAt: string;
}

export interface TariffHistory {
  date: string;
  value: number;
}

// ─── Helpers ──────────────────────────────────────────
export const utilityConfig: Record<UtilityType, { icon: string; label: string; unit: string; color: string }> = {
  energy: { icon: '⚡', label: 'Energia', unit: 'kWh', color: 'hsl(var(--interactive))' },
  water: { icon: '💧', label: 'Água', unit: 'm³', color: 'hsl(var(--operational))' },
  gas: { icon: '🔥', label: 'Gás', unit: 'm³', color: 'hsl(var(--destructive))' },
};

export const methodConfig: Record<RateioMethod, { name: string; badge: string; desc: string }> = {
  individual: { name: 'Medição Individualizada', badge: 'Mais Justo', desc: 'Cada unidade paga pelo que consumiu, com base em medidores individuais.' },
  ideal_fraction: { name: 'Fração Ideal (Área)', badge: 'Áreas Comuns', desc: 'Despesas divididas proporcionalmente à área (m²) de cada unidade.' },
  simple: { name: 'Rateio Simples', badge: 'Igualitário', desc: 'Despesa total dividida igualmente entre todos os locatários.' },
  solar_credit: { name: 'Créditos de Energia Solar', badge: 'Geração Solar', desc: 'Energia excedente da usina é distribuída entre unidades consumidoras.' },
};

export const statusConfig: Record<RateioStatus, { label: string; icon: string; color: string }> = {
  draft: { label: 'Pendente', icon: '🟡', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
  confirmed: { label: 'Confirmado', icon: '✅', color: 'bg-success/10 text-success' },
  closed: { label: 'Fechado', icon: '🔒', color: 'bg-muted text-muted-foreground' },
  reopened: { label: 'Reaberto', icon: '🔓', color: 'bg-interactive/10 text-interactive' },
};

// ─── Seed configs ─────────────────────────────────────
export const seedRateioConfigs: RateioConfig[] = [
  { id: 'rc1', buildingId: 'b12', utilityType: 'energy', defaultMethod: 'individual', tariffValue: 0.60, tariffSince: '2025-07-01', alertVariancePct: 20, alertDueDay: 10, updatedBy: 'Tatiana Caracciolo', updatedAt: '2025-07-01' },
  { id: 'rc2', buildingId: 'b12', utilityType: 'water', defaultMethod: 'ideal_fraction', tariffValue: 12.50, tariffSince: '2025-07-01', alertVariancePct: 20, alertDueDay: 10, updatedBy: 'Tatiana Caracciolo', updatedAt: '2025-07-01' },
  { id: 'rc3', buildingId: 'b12', utilityType: 'gas', defaultMethod: 'simple', tariffValue: 4.80, tariffSince: '2025-07-01', alertVariancePct: 20, alertDueDay: 10, updatedBy: 'Tatiana Caracciolo', updatedAt: '2025-07-01' },
];

export const seedTariffHistory: Record<UtilityType, TariffHistory[]> = {
  energy: [
    { date: '2025-07-01', value: 0.60 },
    { date: '2025-01-01', value: 0.55 },
    { date: '2024-07-01', value: 0.52 },
  ],
  water: [
    { date: '2025-07-01', value: 12.50 },
    { date: '2025-01-01', value: 11.80 },
  ],
  gas: [
    { date: '2025-07-01', value: 4.80 },
    { date: '2025-01-01', value: 4.50 },
  ],
};

// Active tenants derived from contracts
export const activeTenants = mockContracts
  .filter(c => c.status === 'active' || c.status === 'expiring')
  .map(c => ({
    id: c.id,
    name: c.tenant_name,
    floors: c.floors,
    areaM2: c.area_m2,
  }));

export const totalArea = activeTenants.reduce((s, t) => s + t.areaM2, 0);

// Get building reading from telemetry for a given utility
export function getBuildingReading(utility: UtilityType): { value: number; source: ReadingSource; lastAt: Date } {
  const mainMeter = seedMeters.find(m => m.type === (utility as MeterType) && !m.tenantId);
  if (mainMeter) {
    return { value: mainMeter.lastReadingValue, source: mainMeter.status === 'online' ? 'telemetry' : 'manual', lastAt: mainMeter.lastReadingAt };
  }
  return { value: 0, source: 'manual', lastAt: new Date() };
}

// Get sub-meter readings for individual method
export function getSubMeterReadings(utility: UtilityType) {
  return seedMeters
    .filter(m => m.type === (utility as MeterType) && m.tenantId)
    .map(m => ({
      meterId: m.id,
      tenantId: m.tenantId!,
      tenantName: m.tenantName!,
      value: m.lastReadingValue,
      status: m.status,
      location: m.location,
    }));
}

// Calculate rateio preview
export function calculateRateio(
  utility: UtilityType,
  method: RateioMethod,
  totalValue: number,
  tariff: number
): RateioItem[] {
  const tenants = activeTenants;
  switch (method) {
    case 'individual': {
      const subs = getSubMeterReadings(utility);
      const subTotal = subs.reduce((s, r) => s + r.value, 0);
      const commonArea = Math.max(0, totalValue - subTotal);
      const commonPerTenant = commonArea / tenants.length;
      return tenants.map(t => {
        const sub = subs.find(s => s.tenantId === t.id);
        const val = (sub?.value ?? 0) + commonPerTenant;
        const pct = totalValue > 0 ? (val / totalValue) * 100 : 0;
        return {
          id: `ri-${t.id}`,
          rateioId: '',
          tenantId: t.id,
          tenantName: t.name,
          floors: t.floors,
          areaM2: t.areaM2,
          attributedValue: Math.round(val * 10) / 10,
          participationPct: Math.round(pct * 10) / 10,
          calculatedAmountBrl: Math.round(val * tariff * 100) / 100,
          meterReading: sub?.value,
          variationVsPrev: Math.round((Math.random() - 0.4) * 15 * 10) / 10,
        };
      });
    }
    case 'ideal_fraction': {
      return tenants.map(t => {
        const pct = (t.areaM2 / totalArea) * 100;
        const val = totalValue * (t.areaM2 / totalArea);
        return {
          id: `ri-${t.id}`,
          rateioId: '',
          tenantId: t.id,
          tenantName: t.name,
          floors: t.floors,
          areaM2: t.areaM2,
          attributedValue: Math.round(val * 10) / 10,
          participationPct: Math.round(pct * 10) / 10,
          calculatedAmountBrl: Math.round(val * tariff * 100) / 100,
          variationVsPrev: Math.round((Math.random() - 0.4) * 15 * 10) / 10,
        };
      });
    }
    case 'simple': {
      const perTenant = totalValue / tenants.length;
      const pct = 100 / tenants.length;
      return tenants.map(t => ({
        id: `ri-${t.id}`,
        rateioId: '',
        tenantId: t.id,
        tenantName: t.name,
        floors: t.floors,
        areaM2: t.areaM2,
        attributedValue: Math.round(perTenant * 10) / 10,
        participationPct: Math.round(pct * 10) / 10,
        calculatedAmountBrl: Math.round(perTenant * tariff * 100) / 100,
        variationVsPrev: Math.round((Math.random() - 0.4) * 15 * 10) / 10,
      }));
    }
    case 'solar_credit': {
      // Same as ideal_fraction for now
      return tenants.map(t => {
        const pct = (t.areaM2 / totalArea) * 100;
        const val = totalValue * (t.areaM2 / totalArea);
        return {
          id: `ri-${t.id}`,
          rateioId: '',
          tenantId: t.id,
          tenantName: t.name,
          floors: t.floors,
          areaM2: t.areaM2,
          attributedValue: Math.round(val * 10) / 10,
          participationPct: Math.round(pct * 10) / 10,
          calculatedAmountBrl: Math.round(val * tariff * 100) / 100,
          solarCreditUsed: Math.round(val * 0.4 * 10) / 10,
          variationVsPrev: Math.round((Math.random() - 0.4) * 15 * 10) / 10,
        };
      });
    }
  }
}

// ─── Seed history ─────────────────────────────────────
function makeHistory(month: number, year: number, utility: UtilityType, method: RateioMethod, total: number, tariff: number, status: RateioStatus, by: string, at: string): ConsumptionRateio {
  const items = calculateRateio(utility, method, total, tariff);
  return {
    id: `rat-${utility}-${year}-${month}`,
    buildingId: 'b12',
    periodMonth: month,
    periodYear: year,
    utilityType: utility,
    method,
    totalBuildingValue: total,
    totalBuildingUnit: utilityConfig[utility].unit,
    tariffValue: tariff,
    status,
    confirmedBy: by,
    confirmedAt: at,
    readingSource: 'manual',
    items,
    createdAt: at,
  };
}

export const seedRateioHistory: ConsumptionRateio[] = [
  makeHistory(2, 2026, 'energy', 'individual', 41200, 0.60, 'confirmed', 'Tatiana Caracciolo', '2026-03-05'),
  makeHistory(2, 2026, 'water', 'ideal_fraction', 265, 12.50, 'confirmed', 'Tatiana Caracciolo', '2026-03-05'),
  makeHistory(2, 2026, 'gas', 'simple', 88, 4.80, 'confirmed', 'Tatiana Caracciolo', '2026-03-06'),
  makeHistory(1, 2026, 'energy', 'individual', 39800, 0.60, 'closed', 'Tatiana Caracciolo', '2026-02-05'),
  makeHistory(1, 2026, 'water', 'ideal_fraction', 258, 12.50, 'closed', 'Tatiana Caracciolo', '2026-02-05'),
  makeHistory(1, 2026, 'gas', 'simple', 82, 4.80, 'closed', 'Tatiana Caracciolo', '2026-02-06'),
  makeHistory(12, 2025, 'energy', 'individual', 38500, 0.55, 'closed', 'Tatiana Caracciolo', '2026-01-05'),
  makeHistory(12, 2025, 'water', 'ideal_fraction', 250, 11.80, 'closed', 'Tatiana Caracciolo', '2026-01-05'),
];

// Monthly consumption for annual chart
export const monthlyConsumption: Record<UtilityType, { month: string; lux: number; capitale: number; youinc: number; common: number }[]> = {
  energy: [
    { month: 'Jan', lux: 7800, capitale: 4900, youinc: 11200, common: 15900 },
    { month: 'Fev', lux: 8200, capitale: 5100, youinc: 11800, common: 16100 },
    { month: 'Mar', lux: 8500, capitale: 5300, youinc: 12100, common: 16500 },
  ],
  water: [
    { month: 'Jan', lux: 32, capitale: 62, youinc: 62, common: 102 },
    { month: 'Fev', lux: 34, capitale: 65, youinc: 65, common: 101 },
    { month: 'Mar', lux: 36, capitale: 68, youinc: 68, common: 108 },
  ],
  gas: [
    { month: 'Jan', lux: 8, capitale: 15, youinc: 15, common: 44 },
    { month: 'Fev', lux: 9, capitale: 16, youinc: 16, common: 47 },
    { month: 'Mar', lux: 10, capitale: 17, youinc: 17, common: 51 },
  ],
};
