import { useState, useCallback, useMemo, useEffect } from "react";
import { Search, Plus, List, LayoutGrid, MessageSquare, Paperclip, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StatusBadge from "@/components/StatusBadge";
import TicketDrawer from "@/components/TicketDrawer";
import ContactGroupSelector from "@/components/ContactGroupSelector";
import NewTicketDialog from "@/components/NewTicketDialog";
import { mockTickets, Ticket } from "@/lib/mock-data";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useApp } from "@/contexts/AppContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  DndContext, DragOverlay, closestCorners, PointerSensor, TouchSensor,
  useSensor, useSensors, type DragStartEvent, type DragEndEvent, type DragOverEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const categoryIcons: Record<string, string> = {
  'Limpeza e Higiene': '🧹', 'Manutenção Corretiva': '🔧', 'Climatização': '❄️',
  'Elétrica': '⚡', 'Hidráulica': '💧', 'Segurança': '🔒', 'Controle de Acesso': '🚪',
  'Elevadores': '🛗', 'Facilities Gerais': '📋', 'Manutenção Preventiva': '🔩',
  'Eficiência Energética': '💡', 'Estacionamento': '🅿️',
};

// ── Quick Notify Popover ──
function QuickNotifyPopover({ ticketId }: { ticketId: string }) {
  const { t } = useLanguage();
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [contactIds, setContactIds] = useState<string[]>([]);
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold">📧 {t('chamados.notifyAbout')}</p>
      <ContactGroupSelector selectedGroupIds={groupIds} selectedContactIds={contactIds} onGroupsChange={setGroupIds} onContactsChange={setContactIds} />
      <Button size="sm" className="w-full premium-gradient" onClick={() => { toast.success(`${t('chamados.notificationSent')} ${ticketId}`); }}>
        {t('chamados.sendNotification')}
      </Button>
    </div>
  );
}

// ── Sortable Card ──
function SortableTicketCard({ ticket, onClick, getSlaColor, getSlaPercent }: {
  ticket: Ticket; onClick: () => void;
  getSlaColor: (t: Ticket) => string; getSlaPercent: (t: Ticket) => number;
}) {
  const { t } = useLanguage();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: ticket.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}
      className="group bg-card rounded-xl p-4 shadow-sm border border-border/40 cursor-grab active:cursor-grabbing hover:shadow-lg transition-all min-h-[120px]"
      onClick={(e) => { if (!isDragging) onClick(); }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono text-muted-foreground">{ticket.id}</span>
        <StatusBadge status={ticket.priority} type="priority" />
      </div>
      <p className="text-sm font-medium text-foreground mb-2 line-clamp-2">{ticket.title}</p>
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-xs">{categoryIcons[ticket.category] || '📋'}</span>
        <span className="text-xs text-muted-foreground">{ticket.category}</span>
      </div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">{ticket.requester}</span>
        <span className="text-xs text-muted-foreground">{ticket.floor > 0 ? `${ticket.floor}º` : t('chamados.common')}</span>
      </div>
      <div className="flex items-center gap-1.5 mb-2">
        {ticket.assigned_to ? (
          <>
            <div className="w-5 h-5 rounded-full bg-interactive/20 flex items-center justify-center text-[10px] font-bold text-interactive">
              {ticket.assigned_to[0]}
            </div>
            <span className="text-xs text-muted-foreground truncate">{ticket.assigned_to}</span>
          </>
        ) : (
          <span className="text-xs text-destructive font-medium">{t('chamados.notAssigned')}</span>
        )}
      </div>
      <div className="h-1 bg-muted rounded-full overflow-hidden mb-2">
        <div className={`h-full rounded-full ${getSlaColor(ticket)}`} style={{ width: `${getSlaPercent(ticket)}%` }} />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {ticket.comments_count > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-muted-foreground"><MessageSquare size={10} /> {ticket.comments_count}</span>
          )}
          {ticket.attachments_count > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-muted-foreground"><Paperclip size={10} /> {ticket.attachments_count}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <button
                aria-label="Notificar contatos"
                className="mobile-touch flex items-center justify-center rounded hover:bg-interactive/10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                onClick={e => e.stopPropagation()}
                onPointerDown={e => e.stopPropagation()}
              >
                <Mail size={12} className="text-interactive" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80" onClick={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}>
              <QuickNotifyPopover ticketId={ticket.id} />
            </PopoverContent>
          </Popover>
          <span className="text-[10px] text-muted-foreground">{new Date(ticket.created_at).toLocaleDateString('pt-BR')}</span>
        </div>
      </div>
    </div>
  );
}

