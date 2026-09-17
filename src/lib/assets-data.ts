import type { LucideIcon } from "lucide-react";
import { Wind, Zap, Droplets, Shield, ArrowUpDown, Wrench } from "lucide-react";

// Categorias agora são dinâmicas (string), mas mantemos os builtin keys
// para compatibilidade com mocks e ícones padrão.
export type AssetCategory = string;
export type BuiltinAssetCategory =
  | "climatizacao"
  | "eletrica"
  | "hidraulica"
  | "seguranca"
  | "transporte_vertical"
  | "outros";

export type AssetStatus = "active" | "maintenance" | "inactive";
export type WarrantyType = "manufacturer" | "extended";
export type MaintenancePeriodicity = "monthly" | "quarterly" | "biannual" | "annual";

export interface AssetInvoice {
  number: string;
  issuedAt: string;
  fileName: string;
  fileUrl?: string;
}

export interface AssetWarranty {
  type: WarrantyType;
  startDate: string;
  endDate: string;
  terms: string;
  termFileName?: string;
  termFileUrl?: string;
  supplierContactName: string;
  supplierContactPhone: string;
  supplierContactEmail: string;
}

export interface AssetMaintenance {
  id: string;
  assetId: string;
  performedAt: string;
  company: string;
  technician: string;
  amountPaid: number;
  validUntil: string;
  serviceWarrantyDays: number;
  invoice?: AssetInvoice;
  notes?: string;
}

export interface Asset {
  id: string;
  name: string;
  brand: string;
  model: string;
  serialNumber: string;
  description?: string;
  category: AssetCategory;
  buildingId: string;
  floor: number;
  area: string;
  status: AssetStatus;
  purchaseDate: string;
  purchasePrice: number;
  supplier: string;
  buyer: string;
  installer: string;
  installationDate: string;
  installationLocation: string;
  invoice: AssetInvoice;
  warranty: AssetWarranty;
  periodicity: MaintenancePeriodicity;
  nextMaintenanceDate: string;
  photos?: string[]; // dataURLs persistidas (até 6)
}

export const defaultCategoryLabels: Record<BuiltinAssetCategory, string> = {
  climatizacao: "Climatização",
  eletrica: "Elétrica",
  hidraulica: "Hidráulica",
  seguranca: "Segurança",
  transporte_vertical: "Transporte Vertical",
  outros: "Outros",
};

// Mantido como export para retrocompatibilidade — usado como fallback inicial.
export const categoryLabels: Record<string, string> = { ...defaultCategoryLabels };

export const defaultCategoryIcons: Record<BuiltinAssetCategory, LucideIcon> = {
  climatizacao: Wind,
  eletrica: Zap,
  hidraulica: Droplets,
  seguranca: Shield,
  transporte_vertical: ArrowUpDown,
  outros: Wrench,
};

export const categoryIcons: Record<string, LucideIcon> = { ...defaultCategoryIcons };

export const getCategoryIcon = (cat: string): LucideIcon =>
  defaultCategoryIcons[cat as BuiltinAssetCategory] ?? Wrench;

export const statusLabels: Record<AssetStatus, string> = {
  active: "Ativo",
  maintenance: "Em manutenção",
  inactive: "Inativo",
};

export const periodicityLabels: Record<MaintenancePeriodicity, string> = {
  monthly: "Mensal",
  quarterly: "Trimestral",
  biannual: "Semestral",
  annual: "Anual",
};

export const periodicityDays: Record<MaintenancePeriodicity, number> = {
  monthly: 30,
  quarterly: 90,
  biannual: 180,
  annual: 365,
};

