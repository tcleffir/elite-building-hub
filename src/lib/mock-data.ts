export type UserRole = 'super_admin' | 'building_manager' | 'owner' | 'tenant_admin' | 'tenant_employee' | 'vendor' | 'concierge' | 'gestor_fundo';

export type ModuleAccessMap = {
  sustainability?: boolean;
  marketplace?: boolean;
  assembly?: boolean;
  [key: string]: boolean | undefined;
};

export interface User {
  id: string;
  email: string;
  password?: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  avatar_bg?: string;
  avatar_initials?: string;
  tenant_id?: string;
  building_ids: string[];
  company?: string;
  position?: string;
  managed_building_ids?: string[];
  floors?: number[];
  managed_floors?: number[];
  is_sole_proprietor?: boolean;
  permissions_customized?: boolean;
  module_access?: ModuleAccessMap;
}

export const roleLabels: Record<UserRole, string> = {
  super_admin: 'Super Administrador',
  building_manager: 'Gestor de Ativos',
  owner: 'Proprietário',
  tenant_admin: 'Locatário Admin',
  tenant_employee: 'Locatário Colaborador',
  vendor: 'Fornecedor',
  concierge: 'Recepção / Segurança',
  gestor_fundo: 'Gestor de Fundo',
};

export const roleColors: Record<UserRole, string> = {
  super_admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  building_manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  owner: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  tenant_admin: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  tenant_employee: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
  vendor: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  concierge: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
  gestor_fundo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
};

// ─── Mock Users — 360JK Real ──────────────────────────
export const mockUsers: User[] = [
  {
    id: '1', email: 'esg@luxenergia.com.br', password: 'Lux@2026',
    full_name: 'Lux Energia — Admin', role: 'super_admin',
    building_ids: ['b1', 'b2'], company: 'Lux Energia', position: 'Super Administrador',
    avatar_bg: '#0B2A3D', avatar_initials: 'LE',
  },
  {
    id: '2', email: 'tatiana@administradora.com.br', password: 'Administradora@2026',
    full_name: 'Tatiana Caracciolo', role: 'building_manager',
    building_ids: ['b1'], company: 'Administradora', position: 'Gerente de Ativos',
    avatar_bg: '#1F4E6B', avatar_initials: 'TC',
  },
  {
    id: '3', email: 'daniel@administradora.com.br', password: 'Daniel@2026',
    full_name: 'Daniel', role: 'building_manager',
    building_ids: ['b1', 'b2'], company: 'Administradora', position: 'Gestor de Carteira',
    managed_building_ids: ['b1', 'b2'],
    avatar_bg: '#0F3834', avatar_initials: 'D',
    module_access: { sustainability: false, marketplace: true, assembly: true },
  },
  {
    id: '4', email: 'administrativo@luxenergia.com.br', password: 'LuxLoc@2026',
    full_name: 'Fábio Nunes', role: 'tenant_admin',
    building_ids: ['b1'], company: 'Lux Energy', position: 'Locatário Admin',
    tenant_id: 'c1', floors: [7],
    avatar_bg: '#4E7D5B', avatar_initials: 'FN',
  },
  {
    id: '5', email: 'adriana.bertolucci@capitaleenergia.com.br', password: 'Cap@2026',
    full_name: 'Adriana Bertolucci', role: 'tenant_admin',
    building_ids: ['b1'], company: 'Capitale Energia', position: 'Locatário Admin',
    tenant_id: 'c2', floors: [13],
    avatar_bg: '#2F6F8F', avatar_initials: 'AB',
  },
  {
    id: '6', email: 'coliveira@youinc.com.br', password: 'YouInc@2026',
    full_name: 'Cristiane Oliveira', role: 'tenant_admin',
    building_ids: ['b1'], company: 'You Intermediação', position: 'Locatário Admin',
    tenant_id: 'c3', floors: [2, 4],
    avatar_bg: '#4F7F99', avatar_initials: 'CO',
  },
  {
    id: '7', email: 'concierge@360jk.com.br', password: 'Portaria@2026',
    full_name: 'Portaria 360JK', role: 'concierge',
    building_ids: ['b1'], company: 'Administradora', position: 'Recepção / Segurança',
    avatar_bg: '#6B3A3A', avatar_initials: 'P',
  },
  {
    id: '8', email: 'fornecedor@nexus.com.br', password: 'Vendor@2026',
    full_name: 'LuxNexus Manutenção', role: 'vendor',
    building_ids: ['b1'], company: 'LuxNexus Serviços', position: 'Fornecedor — Manutenção',
    avatar_bg: '#8B5E3C', avatar_initials: 'LN',
  },
  {
    id: '9', email: 'gestao@proprietario.com.br', password: 'Prop@2026',
    full_name: 'Gestor Proprietário', role: 'gestor_fundo',
    building_ids: ['b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8', 'b9', 'b10', 'b11', 'b12'],
    company: 'Proprietário — Gestão de Investimentos Imobiliários', position: 'Gestor de Fundo',
    avatar_bg: '#4338CA', avatar_initials: 'GP',
  },
];

export interface Building {
  id: string;
  name: string;
  short_name?: string;
  address: string;
  city: string;
  state: string;
  total_floors: number;
  total_area_m2: number;
  certification_leed_level: string;
  occupancy_rate: number;
  photo_url?: string;
  administrator_company?: string;
  administrator_cnpj?: string;
  status?: 'active' | 'inactive';
  urgent_tickets?: number;
  // Portfolio fields
  segment?: 'offices' | 'logistics' | 'residential' | 'healthcare' | 'mixed';
  fund_name?: string;
  gla_m2?: number;
  occupancy_pct?: number;
  monthly_revenue?: number;
  monthly_noi?: number;
  cap_rate_target?: number;
  wault_months?: number;
  next_expiry_date?: string;
  esg_score?: number;
  portfolio_status?: 'healthy' | 'attention' | 'critical';
  full_address?: string;
  lux_client?: boolean;
}

// ─── Tenant Contracts (Portfolio detail) ──────────────
export interface TenantContract {
  id: string;
  building_id: string;
  unit_id: string;
  tenant_name: string | null;
  tenant_cnpj?: string;
  area_m2: number;
  price_per_m2: number | null;
  contract_type: 'net' | 'gross' | 'semi-gross' | null;
  contract_start?: string;
  contract_end?: string;
  status: 'active' | 'vacant' | 'renewal' | 'termination' | 'closed';
  contract_pdf_url?: string;
  notes?: string;
  /** Campos editáveis manualmente (override da leitura por IA) */
  indice_reajuste?: 'IPCA' | 'IGP-M' | 'INPC' | 'IGP-DI' | 'Fixo';
  data_base_reajuste?: string; // YYYY-MM-DD
  periodicidade_reajuste?: 'anual' | 'semestral' | 'bienal';
  garantia?: 'Fiança bancária' | 'Seguro fiança' | 'Depósito caução' | 'Fiador' | 'Sem garantia';
  dia_vencimento?: number;
  condicao_comercial?: string;
  /** Natureza do contrato de locação (típico x atípico) */
  lease_nature?: 'tipico' | 'atipico';
  /** Segmento de atuação do locatário */
  tenant_segment?: string;
}



export interface BuildingDocument {
  id: string;
  building_id: string;
  doc_type: string;
  doc_name: string;
  valid_until: string;
  pdf_url?: string;
  uploaded_by?: string;
  uploaded_at?: string;
  notes?: string;
}

export interface LuxReport {
  id: string;
  building_id: string;
  reference_month: string;
  savings_amount: number;
  pdf_url?: string;
  published_at: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  category: string;
  sphere: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'open' | 'in_analysis' | 'in_progress' | 'awaiting_approval' | 'completed' | 'cancelled';
  requester: string;
  assigned_to?: string;
  floor: number;
  building_id?: string;
  asset_id?: string;
  created_at: string;
  sla_deadline: string;
  comments_count: number;
  attachments_count: number;
  satisfaction_rating?: number;
  vendor_id?: string;
  timeline: TicketEvent[];
  photos?: string[]; // dataURLs (foto do problema)
}

export interface TicketEvent {
  id: string;
  type: 'created' | 'assigned' | 'status_changed' | 'comment' | 'attachment' | 'escalated' | 'completed';
  description: string;
  author: string;
  created_at: string;
  is_internal?: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: 'normal' | 'high' | 'urgent';
  published_at: string;
  expires_at?: string;
  read: boolean;
  author: { name: string; company: string; position: string; };
  target_type: 'all' | 'floors' | 'companies' | 'specific';
  read_count: number;
  total_recipients: number;
  allow_comments: boolean;
  has_poll: boolean;
  requires_confirmation: boolean;
  building_id?: string;
  unit?: string;
  poll?: {
    question: string;
    type: 'single' | 'multiple';
    options: { id: string; text: string; votes: number }[];
    ends_at: string;
  };
  comments?: { id: string; author: string; company: string; text: string; created_at: string }[];
}

export interface Contract {
  id: string;
  number: string;
  tenant_name: string;
  cnpj: string;
  owner: string;
  floors: number[];
  area_m2: number;
  start_date: string;
  end_date: string;
  monthly_value: number;
  adjustment_index: string;
  next_adjustment: string;
  status: 'active' | 'expiring' | 'expired' | 'negotiation' | 'terminated';
  payments: ContractPayment[];
  adjustments: ContractAdjustment[];
  documents: ContractDocument[];
}

export interface ContractPayment {
  month: string;
  value: number;
  status: 'paid' | 'pending' | 'overdue';
  paid_at?: string;
}

export interface ContractAdjustment {
  date: string;
  index: string;
  percentage: number;
  value_before: number;
  value_after: number;
}

export interface ContractDocument {
  id: string;
  name: string;
  type: string;
  size: string;
  uploaded_at: string;
}

export interface Room {
  id: string;
  name: string;
  floor: number;
  capacity: number;
  type: string;
  amenities: string[];
  available: boolean;
  color: string;
}

export interface Reservation {
  id: string;
  room_id: string;
  room_name: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  tenant: string;
  user: string;
  participants: number;
  status: 'confirmed' | 'pending' | 'cancelled' | 'in_progress' | 'completed';
  resources: string[];
}

export interface Visitor {
  id: string;
  name: string;
  company: string;
  document: string;
  destination_floor: number;
  destination_company: string;
  host_name: string;
  scheduled_at: string;
  checked_in_at?: string;
  checked_out_at?: string;
  status: 'scheduled' | 'waiting' | 'present' | 'departed' | 'denied';
  type: 'guest' | 'service' | 'delivery' | 'client' | 'candidate';
  auto_release: boolean;
  qr_code: string;
  photo_url?: string;
  recurrent: boolean;
}

export interface Vendor {
  id: string;
  name: string;
  cnpj: string;
  category: string;
  description: string;
  rating: number;
  reviews_count: number;
  contracts_count: number;
  status: 'approved' | 'pending' | 'suspended' | 'rejected';
  logo_url?: string;
  certifications: string[];
  services: string[];
  can_be_rated?: boolean;
}

export interface VendorReview {
  id: string;
  vendor_id: string;
  ticket_id: string;
  rating: number;
  comment?: string;
  recommend: boolean;
  reviewer_name: string;
  reviewer_company: string;
  created_at: string;
}

export interface NexusSolution {
  id: string;
  slug: string;
  name: string;
  icon: string;
  badge: string;
  description: string;
  tags: string[];
  cta: string;
}

export interface Quotation {
  id: string;
  title: string;
  category: string;
  description: string;
  deadline: string;
  budget_max?: number;
  proposals_count: number;
  status: 'open' | 'closed' | 'awarded';
  created_by: string;
}

export interface FloorConfig {
  floor: number;
  name: string;
  type: 'subsolo' | 'terreo' | 'mezanino' | 'corporativo' | 'sala_reuniao';
  area_m2: number;
  status: 'occupied' | 'partial' | 'vacant' | 'work' | 'urgent' | 'building_use';
  tenant: string;
  tenants?: { name: string; suites: string; employees: number; email: string; contact?: string }[];
  employees?: number;
  special_status?: string;
  special_icon?: string;
  tickets_count: number;
  works?: { title: string; status: string; progress: number; end_date: string }[];
}

export interface ReportFolder {
  id: string;
  name: string;
  icon: string;
  children?: ReportFolder[];
  files?: ReportFile[];
}

export interface ReportFile {
  id: string;
  name: string;
  type: 'pdf' | 'xlsx' | 'docx' | 'png' | 'jpg';
  size: string;
  uploaded_by: string;
  uploaded_at: string;
  visibility_scope?: 'internal' | 'specific_floors' | 'specific_tenants' | 'all_tenants' | 'public';
  visible_floor_ids?: number[];
  visible_tenant_names?: string[];
  responsible_company?: string;
  issued_at?: string;
  expires_at?: string;
}

// ─── Mock Users (single ref) ──────────────────────────
export const mockUser: User = mockUsers[1]; // Tatiana as default

export const HGRE11_ASSET_IDS = ['b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8', 'b9', 'b10', 'b11', 'b12', 'b13', 'b14'] as const;
export type HGRE11AssetId = typeof HGRE11_ASSET_IDS[number];
export const isHGRE11Asset = (buildingId?: string | null): buildingId is HGRE11AssetId =>
  !!buildingId && (HGRE11_ASSET_IDS as readonly string[]).includes(buildingId);


