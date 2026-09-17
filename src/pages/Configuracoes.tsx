import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Building2, Users, Link2, Bell, Palette, Plus, Search, Mail, Shield, Webhook,
  Key, Smartphone, Plug, FileSignature, Eye, EyeOff, Save, TestTube, ChevronRight,
  Edit, UserX, UserCheck, RotateCcw, Clock, Copy, User, Briefcase, Calendar,
  Database, CreditCard, Globe, Lock, Download, Upload, Settings, Package,
  BookOpen, CheckSquare, MessageSquare, MapPin, Phone, Camera, Star, Tag, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { mockBuildings, mockUsers, roleLabels, type UserRole } from "@/lib/mock-data";
import { useApp } from "@/contexts/AppContext";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import CreateUserWizard from "@/components/CreateUserWizard";

// ─── Role-based menu definitions ──────────────────────
interface MenuSection { id: string; label: string; icon: any; }

const superAdminSections: MenuSection[] = [
  { id: 'plataforma', label: 'Plataforma', icon: Globe },
  { id: 'edificios', label: 'Ativos', icon: Building2 },
  { id: 'usuarios', label: 'Usuários e Acessos', icon: Users },
  { id: 'notificacoes', label: 'Notificações Globais', icon: Bell },
  { id: 'integracoes', label: 'Integrações', icon: Link2 },
  { id: 'modulos_premium', label: 'Módulos Premium', icon: Lock },
  { id: 'seguranca', label: 'Segurança e LGPD', icon: Shield },
  { id: 'dados', label: 'Dados e Backup', icon: Database },
  { id: 'plano', label: 'Plano e Faturamento', icon: CreditCard },
];

const buildingManagerSections: MenuSection[] = [
  { id: 'perfil', label: 'Meu Perfil', icon: User },
  { id: 'edificio', label: 'Dados do Ativo', icon: Building2 },
  { id: 'usuarios_edificio', label: 'Usuários do Ativo', icon: Users },
  { id: 'notificacoes', label: 'Notificações', icon: Bell },
  { id: 'modulos', label: 'Módulos do Ativo', icon: Settings },
  { id: 'documentos', label: 'Docs e Contratos', icon: FileText },
  { id: 'marketplace', label: 'Marketplace', icon: Package },
];

const tenantAdminSections: MenuSection[] = [
  { id: 'perfil', label: 'Meu Perfil', icon: User },
  { id: 'empresa', label: 'Minha Empresa', icon: Briefcase },
  { id: 'colaboradores', label: 'Colaboradores', icon: Users },
  { id: 'notificacoes', label: 'Notificações', icon: Bell },
];

const conciergeSections: MenuSection[] = [
  { id: 'perfil', label: 'Meu Perfil', icon: User },
  { id: 'notificacoes', label: 'Notificações', icon: Bell },
  { id: 'turno', label: 'Preferências de Turno', icon: Clock },
];

const vendorSections: MenuSection[] = [
  { id: 'perfil', label: 'Meu Perfil', icon: User },
  { id: 'empresa_vendor', label: 'Dados da Empresa', icon: Briefcase },
  { id: 'documentos_vendor', label: 'Docs da Empresa', icon: FileText },
  { id: 'disponibilidade', label: 'Disponibilidade', icon: Calendar },
  { id: 'notificacoes', label: 'Notificações', icon: Bell },
];

function getSections(role: UserRole): MenuSection[] {
  switch (role) {
    case 'super_admin': return superAdminSections;
    case 'building_manager': return buildingManagerSections;
    case 'tenant_admin':
    case 'tenant_employee': return tenantAdminSections;
    case 'concierge': return conciergeSections;
    case 'vendor': return vendorSections;
    default: return tenantAdminSections;
  }
}

// ─── Mock users for config ────────────────────────────
const configMockUsers = [
  { id: "u1", name: "Tatiana Caracciolo", email: "tatiana@administradora.com.br", role: "building_manager", company: "Administradora", status: "active", last_access: "2026-03-09T08:30:00" },
  { id: "u2", name: "Fábio Nunes", email: "administrativo@luxenergia.com.br", role: "tenant_admin", company: "Lux Energy", status: "active", last_access: "2026-03-09T09:15:00" },
  { id: "u3", name: "Adriana Bertolucci", email: "adriana@capitaleenergia.com.br", role: "tenant_admin", company: "Capitale Energia", status: "active", last_access: "2026-03-08T14:00:00" },
  { id: "u4", name: "Cristiane Oliveira", email: "coliveira@youinc.com.br", role: "tenant_admin", company: "You Intermediação", status: "active", last_access: "2026-03-09T07:45:00" },
  { id: "u5", name: "Portaria 360JK", email: "concierge@360jk.com.br", role: "concierge", company: "Administradora", status: "active", last_access: "2026-03-09T06:00:00" },
  { id: "u6", name: "LuxNexus Manutenção", email: "fornecedor@nexus.com.br", role: "vendor", company: "LuxNexus Serviços", status: "active", last_access: "2026-03-06T11:00:00" },
  { id: "u7", name: "Daniel Amaro", email: "daniel@administradora.com.br", role: "building_manager", company: "Administradora", status: "active", last_access: "2026-03-09T10:00:00" },
];

const roleBadgeColors: Record<string, string> = {
  super_admin: "bg-destructive/10 text-destructive",
  building_manager: "bg-interactive/10 text-interactive",
  owner: "bg-accent/20 text-accent-foreground",
  tenant_admin: "bg-success/10 text-success",
  tenant_employee: "bg-muted text-muted-foreground",
  vendor: "bg-warning/10 text-warning",
  concierge: "bg-operational/10 text-operational",
};

// ─── Section renderers ────────────────────────────────
const SectionCard = ({ children, title, subtitle }: { children: React.ReactNode; title?: string; subtitle?: string }) => (
  <div className="bg-card rounded-2xl premium-shadow p-6 animate-fade-in">
    {title && <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>}
    {subtitle && <p className="text-xs text-muted-foreground mb-4">{subtitle}</p>}
    {!title && !subtitle ? children : <div className="mt-4">{children}</div>}
  </div>
);

// ═══════════ PERFIL (shared) ═══════════
const ProfileSection = ({ user }: { user: typeof mockUsers[0] }) => (
  <div className="space-y-6">
    <SectionCard title="Meu Perfil" subtitle="Dados pessoais e credenciais">
      <div className="flex items-start gap-6">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-primary-foreground shrink-0" style={{ backgroundColor: user.avatar_bg || 'hsl(var(--interactive))' }}>
          {user.avatar_initials || user.full_name.slice(0, 2)}
        </div>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5"><Label className="text-xs">Nome Completo</Label><Input defaultValue={user.full_name} /></div>
          <div className="space-y-1.5"><Label className="text-xs">E-mail</Label><Input defaultValue={user.email} /></div>
          <div className="space-y-1.5"><Label className="text-xs">Cargo</Label><Input defaultValue={user.position || ''} /></div>
          <div className="space-y-1.5"><Label className="text-xs">Telefone</Label><Input placeholder="+55 (11) 99999-9999" /></div>
        </div>
      </div>
      <Separator className="my-4" />
      <h4 className="text-sm font-semibold mb-3">Alterar Senha</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-1.5"><Label className="text-xs">Senha Atual</Label><Input type="password" /></div>
        <div className="space-y-1.5"><Label className="text-xs">Nova Senha</Label><Input type="password" /></div>
        <div className="space-y-1.5"><Label className="text-xs">Confirmar Nova Senha</Label><Input type="password" /></div>
      </div>
      <div className="flex justify-end mt-4">
        <Button className="premium-gradient gap-2" onClick={() => toast.success('Perfil atualizado!')}><Save size={14} />Salvar</Button>
      </div>
    </SectionCard>
  </div>
);