export const mockAssets: Asset[] = [
  {
    id: "AT-001",
    name: "Ar-Condicionado VRF Daikin",
    brand: "Daikin",
    model: "VRV IV-S RXYSQ8",
    serialNumber: "DKN-2024-VRF-007",
    description: "Sistema VRF de 22HP atendendo o 7º andar (Lux Energia).",
    category: "climatizacao",
    buildingId: "b1",
    floor: 7,
    area: "Casa de máquinas — 7º andar",
    status: "active",
    purchaseDate: "2024-03-12",
    purchasePrice: 45000,
    supplier: "Daikin do Brasil",
    buyer: "Tatiana Caracciolo",
    installer: "ClimaTech Solutions",
    installationDate: "2024-03-25",
    installationLocation: "Casa de máquinas — 7º andar",
    invoice: { number: "NF-58921", issuedAt: "2024-03-12", fileName: "NF-58921-Daikin.pdf" },
    warranty: {
      type: "manufacturer", startDate: "2024-03-25", endDate: "2027-03-25",
      terms: "Garantia integral de fábrica de 36 meses para compressor e placa eletrônica.",
      termFileName: "Termo-Garantia-Daikin.pdf",
      supplierContactName: "Atendimento Daikin",
      supplierContactPhone: "0800 555 1010",
      supplierContactEmail: "suporte@daikin.com.br",
    },
    periodicity: "quarterly",
    nextMaintenanceDate: "2026-05-15",
  },
  {
    id: "AT-002",
    name: "Ar-Condicionado Split Sala 13",
    brand: "LG",
    model: "Dual Inverter 60.000 BTUs",
    serialNumber: "LG-2023-SPLIT-013",
    description: "Split teto piso 60k BTUs — sala de reunião principal 13º andar.",
    category: "climatizacao",
    buildingId: "b1",
    floor: 13,
    area: "Sala de reunião principal — 13º andar",
    status: "maintenance",
    purchaseDate: "2023-08-20",
    purchasePrice: 18500,
    supplier: "LG Electronics Brasil",
    buyer: "Tatiana Caracciolo",
    installer: "ClimaTech Solutions",
    installationDate: "2023-09-02",
    installationLocation: "Sala de reunião principal — 13º andar",
    invoice: { number: "NF-44012", issuedAt: "2023-08-20", fileName: "NF-44012-LG.pdf" },
    warranty: {
      type: "manufacturer", startDate: "2023-09-02", endDate: "2025-09-02",
      terms: "Garantia de 24 meses cobrindo compressor.",
      supplierContactName: "Suporte LG B2B",
      supplierContactPhone: "0800 707 5454",
      supplierContactEmail: "b2b@lge.com.br",
    },
    periodicity: "quarterly",
    nextMaintenanceDate: "2026-04-10",
  },
  {
    id: "AT-003",
    name: "Elevador Social Schindler #1",
    brand: "Schindler",
    model: "5500 — 1.600kg / 21 paradas",
    serialNumber: "SCH-360JK-EL01",
    description: "Elevador social 1 — torre A. Capacidade 21 pessoas.",
    category: "transporte_vertical",
    buildingId: "b1",
    floor: 0,
    area: "Hall principal — térreo",
    status: "active",
    purchaseDate: "2019-11-10",
    purchasePrice: 380000,
    supplier: "Schindler do Brasil",
    buyer: "Construtora 360JK",
    installer: "Schindler do Brasil",
    installationDate: "2020-02-15",
    installationLocation: "Caixa de elevadores — torre A",
    invoice: { number: "NF-07788", issuedAt: "2019-11-10", fileName: "NF-07788-Schindler.pdf" },
    warranty: {
      type: "extended", startDate: "2020-02-15", endDate: "2027-02-15",
      terms: "Contrato de manutenção full + garantia estendida de 7 anos.",
      termFileName: "Contrato-Schindler.pdf",
      supplierContactName: "Schindler 24h",
      supplierContactPhone: "0800 770 7070",
      supplierContactEmail: "atendimento@schindler.com",
    },
    periodicity: "monthly",
    nextMaintenanceDate: "2026-04-30",
  },
  {
    id: "AT-004",
    name: "Gerador a Diesel Stemac",
    brand: "Stemac",
    model: "ST750 — 750 kVA",
    serialNumber: "STM-2021-G750-A",
    description: "Gerador de emergência 750kVA com tanque de 1.000L.",
    category: "eletrica",
    buildingId: "b1",
    floor: -1,
    area: "Casa do gerador — SS1",
    status: "active",
    purchaseDate: "2021-05-22",
    purchasePrice: 215000,
    supplier: "Stemac Grupos Geradores",
    buyer: "Daniel",
    installer: "Stemac Engenharia",
    installationDate: "2021-07-10",
    installationLocation: "Casa do gerador — SS1",
    invoice: { number: "NF-12244", issuedAt: "2021-05-22", fileName: "NF-12244-Stemac.pdf" },
    warranty: {
      type: "extended", startDate: "2021-07-10", endDate: "2026-07-10",
      terms: "Garantia estendida de 5 anos para motor e alternador.",
      supplierContactName: "Plantão Stemac",
      supplierContactPhone: "0800 510 9000",
      supplierContactEmail: "pos.venda@stemac.com.br",
    },
    periodicity: "monthly",
    nextMaintenanceDate: "2026-04-25",
  },
  {
    id: "AT-005",
    name: "Bomba de Recalque Schneider",
    brand: "Schneider",
    model: "BC-92 5CV Trifásica",
    serialNumber: "SCN-2022-BR-02",
    description: "Bomba de recalque do reservatório inferior para o superior.",
    category: "hidraulica",
    buildingId: "b1",
    floor: -2,
    area: "Casa de bombas — SS2",
    status: "active",
    purchaseDate: "2022-04-18",
    purchasePrice: 12800,
    supplier: "Schneider Motobombas",
    buyer: "Tatiana Caracciolo",
    installer: "Hidrotec Engenharia",
    installationDate: "2022-04-30",
    installationLocation: "Casa de bombas — SS2",
    invoice: { number: "NF-33098", issuedAt: "2022-04-18", fileName: "NF-33098-Schneider.pdf" },
    warranty: {
      type: "manufacturer", startDate: "2022-04-30", endDate: "2025-04-30",
      terms: "Garantia de 36 meses para motor.",
      supplierContactName: "SAC Schneider",
      supplierContactPhone: "0800 444 1010",
      supplierContactEmail: "sac@schneider-motobombas.com.br",
    },
    periodicity: "biannual",
    nextMaintenanceDate: "2026-03-15",
  },
  {
    id: "AT-006",
    name: "Sistema CFTV Hikvision",
    brand: "Hikvision",
    model: "DS-7732NI-K4 + 32 câmeras IP",
    serialNumber: "HIK-2023-CFTV-360",
    description: "Gravador NVR 32 canais 4K + 32 câmeras IP cobertura integral.",
    category: "seguranca",
    buildingId: "b1",
    floor: 0,
    area: "Sala de monitoramento — térreo",
    status: "active",
    purchaseDate: "2023-11-05",
    purchasePrice: 92000,
    supplier: "Hikvision Brasil",
    buyer: "Daniel",
    installer: "SecTech Segurança",
    installationDate: "2023-12-01",
    installationLocation: "Sala de monitoramento — térreo",
    invoice: { number: "NF-66541", issuedAt: "2023-11-05", fileName: "NF-66541-Hikvision.pdf" },
    warranty: {
      type: "manufacturer", startDate: "2023-12-01", endDate: "2026-12-01",
      terms: "Garantia de 36 meses para câmeras e NVR.",
      supplierContactName: "Suporte Hikvision",
      supplierContactPhone: "(11) 3318-0050",
      supplierContactEmail: "suporte.br@hikvision.com",
    },
    periodicity: "biannual",
    nextMaintenanceDate: "2026-06-01",
  },
  {
    id: "AT-007",
    name: "Catraca Eletrônica Henry",
    brand: "Henry",
    model: "Argos LE — Trilíngue",
    serialNumber: "HNR-2022-CAT-04",
    description: "Catracas de acesso (4 unidades) com biometria + leitor QR Code.",
    category: "seguranca",
    buildingId: "b1",
    floor: 0,
    area: "Lobby de acesso — térreo",
    status: "active",
    purchaseDate: "2022-09-14",
    purchasePrice: 68000,
    supplier: "Henry Equipamentos",
    buyer: "Tatiana Caracciolo",
    installer: "Henry Engenharia",
    installationDate: "2022-10-05",
    installationLocation: "Lobby de acesso — térreo",
    invoice: { number: "NF-50211", issuedAt: "2022-09-14", fileName: "NF-50211-Henry.pdf" },
    warranty: {
      type: "manufacturer", startDate: "2022-10-05", endDate: "2025-10-05",
      terms: "Garantia de 36 meses (peças e mão de obra).",
      supplierContactName: "SAT Henry",
      supplierContactPhone: "(41) 3661-0100",
      supplierContactEmail: "sat@henry.com.br",
    },
    periodicity: "quarterly",
    nextMaintenanceDate: "2026-05-20",
  },
  {
    id: "AT-008",
    name: "Quadro Elétrico Geral QGBT",
    brand: "Siemens",
    model: "Sivacon S8 — 2.500A",
    serialNumber: "SMS-QGBT-360JK",
    description: "Quadro Geral de Baixa Tensão da edificação.",
    category: "eletrica",
    buildingId: "b1",
    floor: -1,
    area: "Sala elétrica — SS1",
    status: "active",
    purchaseDate: "2019-12-05",
    purchasePrice: 480000,
    supplier: "Siemens AG Brasil",
    buyer: "Construtora 360JK",
    installer: "Siemens Engenharia",
    installationDate: "2020-03-10",
    installationLocation: "Sala elétrica — SS1",
    invoice: { number: "NF-09001", issuedAt: "2019-12-05", fileName: "NF-09001-Siemens.pdf" },
    warranty: {
      type: "manufacturer", startDate: "2020-03-10", endDate: "2025-03-10",
      terms: "Garantia de 5 anos para disjuntores principais.",
      supplierContactName: "Siemens Service",
      supplierContactPhone: "0800 119 484",
      supplierContactEmail: "br.service@siemens.com",
    },
    periodicity: "annual",
    nextMaintenanceDate: "2026-12-10",
  },
  {
    id: "AT-009",
    name: "Chiller Carrier 30HXC",
    brand: "Carrier",
    model: "30HXC-200 — 200 TR",
    serialNumber: "CRR-2020-CHL-01",
    description: "Chiller de água gelada para sistema central de climatização.",
    category: "climatizacao",
    buildingId: "b1",
    floor: 18,
    area: "Cobertura — casa de máquinas",
    status: "active",
    purchaseDate: "2020-06-30",
    purchasePrice: 1250000,
    supplier: "Carrier Brasil",
    buyer: "Construtora 360JK",
    installer: "Carrier Engenharia",
    installationDate: "2020-09-15",
    installationLocation: "Cobertura — casa de máquinas",
    invoice: { number: "NF-22330", issuedAt: "2020-06-30", fileName: "NF-22330-Carrier.pdf" },
    warranty: {
      type: "extended", startDate: "2020-09-15", endDate: "2025-09-15",
      terms: "Garantia estendida de 5 anos para compressores parafuso.",
      supplierContactName: "Carrier Service",
      supplierContactPhone: "0800 011 6661",
      supplierContactEmail: "service.br@carrier.com",
    },
    periodicity: "quarterly",
    nextMaintenanceDate: "2026-04-01",
  },
  {
    id: "AT-010",
    name: "Plataforma de Acessibilidade",
    brand: "Thyssenkrupp",
    model: "Flexstep V2",
    serialNumber: "TKE-2023-PLT-01",
    description: "Plataforma de acessibilidade para PNE — entrada principal.",
    category: "transporte_vertical",
    buildingId: "b1",
    floor: 0,
    area: "Entrada principal — térreo",
    status: "active",
    purchaseDate: "2023-04-12",
    purchasePrice: 88000,
    supplier: "Thyssenkrupp Elevadores",
    buyer: "Tatiana Caracciolo",
    installer: "Thyssenkrupp Engenharia",
    installationDate: "2023-05-20",
    installationLocation: "Entrada principal — térreo",
    invoice: { number: "NF-71204", issuedAt: "2023-04-12", fileName: "NF-71204-TKE.pdf" },
    warranty: {
      type: "manufacturer", startDate: "2023-05-20", endDate: "2026-05-20",
      terms: "Garantia integral de 36 meses.",
      supplierContactName: "TKE Service",
      supplierContactPhone: "0800 770 8585",
      supplierContactEmail: "service.br@tkelevator.com",
    },
    periodicity: "monthly",
    nextMaintenanceDate: "2026-04-28",
  },
  {
    id: "AT-011",
    name: "Bomba Pressurizadora KSB",
    brand: "KSB",
    model: "Hydrobloc P500",
    serialNumber: "KSB-2022-BOMB-02",
    description: "Bomba pressurizadora redundante.",
    category: "hidraulica",
    buildingId: "b1",
    floor: -2,
    area: "Casa de bombas — SS2",
    status: "active",
    purchaseDate: "2022-07-08",
    purchasePrice: 9800,
    supplier: "KSB Bombas",
    buyer: "Tatiana Caracciolo",
    installer: "Hidrotec Engenharia",
    installationDate: "2022-07-25",
    installationLocation: "Casa de bombas — SS2",
    invoice: { number: "NF-39912", issuedAt: "2022-07-08", fileName: "NF-39912-KSB.pdf" },
    warranty: {
      type: "manufacturer", startDate: "2022-07-25", endDate: "2025-07-25",
      terms: "Garantia de 36 meses.",
      supplierContactName: "SAC KSB",
      supplierContactPhone: "(11) 4136-9000",
      supplierContactEmail: "sac@ksb.com",
    },
    periodicity: "biannual",
    nextMaintenanceDate: "2026-08-10",
  },
  {
    id: "AT-012",
    name: "Painel de Alarme Bosch",
    brand: "Bosch",
    model: "FPA-5000 + 120 detectores",
    serialNumber: "BSH-2021-FIRE-01",
    description: "Central de alarme de incêndio endereçável + 120 detectores.",
    category: "outros",
    buildingId: "b1",
    floor: 0,
    area: "Sala técnica — térreo",
    status: "active",
    purchaseDate: "2021-09-30",
    purchasePrice: 145000,
    supplier: "Bosch Security Systems",
    buyer: "Daniel",
    installer: "Bosch Engenharia",
    installationDate: "2021-11-15",
    installationLocation: "Sala técnica — térreo",
    invoice: { number: "NF-18877", issuedAt: "2021-09-30", fileName: "NF-18877-Bosch.pdf" },
    warranty: {
      type: "extended", startDate: "2021-11-15", endDate: "2026-11-15",
      terms: "Garantia estendida de 5 anos para central + sensores.",
      supplierContactName: "Bosch Service",
      supplierContactPhone: "0800 704 5446",
      supplierContactEmail: "fire.br@bosch.com",
    },
    periodicity: "annual",
    nextMaintenanceDate: "2026-11-15",
  },
];

