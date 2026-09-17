import { useMemo, useState } from "react";
import { CalendarEvent, CalendarEventType, EVENT_TYPE_CONFIG } from "@/constants/calendar/eventTypeConfig";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Building2 } from "lucide-react";

interface Props {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (e: CalendarEvent) => void;
}

const AgendaView = ({ currentDate, events, onEventClick }: Props) => {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('30');

  const filteredEvents = useMemo(() => {
    let filtered = [...events];
    if (typeFilter !== 'all') filtered = filtered.filter(e => e.event_type === typeFilter);
    if (statusFilter !== 'all') filtered = filtered.filter(e => e.status === statusFilter);
    
    // Period filter
    const days = parseInt(periodFilter);
    if (!isNaN(days)) {
      const now = new Date(currentDate);
      const limit = new Date(now.getTime() + days * 86400000);
      filtered = filtered.filter(e => {
        const d = new Date(e.start_at);
        return d >= now && d <= limit;
      });
    }

    return filtered.sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
  }, [events, typeFilter, statusFilter, periodFilter, currentDate]);

  const grouped = useMemo(() => {
    const groups: Record<string, CalendarEvent[]> = {};
    filteredEvents.forEach(ev => {
      const dateKey = ev.start_at.split('T')[0];
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(ev);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredEvents]);

  const today = new Date().toISOString().split('T')[0];

  const statusLabels: Record<string, string> = {
    scheduled: 'Agendado', confirmed: 'Confirmado', in_progress: 'Em Andamento',
    completed: 'Concluído', cancelled: 'Cancelado',
  };

  const statusColors: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-700', confirmed: 'bg-emerald-100 text-emerald-700',
    in_progress: 'bg-amber-100 text-amber-700', completed: 'bg-slate-100 text-slate-600',
    cancelled: 'bg-red-100 text-red-600',
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <Select value={periodFilter} onValueChange={setPeriodFilter}>
          <SelectTrigger className="w-[150px] h-8 text-xs">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30">Próximos 30 dias</SelectItem>
            <SelectItem value="60">Próximos 60 dias</SelectItem>
            <SelectItem value="90">Próximos 90 dias</SelectItem>
            <SelectItem value="all">Todos</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px] h-8 text-xs">
            <SelectValue placeholder="Todos os tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {Object.entries(EVENT_TYPE_CONFIG).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>{cfg.emoji} {cfg.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] h-8 text-xs">
            <SelectValue placeholder="Todos os status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(statusLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">
          {filteredEvents.length} eventos
        </span>
      </div>

      <div className="space-y-6">
        {grouped.map(([dateKey, dayEvents]) => {
          const date = new Date(dateKey + 'T12:00:00');
          const isT = dateKey === today;
          const dayName = date.toLocaleDateString('pt-BR', { weekday: 'long' });
          const dayLabel = date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

          return (
            <div key={dateKey}>
              <div className="flex items-center gap-2 mb-3">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                  isT ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                )}>
                  {date.getDate()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground capitalize">{dayName}</p>
                  <p className="text-[11px] text-muted-foreground">{dayLabel}</p>
                </div>
                {isT && <Badge variant="secondary" className="text-[10px]">Hoje</Badge>}
              </div>

              <div className="space-y-2 pl-4 sm:pl-10">
                {dayEvents.map(ev => {
                  const cfg = EVENT_TYPE_CONFIG[ev.event_type];
                  const time = ev.is_all_day
                    ? 'Dia inteiro'
                    : new Date(ev.start_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) +
                      (ev.end_at ? ` – ${new Date(ev.end_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : '');

                  return (
                    <button
                      key={ev.id}
                      onClick={() => onEventClick(ev)}
                      className={cn(
                        "w-full text-left bg-card rounded-xl border p-4 hover:shadow-md transition-shadow cursor-pointer",
                        "border-l-[3px]"
                      )}
                      style={{ borderLeftColor: `var(--${cfg.pillText.replace('text-', '')}, currentColor)` }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold", cfg.pillBg, cfg.pillText)}>
                              {cfg.emoji} {cfg.label}
                            </span>
                            <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium", statusColors[ev.status])}>
                              {statusLabels[ev.status]}
                            </span>
                            {ev.autoGenerated && (
                              <Badge variant="secondary" className="text-[9px] bg-blue-50 text-blue-600">🤖 Auto</Badge>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-foreground truncate">{ev.title}</p>
                          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1"><Calendar size={11} /> {time}</span>
                            {ev.location && <span className="flex items-center gap-1"><MapPin size={11} /> {ev.location}</span>}
                            {ev.building_name && <span className="flex items-center gap-1"><Building2 size={11} /> {ev.building_name}</span>}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {grouped.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhum evento encontrado para os filtros selecionados.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgendaView;