// ── Droppable Column ──
function KanbanColumn({ col, tickets, children }: { col: { key: string; label: string; color: string; bg: string }; tickets: Ticket[]; children: React.ReactNode }) {
  const { t } = useLanguage();
  const { setNodeRef, isOver } = useDroppable({ id: col.key });
  return (
    <div className="min-w-0 w-full sm:min-w-[280px] sm:max-w-[320px] flex flex-col shrink-0">
      <div className={`flex items-center gap-2 mb-3 pb-2 border-b-2 ${col.color}`}>
        <h3 className="text-xs font-semibold text-foreground whitespace-nowrap">{col.label}</h3>
        <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">{tickets.length}</span>
      </div>
      <div ref={setNodeRef}
        className={`flex-1 min-h-[200px] space-y-3 p-1 rounded-lg transition-colors ${isOver ? `border-2 border-dashed ${col.color} ${col.bg}` : 'border-2 border-transparent'}`}
        style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}
      >
        {children}
        {tickets.length === 0 && !isOver && (
          <div className="flex items-center justify-center h-[160px] border-2 border-dashed border-muted rounded-lg text-muted-foreground text-xs">
            {t('chamados.dragHere')}
          </div>
        )}
      </div>
    </div>
  );
}

const Chamados = () => {
  const { user } = useApp();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const initialFilter = searchParams.get('status') || '';
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [statusFilter, setStatusFilter] = useState(initialFilter);

  const columns = useMemo(() => [
    { key: "open", label: `🔴 ${t('chamados.open')}`, color: "border-destructive", bg: "bg-destructive/5" },
    { key: "in_analysis", label: `🟡 ${t('chamados.inAnalysis')}`, color: "border-amber-500", bg: "bg-amber-500/5" },
    { key: "in_progress", label: `🔵 ${t('chamados.inProgress')}`, color: "border-interactive", bg: "bg-interactive/5" },
    { key: "awaiting_approval", label: `🟣 ${t('chamados.awaitingApproval')}`, color: "border-hover", bg: "bg-hover/5" },
    { key: "completed", label: `🟢 ${t('chamados.completed')}`, color: "border-success", bg: "bg-success/5" },
    { key: "cancelled", label: `⚫ ${t('chamados.cancelled')}`, color: "border-muted-foreground", bg: "bg-muted/10" },
  ], [t]);

  // Scope-filter tickets: tenants/owners see only their floors + common areas (floor <= 0)
  const scopedTickets = useMemo(() => {
    const needsFilter = ['tenant_admin', 'tenant_employee', 'owner'].includes(user.role);
    if (!needsFilter) return mockTickets;
    const userFloors = user.floors || user.managed_floors || [];
    const isSoleProprietor = user.is_sole_proprietor || false;
    if (user.role === 'owner' && isSoleProprietor) return mockTickets;
    if (user.role === 'vendor') return mockTickets.filter(t => t.vendor_id && t.requester === user.company);
    return mockTickets.filter(t => userFloors.includes(t.floor) || t.floor <= 0);
  }, [user]);

  const [tickets, setTickets] = useState<Ticket[]>(scopedTickets);

  // Persist tickets (com fotos) em localStorage para sobreviverem à navegação/reload.
  const STORAGE_KEY = "luxcondo:tickets:v1";
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const stored = JSON.parse(raw) as Ticket[];
        // Merge: chamados armazenados têm prioridade, sobrepostos por id
        const map = new Map<string, Ticket>();
        scopedTickets.forEach((t) => map.set(t.id, t));
        stored.forEach((t) => map.set(t.id, t));
        setTickets(Array.from(map.values()));
      }
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
    } catch { /* quota */ }
  }, [tickets]);

  const handleUpdateTicketPhotos = (ticketId: string, photos: string[]) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== ticketId) return t;
        const prevCount = t.photos?.length ?? 0;
        const diff = photos.length - prevCount;
        const newEvents = diff !== 0 ? [{
          id: `e-${Date.now()}`,
          type: "attachment" as const,
          description: diff > 0
            ? `Anexou ${diff} foto${diff > 1 ? "s" : ""}`
            : `Removeu ${Math.abs(diff)} foto${Math.abs(diff) > 1 ? "s" : ""}`,
          author: user.full_name,
          created_at: new Date().toISOString(),
        }] : [];
        return {
          ...t,
          photos,
          attachments_count: photos.length,
          timeline: [...t.timeline, ...newEvents],
        };
      })
    );
    setSelectedTicket((prev) => (prev && prev.id === ticketId
      ? { ...prev, photos, attachments_count: photos.length }
      : prev));
  };
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showNewTicket, setShowNewTicket] = useState(false);

  const [pendingMove, setPendingMove] = useState<{ ticketId: string; newStatus: string } | null>(null);
  const [moveNote, setMoveNote] = useState("");
  const [autoConfirmProgress, setAutoConfirmProgress] = useState(0);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const filteredTickets = tickets.filter(t => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !t.id.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter && t.status !== statusFilter) return false;
    return true;
  });

  const getSlaColor = (ticket: Ticket) => {
    const deadline = new Date(ticket.sla_deadline);
    const created = new Date(ticket.created_at);
    const now = new Date();
    const total = deadline.getTime() - created.getTime();
    const elapsed = now.getTime() - created.getTime();
    const pct = (elapsed / total) * 100;
    if (now > deadline) return 'bg-foreground';
    if (pct > 80) return 'bg-destructive';
    if (pct > 50) return 'bg-amber-500';
    return 'bg-success';
  };

  const getSlaPercent = (ticket: Ticket) => {
    const deadline = new Date(ticket.sla_deadline);
    const created = new Date(ticket.created_at);
    const now = new Date();
    const total = deadline.getTime() - created.getTime();
    const elapsed = now.getTime() - created.getTime();
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  };

  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string);
  const handleDragCancel = () => setActiveId(null);

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const ticketId = active.id as string;
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;
    const targetColumn = columns.find(c => c.key === over.id);
    if (!targetColumn || targetColumn.key === ticket.status) return;
    setPendingMove({ ticketId, newStatus: targetColumn.key });
    setMoveNote("");
    setAutoConfirmProgress(0);
    let start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / 5000) * 100);
      setAutoConfirmProgress(pct);
      if (elapsed >= 5000) {
        clearInterval(interval);
        confirmMove(ticketId, targetColumn.key);
      }
    }, 50);
    (window as any).__kanbanAutoConfirmInterval = interval;
  };

  const confirmMove = useCallback((ticketId?: string, newStatus?: string) => {
    const move = pendingMove || (ticketId && newStatus ? { ticketId, newStatus } : null);
    if (!move) return;
    clearInterval((window as any).__kanbanAutoConfirmInterval);
    setTickets(prev => prev.map(t => t.id === move.ticketId ? { ...t, status: move.newStatus as any } : t));
    setPendingMove(null);
  }, [pendingMove]);

  const cancelMove = () => {
    clearInterval((window as any).__kanbanAutoConfirmInterval);
    setPendingMove(null);
  };

  const activeTicket = activeId ? tickets.find(t => t.id === activeId) : null;
  const pendingColLabel = pendingMove ? columns.find(c => c.key === pendingMove.newStatus)?.label : '';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">{t('chamados.title')}</h1>
          <p className="text-sm text-muted-foreground">{tickets.length} {t('chamados.totalTickets')}</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-muted rounded-lg p-0.5">
            <button onClick={() => setView("kanban")} className={`p-2 rounded-md transition-colors ${view === "kanban" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}><LayoutGrid size={16} /></button>
            <button onClick={() => setView("list")} className={`p-2 rounded-md transition-colors ${view === "list" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}><List size={16} /></button>
          </div>
          <Button className="premium-gradient gap-2 h-11 sm:h-10" onClick={() => setShowNewTicket(true)}><Plus size={16} />{t('common.new')}</Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={t('chamados.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-nowrap sm:overflow-x-auto sm:pb-1">
          <button onClick={() => setStatusFilter('')} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap flex-shrink-0 ${!statusFilter ? 'bg-interactive text-interactive-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>{t('common.all')}</button>
          {columns.slice(0, 5).map(col => (
            <button key={col.key} onClick={() => setStatusFilter(col.key)} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap flex-shrink-0 ${statusFilter === col.key ? 'bg-interactive text-interactive-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
              {col.label.split(' ').slice(1).join(' ')}
            </button>
          ))}
        </div>
      </div>

      {view === "kanban" ? (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
          <div className="mobile-stack-kanban flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory sm:-mx-0 sm:px-0">
            {columns.map((col) => {
              const colTickets = filteredTickets.filter((t) => t.status === col.key);
              return (
                <KanbanColumn key={col.key} col={col} tickets={colTickets}>
                  <SortableContext items={colTickets.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {colTickets.map((ticket) => (
                      <SortableTicketCard key={ticket.id} ticket={ticket} getSlaColor={getSlaColor} getSlaPercent={getSlaPercent}
                        onClick={() => setSelectedTicket(ticket)} />
                    ))}
                  </SortableContext>
                </KanbanColumn>
              );
            })}
          </div>
          <DragOverlay>
            {activeTicket && (
              <div className="bg-card rounded-xl p-4 shadow-2xl border border-interactive/40 rotate-2 min-h-[120px] w-[300px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-muted-foreground">{activeTicket.id}</span>
                  <StatusBadge status={activeTicket.priority} type="priority" />
                </div>
                <p className="text-sm font-medium text-foreground mb-2">{activeTicket.title}</p>
                <span className="text-xs text-muted-foreground">{activeTicket.requester}</span>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      ) : (
        <div>
          {/* Mobile card view */}
          <div className="sm:hidden space-y-3">
            {filteredTickets.map(t => (
              <div key={t.id} className="bg-card rounded-xl p-3 border border-border/40 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedTicket(t)}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono text-muted-foreground">{t.id}</span>
                  <StatusBadge status={t.priority} type="priority" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1 line-clamp-2">{t.title}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{t.requester}</span>
                  <StatusBadge status={t.status} />
                </div>
              </div>
            ))}
          </div>
          {/* Desktop table */}
          <div className="hidden sm:block bg-card rounded-2xl shadow-sm border border-border/40 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">ID</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">{t('common.name')}</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">{t('common.category')}</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase hidden lg:table-cell">{t('chamados.requester')}</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">{t('common.priority')}</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">{t('common.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((t, i) => (
                    <tr key={t.id} className={`border-b border-border/50 last:border-0 hover:bg-muted/30 cursor-pointer ${i % 2 === 1 ? "bg-muted/10" : ""}`}
                      onClick={() => setSelectedTicket(t)}>
                      <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{t.id}</td>
                      <td className="px-4 py-3 text-sm font-medium text-foreground">{t.title}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{categoryIcons[t.category] || ''} {t.category}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">{t.requester}</td>
                      <td className="px-4 py-3 text-center"><StatusBadge status={t.priority} type="priority" /></td>
                      <td className="px-4 py-3 text-center"><StatusBadge status={t.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmação de mudança de status */}
      <Dialog open={!!pendingMove} onOpenChange={(open) => { if (!open) cancelMove(); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">{pendingColLabel}?</DialogTitle>
          </DialogHeader>
          <Textarea placeholder={t('common.observations') + '...'} value={moveNote} onChange={e => setMoveNote(e.target.value)} className="min-h-[60px] text-sm" />
          <Progress value={autoConfirmProgress} className="h-1" />
          <p className="text-[10px] text-muted-foreground text-center">{Math.max(0, Math.ceil((100 - autoConfirmProgress) / 20))}s</p>
          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={cancelMove}>{t('common.cancel')}</Button>
            <Button size="sm" onClick={() => confirmMove()}>{t('common.confirm')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TicketDrawer
        ticket={selectedTicket}
        open={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        onUpdatePhotos={handleUpdateTicketPhotos}
      />
      <NewTicketDialog
        open={showNewTicket}
        onClose={() => setShowNewTicket(false)}
        onCreated={(ticket) => setTickets(prev => [ticket, ...prev])}
      />
    </div>
  );
};

export default Chamados;