// ═══════════ SUPER ADMIN SECTIONS ═══════════

const PlataformaSection = () => (
  <div className="space-y-6">
    <SectionCard title="Plataforma" subtitle="Identidade visual, URL e configurações globais">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label className="text-xs">Nome da Plataforma</Label><Input defaultValue="LUX Condo" /></div>
        <div className="space-y-1.5"><Label className="text-xs">URL / Subdomínio</Label><Input defaultValue="app.luxcondo.com.br" /></div>
        <div className="space-y-1.5"><Label className="text-xs">Idioma Padrão</Label>
          <Select defaultValue="pt_br"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pt_br">Português (BR)</SelectItem><SelectItem value="en">English</SelectItem><SelectItem value="es">Español</SelectItem></SelectContent></Select>
        </div>
        <div className="space-y-1.5"><Label className="text-xs">Fuso Horário</Label>
          <Select defaultValue="america_sp"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="america_sp">América/São Paulo (BRT)</SelectItem><SelectItem value="america_manaus">América/Manaus (AMT)</SelectItem></SelectContent></Select>
        </div>
      </div>
      <div className="mt-4">
        <Label className="text-xs mb-2 block">Logotipo</Label>
        <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-interactive/50 transition-colors cursor-pointer">
          <Upload size={24} className="mx-auto mb-2 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Arraste ou clique para enviar o logo</p>
        </div>
      </div>
      <div className="mt-4">
        <Label className="text-xs mb-2 block">Favicon</Label>
        <div className="border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-interactive/50 transition-colors cursor-pointer w-fit">
          <Upload size={16} className="mx-auto mb-1 text-muted-foreground" />
          <p className="text-[10px] text-muted-foreground">32×32px</p>
        </div>
      </div>
      <Separator className="my-4" />
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <span className="text-sm font-medium">Modo de Manutenção</span>
          <p className="text-xs text-muted-foreground">Exibe banner de manutenção para todos os usuários</p>
        </div>
        <Switch />
      </div>
      <div className="flex justify-end mt-4">
        <Button className="premium-gradient gap-2" onClick={() => toast.success('Configurações da plataforma salvas!')}><Save size={14} />Salvar</Button>
      </div>
    </SectionCard>
  </div>
);

