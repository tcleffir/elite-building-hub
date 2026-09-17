import {
  LayoutDashboard, Megaphone, FileText, Ticket, Building2,
  CalendarDays, ShoppingCart, Leaf, Users, BarChart3, Settings,
  DollarSign, ClipboardList, Shield, Store, Search,
  Vote, Calculator, BookOpen, Receipt, Banknote, HardHat, Contact, Package,
  PieChart, Calendar, TrendingUp, Wrench, Boxes, Wallet, Landmark
} from "lucide-react";
import { UserRole } from "./mock-data";
import { LucideIcon } from "lucide-react";

export interface MenuItem {
  title: string;
  url: string;
  icon: any;
}

// ─── Group-based navigation system ─────────────────

export interface NavItem {
  label: string;
  labelKey?: string; // i18n key
  path: string;
  icon: LucideIcon;
  roles: UserRole[];
  /** Módulo existente porém não habilitado para o cliente (exibe cadeado e bloqueia navegação) */
  locked?: boolean;
  lockedReason?: string;
}

export interface NavGroup {
  id: string;
  label: string;
  labelKey?: string; // i18n key
  icon: LucideIcon;
  items: NavItem[];
  section?: 'main' | 'footer';
  locked?: boolean;
  lockedReason?: string;
}


export const navGroups: NavGroup[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    labelKey: 'nav.dashboard',
    icon: LayoutDashboard,
    items: [
      { label: 'Dashboard', labelKey: 'nav.dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['super_admin', 'building_manager', 'owner', 'tenant_admin', 'tenant_employee', 'vendor', 'concierge'] },
    ],
  },
  {
    id: 'comunicacao',
    label: 'Comunicação',
    labelKey: 'nav.comunicacao',
    icon: Megaphone,
    items: [
      { label: 'Comunicados', labelKey: 'nav.comunicados', path: '/comunicados', icon: Megaphone, roles: ['super_admin', 'building_manager', 'owner', 'tenant_admin', 'tenant_employee'] },
      { label: 'Contatos', labelKey: 'nav.contatos', path: '/contatos', icon: Contact, roles: ['super_admin', 'building_manager'] },
    ],
  },
  {
    id: 'operacoes',
    label: 'Operações',
    labelKey: 'nav.operacoes',
    icon: Ticket,
    items: [
      { label: 'Chamados', labelKey: 'nav.chamados', path: '/chamados', icon: Ticket, roles: ['super_admin', 'building_manager', 'owner', 'tenant_admin', 'tenant_employee', 'vendor', 'concierge'] },
      { label: 'Visitantes', labelKey: 'nav.visitantes', path: '/visitantes', icon: Users, roles: ['super_admin', 'building_manager', 'tenant_admin', 'concierge'] },
      { label: 'Encomendas', labelKey: 'nav.encomendas', path: '/encomendas', icon: Package, roles: ['super_admin', 'building_manager', 'tenant_admin', 'tenant_employee', 'concierge'] },
      { label: 'Reservas', labelKey: 'nav.reservas', path: '/reservas', icon: CalendarDays, roles: ['super_admin', 'building_manager', 'owner', 'tenant_admin', 'tenant_employee'] },
    ],
  },
  {
    id: 'edificio',
    label: 'Ativo',
    labelKey: 'nav.edificio',
    icon: Building2,
    items: [
      { label: 'Mapa do Ativo', labelKey: 'nav.mapaEdificio', path: '/edificio', icon: Building2, roles: ['super_admin', 'building_manager', 'owner', 'tenant_admin', 'concierge'] },
      { label: 'Inspeção Predial', labelKey: 'nav.inspecao', path: '/inspecao', icon: Search, roles: ['super_admin', 'building_manager', 'owner'] },
      { label: 'Ativos', labelKey: 'nav.ativos', path: '/ativos', icon: Boxes, roles: ['super_admin', 'building_manager'] },
    ],
  },
  {
    id: 'financeiro',
    label: 'Financeiro',
    labelKey: 'nav.financeiro',
    icon: DollarSign,
    items: [
      { label: 'Contratos', labelKey: 'nav.contratos', path: '/contratos', icon: FileText, roles: ['super_admin', 'owner'] },
      { label: 'Financeiro', labelKey: 'nav.financeiro', path: '/financeiro', icon: DollarSign, roles: ['super_admin', 'building_manager', 'owner'] },
      { label: 'Orçamento', labelKey: 'nav.orcamento', path: '/orcamento', icon: Banknote, roles: ['super_admin', 'building_manager'] },
    ],
  },
  {
    id: 'sustentabilidade',
    label: 'Sustentabilidade',
    labelKey: 'nav.sustentabilidade',
    icon: Leaf,
    items: [
      { label: 'ESG', labelKey: 'nav.esg', path: '/esg', icon: Leaf, roles: ['super_admin', 'building_manager', 'owner', 'tenant_admin'] },
      { label: 'Rateio de Consumo', labelKey: 'nav.rateio', path: '/rateio', icon: Receipt, roles: ['super_admin', 'building_manager'] },
    ],
  },
  {
    id: 'governanca',
    label: 'Governança',
    labelKey: 'nav.governanca',
    icon: Vote,
    items: [
      { label: 'Assembleia', labelKey: 'nav.assembleia', path: '/assembleia', icon: Vote, roles: ['super_admin', 'building_manager', 'owner'] },
      { label: 'Relatórios', labelKey: 'nav.relatorios', path: '/relatorios', icon: BarChart3, roles: ['super_admin', 'building_manager'] },
      { label: 'Calendário', labelKey: 'nav.calendario', path: '/calendario', icon: Calendar, roles: ['super_admin', 'building_manager', 'owner', 'tenant_admin', 'tenant_employee', 'concierge'] },
    ],
  },
  {
    id: 'marketplace',
    label: 'Marketplace',
    labelKey: 'nav.marketplace',
    icon: ShoppingCart,
    items: [
      { label: 'Marketplace', labelKey: 'nav.marketplace', path: '/marketplace', icon: ShoppingCart, roles: ['super_admin', 'building_manager', 'owner', 'tenant_admin', 'tenant_employee'] },
    ],
  },
  {
    id: 'apoio',
    label: 'Apoio ao Gerente',
    labelKey: 'nav.apoio',
    icon: BookOpen,
    section: 'footer',
    items: [
      { label: 'Apoio ao Gerente', labelKey: 'nav.apoio', path: '/apoio', icon: BookOpen, roles: ['super_admin', 'building_manager'] },
    ],
  },
  {
    id: 'configuracoes',
    label: 'Configurações',
    labelKey: 'nav.configuracoes',
    icon: Settings,
    section: 'footer',
    items: [
      { label: 'Configurações', labelKey: 'nav.configuracoes', path: '/configuracoes', icon: Settings, roles: ['super_admin', 'building_manager', 'owner', 'tenant_admin', 'concierge', 'vendor'] },
    ],
  },
];