export const mockMaintenances: AssetMaintenance[] = [
  {
    id: "MN-001", assetId: "AT-001", performedAt: "2026-02-15",
    company: "ClimaTech Solutions", technician: "João Bezerra", amountPaid: 2400,
    validUntil: "2026-05-15", serviceWarrantyDays: 90,
    invoice: { number: "NF-CT-9001", issuedAt: "2026-02-15", fileName: "NF-9001-ClimaTech.pdf" },
    notes: "Limpeza de condensadoras + troca de filtros + check de gás.",
  },
  {
    id: "MN-002", assetId: "AT-001", performedAt: "2025-11-15",
    company: "ClimaTech Solutions", technician: "João Bezerra", amountPaid: 2200,
    validUntil: "2026-02-15", serviceWarrantyDays: 90,
    invoice: { number: "NF-CT-8650", issuedAt: "2025-11-15", fileName: "NF-8650-ClimaTech.pdf" },
  },
  {
    id: "MN-003", assetId: "AT-002", performedAt: "2026-01-10",
    company: "ClimaTech Solutions", technician: "Marcos Lima", amountPaid: 850,
    validUntil: "2026-04-10", serviceWarrantyDays: 90,
    invoice: { number: "NF-CT-8901", issuedAt: "2026-01-10", fileName: "NF-8901-ClimaTech.pdf" },
    notes: "Substituição de capacitor + limpeza profunda.",
  },
  {
    id: "MN-004", assetId: "AT-003", performedAt: "2026-03-30",
    company: "Schindler Manutenção", technician: "Carlos Antunes", amountPaid: 4800,
    validUntil: "2026-04-30", serviceWarrantyDays: 30,
    invoice: { number: "NF-SCH-22310", issuedAt: "2026-03-30", fileName: "NF-22310-Schindler.pdf" },
    notes: "Manutenção preventiva mensal.",
  },
  {
    id: "MN-005", assetId: "AT-004", performedAt: "2026-03-25",
    company: "Stemac Engenharia", technician: "Roberto Almeida", amountPaid: 3200,
    validUntil: "2026-04-25", serviceWarrantyDays: 60,
    invoice: { number: "NF-STM-7711", issuedAt: "2026-03-25", fileName: "NF-7711-Stemac.pdf" },
    notes: "Teste de carga + análise de óleo + troca de filtros.",
  },
  {
    id: "MN-006", assetId: "AT-009", performedAt: "2026-01-05",
    company: "Carrier Engenharia", technician: "Equipe Carrier SP", amountPaid: 12500,
    validUntil: "2026-04-05", serviceWarrantyDays: 90,
    invoice: { number: "NF-CRR-4488", issuedAt: "2026-01-05", fileName: "NF-4488-Carrier.pdf" },
    notes: "Manutenção trimestral.",
  },
  {
    id: "MN-007", assetId: "AT-005", performedAt: "2025-09-12",
    company: "Hidrotec Engenharia", technician: "Felipe Santos", amountPaid: 1800,
    validUntil: "2026-03-12", serviceWarrantyDays: 90,
    invoice: { number: "NF-HT-2210", issuedAt: "2025-09-12", fileName: "NF-2210-Hidrotec.pdf" },
  },
];

