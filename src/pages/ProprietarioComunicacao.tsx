import { useState, useMemo } from "react";
import { Megaphone, Contact, Plus, Building2, Eye, Edit2, Copy, Trash2, Send, Search, Mail, Phone, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { getHGRE11PortfolioBuildings, mockAnnouncements, Announcement } from "@/lib/mock-data";
import { mockContacts, mockGroups, contactTypeLabels, contactTypeColors, Contact as ContactType } from "@/lib/contacts-data";
import { useApp } from "@/contexts/AppContext";
import { toast } from "sonner";
import OperationsKpiBanner from "@/components/OperationsKpiBanner";

type PortfolioContact = ContactType & { buildingId?: string };

const priorityColors: Record<string, string> = {
  normal: 'bg-blue-100 text-blue-700',
  high: 'bg-amber-100 text-amber-700',
  urgent: 'bg-rose-100 text-rose-700',
};
const priorityLabels: Record<string, string> = {
  normal: 'Normal', high: '⚠️ High', urgent: '🚨 Urgente',
};

const recipientOptions = [
  'Todos os Locatários', 'Todos os Proprietários', 'Todos do Ativo',
  'Vivo (Telefônica Brasil)', 'Totvs S.A.', 'Befly Viagens', 'Hospital Sírio-Libanês', 'BP Brasil', 'DHL', 'WeWork Brasil', 'Deloitte Brasil',
];

const categoryOptions = ['ESG', 'Administrativo', 'Manutenção', 'Segurança', 'Financeiro', 'Outros'];

const ProprietarioComunicacao = () => {
  const { user } = useApp();
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('all');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [contactGroupFilter, setContactGroupFilter] = useState('all');
  const [contactSearch, setContactSearch] = useState('');
  const [contactSortField, setContactSortField] = useState<string | null>(null);
  const [contactSortDir, setContactSortDir] = useState<'asc' | 'desc'>('asc');

  // Novo Comunicado
  const [showNovoComunicado, setShowNovoComunicado] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [localAnnouncements, setLocalAnnouncements] = useState<Announcement[]>([]);
  const [formTitle, setFormTitle] = useState('');
  const [formBuilding, setFormBuilding] = useState('');
  const [formUnit, setFormUnit] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formPriority, setFormPriority] = useState('normal');
  const [formRecipients, setFormRecipients] = useState<string[]>([]);
  const [formContent, setFormContent] = useState('');
  const [formAttachment, setFormAttachment] = useState<File | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});
  const [recipientSearch, setRecipientSearch] = useState('');

  // Novo Contato
  const [showNovoContato, setShowNovoContato] = useState(false);
  const [novoContatoForm, setNovoContatoForm] = useState({ name: '', jobTitle: '', company: '', email: '', phone: '', type: 'tenant_admin' as string });
  const [localContacts, setLocalContacts] = useState<PortfolioContact[]>([]);

  // Delete confirm
  const [deleteAnnouncement, setDeleteAnnouncement] = useState<Announcement | null>(null);

  // Drawer comment
  const [drawerComment, setDrawerComment] = useState('');

  const userBuildings = getHGRE11PortfolioBuildings();
  const portfolioBuildingIds = new Set(userBuildings.map((b) => b.id));

  const allAnnouncements = useMemo(() => {
    return [...localAnnouncements, ...mockAnnouncements];
  }, [localAnnouncements]);

  const filteredAnnouncements = useMemo(() => {
    let announcements = allAnnouncements;
    if (selectedBuildingId !== 'all') {
      announcements = announcements.filter(a => a.building_id === selectedBuildingId);
    } else {
      announcements = announcements.filter(a => !a.building_id || portfolioBuildingIds.has(a.building_id));
    }
    return announcements;
  }, [selectedBuildingId, portfolioBuildingIds, allAnnouncements]);

  const getBuildingName = (buildingId?: string) => {
    if (!buildingId) return '-';
    const b = userBuildings.find(b => b.id === buildingId);
    return b?.short_name || b?.name || '-';
  };

  const portfolioContacts = useMemo<PortfolioContact[]>(() => {
    const reusableContacts: PortfolioContact[] = mockContacts
      .filter(contact => contact.isActive)
      .filter(contact => !['ct3', 'ct4', 'ct5', 'ct6', 'ct7', 'ct13', 'ct14'].includes(contact.id))
      .map(contact => {
        const buildingIdMap: Record<string, string | undefined> = { ct2: 'b7', ct8: 'b7', ct9: 'b8', ct10: 'b7', ct11: 'b8', ct12: 'b8' };
        return { ...contact, buildingId: buildingIdMap[contact.id] };
      });
    return [
      ...localContacts,
      ...reusableContacts,
      { id: 'pc1', name: 'Recepção Sêneca', email: 'portaria@cdcariacica.com.br', phone: '(11) 99999-1010', type: 'security' as const, company: 'Sêneca', jobTitle: 'Recepção', isActive: true, groupIds: ['g1', 'g6'], createdAt: '2026-03-18', buildingId: 'b8' },
      { id: 'pc2', name: 'Mariana Lopes', email: 'mariana.lopes@cdcariacica.com.br', phone: '(11) 99999-1011', type: 'manager' as const, company: 'Sêneca', jobTitle: 'Facilities Manager', isActive: true, groupIds: ['g5', 'g6'], createdAt: '2026-03-18', buildingId: 'b8' },
      { id: 'pc3', name: 'Portaria Martiniano', email: 'portaria@airportgru3.com.br', phone: '(11) 99999-1012', type: 'security' as const, company: 'Martiniano', jobTitle: 'Recepção', isActive: true, groupIds: ['g1', 'g6'], createdAt: '2026-03-18', buildingId: 'b7' },
      { id: 'pc4', name: 'Ricardo Menezes', email: 'ricardo.menezes@airportgru3.com.br', phone: '(11) 99999-1013', type: 'manager' as const, company: 'Martiniano', jobTitle: 'Coordenador de Operações', isActive: true, groupIds: ['g5', 'g6'], createdAt: '2026-03-18', buildingId: 'b7' },
      { id: 'pc5', name: 'Juliana Prado', email: 'juliana.prado@dhl.com', phone: '(11) 99999-1014', type: 'tenant_admin' as const, company: 'DHL', jobTitle: 'Facilities Coordinator', isActive: true, groupIds: ['g2', 'g6'], createdAt: '2026-03-18', buildingId: 'b8' },
      { id: 'pc6', name: 'Fernanda Alves', email: 'fernanda.alves@sierralog.com.br', phone: '(11) 99999-1015', type: 'tenant_admin' as const, company: 'WeWork Brasil', jobTitle: 'Facilities Coordinator', isActive: true, groupIds: ['g2', 'g6'], createdAt: '2026-03-18', buildingId: 'b7' },
    ];
  }, [localContacts]);

  const filteredContacts = useMemo(() => {
    let contacts = portfolioContacts.filter(contact => !contact.buildingId || portfolioBuildingIds.has(contact.buildingId));
    if (selectedBuildingId !== 'all') {
      contacts = contacts.filter(contact => contact.buildingId === selectedBuildingId || !contact.buildingId);
    }
    if (contactGroupFilter !== 'all') {
      contacts = contacts.filter(contact => contact.groupIds.includes(contactGroupFilter));
    }
    if (contactSearch) {
      const q = contactSearch.toLowerCase();
      contacts = contacts.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.company || '').toLowerCase().includes(q));
    }
    // Sort
    if (contactSortField) {
      contacts = [...contacts].sort((a, b) => {
        const valA = String((a as any)[contactSortField] || '');
        const valB = String((b as any)[contactSortField] || '');
        const cmp = valA.localeCompare(valB, 'pt-BR');
        return contactSortDir === 'asc' ? cmp : -cmp;
      });
    }
    return contacts;
  }, [contactGroupFilter, portfolioContacts, selectedBuildingId, portfolioBuildingIds, contactSearch, contactSortField, contactSortDir]);

  // Form helpers
  const resetForm = () => {
    setFormTitle(''); setFormBuilding(''); setFormUnit(''); setFormCategory('');
    setFormPriority('normal'); setFormRecipients([]); setFormContent('');
    setFormAttachment(null); setFormErrors({}); setEditingAnnouncement(null);
  };

  const openNewDialog = () => { resetForm(); setShowNovoComunicado(true); };

  const openEditDialog = (a: Announcement) => {
    setFormTitle(a.title);
    setFormBuilding(a.building_id || '');
    setFormUnit(a.unit || '');
    setFormCategory(a.category);
    setFormPriority(a.priority);
    setFormContent(a.content);
    setFormRecipients([]);
    setEditingAnnouncement(a);
    setShowNovoComunicado(true);
  };

  const handlePublish = () => {
    const errors: Record<string, boolean> = {};
    if (!formTitle.trim()) errors.title = true;
    if (!formBuilding) errors.building = true;
    if (!formContent.trim()) errors.content = true;
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const totalRecipients = formRecipients.length > 0 ? formRecipients.reduce((sum, r) => sum + (r.startsWith('Todos') ? 50 : 1), 0) : 120;

    if (editingAnnouncement) {
      toast.success(`Comunicado atualizado com sucesso!`);
    } else {
      const newAnnouncement: Announcement = {
        id: `ann-${Date.now()}`,
        title: formTitle,
        content: formContent,
        category: formCategory || 'Administrativo',
        priority: formPriority as 'normal' | 'high' | 'urgent',
        published_at: new Date().toISOString(),
        building_id: formBuilding === 'all' ? undefined : formBuilding,
        unit: formUnit || undefined,
        target_type: 'all',
        author: { name: user.full_name, position: 'Gestor', company: 'LuxNexus' },
        read: false,
        read_count: 0,
        total_recipients: totalRecipients,
        requires_confirmation: false,
        allow_comments: true,
        has_poll: false,
      };
      setLocalAnnouncements(prev => [newAnnouncement, ...prev]);
      toast.success(`Comunicado publicado para ${totalRecipients} destinatários`);
    }
    setShowNovoComunicado(false);
    resetForm();
  };

  const handleSaveDraft = () => {
    toast.success("Rascunho salvo!");
    setShowNovoComunicado(false);
    resetForm();
  };

  const handleDuplicate = (a: Announcement) => {
    const dup: Announcement = { ...a, id: `ann-${Date.now()}`, title: `${a.title} (cópia)`, read_count: 0, published_at: new Date().toISOString() };
    setLocalAnnouncements(prev => [dup, ...prev]);
    toast.success("Comunicado duplicado!");
  };

  const handleDelete = () => {
    if (!deleteAnnouncement) return;
    setLocalAnnouncements(prev => prev.filter(a => a.id !== deleteAnnouncement.id));
    toast.success("Comunicado excluído.");
    setDeleteAnnouncement(null);
  };

  const handleContactSort = (field: string) => {
    if (contactSortField === field) {
      if (contactSortDir === 'desc') { setContactSortField(null); setContactSortDir('asc'); }
      else setContactSortDir('desc');
    } else {
      setContactSortField(field); setContactSortDir('asc');
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (contactSortField !== field) return <ArrowUpDown size={10} className="text-muted-foreground/50" />;
    return contactSortDir === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />;
  };

  const handleCreateContact = () => {
    if (!novoContatoForm.name || !novoContatoForm.email) return;
    const nc: PortfolioContact = {
      id: `pc-${Date.now()}`, name: novoContatoForm.name, email: novoContatoForm.email,
      phone: novoContatoForm.phone, type: novoContatoForm.type as any, company: novoContatoForm.company,
      jobTitle: novoContatoForm.jobTitle, isActive: true, groupIds: [], createdAt: new Date().toISOString().split('T')[0],
    };
    setLocalContacts(prev => [...prev, nc]);
    toast.success(`Contato "${nc.name}" criado!`);
    setShowNovoContato(false);
    setNovoContatoForm({ name: '', jobTitle: '', company: '', email: '', phone: '', type: 'tenant_admin' });
  };

  const bannerData = {
    openTickets: 3,
    slaAtRisk: 1,
    activeAnnouncements: filteredAnnouncements.length,
    weekReservations: 3,
  };

  return (
    <div className="space-y-4">
      <OperationsKpiBanner data={bannerData} />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Comunicação</h1>
        <Select value={selectedBuildingId} onValueChange={setSelectedBuildingId}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="Todos os ativos" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os ativos</SelectItem>
            {userBuildings.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="comunicados">
        <TabsList>
          <TabsTrigger value="comunicados" className="gap-1"><Megaphone size={14} /> Comunicados</TabsTrigger>
          <TabsTrigger value="contatos" className="gap-1"><Contact size={14} /> Contatos</TabsTrigger>
        </TabsList>

        {/* ─── COMUNICADOS ─── */}
        <TabsContent value="comunicados" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">{filteredAnnouncements.length} comunicados</p>
            <Button size="sm" className="gap-1" onClick={openNewDialog}>
              <Plus size={14} /> Novo Comunicado
            </Button>
          </div>
          <div className="bg-card rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Título</TableHead>
                  <TableHead className="text-xs">Ativo</TableHead>
                  <TableHead className="text-xs">Categoria</TableHead>
                  <TableHead className="text-xs">Prioridade</TableHead>
                  <TableHead className="text-xs">Data</TableHead>
                  <TableHead className="text-xs">Leituras</TableHead>
                  <TableHead className="text-xs text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAnnouncements.map(a => {
                  const readPct = a.total_recipients > 0 ? Math.round((a.read_count / a.total_recipients) * 100) : 0;
                  const pctColor = readPct > 70 ? 'bg-green-500' : readPct > 40 ? 'bg-amber-500' : 'bg-red-500';
                  return (
                    <TableRow key={a.id} className="hover:bg-muted/50">
                      <TableCell className="text-sm font-medium cursor-pointer" onClick={() => setSelectedAnnouncement(a)}>{a.title}</TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1"><Building2 size={12} className="text-muted-foreground" />{getBuildingName(a.building_id)}</div>
                      </TableCell>
                      <TableCell className="text-sm">{a.category}</TableCell>
                      <TableCell><Badge className={`${priorityColors[a.priority]} text-[10px]`}>{priorityLabels[a.priority]}</Badge></TableCell>
                      <TableCell className="text-sm">{new Date(a.published_at).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-[140px]">
                          <Progress value={readPct} className={`h-1.5 flex-1 [&>div]:${pctColor}`} />
                          <span className="text-xs text-muted-foreground whitespace-nowrap">{a.read_count}/{a.total_recipients} ({readPct}%)</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-1.5 rounded hover:bg-muted" onClick={() => setSelectedAnnouncement(a)} title="Ver"><Eye size={13} /></button>
                          <button className="p-1.5 rounded hover:bg-muted" onClick={() => openEditDialog(a)} title="Editar"><Edit2 size={13} /></button>
                          <button className="p-1.5 rounded hover:bg-muted" onClick={() => handleDuplicate(a)} title="Duplicar"><Copy size={13} /></button>
                          <button className="p-1.5 rounded hover:bg-destructive/10" onClick={() => setDeleteAnnouncement(a)} title="Excluir"><Trash2 size={13} /></button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredAnnouncements.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum comunicado encontrado.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ─── CONTATOS ─── */}
        <TabsContent value="contatos" className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar contato..." value={contactSearch} onChange={e => setContactSearch(e.target.value)} className="pl-9 h-9" />
            </div>
            <Select value={contactGroupFilter} onValueChange={setContactGroupFilter}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Todos os grupos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os contatos</SelectItem>
                {mockGroups.map(g => <SelectItem key={g.id} value={g.id}>{g.icon} {g.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">{filteredContacts.length} contatos</span>
            <Button size="sm" className="gap-1" onClick={() => setShowNovoContato(true)}><Plus size={14} /> Novo Contato</Button>
          </div>
          <div className="bg-card rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs cursor-pointer" onClick={() => handleContactSort('name')}>
                    <div className="flex items-center gap-1">Nome <SortIcon field="name" /></div>
                  </TableHead>
                  <TableHead className="text-xs">Cargo</TableHead>
                  <TableHead className="text-xs cursor-pointer" onClick={() => handleContactSort('company')}>
                    <div className="flex items-center gap-1">Empresa <SortIcon field="company" /></div>
                  </TableHead>
                  <TableHead className="text-xs">E-mail</TableHead>
                  <TableHead className="text-xs">Telefone</TableHead>
                  <TableHead className="text-xs cursor-pointer" onClick={() => handleContactSort('type')}>
                    <div className="flex items-center gap-1">Tipo <SortIcon field="type" /></div>
                  </TableHead>
                  <TableHead className="text-xs text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="text-sm font-medium">{c.name}</TableCell>
                    <TableCell className="text-sm">{c.jobTitle || '-'}</TableCell>
                    <TableCell className="text-sm">{c.company || '-'}</TableCell>
                    <TableCell className="text-sm">{c.email}</TableCell>
                    <TableCell className="text-sm">{c.phone || '-'}</TableCell>
                    <TableCell><Badge className={`${contactTypeColors[c.type]} text-[10px]`}>{contactTypeLabels[c.type]}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <a href={`mailto:${c.email}`} className="p-1.5 rounded hover:bg-muted" title="E-mail"><Mail size={13} /></a>
                        {c.phone && <a href={`tel:${c.phone}`} className="p-1.5 rounded hover:bg-muted" title="Ligar"><Phone size={13} /></a>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* ─── DRAWER COMUNICADO ─── */}
      <Sheet open={!!selectedAnnouncement} onOpenChange={() => setSelectedAnnouncement(null)}>
        <SheetContent side="center" className="overflow-y-auto">
          {selectedAnnouncement && (
            <>
              <SheetHeader><SheetTitle>{selectedAnnouncement.title}</SheetTitle></SheetHeader>
              <div className="space-y-4 mt-4">
                <div className="flex gap-2 flex-wrap">
                  <Badge className={`${priorityColors[selectedAnnouncement.priority]} text-[10px]`}>{priorityLabels[selectedAnnouncement.priority]}</Badge>
                  <Badge className="bg-muted text-[10px]">{selectedAnnouncement.category}</Badge>
                  <Badge className="bg-green-100 text-green-700 text-[10px]">● Publicado</Badge>
                  {selectedAnnouncement.requires_confirmation && <Badge className="bg-amber-100 text-amber-700 text-[10px]">Requer confirmação</Badge>}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-xs text-muted-foreground">Ativo</p><p className="font-semibold">{getBuildingName(selectedAnnouncement.building_id)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Unidade / Andar</p><p className="font-semibold">{selectedAnnouncement.unit || 'Todos'}</p></div>
                  <div><p className="text-xs text-muted-foreground">Autor</p><p className="font-semibold">{selectedAnnouncement.author.name}</p></div>
                  <div><p className="text-xs text-muted-foreground">Empresa</p><p className="font-semibold">{selectedAnnouncement.author.company}</p></div>
                  <div><p className="text-xs text-muted-foreground">Publicado em</p><p className="font-semibold">{new Date(selectedAnnouncement.published_at).toLocaleString('pt-BR')}</p></div>
                  <div>
                    <p className="text-xs text-muted-foreground">Leituras</p>
                    <div className="flex items-center gap-2">
                      <Progress value={Math.round((selectedAnnouncement.read_count / selectedAnnouncement.total_recipients) * 100)} className="h-1.5 flex-1" />
                      <span className="text-xs font-semibold">{selectedAnnouncement.read_count}/{selectedAnnouncement.total_recipients}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Conteúdo</h4>
                  <p className="text-sm text-foreground whitespace-pre-line">{selectedAnnouncement.content}</p>
                </div>

                {/* Comments */}
                <div className="border-t pt-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Comentários</h4>
                  {selectedAnnouncement.comments && selectedAnnouncement.comments.length > 0 ? (
                    <div className="space-y-2 mb-3">
                      {selectedAnnouncement.comments.map(c => (
                        <div key={c.id} className="text-xs border-l-2 pl-3 py-1">
                          <p className="font-medium">{c.text}</p>
                          <p className="text-muted-foreground">{c.author} ({c.company}) · {new Date(c.created_at).toLocaleString('pt-BR')}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mb-3">Nenhum comentário ainda.</p>
                  )}
                  <div className="flex gap-2">
                    <Textarea value={drawerComment} onChange={e => setDrawerComment(e.target.value)} placeholder="Adicionar comentário..." className="min-h-[60px]" />
                  </div>
                  <Button size="sm" className="mt-2 gap-1" onClick={() => { setDrawerComment(''); toast.success("Comentário enviado!"); }}>
                    <Send size={14} /> Enviar
                  </Button>
                </div>

                <Button variant="outline" className="w-full gap-1 mt-2" onClick={() => { setSelectedAnnouncement(null); openEditDialog(selectedAnnouncement); }}>
                  <Edit2 size={14} /> Editar Comunicado
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ─── DIALOG NOVO COMUNICADO ─── */}
      <Dialog open={showNovoComunicado} onOpenChange={(v) => { if (!v) { setShowNovoComunicado(false); resetForm(); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAnnouncement ? 'Editar Comunicado' : 'Novo Comunicado'}</DialogTitle>
            <DialogDescription>Preencha as informações do comunicado</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Título */}
            <div>
              <Label className="text-xs">Título *</Label>
              <Input
                value={formTitle} onChange={e => setFormTitle(e.target.value)}
                placeholder="Ex: Manutenção preventiva docas — Chucri Zaidan"
                className={formErrors.title ? 'border-red-500' : ''}
              />
              {formErrors.title && <p className="text-xs text-red-500 mt-1">Título é obrigatório</p>}
            </div>
            {/* Ativo + Unidade */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Ativo *</Label>
                <Select value={formBuilding} onValueChange={setFormBuilding}>
                  <SelectTrigger className={formErrors.building ? 'border-red-500' : ''}><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {userBuildings.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {formErrors.building && <p className="text-xs text-red-500 mt-1">Obrigatório</p>}
              </div>
              <div>
                <Label className="text-xs">Unidade / Andar</Label>
                <Input value={formUnit} onChange={e => setFormUnit(e.target.value)} placeholder="Todos, 15º andar, SS2..." />
              </div>
            </div>
            {/* Categoria + Prioridade */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Categoria</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Prioridade</Label>
                <ToggleGroup type="single" value={formPriority} onValueChange={v => v && setFormPriority(v)} className="mt-1">
                  <ToggleGroupItem value="normal" className="text-xs">Normal</ToggleGroupItem>
                  <ToggleGroupItem value="high" className="text-xs">High</ToggleGroupItem>
                  <ToggleGroupItem value="urgent" className="text-xs">Urgent</ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
            {/* Destinatários */}
            <div>
              <Label className="text-xs">Destinatários</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start mt-1 h-auto min-h-[36px] flex-wrap gap-1">
                    {formRecipients.length === 0 ? (
                      <span className="text-muted-foreground text-sm">Selecionar destinatários...</span>
                    ) : (
                      formRecipients.map(r => (
                        <Badge key={r} className="bg-blue-100 text-blue-700 text-[10px] gap-1">
                          {r}
                          <button onClick={(e) => { e.stopPropagation(); setFormRecipients(prev => prev.filter(x => x !== r)); }}>×</button>
                        </Badge>
                      ))
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-3 pointer-events-auto" align="start">
                  <Input placeholder="Buscar..." value={recipientSearch} onChange={e => setRecipientSearch(e.target.value)} className="mb-2 h-8" />
                  <div className="space-y-1 max-h-[200px] overflow-y-auto">
                    {recipientOptions.filter(r => r.toLowerCase().includes(recipientSearch.toLowerCase())).map(r => (
                      <label key={r} className="flex items-center gap-2 p-1.5 rounded hover:bg-muted cursor-pointer">
                        <Checkbox checked={formRecipients.includes(r)} onCheckedChange={c => {
                          setFormRecipients(prev => c ? [...prev, r] : prev.filter(x => x !== r));
                        }} />
                        <span className="text-sm">{r}</span>
                      </label>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            {/* Conteúdo */}
            <div>
              <Label className="text-xs">Conteúdo *</Label>
              <Textarea
                value={formContent} onChange={e => setFormContent(e.target.value)}
                placeholder="Escreva o conteúdo do comunicado aqui..."
                className={`min-h-[120px] ${formErrors.content ? 'border-red-500' : ''}`}
              />
              {formErrors.content && <p className="text-xs text-red-500 mt-1">Conteúdo é obrigatório</p>}
            </div>
            {/* Anexo */}
            <div>
              <Label className="text-xs">Anexo (opcional)</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center mt-1">
                {formAttachment ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{formAttachment.name} ({(formAttachment.size / 1024).toFixed(0)}KB)</span>
                    <button onClick={() => setFormAttachment(null)} className="text-muted-foreground hover:text-foreground"><Trash2 size={14} /></button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <p className="text-sm text-muted-foreground">Adicionar arquivo (PDF, imagem) — opcional</p>
                    <input type="file" accept=".pdf,.jpg,.png,.jpeg" className="hidden" onChange={e => e.target.files?.[0] && setFormAttachment(e.target.files[0])} />
                  </label>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowNovoComunicado(false); resetForm(); }}>Cancelar</Button>
            <Button variant="secondary" onClick={handleSaveDraft}>Salvar Rascunho</Button>
            <Button onClick={handlePublish} className="gap-1"><Megaphone size={14} /> Publicar Comunicado</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── DELETE CONFIRMATION ─── */}
      <Dialog open={!!deleteAnnouncement} onOpenChange={() => setDeleteAnnouncement(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir comunicado</DialogTitle>
            <DialogDescription>Excluir "{deleteAnnouncement?.title}"? Esta ação não pode ser desfeita.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteAnnouncement(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── NOVO CONTATO DIALOG ─── */}
      <Dialog open={showNovoContato} onOpenChange={setShowNovoContato}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Contato</DialogTitle><DialogDescription>Adicione um novo contato ao diretório</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Nome *</Label><Input value={novoContatoForm.name} onChange={e => setNovoContatoForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Cargo</Label><Input value={novoContatoForm.jobTitle} onChange={e => setNovoContatoForm(p => ({ ...p, jobTitle: e.target.value }))} /></div>
              <div><Label className="text-xs">Empresa</Label><Input value={novoContatoForm.company} onChange={e => setNovoContatoForm(p => ({ ...p, company: e.target.value }))} /></div>
            </div>
            <div><Label className="text-xs">E-mail *</Label><Input type="email" value={novoContatoForm.email} onChange={e => setNovoContatoForm(p => ({ ...p, email: e.target.value }))} /></div>
            <div><Label className="text-xs">Telefone</Label><Input value={novoContatoForm.phone} onChange={e => setNovoContatoForm(p => ({ ...p, phone: e.target.value }))} placeholder="(11) 99999-0000" /></div>
            <div>
              <Label className="text-xs">Tipo</Label>
              <Select value={novoContatoForm.type} onValueChange={v => setNovoContatoForm(p => ({ ...p, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(contactTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNovoContato(false)}>Cancelar</Button>
            <Button onClick={handleCreateContact} disabled={!novoContatoForm.name || !novoContatoForm.email}>Criar Contato</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProprietarioComunicacao;