// ─── Mock Buildings ───────────────
export const mockBuildings: Building[] = [
  {
    id: 'b1', name: 'Condomínio 360JK', short_name: '360JK',
    address: 'Av. Juscelino Kubitschek, 360 — Itaim Bibi, SP', city: 'São Paulo', state: 'SP',
    total_floors: 18, total_area_m2: 35000, certification_leed_level: 'Gold', occupancy_rate: 100,
    lux_client: false,
    administrator_company: 'Administradora', administrator_cnpj: '', status: 'active', urgent_tickets: 2,
    full_address: 'Av. Juscelino Kubitschek, 360 — Itaim Bibi, SP',
  },
  // ─── Carteira HGRE11 — Patria Escritórios FII (13 ativos, 143.387 m² de ABL) ───
  {
    id: 'b12', name: 'Chucri Zaidan', short_name: 'Chucri Zaidan',
    address: 'Av. Dr. Chucri Zaidan, 1550 — Vila Cordeiro, SP', city: 'São Paulo', state: 'SP',
    total_floors: 17, total_area_m2: 22810, certification_leed_level: 'Gold', occupancy_rate: 100,
    administrator_company: 'Administradora', status: 'active', urgent_tickets: 0,
    segment: 'offices', fund_name: 'HGRE11 — Patria Escritórios FII', gla_m2: 22810, occupancy_pct: 100,
    monthly_revenue: 2564000, monthly_noi: 2256000, cap_rate_target: 8.00, wault_months: 59,
    next_expiry_date: '2031-06-30', esg_score: 82, portfolio_status: 'healthy',
    full_address: 'Av. Dr. Chucri Zaidan, 1550 — Vila Cordeiro, São Paulo, SP',
  },
  {
    id: 'b7', name: 'Martiniano', short_name: 'Martiniano',
    address: 'Rua Martiniano de Carvalho, 851 — Bela Vista, SP', city: 'São Paulo', state: 'SP',
    total_floors: 15, total_area_m2: 20060, certification_leed_level: '', occupancy_rate: 96,
    administrator_company: 'Administradora', status: 'active', urgent_tickets: 0,
    segment: 'offices', fund_name: 'HGRE11 — Patria Escritórios FII', gla_m2: 20060, occupancy_pct: 96,
    monthly_revenue: 1823000, monthly_noi: 1604000, cap_rate_target: 8.20, wault_months: 73,
    next_expiry_date: '2032-08-31', esg_score: 76, portfolio_status: 'healthy',
    full_address: 'Rua Martiniano de Carvalho, 851 — Bela Vista, São Paulo, SP',
  },
  {
    id: 'b8', name: 'Sêneca', short_name: 'Sêneca',
    address: 'Rua Sêneca, 61 — Vila Olímpia, SP', city: 'São Paulo', state: 'SP',
    total_floors: 20, total_area_m2: 26963, certification_leed_level: 'Platinum', occupancy_rate: 98,
    administrator_company: 'Administradora', status: 'active', urgent_tickets: 0,
    segment: 'offices', fund_name: 'HGRE11 — Patria Escritórios FII', gla_m2: 26963, occupancy_pct: 98,
    monthly_revenue: 2739000, monthly_noi: 2410000, cap_rate_target: 7.60, wault_months: 84,
    next_expiry_date: '2033-07-31', esg_score: 88, portfolio_status: 'healthy',
    full_address: 'Rua Sêneca, 61 — Vila Olímpia, São Paulo, SP',
  },
  {
    id: 'b2', name: 'Paulista Star', short_name: 'Paulista Star',
    address: 'Av. Paulista, 2300 — Bela Vista, SP', city: 'São Paulo', state: 'SP',
    total_floors: 14, total_area_m2: 13702, certification_leed_level: '', occupancy_rate: 100,
    administrator_company: 'Administradora', status: 'active', urgent_tickets: 0,
    segment: 'offices', fund_name: 'HGRE11 — Patria Escritórios FII', gla_m2: 13702, occupancy_pct: 100,
    monthly_revenue: 1546000, monthly_noi: 1360000, cap_rate_target: 8.10, wault_months: 8,
    next_expiry_date: '2027-04-30', esg_score: 74, portfolio_status: 'attention',
    full_address: 'Av. Paulista, 2300 — Bela Vista, São Paulo, SP',
  },
  {
    id: 'b4', name: 'Berrini One', short_name: 'Berrini One',
    address: 'Av. Eng. Luís Carlos Berrini, 105 — Brooklin Novo, SP', city: 'São Paulo', state: 'SP',
    total_floors: 18, total_area_m2: 6007, certification_leed_level: 'Gold', occupancy_rate: 100,
    administrator_company: 'Administradora', status: 'active', urgent_tickets: 0,
    segment: 'offices', fund_name: 'HGRE11 — Patria Escritórios FII', gla_m2: 6007, occupancy_pct: 100,
    monthly_revenue: 874000, monthly_noi: 769000, cap_rate_target: 7.50, wault_months: 24,
    next_expiry_date: '2028-08-31', esg_score: 85, portfolio_status: 'healthy',
    full_address: 'Av. Eng. Luís Carlos Berrini, 105 — Brooklin Novo, São Paulo, SP',
  },
  {
    id: 'b3', name: 'Jatobá', short_name: 'Jatobá',
    address: 'Alameda Tocantins, 125 — Alphaville, Barueri, SP', city: 'Barueri', state: 'SP',
    total_floors: 12, total_area_m2: 16739, certification_leed_level: '', occupancy_rate: 70,
    administrator_company: 'Administradora', status: 'active', urgent_tickets: 0,
    segment: 'offices', fund_name: 'HGRE11 — Patria Escritórios FII', gla_m2: 16739, occupancy_pct: 70,
    monthly_revenue: 599000, monthly_noi: 527000, cap_rate_target: 8.90, wault_months: 84,
    next_expiry_date: '2033-07-31', esg_score: 68, portfolio_status: 'critical',
    full_address: 'Alameda Tocantins, 125 — Alphaville Industrial, Barueri, SP',
  },
  {
    id: 'b14', name: 'Alegria', short_name: 'Alegria',
    address: 'Rua da Alegria, 96 — Brás, SP', city: 'São Paulo', state: 'SP',
    total_floors: 4, total_area_m2: 0, certification_leed_level: '', occupancy_rate: 0,
    administrator_company: 'Administradora', status: 'active', urgent_tickets: 0,
    segment: 'offices', fund_name: 'HGRE11 — Patria Escritórios FII', gla_m2: 0, occupancy_pct: 0,
    monthly_revenue: 0, monthly_noi: 0, cap_rate_target: 0, wault_months: 0,
    esg_score: 55, portfolio_status: 'attention',
    full_address: 'Rua da Alegria, 96 — Brás, São Paulo, SP',
  },
  {
    id: 'b5', name: 'Guaíba', short_name: 'Guaíba',
    address: 'Av. Carlos Gomes, 222 — Boa Vista, Porto Alegre, RS', city: 'Porto Alegre', state: 'RS',
    total_floors: 12, total_area_m2: 10665, certification_leed_level: '', occupancy_rate: 79,
    administrator_company: 'Administradora', status: 'active', urgent_tickets: 0,
    segment: 'offices', fund_name: 'HGRE11 — Patria Escritórios FII', gla_m2: 10665, occupancy_pct: 79,
    monthly_revenue: 425000, monthly_noi: 374000, cap_rate_target: 9.10, wault_months: 23,
    next_expiry_date: '2028-07-31', esg_score: 62, portfolio_status: 'critical',
    full_address: 'Av. Carlos Gomes, 222 — Boa Vista, Porto Alegre, RS',
  },
  {
    id: 'b6', name: 'Taboão', short_name: 'Taboão',
    address: 'Rod. Régis Bittencourt, km 271 — Taboão da Serra, SP', city: 'Taboão da Serra', state: 'SP',
    total_floors: 6, total_area_m2: 16488, certification_leed_level: '', occupancy_rate: 100,
    administrator_company: 'Administradora', status: 'active', urgent_tickets: 0,
    segment: 'offices', fund_name: 'HGRE11 — Patria Escritórios FII', gla_m2: 16488, occupancy_pct: 100,
    monthly_revenue: 323000, monthly_noi: 284000, cap_rate_target: 9.40, wault_months: 56,
    next_expiry_date: '2031-03-31', esg_score: 60, portfolio_status: 'healthy',
    full_address: 'Rod. Régis Bittencourt, km 271 — Taboão da Serra, SP',
  },
  {
    id: 'b9', name: 'Roberto Sampaio Ferreira', short_name: 'R. Sampaio Ferreira',
    address: 'Rua Roberto Sampaio Ferreira, 250 — Santo Amaro, SP', city: 'São Paulo', state: 'SP',
    total_floors: 8, total_area_m2: 3520, certification_leed_level: '', occupancy_rate: 100,
    administrator_company: 'Administradora', status: 'active', urgent_tickets: 0,
    segment: 'offices', fund_name: 'HGRE11 — Patria Escritórios FII', gla_m2: 3520, occupancy_pct: 100,
    monthly_revenue: 235000, monthly_noi: 207000, cap_rate_target: 9.00, wault_months: 25,
    next_expiry_date: '2028-09-30', esg_score: 58, portfolio_status: 'healthy',
    full_address: 'Rua Roberto Sampaio Ferreira, 250 — Santo Amaro, São Paulo, SP',
  },
  {
    id: 'b10', name: 'Teleporto', short_name: 'Teleporto',
    address: 'Av. Presidente Vargas, 1000 — Centro, Rio de Janeiro, RJ', city: 'Rio de Janeiro', state: 'RJ',
    total_floors: 22, total_area_m2: 2310, certification_leed_level: '', occupancy_rate: 80,
    administrator_company: 'Administradora', status: 'active', urgent_tickets: 0,
    segment: 'offices', fund_name: 'HGRE11 — Patria Escritórios FII', gla_m2: 2310, occupancy_pct: 80,
    monthly_revenue: 76000, monthly_noi: 67000, cap_rate_target: 9.60, wault_months: 30,
    next_expiry_date: '2029-02-28', esg_score: 57, portfolio_status: 'attention',
    full_address: 'Av. Presidente Vargas, 1000 — Centro, Rio de Janeiro, RJ',
    lux_client: true,
  },
  {
    id: 'b11', name: 'Cenesp', short_name: 'Cenesp',
    address: 'Av. Maria Coelho Aguiar, 215 — Santo Amaro, SP', city: 'São Paulo', state: 'SP',
    total_floors: 10, total_area_m2: 3070, certification_leed_level: '', occupancy_rate: 100,
    administrator_company: 'Administradora', status: 'active', urgent_tickets: 0,
    segment: 'offices', fund_name: 'HGRE11 — Patria Escritórios FII', gla_m2: 3070, occupancy_pct: 100,
    monthly_revenue: 78000, monthly_noi: 69000, cap_rate_target: 9.30, wault_months: 49,
    next_expiry_date: '2030-08-31', esg_score: 56, portfolio_status: 'healthy',
    full_address: 'Av. Maria Coelho Aguiar, 215 — Santo Amaro, São Paulo, SP',
  },
  {
    id: 'b13', name: 'Transatlântico', short_name: 'Transatlântico',
    address: 'Rua Bela Cintra, 1149 — Consolação, SP', city: 'São Paulo', state: 'SP',
    total_floors: 9, total_area_m2: 1052, certification_leed_level: '', occupancy_rate: 50,
    administrator_company: 'Administradora', status: 'active', urgent_tickets: 0,
    segment: 'offices', fund_name: 'HGRE11 — Patria Escritórios FII', gla_m2: 1052, occupancy_pct: 50,
    monthly_revenue: 19000, monthly_noi: 17000, cap_rate_target: 9.80, wault_months: 0,
    esg_score: 52, portfolio_status: 'critical',
    full_address: 'Rua Bela Cintra, 1149 — Consolação, São Paulo, SP',
  },
];

export const getHGRE11PortfolioBuildings = () => mockBuildings.filter((b) => isHGRE11Asset(b.id));

// ─── Tenant Contracts seed data ──────────────────────
// Chucri Zaidan (b12) — HGRE11 portfolio: 8 locatários corporativos
export const mockTenantContracts: TenantContract[] = [
  { id: 'tc1', building_id: 'b12', unit_id: 'Conjunto A1', tenant_name: 'Vivo (Telefônica Brasil)', tenant_cnpj: '11.260.134/0001-50', area_m2: 3358, price_per_m2: 110, contract_type: 'net', contract_start: '2022-03-01', contract_end: '2027-02-28', status: 'active', lease_nature: 'tipico', tenant_segment: 'Varejo' },
  { id: 'tc2', building_id: 'b12', unit_id: 'Conjunto A2', tenant_name: 'Totvs S.A.', tenant_cnpj: '07.526.557/0001-00', area_m2: 4029, price_per_m2: 106, contract_type: 'net', contract_start: '2021-08-01', contract_end: '2026-07-31', status: 'active', lease_nature: 'atipico', tenant_segment: 'Bebidas' },
  { id: 'tc3', building_id: 'b12', unit_id: 'Conjunto B1', tenant_name: 'Befly Viagens', tenant_cnpj: '13.453.928/0001-77', area_m2: 2910, price_per_m2: 115, contract_type: 'net', contract_start: '2023-01-01', contract_end: '2028-12-31', status: 'active', lease_nature: 'atipico', tenant_segment: 'Serviços Corporativos' },
  { id: 'tc4', building_id: 'b12', unit_id: 'Conjunto B2', tenant_name: 'Hospital Sírio-Libanês', tenant_cnpj: '54.137.319/0001-03', area_m2: 2597, price_per_m2: 101, contract_type: 'gross', contract_start: '2022-11-01', contract_end: '2026-10-31', status: 'active', lease_nature: 'tipico', tenant_segment: 'Varejo' },
  { id: 'tc5', building_id: 'b12', unit_id: 'Conjunto C1', tenant_name: 'BP Brasil', tenant_cnpj: '04.870.532/0001-66', area_m2: 1880, price_per_m2: 97, contract_type: 'semi-gross', contract_start: '2024-02-01', contract_end: '2027-01-31', status: 'active', lease_nature: 'tipico', tenant_segment: 'Serviços' },
  { id: 'tc6', building_id: 'b12', unit_id: 'Conjunto C2', tenant_name: 'DHL', tenant_cnpj: '03.420.926/0001-08', area_m2: 3492, price_per_m2: 120, contract_type: 'net', contract_start: '2023-06-01', contract_end: '2028-05-31', status: 'active', lease_nature: 'atipico', tenant_segment: 'Serviços Corporativos' },
  { id: 'tc7', building_id: 'b12', unit_id: 'Conjunto D1', tenant_name: 'WeWork Brasil', tenant_cnpj: '08.913.572/0001-19', area_m2: 2015, price_per_m2: 106, contract_type: 'gross', contract_start: '2024-04-01', contract_end: '2027-03-31', status: 'active', lease_nature: 'tipico', tenant_segment: 'Serviços Corporativos' },
  { id: 'tc8', building_id: 'b12', unit_id: 'Conjunto D2', tenant_name: 'Deloitte Brasil', tenant_cnpj: '05.629.244/0001-50', area_m2: 1639, price_per_m2: 101, contract_type: 'net', contract_start: '2023-09-01', contract_end: '2026-08-31', status: 'active', lease_nature: 'tipico', tenant_segment: 'Vestuário' },

  { id: 'tc9', building_id: 'b12', unit_id: 'Conjunto D3', tenant_name: null, area_m2: 913, price_per_m2: null, contract_type: null, status: 'vacant' },
];

