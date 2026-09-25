export type ContactType = 'manager' | 'tenant_admin' | 'tenant_employee' | 'owner' | 'vendor' | 'security' | 'external';

export const contactTypeLabels: Record<ContactType, string> = {
  manager: 'Gestor de Ativos',
  tenant_admin: 'Locatário Admin',
  tenant_employee: 'Locatário Colaborador',
  owner: 'Proprietário',
  vendor: 'Fornecedor',
  security: 'Segurança / Portaria',
  external: 'Externo',
};

export const contactTypeColors: Record<ContactType, string> = {
  manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  tenant_admin: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  tenant_employee: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  owner: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  vendor: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  security: 'bg-stone-100 text-stone-800 dark:bg-stone-900/30 dark:text-stone-300',
  external: 'bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400',
};

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  type: ContactType;
  company?: string;
  jobTitle?: string;
  linkedUserId?: string;
  isActive: boolean;
  groupIds: string[];
  createdAt: string;
}

export interface ContactGroup {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  autoIncludeType?: ContactType;
  memberCount: number;
  createdAt: string;
}

export const mockGroups: ContactGroup[] = [
  { id: 'g1', name: 'Segurança e Portaria', description: 'Todos os contatos do tipo Segurança/Portaria', icon: '🔒', color: 'bg-stone-500', autoIncludeType: 'security', memberCount: 4, createdAt: '2026-01-01' },
  { id: 'g2', name: 'Locatários', description: 'Todos os Locatários Admin e Colaboradores ativos', icon: '🏢', color: 'bg-emerald-500', autoIncludeType: 'tenant_admin', memberCount: 12, createdAt: '2026-01-01' },
  { id: 'g3', name: 'Proprietários', description: 'Todos os Proprietários', icon: '👔', color: 'bg-orange-500', autoIncludeType: 'owner', memberCount: 3, createdAt: '2026-01-01' },
  { id: 'g4', name: 'Fornecedores Ativos', description: 'Todos os fornecedores homologados', icon: '🔧', color: 'bg-red-500', autoIncludeType: 'vendor', memberCount: 8, createdAt: '2026-01-01' },
  { id: 'g5', name: 'Gestão Interna', description: 'Gestores Prediais e Super Admin', icon: '🧑‍💼', color: 'bg-blue-500', autoIncludeType: 'manager', memberCount: 3, createdAt: '2026-01-01' },
  { id: 'g6', name: 'Todos do Ativo', description: 'Todos os contatos ativos (grupo padrão)', icon: '📋', color: 'bg-interactive', memberCount: 30, createdAt: '2026-01-01' },
];

export const mockContacts: Contact[] = [
  { id: 'ct1', name: 'Tatiana Caracciolo', email: 'tatiana@administradora.com.br', phone: '(11) 99999-0001', type: 'manager', company: 'Administradora', jobTitle: 'Gerente de Ativos', linkedUserId: '2', isActive: true, groupIds: ['g5', 'g6'], createdAt: '2026-01-05' },
  { id: 'ct2', name: 'Daniel Amaro', email: 'daniel@administradora.com.br', phone: '(11) 99999-0002', type: 'manager', company: 'Administradora', jobTitle: 'Gestor de Carteira', linkedUserId: '3', isActive: true, groupIds: ['g5', 'g6'], createdAt: '2026-01-05' },
  { id: 'ct3', name: 'Fábio Nunes', email: 'administrativo@luxenergia.com.br', phone: '(11) 99999-0003', type: 'tenant_admin', company: 'Lux Energy', jobTitle: 'Locatário Admin', linkedUserId: '4', isActive: true, groupIds: ['g2', 'g6'], createdAt: '2026-01-10' },
  { id: 'ct4', name: 'Adriana Bertolucci', email: 'adriana.bertolucci@capitaleenergia.com.br', phone: '(11) 99999-0004', type: 'tenant_admin', company: 'Totvs S.A. Energia', jobTitle: 'Locatário Admin', linkedUserId: '5', isActive: true, groupIds: ['g2', 'g6'], createdAt: '2026-01-10' },
  { id: 'ct5', name: 'Cristiane Oliveira', email: 'coliveira@youinc.com.br', phone: '(11) 99999-0005', type: 'tenant_admin', company: 'You Intermediação', jobTitle: 'Locatário Admin', linkedUserId: '6', isActive: true, groupIds: ['g2', 'g6'], createdAt: '2026-01-10' },
  { id: 'ct6', name: 'Portaria 360JK', email: 'concierge@360jk.com.br', phone: '(11) 99999-0006', type: 'security', company: 'Administradora', jobTitle: 'Recepção', linkedUserId: '7', isActive: true, groupIds: ['g1', 'g6'], createdAt: '2026-01-05' },
  { id: 'ct7', name: 'Carlos Silva', email: 'carlos.portaria@360jk.com.br', type: 'security', company: 'Administradora', jobTitle: 'Porteiro Noturno', isActive: true, groupIds: ['g1', 'g6'], createdAt: '2026-02-01' },
  { id: 'ct8', name: 'LuxNexus Manutenção', email: 'fornecedor@nexus.com.br', phone: '(11) 99999-0008', type: 'vendor', company: 'LuxNexus Serviços', jobTitle: 'Manutenção Predial', linkedUserId: '8', isActive: true, groupIds: ['g4', 'g6'], createdAt: '2026-01-15' },
  { id: 'ct9', name: 'ClimaTech Solutions', email: 'contato@climatech.com.br', type: 'vendor', company: 'ClimaTech Solutions', jobTitle: 'HVAC', isActive: true, groupIds: ['g4', 'g6'], createdAt: '2026-01-15' },
  { id: 'ct10', name: 'SecTech Segurança', email: 'contato@sectech.com.br', type: 'vendor', company: 'SecTech Segurança', jobTitle: 'Controle de Acesso', isActive: true, groupIds: ['g4', 'g6'], createdAt: '2026-01-15' },
  { id: 'ct11', name: 'Roberto Mendes', email: 'roberto@proprietario.com.br', phone: '(11) 99999-0011', type: 'owner', company: 'Mendes Investimentos', jobTitle: 'Proprietário', isActive: true, groupIds: ['g3', 'g6'], createdAt: '2026-01-05' },
  { id: 'ct12', name: 'Marcos Pereira', email: 'marcos@externo.com.br', type: 'external', company: 'Consultoria ABC', jobTitle: 'Consultor', isActive: true, groupIds: ['g6'], createdAt: '2026-03-01' },
  { id: 'ct13', name: 'Ana Costa', email: 'ana.costa@luxenergia.com.br', type: 'tenant_employee', company: 'Lux Energy', jobTitle: 'Analista', isActive: true, groupIds: ['g2', 'g6'], createdAt: '2026-02-15' },
  { id: 'ct14', name: 'Pedro Santos', email: 'pedro.portaria@360jk.com.br', type: 'security', company: 'Administradora', jobTitle: 'Vigilante', isActive: false, groupIds: ['g1'], createdAt: '2026-01-10' },
];

export function getContactsByGroup(groupId: string): Contact[] {
  return mockContacts.filter(c => c.groupIds.includes(groupId) && c.isActive);
}

export function getUniqueRecipientsCount(groupIds: string[], contactIds: string[]): number {
  const ids = new Set<string>();
  groupIds.forEach(gid => {
    getContactsByGroup(gid).forEach(c => ids.add(c.id));
  });
  contactIds.forEach(cid => ids.add(cid));
  return ids.size;
}