const EdificiosSection = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold text-foreground">Ativos do Portfólio</h2>
      <Button className="premium-gradient gap-2"><Plus size={16} />Novo Ativo</Button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {mockBuildings.map((b) => (
        <div key={b.id} className="bg-card rounded-2xl p-5 premium-shadow hover:shadow-xl transition-shadow cursor-pointer">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-base font-semibold text-foreground">{b.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{b.address}, {b.city} — {b.state}</p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success/10 text-success">Ativo</span>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="bg-muted/30 rounded-lg p-2.5 text-center">
              <p className="text-lg font-bold text-foreground">{b.total_floors}</p>
              <p className="text-[10px] text-muted-foreground">Andares</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-2.5 text-center">
              <p className="text-lg font-bold text-foreground">{(b.total_area_m2 / 1000).toFixed(0)}k</p>
              <p className="text-[10px] text-muted-foreground">m²</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-2.5 text-center">
              <p className="text-lg font-bold text-foreground">{b.occupancy_rate}%</p>
              <p className="text-[10px] text-muted-foreground">Ocupação</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs px-2 py-0.5 rounded-full bg-interactive/10 text-interactive font-semibold">LEED {b.certification_leed_level}</span>
            <Button variant="ghost" size="sm" className="text-xs gap-1"><Edit size={12} />Editar</Button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ═══════════ EDIT USER DIALOG ═══════════
const EditUserDialog = ({ user: editUser, open, onOpenChange, onSave }: {
  user: typeof configMockUsers[0] | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (updated: typeof configMockUsers[0]) => void;
}) => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: '', status: 'active' });
  const [modulePermissions] = useState([
    { module: 'Chamados', level: 'edit' },
    { module: 'Contratos', level: 'view' },
    { module: 'Financeiro', level: 'view' },
    { module: 'Comunicados', level: 'edit' },
    { module: 'Reservas', level: 'edit' },
    { module: 'Visitantes', level: 'edit' },
    { module: 'ESG', level: 'view' },
    { module: 'Inspeção', level: 'view' },
  ]);

  useState(() => {
    if (editUser) {
      setForm({ name: editUser.name, email: editUser.email, phone: '', role: editUser.role, status: editUser.status });
    }
  });

  // Sync form when editUser changes
  if (editUser && form.name !== editUser.name && form.email !== editUser.email) {
    setForm({ name: editUser.name, email: editUser.email, phone: '', role: editUser.role, status: editUser.status });
  }

  const handleSave = () => {
    if (!editUser) return;
    onSave({ ...editUser, name: form.name, email: form.email, role: form.role, status: form.status });
    toast.success('✅ Usuário atualizado com sucesso');
    onOpenChange(false);
  };

  const handleResetPassword = () => {
    if (!editUser) return;
    toast.success(`📧 E-mail de redefinição enviado para ${editUser.email}`);
  };

  if (!editUser) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
          <DialogDescription>Atualize os dados e permissões de {editUser.name}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-primary-foreground bg-interactive shrink-0">
              {editUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs">Nome completo</Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">E-mail</Label>
            <Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            <p className="text-[10px] text-amber-600">⚠️ Alterar o e-mail irá deslogar o usuário na próxima sessão</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Telefone</Label>
            <Input placeholder="+55 (11) 99999-9999" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Perfil (Role)</Label>
            <Select value={form.role} onValueChange={v => setForm(p => ({ ...p, role: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(roleLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
            <div>
              <p className="text-sm font-medium">Status</p>
              <p className="text-xs text-muted-foreground">{form.status === 'active' ? 'Ativo — pode fazer login' : 'Inativo — login bloqueado'}</p>
            </div>
            <Switch checked={form.status === 'active'} onCheckedChange={v => setForm(p => ({ ...p, status: v ? 'active' : 'inactive' }))} />
          </div>

          <Separator className="my-2" />
          <h4 className="text-xs font-semibold text-muted-foreground uppercase">Permissões por Módulo</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b bg-muted/30">
                <th className="text-left px-3 py-1.5">Módulo</th>
                <th className="text-center px-3 py-1.5">Sem acesso</th>
                <th className="text-center px-3 py-1.5">Visualizar</th>
                <th className="text-center px-3 py-1.5">Editar</th>
                <th className="text-center px-3 py-1.5">Admin</th>
              </tr></thead>
              <tbody>
                {modulePermissions.map(mp => (
                  <tr key={mp.module} className="border-b border-border/30">
                    <td className="px-3 py-1.5 font-medium">{mp.module}</td>
                    {['none', 'view', 'edit', 'admin'].map(level => (
                      <td key={level} className="px-3 py-1.5 text-center">
                        <input type="radio" name={`perm-${mp.module}`} defaultChecked={mp.level === level} className="accent-interactive" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" size="sm" className="gap-1" onClick={handleResetPassword}><RotateCcw size={12} />Redefinir Senha</Button>
          <div className="flex-1" />
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button className="premium-gradient" onClick={handleSave}>Salvar Alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const UsuariosGlobaisSection = () => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [users, setUsers] = useState(configMockUsers);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<typeof configMockUsers[0] | null>(null);

  const filtered = users.filter(u => {
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (statusFilter !== 'all' && u.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">Usuários e Acessos</h2>
        <Button className="premium-gradient gap-2" onClick={() => setWizardOpen(true)}><Plus size={16} />Criar Usuário</Button>
      </div>
      <CreateUserWizard open={wizardOpen} onOpenChange={setWizardOpen} />
      <div className="flex flex-wrap gap-3">
        <div className="relative w-full flex-1 sm:min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou e-mail..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Perfil" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os perfis</SelectItem>
            {Object.entries(roleLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[120px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="inactive">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="bg-card rounded-2xl premium-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Usuário</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Perfil</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Empresa</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Último Acesso</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr key={u.id} className={`border-b border-border/50 hover:bg-muted/30 ${i % 2 === 1 ? "bg-muted/10" : ""}`}>
                  <td className="px-5 py-3">
                    <p className="text-sm font-medium">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${roleBadgeColors[u.role] || 'bg-muted text-muted-foreground'}`}>
                      {roleLabels[u.role as UserRole]}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-muted-foreground">{u.company}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.status === 'active' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                      {u.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-muted-foreground">
                    {new Date(u.last_access).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Editar" onClick={() => setEditingUser(u)}><Edit size={14} /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Resetar Senha" onClick={() => toast.success(`📧 E-mail de redefinição enviado para ${u.email}`)}><RotateCcw size={14} /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Desativar"
                        onClick={() => { setUsers(prev => prev.map(x => x.id === u.id ? { ...x, status: x.status === 'active' ? 'inactive' : 'active' } : x)); toast.success(`Status alterado.`); }}>
                        {u.status === 'active' ? <UserX size={14} /> : <UserCheck size={14} />}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <EditUserDialog
        user={editingUser}
        open={!!editingUser}
        onOpenChange={v => { if (!v) setEditingUser(null); }}
        onSave={updated => setUsers(prev => prev.map(u => u.id === updated.id ? updated : u))}
      />
      {/* Access Log */}
      <SectionCard title="Log de Acessos" subtitle="Últimos logins registrados">
        <div className="space-y-2">
          {configMockUsers.slice(0, 5).map(u => (
            <div key={u.id} className="flex items-center justify-between text-sm py-2 border-b border-border/30">
              <div className="flex items-center gap-3">
                <span className="font-medium">{u.name}</span>
                <span className="text-xs text-muted-foreground">{u.email}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{new Date(u.last_access).toLocaleString('pt-BR')}</span>
                <span className="font-mono">192.168.1.{Math.floor(Math.random() * 254) + 1}</span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
};

const NotificacoesGlobaisSection = () => {
  const events = [
    { event: "Novo chamado aberto", email: true, push: true },
    { event: "Chamado urgente", email: true, push: true },
    { event: "Contrato próximo do vencimento", email: true, push: false },
    { event: "Documento expirado", email: true, push: true },
    { event: "Rateio pendente de confirmação", email: true, push: true },
    { event: "Comunicado publicado", email: true, push: true },
    { event: "Novo usuário cadastrado", email: true, push: false },
    { event: "Visitante agendado", email: false, push: true },
    { event: "Relatório ESG disponível", email: true, push: false },
  ];
  return (
    <div className="space-y-6">
      <SectionCard title="Notificações Globais" subtitle="Defina quais eventos geram notificações por role">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b bg-muted/30">
              <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Evento</th>
              <th className="text-center px-4 py-2 text-xs font-semibold text-muted-foreground">E-mail</th>
              <th className="text-center px-4 py-2 text-xs font-semibold text-muted-foreground">Push</th>
            </tr></thead>
            <tbody>
              {events.map((e, i) => (
                <tr key={e.event} className={`border-b border-border/50 ${i % 2 === 1 ? 'bg-muted/10' : ''}`}>
                  <td className="px-4 py-2 text-sm">{e.event}</td>
                  <td className="px-4 py-2 text-center"><Switch defaultChecked={e.email} /></td>
                  <td className="px-4 py-2 text-center"><Switch defaultChecked={e.push} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
      <SectionCard title="Templates de E-mail" subtitle="Personalize assunto, corpo e rodapé dos e-mails">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5"><Label className="text-xs">Remetente (Nome)</Label><Input defaultValue="Patria | 360JK" /></div>
          <div className="space-y-1.5"><Label className="text-xs">Remetente (E-mail)</Label><Input defaultValue="noreply@luxcondo.com.br" /></div>
        </div>
        <div className="mt-3 space-y-1.5"><Label className="text-xs">Rodapé padrão</Label><Textarea defaultValue="Patria — Gestão Predial Inteligente. Este e-mail foi enviado automaticamente." rows={2} /></div>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" className="gap-2" onClick={() => toast.success('E-mail de teste enviado!')}><TestTube size={14} />Testar Envio</Button>
          <Button className="premium-gradient gap-2" onClick={() => toast.success('Templates salvos!')}><Save size={14} />Salvar</Button>
        </div>
      </SectionCard>
    </div>
  );
};

const IntegracoesSection = () => (
  <div className="space-y-6">
    <h2 className="text-lg font-semibold text-foreground">Integrações</h2>
    {/* Webhooks */}
    <SectionCard title="Webhooks" subtitle="URLs de callback para eventos da plataforma">
      <div className="bg-muted/30 rounded-lg p-4 text-center text-sm text-muted-foreground">Nenhum webhook configurado.</div>
      <Button variant="outline" className="gap-2 mt-3"><Plus size={14} />Adicionar Webhook</Button>
    </SectionCard>
    {/* API Keys */}
    <SectionCard title="API Keys" subtitle="Chaves de acesso para integradores externos">
      <div className="bg-muted/30 rounded-lg p-4 text-center text-sm text-muted-foreground">Nenhuma API Key gerada.</div>
      <Button variant="outline" className="gap-2 mt-3" onClick={() => toast.success('API Key gerada!')}><Key size={14} />Gerar Nova Key</Button>
    </SectionCard>
    {/* Telemetria */}
    <SectionCard title="Telemetria" subtitle="Endpoints de medidores automáticos por ativo">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5"><Label className="text-xs">Endpoint Energia</Label><Input placeholder="https://api.medidor.com/energy" /></div>
        <div className="space-y-1.5"><Label className="text-xs">Endpoint Água</Label><Input placeholder="https://api.medidor.com/water" /></div>
      </div>
      <div className="flex items-center gap-2 mt-3">
        <span className="w-2 h-2 rounded-full bg-success"></span>
        <span className="text-xs text-muted-foreground">Todas as integrações online</span>
      </div>
    </SectionCard>
  </div>
);

const SegurancaSection = () => (
  <div className="space-y-6">
    <SectionCard title="Segurança e LGPD" subtitle="Políticas de senha, sessão e auditoria">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5"><Label className="text-xs">Mínimo de caracteres na senha</Label><Input type="number" defaultValue={8} /></div>
          <div className="space-y-1.5"><Label className="text-xs">Expiração de senha (dias)</Label><Input type="number" defaultValue={90} /></div>
          <div className="space-y-1.5"><Label className="text-xs">Timeout de sessão (min)</Label><Input type="number" defaultValue={30} /></div>
        </div>
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <span className="text-sm font-medium">2FA obrigatório para Super Admin e Gestor</span>
            <p className="text-xs text-muted-foreground">Exige autenticação em dois fatores</p>
          </div>
          <Switch defaultChecked />
        </div>
      </div>
    </SectionCard>
    <SectionCard title="Log de Auditoria" subtitle="Ações sensíveis realizadas na plataforma">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead><tr className="border-b bg-muted/30">
            <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Data/Hora</th>
            <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Usuário</th>
            <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Ação</th>
          </tr></thead>
          <tbody>
            {[
              { date: '09/03/2026 10:15', user: 'Tatiana Caracciolo', action: 'Confirmou rateio de Energia — Fev/2026' },
              { date: '08/03/2026 14:30', user: 'Lux Energia — Admin', action: 'Criou novo usuário: Daniel Amaro' },
              { date: '07/03/2026 09:00', user: 'Tatiana Caracciolo', action: 'Alterou tarifa de Água para R$ 12,50/m³' },
              { date: '05/03/2026 16:45', user: 'Fábio Nunes', action: 'Convidou colaborador: Ana Paula' },
            ].map((log, i) => (
              <tr key={i} className="border-b border-border/50">
                <td className="px-4 py-2 text-xs text-muted-foreground font-mono">{log.date}</td>
                <td className="px-4 py-2 text-sm">{log.user}</td>
                <td className="px-4 py-2 text-sm text-muted-foreground">{log.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
    <SectionCard title="LGPD — Portabilidade" subtitle="Exportar ou excluir dados de um usuário">
      <div className="flex gap-3">
        <Button variant="outline" className="gap-2"><Download size={14} />Exportar dados de usuário</Button>
        <Button variant="outline" className="gap-2 text-destructive"><UserX size={14} />Solicitar exclusão</Button>
      </div>
    </SectionCard>
  </div>
);

const DadosBackupSection = () => (
  <div className="space-y-6">
    <SectionCard title="Dados e Backup" subtitle="Exportação e restauração de dados">
      <div className="flex gap-3 mb-4">
        <Button variant="outline" className="gap-2"><Download size={14} />Exportar JSON</Button>
        <Button variant="outline" className="gap-2"><Download size={14} />Exportar CSV</Button>
      </div>
      <h4 className="text-sm font-semibold mb-2">Histórico de Backups</h4>
      <div className="space-y-2">
        {['09/03/2026 02:00','08/03/2026 02:00','07/03/2026 02:00'].map((d, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
            <div className="flex items-center gap-2">
              <Database size={14} className="text-muted-foreground" />
              <span className="text-sm">{d}</span>
              <span className="text-xs text-success font-semibold">✅ Sucesso</span>
            </div>
            <Button variant="ghost" size="sm" className="text-xs">Restaurar</Button>
          </div>
        ))}
      </div>
    </SectionCard>
  </div>
);

const PlanoSection = () => (
  <div className="space-y-6">
    <SectionCard title="Plano e Faturamento">
      <div className="p-4 rounded-xl border-2 border-interactive bg-interactive/5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-lg font-bold text-foreground">Plano Enterprise</h4>
            <p className="text-xs text-muted-foreground">Renovação automática em 01/01/2027</p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-success/10 text-success">Ativo</span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-background rounded-lg p-3">
            <p className="text-lg font-bold text-foreground">5</p>
            <p className="text-[10px] text-muted-foreground">Ativos</p>
          </div>
          <div className="bg-background rounded-lg p-3">
            <p className="text-lg font-bold text-foreground">∞</p>
            <p className="text-[10px] text-muted-foreground">Usuários</p>
          </div>
          <div className="bg-background rounded-lg p-3">
            <p className="text-lg font-bold text-foreground">∞</p>
            <p className="text-[10px] text-muted-foreground">Integrações</p>
          </div>
        </div>
      </div>
      <h4 className="text-sm font-semibold mt-4 mb-2">Histórico de Faturas</h4>
      <div className="space-y-2">
        {[{ date: 'Mar/2026', value: 'R$ 2.490,00', status: 'Pendente' }, { date: 'Fev/2026', value: 'R$ 2.490,00', status: 'Pago' }, { date: 'Jan/2026', value: 'R$ 2.490,00', status: 'Pago' }].map((f, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
            <span className="text-sm font-medium">{f.date}</span>
            <span className="text-sm font-semibold">{f.value}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${f.status === 'Pago' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>{f.status}</span>
          </div>
        ))}
      </div>
      <Button variant="outline" className="mt-4 gap-2"><Star size={14} />Fazer Upgrade</Button>
    </SectionCard>
  </div>
);

// ═══════════ BUILDING MANAGER SECTIONS ═══════════

const EdificioDataSection = () => {
  const b = mockBuildings[0];
  return (
    <div className="space-y-6">
      <SectionCard title="Dados do Ativo" subtitle={b.name}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5"><Label className="text-xs">Nome do Ativo</Label><Input defaultValue={b.name} /></div>
          <div className="space-y-1.5"><Label className="text-xs">CNPJ do Condomínio</Label><Input defaultValue="08.765.432/0001-99" /></div>
          <div className="space-y-1.5"><Label className="text-xs">Endereço</Label><Input defaultValue={b.address} /></div>
          <div className="space-y-1.5"><Label className="text-xs">CEP</Label><Input defaultValue="01310-100" /></div>
          <div className="space-y-1.5"><Label className="text-xs">Cidade</Label><Input defaultValue={b.city} /></div>
          <div className="space-y-1.5"><Label className="text-xs">Administradora</Label><Input defaultValue="Administradora" /></div>
          <div className="space-y-1.5"><Label className="text-xs">CNPJ Administradora</Label><Input defaultValue="12.345.678/0001-90" /></div>
          <div className="space-y-1.5"><Label className="text-xs">Horário da Portaria</Label><Input defaultValue="24 horas" /></div>
        </div>
        <div className="mt-4">
          <Label className="text-xs mb-2 block">Foto de Capa</Label>
          <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-interactive/50 transition-colors cursor-pointer">
            <Camera size={24} className="mx-auto mb-2 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Arraste ou clique para enviar a foto</p>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button className="premium-gradient gap-2" onClick={() => toast.success('Dados do ativo salvos!')}><Save size={14} />Salvar</Button>
        </div>
      </SectionCard>
    </div>
  );
};

const UsuariosEdificioSection = () => {
  const [users, setUsers] = useState(configMockUsers);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<typeof configMockUsers[0] | null>(null);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Usuários do Ativo</h2>
        <Button className="premium-gradient gap-2" onClick={() => setWizardOpen(true)}><Plus size={16} />Criar Usuário</Button>
      </div>
      <CreateUserWizard open={wizardOpen} onOpenChange={setWizardOpen} restrictRoles />
      <p className="text-xs text-muted-foreground">Locatários, portaria e fornecedores vinculados ao ativo. Não é possível criar Super Admin ou outros Gestores Prediais.</p>
      <div className="bg-card rounded-2xl premium-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b bg-muted/30">
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Usuário</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Perfil</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Empresa</th>
              <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground">Ações</th>
            </tr></thead>
            <tbody>
              {users.filter(u => u.role !== 'super_admin').map((u, i) => (
                <tr key={u.id} className={`border-b border-border/50 ${i % 2 === 1 ? 'bg-muted/10' : ''}`}>
                  <td className="px-5 py-3"><p className="text-sm font-medium">{u.name}</p><p className="text-xs text-muted-foreground">{u.email}</p></td>
                  <td className="px-5 py-3"><span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${roleBadgeColors[u.role] || 'bg-muted text-muted-foreground'}`}>{roleLabels[u.role as UserRole]}</span></td>
                  <td className="px-5 py-3 text-sm text-muted-foreground">{u.company}</td>
                  <td className="px-5 py-3 text-center">
                    <div className="flex justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingUser(u)}><Edit size={14} /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast.success(`📧 E-mail de redefinição enviado para ${u.email}`)}><RotateCcw size={14} /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <EditUserDialog
        user={editingUser}
        open={!!editingUser}
        onOpenChange={v => { if (!v) setEditingUser(null); }}
        onSave={updated => setUsers(prev => prev.map(u => u.id === updated.id ? updated : u))}
      />
    </div>
  );
};

const NotificacoesGestorSection = () => {
  const events = [
    { event: "Novo chamado aberto", checked: true },
    { event: "Chamado urgente", checked: true },
    { event: "Contrato próximo do vencimento", checked: true },
    { event: "Documento expirado", checked: true },
    { event: "Rateio pendente de confirmação", checked: true },
    { event: "Encomenda pendente há +3 dias", checked: true },
    { event: "Visitante aguardando liberação", checked: true },
    { event: "Alerta de consumo anormal (telemetria)", checked: true },
  ];
  return (
    <div className="space-y-6">
      <SectionCard title="Notificações" subtitle="Configure quais eventos geram alertas para você">
        <div className="space-y-3">
          {events.map(e => (
            <div key={e.event} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <span className="text-sm">{e.event}</span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5"><Mail size={12} className="text-muted-foreground" /><Switch defaultChecked={e.checked} /></div>
                <div className="flex items-center gap-1.5"><Smartphone size={12} className="text-muted-foreground" /><Switch defaultChecked={e.checked} /></div>
              </div>
            </div>
          ))}
        </div>
        <Separator className="my-4" />
        <h4 className="text-sm font-semibold mb-2">Horário de Silêncio</h4>
        <div className="grid grid-cols-2 gap-3 max-w-xs">
          <div className="space-y-1.5"><Label className="text-xs">De</Label><Input type="time" defaultValue="22:00" /></div>
          <div className="space-y-1.5"><Label className="text-xs">Até</Label><Input type="time" defaultValue="07:00" /></div>
        </div>
        <div className="flex justify-end mt-4">
          <Button className="premium-gradient gap-2" onClick={() => toast.success('Notificações salvas!')}><Save size={14} />Salvar</Button>
        </div>
      </SectionCard>
    </div>
  );
};

// ═══════════ MÓDULOS PREMIUM (super_admin) ═══════════
const ModulosPremiumSection = () => {
  const { allUsers, setModuleAccess } = useApp();
  const premiumModules = [
    { key: 'sustainability', label: 'Sustentabilidade & ESG', icon: '🌿', description: 'Dashboard ESG, telemetria, rateio de consumo' },
  ];

  // Users that can have module access toggled (not super_admin)
  const manageableUsers = allUsers.filter(u => u.role !== 'super_admin');

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-foreground">Módulos Premium</h2>
      <p className="text-sm text-muted-foreground">Gerencie o acesso dos usuários aos módulos premium da plataforma.</p>

      {premiumModules.map(mod => (
        <SectionCard key={mod.key} title={`${mod.icon} ${mod.label}`} subtitle={mod.description}>
          <div className="space-y-2">
            {manageableUsers.map(u => {
              const hasAccess = u.module_access?.[mod.key] !== false;
              return (
                <div key={u.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0" style={{ backgroundColor: u.avatar_bg || 'hsl(var(--interactive))' }}>
                      {u.avatar_initials || u.full_name.slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{u.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.company}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-medium ${hasAccess ? 'text-success' : 'text-amber-500'}`}>
                      {hasAccess ? 'Ativo' : 'Bloqueado'}
                    </span>
                    <Switch
                      checked={hasAccess}
                      onCheckedChange={(checked) => setModuleAccess(u.id, mod.key, checked)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      ))}
    </div>
  );
};

const ModulosEdificioSection = () => {
  const [sub, setSub] = useState('reservas');
  const subItems = [
    { id: 'reservas', label: 'Reservas' },
    { id: 'rateio', label: 'Rateio' },
    { id: 'inspecao', label: 'Inspeção' },
    { id: 'comunicados', label: 'Comunicados' },
    { id: 'visitantes', label: 'Visitantes' },
  ];
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-foreground">Módulos do Ativo</h2>
      <div className="flex gap-2 flex-wrap">
        {subItems.map(s => (
          <button key={s.id} onClick={() => setSub(s.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${sub === s.id ? 'bg-interactive/10 text-interactive' : 'text-muted-foreground hover:bg-muted/50'}`}>
            {s.label}
          </button>
        ))}
      </div>
      {sub === 'reservas' && (
        <SectionCard title="Reservas" subtitle="Regras de reserva de áreas comuns">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label className="text-xs">Antecedência mínima (horas)</Label><Input type="number" defaultValue={4} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Limite de dias futuros</Label><Input type="number" defaultValue={14} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Horário início</Label><Input type="time" defaultValue="08:00" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Horário fim</Label><Input type="time" defaultValue="22:00" /></div>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3 mt-3">
            <span className="text-sm">Bloquear mesmo horário para áreas compartilhadas</span>
            <Switch defaultChecked />
          </div>
        </SectionCard>
      )}
      {sub === 'rateio' && (
        <SectionCard title="Rateio" subtitle="Método padrão e tarifas (centralizado em /rateio → Configurações)">
          <p className="text-sm text-muted-foreground">As configurações de rateio estão centralizadas na página <span className="font-semibold text-interactive cursor-pointer">Rateio de Consumo → Configurações</span>.</p>
          <div className="grid grid-cols-3 gap-3 mt-3">
            <div className="p-3 rounded-xl bg-muted/30 text-center">
              <p className="text-xs text-muted-foreground">Energia</p>
              <p className="text-sm font-semibold">R$ 0,60/kWh</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/30 text-center">
              <p className="text-xs text-muted-foreground">Água</p>
              <p className="text-sm font-semibold">R$ 12,50/m³</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/30 text-center">
              <p className="text-xs text-muted-foreground">Gás</p>
              <p className="text-sm font-semibold">R$ 4,80/m³</p>
            </div>
          </div>
        </SectionCard>
      )}
      {sub === 'inspecao' && (
        <SectionCard title="Inspeção Predial" subtitle="Frequência e checklists padrão">
          <div className="space-y-1.5 max-w-xs"><Label className="text-xs">Frequência padrão</Label>
            <Select defaultValue="mensal"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="mensal">Mensal</SelectItem><SelectItem value="trimestral">Trimestral</SelectItem><SelectItem value="semestral">Semestral</SelectItem></SelectContent></Select>
          </div>
          <h4 className="text-sm font-semibold mt-4 mb-2">Checklists padrão</h4>
          {['Elétrico','Hidráulico','HVAC','Elevadores','Estrutural'].map(c => (
            <div key={c} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 mb-2">
              <span className="text-sm">{c}</span>
              <div className="flex items-center gap-2"><Switch defaultChecked /><Button variant="ghost" size="sm" className="text-xs"><Edit size={12} /></Button></div>
            </div>
          ))}
        </SectionCard>
      )}
      {sub === 'comunicados' && (
        <SectionCard title="Comunicados" subtitle="Categorias e templates">
          <h4 className="text-sm font-semibold mb-2">Categorias</h4>
          <div className="flex flex-wrap gap-2">
            {['Manutenção','Segurança','Administrativo','Eventos','Sustentabilidade'].map(c => (
              <span key={c} className="px-3 py-1 rounded-full bg-interactive/10 text-interactive text-xs font-semibold flex items-center gap-1">{c}<button className="hover:text-destructive ml-1">×</button></span>
            ))}
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1"><Plus size={12} />Nova</Button>
          </div>
        </SectionCard>
      )}
      {sub === 'visitantes' && (
        <SectionCard title="Visitantes" subtitle="Regras de cadastro e QR Code">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label className="text-xs">Tempo máximo sem cadastro (horas)</Label><Input type="number" defaultValue={2} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Validade QR Code (horas)</Label><Input type="number" defaultValue={24} /></div>
          </div>
          <h4 className="text-sm font-semibold mt-4 mb-2">Campos obrigatórios no cadastro</h4>
          {['Nome completo','CPF / Documento','Empresa de origem','Foto'].map(f => (
            <div key={f} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 mb-1">
              <span className="text-sm">{f}</span>
              <Switch defaultChecked />
            </div>
          ))}
        </SectionCard>
      )}
      <div className="flex justify-end">
        <Button className="premium-gradient gap-2" onClick={() => toast.success('Configurações do módulo salvas!')}><Save size={14} />Salvar</Button>
      </div>
    </div>
  );
};

const DocumentosContratosSection = () => (
  <div className="space-y-6">
    <SectionCard title="Docs e Contratos" subtitle="Categorias, alertas e visibilidade">
      <h4 className="text-sm font-semibold mb-2">Categorias de Documentos</h4>
      <div className="flex flex-wrap gap-2 mb-4">
        {['Contrato','Certidão','Alvará','Laudo','Ata','Planta'].map(c => (
          <span key={c} className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-semibold flex items-center gap-1">{c}<button className="hover:text-destructive ml-1">×</button></span>
        ))}
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1"><Plus size={12} />Nova</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label className="text-xs">Antecedência de alerta de vencimento (dias)</Label><Input type="number" defaultValue={30} /></div>
        <div className="space-y-1.5"><Label className="text-xs">Visibilidade padrão</Label>
          <Select defaultValue="gestor"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="gestor">Apenas Gestor</SelectItem><SelectItem value="todos">Todos os usuários</SelectItem><SelectItem value="locatario">Locatário + Gestor</SelectItem></SelectContent></Select>
        </div>
      </div>
    </SectionCard>
  </div>
);

const MarketplaceConfigSection = () => (
  <div className="space-y-6">
    <SectionCard title="Marketplace neXus" subtitle="Visibilidade e categorias para locatários">
      <div className="flex items-center justify-between rounded-lg border p-3 mb-4">
        <div>
          <span className="text-sm font-medium">Exibir Marketplace para locatários</span>
          <p className="text-xs text-muted-foreground">Quando desativado, o menu não aparece para locatários</p>
        </div>
        <Switch defaultChecked />
      </div>
      <h4 className="text-sm font-semibold mb-2">Categorias visíveis</h4>
      {['Manutenção Elétrica','HVAC','Hidráulica','Limpeza','Segurança','Paisagismo'].map(c => (
        <div key={c} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 mb-1">
          <span className="text-sm">{c}</span>
          <Switch defaultChecked />
        </div>
      ))}
    </SectionCard>
  </div>
);

// ═══════════ TENANT ADMIN SECTIONS ═══════════

const EmpresaSection = ({ user }: { user: typeof mockUsers[0] }) => (
  <div className="space-y-6">
    <SectionCard title="Minha Empresa" subtitle={user.company || 'Dados da empresa'}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label className="text-xs">Nome da Empresa</Label><Input defaultValue={user.company} /></div>
        <div className="space-y-1.5"><Label className="text-xs">CNPJ</Label><Input placeholder="00.000.000/0001-00" /></div>
        <div className="space-y-1.5"><Label className="text-xs">Ramo de Atividade</Label><Input defaultValue="Energia" /></div>
        <div className="space-y-1.5"><Label className="text-xs">Telefone</Label><Input placeholder="+55 (11) 3000-0000" /></div>
        <div className="space-y-1.5"><Label className="text-xs">Site</Label><Input placeholder="https://www.empresa.com.br" /></div>
        <div className="space-y-1.5"><Label className="text-xs">Endereço Comercial</Label><Input placeholder="Rua..." /></div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <Label className="text-xs mb-2 block">Logo da Empresa</Label>
          <div className="border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-interactive/50 transition-colors cursor-pointer">
            <Upload size={20} className="mx-auto mb-1 text-muted-foreground" />
            <p className="text-[10px] text-muted-foreground">Upload do logo</p>
          </div>
        </div>
        <div>
          <Label className="text-xs mb-2 block">Andar(es) ocupado(s)</Label>
          <div className="p-3 rounded-xl bg-muted/30">
            <span className="text-sm font-semibold">{user.floors?.map(f => `${f}º Andar`).join(', ') || 'N/A'}</span>
            <p className="text-[10px] text-muted-foreground mt-0.5">Apenas o Gestor Predial pode alterar</p>
          </div>
        </div>
      </div>
      <div className="flex justify-end mt-4">
        <Button className="premium-gradient gap-2" onClick={() => toast.success('Dados da empresa salvos!')}><Save size={14} />Salvar</Button>
      </div>
    </SectionCard>
  </div>
);

const ColaboradoresSection = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Colaboradores</h2>
        <p className="text-xs text-muted-foreground">3 de 10 licenças utilizadas</p>
      </div>
      <Button className="premium-gradient gap-2"><Plus size={16} />Convidar Colaborador</Button>
    </div>
    <div className="bg-card rounded-2xl premium-shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead><tr className="border-b bg-muted/30">
            <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Nome</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">E-mail</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Cargo</th>
            <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground">Ações</th>
          </tr></thead>
          <tbody>
            {[
              { name: 'Ana Paula Silva', email: 'ana.paula@luxenergia.com.br', cargo: 'Analista' },
              { name: 'Carlos Ribeiro', email: 'carlos@luxenergia.com.br', cargo: 'Engenheiro' },
              { name: 'Marcos Oliveira', email: 'marcos@luxenergia.com.br', cargo: 'Estagiário' },
            ].map((c, i) => (
              <tr key={i} className="border-b border-border/50">
                <td className="px-5 py-3 text-sm font-medium">{c.name}</td>
                <td className="px-5 py-3 text-sm text-muted-foreground">{c.email}</td>
                <td className="px-5 py-3 text-sm text-muted-foreground">{c.cargo}</td>
                <td className="px-5 py-3 text-center">
                  <div className="flex justify-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Edit size={14} /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><UserX size={14} /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const NotificacoesLocatarioSection = () => {
  const events = [
    "Nova encomenda chegou na portaria",
    "Comunicado publicado no ativo",
    "Chamado atualizado (aberto pela empresa)",
    "Reserva confirmada / cancelada",
    "Rateio de consumo disponível",
    "Vencimento de contrato (X dias antes)",
  ];
  return (
    <div className="space-y-6">
      <SectionCard title="Notificações" subtitle="Escolha quais alertas deseja receber">
        <div className="space-y-3">
          {events.map(e => (
            <div key={e} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <span className="text-sm">{e}</span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Mail size={12} /><Switch defaultChecked /></div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Smartphone size={12} /><Switch defaultChecked /></div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-4">
          <Button className="premium-gradient gap-2" onClick={() => toast.success('Notificações salvas!')}><Save size={14} />Salvar</Button>
        </div>
      </SectionCard>
    </div>
  );
};

// ═══════════ CONCIERGE SECTIONS ═══════════

const NotificacoesPortariaSection = () => {
  const events = [
    "Nova encomenda registrada por outro operador",
    "Encomenda pendente há +3 dias",
    "Visitante aguardando liberação",
    "Chamado de Segurança Patrimonial aberto",
  ];
  return (
    <div className="space-y-6">
      <SectionCard title="Notificações" subtitle="Alertas da portaria">
        <div className="space-y-3">
          {events.map(e => (
            <div key={e} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <span className="text-sm">{e}</span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Smartphone size={12} /><Switch defaultChecked /></div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Mail size={12} /><Switch /></div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-4">
          <Button className="premium-gradient gap-2" onClick={() => toast.success('Notificações salvas!')}><Save size={14} />Salvar</Button>
        </div>
      </SectionCard>
    </div>
  );
};

const TurnoSection = () => (
  <div className="space-y-6">
    <SectionCard title="Preferências de Turno" subtitle="Configure seu horário de trabalho e alertas">
      <div className="space-y-1.5 max-w-xs">
        <Label className="text-xs">Turno de Trabalho</Label>
        <Select defaultValue="manha">
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="manha">Manhã (06h–14h)</SelectItem>
            <SelectItem value="tarde">Tarde (14h–22h)</SelectItem>
            <SelectItem value="noite">Noite (22h–06h)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <span className="text-sm font-medium">Push ativo somente no turno</span>
            <p className="text-xs text-muted-foreground">Notificações push apenas no horário do turno cadastrado</p>
          </div>
          <Switch defaultChecked />
        </div>
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <span className="text-sm font-medium">Alertas de emergência fora do turno</span>
            <p className="text-xs text-muted-foreground">Receber alertas de prioridade Urgente mesmo fora do horário</p>
          </div>
          <Switch defaultChecked />
        </div>
      </div>
      <div className="flex justify-end mt-4">
        <Button className="premium-gradient gap-2" onClick={() => toast.success('Preferências de turno salvas!')}><Save size={14} />Salvar</Button>
      </div>
    </SectionCard>
  </div>
);

// ═══════════ VENDOR SECTIONS ═══════════

const EmpresaVendorSection = () => (
  <div className="space-y-6">
    <SectionCard title="Dados da Empresa" subtitle="Informações exibidas no Marketplace neXus">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label className="text-xs">Nome da Empresa</Label><Input defaultValue="LuxNexus Serviços" /></div>
        <div className="space-y-1.5"><Label className="text-xs">CNPJ</Label><Input placeholder="00.000.000/0001-00" /></div>
        <div className="space-y-1.5"><Label className="text-xs">Site</Label><Input placeholder="https://www.empresa.com" /></div>
        <div className="space-y-1.5"><Label className="text-xs">Telefone / WhatsApp</Label><Input placeholder="+55 (11) 99999-9999" /></div>
      </div>
      <div className="mt-3">
        <Label className="text-xs mb-1 block">Especialidades</Label>
        <div className="flex flex-wrap gap-2">
          {['Elétrica','HVAC','Manutenção Geral'].map(t => (
            <span key={t} className="px-3 py-1 rounded-full bg-interactive/10 text-interactive text-xs font-semibold">{t}</span>
          ))}
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1"><Plus size={12} />Adicionar</Button>
        </div>
      </div>
      <div className="mt-3 space-y-1.5"><Label className="text-xs">Descrição da Empresa</Label><Textarea rows={3} defaultValue="Prestamos serviços de manutenção elétrica e HVAC para ativos comerciais." /></div>
      <div className="mt-3">
        <Label className="text-xs mb-2 block">Logo</Label>
        <div className="border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-interactive/50 transition-colors cursor-pointer w-fit">
          <Upload size={20} className="mx-auto mb-1 text-muted-foreground" />
          <p className="text-[10px] text-muted-foreground">Upload do logo</p>
        </div>
      </div>
      <div className="flex justify-end mt-4">
        <Button className="premium-gradient gap-2" onClick={() => toast.success('Dados da empresa salvos!')}><Save size={14} />Salvar</Button>
      </div>
    </SectionCard>
  </div>
);

const DocumentosVendorSection = () => {
  const docs = [
    { name: 'Alvará de Funcionamento', status: 'ok', expires: '15/12/2026' },
    { name: 'Seguro de Responsabilidade Civil', status: 'ok', expires: '01/09/2026' },
    { name: 'Certidão Negativa de Débitos', status: 'expiring', expires: '15/04/2026' },
    { name: 'ART do Responsável Técnico', status: 'missing', expires: '' },
  ];
  const statusBadge = (s: string) => {
    if (s === 'ok') return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-success/10 text-success">🟢 Vigente</span>;
    if (s === 'expiring') return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-warning/10 text-warning">🟡 Vencendo</span>;
    return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-destructive/10 text-destructive">🔴 Pendente</span>;
  };
  return (
    <div className="space-y-6">
      <SectionCard title="Docs da Empresa" subtitle="Documentos obrigatórios para homologação">
        <div className="space-y-3">
          {docs.map(d => (
            <div key={d.name} className="flex items-center justify-between p-4 rounded-xl border border-border">
              <div>
                <p className="text-sm font-medium">{d.name}</p>
                {d.expires && <p className="text-xs text-muted-foreground">Validade: {d.expires}</p>}
              </div>
              <div className="flex items-center gap-3">
                {statusBadge(d.status)}
                <Button variant="outline" size="sm" className="text-xs gap-1"><Upload size={12} />Upload</Button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 rounded-xl bg-muted/30">
          <p className="text-sm font-semibold">Status de Homologação</p>
          <p className="text-xs text-muted-foreground">🟡 Pendente — 1 documento faltando, 1 próximo do vencimento</p>
        </div>
      </SectionCard>
    </div>
  );
};

const DisponibilidadeSection = () => (
  <div className="space-y-6">
    <SectionCard title="Disponibilidade" subtitle="Horários de atendimento e capacidade">
      <h4 className="text-sm font-semibold mb-2">Horários por dia da semana</h4>
      <div className="space-y-2">
        {['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'].map((d, i) => (
          <div key={d} className="flex items-center gap-3">
            <span className="text-sm w-20">{d}</span>
            <Switch defaultChecked={i < 5} />
            {i < 5 && (
              <div className="flex items-center gap-2">
                <Input type="time" defaultValue="08:00" className="h-8 w-24" />
                <span className="text-xs text-muted-foreground">até</span>
                <Input type="time" defaultValue="18:00" className="h-8 w-24" />
              </div>
            )}
          </div>
        ))}
      </div>
      <Separator className="my-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <span className="text-sm font-medium">Aceitar chamados automaticamente</span>
            <p className="text-xs text-muted-foreground">Sem aprovação manual</p>
          </div>
          <Switch />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Chamados simultâneos (máximo)</Label>
          <Input type="number" defaultValue={5} />
        </div>
      </div>
      <div className="flex justify-end mt-4">
        <Button className="premium-gradient gap-2" onClick={() => toast.success('Disponibilidade salva!')}><Save size={14} />Salvar</Button>
      </div>
    </SectionCard>
  </div>
);

const NotificacoesVendorSection = () => {
  const events = [
    "Novo chamado atribuído",
    "Chamado reatribuído ou cancelado",
    "Avaliação recebida de um serviço concluído",
    "Documento próximo do vencimento",
  ];
  return (
    <div className="space-y-6">
      <SectionCard title="Notificações" subtitle="Alertas do fornecedor">
        <div className="space-y-3">
          {events.map(e => (
            <div key={e} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <span className="text-sm">{e}</span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Mail size={12} /><Switch defaultChecked /></div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Smartphone size={12} /><Switch defaultChecked /></div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-4">
          <Button className="premium-gradient gap-2" onClick={() => toast.success('Notificações salvas!')}><Save size={14} />Salvar</Button>
        </div>
      </SectionCard>
    </div>
  );
};

// ═══════════ MAIN COMPONENT ═══════════

const Configuracoes = () => {
  const { user } = useApp();
  const isMobile = useIsMobile();
  const sections = getSections(user.role);
  const [activeSection, setActiveSection] = useState(sections[0]?.id || '');
  const [mobileShowContent, setMobileShowContent] = useState(false);

  const handleSectionClick = (id: string) => {
    setActiveSection(id);
    if (isMobile) setMobileShowContent(true);
  };

  const renderSection = () => {
    // Shared sections
    if (activeSection === 'perfil') return <ProfileSection user={user} />;

    // Super Admin
    if (activeSection === 'plataforma') return <PlataformaSection />;
    if (activeSection === 'edificios') return <EdificiosSection />;
    if (activeSection === 'usuarios') return <UsuariosGlobaisSection />;
    if (activeSection === 'notificacoes' && user.role === 'super_admin') return <NotificacoesGlobaisSection />;
    if (activeSection === 'integracoes') return <IntegracoesSection />;
    if (activeSection === 'modulos_premium') return <ModulosPremiumSection />;
    if (activeSection === 'seguranca') return <SegurancaSection />;
    if (activeSection === 'dados') return <DadosBackupSection />;
    if (activeSection === 'plano') return <PlanoSection />;

    // Building Manager
    if (activeSection === 'edificio') return <EdificioDataSection />;
    if (activeSection === 'usuarios_edificio') return <UsuariosEdificioSection />;
    if (activeSection === 'notificacoes' && user.role === 'building_manager') return <NotificacoesGestorSection />;
    if (activeSection === 'modulos') return <ModulosEdificioSection />;
    if (activeSection === 'documentos') return <DocumentosContratosSection />;
    if (activeSection === 'marketplace') return <MarketplaceConfigSection />;

    // Tenant Admin
    if (activeSection === 'empresa') return <EmpresaSection user={user} />;
    if (activeSection === 'colaboradores') return <ColaboradoresSection />;
    if (activeSection === 'notificacoes' && (user.role === 'tenant_admin' || user.role === 'tenant_employee')) return <NotificacoesLocatarioSection />;

    // Concierge
    if (activeSection === 'notificacoes' && user.role === 'concierge') return <NotificacoesPortariaSection />;
    if (activeSection === 'turno') return <TurnoSection />;

    // Vendor
    if (activeSection === 'empresa_vendor') return <EmpresaVendorSection />;
    if (activeSection === 'documentos_vendor') return <DocumentosVendorSection />;
    if (activeSection === 'disponibilidade') return <DisponibilidadeSection />;
    if (activeSection === 'notificacoes' && user.role === 'vendor') return <NotificacoesVendorSection />;

    return <div className="text-sm text-muted-foreground p-8 text-center">Selecione uma seção no menu.</div>;
  };

  const activeSectionLabel = sections.find(s => s.id === activeSection)?.label || '';

  // Mobile: show either menu list or content with back button
  if (isMobile) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Configurações</h1>
          <p className="text-sm text-muted-foreground">
            {user.role === 'super_admin' && 'Plataforma, ativos, usuários, integrações e segurança'}
            {user.role === 'building_manager' && 'Perfil, ativo, usuários e módulos'}
            {(user.role === 'tenant_admin' || user.role === 'tenant_employee') && 'Perfil, empresa, colaboradores e notificações'}
            {user.role === 'concierge' && 'Perfil, notificações e turno'}
            {user.role === 'vendor' && 'Perfil, empresa, documentos e disponibilidade'}
            {user.role === 'owner' && 'Perfil e notificações'}
          </p>
        </div>

        {!mobileShowContent ? (
          <div className="space-y-1">
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => handleSectionClick(s.id)}
                className="w-full flex items-center justify-between h-[52px] px-4 rounded-xl bg-card premium-shadow hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <s.icon size={18} className="text-muted-foreground flex-shrink-0" />
                  <span className="text-sm font-medium text-foreground">{s.label}</span>
                </div>
                <ChevronRight size={16} className="text-muted-foreground flex-shrink-0" />
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={() => setMobileShowContent(false)}
              className="flex items-center gap-2 text-sm font-medium text-interactive hover:underline"
            >
              <ChevronRight size={16} className="rotate-180" />
              Voltar
            </button>
            <div className="min-w-0">{renderSection()}</div>
          </div>
        )}
      </div>
    );
  }

  // Desktop/Tablet
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          {user.role === 'super_admin' && 'Plataforma, ativos, usuários, integrações e segurança'}
          {user.role === 'building_manager' && 'Perfil, ativo, usuários e módulos'}
          {(user.role === 'tenant_admin' || user.role === 'tenant_employee') && 'Perfil, empresa, colaboradores e notificações'}
          {user.role === 'concierge' && 'Perfil, notificações e turno'}
          {user.role === 'vendor' && 'Perfil, empresa, documentos e disponibilidade'}
          {user.role === 'owner' && 'Perfil e notificações'}
        </p>
      </div>

      <div className="flex gap-6">
        {/* Desktop Sidebar */}
        <div className="w-64 shrink-0 space-y-1">
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeSection === s.id
                  ? 'bg-interactive/10 text-interactive'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <s.icon size={18} className="shrink-0" />
              <span className="whitespace-nowrap truncate">{s.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {renderSection()}
        </div>
      </div>
    </div>
  );
};

export default Configuracoes;