// ─── Building Documents seed data ────────────────────
const today = new Date();
const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r.toISOString().slice(0, 10); };

export const mockBuildingDocuments: BuildingDocument[] = [
  { id: 'bd1', building_id: 'b8', doc_type: 'avcb', doc_name: 'AVCB', valid_until: addDays(today, 45), uploaded_by: 'Tatiana Caracciolo', uploaded_at: '2025-01-15' },
  { id: 'bd2', building_id: 'b8', doc_type: 'pmoc', doc_name: 'PMOC', valid_until: addDays(today, 90), uploaded_by: 'Tatiana Caracciolo', uploaded_at: '2025-02-10' },
  { id: 'bd3', building_id: 'b8', doc_type: 'elevator', doc_name: 'Laudo de Elevadores', valid_until: addDays(today, 200), uploaded_by: 'Tatiana Caracciolo', uploaded_at: '2024-12-20' },
  { id: 'bd4', building_id: 'b8', doc_type: 'insurance', doc_name: 'Seguro Predial', valid_until: addDays(today, 180), uploaded_by: 'Tatiana Caracciolo', uploaded_at: '2025-01-05' },
  { id: 'bd5', building_id: 'b8', doc_type: 'permit', doc_name: 'Alvará de Funcionamento', valid_until: addDays(today, 150), uploaded_by: 'Tatiana Caracciolo', uploaded_at: '2024-11-30' },
];

// ─── Lux Reports seed data ───────────────────────────
export const mockLuxReports: LuxReport[] = [
  { id: 'lr1', building_id: 'b8', reference_month: '2026-01-01', savings_amount: 14320, pdf_url: '#', published_at: '2026-02-05' },
  { id: 'lr2', building_id: 'b8', reference_month: '2026-02-01', savings_amount: 12890, pdf_url: '#', published_at: '2026-03-05' },
  { id: 'lr3', building_id: 'b8', reference_month: '2026-03-01', savings_amount: 15140, pdf_url: '#', published_at: '2026-04-02' },
];

// ─── LEED Data seed ──────────────────────────────
export interface LEEDData {
  id: string;
  building_id: string;
  certification_status: 'certified' | 'in_progress' | 'none';
  certification_level?: 'certified' | 'silver' | 'gold' | 'platinum';
  total_score: number;
  max_score: number;
  categories: { name: string; obtained: number; max: number }[];
}

export const mockLEEDData: LEEDData[] = [
  {
    id: 'leed1', building_id: 'b8', certification_status: 'in_progress', certification_level: 'gold',
    total_score: 72, max_score: 110,
    categories: [
      { name: 'Localização e Transporte', obtained: 14, max: 16 },
      { name: 'Espaço Sustentável', obtained: 8, max: 10 },
      { name: 'Eficiência Hídrica', obtained: 9, max: 11 },
      { name: 'Energia e Atmosfera', obtained: 22, max: 33 },
      { name: 'Materiais e Recursos', obtained: 10, max: 13 },
      { name: 'Qualidade do Ambiente Interno', obtained: 9, max: 16 },
    ],
  },
  {
    id: 'leed2', building_id: 'b1', certification_status: 'none', total_score: 0, max_score: 110, categories: [],
  },
];

// ─── I-REC Certificates seed ─────────────────────────
export interface IRECCertificate {
  id: string;
  building_id: string;
  certificate_code: string;
  mwh_amount: number;
  period_start: string;
  period_end: string;
  issued_at: string;
  pdf_url?: string;
  status: 'active' | 'pending' | 'not_contracted';
}

export const mockIRECCertificates: IRECCertificate[] = [
  { id: 'irec1', building_id: 'b8', certificate_code: 'IREC-BR-2026-001', mwh_amount: 42.5, period_start: '2026-01-01', period_end: '2026-01-31', issued_at: '2026-02-10', pdf_url: '#', status: 'active' },
  { id: 'irec2', building_id: 'b8', certificate_code: 'IREC-BR-2026-002', mwh_amount: 38.2, period_start: '2026-02-01', period_end: '2026-02-28', issued_at: '2026-03-08', pdf_url: '#', status: 'active' },
  { id: 'irec3', building_id: 'b8', certificate_code: 'IREC-BR-2026-003', mwh_amount: 44.1, period_start: '2026-03-01', period_end: '2026-03-31', issued_at: '2026-04-05', pdf_url: '#', status: 'active' },
];

// ─── ESG Sustainability Module Data ─────────────────────────
export const mockESGData = {
  score: { atual: 70, meta: 85 },
  relatorioAnual: { prazo: '2026-04-30', status: 'em_elaboracao' },
  compensacaoCarbono: { status: 'pendente', prazo: '2026-05-15', toneladas: 12.4, custo: 4340, fornecedor: 'ClimaFund Brasil' },
  metricas: [
    { mes: 'Out/25', score: 62, carbono: 14.2, energia: 19.8, agua: 4.1, residuos: 3.2 },
    { mes: 'Nov/25', score: 64, carbono: 13.8, energia: 19.1, agua: 3.9, residuos: 3.0 },
    { mes: 'Dez/25', score: 66, carbono: 13.1, energia: 18.7, agua: 3.8, residuos: 2.9 },
    { mes: 'Jan/26', score: 68, carbono: 12.9, energia: 18.4, agua: 3.7, residuos: 2.8 },
    { mes: 'Fev/26', score: 69, carbono: 12.6, energia: 18.2, agua: 3.8, residuos: 2.8 },
    { mes: 'Mar/26', score: 70, carbono: 12.4, energia: 18.2, agua: 3.8, residuos: 2.8 },
  ],
  categorias: [
    { nome: 'Energia',    peso: 30, pontos: 22, meta: 26 },
    { nome: 'Água',       peso: 20, pontos: 15, meta: 17 },
    { nome: 'Resíduos',   peso: 15, pontos: 10, meta: 13 },
    { nome: 'Carbono',    peso: 20, pontos: 13, meta: 17 },
    { nome: 'Governança', peso: 15, pontos: 10, meta: 12 },
  ],
};

export const mockLEEDCertData = {
  certificacao: {
    nivel: 'GOLD', status: 'em_processo',
    pontuacaoAtual: 72, pontuacaoMaxima: 110, pontuacaoMeta: 80,
    prazoSubmissao: '2026-06-30',
    prazoAuditoria: '2026-09-15',
    assessoria: {
      empresa: 'LUX|ESG Consultoria', contato: 'Ana Beatriz Campos',
      email: 'ana.campos@luxesg.com.br', telefone: '+55 11 3456-7890',
      reuniaoProxima: '2026-04-18',
    },
  },
  categorias: [
    { nome: 'Localização e Transporte', codigo: 'LT', pontos: 10, maximo: 16 },
    { nome: 'Espaço Sustentável',       codigo: 'SS', pontos:  8, maximo: 10 },
    { nome: 'Eficiência Hídrica',       codigo: 'WE', pontos:  9, maximo: 11 },
    { nome: 'Energia e Atmosfera',      codigo: 'EA', pontos: 28, maximo: 38 },
    { nome: 'Materiais e Recursos',     codigo: 'MR', pontos:  9, maximo: 13 },
    { nome: 'Qualidade Ambiental Int.', codigo: 'IEQ',pontos:  8, maximo: 16 },
  ],
  acoesPendentes: [
    { categoria: 'EA', acao: 'Comissionamento do sistema de ar-condicionado', prazo: '2026-05-31', impacto: 4, status: 'em_andamento' },
    { categoria: 'IEQ', acao: 'Instalar sensores CO₂ nos pavimentos',         prazo: '2026-06-30', impacto: 4, status: 'pendente' },
    { categoria: 'LT', acao: 'Instalar carregadores para veículos elétricos', prazo: '2026-05-31', impacto: 4, status: 'em_andamento' },
    { categoria: 'WE', acao: 'Gestão de torres de resfriamento',              prazo: '2026-04-30', impacto: 2, status: 'atrasado' },
    { categoria: 'MR', acao: 'Compras de materiais sustentáveis',             prazo: '2026-07-31', impacto: 3, status: 'pendente' },
  ],
};

export const mockMercadoLivreData = {
  contrato: {
    numero: 'ML-2024-00847', comercializadora: 'ENGIE Soluções Energéticas',
    dataInicio: '2024-01-01', dataFim: '2026-12-31',
    renovacaoPrazo: '2026-09-30',
    precoMwh: 215.00, volumeContratado: 35,
    fonte: '100% Hidrelétrica',
    contato: 'Pedro Henrique Lara',
    email: 'pedro.lara@engie.com.br', telefone: '+55 11 4003-9090',
  },
  historico: [
    { mes: 'Out/25', consumo: 33.2, economia: 6840, tarifaCativa: 298, tarifaML: 215 },
    { mes: 'Nov/25', consumo: 34.1, economia: 7120, tarifaCativa: 301, tarifaML: 215 },
    { mes: 'Dez/25', consumo: 34.8, economia: 7450, tarifaCativa: 299, tarifaML: 215 },
    { mes: 'Jan/26', consumo: 33.9, economia: 7230, tarifaCativa: 305, tarifaML: 215 },
    { mes: 'Fev/26', consumo: 34.4, economia: 7380, tarifaCativa: 306, tarifaML: 215 },
    { mes: 'Mar/26', consumo: 34.2, economia: 7330, tarifaCativa: 307, tarifaML: 215 },
  ],
  relatorios: [
    { mes: 'Dez/2025', publicado: '2026-01-05' },
    { mes: 'Jan/2026', publicado: '2026-02-03' },
    { mes: 'Fev/2026', publicado: '2026-03-04' },
    { mes: 'Mar/2026', publicado: null },
  ],
};

export const mockIRECData = {
  resumo: {
    totalMwh: 124.8, periodoInicio: 'Dez/2025', periodoFim: 'Mar/2026',
    status: 'ativo', custoTotal: 4368, custoMwh: 35,
    registrador: 'APX Group', padrao: 'I-REC Standard E001',
  },
  proximaEmissao: { data: '2026-05-01', mwhPrevisto: 35, custoEstimado: 1225, status: 'agendada' },
  validade: { dataExpiracao: '2027-03-31' },
  linkLEED: { credito: 'EA Credit: Renewable Energy Production', pontos: '3 de 5', cobertura: '98% do Scope 2' },
  certificados: [
    { id: 'IREC-BR-2026-001', periodo: 'Dez/2025', mwh: 33.2, emissao: '2026-01-10', validade: '2027-01-10', status: 'ativo' as const,    custo: 1162 },
    { id: 'IREC-BR-2026-002', periodo: 'Jan/2026', mwh: 33.9, emissao: '2026-02-08', validade: '2027-02-08', status: 'ativo' as const,    custo: 1186.50 },
    { id: 'IREC-BR-2026-003', periodo: 'Fev/2026', mwh: 34.4, emissao: '2026-03-07', validade: '2027-03-07', status: 'ativo' as const,    custo: 1204 },
    { id: 'IREC-BR-2026-004', periodo: 'Mar/2026', mwh: 34.2, emissao: null,          validade: null,          status: 'pendente' as const, custo: 1197 },
  ],
};


export interface PortfolioBudget {
  building_name: string;
  month: number;
  year: number;
  budgeted_revenue: number;
  realized_revenue: number;
}

export const mockPortfolioBudgets: PortfolioBudget[] = [
  { building_name: 'Paulista Star', month: 3, year: 2026, budgeted_revenue: 1880000, realized_revenue: 1850000 },
  { building_name: 'Jatobá', month: 3, year: 2026, budgeted_revenue: 1450000, realized_revenue: 1420000 },
  { building_name: 'Berrini One', month: 3, year: 2026, budgeted_revenue: 800000, realized_revenue: 780000 },
  { building_name: 'Guaíba', month: 3, year: 2026, budgeted_revenue: 1200000, realized_revenue: 1180000 },
  { building_name: 'Taboão', month: 3, year: 2026, budgeted_revenue: 1000000, realized_revenue: 980000 },
  { building_name: 'Martiniano', month: 3, year: 2026, budgeted_revenue: 840000, realized_revenue: 820000 },
  { building_name: 'Sêneca', month: 3, year: 2026, budgeted_revenue: 700000, realized_revenue: 690000 },
  { building_name: 'Roberto Sampaio Ferreira', month: 3, year: 2026, budgeted_revenue: 575000, realized_revenue: 560000 },
  { building_name: 'Teleporto', month: 3, year: 2026, budgeted_revenue: 735000, realized_revenue: 720000 },
  { building_name: 'Cenesp', month: 3, year: 2026, budgeted_revenue: 900000, realized_revenue: 880000 },
  { building_name: 'Chucri Zaidan', month: 3, year: 2026, budgeted_revenue: 1140000, realized_revenue: 1120000 },
];

