import { useState, lazy, Suspense } from "react";
const SignaturePadLazy = lazy(() => import("@/components/SignaturePad"));
import { useApp } from "@/contexts/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MobileTabSelect } from "@/components/MobileTabSelect";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Package as PackageIcon, Plus, Search, Download, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import {
  seedPackages, packageTypeConfig, packageStatusConfig, carriers, tenantDirectory,
  getDaysDiff, formatRelativeTime,
  type Package, type PackageType, type PackageStatus,
} from "@/lib/packages-data";

const Encomendas = () => {
  const { user } = useApp();
  const [packages, setPackages] = useState<Package[]>(seedPackages);
  const [showRegister, setShowRegister] = useState(false);
  const [showPickup, setShowPickup] = useState<Package | null>(null);
  const [step, setStep] = useState(1);
  const [searchFilter, setSearchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  // History filters
  const [histFloor, setHistFloor] = useState<string>("all");
  const [histCompany, setHistCompany] = useState<string>("all");
  const [histMonth, setHistMonth] = useState<string>("all");
  const [histSort, setHistSort] = useState<"newest" | "oldest">("newest");

  // Form state
  const [formType, setFormType] = useState<PackageType>("package");
  const [formSender, setFormSender] = useState("");
  const [formVolumes, setFormVolumes] = useState(1);
  const [formCarrier, setFormCarrier] = useState("");
  const [formTracking, setFormTracking] = useState("");
  const [formObs, setFormObs] = useState("");
  const [formTenantId, setFormTenantId] = useState("");
  const [formRecipientName, setFormRecipientName] = useState("");
  const [formNotify, setFormNotify] = useState(true);

  // Pickup form
  const [pickupBy, setPickupBy] = useState("");
  const [pickupDoc, setPickupDoc] = useState(false);
  const [pickupDocType, setPickupDocType] = useState("");
  const [pickupRequireSignature, setPickupRequireSignature] = useState(false);
  const [pickupSignature, setPickupSignature] = useState<string | null>(null);

  const isConcierge = user.role === "concierge";
  const isAdmin = user.role === "super_admin" || user.role === "building_manager";
  const isTenant = user.role === "tenant_admin" || user.role === "tenant_employee";

  // Filter for tenants
  const visiblePackages = isTenant
    ? packages.filter(p => {
        const tenantCompany = user.company || "";
        return p.recipientCompany.toLowerCase().includes(tenantCompany.toLowerCase());
      })
    : packages;

  const filtered = visiblePackages.filter(p => {
    if (searchFilter && !p.recipientCompany.toLowerCase().includes(searchFilter.toLowerCase()) &&
        !(p.recipientName || "").toLowerCase().includes(searchFilter.toLowerCase()) &&
        !(p.senderName || "").toLowerCase().includes(searchFilter.toLowerCase())) return false;
    if (typeFilter !== "all" && p.type !== typeFilter) return false;
    return true;
  });

  const waiting = filtered.filter(p => p.status === "waiting" && getDaysDiff(p.arrivedAt) < 3);
  const pickedUpToday = filtered.filter(p => p.status === "picked_up" && getDaysDiff(p.pickedUpAt || p.arrivedAt) === 0);
  const overdue = filtered.filter(p => p.status === "waiting" && getDaysDiff(p.arrivedAt) >= 3);
  const allPickedUp = filtered.filter(p => p.status === "picked_up");

  const resetForm = () => {
    setStep(1);
    setFormType("package");
    setFormSender("");
    setFormVolumes(1);
    setFormCarrier("");
    setFormTracking("");
    setFormObs("");
    setFormTenantId("");
    setFormRecipientName("");
    setFormNotify(true);
  };

  const handleRegister = () => {
    const tenant = tenantDirectory.find(t => t.id === formTenantId);
    if (!tenant) { toast.error("Selecione um destinatário"); return; }
    const newPkg: Package = {
      id: `pkg-${Date.now()}`,
      type: formType,
      recipientCompany: tenant.company,
      recipientFloor: tenant.floor,
      recipientName: formRecipientName || undefined,
      senderName: formSender || undefined,
      carrier: formCarrier || undefined,
      trackingCode: formTracking || undefined,
      volumes: formVolumes,
      observations: formObs || undefined,
      status: "waiting",
      arrivedAt: new Date(),
      registeredBy: user.full_name,
      notificationSentAt: formNotify ? new Date() : undefined,
    };
    setPackages(prev => [newPkg, ...prev]);
    setShowRegister(false);
    resetForm();
    toast.success(`✅ Encomenda registrada para ${tenant.company} — ${tenant.floor}`);
    if (formNotify) toast.info(`📧 Notificação enviada para ${tenant.email}`);
  };

  const handlePickup = () => {
    if (!showPickup || !pickupBy.trim()) { toast.error("Informe quem retirou"); return; }
    if (pickupRequireSignature && !pickupSignature) { toast.error("Assinatura obrigatória"); return; }
    setPackages(prev => prev.map(p =>
      p.id === showPickup.id ? {
        ...p, status: "picked_up" as PackageStatus, pickedUpAt: new Date(),
        pickedUpBy: pickupBy, documentPresented: pickupDoc,
      } : p
    ));
    toast.success(`✅ Retirada confirmada — ${showPickup.recipientCompany}`);
    if (pickupSignature) toast.info("✍️ Assinatura registrada com sucesso");
    setShowPickup(null);
    setPickupBy("");
    setPickupDoc(false);
    setPickupDocType("");
    setPickupRequireSignature(false);
    setPickupSignature(null);
  };

  const selectedTenant = tenantDirectory.find(t => t.id === formTenantId);

  const PackageCard = ({ pkg }: { pkg: Package }) => {
    const typeConf = packageTypeConfig[pkg.type];
    const statusConf = packageStatusConfig[pkg.status];
    const isOverdue = pkg.status === "waiting" && getDaysDiff(pkg.arrivedAt) >= 3;
    return (
      <Card className={`transition-all hover:shadow-md ${isOverdue ? "border-destructive/50 bg-destructive/5" : ""}`}>
        <CardContent className="px-4 py-3">
          {/* Line 1: icon + company/floor + badge */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg shrink-0">{typeConf.icon}</span>
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <span className="font-semibold text-sm text-foreground truncate" title={pkg.recipientCompany}>{pkg.recipientCompany}</span>
              <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">· {pkg.recipientFloor}</span>
            </div>
            <Badge className={`text-[10px] whitespace-nowrap shrink-0 max-w-[100px] ${statusConf.color}`} title={statusConf.label}>
              {isOverdue ? "⚠️ Pendente" : pkg.status === 'waiting' ? 'Aguardando' : pkg.status === 'picked_up' ? 'Retirada ✅' : statusConf.label}
            </Badge>
          </div>
          {/* Line 2: sender · volumes · time */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground ml-7 flex-wrap">
            {pkg.recipientName && <span className="truncate max-w-[120px]">👤 {pkg.recipientName}</span>}
            {pkg.recipientName && pkg.senderName && <span>·</span>}
            {pkg.senderName && <span className="truncate max-w-[100px]">De: {pkg.senderName}</span>}
            {(pkg.recipientName || pkg.senderName) && <span>·</span>}
            <span>{pkg.volumes} vol.</span>
            <span>· {formatRelativeTime(pkg.arrivedAt)}</span>
          </div>
          {/* Line 3: action button */}
          {pkg.status === "waiting" && (isConcierge || isAdmin) && (
            <div className="flex justify-end mt-2">
              <Button size="sm" variant="outline" className="text-xs h-8 gap-1" onClick={() => setShowPickup(pkg)}>
                <CheckCircle2 size={14} /> Confirmar Retirada
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // ─── TENANT VIEW ─────────────────────────────────
  if (isTenant) {
    const pendingCount = visiblePackages.filter(p => p.status === "waiting").length;
    const recentPickups = visiblePackages.filter(p => p.status === "picked_up").slice(0, 5);
    return (
      <div className="space-y-6">
        <h1 className="text-xl md:text-2xl font-bold text-foreground">📦 Minhas Encomendas</h1>
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6 flex items-center gap-4">
            <PackageIcon size={40} className="text-primary" />
            <div>
              <p className="text-3xl font-bold text-primary">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">encomenda{pendingCount !== 1 ? "s" : ""} aguardando retirada</p>
            </div>
          </CardContent>
        </Card>
        {visiblePackages.filter(p => p.status === "waiting").length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Pendentes</h2>
            {visiblePackages.filter(p => p.status === "waiting").map(pkg => <PackageCard key={pkg.id} pkg={pkg} />)}
          </div>
        )}
        {recentPickups.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Últimas Retiradas</h2>
            {recentPickups.map(pkg => <PackageCard key={pkg.id} pkg={pkg} />)}
          </div>
        )}
      </div>
    );
  }

  // ─── ADMIN / CONCIERGE VIEW ─────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl md:text-2xl font-bold text-foreground">📦 Encomendas</h1>
        {(isConcierge || isAdmin) && (
          <Button onClick={() => { resetForm(); setShowRegister(true); }} className="gap-2">
            <Plus size={16} /> Registrar Chegada
          </Button>
        )}
      </div>

      {/* Filters */}
      {isAdmin && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar empresa, nome..." className="pl-9" value={searchFilter} onChange={e => setSearchFilter(e.target.value)} />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {Object.entries(packageTypeConfig).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.icon} {v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Tabs defaultValue="waiting">
        <MobileTabSelect
          tabs={[
            { value: 'waiting', label: `Aguardando (${waiting.length})` },
            { value: 'picked_up', label: `Retiradas (${pickedUpToday.length})` },
            { value: 'overdue', label: `+3d (${overdue.length})` },
            ...(isAdmin ? [{ value: 'history', label: '📊 Histórico' }] : []),
          ]}
          value="waiting"
          onValueChange={() => {}}
        >
          <TabsList className="w-full overflow-x-auto flex-nowrap justify-start">
            <TabsTrigger value="waiting" className="gap-1 whitespace-nowrap text-xs sm:text-sm"><Clock size={14} /> Aguardando ({waiting.length})</TabsTrigger>
            <TabsTrigger value="picked_up" className="gap-1 whitespace-nowrap text-xs sm:text-sm"><CheckCircle2 size={14} /> Retiradas ({pickedUpToday.length})</TabsTrigger>
            <TabsTrigger value="overdue" className="gap-1 whitespace-nowrap text-xs sm:text-sm"><AlertTriangle size={14} /> +3d ({overdue.length})</TabsTrigger>
            {isAdmin && <TabsTrigger value="history" className="gap-1 whitespace-nowrap text-xs sm:text-sm">📊 Histórico</TabsTrigger>}
          </TabsList>
        </MobileTabSelect>

        <TabsContent value="waiting" className="space-y-3 mt-4">
          {waiting.length === 0 ? <p className="text-muted-foreground text-sm">Nenhuma encomenda aguardando.</p> :
            waiting.map(pkg => <PackageCard key={pkg.id} pkg={pkg} />)}
        </TabsContent>
        <TabsContent value="picked_up" className="space-y-3 mt-4">
          {pickedUpToday.length === 0 ? <p className="text-muted-foreground text-sm">Nenhuma retirada hoje.</p> :
            pickedUpToday.map(pkg => <PackageCard key={pkg.id} pkg={pkg} />)}
        </TabsContent>
        <TabsContent value="overdue" className="space-y-3 mt-4">
          {overdue.length === 0 ? <p className="text-muted-foreground text-sm">Nenhuma pendência acima de 3 dias.</p> :
            overdue.map(pkg => <PackageCard key={pkg.id} pkg={pkg} />)}
        </TabsContent>
        {isAdmin && (
          <TabsContent value="history" className="mt-4">
            <Card>
              <CardHeader className="pb-2 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <CardTitle className="text-sm md:text-base">Histórico Completo</CardTitle>
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => toast.success("📥 CSV exportado com sucesso!")}>
                    <Download size={14} /> Exportar CSV
                  </Button>
                </div>
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                  <Select value={histFloor} onValueChange={setHistFloor}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Andar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os andares</SelectItem>
                      {[...new Set(filtered.map(p => p.recipientFloor))].sort().map(f => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={histCompany} onValueChange={setHistCompany}>
                    <SelectTrigger className="w-full text-xs sm:h-8 sm:w-[170px]"><SelectValue placeholder="Empresa" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as empresas</SelectItem>
                      {[...new Set(filtered.map(p => p.recipientCompany))].sort().map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={histMonth} onValueChange={setHistMonth}>
                    <SelectTrigger className="w-full text-xs sm:h-8 sm:w-[140px]"><SelectValue placeholder="Mês" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os meses</SelectItem>
                      {[...new Set(filtered.map(p => {
                        const d = p.arrivedAt;
                        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                      }))].sort().reverse().map(m => (
                        <SelectItem key={m} value={m}>
                          {new Date(m + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={histSort} onValueChange={v => setHistSort(v as 'newest' | 'oldest')}>
                    <SelectTrigger className="w-full text-xs sm:h-8 sm:w-[160px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Mais recente primeiro</SelectItem>
                      <SelectItem value="oldest">Mais antigo primeiro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Chegada</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Destinatário</TableHead>
                      <TableHead>Andar</TableHead>
                      <TableHead>Remetente</TableHead>
                      <TableHead>Vol.</TableHead>
                      <TableHead>Retirada em</TableHead>
                      <TableHead>Retirado por</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered
                      .filter(pkg => {
                        if (histFloor !== 'all' && pkg.recipientFloor !== histFloor) return false;
                        if (histCompany !== 'all' && pkg.recipientCompany !== histCompany) return false;
                        if (histMonth !== 'all') {
                          const d = pkg.arrivedAt;
                          const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                          if (m !== histMonth) return false;
                        }
                        return true;
                      })
                      .sort((a, b) => histSort === 'newest'
                        ? b.arrivedAt.getTime() - a.arrivedAt.getTime()
                        : a.arrivedAt.getTime() - b.arrivedAt.getTime()
                      )
                      .map(pkg => (
                      <TableRow key={pkg.id}>
                        <TableCell className="text-xs">{pkg.arrivedAt.toLocaleDateString("pt-BR")} {pkg.arrivedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</TableCell>
                        <TableCell>{packageTypeConfig[pkg.type].icon}</TableCell>
                        <TableCell className="text-xs font-medium">{pkg.recipientCompany}{pkg.recipientName ? ` (${pkg.recipientName})` : ''}</TableCell>
                        <TableCell className="text-xs">{pkg.recipientFloor}</TableCell>
                        <TableCell className="text-xs">{pkg.senderName || "—"}</TableCell>
                        <TableCell className="text-xs">{pkg.volumes}</TableCell>
                        <TableCell className="text-xs">{pkg.pickedUpAt ? `${pkg.pickedUpAt.toLocaleDateString("pt-BR")} ${pkg.pickedUpAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : "—"}</TableCell>
                        <TableCell className="text-xs">{pkg.pickedUpBy || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* ─── REGISTER DIALOG (3 steps) ─── */}
      <Dialog open={showRegister} onOpenChange={v => { if (!v) { setShowRegister(false); resetForm(); } }}>
        <DialogContent className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Chegada — Passo {step}/3</DialogTitle>
          </DialogHeader>

          {step === 1 && (
            <div className="space-y-4">
              <Label className="font-semibold">Tipo</Label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(packageTypeConfig).map(([k, v]) => (
                  <button key={k} type="button"
                    className={`flex items-center gap-2 p-3 rounded-lg border text-sm transition-all ${formType === k ? "border-primary bg-primary/10 font-medium" : "border-border hover:bg-muted"}`}
                    onClick={() => setFormType(k as PackageType)}>
                    <span className="text-lg">{v.icon}</span> {v.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Remetente (opcional)</Label><Input value={formSender} onChange={e => setFormSender(e.target.value)} placeholder="Ex: Amazon" /></div>
                <div><Label>Volumes</Label><Input type="number" min={1} value={formVolumes} onChange={e => setFormVolumes(Number(e.target.value) || 1)} /></div>
              </div>
              <div><Label>Transportadora / Serviço</Label>
                <Select value={formCarrier} onValueChange={setFormCarrier}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>{carriers.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Código de rastreio (opcional)</Label><Input value={formTracking} onChange={e => setFormTracking(e.target.value)} /></div>
              <div><Label>Observações</Label><Textarea value={formObs} onChange={e => setFormObs(e.target.value)} placeholder="Ex: produto frágil, requer refrigeração..." rows={2} /></div>
              <DialogFooter><Button onClick={() => setStep(2)}>Próximo →</Button></DialogFooter>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label className="font-semibold">Empresa / Locatário</Label>
                <p className="text-xs text-muted-foreground mb-2">A empresa será notificada para comunicar o funcionário destinatário.</p>
                <Select value={formTenantId} onValueChange={setFormTenantId}>
                  <SelectTrigger><SelectValue placeholder="Selecione a empresa..." /></SelectTrigger>
                  <SelectContent>
                    {tenantDirectory.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.company} — {t.floor}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedTenant && (
                <div className="bg-muted rounded-lg p-3 text-sm">
                  <p><strong>Andar:</strong> {selectedTenant.floor}</p>
                  <p><strong>E-mail de notificação:</strong> {selectedTenant.email}</p>
                </div>
              )}
              <div>
                <Label className="font-semibold">👤 Destinatário (pessoa)</Label>
                <p className="text-xs text-muted-foreground mb-1">Nome do funcionário ou pessoa que deve receber. A empresa receberá o aviso para repassar.</p>
                <Input value={formRecipientName} onChange={e => setFormRecipientName(e.target.value)} placeholder="Ex: Ana Paula, João Silva..." />
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setStep(1)}>← Voltar</Button>
                <Button onClick={() => setStep(3)} disabled={!formTenantId}>Próximo →</Button>
              </DialogFooter>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <Label className="font-semibold">Resumo</Label>
              <div className="bg-muted rounded-lg p-4 space-y-1 text-sm">
                <p>{packageTypeConfig[formType].icon} <strong>Tipo:</strong> {packageTypeConfig[formType].label}</p>
                <p>🏢 <strong>Destinatário:</strong> {selectedTenant?.company} — {selectedTenant?.floor}</p>
                {formRecipientName && <p>👤 <strong>Para:</strong> {formRecipientName}</p>}
                {formSender && <p>📬 <strong>Remetente:</strong> {formSender}</p>}
                <p>📦 <strong>Volumes:</strong> {formVolumes}</p>
                {formCarrier && <p>🚚 <strong>Transportadora:</strong> {formCarrier}</p>}
                {formTracking && <p>🔍 <strong>Rastreio:</strong> {formTracking}</p>}
                {formObs && <p>📝 <strong>Obs:</strong> {formObs}</p>}
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={formNotify} onCheckedChange={setFormNotify} />
                <Label>Notificar destinatário agora por e-mail</Label>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setStep(2)}>← Voltar</Button>
                <Button onClick={handleRegister}>Registrar Chegada</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── PICKUP DIALOG ─── */}
      <Dialog open={!!showPickup} onOpenChange={v => { if (!v) { setShowPickup(null); setPickupRequireSignature(false); setPickupSignature(null); } }}>
        <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Confirmar Retirada</DialogTitle></DialogHeader>
          {showPickup && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {packageTypeConfig[showPickup.type].icon} {showPickup.recipientCompany} — {showPickup.recipientFloor}
              </p>
              <div><Label>Quem retirou</Label><Input value={pickupBy} onChange={e => setPickupBy(e.target.value)} placeholder="Nome completo" /></div>
              <div className="flex items-center gap-3">
                <Switch checked={pickupDoc} onCheckedChange={setPickupDoc} />
                <Label>Documento apresentado?</Label>
              </div>
              {pickupDoc && (
                <Select value={pickupDocType} onValueChange={setPickupDocType}>
                  <SelectTrigger><SelectValue placeholder="Tipo de documento" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rg">RG</SelectItem>
                    <SelectItem value="cpf">CPF</SelectItem>
                    <SelectItem value="cracha">Crachá</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <div className="flex items-center gap-3">
                <Switch checked={pickupRequireSignature} onCheckedChange={v => { setPickupRequireSignature(v); if (!v) setPickupSignature(null); }} />
                <Label>Assinar digitalmente</Label>
              </div>
              {pickupRequireSignature && (
                <Suspense fallback={<div className="h-[180px] border rounded-lg flex items-center justify-center text-muted-foreground text-sm">Carregando...</div>}>
                  <SignaturePadLazy onSignatureChange={setPickupSignature} />
                </Suspense>
              )}
              <DialogFooter>
                <Button onClick={handlePickup}>Confirmar Retirada</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Encomendas;