// ─── gestor_fundo exclusive nav ────────────────────────
export const gestorFundoNav: NavGroup[] = [
  { id: 'portfolio_gf', label: 'Portfólio', labelKey: 'nav.portfolio', icon: PieChart,
    items: [{ label: 'Portfólio', labelKey: 'nav.portfolio', path: '/proprietario/portfolio', icon: PieChart, roles: ['gestor_fundo'] }] },
  { id: 'contratos_gf', label: 'Contratos', icon: FileText,
    items: [{ label: 'Contratos', path: '/proprietario/contratos', icon: FileText, roles: ['gestor_fundo'] }] },
  { id: 'financeiro_gf', label: 'Financeiro', icon: DollarSign,
    items: [
      { label: 'Fechamento Mensal', path: '/proprietario/financeiro-locacao', icon: DollarSign, roles: ['gestor_fundo'] },
      { label: 'Conciliação Financeira', path: '/proprietario/conciliacao-financeira', icon: Banknote, roles: ['gestor_fundo'] },
      { label: 'Outros Recebimentos', path: '/proprietario/outros-recebimentos', icon: Receipt, roles: ['gestor_fundo'] },
      { label: 'Despesas & NOI', path: '/proprietario/despesas', icon: Wallet, roles: ['gestor_fundo'] },

      { label: 'Métricas e KPIs', path: '/proprietario/metricas-kpis', icon: TrendingUp, roles: ['gestor_fundo'] },
      { label: 'Relatórios', path: '/proprietario/relatorios-locacao', icon: BarChart3, roles: ['gestor_fundo'] },
    ] },
  { id: 'ativos_gf', label: 'Ativos', icon: Building2,
    items: [
      { label: 'Mapa de Ativos', path: '/proprietario/edificios', icon: Building2, roles: ['gestor_fundo'] },
      { label: 'Documentos', path: '/proprietario/documentos', icon: FileText, roles: ['gestor_fundo'] },
    ] },
  { id: 'operacoes_gf', label: 'Operações', icon: Wrench,
    items: [
      { label: 'Chamados', labelKey: 'nav.chamados', path: '/proprietario/chamados', icon: Ticket, roles: ['gestor_fundo'], locked: true, lockedReason: 'Chamados e SLA não fazem parte do escopo inicial do fundo.' },
      { label: 'Reservas', labelKey: 'nav.reservas', path: '/proprietario/reservas', icon: CalendarDays, roles: ['gestor_fundo'] },
      { label: 'Comunicação', labelKey: 'nav.comunicacao', path: '/proprietario/comunicacao', icon: Megaphone, roles: ['gestor_fundo'] },
      { label: 'CRM Monday', path: '/proprietario/crm-monday', icon: Boxes, roles: ['gestor_fundo'] },
    ] },
  { id: 'calendario_gf', label: 'Calendário', labelKey: 'nav.calendario', icon: Calendar, locked: true, lockedReason: 'Integração de calendário (Google/Outlook) não entra nesta primeira fase.',
    items: [{ label: 'Calendário', labelKey: 'nav.calendario', path: '/proprietario/calendario', icon: Calendar, roles: ['gestor_fundo'], locked: true, lockedReason: 'Integração de calendário (Google/Outlook) não entra nesta primeira fase.' }] },
  { id: 'sustentabilidade_gf', label: 'Sustentabilidade', labelKey: 'nav.sustentabilidade', icon: Leaf, locked: true, lockedReason: 'Módulo ESG disponível, porém sem integração contratada.',
    items: [{ label: 'Sustentabilidade', labelKey: 'nav.sustentabilidade', path: '/proprietario/sustentabilidade', icon: Leaf, roles: ['gestor_fundo'], locked: true, lockedReason: 'Módulo ESG disponível, porém sem integração contratada.' }] },
  { id: 'relatorio_mensal_gf', label: 'Relatório Mensal', icon: TrendingUp,
    items: [{ label: 'Relatório Mensal', path: '/proprietario/relatorio-mensal', icon: TrendingUp, roles: ['gestor_fundo'] }] },
  { id: 'marketplace_gf', label: 'Marketplace', labelKey: 'nav.marketplace', icon: ShoppingCart, locked: true, lockedReason: 'Marketplace de fornecedores não será implementado nesta fase.',
    items: [{ label: 'Marketplace', labelKey: 'nav.marketplace', path: '/marketplace', icon: ShoppingCart, roles: ['gestor_fundo'], locked: true, lockedReason: 'Marketplace de fornecedores não será implementado nesta fase.' }] },
  { id: 'apoio_gf', label: 'Apoio ao Gestor', labelKey: 'nav.apoio', icon: BookOpen, section: 'footer' as const, locked: true, lockedReason: 'Treinamentos e padronização de processos não entram nesta fase.',
    items: [{ label: 'Apoio ao Gestor', labelKey: 'nav.apoio', path: '/apoio', icon: BookOpen, roles: ['gestor_fundo'], locked: true, lockedReason: 'Treinamentos e padronização de processos não entram nesta fase.' }] },
  { id: 'configuracoes_gf', label: 'Configurações', labelKey: 'nav.configuracoes', icon: Settings, section: 'footer' as const,
    items: [{ label: 'Configurações', labelKey: 'nav.configuracoes', path: '/proprietario/configuracoes', icon: Settings, roles: ['gestor_fundo'] }] },
];