export interface Fund {
  id: string;
  name: string;
  type: 'private_equity' | 'listed';
  total_aum: number;
}

export const mockFunds: Fund[] = [
  { id: 'f1', name: 'Fundo Proprietário Corporativo I', type: 'private_equity', total_aum: 185000000 },
  { id: 'f2', name: 'Fundo Proprietário Corporativo II', type: 'private_equity', total_aum: 142000000 },
  { id: 'f3', name: 'Fundo Proprietário Renda Urbana', type: 'private_equity', total_aum: 210000000 },
  { id: 'f4', name: 'Fundo Proprietário Logística', type: 'private_equity', total_aum: 98000000 },
];

// ─── Mock Tickets — 360JK Real ────────────────────────
export const mockTickets: Ticket[] = [
  {
    id: 'CH-001', title: 'Solicitação de limpeza pós-evento — 7º andar',
    description: 'Necessário limpeza extra na sala de reuniões do 7º andar após evento corporativo da Lux Energia.',
    category: 'Limpeza', sphere: 'Limpeza e Conservação', priority: 'normal', status: 'open',
    requester: 'Lux Energia', floor: 7, building_id: 'b1',
    created_at: '2026-03-09T08:30:00', sla_deadline: '2026-03-11T08:30:00',
    comments_count: 0, attachments_count: 0, timeline: [
      { id: 'e1', type: 'created', description: 'Chamado aberto por Lux Energia', author: 'Lux Energia — Administrador', created_at: '2026-03-09T08:30:00' },
    ]
  },
  {
    id: 'CH-002', title: 'Ar-condicionado com ruído — sala reunião 13º andar',
    description: 'O ar condicionado da sala de reunião principal do 13º andar está emitindo ruído constante. Solicitar inspeção técnica.',
    category: 'Climatização', sphere: 'Manutenção', priority: 'high', status: 'in_progress',
    requester: 'Capitale', assigned_to: 'ClimaTech Solutions', floor: 13, building_id: 'b1', vendor_id: 'vd1', asset_id: 'AT-002',
    created_at: '2026-03-07T14:00:00', sla_deadline: '2026-03-09T14:00:00',
    comments_count: 2, attachments_count: 1, timeline: [
      { id: 'e2', type: 'created', description: 'Chamado aberto por Capitale', author: 'Capitale — Administrador', created_at: '2026-03-07T14:00:00' },
      { id: 'e3', type: 'assigned', description: 'Atribuído a ClimaTech Solutions', author: 'Tatiana Caracciolo', created_at: '2026-03-07T15:00:00' },
      { id: 'e4', type: 'status_changed', description: 'Status alterado para Em Execução', author: 'ClimaTech Solutions', created_at: '2026-03-08T09:00:00' },
    ]
  },
  {
    id: 'CH-003', title: 'Porta de acesso travada — 3º andar',
    description: 'Porta de acesso principal do 3º andar (You.inc) não está abrindo com o crachá.',
    category: 'Manutenção', sphere: 'Segurança Patrimonial', priority: 'high', status: 'in_analysis',
    requester: 'You.inc', assigned_to: 'SecTech Segurança', floor: 3, building_id: 'b1', vendor_id: 'vd2',
    created_at: '2026-03-08T16:45:00', sla_deadline: '2026-03-09T16:45:00',
    comments_count: 1, attachments_count: 0, timeline: [
      { id: 'e5', type: 'created', description: 'Chamado aberto por You.inc', author: 'You.inc — Administrador', created_at: '2026-03-08T16:45:00' },
      { id: 'e6', type: 'assigned', description: 'Atribuído a SecTech Segurança', author: 'Tatiana Caracciolo', created_at: '2026-03-08T17:00:00' },
      { id: 'e7', type: 'status_changed', description: 'Status alterado para Em Análise', author: 'SecTech Segurança', created_at: '2026-03-09T08:00:00' },
    ]
  },
  {
    id: 'CH-004', title: 'Manutenção de bicicletário — SS3',
    description: 'Continuidade da reforma do bicicletário no subsolo 3.',
    category: 'Manutenção', sphere: 'Gestão de Ativos', priority: 'normal', status: 'in_progress',
    requester: 'Gestão (Tatiana)', assigned_to: 'Empreiteira SS3', floor: -3, building_id: 'b1',
    created_at: '2026-02-15T08:00:00', sla_deadline: '2026-04-30T08:00:00',
    comments_count: 5, attachments_count: 3, timeline: [
      { id: 'e8', type: 'created', description: 'Chamado aberto pela Gestão', author: 'Tatiana Caracciolo', created_at: '2026-02-15T08:00:00' },
      { id: 'e9', type: 'status_changed', description: 'Status alterado para Em Execução', author: 'Tatiana Caracciolo', created_at: '2026-02-20T08:00:00' },
    ]
  },
  {
    id: 'CH-005', title: 'Instalação vagas EV — SS2',
    description: 'Instalação de 20 pontos de recarga para veículos elétricos no subsolo 2.',
    category: 'Estacionamento', sphere: 'Gestão de Ativos', priority: 'normal', status: 'in_progress',
    requester: 'Gestão (Tatiana)', assigned_to: 'EV Solutions', floor: -2, building_id: 'b1',
    created_at: '2026-02-01T08:00:00', sla_deadline: '2026-05-15T08:00:00',
    comments_count: 4, attachments_count: 2, timeline: [
      { id: 'e10', type: 'created', description: 'Chamado aberto pela Gestão', author: 'Tatiana Caracciolo', created_at: '2026-02-01T08:00:00' },
    ]
  },
  {
    id: 'CH-006', title: 'Lâmpada queimada corredor — 2º andar',
    description: 'Lâmpada LED do corredor principal do 2º andar queimada.',
    category: 'Elétrica', sphere: 'Manutenção', priority: 'low', status: 'completed',
    requester: 'You.inc', assigned_to: 'Manutenção Interna', floor: 2, building_id: 'b1', vendor_id: 'vd5', asset_id: 'AT-008',
    created_at: '2026-03-01T10:00:00', sla_deadline: '2026-03-03T10:00:00',
    comments_count: 1, attachments_count: 0, satisfaction_rating: 5, timeline: [
      { id: 'e11', type: 'created', description: 'Chamado aberto por You.inc', author: 'You.inc — Administrador', created_at: '2026-03-01T10:00:00' },
      { id: 'e12', type: 'completed', description: 'Chamado concluído', author: 'Manutenção Interna', created_at: '2026-03-01T16:00:00' },
    ]
  },
  {
    id: 'CH-007', title: 'Vazamento torneira banheiro — 4º andar',
    description: 'Torneira do banheiro masculino do 4º andar com gotejamento constante.',
    category: 'Hidráulica', sphere: 'Manutenção', priority: 'normal', status: 'completed',
    requester: 'You.inc', assigned_to: 'Manutenção Interna', floor: 4, building_id: 'b1',
    created_at: '2026-03-02T14:00:00', sla_deadline: '2026-03-04T14:00:00',
    comments_count: 2, attachments_count: 1, satisfaction_rating: 4, timeline: [
      { id: 'e13', type: 'created', description: 'Chamado aberto por You.inc', author: 'You.inc — Administrador', created_at: '2026-03-02T14:00:00' },
      { id: 'e14', type: 'completed', description: 'Chamado concluído', author: 'Manutenção Interna', created_at: '2026-03-03T11:00:00' },
    ]
  },
  {
    id: 'CH-008', title: 'Solicitação de proposta — Eficiência Energética',
    description: 'Lux Energia solicita proposta para auditoria de eficiência energética do 7º andar.',
    category: 'TI', sphere: 'Gestão de Ativos', priority: 'low', status: 'open',
    requester: 'Lux Energia', floor: 7, building_id: 'b1',
    created_at: '2026-03-09T10:30:00', sla_deadline: '2026-03-16T10:30:00',
    comments_count: 0, attachments_count: 0, timeline: [
      { id: 'e15', type: 'created', description: 'Chamado aberto por Lux Energia', author: 'Lux Energia — Administrador', created_at: '2026-03-09T10:30:00' },
    ]
  },
  {
    id: 'CH-009', title: 'Calibração sistema de controle de acesso — 13º',
    description: 'Sistema de controle de acesso do 13º andar necessita calibração após atualização de firmware.',
    category: 'Segurança', sphere: 'Segurança Patrimonial', priority: 'normal', status: 'awaiting_approval',
    requester: 'Capitale', assigned_to: 'SecTech Segurança', floor: 13, building_id: 'b1', vendor_id: 'vd2',
    created_at: '2026-03-06T09:00:00', sla_deadline: '2026-03-10T09:00:00',
    comments_count: 1, attachments_count: 0, timeline: [
      { id: 'e16', type: 'created', description: 'Chamado aberto por Capitale', author: 'Capitale — Administrador', created_at: '2026-03-06T09:00:00' },
      { id: 'e17', type: 'assigned', description: 'Atribuído a SecTech Segurança', author: 'Tatiana Caracciolo', created_at: '2026-03-06T10:00:00' },
    ]
  },
  {
    id: 'CH-010', title: 'Revisão semestral grupo gerador',
    description: 'Revisão semestral programada do grupo gerador do ativo.',
    category: 'Manutenção', sphere: 'Gestão de Ativos', priority: 'normal', status: 'open',
    requester: 'Gestão (Tatiana)', floor: 0, building_id: 'b1',
    created_at: '2026-03-05T08:00:00', sla_deadline: '2026-03-20T08:00:00',
    comments_count: 0, attachments_count: 0, timeline: [
      { id: 'e18', type: 'created', description: 'Chamado programado pela Gestão', author: 'Tatiana Caracciolo', created_at: '2026-03-05T08:00:00' },
    ]
  },
  // Martiniano (b7) tickets
  {
    id: 'CH-011', title: 'Infiltração no teto — SL 301',
    description: 'Infiltração de água no teto da sala 301, próximo à janela leste.',
    category: 'Hidráulica', sphere: 'Manutenção', priority: 'high', status: 'open',
    requester: 'WeWork Brasil', floor: 3, building_id: 'b7',
    created_at: '2026-03-10T09:00:00', sla_deadline: '2026-03-12T09:00:00',
    comments_count: 0, attachments_count: 1, timeline: [
      { id: 'e19', type: 'created', description: 'Chamado aberto por WeWork Brasil', author: 'WeWork Brasil — Administrador', created_at: '2026-03-10T09:00:00' },
    ]
  },
  {
    id: 'CH-012', title: 'Portão de doca intermitente — Martiniano',
    description: 'Portão de doca do Martiniano parou de funcionar duas vezes hoje.',
    category: 'Manutenção', sphere: 'Gestão de Ativos', priority: 'urgent', status: 'in_progress',
    requester: 'Administração', assigned_to: 'TechElev Elevadores', floor: 0, building_id: 'b7',
    created_at: '2026-03-09T07:30:00', sla_deadline: '2026-03-09T19:30:00',
    comments_count: 3, attachments_count: 0, timeline: [
      { id: 'e20', type: 'created', description: 'Chamado aberto pela Administração', author: 'Administração Martiniano', created_at: '2026-03-09T07:30:00' },
      { id: 'e21', type: 'assigned', description: 'Atribuído a TechElev', author: 'Administração', created_at: '2026-03-09T08:00:00' },
    ]
  },
  // Sêneca (b8) tickets
  {
    id: 'CH-013', title: 'Ar-condicionado CJ 22 — não refrigera',
    description: 'O ar condicionado da sala de apoio do galpão 22 não está refrigerando adequadamente.',
    category: 'Climatização', sphere: 'Manutenção', priority: 'normal', status: 'open',
    requester: 'DHL', floor: 2, building_id: 'b8',
    created_at: '2026-03-11T10:00:00', sla_deadline: '2026-03-13T10:00:00',
    comments_count: 0, attachments_count: 0, timeline: [
      { id: 'e22', type: 'created', description: 'Chamado aberto por DHL', author: 'DHL', created_at: '2026-03-11T10:00:00' },
    ]
  },
];

