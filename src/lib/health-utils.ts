export type HealthStatus = 'healthy' | 'warning' | 'critical';

/**
 * Generic health status based on days until expiry.
 * @param daysUntil - Days remaining
 * @param thresholds - [greenMin, yellowMin] e.g. [365, 180] means >=365 green, 180-364 yellow, <180 red
 */
export function getHealthStatus(daysUntil: number, thresholds: [number, number]): HealthStatus {
  if (daysUntil >= thresholds[0]) return 'healthy';
  if (daysUntil >= thresholds[1]) return 'warning';
  return 'critical';
}

export function getOccupancyStatus(pct: number): HealthStatus {
  if (pct >= 90) return 'healthy';
  if (pct >= 70) return 'warning';
  return 'critical';
}

export function getContractHealth(endDate: string): HealthStatus {
  const days = Math.floor((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return getHealthStatus(days, [365, 180]);
}

export function getDocumentHealth(validUntil: string): HealthStatus {
  const days = Math.floor((new Date(validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return getHealthStatus(days, [120, 60]);
}

export function daysUntil(date: string): number {
  return Math.floor((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export const healthColors: Record<HealthStatus, { bg: string; text: string; badge: string; dot: string }> = {
  healthy: { bg: 'bg-emerald-50', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  warning: { bg: 'bg-amber-50', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  critical: { bg: 'bg-rose-50', text: 'text-rose-700', badge: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500' },
};

export const healthLabels: Record<HealthStatus, { pt: string; en: string; es: string }> = {
  healthy: { pt: 'Saudável', en: 'Healthy', es: 'Saludable' },
  warning: { pt: 'Atenção', en: 'Warning', es: 'Atención' },
  critical: { pt: 'Crítico', en: 'Critical', es: 'Crítico' },
};
