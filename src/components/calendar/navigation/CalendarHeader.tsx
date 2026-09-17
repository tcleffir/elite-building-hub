import { ChevronLeft, ChevronRight, Plus, Download, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { CalendarEvent, CalendarEventType, EVENT_TYPE_CONFIG, downloadICS } from "@/constants/calendar/eventTypeConfig";
import { CalendarViewType } from "@/pages/CalendarPage";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useMemo } from "react";

interface Props {
  currentDate: Date;
  view: CalendarViewType;
  onViewChange: (v: CalendarViewType) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  activeFilters: CalendarEventType[];
  onToggleFilter: (t: CalendarEventType) => void;
  canCreate: boolean;
  onNewEvent: () => void;
  events: CalendarEvent[];
  showAgendaPanel: boolean;
  onToggleAgendaPanel: () => void;
}

const filterTypes: { type: CalendarEventType; label: string }[] = [
  { type: 'contract_expiry', label: 'Contratos' },
  { type: 'maintenance_scheduled', label: 'Manutenção' },
  { type: 'assembly_ago', label: 'Assembleias' },
  { type: 'invoice_due', label: 'Boletos' },
  { type: 'inspection', label: 'Vistorias' },
];

const CalendarHeader = ({
  currentDate, view, onViewChange, onPrev, onNext, onToday,
  activeFilters, onToggleFilter, canCreate, onNewEvent,
  events, showAgendaPanel, onToggleAgendaPanel,
}: Props) => {
  const { t } = useLanguage();
  const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

  const eventCountByType = useMemo(() => {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const counts: Partial<Record<CalendarEventType, number>> = {};
    events.forEach(ev => {
      const d = new Date(ev.start_at);
      if (d.getMonth() === month && d.getFullYear() === year) {
        // Map sub-types to filter types
        const mapped = ev.event_type === 'contract_renewal' ? 'contract_expiry'
          : ev.event_type === 'maintenance_corrective' ? 'maintenance_scheduled'
          : ev.event_type === 'assembly_age' ? 'assembly_ago'
          : ev.event_type;
        counts[mapped] = (counts[mapped] || 0) + 1;
      }
    });
    return counts;
  }, [events, currentDate]);

  const handleExportMonth = () => {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const monthEvents = events.filter(e => {
      const d = new Date(e.start_at);
      return d.getMonth() === month && d.getFullYear() === year;
    });
    downloadICS(monthEvents, `LUXCondo_${monthNames[month]}_${year}.ics`);
    import('sonner').then(m => m.toast.success(`Exportados ${monthEvents.length} eventos de ${monthNames[month]}`));
  };

  const handleExport30 = () => {
    const now = new Date();
    const limit = new Date(now.getTime() + 30 * 86400000);
    const filtered = events.filter(e => { const d = new Date(e.start_at); return d >= now && d <= limit; });
    downloadICS(filtered, `LUXCondo_Proximos_30_dias.ics`);
    import('sonner').then(m => m.toast.success(`Exportados ${filtered.length} eventos`));
  };

  const handleExportAll = () => {
    downloadICS(events, `LUXCondo_Todos_Eventos.ics`);
    import('sonner').then(m => m.toast.success(`Exportados ${events.length} eventos`));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: navigation */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={onPrev}>
            <ChevronLeft size={16} />
          </Button>
          <Button variant="outline" size="sm" className="text-xs" onClick={onToday}>
            {t('common.today')}
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={onNext}>
            <ChevronRight size={16} />
          </Button>
          <h2 className="text-lg font-bold text-foreground ml-2">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
        </div>

        {/* Center: view switcher */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {(['month', 'week', 'agenda'] as CalendarViewType[]).map(v => (
            <button
              key={v}
              onClick={() => onViewChange(v)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {v === 'month' ? t('common.month') : v === 'week' ? 'Semana' : 'Agenda'}
            </button>
          ))}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={onToggleAgendaPanel}>
            <ListChecks size={14} />
            <span className="hidden sm:inline">Agenda</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs gap-1.5">
                <Download size={14} />
                <span className="hidden sm:inline">Exportar</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportMonth}>
                📅 Exportar {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExport30}>
                📆 Próximos 30 dias
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportAll}>
                📄 Todos os eventos
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {canCreate && (
            <Button size="sm" className="premium-gradient gap-1.5" onClick={onNewEvent}>
              <Plus size={14} />
              <span className="hidden sm:inline">Novo evento</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filter bar with counts */}
      <div className="flex flex-wrap gap-1.5">
        {filterTypes.map(({ type, label }) => {
          const active = activeFilters.includes(type);
          const cfg = EVENT_TYPE_CONFIG[type];
          const count = eventCountByType[type] || 0;
          return (
            <button
              key={type}
              onClick={() => onToggleFilter(type)}
              className={cn(
                "px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all border",
                active
                  ? `${cfg.pillBg} ${cfg.pillText} border-current opacity-100`
                  : "bg-muted text-muted-foreground border-transparent opacity-60 hover:opacity-100"
              )}
            >
              {cfg.emoji} {label} {count > 0 && `(${count})`}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarHeader;
