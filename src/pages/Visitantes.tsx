import { useState } from "react";
import { Users, Plus, Search, QrCode, CheckCircle2, XCircle, Bell, Clock, Shield, ArrowRightLeft, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockVisitors, Visitor } from "@/lib/mock-data";
import StatusBadge from "@/components/StatusBadge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useApp } from "@/contexts/AppContext";

const visitorTypeLabels: Record<string, string> = {
  guest: "Convidado",
  service: "Prestador",
  delivery: "Entregador",
  client: "Cliente",
  candidate: "Candidato",
};

const visitorTypeIcons: Record<string, string> = {
  guest: "👤",
  service: "🔧",
  delivery: "📦",
  client: "💼",
  candidate: "🎯",
};

const Visitantes = () => {
  const { user } = useApp();
  const [tab, setTab] = useState("today");
  const [search, setSearch] = useState("");
  const [showNewVisit, setShowNewVisit] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [qrDialogVisitor, setQrDialogVisitor] = useState<Visitor | null>(null);

  // Scope-filter visitors: tenants/owners see only visitors to their floors
  const needsFilter = ['tenant_admin', 'tenant_employee', 'owner'].includes(user.role);
  const userFloors = user.floors || user.managed_floors || [];
  const isSoleProprietor = user.is_sole_proprietor || false;
  const scopedVisitors = (needsFilter && !(user.role === 'owner' && isSoleProprietor))
    ? mockVisitors.filter(v => userFloors.includes(v.destination_floor))
    : mockVisitors;

  const [visitors, setVisitors] = useState<Visitor[]>(scopedVisitors);

  const today = new Date().toISOString().split("T")[0];
  const todayVisitors = visitors.filter((v) => v.scheduled_at.startsWith("2026-03-09"));
  const scheduledVisitors = visitors.filter((v) => v.scheduled_at > "2026-03-09T23:59:59");
  const historyVisitors = visitors.filter((v) => v.status === "departed");

  const filteredVisitors = (list: Visitor[]) =>
    list.filter(
      (v) =>
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        v.company.toLowerCase().includes(search.toLowerCase()) ||
        v.destination_company.toLowerCase().includes(search.toLowerCase())
    );

  const getStatusSummary = () => {
    const waiting = todayVisitors.filter((v) => v.status === "waiting").length;
    const present = todayVisitors.filter((v) => v.status === "present").length;
    const scheduled = todayVisitors.filter((v) => v.status === "scheduled").length;
    const departed = todayVisitors.filter((v) => v.status === "departed").length;
    return { waiting, present, scheduled, departed };
  };

  const summary = getStatusSummary();

  const updateVisitorStatus = (id: string, newStatus: Visitor['status'], e?: React.MouseEvent) => {
    e?.stopPropagation();
    setVisitors(prev => prev.map(v => v.id === id ? { ...v, status: newStatus } : v));
    const labels: Record<string, string> = {
      present: 'Visitante liberado com sucesso!',
      denied: 'Acesso negado ao visitante.',
      departed: 'Saída registrada com sucesso!',
    };
    toast.success(labels[newStatus] || 'Status atualizado!');
  };

  const handleNotifyHost = (visitor: Visitor, e?: React.MouseEvent) => {
    e?.stopPropagation();
    toast.success(`Notificação enviada para o anfitrião ${visitor.host_name}!`);
  };

  const handleShowQr = (visitor: Visitor, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setQrDialogVisitor(visitor);
  };

  const VisitorCard = ({ visitor }: { visitor: Visitor }) => (
    <div
      className="bg-card rounded-2xl p-5 premium-shadow animate-fade-in hover:shadow-xl transition-all cursor-pointer border border-border/50"
      onClick={() => setSelectedVisitor(visitor)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full premium-gradient flex items-center justify-center text-sm font-bold text-primary-foreground shrink-0">
            {visitor.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{visitor.name}</h3>
            <p className="text-xs text-muted-foreground">{visitor.company}</p>
          </div>
        </div>
        <StatusBadge status={visitor.status} />
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{visitorTypeIcons[visitor.type]}</span>
          <span>{visitorTypeLabels[visitor.type]}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Shield size={12} />
          <span>
            {visitor.destination_company} — {visitor.destination_floor}º andar
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Users size={12} />
          <span>Anfitrião: {visitor.host_name}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock size={12} />
          <span>
            {new Date(visitor.scheduled_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>

      {/* Badges: Lib Automática + Recorrente on same line */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        {visitor.auto_release && (
          <span className="flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success whitespace-nowrap">
            <CheckCircle2 size={10} />
            Liberação Automática
          </span>
        )}
        {visitor.recurrent && (
          <span className="flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full bg-interactive/10 text-interactive whitespace-nowrap">
            <ArrowRightLeft size={10} />
            Recorrente
          </span>
        )}
      </div>

      <div className="flex gap-2 pt-2 border-t border-border/50">
        {visitor.status === "waiting" && (
          <>
            <Button size="sm" className="flex-1 gap-1 bg-success hover:bg-success/90 text-success-foreground text-xs" onClick={(e) => updateVisitorStatus(visitor.id, 'present', e)}>
              <CheckCircle2 size={12} />
              Liberar
            </Button>
            <Button size="sm" variant="destructive" className="flex-1 gap-1 text-xs" onClick={(e) => updateVisitorStatus(visitor.id, 'denied', e)}>
              <XCircle size={12} />
              Negar
            </Button>
            <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={(e) => handleNotifyHost(visitor, e)}>
              <Bell size={12} />
            </Button>
          </>
        )}
        {visitor.status === "scheduled" && (
          <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs" onClick={(e) => handleNotifyHost(visitor, e)}>
            <Bell size={12} />
            Avisar Anfitrião
          </Button>
        )}
        {visitor.status === "present" && (
          <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs" onClick={(e) => updateVisitorStatus(visitor.id, 'departed', e)}>
            <ArrowRightLeft size={12} />
            Registrar Saída
          </Button>
        )}
        <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={(e) => handleShowQr(visitor, e)}>
          <QrCode size={12} />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Visitantes</h1>
          <p className="text-sm text-muted-foreground">Controle de acesso e liberação de visitantes</p>
        </div>
        <Dialog open={showNewVisit} onOpenChange={setShowNewVisit}>
          <DialogTrigger asChild>
            <Button className="premium-gradient gap-2">
              <Plus size={16} />
              Nova Visita
            </Button>
          </DialogTrigger>
          <DialogContent className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Agendar Nova Visita</DialogTitle>
              <DialogDescription>Preencha os dados do visitante para pré-agendar o acesso.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Nome Completo</Label>
                  <Input placeholder="Nome do visitante" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Empresa</Label>
                  <Input placeholder="Empresa do visitante" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Documento (CPF/RG)</Label>
                  <Input placeholder="000.000.000-00" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tipo de Visitante</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="guest">Convidado</SelectItem>
                      <SelectItem value="service">Prestador de serviço</SelectItem>
                      <SelectItem value="delivery">Entregador</SelectItem>
                      <SelectItem value="client">Cliente</SelectItem>
                      <SelectItem value="candidate">Candidato</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Data</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Horário</Label>
                  <Input type="time" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Andar de Destino</Label>
                  <Input type="number" placeholder="5" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Empresa de Destino</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lux">Lux Energia (7º andar)</SelectItem>
                      <SelectItem value="capitale">Capitale (13º andar)</SelectItem>
                      <SelectItem value="youinc">You.inc (2º-4º andares)</SelectItem>
                      <SelectItem value="administradora">Administradora (Térreo)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Responsável Interno (Anfitrião)</Label>
                <Input placeholder="Nome do anfitrião" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Observações</Label>
                <Textarea placeholder="Informações adicionais..." rows={2} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Liberação Automática</p>
                  <p className="text-xs text-muted-foreground">Liberar catraca sem confirmação do anfitrião</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Visita Recorrente</p>
                  <p className="text-xs text-muted-foreground">Repetir nos mesmos dias da semana</p>
                </div>
                <Switch />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewVisit(false)}>Cancelar</Button>
              <Button className="premium-gradient" onClick={() => { setShowNewVisit(false); toast.success('Visita agendada com sucesso!'); }}>Agendar Visita</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Aguardando", value: summary.waiting, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: "🕐" },
          { label: "Presentes", value: summary.present, color: "bg-success/10 text-success", icon: "✅" },
          { label: "Agendados", value: summary.scheduled, color: "bg-interactive/10 text-interactive", icon: "📅" },
          { label: "Saíram", value: summary.departed, color: "bg-muted text-muted-foreground", icon: "🚪" },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-2xl p-4 premium-shadow">
            <div className="flex items-center justify-between mb-1">
              <span className="text-2xl">{s.icon}</span>
              <span className={`text-2xl font-bold`}>{s.value}</span>
            </div>
            <p className="text-xs text-muted-foreground">{s.label} Hoje</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, empresa ou destino..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="today">📍 Hoje ({todayVisitors.length})</TabsTrigger>
          <TabsTrigger value="scheduled">📅 Agendados ({scheduledVisitors.length})</TabsTrigger>
          <TabsTrigger value="history">📋 Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVisitors(todayVisitors).map((v) => (
              <VisitorCard key={v.id} visitor={v} />
            ))}
          </div>
          {filteredVisitors(todayVisitors).length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Users size={40} className="mx-auto mb-3 opacity-30" />
              <p>Nenhum visitante hoje</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="scheduled" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVisitors(scheduledVisitors).map((v) => (
              <VisitorCard key={v.id} visitor={v} />
            ))}
          </div>
          {filteredVisitors(scheduledVisitors).length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Users size={40} className="mx-auto mb-3 opacity-30" />
              <p>Nenhuma visita agendada</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {filteredVisitors(historyVisitors).map((v) => (
              <div key={v.id} className="bg-card rounded-xl p-4 border border-border/50 space-y-2" onClick={() => setSelectedVisitor(v)}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">{v.name}</span>
                  <StatusBadge status={v.status} />
                </div>
                <p className="text-xs text-muted-foreground">{v.company} → {v.destination_company} — {v.destination_floor}º</p>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span>{visitorTypeIcons[v.type]} {visitorTypeLabels[v.type]}</span>
                  <span>🕐 {v.checked_in_at ? new Date(v.checked_in_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "—"}</span>
                </div>
              </div>
            ))}
          </div>
          {/* Desktop table */}
          <div className="hidden sm:block bg-card rounded-2xl premium-shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Visitante</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Empresa</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">Destino</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Entrada</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">Saída</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground uppercase hidden lg:table-cell">Tipo</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVisitors(historyVisitors).map((v, i) => (
                    <tr key={v.id} className={`border-b border-border/50 hover:bg-muted/30 cursor-pointer ${i % 2 === 1 ? "bg-muted/10" : ""}`} onClick={() => setSelectedVisitor(v)}>
                      <td className="px-5 py-3 text-sm font-medium">{v.name}</td>
                      <td className="px-5 py-3 text-sm text-muted-foreground">{v.company}</td>
                      <td className="px-5 py-3 text-sm text-muted-foreground hidden md:table-cell">{v.destination_company} — {v.destination_floor}º</td>
                      <td className="px-5 py-3 text-sm text-muted-foreground">
                        {v.checked_in_at ? new Date(v.checked_in_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "—"}
                      </td>
                      <td className="px-5 py-3 text-sm text-muted-foreground hidden md:table-cell">
                        {v.checked_out_at ? new Date(v.checked_out_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "—"}
                      </td>
                      <td className="px-5 py-3 text-center text-sm hidden lg:table-cell">{visitorTypeIcons[v.type]} {visitorTypeLabels[v.type]}</td>
                      <td className="px-5 py-3 text-center"><StatusBadge status={v.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Visitor Detail Dialog */}
      <Dialog open={!!selectedVisitor} onOpenChange={() => setSelectedVisitor(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes do Visitante</DialogTitle>
            <DialogDescription>Informações completas sobre a visita.</DialogDescription>
          </DialogHeader>
          {selectedVisitor && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full premium-gradient flex items-center justify-center text-lg font-bold text-primary-foreground">
                  {selectedVisitor.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{selectedVisitor.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedVisitor.company}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge status={selectedVisitor.status} />
                    <span className="text-xs text-muted-foreground">{visitorTypeLabels[selectedVisitor.type]}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Documento</p>
                  <p className="font-medium">{selectedVisitor.document}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Destino</p>
                  <p className="font-medium">{selectedVisitor.destination_company}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Andar</p>
                  <p className="font-medium">{selectedVisitor.destination_floor}º andar</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Anfitrião</p>
                  <p className="font-medium">{selectedVisitor.host_name}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Horário Previsto</p>
                  <p className="font-medium">{new Date(selectedVisitor.scheduled_at).toLocaleString("pt-BR")}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Check-in</p>
                  <p className="font-medium">{selectedVisitor.checked_in_at ? new Date(selectedVisitor.checked_in_at).toLocaleTimeString("pt-BR") : "—"}</p>
                </div>
              </div>

              {/* QR Code placeholder */}
              <div className="flex flex-col items-center p-4 bg-muted/20 rounded-xl border border-dashed border-border">
                <QrCode size={64} className="text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">QR Code: {selectedVisitor.qr_code}</p>
              </div>

              <div className="flex gap-2">
                {selectedVisitor.status === "waiting" && (
                  <>
                    <Button className="flex-1 bg-success hover:bg-success/90 text-success-foreground gap-1" onClick={() => { updateVisitorStatus(selectedVisitor.id, 'present'); setSelectedVisitor(null); }}>
                      <CheckCircle2 size={14} />
                      Liberar Entrada
                    </Button>
                    <Button variant="destructive" className="flex-1 gap-1" onClick={() => { updateVisitorStatus(selectedVisitor.id, 'denied'); setSelectedVisitor(null); }}>
                      <XCircle size={14} />
                      Negar
                    </Button>
                  </>
                )}
                {selectedVisitor.status === "present" && (
                  <Button variant="outline" className="flex-1 gap-1" onClick={() => { updateVisitorStatus(selectedVisitor.id, 'departed'); setSelectedVisitor(null); }}>
                    <ArrowRightLeft size={14} />
                    Registrar Saída
                  </Button>
                )}
                {selectedVisitor.status === "scheduled" && (
                  <Button variant="outline" className="flex-1 gap-1" onClick={() => { handleNotifyHost(selectedVisitor); setSelectedVisitor(null); }}>
                    <Bell size={14} />
                    Avisar Anfitrião
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={!!qrDialogVisitor} onOpenChange={() => setQrDialogVisitor(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>QR Code do Visitante</DialogTitle>
            <DialogDescription>{qrDialogVisitor?.name}</DialogDescription>
          </DialogHeader>
          {qrDialogVisitor && (
            <div className="flex flex-col items-center py-6">
              <div className="w-48 h-48 bg-muted/20 rounded-xl border-2 border-dashed border-border flex items-center justify-center">
                <QrCode size={96} className="text-foreground" />
              </div>
              <p className="text-sm font-mono text-muted-foreground mt-3">{qrDialogVisitor.qr_code}</p>
              <p className="text-xs text-muted-foreground mt-1">{qrDialogVisitor.destination_company} — {qrDialogVisitor.destination_floor}º andar</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Visitantes;
