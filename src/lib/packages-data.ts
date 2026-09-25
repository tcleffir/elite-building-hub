export type PackageType = 'package' | 'letter' | 'document' | 'bag' | 'fragile' | 'other';
export type PackageStatus = 'waiting' | 'picked_up' | 'returned' | 'lost';

export interface Package {
  id: string;
  type: PackageType;
  recipientCompany: string;
  recipientName?: string;
  recipientFloor: string;
  senderName?: string;
  carrier?: string;
  trackingCode?: string;
  volumes: number;
  observations?: string;
  photoUrl?: string;
  status: PackageStatus;
  arrivedAt: Date;
  pickedUpAt?: Date;
  pickedUpBy?: string;
  documentPresented?: boolean;
  registeredBy: string;
  notificationSentAt?: Date;
  reminderSentAt?: Date;
}

export const packageTypeConfig: Record<PackageType, { icon: string; label: string }> = {
  package: { icon: '📦', label: 'Encomenda' },
  letter: { icon: '✉️', label: 'Carta/Correspondência' },
  document: { icon: '📄', label: 'Documento Oficial' },
  bag: { icon: '🛍️', label: 'Sacola / Bag' },
  fragile: { icon: '🌡️', label: 'Produto Frágil / Refrigerado' },
  other: { icon: '📬', label: 'Outro' },
};

export const packageStatusConfig: Record<PackageStatus, { label: string; color: string }> = {
  waiting: { label: 'Aguardando Retirada', color: 'bg-amber-100 text-amber-800' },
  picked_up: { label: 'Retirada', color: 'bg-emerald-100 text-emerald-800' },
  returned: { label: 'Devolvida', color: 'bg-blue-100 text-blue-800' },
  lost: { label: 'Extraviada', color: 'bg-red-100 text-red-800' },
};

export const carriers = ['Correios', 'Mercado Livre', 'Amazon', 'iFood', 'Rappi', 'Courier', 'Outro'];

export const tenantDirectory = [
  { id: 't1', company: 'Vivo (Telefônica Brasil)', floor: '7º andar', email: 'recepcao@luxenergia.com.br' },
  { id: 't2', company: 'Totvs S.A.', floor: '13º andar', email: 'recepcao@capitale.com.br' },
  { id: 't3', company: 'WeWork Brasil', floor: '2º–4º andar', email: 'recepcao@youinc.com.br' },
  { id: 't4', company: 'Administradora', floor: 'Térreo', email: 'adm@administradora.com.br' },
];

const now = new Date();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000);
const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

export const seedPackages: Package[] = [
  {
    id: 'pkg-1',
    type: 'package',
    recipientCompany: 'Vivo (Telefônica Brasil)',
    recipientFloor: '7º andar',
    senderName: 'Amazon',
    carrier: 'Amazon',
    volumes: 2,
    status: 'waiting',
    arrivedAt: hoursAgo(1),
    registeredBy: 'João (Portaria)',
    notificationSentAt: hoursAgo(1),
  },
  {
    id: 'pkg-2',
    type: 'letter',
    recipientCompany: 'Totvs S.A.',
    recipientFloor: '13º andar',
    carrier: 'Correios',
    volumes: 1,
    status: 'waiting',
    arrivedAt: daysAgo(2),
    registeredBy: 'João (Portaria)',
    notificationSentAt: daysAgo(2),
  },
  {
    id: 'pkg-3',
    type: 'document',
    recipientCompany: 'Administradora',
    recipientFloor: 'Térreo',
    senderName: 'Cartório',
    carrier: 'Courier',
    volumes: 1,
    observations: 'Documento importante — entregar diretamente ao Sr. Carlos',
    status: 'waiting',
    arrivedAt: hoursAgo(0.5),
    registeredBy: 'Maria (Portaria)',
  },
  {
    id: 'pkg-4',
    type: 'package',
    recipientCompany: 'WeWork Brasil',
    recipientFloor: '2º–4º andar',
    senderName: 'Mercado Livre',
    carrier: 'Mercado Livre',
    volumes: 3,
    status: 'waiting',
    arrivedAt: daysAgo(4),
    registeredBy: 'João (Portaria)',
    notificationSentAt: daysAgo(4),
    reminderSentAt: daysAgo(1),
  },
  {
    id: 'pkg-5',
    type: 'bag',
    recipientCompany: 'Vivo (Telefônica Brasil)',
    recipientName: 'Ana Paula',
    recipientFloor: '7º andar',
    senderName: 'iFood',
    carrier: 'iFood',
    volumes: 1,
    status: 'picked_up',
    arrivedAt: hoursAgo(0.33),
    pickedUpAt: hoursAgo(0.1),
    pickedUpBy: 'Ana Paula',
    registeredBy: 'Maria (Portaria)',
    notificationSentAt: hoursAgo(0.33),
  },
];

export function getDaysDiff(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `há ${diffMin}min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `há ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  return `há ${diffD} dia${diffD > 1 ? 's' : ''}`;
}