const MS_DAY = 1000 * 60 * 60 * 24;

export function daysBetween(dateIso: string): number {
  return Math.floor((new Date(dateIso).getTime() - Date.now()) / MS_DAY);
}

export type WarrantyStatus = "active" | "expiring" | "expired";
export function getWarrantyStatus(asset: Asset): WarrantyStatus {
  const days = daysBetween(asset.warranty.endDate);
  if (days < 0) return "expired";
  if (days <= 30) return "expiring";
  return "active";
}

export type MaintenanceStatus = "ok" | "due_soon" | "overdue";
export function getMaintenanceStatus(asset: Asset): MaintenanceStatus {
  const days = daysBetween(asset.nextMaintenanceDate);
  if (days < 0) return "overdue";
  if (days <= 30) return "due_soon";
  return "ok";
}

export type AssetHealth = "healthy" | "warning" | "critical";
export function getAssetHealth(asset: Asset, openTickets: number): AssetHealth {
  const w = getWarrantyStatus(asset);
  const m = getMaintenanceStatus(asset);
  if (m === "overdue" || w === "expired" || asset.status === "inactive") return "critical";
  if (m === "due_soon" || w === "expiring" || openTickets > 1 || asset.status === "maintenance") return "warning";
  return "healthy";
}

export const formatBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