// ─── Mock Announcements — 360JK ──────────────────────
export const mockAnnouncements: Announcement[] = [
  {
    id: 'a1', title: '⚠️ Manutenção elevadores centrais — 12/03 das 8h às 12h',
    content: 'Informamos que no dia 12/03/2026, das 08h às 12h, será realizada manutenção nos elevadores centrais. Durante este período, utilize a escada de emergência. Pedimos a compreensão de todos.',
    category: 'Manutenção', priority: 'urgent', published_at: '2026-03-09T08:00:00', expires_at: '2026-03-12T12:00:00',
    read: false, author: { name: 'Tatiana Caracciolo', company: 'Administradora', position: 'Gerente de Ativos' },
    target_type: 'all', read_count: 45, total_recipients: 120, allow_comments: true, has_poll: false, requires_confirmation: true,
    building_id: 'b1', unit: 'Todos',
    comments: [
      { id: 'c1', author: 'Lux Energia', company: 'Lux Energia', text: 'Podemos usar o elevador de serviço para visitantes neste período?', created_at: '2026-03-09T09:30:00' },
    ],
  },
  {
    id: 'a2', title: '🚲 Reforma do bicicletário (SS3) em andamento',
    content: 'A reforma do bicicletário no Subsolo 3 está em andamento. Previsão de conclusão: 30/04/2026. Durante a obra, o acesso ao SS3 será restrito.',
    category: 'Administrativo', priority: 'normal', published_at: '2026-03-08T10:00:00',
    read: false, author: { name: 'Tatiana Caracciolo', company: 'Administradora', position: 'Gerente de Ativos' },
    target_type: 'all', read_count: 78, total_recipients: 120, allow_comments: true, has_poll: false, requires_confirmation: false,
    building_id: 'b1', unit: 'SS3',
  },
  {
    id: 'a3', title: '⚡ Instalação de 20 pontos de recarga EV no SS2',
    content: 'Estamos instalando 20 pontos de recarga para veículos elétricos no Subsolo 2. Os pontos estarão disponíveis a partir de maio de 2026.',
    category: 'ESG', priority: 'normal', published_at: '2026-03-07T14:00:00',
    read: true, author: { name: 'Tatiana Caracciolo', company: 'Administradora', position: 'Gerente de Ativos' },
    target_type: 'all', read_count: 95, total_recipients: 120, allow_comments: true, has_poll: false, requires_confirmation: false,
    building_id: 'b7', unit: 'SS2',
  },
  {
    id: 'a4', title: '📋 Contrato DHL vence em 30/06/2026 — Renovação em análise',
    content: 'O contrato de locação da DHL (Conjunto C2) vence em 30/06/2026. A gestão já iniciou o processo de renovação.',
    category: 'Administrativo', priority: 'high', published_at: '2026-03-06T09:00:00',
    read: true, author: { name: 'Gestão Patrimonial', company: 'Proprietário', position: 'Gestor de Fundo' },
    target_type: 'all', read_count: 30, total_recipients: 45, allow_comments: false, has_poll: false, requires_confirmation: false,
    building_id: 'b7', unit: '12º andar',
  },
  {
    id: 'a5', title: '🌱 Sêneca obtém certificação LEED Gold',
    content: 'O Sêneca obteve a certificação LEED Gold. Agradecemos o empenho de todos os ocupantes nas práticas sustentáveis.',
    category: 'ESG', priority: 'normal', published_at: '2026-03-05T16:00:00',
    read: true, author: { name: 'Gestão Patrimonial', company: 'Proprietário', position: 'Gestor de Fundo' },
    target_type: 'all', read_count: 40, total_recipients: 45, allow_comments: true, has_poll: false, requires_confirmation: false,
    building_id: 'b8', unit: 'Todos',
  },
  {
    id: 'a6', title: '🔧 Troca do sistema de ar-condicionado — 15º andar',
    content: 'Será realizada a troca do sistema de climatização do 15º andar nos dias 20 e 21/03. O andar ficará temporariamente sem climatização.',
    category: 'Manutenção', priority: 'high', published_at: '2026-03-04T11:00:00',
    read: false, author: { name: 'Administração', company: 'Martiniano', position: 'Gerente de Ativos' },
    target_type: 'floors', read_count: 12, total_recipients: 25, allow_comments: true, has_poll: false, requires_confirmation: true,
    building_id: 'b7', unit: '15º andar',
  },
  {
    id: 'a7', title: '📊 Relatório ESG Q1/2026 disponível para download',
    content: 'O relatório ESG do primeiro trimestre de 2026 do Sêneca está disponível para consulta e download na área de documentos.',
    category: 'ESG', priority: 'normal', published_at: '2026-03-03T15:00:00',
    read: true, author: { name: 'Gestão Patrimonial', company: 'Proprietário', position: 'Gestor de Fundo' },
    target_type: 'all', read_count: 38, total_recipients: 45, allow_comments: false, has_poll: false, requires_confirmation: false,
    building_id: 'b8', unit: 'Todos',
  },
  {
    id: 'a8', title: '🏗️ Obra no pátio — Martiniano',
    content: 'A reforma do pátio do Martiniano será realizada entre 01/04 e 15/04/2026. O acesso será pelo portão lateral.',
    category: 'Administrativo', priority: 'normal', published_at: '2026-03-02T09:00:00',
    read: true, author: { name: 'Administração', company: 'Martiniano', position: 'Gerente de Ativos' },
    target_type: 'all', read_count: 55, total_recipients: 80, allow_comments: true, has_poll: false, requires_confirmation: false,
    building_id: 'b7', unit: 'Lobby',
  },
];

// ─── Mock Contracts — 360JK Real ─────────────────────
export const mockContracts: Contract[] = [
  {
    id: 'c1', number: '#CTR-360JK-001', tenant_name: 'Lux Energy', cnpj: 'A confirmar', owner: 'Administradora',
    floors: [7], area_m2: 500, start_date: '2025-01-01', end_date: '2027-12-31',
    monthly_value: 0, adjustment_index: 'IPCA', next_adjustment: '2026-01-01', status: 'active',
    payments: [{ month: '2026-01', value: 0, status: 'paid', paid_at: '2026-01-05' }, { month: '2026-02', value: 0, status: 'paid', paid_at: '2026-02-03' }, { month: '2026-03', value: 0, status: 'pending' }],
    adjustments: [], documents: [{ id: 'd1', name: 'Contrato_LuxEnergy_2025.pdf', type: 'pdf', size: '2.4 MB', uploaded_at: '2025-01-01' }],
  },
  {
    id: 'c2', number: '#CTR-360JK-002', tenant_name: 'Capitale Energia', cnpj: 'A confirmar', owner: 'Administradora',
    floors: [13], area_m2: 960, start_date: '2024-06-01', end_date: '2027-05-31',
    monthly_value: 0, adjustment_index: 'IGP-M', next_adjustment: '2026-06-01', status: 'active',
    payments: [{ month: '2026-01', value: 0, status: 'paid', paid_at: '2026-01-04' }, { month: '2026-02', value: 0, status: 'paid', paid_at: '2026-02-05' }, { month: '2026-03', value: 0, status: 'pending' }],
    adjustments: [], documents: [{ id: 'd2', name: 'Contrato_Capitale_2024.pdf', type: 'pdf', size: '3.1 MB', uploaded_at: '2024-06-01' }],
  },
  {
    id: 'c3', number: '#CTR-360JK-003', tenant_name: 'You Intermediação', cnpj: 'A confirmar', owner: 'Administradora',
    floors: [2, 4], area_m2: 960, start_date: '2023-03-01', end_date: '2026-02-28',
    monthly_value: 0, adjustment_index: 'IPCA', next_adjustment: '2026-03-01', status: 'expiring',
    payments: [{ month: '2026-01', value: 0, status: 'paid', paid_at: '2026-01-06' }, { month: '2026-02', value: 0, status: 'paid', paid_at: '2026-02-04' }],
    adjustments: [], documents: [{ id: 'd3', name: 'Contrato_YouIntermediacao_2023.pdf', type: 'pdf', size: '2.8 MB', uploaded_at: '2023-03-01' }],
  },
  {
    id: 'c4', number: '#CTR-360JK-004', tenant_name: 'Windmöller & Hölscher', cnpj: 'A confirmar', owner: 'Administradora',
    floors: [3], area_m2: 480, start_date: '2024-01-01', end_date: '2026-12-31',
    monthly_value: 0, adjustment_index: 'IPCA', next_adjustment: '2026-01-01', status: 'active',
    payments: [{ month: '2026-03', value: 0, status: 'pending' }], adjustments: [], documents: [],
  },
  {
    id: 'c5', number: '#CTR-360JK-005', tenant_name: 'Apex Partners', cnpj: 'A confirmar', owner: 'Administradora',
    floors: [3, 5, 19], area_m2: 1440, start_date: '2023-06-01', end_date: '2028-05-31',
    monthly_value: 0, adjustment_index: 'IGP-M', next_adjustment: '2026-06-01', status: 'active',
    payments: [{ month: '2026-03', value: 0, status: 'pending' }], adjustments: [], documents: [],
  },
  {
    id: 'c6', number: '#CTR-360JK-006', tenant_name: 'Costa Pereira e Di Pietro', cnpj: 'A confirmar', owner: 'Administradora',
    floors: [5], area_m2: 480, start_date: '2024-03-01', end_date: '2027-02-28',
    monthly_value: 0, adjustment_index: 'IPCA', next_adjustment: '2026-03-01', status: 'active',
    payments: [{ month: '2026-03', value: 0, status: 'pending' }], adjustments: [], documents: [],
  },
  {
    id: 'c7', number: '#CTR-360JK-007', tenant_name: 'Barros Pimentel Advogados', cnpj: 'A confirmar', owner: 'Administradora',
    floors: [6], area_m2: 480, start_date: '2024-01-01', end_date: '2026-12-31',
    monthly_value: 0, adjustment_index: 'IPCA', next_adjustment: '2026-01-01', status: 'active',
    payments: [{ month: '2026-03', value: 0, status: 'pending' }], adjustments: [], documents: [],
  },
  {
    id: 'c8', number: '#CTR-360JK-008', tenant_name: 'Bladex Representações', cnpj: 'A confirmar', owner: 'Administradora',
    floors: [6], area_m2: 480, start_date: '2024-06-01', end_date: '2027-05-31',
    monthly_value: 0, adjustment_index: 'IPCA', next_adjustment: '2026-06-01', status: 'active',
    payments: [{ month: '2026-03', value: 0, status: 'pending' }], adjustments: [], documents: [],
  },
  {
    id: 'c9', number: '#CTR-360JK-009', tenant_name: 'Baggio Transportes', cnpj: 'A confirmar', owner: 'Administradora',
    floors: [7], area_m2: 480, start_date: '2024-01-01', end_date: '2026-12-31',
    monthly_value: 0, adjustment_index: 'IPCA', next_adjustment: '2026-01-01', status: 'active',
    payments: [{ month: '2026-03', value: 0, status: 'pending' }], adjustments: [], documents: [],
  },
  {
    id: 'c10', number: '#CTR-360JK-010', tenant_name: 'Sul América', cnpj: 'A confirmar', owner: 'Administradora',
    floors: [8], area_m2: 960, start_date: '2023-01-01', end_date: '2027-12-31',
    monthly_value: 0, adjustment_index: 'IPCA', next_adjustment: '2026-01-01', status: 'active',
    payments: [{ month: '2026-03', value: 0, status: 'pending' }], adjustments: [], documents: [],
  },
  {
    id: 'c11', number: '#CTR-360JK-011', tenant_name: 'Lass Capital', cnpj: 'A confirmar', owner: 'Administradora',
    floors: [9], area_m2: 480, start_date: '2024-01-01', end_date: '2026-12-31',
    monthly_value: 0, adjustment_index: 'IPCA', next_adjustment: '2026-01-01', status: 'active',
    payments: [{ month: '2026-03', value: 0, status: 'pending' }], adjustments: [], documents: [],
  },
  {
    id: 'c12', number: '#CTR-360JK-012', tenant_name: 'Barkana Investimentos', cnpj: 'A confirmar', owner: 'Administradora',
    floors: [9], area_m2: 480, start_date: '2024-06-01', end_date: '2027-05-31',
    monthly_value: 0, adjustment_index: 'IPCA', next_adjustment: '2026-06-01', status: 'active',
    payments: [{ month: '2026-03', value: 0, status: 'pending' }], adjustments: [], documents: [],
  },
  {
    id: 'c13', number: '#CTR-360JK-013', tenant_name: 'Geribá Energy', cnpj: 'A confirmar', owner: 'Administradora',
    floors: [10, 11], area_m2: 1920, start_date: '2023-01-01', end_date: '2027-12-31',
    monthly_value: 0, adjustment_index: 'IGP-M', next_adjustment: '2026-01-01', status: 'active',
    payments: [{ month: '2026-03', value: 0, status: 'pending' }], adjustments: [], documents: [],
  },
  {
    id: 'c14', number: '#CTR-360JK-014', tenant_name: 'Ibitu Energias', cnpj: 'A confirmar', owner: 'Administradora',
    floors: [12], area_m2: 960, start_date: '2023-06-01', end_date: '2028-05-31',
    monthly_value: 0, adjustment_index: 'IPCA', next_adjustment: '2026-06-01', status: 'active',
    payments: [{ month: '2026-03', value: 0, status: 'pending' }], adjustments: [], documents: [],
  },
  {
    id: 'c15', number: '#CTR-360JK-015', tenant_name: 'Sherman (A&O Shearman)', cnpj: 'A confirmar', owner: 'Administradora',
    floors: [14], area_m2: 480, start_date: '2024-01-01', end_date: '2026-12-31',
    monthly_value: 0, adjustment_index: 'IPCA', next_adjustment: '2026-01-01', status: 'active',
    payments: [{ month: '2026-03', value: 0, status: 'pending' }], adjustments: [], documents: [],
  },
  {
    id: 'c16', number: '#CTR-360JK-016', tenant_name: 'DLA Piper', cnpj: 'A confirmar', owner: 'Administradora',
    floors: [14], area_m2: 480, start_date: '2024-06-01', end_date: '2027-05-31',
    monthly_value: 0, adjustment_index: 'IPCA', next_adjustment: '2026-06-01', status: 'active',
    payments: [{ month: '2026-03', value: 0, status: 'pending' }], adjustments: [], documents: [],
  },
  {
    id: 'c17', number: '#CTR-360JK-017', tenant_name: 'Bronstein Zilberberg', cnpj: 'A confirmar', owner: 'Administradora',
    floors: [15], area_m2: 960, start_date: '2023-01-01', end_date: '2027-12-31',
    monthly_value: 0, adjustment_index: 'IPCA', next_adjustment: '2026-01-01', status: 'active',
    payments: [{ month: '2026-03', value: 0, status: 'pending' }], adjustments: [], documents: [],
  },
  {
    id: 'c18', number: '#CTR-360JK-018', tenant_name: 'Graça Couto Advogados', cnpj: 'A confirmar', owner: 'Administradora',
    floors: [16], area_m2: 480, start_date: '2024-01-01', end_date: '2026-12-31',
    monthly_value: 0, adjustment_index: 'IPCA', next_adjustment: '2026-01-01', status: 'active',
    payments: [{ month: '2026-03', value: 0, status: 'pending' }], adjustments: [], documents: [],
  },
  {
    id: 'c19', number: '#CTR-360JK-019', tenant_name: 'More Invest', cnpj: 'A confirmar', owner: 'Administradora',
    floors: [16], area_m2: 480, start_date: '2024-06-01', end_date: '2027-05-31',
    monthly_value: 0, adjustment_index: 'IPCA', next_adjustment: '2026-06-01', status: 'active',
    payments: [{ month: '2026-03', value: 0, status: 'pending' }], adjustments: [], documents: [],
  },
  {
    id: 'c20', number: '#CTR-360JK-020', tenant_name: 'FKG Advogados', cnpj: 'A confirmar', owner: 'Administradora',
    floors: [17], area_m2: 960, start_date: '2023-06-01', end_date: '2028-05-31',
    monthly_value: 0, adjustment_index: 'IPCA', next_adjustment: '2026-06-01', status: 'active',
    payments: [{ month: '2026-03', value: 0, status: 'pending' }], adjustments: [], documents: [],
  },
];