/** Map group IDs to premium module keys (only groups that can be blocked) */
export const moduleKeyForGroup: Record<string, string> = {
  sustentabilidade: 'sustainability',
};

/** Get visible groups for a role, applying the solo/folder rule */
export function getVisibleNav(role: UserRole) {
  if (role === 'gestor_fundo') return gestorFundoNav;
  return navGroups
    .map(group => {
      const visibleItems = group.items.filter(item => item.roles.includes(role));
      if (visibleItems.length === 0) return null;
      return { ...group, items: visibleItems };
    })
    .filter(Boolean) as NavGroup[];
}

// Legacy menuByRole for backward compatibility
function buildLegacyMenu(role: UserRole): MenuItem[] {
  const groups = getVisibleNav(role);
  const items: MenuItem[] = [];
  for (const group of groups) {
    for (const item of group.items) {
      items.push({ title: item.label, url: item.path, icon: item.icon });
    }
  }
  return items;
}

export const menuByRole: Record<UserRole, MenuItem[]> = {
  super_admin: buildLegacyMenu('super_admin'),
  building_manager: buildLegacyMenu('building_manager'),
  owner: buildLegacyMenu('owner'),
  tenant_admin: buildLegacyMenu('tenant_admin'),
  tenant_employee: buildLegacyMenu('tenant_employee'),
  vendor: buildLegacyMenu('vendor'),
  concierge: buildLegacyMenu('concierge'),
  gestor_fundo: buildLegacyMenu('gestor_fundo'),
};

