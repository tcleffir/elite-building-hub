import { UserRole } from './mock-data';

// ─── Scope Types ──────────────────────────────────
export type ScopeType = 'building' | 'floor' | 'unit' | 'management';

export interface ScopeFilter {
  scope_type: ScopeType;
  scope_floors: number[];
}

// ─── Module Access Levels ─────────────────────────
export type AccessLevel = 'none' | 'view' | 'edit' | 'admin';

export const accessLevelLabels: Record<AccessLevel, string> = {
  none: 'Sem acesso',
  view: 'Visualizar',
  edit: 'Editar',
  admin: 'Aprovar/Admin',
};

export const moduleList = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'announcements', label: 'Comunicados' },
  { key: 'tickets', label: 'Chamados' },
  { key: 'contracts', label: 'Contratos' },
  { key: 'inspection', label: 'Inspeção' },
  { key: 'pmoc', label: 'PMOC / Manutenção' },
  { key: 'reservations', label: 'Reservas' },
  { key: 'esg', label: 'ESG / Consumos' },
  { key: 'rateio', label: 'Rateio' },
  { key: 'financial', label: 'Financeiro' },
  { key: 'documents', label: 'Documentos' },
  { key: 'visitors', label: 'Visitantes' },
  { key: 'packages', label: 'Encomendas' },
  { key: 'assembly', label: 'Assembleia' },
  { key: 'budget', label: 'Orçamento' },
  { key: 'marketplace', label: 'Marketplace' },
  { key: 'settings', label: 'Configurações' },
  { key: 'contacts', label: 'Contatos / Grupos' },
] as const;

export type ModuleKey = typeof moduleList[number]['key'];

export type ModulePermissions = Record<ModuleKey, AccessLevel>;

// ─── Default permissions by role ──────────────────
export const defaultPermissionsByRole: Record<UserRole, ModulePermissions> = {
  super_admin: {
    dashboard: 'admin', announcements: 'admin', tickets: 'admin', contracts: 'admin',
    inspection: 'admin', pmoc: 'admin', reservations: 'admin', esg: 'admin',
    rateio: 'admin', financial: 'admin', documents: 'admin', visitors: 'admin',
    packages: 'admin', assembly: 'admin', budget: 'admin', marketplace: 'admin',
    settings: 'admin', contacts: 'admin',
  },
  building_manager: {
    dashboard: 'admin', announcements: 'edit', tickets: 'admin', contracts: 'none',
    inspection: 'admin', pmoc: 'admin', reservations: 'admin', esg: 'edit',
    rateio: 'edit', financial: 'edit', documents: 'edit', visitors: 'admin',
    packages: 'edit', assembly: 'edit', budget: 'edit', marketplace: 'edit',
    settings: 'edit', contacts: 'edit',
  },
  owner: {
    dashboard: 'view', announcements: 'view', tickets: 'edit', contracts: 'view',
    inspection: 'view', pmoc: 'none', reservations: 'none', esg: 'view',
    rateio: 'none', financial: 'view', documents: 'view', visitors: 'none',
    packages: 'none', assembly: 'admin', budget: 'admin', marketplace: 'view',
    settings: 'view', contacts: 'none',
  },
  tenant_admin: {
    dashboard: 'view', announcements: 'view', tickets: 'edit', contracts: 'none',
    inspection: 'view', pmoc: 'none', reservations: 'edit', esg: 'view',
    rateio: 'none', financial: 'none', documents: 'view', visitors: 'edit',
    packages: 'view', assembly: 'none', budget: 'none', marketplace: 'view',
    settings: 'view', contacts: 'none',
  },
  tenant_employee: {
    dashboard: 'view', announcements: 'view', tickets: 'edit', contracts: 'none',
    inspection: 'none', pmoc: 'none', reservations: 'edit', esg: 'none',
    rateio: 'none', financial: 'none', documents: 'none', visitors: 'edit',
    packages: 'view', assembly: 'none', budget: 'none', marketplace: 'view',
    settings: 'none', contacts: 'none',
  },
  vendor: {
    dashboard: 'none', announcements: 'none', tickets: 'view', contracts: 'none',
    inspection: 'none', pmoc: 'none', reservations: 'none', esg: 'none',
    rateio: 'none', financial: 'none', documents: 'none', visitors: 'none',
    packages: 'none', assembly: 'none', budget: 'none', marketplace: 'edit',
    settings: 'view', contacts: 'none',
  },
  concierge: {
    dashboard: 'view', announcements: 'view', tickets: 'edit', contracts: 'none',
    inspection: 'none', pmoc: 'none', reservations: 'view', esg: 'none',
    rateio: 'none', financial: 'none', documents: 'none', visitors: 'admin',
    packages: 'admin', assembly: 'none', budget: 'none', marketplace: 'none',
    settings: 'view', contacts: 'none',
  },
  gestor_fundo: {
    dashboard: 'view', announcements: 'none', tickets: 'none', contracts: 'view',
    inspection: 'none', pmoc: 'none', reservations: 'none', esg: 'view',
    rateio: 'none', financial: 'view', documents: 'view', visitors: 'none',
    packages: 'none', assembly: 'none', budget: 'none', marketplace: 'none',
    settings: 'view', contacts: 'none',
  },
};