// ─── Mock Energy/Water/Gas Data ───────────────────────
export const mockEnergyData = [
  { month: 'Set', kwh: 142000, water: 1850, gas: 4200, target: 135000 },
  { month: 'Out', kwh: 148000, water: 1920, gas: 4400, target: 135000 },
  { month: 'Nov', kwh: 155000, water: 2010, gas: 4100, target: 135000 },
  { month: 'Dez', kwh: 162000, water: 2100, gas: 3800, target: 135000 },
  { month: 'Jan', kwh: 158000, water: 1980, gas: 3600, target: 135000 },
  { month: 'Fev', kwh: 145000, water: 1870, gas: 3900, target: 135000 },
  { month: 'Mar', kwh: 138000, water: 1800, gas: 4000, target: 135000 },
];

export const mockTicketsByStatus = [
  { name: 'Abertos', value: 3, fill: 'hsl(0, 84%, 60%)' },
  { name: 'Em Análise', value: 1, fill: 'hsl(40, 90%, 55%)' },
  { name: 'Em Execução', value: 3, fill: 'hsl(200, 50%, 37%)' },
  { name: 'Aguardando', value: 1, fill: 'hsl(200, 32%, 45%)' },
  { name: 'Concluídos', value: 2, fill: 'hsl(88, 50%, 53%)' },
];

// ─── Floor Config — 360JK Real (from tenant list Excel) ────────────────────────
export const mockFloorConfig: FloorConfig[] = [
  { floor: -4, name: 'Subsolo 4 (SS4)', type: 'subsolo', area_m2: 2000, status: 'building_use', tenant: 'Estacionamento', special_icon: '🅿️', tickets_count: 0 },
  { floor: -3, name: 'Subsolo 3 (SS3)', type: 'subsolo', area_m2: 2000, status: 'work', tenant: 'Estacionamento + Bicicletário', special_status: 'Reforma do Bicicletário', special_icon: '🚧', tickets_count: 1, works: [{ title: 'Reforma do Bicicletário', status: 'Em andamento', progress: 45, end_date: '2026-04-30' }] },
  { floor: -2, name: 'Subsolo 2 (SS2)', type: 'subsolo', area_m2: 2000, status: 'work', tenant: 'Estacionamento + Vagas EV', special_status: 'Instalação vagas EV', special_icon: '⚡', tickets_count: 0, works: [{ title: 'Instalação de 20 Vagas para Veículos Elétricos', status: 'Em andamento', progress: 30, end_date: '2026-05-15' }] },
  { floor: -1, name: 'Subsolo 1 (SS1)', type: 'subsolo', area_m2: 2500, status: 'building_use', tenant: 'Estacionamento Principal', special_icon: '🅿️', tickets_count: 0 },
  { floor: 0, name: 'Térreo', type: 'terreo', area_m2: 1500, status: 'building_use', tenant: 'Lobby / Recepção — Administradora', tickets_count: 0 },
  { floor: 0.5, name: 'Mezanino', type: 'mezanino', area_m2: 800, status: 'building_use', tenant: '360JK Admin — Administradora', employees: 22,
    tenants: [{ name: '360JK (Administração)', suites: 'Mezanino', employees: 22, email: 'tatiana@administradora.com.br', contact: 'Tatiana Caracciolo' }],
    tickets_count: 0 },
  // 2º andar — You Intermediação (conj 21, 22)
  { floor: 2, name: '2º Andar', type: 'corporativo', area_m2: 960, status: 'occupied', tenant: 'You Intermediação', employees: 303,
    tenants: [{ name: 'You Intermediação', suites: 'Conj. 21, 22', employees: 303, email: 'coliveira@youinc.com.br', contact: 'Cristiane Oliveira' }],
    tickets_count: 1 },
  // 3º andar — Windmöller & Hölscher (31) + Apex (32)
  { floor: 3, name: '3º Andar', type: 'corporativo', area_m2: 960, status: 'occupied', tenant: 'Windmöller & Hölscher / Apex', employees: 44,
    tenants: [
      { name: 'Windmöller & Hölscher', suites: 'Conj. 31', employees: 44, email: 'hilda.Fernandes@wuh-group.com' },
      { name: 'Apex Partners', suites: 'Conj. 32', employees: 161, email: 'administrativo@apexpartners.com.br', contact: 'Flavio Blasques' },
    ],
    tickets_count: 1 },
  // 4º andar — You Intermediação (conj 41, 42)
  { floor: 4, name: '4º Andar', type: 'corporativo', area_m2: 960, status: 'occupied', tenant: 'You Intermediação', employees: 0,
    tenants: [{ name: 'You Intermediação', suites: 'Conj. 41, 42', employees: 0, email: 'coliveira@youinc.com.br', contact: 'Cristiane Oliveira' }],
    tickets_count: 1 },
  // 5º andar — Apex (52) + Costa Pereira e Di Pietro (52)
  { floor: 5, name: '5º Andar', type: 'corporativo', area_m2: 960, status: 'occupied', tenant: 'Apex / Costa Pereira e Di Pietro', employees: 27,
    tenants: [
      { name: 'Apex Partners', suites: 'Conj. 52', employees: 0, email: 'administrativo@apexpartners.com.br', contact: 'Flavio Blasques' },
      { name: 'Costa Pereira e Di Pietro', suites: 'Conj. 52', employees: 27, email: 'recepcaocpdp@cpdpadvogados.com.br' },
    ],
    tickets_count: 0 },
  // 6º andar — Barros Pimentel (61) + Bladex (62)
  { floor: 6, name: '6º Andar', type: 'corporativo', area_m2: 960, status: 'occupied', tenant: 'Barros Pimentel / Bladex', employees: 58,
    tenants: [
      { name: 'Barros Pimentel Advogados', suites: 'Conj. 61', employees: 29, email: 'giovanna.vale@barrospimentel.adv.br' },
      { name: 'Bladex Representações', suites: 'Conj. 62', employees: 29, email: 'csoares@bladex.com', contact: 'Clara Soares' },
    ],
    tickets_count: 0 },
  // 7º andar — Lux Energy (71) + Baggio Transportes (72)
  { floor: 7, name: '7º Andar', type: 'corporativo', area_m2: 960, status: 'occupied', tenant: 'Lux Energy / Baggio', employees: 78, special_icon: '⚡',
    tenants: [
      { name: 'Lux Energy', suites: 'Conj. 71', employees: 46, email: 'administrativo@luxenergia.com.br', contact: 'Fábio Nunes' },
      { name: 'Baggio Transportes', suites: 'Conj. 72', employees: 32, email: 'office@baggioltda.com' },
    ],
    tickets_count: 1 },
  // 8º andar — Sul América (81, 82) — andar inteiro
  { floor: 8, name: '8º Andar', type: 'corporativo', area_m2: 960, status: 'occupied', tenant: 'Sul América', employees: 126,
    tenants: [{ name: 'Sul América', suites: 'Conj. 81, 82', employees: 126, email: 'daiane.simao@sulamerica.com.br' }],
    tickets_count: 0 },
  // 9º andar — Lass Capital (91) + Barkana (92)
  { floor: 9, name: '9º Andar', type: 'corporativo', area_m2: 960, status: 'occupied', tenant: 'Lass Capital / Barkana', employees: 53,
    tenants: [
      { name: 'Lass Capital', suites: 'Conj. 91', employees: 36, email: 'carla@lass.capital', contact: 'Carla Toledo' },
      { name: 'Barkana Investimentos', suites: 'Conj. 92', employees: 17, email: 'isabella@bknp.com.br' },
    ],
    tickets_count: 0 },
  // 10º andar — Geribá Energy (101, 102) — andar inteiro
  { floor: 10, name: '10º Andar', type: 'corporativo', area_m2: 960, status: 'occupied', tenant: 'Geribá Energy', employees: 201,
    tenants: [{ name: 'Geribá Energy', suites: 'Conj. 101, 102', employees: 201, email: 'pmelo@geribainvest.com', contact: 'Paloma Melo' }],
    tickets_count: 0 },
  // 11º andar — Geribá Energy (111, 112) — andar inteiro
  { floor: 11, name: '11º Andar', type: 'corporativo', area_m2: 960, status: 'occupied', tenant: 'Geribá Energy', employees: 0,
    tenants: [{ name: 'Geribá Energy', suites: 'Conj. 111, 112', employees: 0, email: 'emarinho@geribainvest.com' }],
    tickets_count: 0 },
  // 12º andar — Ibitu Energias (121, 122) — andar inteiro
  { floor: 12, name: '12º Andar', type: 'corporativo', area_m2: 960, status: 'occupied', tenant: 'Ibitu Energias', employees: 177,
    tenants: [{ name: 'Ibitu Energias', suites: 'Conj. 121, 122', employees: 177, email: 'juliana.jesus@ibituenergia.com' }],
    tickets_count: 0 },
  // 13º andar — Capitale Energia (131, 132) — andar inteiro
  { floor: 13, name: '13º Andar', type: 'corporativo', area_m2: 960, status: 'occupied', tenant: 'Capitale Energia', employees: 64,
    tenants: [{ name: 'Capitale Energia', suites: 'Conj. 131, 132', employees: 64, email: 'adriana.bertolucci@capitaleenergia.com.br' }],
    tickets_count: 1 },
  // 14º andar — Sherman (141) + DLA Piper (142)
  { floor: 14, name: '14º Andar', type: 'corporativo', area_m2: 960, status: 'occupied', tenant: 'Sherman / DLA Piper', employees: 41,
    tenants: [
      { name: 'Sherman (A&O Shearman)', suites: 'Conj. 141', employees: 17, email: 'carol.gomes@aoshearman.com' },
      { name: 'DLA Piper', suites: 'Conj. 142', employees: 24, email: 'bruna.goncalves@us.dlapiper.com' },
    ],
    tickets_count: 0 },
  // 15º andar — Bronstein Zilberberg (151, 152) — andar inteiro
  { floor: 15, name: '15º Andar', type: 'corporativo', area_m2: 960, status: 'occupied', tenant: 'Bronstein Zilberberg', employees: 88,
    tenants: [{ name: 'Bronstein Zilberberg', suites: 'Conj. 151, 152', employees: 88, email: 'facilities@bzcp.com.br' }],
    tickets_count: 0 },
  // 16º andar — Graça Couto (161) + More Invest (162)
  { floor: 16, name: '16º Andar', type: 'corporativo', area_m2: 960, status: 'occupied', tenant: 'Graça Couto / More Invest', employees: 68,
    tenants: [
      { name: 'Graça Couto Advogados', suites: 'Conj. 161', employees: 37, email: 'administrativosp@gcouto.com.br' },
      { name: 'More Invest', suites: 'Conj. 162', employees: 31, email: 'erika.alves@moreinvest.com.br' },
    ],
    tickets_count: 0 },
  // 17º andar — FKG Advogados (171, 172) — andar inteiro
  { floor: 17, name: '17º Andar', type: 'corporativo', area_m2: 960, status: 'occupied', tenant: 'FKG Advogados', employees: 64,
    tenants: [{ name: 'FKG Advogados', suites: 'Conj. 171, 172', employees: 64, email: 'leila.almeida@fkgadv.com.br' }],
    tickets_count: 0 },
  // 18º andar — Vago
  { floor: 18, name: '18º Andar', type: 'corporativo', area_m2: 960, status: 'vacant', tenant: 'Disponível', tickets_count: 0 },
  // 19º andar — Sala de Reunião (uso do ativo)
  { floor: 19, name: '19º Andar', type: 'sala_reuniao', area_m2: 960, status: 'occupied', tenant: 'Apex Partners (Sala de Reunião)', employees: 0,
    tenants: [{ name: 'Apex Partners', suites: 'Conj. 191, 192', employees: 0, email: 'administrativo@apexpartners.com.br', contact: 'Flavio Blasques' }],
    tickets_count: 0 },
];

// Keep backward compat
export const mockOccupancyByFloor = mockFloorConfig.filter(f => f.type === 'corporativo' || f.type === 'sala_reuniao').map(f => ({
  floor: f.floor,
  status: f.status as 'occupied' | 'partial' | 'vacant',
  tenant: f.tenant,
}));