// ─── Route access permissions per role ─────────────────

export const routeAccess: Record<string, UserRole[]> = {
  '/dashboard':       ['super_admin', 'building_manager', 'owner', 'tenant_admin', 'tenant_employee', 'vendor', 'concierge', 'gestor_fundo'],
  '/proprietario/portfolio':  ['gestor_fundo'],
  '/proprietario/edificios':  ['gestor_fundo'],
  '/proprietario/calendario': ['gestor_fundo'],
  '/proprietario/sustentabilidade': ['gestor_fundo'],
  '/proprietario/documentos': ['gestor_fundo'],
  '/proprietario/chamados':   ['gestor_fundo'],
  '/proprietario/reservas':   ['gestor_fundo'],
  '/proprietario/comunicacao':['gestor_fundo'],
  '/proprietario/contratos':    ['gestor_fundo'],
  '/proprietario/financeiro-locacao': ['gestor_fundo'],
  '/proprietario/relatorios-locacao': ['gestor_fundo'],
  
  '/proprietario/conciliacao-financeira': ['gestor_fundo'],
  '/proprietario/outros-recebimentos': ['gestor_fundo'],
  '/proprietario/despesas': ['gestor_fundo'],
  '/proprietario/metricas-kpis': ['gestor_fundo'],
  '/proprietario/configuracoes': ['gestor_fundo'],
  '/proprietario/relatorio-mensal': ['gestor_fundo'],
  '/proprietario/crm-monday': ['gestor_fundo'],
  '/proprietario/alertas': ['gestor_fundo'],
  '/portfolio':       ['gestor_fundo'],
  '/portfolio/:buildingId': ['gestor_fundo'],
  '/comunicados':     ['super_admin', 'building_manager', 'owner', 'tenant_admin', 'tenant_employee'],
  '/comunicados/novo':['super_admin', 'building_manager'],
  '/contatos':        ['super_admin', 'building_manager'],
  '/contratos':       ['super_admin', 'owner'],
  '/chamados':        ['super_admin', 'building_manager', 'owner', 'tenant_admin', 'tenant_employee', 'vendor', 'concierge'],
  '/edificio':        ['super_admin', 'building_manager', 'owner', 'tenant_admin', 'concierge'],
  '/inspecao':        ['super_admin', 'building_manager', 'owner'],
  '/ativos':          ['super_admin', 'building_manager'],
  '/reservas':        ['super_admin', 'building_manager', 'owner', 'tenant_admin', 'tenant_employee'],
  '/marketplace':     ['super_admin', 'building_manager', 'owner', 'tenant_admin', 'tenant_employee'],
  '/esg':             ['super_admin', 'building_manager', 'owner', 'tenant_admin', 'gestor_fundo'],
  '/esg/certificacoes': ['super_admin', 'building_manager', 'owner', 'tenant_admin', 'gestor_fundo'],
  '/rateio':          ['super_admin', 'building_manager'],
  '/orcamento':       ['super_admin', 'building_manager'],
  '/financeiro':      ['super_admin', 'building_manager', 'owner'],
  '/assembleia':      ['super_admin', 'building_manager', 'owner'],
  '/visitantes':      ['super_admin', 'building_manager', 'tenant_admin', 'concierge'],
  '/relatorios':      ['super_admin', 'building_manager'],
  '/configuracoes':   ['super_admin', 'building_manager', 'owner', 'tenant_admin', 'concierge', 'vendor', 'gestor_fundo'],
  '/encomendas':      ['super_admin', 'building_manager', 'tenant_admin', 'tenant_employee', 'concierge'],
  '/apoio':           ['super_admin', 'building_manager'],
  '/ferramentas':     ['super_admin', 'building_manager'],
  '/proprietario':    ['owner'],
  '/calendario':      ['super_admin', 'building_manager', 'owner', 'tenant_admin', 'tenant_employee', 'concierge', 'gestor_fundo'],
};