export const formatBRLFull = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export function formatFloor(floor: number): string {
  if (floor === 0) return "Térreo";
  if (floor < 0) return `Subsolo ${Math.abs(floor)}`;
  return `${floor}º andar`;
}

// ============= Histórico de Alterações =============

export type AssetChangeType =
  | "create"
  | "update"
  | "delete"
  | "maintenance"
  | "attachment"
  | "ai_extraction";

export interface AssetChangeEntry {
  field: string;
  before: unknown;
  after: unknown;
}

export interface AssetChangeLog {
  id: string;
  assetId: string;
  type: AssetChangeType;
  performedAt: string; // ISO datetime
  userId: string;
  userName: string;
  userRole: string;
  summary: string;
  changes?: AssetChangeEntry[];
  source?: "manual" | "ai" | "system";
}

// Campos amigáveis exibidos no diff (whitelist do que importa auditar)
const FIELD_LABELS: Record<string, string> = {
  name: "Nome",
  brand: "Marca",
  model: "Modelo",
  serialNumber: "Nº de série",
  description: "Descrição",
  category: "Categoria",
  floor: "Andar",
  area: "Área",
  status: "Status",
  purchaseDate: "Data de compra",
  purchasePrice: "Valor pago",
  supplier: "Fornecedor",
  buyer: "Comprador",
  installer: "Instalador",
  installationDate: "Data de instalação",
  installationLocation: "Local de instalação",
  "invoice.number": "NF — número",
  "invoice.issuedAt": "NF — emissão",
  "warranty.type": "Garantia — tipo",
  "warranty.startDate": "Garantia — início",
  "warranty.endDate": "Garantia — fim",
  "warranty.terms": "Garantia — termos",
  "warranty.supplierContactName": "Garantia — contato",
  "warranty.supplierContactPhone": "Garantia — telefone",
  "warranty.supplierContactEmail": "Garantia — e-mail",
  periodicity: "Periodicidade",
  nextMaintenanceDate: "Próx. manutenção",
};

