import { useState, useRef } from "react";
import { Search, Plus, Upload, Users, User, X, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import {
  mockContacts, mockGroups, getContactsByGroup,
  contactTypeLabels, contactTypeColors,
  type Contact, type ContactGroup, type ContactType,
} from "@/lib/contacts-data";

const contactTypes: ContactType[] = ['manager', 'tenant_admin', 'tenant_employee', 'owner', 'vendor', 'security', 'external'];

const Contatos = () => {
  const [tab, setTab] = useState('contacts');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ContactType | ''>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [newContactOpen, setNewContactOpen] = useState(false);
  const [newGroupOpen, setNewGroupOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<ContactGroup | null>(null);
  const [contacts, setContacts] = useState<Contact[]>(mockContacts);
  const [groups] = useState<ContactGroup[]>(mockGroups);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Contact | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<string[][]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New contact form
  const [newContact, setNewContact] = useState({
    name: '', email: '', phone: '', type: 'tenant_admin' as ContactType,
    company: '', jobTitle: '', linked: false, groups: [] as string[], isActive: true,
  });

  // New group form
  const [newGroup, setNewGroup] = useState({
    name: '', description: '', icon: '📋', autoIncludeType: '' as ContactType | '',
  });

  const filteredContacts = contacts.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter && c.type !== typeFilter) return false;
    if (statusFilter === 'active' && !c.isActive) return false;
    if (statusFilter === 'inactive' && c.isActive) return false;
    return true;
  });

  const handleCreateContact = () => {
    const newC: Contact = {
      id: `c-${Date.now()}`, name: newContact.name, email: newContact.email,
      phone: newContact.phone, type: newContact.type, company: newContact.company,
      jobTitle: newContact.jobTitle, linkedUserId: newContact.linked ? 'auto' : undefined,
      isActive: newContact.isActive, groupIds: newContact.groups, createdAt: new Date().toISOString().split('T')[0],
    };
    setContacts(prev => [...prev, newC]);
    toast.success(`Contato "${newContact.name}" criado com sucesso!`);
    setNewContactOpen(false);
    setNewContact({ name: '', email: '', phone: '', type: 'tenant_admin', company: '', jobTitle: '', linked: false, groups: [], isActive: true });
  };

  const handleCreateGroup = () => {
    toast.success(`Grupo "${newGroup.name}" criado com sucesso!`);
    setNewGroupOpen(false);
    setNewGroup({ name: '', description: '', icon: '📋', autoIncludeType: '' });
  };

  const handleEditContact = () => {
    if (!editContact) return;
    setContacts(prev => prev.map(c => c.id === editContact.id ? editContact : c));
    toast.success(`Contato "${editContact.name}" atualizado!`);
    setEditContact(null);
  };

  const handleDeleteContact = () => {
    if (!deleteConfirm) return;
    setContacts(prev => prev.filter(c => c.id !== deleteConfirm.id));
    toast.success(`Contato "${deleteConfirm.name}" removido.`);
    setDeleteConfirm(null);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split('\n').map(l => l.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
      setImportPreview(lines.slice(0, 6)); // header + 5 rows
      setImportOpen(true);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmImport = () => {
    const count = Math.max(0, importPreview.length - 1);
    toast.success(`${count} contatos importados com sucesso!`);
    setImportOpen(false);
    setImportPreview([]);
  };

  const groupMembers = selectedGroup ? getContactsByGroup(selectedGroup.id) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Contatos e Grupos</h1>
          <p className="text-sm text-muted-foreground">{contacts.filter(c => c.isActive).length} contatos ativos • {groups.length} grupos</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="contacts"><User size={14} className="mr-1.5" />Contatos</TabsTrigger>
          <TabsTrigger value="groups"><Users size={14} className="mr-1.5" />Grupos</TabsTrigger>
        </TabsList>

        {/* ─── TAB CONTATOS ─── */}
        <TabsContent value="contacts" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por nome ou e-mail..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleImportCSV} />
              <Button variant="outline" className="gap-2" onClick={() => fileInputRef.current?.click()}><Upload size={14} />Importar CSV</Button>
              <Button className="premium-gradient gap-2" onClick={() => setNewContactOpen(true)}><Plus size={14} />Novo Contato</Button>
            </div>
          </div>

          {/* Type chips */}
          <div className="flex gap-2 overflow-x-auto flex-nowrap pb-1 -mx-1 px-1">
            <button onClick={() => setTypeFilter('')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${!typeFilter ? 'bg-interactive text-interactive-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
              Todos
            </button>
            {contactTypes.map(t => (
              <button key={t} onClick={() => setTypeFilter(typeFilter === t ? '' : t)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${typeFilter === t ? 'bg-interactive text-interactive-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                {contactTypeLabels[t]}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex flex-wrap gap-2">
            {(['all', 'active', 'inactive'] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${statusFilter === s ? 'bg-interactive text-interactive-foreground' : 'bg-muted text-muted-foreground'}`}>
                {s === 'all' ? 'Todos' : s === 'active' ? '🟢 Ativos' : '⚫ Inativos'}
              </button>
            ))}
            <span className="text-xs text-muted-foreground self-center ml-2">Exibindo {filteredContacts.length} de {contacts.length}</span>
          </div>

          {/* Table */}
          <div className="bg-card rounded-2xl premium-shadow overflow-hidden">
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Nome</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Tipo</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">E-mail</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase hidden lg:table-cell">Empresa / Cargo</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase hidden lg:table-cell">Grupos</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Ativo</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.map((c, i) => (
                    <tr key={c.id} className={`border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors ${i % 2 === 1 ? 'bg-muted/10' : ''}`}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-interactive/10 flex items-center justify-center text-sm font-bold text-interactive shrink-0">{c.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                          <div className="min-w-0">
                            <span className="text-sm font-medium text-foreground whitespace-nowrap truncate block max-w-[200px]">{c.name}</span>
                            {c.linkedUserId && <span className="ml-1 text-[10px] text-interactive inline-flex items-center">🔗</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3"><span title={contactTypeLabels[c.type]} className={`px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap max-w-[90px] overflow-hidden text-ellipsis inline-block ${contactTypeColors[c.type]}`}>{{manager:'Gestor',tenant_admin:'Loc. Admin',tenant_employee:'Colaborador',owner:'Proprietário',vendor:'Fornecedor',security:'Portaria',external:'Externo'}[c.type]}</span></td>
                      <td className="px-5 py-3 text-sm text-muted-foreground hidden md:table-cell">{c.email}</td>
                      <td className="px-5 py-3 text-sm text-muted-foreground hidden lg:table-cell">{c.company}{c.jobTitle ? ` • ${c.jobTitle}` : ''}</td>
                      <td className="px-5 py-3 hidden lg:table-cell">
                        <div className="flex gap-1 flex-wrap">
                          {c.groupIds.slice(0, 2).map(gid => {
                            const g = groups.find(gr => gr.id === gid);
                            return g ? <span key={gid} className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full">{g.icon} {g.name}</span> : null;
                          })}
                          {c.groupIds.length > 2 && <span className="text-[10px] text-muted-foreground">+{c.groupIds.length - 2}</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-center">{c.isActive ? <span className="text-success text-sm">●</span> : <span className="text-muted-foreground text-sm">●</span>}</td>
                      <td className="px-5 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button className="p-1.5 rounded-lg hover:bg-muted" onClick={() => setEditContact({ ...c })}><Edit2 size={12} className="text-muted-foreground" /></button>
                          <button className="p-1.5 rounded-lg hover:bg-destructive/10" onClick={() => setDeleteConfirm(c)}><Trash2 size={12} className="text-muted-foreground" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="divide-y md:hidden">{filteredContacts.map(c => <div key={c.id} className="space-y-3 p-4"><div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-interactive/10 text-sm font-bold text-interactive">{c.name.split(' ').map(n => n[0]).join('').slice(0,2)}</div><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{c.name}</p><p className="break-all text-xs text-muted-foreground">{c.email}</p></div><span className={c.isActive ? 'text-success' : 'text-muted-foreground'}>●</span></div><div className="flex items-center justify-between gap-2"><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${contactTypeColors[c.type]}`}>{contactTypeLabels[c.type]}</span><div className="flex gap-1"><Button variant="ghost" size="icon" aria-label="Editar contato" onClick={() => setEditContact({...c})}><Edit2 size={15}/></Button><Button variant="ghost" size="icon" aria-label="Excluir contato" onClick={() => setDeleteConfirm(c)}><Trash2 size={15}/></Button></div></div></div>)}</div>
          </div>
        </TabsContent>

        {/* ─── TAB GRUPOS ─── */}
        <TabsContent value="groups" className="space-y-4">
          <div className="flex justify-end">
            <Button className="premium-gradient gap-2" onClick={() => setNewGroupOpen(true)}><Plus size={14} />Novo Grupo</Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map(g => (
              <div key={g.id} onClick={() => setSelectedGroup(g)}
                className="bg-card rounded-2xl p-5 premium-shadow hover:shadow-lg transition-all cursor-pointer border border-border/40">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{g.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-foreground truncate">{g.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{g.description}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{g.memberCount} membros</span>
                  {g.autoIncludeType && (
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${contactTypeColors[g.autoIncludeType]}`}>Auto: {contactTypeLabels[g.autoIncludeType]}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* ─── New Contact Dialog ─── */}
      <Dialog open={newContactOpen} onOpenChange={setNewContactOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Novo Contato</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Nome completo *</Label><Input className="mt-1" value={newContact.name} onChange={e => setNewContact(p => ({ ...p, name: e.target.value }))} /></div>
            <div><Label>E-mail *</Label><Input type="email" className="mt-1" value={newContact.email} onChange={e => setNewContact(p => ({ ...p, email: e.target.value }))} /></div>
            <div><Label>Telefone / WhatsApp</Label><Input className="mt-1" value={newContact.phone} onChange={e => setNewContact(p => ({ ...p, phone: e.target.value }))} placeholder="(11) 99999-0000" /></div>
            <div>
              <Label>Tipo</Label>
            <div className="flex flex-wrap gap-2 mt-2">
                {contactTypes.map(t => (
                  <button key={t} onClick={() => setNewContact(p => ({ ...p, type: t }))}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${newContact.type === t ? contactTypeColors[t] + ' ring-2 ring-interactive' : 'bg-muted text-muted-foreground'}`}>
                    {contactTypeLabels[t]}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label>Empresa</Label><Input className="mt-1" value={newContact.company} onChange={e => setNewContact(p => ({ ...p, company: e.target.value }))} /></div>
              <div><Label>Cargo</Label><Input className="mt-1" value={newContact.jobTitle} onChange={e => setNewContact(p => ({ ...p, jobTitle: e.target.value }))} /></div>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
              <div>
                <p className="text-sm font-medium">Vincular a usuário existente</p>
                <p className="text-xs text-muted-foreground">Busca por e-mail e sincroniza</p>
              </div>
              <Switch checked={newContact.linked} onCheckedChange={v => setNewContact(p => ({ ...p, linked: v }))} />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
              <p className="text-sm font-medium">Status</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{newContact.isActive ? 'Ativo' : 'Inativo'}</span>
                <Switch checked={newContact.isActive} onCheckedChange={v => setNewContact(p => ({ ...p, isActive: v }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewContactOpen(false)}>Cancelar</Button>
            <Button className="premium-gradient" onClick={handleCreateContact} disabled={!newContact.name || !newContact.email}>Criar Contato</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Edit Contact Dialog ─── */}
      <Dialog open={!!editContact} onOpenChange={(o) => { if (!o) setEditContact(null); }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar Contato</DialogTitle></DialogHeader>
          {editContact && (
            <div className="space-y-4 py-2">
              <div><Label>Nome completo</Label><Input className="mt-1" value={editContact.name} onChange={e => setEditContact(p => p ? { ...p, name: e.target.value } : null)} /></div>
              <div><Label>E-mail</Label><Input type="email" className="mt-1" value={editContact.email} onChange={e => setEditContact(p => p ? { ...p, email: e.target.value } : null)} /></div>
              <div><Label>Telefone</Label><Input className="mt-1" value={editContact.phone || ''} onChange={e => setEditContact(p => p ? { ...p, phone: e.target.value } : null)} /></div>
              <div>
                <Label>Tipo</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {contactTypes.map(t => (
                    <button key={t} onClick={() => setEditContact(p => p ? { ...p, type: t } : null)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${editContact.type === t ? contactTypeColors[t] + ' ring-2 ring-interactive' : 'bg-muted text-muted-foreground'}`}>
                      {contactTypeLabels[t]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Empresa</Label><Input className="mt-1" value={editContact.company} onChange={e => setEditContact(p => p ? { ...p, company: e.target.value } : null)} /></div>
                <div><Label>Cargo</Label><Input className="mt-1" value={editContact.jobTitle || ''} onChange={e => setEditContact(p => p ? { ...p, jobTitle: e.target.value } : null)} /></div>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                <p className="text-sm font-medium">Status</p>
                <Switch checked={editContact.isActive} onCheckedChange={v => setEditContact(p => p ? { ...p, isActive: v } : null)} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditContact(null)}>Cancelar</Button>
            <Button className="premium-gradient" onClick={handleEditContact}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirm Dialog ─── */}
      <Dialog open={!!deleteConfirm} onOpenChange={(o) => { if (!o) setDeleteConfirm(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir Contato</DialogTitle>
            <DialogDescription>Tem certeza que deseja excluir "{deleteConfirm?.name}"? Esta ação não pode ser desfeita.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteContact}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Import CSV Dialog ─── */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Importar Contatos</DialogTitle>
            <DialogDescription>Preview dos dados do arquivo. Confira antes de confirmar a importação.</DialogDescription>
          </DialogHeader>
          {importPreview.length > 0 && (
            <div className="overflow-x-auto max-h-[300px]">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/30">
                    {importPreview[0]?.map((h, i) => (
                      <th key={i} className="text-left px-3 py-2 font-semibold text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {importPreview.slice(1).map((row, ri) => (
                    <tr key={ri} className="border-b border-border/30">
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-3 py-2 text-foreground">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-xs text-muted-foreground">{Math.max(0, importPreview.length - 1)} contatos serão importados.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>Cancelar</Button>
            <Button className="premium-gradient" onClick={handleConfirmImport}>Confirmar Importação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── New Group Dialog ─── */}
      <Dialog open={newGroupOpen} onOpenChange={setNewGroupOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Novo Grupo</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Nome do grupo *</Label><Input className="mt-1" value={newGroup.name} onChange={e => setNewGroup(p => ({ ...p, name: e.target.value }))} placeholder='Ex: "Segurança Noturna"' /></div>
            <div><Label>Ícone</Label><Input className="mt-1" value={newGroup.icon} onChange={e => setNewGroup(p => ({ ...p, icon: e.target.value }))} placeholder="Emoji ou texto" /></div>
            <div><Label>Descrição</Label><Textarea className="mt-1 min-h-[60px]" value={newGroup.description} onChange={e => setNewGroup(p => ({ ...p, description: e.target.value }))} /></div>
            <div className="p-3 bg-muted/50 rounded-xl space-y-2">
              <p className="text-sm font-medium">Incluir automaticamente por tipo</p>
              <p className="text-xs text-muted-foreground">Novos contatos deste tipo entram automaticamente</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setNewGroup(p => ({ ...p, autoIncludeType: '' }))}
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${!newGroup.autoIncludeType ? 'bg-interactive text-interactive-foreground' : 'bg-muted text-muted-foreground'}`}>
                  Nenhum
                </button>
                {contactTypes.map(t => (
                  <button key={t} onClick={() => setNewGroup(p => ({ ...p, autoIncludeType: t }))}
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${newGroup.autoIncludeType === t ? 'bg-interactive text-interactive-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {contactTypeLabels[t]}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewGroupOpen(false)}>Cancelar</Button>
            <Button className="premium-gradient" onClick={handleCreateGroup} disabled={!newGroup.name}>Criar Grupo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Group Members Sheet ─── */}
      <Sheet open={!!selectedGroup} onOpenChange={(o) => { if (!o) setSelectedGroup(null); }}>
        <SheetContent side="center" className="overflow-y-auto">
          {selectedGroup && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <span className="text-xl">{selectedGroup.icon}</span> {selectedGroup.name}
                </SheetTitle>
                <p className="text-xs text-muted-foreground">{selectedGroup.description}</p>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{groupMembers.length} membros</span>
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => toast.success('Funcionalidade de adicionar membro em breve!')}><Plus size={12} />Adicionar</Button>
                </div>
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {groupMembers.map(c => (
                    <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30">
                      <div className="w-8 h-8 rounded-full bg-interactive/10 flex items-center justify-center text-xs font-bold text-interactive">{c.name[0]}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${contactTypeColors[c.type]}`}>{contactTypeLabels[c.type]}</span>
                      <button className="p-1 rounded hover:bg-destructive/10" onClick={() => toast.success(`${c.name} removido do grupo.`)}><Trash2 size={12} className="text-muted-foreground" /></button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Contatos;