export function canAccess(role: UserRole, path: string): boolean {
  if (routeAccess[path]) return routeAccess[path].includes(role);
  const segments = path.split('/').filter(Boolean);
  for (let i = segments.length; i > 0; i--) {
    const prefix = '/' + segments.slice(0, i).join('/');
    if (routeAccess[prefix]) return routeAccess[prefix].includes(role);
  }
  return false;
}

// ─── Permissions matrix ─────────────────

export interface RolePermissions {
  canCreateAnnouncements: boolean;
  canDeleteAnnouncements: boolean;
  canScheduleAnnouncements: boolean;
  canViewAllContracts: boolean;
  canModifyAllContracts: boolean;
  canViewOwnContracts: boolean;
  canViewContractValues: boolean;
  canViewContractPDF: boolean;
  canManageAllTickets: boolean;
  canCreateTickets: boolean;
  canViewAllTickets: boolean;
  canDragDropTickets: boolean;
  canCreateTicketsOnBehalf: boolean;
  canManageReservations: boolean;
  canCreateReservations: boolean;
  canViewAllReservations: boolean;
  canBlockCalendar: boolean;
  canManageUsers: boolean;
  canInviteUsers: boolean;
  canManageSubAccounts: boolean;
  canManageBuildings: boolean;
  canEditFloorInfo: boolean;
  canManageVendors: boolean;
  canHomologateVendors: boolean;
  canAddHomologatedVendors: boolean;
  canManageOwnVendorProfile: boolean;
  canBrowseMarketplace: boolean;
  canAccessFinancials: boolean;
  canAccessOwnFinancials: boolean;
  canAccessESG: boolean;
  canManageESG: boolean;
  canManageAllVisitors: boolean;
  canManageOwnVisitors: boolean;
  canCreateQRInvites: boolean;
  canControlAccess: boolean;
  canPanicButton: boolean;
  canUploadReports: boolean;
  canManageReportDashboards: boolean;
  canImpersonate: boolean;
  canManageGlobalSettings: boolean;
  canManageBuildingSettings: boolean;
  canManageBudget: boolean;
  canApproveBudget: boolean;
  canManageAssemblies: boolean;
  canVoteInAssemblies: boolean;
  canManageInspections: boolean;
  canRequestObra: boolean;
}