const TRACKED_PATHS = Object.keys(FIELD_LABELS);

function getPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

export function fieldLabel(path: string): string {
  return FIELD_LABELS[path] ?? path;
}

export function diffAsset(prev: Asset, next: Asset): AssetChangeEntry[] {
  const out: AssetChangeEntry[] = [];
  for (const path of TRACKED_PATHS) {
    const a = getPath(prev, path);
    const b = getPath(next, path);
    if ((a ?? "") !== (b ?? "")) {
      out.push({ field: path, before: a ?? null, after: b ?? null });
    }
  }
  return out;
}

export function nextAssetId(existing: Asset[]): string {
  const max = existing.reduce((m, a) => {
    const n = parseInt(a.id.replace(/^AT-/, ""), 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return `AT-${String(max + 1).padStart(3, "0")}`;
}

export function nextLogId(): string {
  return `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export const mockAssetLogs: AssetChangeLog[] = [
  {
    id: "LOG-001", assetId: "AT-001", type: "create",
    performedAt: "2024-03-12T14:32:00", userId: "2", userName: "Tatiana Caracciolo",
    userRole: "Gestor de Ativos", source: "ai",
    summary: "Criou o ativo via extração de NF (NF-58921-Daikin.pdf)",
  },
  {
    id: "LOG-002", assetId: "AT-001", type: "maintenance",
    performedAt: "2025-11-15T09:00:00", userId: "2", userName: "Tatiana Caracciolo",
    userRole: "Gestor de Ativos", source: "manual",
    summary: "Registrou manutenção (ClimaTech Solutions, R$ 2.200)",
  },
  {
    id: "LOG-003", assetId: "AT-001", type: "maintenance",
    performedAt: "2026-02-15T16:00:00", userId: "2", userName: "Tatiana Caracciolo",
    userRole: "Gestor de Ativos", source: "manual",
    summary: "Registrou manutenção (ClimaTech Solutions, R$ 2.400)",
  },
  {
    id: "LOG-004", assetId: "AT-002", type: "create",
    performedAt: "2023-08-20T10:15:00", userId: "2", userName: "Tatiana Caracciolo",
    userRole: "Gestor de Ativos", source: "manual",
    summary: "Cadastrou o ativo manualmente",
  },
  {
    id: "LOG-005", assetId: "AT-002", type: "update",
    performedAt: "2025-09-04T11:42:00", userId: "1", userName: "Lux Energia — Admin",
    userRole: "Super Admin", source: "manual",
    summary: "Editou 1 campo",
    changes: [{ field: "status", before: "active", after: "maintenance" }],
  },
  {
    id: "LOG-006", assetId: "AT-003", type: "create",
    performedAt: "2019-11-10T08:00:00", userId: "1", userName: "Lux Energia — Admin",
    userRole: "Super Admin", source: "manual",
    summary: "Cadastrou o ativo (importação inicial)",
  },
  {
    id: "LOG-007", assetId: "AT-003", type: "attachment",
    performedAt: "2020-02-15T17:20:00", userId: "1", userName: "Lux Energia — Admin",
    userRole: "Super Admin", source: "manual",
    summary: "Anexou contrato de manutenção (Contrato-Schindler.pdf)",
  },
  {
    id: "LOG-008", assetId: "AT-004", type: "create",
    performedAt: "2021-05-22T09:30:00", userId: "3", userName: "Daniel",
    userRole: "Gestor de Ativos", source: "manual",
    summary: "Cadastrou o gerador",
  },
  {
    id: "LOG-009", assetId: "AT-004", type: "update",
    performedAt: "2026-01-10T14:00:00", userId: "3", userName: "Daniel",
    userRole: "Gestor de Ativos", source: "manual",
    summary: "Editou 2 campos",
    changes: [
      { field: "periodicity", before: "quarterly", after: "monthly" },
      { field: "nextMaintenanceDate", before: "2026-04-25", after: "2026-04-25" },
    ],
  },
  {
    id: "LOG-010", assetId: "AT-009", type: "create",
    performedAt: "2020-06-30T11:00:00", userId: "1", userName: "Lux Energia — Admin",
    userRole: "Super Admin", source: "manual",
    summary: "Cadastrou o chiller central",
  },
];
