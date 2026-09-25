// ─── Utility Meters & Readings ────────────────────────

export type MeterType = 'energy' | 'water' | 'gas';
export type MeterStatus = 'online' | 'manual' | 'offline';
export type IntegrationType = 'manual' | 'api';
export type ReadingFrequency = 'daily' | 'weekly' | 'monthly';

export interface UtilityMeter {
  id: string;
  buildingId: string;
  name: string;
  type: MeterType;
  unit: string;
  location: string;
  tenantId?: string;
  tenantName?: string;
  integrationType: IntegrationType;
  apiEndpoint?: string;
  readingFrequency: ReadingFrequency;
  lastReadingValue: number;
  lastReadingAt: Date;
  status: MeterStatus;
  isActive: boolean;
  createdAt: Date;
}

export interface UtilityReading {
  id: string;
  meterId: string;
  value: number;
  readAt: Date;
  inputType: 'manual' | 'automatic';
  insertedBy?: string;
  observation?: string;
  createdAt: Date;
}

export const meterTypeConfig: Record<MeterType, { icon: string; label: string; unit: string; color: string }> = {
  energy: { icon: '⚡', label: 'Energia', unit: 'kWh', color: 'hsl(var(--interactive))' },
  water: { icon: '💧', label: 'Água', unit: 'm³', color: 'hsl(var(--water))' },
  gas: { icon: '🔥', label: 'Gás', unit: 'm³', color: 'hsl(var(--destructive))' },
};

export const meterStatusConfig: Record<MeterStatus, { label: string; color: string; dot: string }> = {
  online: { label: 'Online', color: 'bg-success/10 text-success', dot: 'bg-success' },
  manual: { label: 'Manual', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', dot: 'bg-amber-500' },
  offline: { label: 'Offline', color: 'bg-destructive/10 text-destructive', dot: 'bg-destructive' },
};

const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000);

// Seed meters
export const seedMeters: UtilityMeter[] = [
  {
    id: 'mtr-1', buildingId: 'b12', name: 'Medidor Principal — Energia (Chucri Zaidan)',
    type: 'energy', unit: 'kWh', location: 'Geral Ativo',
    integrationType: 'manual', readingFrequency: 'monthly',
    lastReadingValue: 42350, lastReadingAt: daysAgo(2),
    status: 'manual', isActive: true, createdAt: daysAgo(365),
  },
  {
    id: 'mtr-2', buildingId: 'b12', name: 'Sub-medidor — Vivo (Telefônica)',
    type: 'energy', unit: 'kWh', location: '7º Andar',
    tenantId: 'c1', tenantName: 'Vivo (Telefônica)',
    integrationType: 'manual', readingFrequency: 'monthly',
    lastReadingValue: 8200, lastReadingAt: daysAgo(2),
    status: 'manual', isActive: true, createdAt: daysAgo(300),
  },
  {
    id: 'mtr-3', buildingId: 'b12', name: 'Sub-medidor — Totvs',
    type: 'energy', unit: 'kWh', location: '13º Andar',
    tenantId: 'c2', tenantName: 'Totvs',
    integrationType: 'manual', readingFrequency: 'monthly',
    lastReadingValue: 5100, lastReadingAt: daysAgo(2),
    status: 'manual', isActive: true, createdAt: daysAgo(300),
  },
  {
    id: 'mtr-4', buildingId: 'b12', name: 'Sub-medidor — WeWork',
    type: 'energy', unit: 'kWh', location: '2º–4º Andar',
    tenantId: 'c3', tenantName: 'WeWork',
    integrationType: 'manual', readingFrequency: 'monthly',
    lastReadingValue: 11800, lastReadingAt: daysAgo(2),
    status: 'manual', isActive: true, createdAt: daysAgo(300),
  },
  {
    id: 'mtr-5', buildingId: 'b12', name: 'Medidor Água — Geral Ativo',
    type: 'water', unit: 'm³', location: 'Geral Ativo',
    integrationType: 'manual', readingFrequency: 'monthly',
    lastReadingValue: 280, lastReadingAt: daysAgo(3),
    status: 'manual', isActive: true, createdAt: daysAgo(365),
  },
  {
    id: 'mtr-6', buildingId: 'b12', name: 'Medidor Gás — Casa de Máquinas',
    type: 'gas', unit: 'm³', location: 'Casa de Máquinas',
    integrationType: 'manual', readingFrequency: 'monthly',
    lastReadingValue: 95, lastReadingAt: daysAgo(3),
    status: 'manual', isActive: true, createdAt: daysAgo(365),
  },
];

// Generate sparkline data for each meter (last 30 readings)
export function generateSparkline(baseValue: number, count = 30): number[] {
  const data: number[] = [];
  let v = baseValue * 0.85;
  for (let i = 0; i < count; i++) {
    v += (Math.random() - 0.45) * baseValue * 0.04;
    v = Math.max(baseValue * 0.7, Math.min(baseValue * 1.2, v));
    data.push(Math.round(v * 10) / 10);
  }
  return data;
}

// Seed readings for history
export function generateReadings(meterId: string, baseValue: number, count = 12): UtilityReading[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `rd-${meterId}-${i}`,
    meterId,
    value: Math.round((baseValue + (Math.random() - 0.5) * baseValue * 0.15) * 10) / 10,
    readAt: daysAgo((count - i) * 30),
    inputType: 'manual' as const,
    insertedBy: 'Tatiana Caracciolo',
    createdAt: daysAgo((count - i) * 30),
  }));
}

// Alerts logic
export function getMeterAlerts(meters: UtilityMeter[]): { meterId: string; meterName: string; type: 'offline' | 'abnormal'; message: string }[] {
  const alerts: { meterId: string; meterName: string; type: 'offline' | 'abnormal'; message: string }[] = [];
  for (const m of meters) {
    const hoursSinceReading = (Date.now() - m.lastReadingAt.getTime()) / 3600000;
    if (hoursSinceReading > 48) {
      alerts.push({ meterId: m.id, meterName: m.name, type: 'offline', message: `Sem leitura há ${Math.floor(hoursSinceReading / 24)} dias` });
    }
  }
  return alerts;
}