export const permissionsByRole: Record<UserRole, RolePermissions> = {
  super_admin: {
    canCreateAnnouncements: true, canDeleteAnnouncements: true, canScheduleAnnouncements: true,
    canViewAllContracts: true, canModifyAllContracts: true, canViewOwnContracts: true,
    canViewContractValues: true, canViewContractPDF: true,
    canManageAllTickets: true, canCreateTickets: true, canViewAllTickets: true, canDragDropTickets: true, canCreateTicketsOnBehalf: true,
    canManageReservations: true, canCreateReservations: true, canViewAllReservations: true, canBlockCalendar: true,
    canManageUsers: true, canInviteUsers: true, canManageSubAccounts: true,
    canManageBuildings: true, canEditFloorInfo: true,
    canManageVendors: true, canHomologateVendors: true, canAddHomologatedVendors: true, canManageOwnVendorProfile: false, canBrowseMarketplace: true,
    canAccessFinancials: true, canAccessOwnFinancials: true,
    canAccessESG: true, canManageESG: true,
    canManageAllVisitors: true, canManageOwnVisitors: true, canCreateQRInvites: true, canControlAccess: true, canPanicButton: true,
    canUploadReports: true, canManageReportDashboards: true,
    canImpersonate: true, canManageGlobalSettings: true, canManageBuildingSettings: true,
    canManageBudget: true, canApproveBudget: true, canManageAssemblies: true, canVoteInAssemblies: true, canManageInspections: true,
    canRequestObra: false,
  },
  building_manager: {
    canCreateAnnouncements: true, canDeleteAnnouncements: true, canScheduleAnnouncements: true,
    canViewAllContracts: false, canModifyAllContracts: false, canViewOwnContracts: false,
    canViewContractValues: false, canViewContractPDF: false,
    canManageAllTickets: true, canCreateTickets: true, canViewAllTickets: true, canDragDropTickets: true, canCreateTicketsOnBehalf: true,
    canManageReservations: true, canCreateReservations: true, canViewAllReservations: true, canBlockCalendar: true,
    canManageUsers: false, canInviteUsers: true, canManageSubAccounts: false,
    canManageBuildings: false, canEditFloorInfo: true,
    canManageVendors: true, canHomologateVendors: false, canAddHomologatedVendors: true, canManageOwnVendorProfile: false, canBrowseMarketplace: true,
    canAccessFinancials: true, canAccessOwnFinancials: false,
    canAccessESG: true, canManageESG: true,
    canManageAllVisitors: true, canManageOwnVisitors: true, canCreateQRInvites: true, canControlAccess: true, canPanicButton: true,
    canUploadReports: true, canManageReportDashboards: true,
    canImpersonate: false, canManageGlobalSettings: false, canManageBuildingSettings: true,
    canManageBudget: true, canApproveBudget: false, canManageAssemblies: true, canVoteInAssemblies: false, canManageInspections: true,
    canRequestObra: false,
  },
  owner: {
    canCreateAnnouncements: false, canDeleteAnnouncements: false, canScheduleAnnouncements: false,
    canViewAllContracts: true, canModifyAllContracts: false, canViewOwnContracts: true,
    canViewContractValues: true, canViewContractPDF: true,
    canManageAllTickets: false, canCreateTickets: true, canViewAllTickets: true, canDragDropTickets: false, canCreateTicketsOnBehalf: false,
    canManageReservations: false, canCreateReservations: false, canViewAllReservations: false, canBlockCalendar: false,
    canManageUsers: false, canInviteUsers: false, canManageSubAccounts: false,
    canManageBuildings: false, canEditFloorInfo: false,
    canManageVendors: false, canHomologateVendors: false, canAddHomologatedVendors: false, canManageOwnVendorProfile: false, canBrowseMarketplace: true,
    canAccessFinancials: true, canAccessOwnFinancials: true,
    canAccessESG: true, canManageESG: false,
    canManageAllVisitors: false, canManageOwnVisitors: false, canCreateQRInvites: false, canControlAccess: false, canPanicButton: false,
    canUploadReports: true, canManageReportDashboards: false,
    canImpersonate: false, canManageGlobalSettings: false, canManageBuildingSettings: false,
    canManageBudget: false, canApproveBudget: true, canManageAssemblies: false, canVoteInAssemblies: true, canManageInspections: false,
    canRequestObra: false,
  },
  tenant_admin: {
    canCreateAnnouncements: false, canDeleteAnnouncements: false, canScheduleAnnouncements: false,
    canViewAllContracts: false, canModifyAllContracts: false, canViewOwnContracts: false,
    canViewContractValues: false, canViewContractPDF: false,
    canManageAllTickets: false, canCreateTickets: true, canViewAllTickets: false, canDragDropTickets: false, canCreateTicketsOnBehalf: false,
    canManageReservations: false, canCreateReservations: true, canViewAllReservations: false, canBlockCalendar: false,
    canManageUsers: false, canInviteUsers: true, canManageSubAccounts: true,
    canManageBuildings: false, canEditFloorInfo: false,
    canManageVendors: false, canHomologateVendors: false, canAddHomologatedVendors: false, canManageOwnVendorProfile: false, canBrowseMarketplace: true,
    canAccessFinancials: false, canAccessOwnFinancials: true,
    canAccessESG: false, canManageESG: false,
    canManageAllVisitors: false, canManageOwnVisitors: true, canCreateQRInvites: true, canControlAccess: false, canPanicButton: false,
    canUploadReports: false, canManageReportDashboards: false,
    canImpersonate: false, canManageGlobalSettings: false, canManageBuildingSettings: false,
    canManageBudget: false, canApproveBudget: false, canManageAssemblies: false, canVoteInAssemblies: false, canManageInspections: false,
    canRequestObra: true,
  },
  tenant_employee: {
    canCreateAnnouncements: false, canDeleteAnnouncements: false, canScheduleAnnouncements: false,
    canViewAllContracts: false, canModifyAllContracts: false, canViewOwnContracts: false,
    canViewContractValues: false, canViewContractPDF: false,
    canManageAllTickets: false, canCreateTickets: true, canViewAllTickets: false, canDragDropTickets: false, canCreateTicketsOnBehalf: false,
    canManageReservations: false, canCreateReservations: true, canViewAllReservations: false, canBlockCalendar: false,
    canManageUsers: false, canInviteUsers: false, canManageSubAccounts: false,
    canManageBuildings: false, canEditFloorInfo: false,
    canManageVendors: false, canHomologateVendors: false, canAddHomologatedVendors: false, canManageOwnVendorProfile: false, canBrowseMarketplace: true,
    canAccessFinancials: false, canAccessOwnFinancials: false,
    canAccessESG: false, canManageESG: false,
    canManageAllVisitors: false, canManageOwnVisitors: false, canCreateQRInvites: true, canControlAccess: false, canPanicButton: false,
    canUploadReports: false, canManageReportDashboards: false,
    canImpersonate: false, canManageGlobalSettings: false, canManageBuildingSettings: false,
    canManageBudget: false, canApproveBudget: false, canManageAssemblies: false, canVoteInAssemblies: false, canManageInspections: false,
    canRequestObra: true,
  },
  vendor: {
    canCreateAnnouncements: false, canDeleteAnnouncements: false, canScheduleAnnouncements: false,
    canViewAllContracts: false, canModifyAllContracts: false, canViewOwnContracts: false,
    canViewContractValues: false, canViewContractPDF: false,
    canManageAllTickets: false, canCreateTickets: false, canViewAllTickets: false, canDragDropTickets: false, canCreateTicketsOnBehalf: false,
    canManageReservations: false, canCreateReservations: false, canViewAllReservations: false, canBlockCalendar: false,
    canManageUsers: false, canInviteUsers: false, canManageSubAccounts: false,
    canManageBuildings: false, canEditFloorInfo: false,
    canManageVendors: false, canHomologateVendors: false, canAddHomologatedVendors: false, canManageOwnVendorProfile: true, canBrowseMarketplace: true,
    canAccessFinancials: false, canAccessOwnFinancials: false,
    canAccessESG: false, canManageESG: false,
    canManageAllVisitors: false, canManageOwnVisitors: false, canCreateQRInvites: false, canControlAccess: false, canPanicButton: false,
    canUploadReports: false, canManageReportDashboards: false,
    canImpersonate: false, canManageGlobalSettings: false, canManageBuildingSettings: false,
    canManageBudget: false, canApproveBudget: false, canManageAssemblies: false, canVoteInAssemblies: false, canManageInspections: false,
    canRequestObra: false,
  },
  concierge: {
    canCreateAnnouncements: false, canDeleteAnnouncements: false, canScheduleAnnouncements: false,
    canViewAllContracts: false, canModifyAllContracts: false, canViewOwnContracts: false,
    canViewContractValues: false, canViewContractPDF: false,
    canManageAllTickets: false, canCreateTickets: true, canViewAllTickets: false, canDragDropTickets: false, canCreateTicketsOnBehalf: false,
    canManageReservations: false, canCreateReservations: false, canViewAllReservations: true, canBlockCalendar: false,
    canManageUsers: false, canInviteUsers: false, canManageSubAccounts: false,
    canManageBuildings: false, canEditFloorInfo: false,
    canManageVendors: false, canHomologateVendors: false, canAddHomologatedVendors: false, canManageOwnVendorProfile: false, canBrowseMarketplace: false,
    canAccessFinancials: false, canAccessOwnFinancials: false,
    canAccessESG: false, canManageESG: false,
    canManageAllVisitors: true, canManageOwnVisitors: true, canCreateQRInvites: true, canControlAccess: true, canPanicButton: true,
    canUploadReports: false, canManageReportDashboards: false,
    canImpersonate: false, canManageGlobalSettings: false, canManageBuildingSettings: false,
    canManageBudget: false, canApproveBudget: false, canManageAssemblies: false, canVoteInAssemblies: false, canManageInspections: false,
    canRequestObra: false,
  },
  gestor_fundo: {
    canCreateAnnouncements: false, canDeleteAnnouncements: false, canScheduleAnnouncements: false,
    canViewAllContracts: true, canModifyAllContracts: false, canViewOwnContracts: false,
    canViewContractValues: true, canViewContractPDF: true,
    canManageAllTickets: false, canCreateTickets: false, canViewAllTickets: true, canDragDropTickets: false, canCreateTicketsOnBehalf: false,
    canManageReservations: false, canCreateReservations: false, canViewAllReservations: false, canBlockCalendar: false,
    canManageUsers: false, canInviteUsers: false, canManageSubAccounts: false,
    canManageBuildings: false, canEditFloorInfo: false,
    canManageVendors: false, canHomologateVendors: false, canAddHomologatedVendors: false, canManageOwnVendorProfile: false, canBrowseMarketplace: false,
    canAccessFinancials: true, canAccessOwnFinancials: false,
    canAccessESG: true, canManageESG: false,
    canManageAllVisitors: false, canManageOwnVisitors: false, canCreateQRInvites: false, canControlAccess: false, canPanicButton: false,
    canUploadReports: false, canManageReportDashboards: false,
    canImpersonate: false, canManageGlobalSettings: false, canManageBuildingSettings: false,
    canManageBudget: false, canApproveBudget: false, canManageAssemblies: false, canVoteInAssemblies: false, canManageInspections: false,
    canRequestObra: false,
  },
};