// ─── Scope visibility helpers ─────────────────────

const fullAccessRoles: UserRole[] = ['super_admin', 'building_manager'];

export function hasFullScopeAccess(role: UserRole, isSoleProprietor?: boolean): boolean {
  if (fullAccessRoles.includes(role)) return true;
  if (role === 'owner' && isSoleProprietor) return true;
  return false;
}

export function canSeeScope(
  userRole: UserRole,
  userFloors: number[],
  isSoleProprietor: boolean,
  scope: ScopeFilter
): boolean {
  // Full access roles see everything
  if (hasFullScopeAccess(userRole, isSoleProprietor)) return true;

  // Building-wide scope is visible to all
  if (scope.scope_type === 'building') return true;

  // Management scope
  if (scope.scope_type === 'management') {
    return ['super_admin', 'building_manager', 'concierge'].includes(userRole);
  }

  // Concierge: building + management only (except packages/visitors)
  if (userRole === 'concierge') return false;

  // Vendor: doesn't use scope — filtered by assignment
  if (userRole === 'vendor') return false;

  // Floor/unit scope: check floor overlap
  if (scope.scope_type === 'floor' || scope.scope_type === 'unit') {
    return scope.scope_floors.some(f => userFloors.includes(f));
  }

  return false;
}

// ─── Scope badge helpers ──────────────────────────
export function getScopeBadge(scope: ScopeFilter): { label: string; color: string } {
  if (scope.scope_type === 'building') return { label: '🟢 Área Comum', color: 'bg-success/10 text-success' };
  if (scope.scope_type === 'management') return { label: '🔒 Gestão', color: 'bg-muted text-muted-foreground' };
  if (scope.scope_type === 'floor' || scope.scope_type === 'unit') {
    const floors = scope.scope_floors;
    if (floors.length === 0) return { label: 'Sem andar', color: 'bg-muted text-muted-foreground' };
    const floorColors: Record<number, string> = {
      2: 'bg-purple-100 text-purple-800', 3: 'bg-purple-100 text-purple-800', 4: 'bg-purple-100 text-purple-800',
      7: 'bg-blue-100 text-blue-800', 13: 'bg-orange-100 text-orange-800',
    };
    const color = floorColors[floors[0]] || 'bg-amber-100 text-amber-800';
    const label = floors.length === 1 ? `${floors[0]}º Andar` : `${floors.map(f => `${f}º`).join('–')} Andares`;
    return { label, color };
  }
  return { label: 'N/A', color: 'bg-muted text-muted-foreground' };
}

// ─── Role descriptions for wizard ─────────────────
export const roleDescriptions: Record<UserRole, { icon: string; description: string }> = {
  super_admin: { icon: '👑', description: 'Acesso total à plataforma e todos os ativos' },
  building_manager: { icon: '🏢', description: 'Gerencia o ativo — operação completa' },
  owner: { icon: '👔', description: 'Dono de unidade(s) do ativo' },
  tenant_admin: { icon: '🏬', description: 'Responsável pela empresa locatária' },
  tenant_employee: { icon: '👤', description: 'Colaborador da empresa (acesso limitado)' },
  concierge: { icon: '🔐', description: 'Controle de acesso e gestão de encomendas' },
  vendor: { icon: '🔧', description: 'Prestador de serviços — vê apenas chamados atribuídos' },
  gestor_fundo: { icon: '📊', description: 'Visão consolidada do portfólio — somente leitura' },
};

// ─── Mock tenants for wizard ──────────────────────
export const tenantCompanies = [
  { id: 'c1', name: 'Vivo (Telefônica Brasil)', floors: [7] },
  { id: 'c2', name: 'Totvs S.A. Energia', floors: [13] },
  { id: 'c3', name: 'You Intermediação', floors: [2, 4] },
];
