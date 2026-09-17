import { useState, useMemo } from "react";
import { Search, Star, ShieldCheck, ExternalLink, FileText, Send, Plus, UserPlus, ChevronLeft, ArrowUpDown, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatusBadge from "@/components/StatusBadge";
import { mockNexusSolutions, mockVendors, mockQuotations } from "@/lib/mock-data";
import { useApp } from "@/contexts/AppContext";
import { permissionsByRole } from "@/lib/role-config";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { MobileTabSelect } from "@/components/MobileTabSelect";

const categories = [
  { name: "Limpeza e Higiene", icon: "🧹", count: 12, slug: "limpeza-higiene" },
  { name: "Segurança Patrimonial", icon: "🔒", count: 8, slug: "seguranca-patrimonial" },
  { name: "Manutenção Predial", icon: "🔧", count: 15, slug: "manutencao-predial" },
  { name: "Jardinagem e Paisagismo", icon: "🌿", count: 6, slug: "jardinagem-paisagismo" },
  { name: "Tecnologia e TI", icon: "💻", count: 10, slug: "tecnologia-ti" },
  { name: "Climatização e HVAC", icon: "❄️", count: 7, slug: "climatizacao-hvac" },
  { name: "Energia Solar e ESG", icon: "☀️", count: 4, slug: "energia-solar-esg" },
  { name: "Alimentação e Catering", icon: "🍽️", count: 5, slug: "alimentacao-catering" },
];

const Marketplace = () => {
  const { user } = useApp();
  const permissions = permissionsByRole[user.role];
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'nexus';
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState(initialTab);
  const [proposalOpen, setProposalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [proposalText, setProposalText] = useState("");
  const [addVendorOpen, setAddVendorOpen] = useState(false);
  const [newVendor, setNewVendor] = useState({ name: '', cnpj: '', category: '', email: '', description: '' });
  const [newQuoteOpen, setNewQuoteOpen] = useState(false);
  const [newQuote, setNewQuote] = useState({ title: '', description: '', category: '', deadline: '', budgetMax: '' });

  // Category drill-down state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(searchParams.get('categoria'));
  const [catSearch, setCatSearch] = useState("");
  const [sortBy, setSortBy] = useState<'az' | 'za' | 'best' | 'most'>('az');
  const [minRating, setMinRating] = useState<string>('any');

  const handleCategoryClick = (slug: string) => {
    setSelectedCategory(slug);
    setSearchParams({ tab: 'vendors', categoria: slug });
    setCatSearch("");
    setSortBy('az');
    setMinRating('any');
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setSearchParams({ tab: 'vendors' });
  };

  const activeCat = categories.find(c => c.slug === selectedCategory);

  const filteredVendors = useMemo(() => {
    let list = mockVendors.filter(v => v.status === 'approved');
    if (catSearch) list = list.filter(v => v.name.toLowerCase().includes(catSearch.toLowerCase()));
    if (minRating !== 'any') {
      const min = parseInt(minRating);
      list = list.filter(v => v.rating >= min);
    }
    switch (sortBy) {
      case 'az': list.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'za': list.sort((a, b) => b.name.localeCompare(a.name)); break;
      case 'best': list.sort((a, b) => b.rating - a.rating); break;
      case 'most': list.sort((a, b) => b.contracts_count - a.contracts_count); break;
    }
    return list;
  }, [catSearch, sortBy, minRating]);

  const hasActiveFilters = catSearch || minRating !== 'any' || sortBy !== 'az';

  const handleSendProposal = () => {
    toast.success(`Proposta enviada para ${selectedVendor}! O fornecedor será notificado.`);
    setProposalOpen(false);
    setProposalText("");
    setSelectedVendor(null);
  };

  const handleAddVendor = () => {
    toast.success(`Fornecedor "${newVendor.name}" adicionado como pendente de homologação.`);
    setAddVendorOpen(false);
    setNewVendor({ name: '', cnpj: '', category: '', email: '', description: '' });
  };

  const handleCreateQuote = () => {
    toast.success(`Cotação "${newQuote.title}" criada com sucesso!`);
    setNewQuoteOpen(false);
    setNewQuote({ title: '', description: '', category: '', deadline: '', budgetMax: '' });
  };

  const tabItems = [
    { value: 'nexus', label: '🏆 Hub neXus' },
    { value: 'vendors', label: '✅ Fornecedores' },
    { value: 'quotes', label: '📋 Cotações' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Marketplace</h1>
          <p className="text-sm text-muted-foreground">Hub de soluções e fornecedores para seu ativo</p>
        </div>
        {permissions.canAddHomologatedVendors && (
          <Button className="premium-gradient gap-2" onClick={() => setAddVendorOpen(true)}>
            <UserPlus size={16} />Adicionar Fornecedor
          </Button>
        )}
      </div>

      <MobileTabSelect
        tabs={tabItems}
        value={tab}
        onValueChange={(v) => { setTab(v); setSelectedCategory(null); }}
      >
        <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
          {tabItems.map(t => (
            <button
              key={t.value}
              onClick={() => { setTab(t.value); setSelectedCategory(null); }}
              className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${tab === t.value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </MobileTabSelect>

      {/* Hub neXus */}
      {tab === 'nexus' && (
        <div className="space-y-6">
          <div className="rounded-2xl p-6 sm:p-8 premium-gradient text-primary-foreground">
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Hub neXus</h2>
            <p className="text-sm opacity-90">Soluções Oficiais LUX — Certificadas e Homologadas</p>
            <span className="inline-flex items-center gap-1 mt-3 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold">
              <ShieldCheck size={12} /> Certificado LUX
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockNexusSolutions.map(s => (
              <div key={s.id} className="bg-card rounded-2xl p-5 premium-shadow animate-fade-in hover:shadow-xl transition-shadow border border-amber-200/30 dark:border-amber-800/20">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-2xl">{s.icon}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 whitespace-nowrap">{s.badge}</span>
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">{s.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">{s.description}</p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {s.tags.map(t => (
                    <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground whitespace-nowrap">{t}</span>
                  ))}
                </div>
                <Button className="w-full premium-gradient gap-2" onClick={() => { setSelectedVendor(s.name); setProposalOpen(true); }}><Send size={14} />{s.cta}</Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vendors */}
      {tab === 'vendors' && (
        <div className="space-y-6">
          {!selectedCategory ? (
            <>
              {/* Category Grid */}
              <div className="relative max-w-xl">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Buscar fornecedor..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 rounded-lg" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {categories.map(cat => (
                  <button
                    key={cat.slug}
                    onClick={() => handleCategoryClick(cat.slug)}
                    className="bg-card rounded-2xl p-4 premium-shadow cursor-pointer hover:shadow-xl transition-all animate-fade-in group text-left"
                  >
                    <span className="text-2xl mb-2 block">{cat.icon}</span>
                    <p className="text-sm font-semibold text-foreground group-hover:text-interactive transition-colors">{cat.name}</p>
                    <p className="text-xs text-muted-foreground">{cat.count} fornecedores</p>
                  </button>
                ))}
              </div>

              <h2 className="text-lg font-semibold text-foreground">Fornecedores em Destaque</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockVendors.filter(v => v.status === 'approved' && (!search || v.name.toLowerCase().includes(search.toLowerCase()))).map(v => (
                  <div key={v.id} className="bg-card rounded-2xl p-5 premium-shadow animate-fade-in hover:shadow-xl transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base font-semibold text-foreground truncate">{v.name}</h3>
                          <ShieldCheck size={16} className="text-success flex-shrink-0" />
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">{v.category}</p>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{v.description}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                        <Star size={14} className="text-amber-500 fill-amber-500" />
                        <span className="text-sm font-semibold text-foreground">{v.rating}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {v.services.map(s => (
                        <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground whitespace-nowrap">{s}</span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{v.contracts_count} contratos ativos</span>
                      <Button variant="outline" size="sm" onClick={() => { setSelectedVendor(v.name); setProposalOpen(true); }}>Solicitar Proposta</Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Category Drill-down */}
              <button
                onClick={handleBackToCategories}
                className="flex items-center gap-2 text-sm font-medium text-interactive hover:underline"
              >
                <ChevronLeft size={16} />
                Marketplace
              </button>

              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-2xl">{activeCat?.icon}</span>
                  <h2 className="text-lg font-bold text-foreground">{activeCat?.name}</h2>
                </div>
                <p className="text-sm text-muted-foreground">{filteredVendors.length} fornecedores encontrados</p>
              </div>

              {/* Search & Filters */}
              <div className="space-y-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar fornecedor por nome..."
                    value={catSearch}
                    onChange={e => setCatSearch(e.target.value)}
                    className="pl-9 rounded-lg"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                    <SelectTrigger className="flex-1 sm:max-w-[200px]">
                      <div className="flex items-center gap-2">
                        <ArrowUpDown size={14} />
                        <SelectValue placeholder="Ordenar" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="az">A–Z</SelectItem>
                      <SelectItem value="za">Z–A</SelectItem>
                      <SelectItem value="best">Melhor avaliados</SelectItem>
                      <SelectItem value="most">Mais avaliados</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={minRating} onValueChange={setMinRating}>
                    <SelectTrigger className="flex-1 sm:max-w-[200px]">
                      <div className="flex items-center gap-2">
                        <Star size={14} />
                        <SelectValue placeholder="Avaliação" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Qualquer avaliação</SelectItem>
                      <SelectItem value="4">4★ ou mais</SelectItem>
                      <SelectItem value="3">3★ ou mais</SelectItem>
                      <SelectItem value="5">Apenas 5★</SelectItem>
                    </SelectContent>
                  </Select>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-xs"
                      onClick={() => { setCatSearch(""); setSortBy('az'); setMinRating('any'); }}
                    >
                      <X size={14} />Limpar filtros
                    </Button>
                  )}
                </div>
              </div>

              {/* Vendor List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredVendors.map(v => (
                  <div key={v.id} className="bg-card rounded-2xl p-5 premium-shadow animate-fade-in hover:shadow-xl transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base font-semibold text-foreground truncate">{v.name}</h3>
                          <ShieldCheck size={16} className="text-success flex-shrink-0" />
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">{v.category}</p>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{v.description}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                        <Star size={14} className="text-amber-500 fill-amber-500" />
                        <span className="text-sm font-semibold text-foreground">{v.rating}</span>
                        <span className="text-[10px] text-muted-foreground">({v.contracts_count})</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {v.services.map(s => (
                        <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground whitespace-nowrap">{s}</span>
                      ))}
                    </div>
                    <Button className="w-full" variant="outline" onClick={() => { setSelectedVendor(v.name); setProposalOpen(true); }}>
                      Solicitar Proposta
                    </Button>
                  </div>
                ))}
                {filteredVendors.length === 0 && (
                  <div className="col-span-full text-center py-8 text-muted-foreground text-sm">
                    Nenhum fornecedor encontrado com os filtros aplicados.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Quotations */}
      {tab === 'quotes' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h2 className="text-lg font-semibold">Cotações Abertas</h2>
            <Button className="premium-gradient gap-2 w-full sm:w-auto" onClick={() => setNewQuoteOpen(true)}><FileText size={14} />Nova Cotação</Button>
          </div>
          <div className="space-y-3">
            {mockQuotations.map(q => (
              <div key={q.id} className="bg-card rounded-2xl p-4 sm:p-5 premium-shadow animate-fade-in hover:shadow-xl transition-shadow cursor-pointer">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-base font-semibold text-foreground">{q.title}</h3>
                      <StatusBadge status={q.status === 'open' ? 'active' : q.status === 'closed' ? 'completed' : 'pending'} />
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{q.description}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span className="text-xs text-muted-foreground">📂 {q.category}</span>
                      <span className="text-xs text-muted-foreground">📅 Até {new Date(q.deadline).toLocaleDateString('pt-BR')}</span>
                      {q.budget_max && <span className="text-xs text-muted-foreground">💰 Até R$ {q.budget_max.toLocaleString('pt-BR')}</span>}
                      <span className="text-xs font-semibold text-interactive">{q.proposals_count} propostas</span>
                    </div>
                  </div>
                  {user.role === 'vendor' && (
                    <Button size="sm" className="premium-gradient w-full sm:w-auto" onClick={() => { setSelectedVendor(q.title); setProposalOpen(true); }}>
                      Enviar Proposta
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Solicitar Proposta Dialog */}
      <Dialog open={proposalOpen} onOpenChange={setProposalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{user.role === 'vendor' ? 'Enviar Proposta' : 'Solicitar Proposta'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-sm font-medium text-foreground">{selectedVendor}</p>
              <p className="text-xs text-muted-foreground">Solicitante: {user.full_name} — {user.company}</p>
            </div>
            <div>
              <Label className="text-sm">Descrição da necessidade</Label>
              <Textarea placeholder="Descreva o que você precisa, escopo, prazos..." value={proposalText} onChange={e => setProposalText(e.target.value)} className="mt-1 min-h-[100px]" />
            </div>
            <div>
              <Label className="text-sm">Anexos (opcional)</Label>
              <div className="mt-1 border-2 border-dashed rounded-lg p-4 text-center text-xs text-muted-foreground cursor-pointer hover:bg-muted/30 transition-colors">
                Arraste arquivos aqui ou clique para selecionar
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setProposalOpen(false)} className="w-full sm:w-auto">Cancelar</Button>
            <Button className="premium-gradient w-full sm:w-auto" onClick={handleSendProposal} disabled={!proposalText.trim()}>
              <Send size={14} className="mr-2" />{user.role === 'vendor' ? 'Enviar Proposta' : 'Enviar Solicitação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adicionar Fornecedor Dialog */}
      <Dialog open={addVendorOpen} onOpenChange={setAddVendorOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Fornecedor Homologado</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label className="text-sm">Nome da Empresa</Label><Input className="mt-1" value={newVendor.name} onChange={e => setNewVendor(p => ({ ...p, name: e.target.value }))} placeholder="Nome do fornecedor" /></div>
            <div><Label className="text-sm">CNPJ</Label><Input className="mt-1" value={newVendor.cnpj} onChange={e => setNewVendor(p => ({ ...p, cnpj: e.target.value }))} placeholder="00.000.000/0001-00" /></div>
            <div><Label className="text-sm">Categoria de Serviço</Label><Input className="mt-1" value={newVendor.category} onChange={e => setNewVendor(p => ({ ...p, category: e.target.value }))} placeholder="Ex: Manutenção, Limpeza..." /></div>
            <div><Label className="text-sm">E-mail de Contato</Label><Input className="mt-1" type="email" value={newVendor.email} onChange={e => setNewVendor(p => ({ ...p, email: e.target.value }))} placeholder="contato@empresa.com" /></div>
            <div><Label className="text-sm">Descrição</Label><Textarea className="mt-1" value={newVendor.description} onChange={e => setNewVendor(p => ({ ...p, description: e.target.value }))} placeholder="Descrição dos serviços oferecidos" /></div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setAddVendorOpen(false)} className="w-full sm:w-auto">Cancelar</Button>
            <Button className="premium-gradient w-full sm:w-auto" onClick={handleAddVendor} disabled={!newVendor.name.trim() || !newVendor.cnpj.trim()}>
              <UserPlus size={14} className="mr-2" />Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Nova Cotação Dialog */}
      <Dialog open={newQuoteOpen} onOpenChange={setNewQuoteOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Cotação</DialogTitle>
            <DialogDescription>Crie uma nova cotação para receber propostas de fornecedores.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label className="text-xs">Título *</Label><Input className="mt-1" value={newQuote.title} onChange={e => setNewQuote(p => ({ ...p, title: e.target.value }))} placeholder="Ex: Manutenção preventiva de elevadores" /></div>
            <div><Label className="text-xs">Descrição *</Label><Textarea className="mt-1 min-h-[80px]" value={newQuote.description} onChange={e => setNewQuote(p => ({ ...p, description: e.target.value }))} placeholder="Descreva o escopo da cotação..." /></div>
            <div><Label className="text-xs">Categoria</Label>
              <Select value={newQuote.category} onValueChange={v => setNewQuote(p => ({ ...p, category: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione a categoria" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => (<SelectItem key={c.name} value={c.name}>{c.icon} {c.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label className="text-xs">Prazo para propostas</Label><Input type="date" className="mt-1" value={newQuote.deadline} onChange={e => setNewQuote(p => ({ ...p, deadline: e.target.value }))} /></div>
              <div><Label className="text-xs">Orçamento máximo (R$)</Label><Input type="number" className="mt-1" value={newQuote.budgetMax} onChange={e => setNewQuote(p => ({ ...p, budgetMax: e.target.value }))} placeholder="Opcional" /></div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setNewQuoteOpen(false)} className="w-full sm:w-auto">Cancelar</Button>
            <Button className="premium-gradient w-full sm:w-auto" onClick={handleCreateQuote} disabled={!newQuote.title.trim() || !newQuote.description.trim()}>Criar Cotação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Marketplace;
