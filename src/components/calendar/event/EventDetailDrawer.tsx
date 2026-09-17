import { useState } from "react";
import { CalendarEvent, EVENT_TYPE_CONFIG, exportToGoogle, exportToOutlook, downloadICS, Participant } from "@/constants/calendar/eventTypeConfig";
import { UserRole } from "@/lib/mock-data";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Building2, Edit, Trash2, Download, Mail, X, Plus, Search, Bell, Repeat, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { mockContacts } from "@/lib/contacts-data";

interface Props {
  event: CalendarEvent | null;
  open: boolean;
  onClose: () => void;
  onEdit: (e: CalendarEvent) => void;
  onDelete: (id: string) => void;
  onUpdateParticipants?: (id: string, participants: Participant[]) => void;
  userRole: UserRole;
}

const EventDetailDrawer = ({ event, open, onClose, onEdit, onDelete, onUpdateParticipants, userRole }: Props) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [inviteSearch, setInviteSearch] = useState('');
  const [showInvitePopover, setShowInvitePopover] = useState(false);

  if (!event) return null;

  const cfg = EVENT_TYPE_CONFIG[event.event_type];

  const statusLabels: Record<string, string> = {
    scheduled: 'Agendado', confirmed: 'Confirmado', in_progress: 'Em Andamento',
    completed: 'Concluído', cancelled: 'Cancelado',
  };
  const statusColors: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-700', confirmed: 'bg-emerald-100 text-emerald-700',
    in_progress: 'bg-amber-100 text-amber-700', completed: 'bg-slate-100 text-slate-600',
    cancelled: 'bg-red-100 text-red-600',
  };

  const priorityLabels: Record<string, string> = { normal: 'Normal', high: 'Alta', urgent: 'Urgente' };
  const priorityColors: Record<string, string> = { normal: 'bg-slate-100 text-slate-600', high: 'bg-orange-100 text-orange-700', urgent: 'bg-red-100 text-red-700' };

  const reminderLabels: Record<string, string> = { none: 'Sem lembrete', '15min': '15 min antes', '1h': '1 hora antes', '1d': '1 dia antes', '1w': '1 semana antes' };
  const recurrenceLabels: Record<string, string> = { none: 'Não repete', daily: 'Diariamente', weekly: 'Semanalmente', monthly: 'Mensalmente', yearly: 'Anualmente' };

  const time = event.is_all_day
    ? 'Dia inteiro'
    : new Date(event.start_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) +
      (event.end_at ? ` – ${new Date(event.end_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : '');

  const dateLabel = new Date(event.start_at).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // Duration
  let duration = '';
  if (!event.is_all_day && event.end_at) {
    const diff = (new Date(event.end_at).getTime() - new Date(event.start_at).getTime()) / 3600000;
    duration = diff >= 1 ? `(${Math.round(diff)}h)` : `(${Math.round(diff * 60)}min)`;
  }

  const handleExportICS = () => {
    downloadICS([event], `${event.title.replace(/\s+/g, '_')}.ics`);
    toast.success('Arquivo .ics baixado');
  };

  const handleSendInvite = () => {
    const participants = event.participants || [];
    if (participants.length === 0) {
      toast.error('Adicione participantes antes de enviar convites');
      return;
    }
    const emails = participants.map(p => p.email).join(',');
    const subject = encodeURIComponent(`Convite: ${event.title} — LUXCondo`);
    const body = encodeURIComponent(
      `Você foi convidado para o evento:\n\n${event.title}\nData: ${dateLabel}\nHorário: ${time}\nLocal: ${event.location || 'Não definido'}\n\nDescrição: ${event.description || '-'}\n\nAcesse o LUXCondo para mais detalhes.`
    );
    window.open(`mailto:${emails}?subject=${subject}&body=${body}`, '_self');
    toast.success(`Cliente de e-mail aberto com convite para ${participants.length} participante(s)`);
  };

  const handleAddParticipant = (contact: { name: string; email: string }) => {
    const current = event.participants || [];
    if (current.some(p => p.email === contact.email)) return;
    const updated = [...current, { name: contact.name, email: contact.email, type: 'contact' as const }];
    onUpdateParticipants?.(event.id, updated);
    setInviteSearch('');
    setShowInvitePopover(false);
    toast.success(`${contact.name} adicionado`);
  };

  const filteredContacts = mockContacts.filter(c =>
    c.isActive && (c.name.toLowerCase().includes(inviteSearch.toLowerCase()) || c.email.toLowerCase().includes(inviteSearch.toLowerCase()))
  );

  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="center" className="overflow-y-auto">
          <SheetHeader>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{cfg.emoji}</span>
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-lg leading-tight">{event.title}</SheetTitle>
                <p className="text-xs text-muted-foreground capitalize">{dateLabel}</p>
              </div>
            </div>
          </SheetHeader>

          <div className="space-y-5 mt-6">
            {/* Badges */}
            <div className="flex flex-wrap gap-1.5">
              <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", cfg.pillBg, cfg.pillText)}>
                {cfg.label}
              </span>
              <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", statusColors[event.status])}>
                {statusLabels[event.status]}
              </span>
              {event.building_name && (
                <Badge variant="outline" className="text-[10px]">{event.building_name}</Badge>
              )}
              {event.autoGenerated && (
                <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-600" title={`Auto-gerado a partir de ${event.sourceModule || 'sistema'}`}>
                  🤖 Auto-gerado
                </Badge>
              )}
              {event.priority && event.priority !== 'normal' && (
                <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", priorityColors[event.priority])}>
                  {event.priority === 'urgent' ? '🚨' : '⚠️'} {priorityLabels[event.priority]}
                </span>
              )}
            </div>

            {/* Details card */}
            <div className="bg-muted/50 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <Calendar size={16} className="text-muted-foreground shrink-0" />
                <div>
                  <p className="font-medium capitalize">{dateLabel}</p>
                  <p className="text-xs text-muted-foreground">⏰ {time} {duration}</p>
                </div>
              </div>
              {event.location && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin size={16} className="text-muted-foreground shrink-0" />
                  <p>{event.location}</p>
                </div>
              )}
              {event.building_name && (
                <div className="flex items-center gap-3 text-sm">
                  <Building2 size={16} className="text-muted-foreground shrink-0" />
                  <p>{event.building_name}</p>
                </div>
              )}
              {event.reminder && event.reminder !== 'none' && (
                <div className="flex items-center gap-3 text-sm">
                  <Bell size={16} className="text-muted-foreground shrink-0" />
                  <p className="text-xs">{reminderLabels[event.reminder]}</p>
                </div>
              )}
              {event.recurrence && event.recurrence !== 'none' && (
                <div className="flex items-center gap-3 text-sm">
                  <Repeat size={16} className="text-muted-foreground shrink-0" />
                  <p className="text-xs">{recurrenceLabels[event.recurrence]}</p>
                </div>
              )}
            </div>

            {/* Participants */}
            {((event.participants && event.participants.length > 0) || true) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">
                    Participantes ({event.participants?.length || 0})
                  </p>
                  <Popover open={showInvitePopover} onOpenChange={setShowInvitePopover}>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 text-xs gap-1">
                        <Plus size={12} /> Convidar
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-3" align="end">
                      <div className="space-y-2">
                        <div className="relative">
                          <Search size={14} className="absolute left-2 top-2.5 text-muted-foreground" />
                          <Input
                            placeholder="Buscar contato..."
                            value={inviteSearch}
                            onChange={e => setInviteSearch(e.target.value)}
                            className="pl-7 h-8 text-xs"
                          />
                        </div>
                        <div className="max-h-40 overflow-y-auto space-y-1">
                          {filteredContacts.slice(0, 8).map(c => (
                            <button
                              key={c.id}
                              onClick={() => handleAddParticipant({ name: c.name, email: c.email })}
                              className="w-full text-left px-2 py-1.5 rounded text-xs hover:bg-muted transition-colors"
                            >
                              <p className="font-medium">{c.name}</p>
                              <p className="text-[10px] text-muted-foreground">{c.email}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                {event.participants && event.participants.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {event.participants.map((p, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-xs">
                        👤 {p.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Nenhum participante adicionado</p>
                )}
              </div>
            )}

            {/* Description */}
            {event.description && (
              <div className={cn("rounded-xl p-4 border", cfg.pillBg)}>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Notas / Descrição</p>
                <p className="text-sm leading-relaxed">{event.description}</p>
              </div>
            )}

            {/* Sync status */}
            <div className="bg-muted/50 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Sincronização</p>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Vinci Compass</span>
                <Badge variant="outline" className="text-[9px] ml-auto">Sincronizado</Badge>
              </div>
            </div>

            {/* Action buttons - always visible for all roles */}
            {event.status !== 'cancelled' && (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button variant="outline" className="gap-1.5 text-xs" onClick={() => onEdit(event)}>
                  <Edit size={14} /> Editar
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-1.5 text-xs">
                      <Download size={14} /> Exportar
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => exportToGoogle(event)}>
                      📅 Google Calendar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportToOutlook(event)}>
                      📆 Outlook (Web)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportICS}>
                      🍎 Apple Calendar (.ics)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportICS}>
                      📄 Baixar .ics
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" className="gap-1.5 text-xs" onClick={handleSendInvite}>
                  <Mail size={14} /> Convidar
                </Button>
                <Button
                  variant="outline"
                  className="gap-1.5 text-xs text-destructive hover:text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 size={14} /> Excluir
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir evento</AlertDialogTitle>
            <AlertDialogDescription>
              Excluir evento "{event.title}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                onDelete(event.id);
                setShowDeleteDialog(false);
                onClose();
                toast.success('Evento excluído');
              }}
            >
              Excluir Evento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EventDetailDrawer;