// ─── Mock Rooms ───────────────────────────────────────
export const mockRooms: Room[] = [
  { id: 'r1', name: 'Sala Executiva A', floor: 2, capacity: 8, type: 'Reunião', amenities: ['TV 65"', 'Videoconferência', 'Flipchart'], available: true, color: '#2F6F8F' },
  { id: 'r2', name: 'Sala de Conferência B', floor: 2, capacity: 16, type: 'Conferência', amenities: ['Projetor', 'Videoconferência', 'Som'], available: false, color: '#4E7D5B' },
  { id: 'r3', name: 'Auditório Principal', floor: 1, capacity: 120, type: 'Auditório', amenities: ['Projetor 4K', 'Som profissional', 'Palco'], available: true, color: '#0B2A3D' },
  { id: 'r4', name: 'Sala de Treinamento', floor: 3, capacity: 30, type: 'Treinamento', amenities: ['TVs duplas', 'Quadro branco', 'TI'], available: true, color: '#8BC34A' },
  { id: 'r5', name: 'Espaço Rooftop', floor: 25, capacity: 80, type: 'Eventos', amenities: ['Área aberta', 'Bar', 'Som'], available: false, color: '#0F3834' },
  { id: 'r6', name: 'Sala Compacta C', floor: 2, capacity: 4, type: 'Reunião', amenities: ['TV 50"', 'Videoconferência'], available: true, color: '#4F7F99' },
];

export const mockReservations: Reservation[] = [
  { id: 'res1', room_id: 'r1', room_name: 'Sala Executiva A', title: 'Reunião de Planejamento', date: '2026-03-10', start_time: '09:00', end_time: '10:30', tenant: 'Lux Energia', user: 'Lux Energia — Administrador', participants: 6, status: 'confirmed', resources: [] },
  { id: 'res2', room_id: 'r3', room_name: 'Auditório Principal', title: 'Apresentação Q1', date: '2026-03-11', start_time: '14:00', end_time: '17:00', tenant: 'Capitale', user: 'Capitale — Administrador', participants: 80, status: 'confirmed', resources: ['Coffee Break'] },
  { id: 'res3', room_id: 'r4', room_name: 'Sala de Treinamento', title: 'Workshop de Inovação', date: '2026-03-12', start_time: '08:00', end_time: '12:00', tenant: 'You.inc', user: 'You.inc — Administrador', participants: 25, status: 'confirmed', resources: ['Suporte TI'] },
  { id: 'res4', room_id: 'r1', room_name: 'Sala Executiva A', title: 'Alinhamento Comercial', date: '2026-03-10', start_time: '14:00', end_time: '15:30', tenant: 'Lux Energia', user: 'Lux Energia — Administrador', participants: 4, status: 'pending', resources: [] },
  { id: 'res5', room_id: 'r6', room_name: 'Sala Compacta C', title: 'Call com Cliente', date: '2026-03-11', start_time: '10:00', end_time: '11:00', tenant: 'Capitale', user: 'Capitale — Administrador', participants: 3, status: 'confirmed', resources: [] },
  { id: 'res6', room_id: 'r2', room_name: 'Sala de Conferência B', title: 'Board Meeting', date: '2026-03-10', start_time: '10:00', end_time: '12:00', tenant: 'You.inc', user: 'You.inc — Administrador', participants: 12, status: 'confirmed', resources: ['Coffee Break', 'Videoconferência'] },
];

// ─── Mock Visitors — 360JK Today ─────────────────────
export const mockVisitors: Visitor[] = [
  { id: 'v1', name: 'Pedro Alves', company: 'LuxTech Soluções', document: '***.***.789-00', destination_floor: 7, destination_company: 'Lux Energia', host_name: 'Lux Energia — Administrador', scheduled_at: '2026-03-09T14:00:00', status: 'waiting', type: 'client', auto_release: false, qr_code: 'QR-V1-2026', recurrent: false },
  { id: 'v2', name: 'Mariana Costa', company: 'Investidora independente', document: '***.***.456-00', destination_floor: 13, destination_company: 'Capitale', host_name: 'Capitale — Administrador', scheduled_at: '2026-03-09T15:30:00', status: 'scheduled', type: 'client', auto_release: false, qr_code: 'QR-V2-2026', recurrent: false },
  { id: 'v3', name: 'Roberto Sarti', company: 'Consultor You.inc', document: '***.***.123-00', destination_floor: 2, destination_company: 'You.inc', host_name: 'You.inc — Administrador', scheduled_at: '2026-03-09T16:00:00', checked_in_at: '2026-03-09T15:55:00', status: 'present', type: 'service', auto_release: true, qr_code: 'QR-V3-2026', recurrent: true },
  { id: 'v4', name: 'Carlos Eduardo Prado', company: 'ClimaTech', document: '***.***.321-00', destination_floor: 0, destination_company: 'Administradora', host_name: 'Tatiana Caracciolo', scheduled_at: '2026-03-09T08:00:00', checked_in_at: '2026-03-09T07:50:00', checked_out_at: '2026-03-09T12:00:00', status: 'departed', type: 'service', auto_release: true, qr_code: 'QR-V4-2026', recurrent: true },
];

// ─── Vendor Reviews ───────────────────────────────────
export const mockVendorReviews: VendorReview[] = [
  { id: 'vr1', vendor_id: 'vd5', ticket_id: 'CH-006', rating: 5, comment: 'Excelente atendimento, rápido e eficiente!', recommend: true, reviewer_name: 'You.inc', reviewer_company: 'You.inc', created_at: '2026-03-01T17:00:00' },
  { id: 'vr2', vendor_id: 'vd5', ticket_id: 'CH-007', rating: 4, comment: 'Bom serviço, resolveu o problema rapidamente.', recommend: true, reviewer_name: 'You.inc', reviewer_company: 'You.inc', created_at: '2026-03-03T12:00:00' },
];

// ─── Nexus Solutions ──────────────────────────────────
export const mockNexusSolutions: NexusSolution[] = [
  { id: 'n1', slug: 'mercado-livre-agua', name: 'Mercado Livre de Água', icon: '💧', badge: 'Capex 0', description: 'Acesse o Mercado Livre de Água e reduza seus custos com fornecimento de água sem investimento inicial.', tags: ['Sem investimento', 'Economia garantida', 'Contrato flexível'], cta: 'Solicitar Proposta' },
  { id: 'n2', slug: 'mercado-livre-gas', name: 'Mercado Livre de Gás', icon: '🔥', badge: 'Energia Limpa', description: 'Liberdade na escolha do seu fornecedor de gás, com melhores condições e preços.', tags: ['Flexibilidade', 'Economia', 'Segurança no fornecimento'], cta: 'Solicitar Proposta' },
  { id: 'n3', slug: 'mercado-livre-energia', name: 'Mercado Livre de Energia', icon: '⚡', badge: 'Capex 0', description: 'Migre para o Mercado Livre de Energia e reduza a conta de energia elétrica em até 30%.', tags: ['Redução de até 30%', 'Sem custo inicial', 'Contratos personalizados'], cta: 'Solicitar Proposta' },
  { id: 'n4', slug: 'geracao-distribuida', name: 'Geração Distribuída Compartilhada', icon: '☀️', badge: 'Capex 0', description: 'Energia solar compartilhada sem painéis no seu telhado. Benefícios da geração solar sem investimento.', tags: ['Energia renovável', 'Créditos de energia', 'I-REC compatível'], cta: 'Solicitar Proposta' },
  { id: 'n5', slug: 'eficiencia-energetica', name: 'Eficiência Energética', icon: '🔋', badge: 'Redução de Custos', description: 'Auditoria e implementação de medidas de eficiência energética para maximizar a performance do ativo.', tags: ['Auditoria', 'Retrofit LED', 'BMS', 'Automação predial'], cta: 'Solicitar Diagnóstico' },
  { id: 'n6', slug: 'gestao-geradores', name: 'Gestão de Geradores', icon: '🏭', badge: 'Continuidade Operacional', description: 'Gestão completa de grupos geradores: manutenção preventiva, preditiva e corretiva.', tags: ['Manutenção', 'Monitoramento 24/7', 'PMOC incluso'], cta: 'Solicitar Proposta' },
  { id: 'n7', slug: 'certificacoes-esg', name: 'Certificações Sustentáveis / ESG', icon: '🌱', badge: 'Expertise Patria', description: 'Assessoria completa para obtenção e manutenção de certificações ESG para seu ativo.', tags: ['LEED', 'BREEAM', 'ISO 14001', 'GHG Protocol'], cta: 'Iniciar Processo' },
  { id: 'n8', slug: 'leed-certificacao', name: 'LEED — Certificação', icon: '🏆', badge: 'Parceiro Oficial USGBC', description: 'Processo completo de certificação LEED: diagnóstico, plano de ação, documentação e auditoria.', tags: ['Certified', 'Silver', 'Gold', 'Platinum'], cta: 'Iniciar Diagnóstico LEED' },
  { id: 'n9', slug: 'placas-fotovoltaicas', name: 'Placas Fotovoltaicas', icon: '⚡🏠', badge: 'Instalação e O&M', description: 'Projeto, instalação e operação de sistemas fotovoltaicos de autogeração para o ativo.', tags: ['Payback médio 4 anos', 'Monitoramento remoto', 'O&M incluso'], cta: 'Solicitar Projeto' },
  { id: 'n10', slug: 'servicos-engenharia', name: 'Serviços de Engenharia', icon: '🔧', badge: 'Multidisciplinar', description: 'Projetos e serviços de engenharia civil, elétrica, mecânica e de telecom para seu ativo.', tags: ['Projetos', 'Laudos', 'Consultorias', 'ART/RRT'], cta: 'Solicitar Orçamento' },
];

// ─── Vendors ──────────────────────────────────────────
export const mockVendors: Vendor[] = [
  { id: 'vd1', name: 'ClimaTech Solutions', cnpj: '11.222.333/0001-01', category: 'Climatização e HVAC', description: 'Especialistas em climatização predial', rating: 4.8, reviews_count: 47, contracts_count: 23, status: 'approved', certifications: ['ISO 9001', 'PMOC'], services: ['Manutenção HVAC', 'Instalação', 'Retrofit'], can_be_rated: true },
  { id: 'vd2', name: 'SecTech Segurança', cnpj: '22.333.444/0001-02', category: 'Segurança Patrimonial', description: 'Soluções em segurança eletrônica e patrimonial', rating: 4.6, reviews_count: 32, contracts_count: 18, status: 'approved', certifications: ['ISO 27001'], services: ['CFTV', 'Controle de Acesso', 'Monitoramento'], can_be_rated: true },
  { id: 'vd3', name: 'Verde Vida Paisagismo', cnpj: '33.444.555/0001-03', category: 'Jardinagem e Paisagismo', description: 'Paisagismo corporativo e manutenção de áreas verdes', rating: 4.9, reviews_count: 28, contracts_count: 15, status: 'approved', certifications: [], services: ['Paisagismo', 'Poda', 'Irrigação'], can_be_rated: true },
  { id: 'vd4', name: 'TechElev Elevadores', cnpj: '44.555.666/0001-04', category: 'Manutenção Predial', description: 'Manutenção especializada de elevadores', rating: 4.7, reviews_count: 55, contracts_count: 31, status: 'approved', certifications: ['ISO 9001'], services: ['Manutenção Preventiva', 'Corretiva', 'Modernização'], can_be_rated: true },
  { id: 'vd5', name: 'EcoClean Serviços', cnpj: '55.666.777/0001-05', category: 'Limpeza e Higiene', description: 'Limpeza profissional para ativos corporativos', rating: 4.5, reviews_count: 19, contracts_count: 12, status: 'approved', certifications: ['ISO 14001'], services: ['Limpeza', 'Higienização', 'Facilities'], can_be_rated: true },
  { id: 'vd6', name: 'SolarPro Energia', cnpj: '66.777.888/0001-06', category: 'Energia Solar e ESG', description: 'Soluções em energia solar e sustentabilidade', rating: 4.4, reviews_count: 11, contracts_count: 8, status: 'pending', certifications: ['ABSOLAR'], services: ['Instalação Solar', 'I-REC', 'Consultoria ESG'], can_be_rated: true },
];

// ─── Quotations ───────────────────────────────────────
export const mockQuotations: Quotation[] = [
  { id: 'q1', title: 'Manutenção preventiva dos chillers', category: 'Climatização e HVAC', description: 'Manutenção preventiva trimestral dos chillers do 360JK', deadline: '2026-03-20', budget_max: 45000, proposals_count: 3, status: 'open', created_by: 'Tatiana Caracciolo' },
  { id: 'q2', title: 'Projeto de retrofit de iluminação LED', category: 'Eficiência Energética', description: 'Substituição de toda iluminação fluorescente por LED nos andares comuns do 360JK', deadline: '2026-03-25', proposals_count: 5, status: 'open', created_by: 'Tatiana Caracciolo' },
  { id: 'q3', title: 'Instalação de piso elevado — andares vagos', category: 'Reformas e Obras', description: 'Instalação de piso elevado para novos locatários nos andares vagos', deadline: '2026-03-15', budget_max: 120000, proposals_count: 4, status: 'closed', created_by: 'Tatiana Caracciolo' },
];

// ─── Report Folders ───────────────────────────────────
export const mockReportFolders: ReportFolder[] = [
  { id: 'rf1', name: 'Gestão de Ativos', icon: '📁', children: [
    { id: 'rf1a', name: 'Chamados e Manutenção', icon: '📂', files: [
      { id: 'f1', name: 'Relatório Chamados Mar/2026', type: 'pdf', size: '1.2 MB', uploaded_by: 'Tatiana Caracciolo', uploaded_at: '2026-03-01', visibility_scope: 'internal', responsible_company: 'Administradora', issued_at: '2026-03-01', expires_at: '2026-04-01' },
      { id: 'f2', name: 'SLA Mensal Fev/2026', type: 'xlsx', size: '890 KB', uploaded_by: 'Tatiana Caracciolo', uploaded_at: '2026-02-28', visibility_scope: 'internal', responsible_company: 'Administradora', issued_at: '2026-02-28' },
    ]},
    { id: 'rf1b', name: 'Contratos de Locação', icon: '📂', files: [
      { id: 'f3', name: 'Mapa de Contratos 360JK 2026', type: 'xlsx', size: '1.5 MB', uploaded_by: 'Tatiana Caracciolo', uploaded_at: '2026-01-15', visibility_scope: 'internal', responsible_company: 'Administradora', issued_at: '2026-01-15' },
    ]},
    { id: 'rf1c', name: 'Ocupação e Vacância', icon: '📂', files: [
      { id: 'f20', name: 'Relatório de Ocupação Mar/2026', type: 'pdf', size: '780 KB', uploaded_by: 'Tatiana Caracciolo', uploaded_at: '2026-03-05', visibility_scope: 'internal', responsible_company: 'Administradora', issued_at: '2026-03-05' },
    ] },
    { id: 'rf1d', name: 'Reservas de Ambientes', icon: '📂', files: [] },
  ]},
  { id: 'rf2', name: 'Técnico / Engenharia', icon: '📁', children: [
    { id: 'rf2a', name: 'PMOC', icon: '📂', files: [
      { id: 'f4', name: 'PMOC HVAC 360JK 2026', type: 'pdf', size: '3.4 MB', uploaded_by: 'ClimaTech Solutions', uploaded_at: '2026-01-10', visibility_scope: 'internal', responsible_company: 'ClimaTech Solutions', issued_at: '2026-01-10', expires_at: '2027-01-10' },
      { id: 'f5', name: 'PMOC Elevadores 360JK 2026', type: 'pdf', size: '2.1 MB', uploaded_by: 'TechElev Elevadores', uploaded_at: '2026-01-10', visibility_scope: 'internal', responsible_company: 'TechElev Elevadores', issued_at: '2026-01-10', expires_at: '2027-01-10' },
    ]},
    { id: 'rf2b', name: 'TVOC — Qualidade do Ar', icon: '📂', files: [
      { id: 'f21', name: 'Laudo TVOC Semestral', type: 'pdf', size: '1.8 MB', uploaded_by: 'AirQuality Lab', uploaded_at: '2025-09-15', visibility_scope: 'internal', responsible_company: 'AirQuality Lab', issued_at: '2025-09-15', expires_at: '2026-03-15' },
    ] },
    { id: 'rf2c', name: 'ART / RRT', icon: '📂', files: [
      { id: 'f22', name: 'ART Elétrica — Eng. Marcos Silva', type: 'pdf', size: '450 KB', uploaded_by: 'Tatiana Caracciolo', uploaded_at: '2025-06-20', visibility_scope: 'internal', responsible_company: 'Silva Engenharia', issued_at: '2025-06-20', expires_at: '2026-06-20' },
    ] },
    { id: 'rf2d', name: 'Laudos e Inspeções', icon: '📂', files: [
      { id: 'f6', name: 'Laudo Corpo de Bombeiros 2025', type: 'pdf', size: '5.2 MB', uploaded_by: 'Tatiana Caracciolo', uploaded_at: '2025-12-15', visibility_scope: 'internal', responsible_company: 'CBPMESP', issued_at: '2025-12-15', expires_at: '2026-12-15' },
      { id: 'f23', name: 'Laudo de Fachada 2024', type: 'pdf', size: '12 MB', uploaded_by: 'Tatiana Caracciolo', uploaded_at: '2024-08-10', visibility_scope: 'internal', responsible_company: 'StructPro Engenharia', issued_at: '2024-08-10', expires_at: '2026-08-10' },
    ]},
    { id: 'rf2e', name: 'PCIP', icon: '📂', files: [
      { id: 'f24', name: 'PCIP 360JK — Plano de Incêndio', type: 'pdf', size: '4.5 MB', uploaded_by: 'Tatiana Caracciolo', uploaded_at: '2025-05-01', visibility_scope: 'internal', responsible_company: 'FireSafe Consultoria', issued_at: '2025-05-01', expires_at: '2026-05-01' },
    ] },
    { id: 'rf2f', name: 'Projeto Executivo', icon: '📂', files: [] },
  ]},
  { id: 'rf3', name: 'ESG & Sustentabilidade', icon: '📁', children: [
    { id: 'rf3a', name: 'Relatórios LEED', icon: '📂', files: [
      { id: 'f7', name: 'LEED Gold 360JK — Auditoria 2025', type: 'pdf', size: '8.5 MB', uploaded_by: 'Tatiana Caracciolo', uploaded_at: '2025-11-20', visibility_scope: 'all_tenants', responsible_company: 'USGBC / Green Building', issued_at: '2025-11-20', expires_at: '2028-11-20' },
    ]},
    { id: 'rf3b', name: 'Relatórios I-REC', icon: '📂', files: [
      { id: 'f25', name: 'Certificado I-REC 2025', type: 'pdf', size: '1.1 MB', uploaded_by: 'SolarPro Energia', uploaded_at: '2025-07-01', visibility_scope: 'all_tenants', responsible_company: 'SolarPro Energia', issued_at: '2025-07-01', expires_at: '2026-07-01' },
    ] },
    { id: 'rf3c', name: 'Consumo de Energia', icon: '📂', files: [
      { id: 'f26', name: 'Relatório Energia Fev/2026', type: 'pdf', size: '650 KB', uploaded_by: 'Tatiana Caracciolo', uploaded_at: '2026-02-28', visibility_scope: 'internal', responsible_company: 'Administradora', issued_at: '2026-02-28' },
    ] },
    { id: 'rf3d', name: 'Consumo de Água', icon: '📂', files: [
      { id: 'f27', name: 'Relatório Água Fev/2026', type: 'pdf', size: '520 KB', uploaded_by: 'Tatiana Caracciolo', uploaded_at: '2026-02-28', visibility_scope: 'internal', responsible_company: 'Administradora', issued_at: '2026-02-28' },
    ] },
    { id: 'rf3e', name: 'Consumo de Gás', icon: '📂', files: [] },
    { id: 'rf3f', name: 'Resíduos e Reciclagem', icon: '📂', files: [] },
    { id: 'rf3g', name: 'Carbono e Emissões', icon: '📂', files: [] },
    { id: 'rf3h', name: 'GRI / SASB / CDP', icon: '📂', files: [] },
  ]},
  { id: 'rf4', name: 'Financeiro', icon: '📁', children: [
    { id: 'rf4a', name: 'Rateio de Consumo', icon: '📂', files: [
      { id: 'f28', name: 'Rateio Energia Fev/2026', type: 'xlsx', size: '340 KB', uploaded_by: 'Tatiana Caracciolo', uploaded_at: '2026-03-05', visibility_scope: 'all_tenants', responsible_company: 'Administradora', issued_at: '2026-03-05' },
    ] },
    { id: 'rf4b', name: 'Receita de Locação', icon: '📂', files: [] },
    { id: 'rf4c', name: 'Inadimplência', icon: '📂', files: [] },
    { id: 'rf4d', name: 'Orçamento e Despesas', icon: '📂', files: [
      { id: 'f29', name: 'Orçamento Anual 2026 — Aprovado', type: 'pdf', size: '2.8 MB', uploaded_by: 'Tatiana Caracciolo', uploaded_at: '2025-12-20', visibility_scope: 'internal', responsible_company: 'Administradora', issued_at: '2025-12-20' },
    ] },
  ]},
  { id: 'rf5', name: 'Segurança e Compliance', icon: '📁', children: [
    { id: 'rf5a', name: 'Visitas e Controle de Acesso', icon: '📂', files: [] },
    { id: 'rf5b', name: 'Incidentes de Segurança', icon: '📂', files: [] },
    { id: 'rf5c', name: 'Auditorias Internas', icon: '📂', files: [] },
    { id: 'rf5d', name: 'Licenças e Alvarás', icon: '📂', files: [
      { id: 'f8', name: 'Alvará de Funcionamento 2026', type: 'pdf', size: '2.3 MB', uploaded_by: 'Tatiana Caracciolo', uploaded_at: '2026-01-05', visibility_scope: 'internal', responsible_company: 'Prefeitura SP', issued_at: '2026-01-05', expires_at: '2027-01-05' },
      { id: 'f30', name: 'Licença Sanitária 2025', type: 'pdf', size: '1.1 MB', uploaded_by: 'Tatiana Caracciolo', uploaded_at: '2025-03-10', visibility_scope: 'internal', responsible_company: 'COVISA / Vigilância', issued_at: '2025-03-10', expires_at: '2026-03-10' },
    ]},
  ]},
  { id: 'rf6', name: 'Fornecedores', icon: '📁', children: [
    { id: 'rf6a', name: 'Contratos de Fornecimento', icon: '📂', files: [
      { id: 'f31', name: 'Contrato ClimaTech — HVAC 2026', type: 'pdf', size: '1.9 MB', uploaded_by: 'Tatiana Caracciolo', uploaded_at: '2026-01-02', visibility_scope: 'internal', responsible_company: 'ClimaTech Solutions', issued_at: '2026-01-02', expires_at: '2026-12-31' },
      { id: 'f32', name: 'Contrato EcoClean — Limpeza 2026', type: 'pdf', size: '1.4 MB', uploaded_by: 'Tatiana Caracciolo', uploaded_at: '2026-01-02', visibility_scope: 'internal', responsible_company: 'EcoClean Serviços', issued_at: '2026-01-02', expires_at: '2026-12-31' },
    ] },
    { id: 'rf6b', name: 'Avaliações de Fornecedores', icon: '📂', files: [] },
    { id: 'rf6c', name: 'Propostas e Cotações', icon: '📂', files: [] },
  ]},
];

// roleLabels and roleColors are defined at the top of this file

export const priorityColors: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  normal: 'bg-interactive/10 text-interactive',
  high: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  urgent: 'bg-destructive/10 text-destructive',
};

export const statusColors: Record<string, string> = {
  open: 'bg-destructive/10 text-destructive',
  in_analysis: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  in_progress: 'bg-interactive/10 text-interactive',
  awaiting_approval: 'bg-hover/10 text-hover',
  completed: 'bg-success/10 text-success',
  cancelled: 'bg-muted text-muted-foreground',
  active: 'bg-success/10 text-success',
  expiring: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  expired: 'bg-destructive/10 text-destructive',
  negotiation: 'bg-interactive/10 text-interactive',
  terminated: 'bg-muted text-muted-foreground',
  confirmed: 'bg-success/10 text-success',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  approved: 'bg-success/10 text-success',
  suspended: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  rejected: 'bg-destructive/10 text-destructive',
  scheduled: 'bg-interactive/10 text-interactive',
  waiting: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  present: 'bg-success/10 text-success',
  departed: 'bg-muted text-muted-foreground',
  denied: 'bg-destructive/10 text-destructive',
  paid: 'bg-success/10 text-success',
  overdue: 'bg-destructive/10 text-destructive',
};

export const statusLabels: Record<string, string> = {
  open: 'Aberto',
  in_analysis: 'Em Análise',
  in_progress: 'Em Execução',
  awaiting_approval: 'Aguardando',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  active: 'Ativo',
  expiring: 'Vencendo',
  expired: 'Vencido',
  negotiation: 'Em Negociação',
  terminated: 'Rescindido',
  confirmed: 'Confirmada',
  pending: 'Pendente',
  approved: 'Homologado',
  suspended: 'Suspenso',
  rejected: 'Reprovado',
  scheduled: 'Agendado',
  waiting: 'Aguardando',
  present: 'Presente',
  departed: 'Saiu',
  denied: 'Negado',
  paid: 'Pago',
  overdue: 'Atrasado',
};

export const categoryIcons: Record<string, string> = {
  'Climatização': '❄️',
  'Elétrica': '💡',
  'Hidráulica': '🔧',
  'Manutenção': '🛠️',
  'Limpeza': '🧹',
  'Elevadores': '🛗',
  'Segurança': '🔒',
  'Paisagismo': '🌿',
  'TI': '💻',
  'Estacionamento': '🅿️',
};

// ─── Building Financial Data for Leakage Analysis ─────────────
export const buildingFinancials: Record<string, { iptuAnual: number; condominioMensal: number }> = {
  b8: { iptuAnual: 180000, condominioMensal: 45000 },
  b7: { iptuAnual: 150000, condominioMensal: 38000 },
  b2: { iptuAnual: 220000, condominioMensal: 52000 },
  b3: { iptuAnual: 310000, condominioMensal: 68000 },
  b4: { iptuAnual: 175000, condominioMensal: 35000 },
  b5: { iptuAnual: 140000, condominioMensal: 30000 },
  b6: { iptuAnual: 420000, condominioMensal: 85000 },
};

// ─── Monthly Snapshots for Comparative Report ─────────────
export const monthlySnapshots = [
  {
    period: 'Fev/2026',
    occupancy: 89.2, revenue: 4237000, vacancy_m2: 7200, wault: 24.5,
    contracts_started: 1, contracts_ended: 0, adjustments_applied: 2,
    chamados_opened: 8, chamados_resolved: 6, sla_compliance: 87.5,
    docs_uploaded: 4, docs_expired: 1, docs_renewed: 2,
    expenses: 1420000, alerts_new: 3,
  },
  {
    period: 'Mar/2026',
    occupancy: 90.1, revenue: 4366950, vacancy_m2: 6850, wault: 23.8,
    contracts_started: 2, contracts_ended: 1, adjustments_applied: 3,
    chamados_opened: 6, chamados_resolved: 7, sla_compliance: 91.2,
    docs_uploaded: 6, docs_expired: 0, docs_renewed: 3,
    expenses: 1380000, alerts_new: 2,
  },
  {
    period: 'Abr/2026',
    occupancy: 90.8, revenue: 4366950, vacancy_m2: 6350, wault: 23.1,
    contracts_started: 1, contracts_ended: 0, adjustments_applied: 1,
    chamados_opened: 5, chamados_resolved: 8, sla_compliance: 93.0,
    docs_uploaded: 3, docs_expired: 1, docs_renewed: 1,
    expenses: 1350000, alerts_new: 4,
  },
];
