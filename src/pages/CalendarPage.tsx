import { useState, useMemo } from "react";
import { useApp } from "@/contexts/AppContext";
import { CalendarEvent, CalendarEventType, mockCalendarEvents, Participant, EVENT_TYPE_CONFIG } from "@/constants/calendar/eventTypeConfig";
import CalendarHeader from "@/components/calendar/navigation/CalendarHeader";
import MonthView from "@/components/calendar/views/MonthView";
import WeekView from "@/components/calendar/views/WeekView";
import AgendaView from "@/components/calendar/views/AgendaView";
import EventDetailDrawer from "@/components/calendar/event/EventDetailDrawer";
import EventForm from "@/components/calendar/event/EventForm";
import MiniCalendarSidebar from "@/components/calendar/navigation/MiniCalendar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockBuildings } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export type CalendarViewType = 'month' | 'week' | 'agenda';

const CalendarPage = () => {
  const { user } = useApp();
  const isMobile = useIsMobile();
  const [currentDate, setCurrentDate] = useState(new Date(2026, 3, 1));
  const [view, setView] = useState<CalendarViewType>(isMobile ? 'agenda' : 'month');
  const [activeFilters, setActiveFilters] = useState<CalendarEventType[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>(mockCalendarEvents);
  const [buildingFilter, setBuildingFilter] = useState('all');
  const [initialDate, setInitialDate] = useState<Date | null>(null);
  const [showAgendaPanel, setShowAgendaPanel] = useState(false);

  const canCreateEvents = true; // All roles can create events

  const portfolioBuildings = useMemo(
    () => mockBuildings.filter((building) => user.building_ids.includes(building.id) && building.segment),
    [user.building_ids]
  );

  const accessibleBuildingNames = useMemo(
    () => new Set(portfolioBuildings.flatMap((building) => [building.name, building.short_name]).filter(Boolean) as string[]),
    [portfolioBuildings]
  );

  const scopedEvents = useMemo(() => {
    if (user.role !== 'gestor_fundo') return events;
    return events.filter(
      (event) =>
        !event.building_name ||
        event.building_name === 'Portfolio Proprietário' ||
        accessibleBuildingNames.has(event.building_name)
    );
  }, [accessibleBuildingNames, events, user.role]);

  const buildingNames = useMemo(() => {
    const names = new Set(scopedEvents.map((event) => event.building_name).filter(Boolean));
    return Array.from(names).sort();
  }, [scopedEvents]);

  const filteredEvents = useMemo(() => {
    let result = scopedEvents;
    if (activeFilters.length > 0) {
      result = result.filter((event) => {
        // Map sub-types to filter types for matching
        const mapped = event.event_type === 'contract_renewal' ? 'contract_expiry'
          : event.event_type === 'maintenance_corrective' ? 'maintenance_scheduled'
          : event.event_type === 'assembly_age' ? 'assembly_ago'
          : event.event_type;
        return activeFilters.includes(mapped);
      });
    }
    if (buildingFilter !== 'all') result = result.filter((event) => event.building_name === buildingFilter);
    return result;
  }, [activeFilters, buildingFilter, scopedEvents]);

  // Next 30 days events for agenda panel
  const next30Events = useMemo(() => {
    const now = new Date('2026-04-08');
    const limit = new Date(now.getTime() + 30 * 86400000);
    return scopedEvents
      .filter(e => { const d = new Date(e.start_at); return d >= now && d <= limit; })
      .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
  }, [scopedEvents]);

  const next30Grouped = useMemo(() => {
    const groups: Record<string, CalendarEvent[]> = {};
    next30Events.forEach(ev => {
      const key = ev.start_at.split('T')[0];
      if (!groups[key]) groups[key] = [];
      groups[key].push(ev);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [next30Events]);

  const toggleFilter = (type: CalendarEventType) => {
    setActiveFilters((prev) =>
      prev.includes(type) ? prev.filter((item) => item !== type) : [...prev, type]
    );
  };

  const navigatePrev = () => {
    setCurrentDate((prev) => {
      const nextDate = new Date(prev);
      if (view === 'month') nextDate.setMonth(nextDate.getMonth() - 1);
      else if (view === 'week') nextDate.setDate(nextDate.getDate() - 7);
      else nextDate.setMonth(nextDate.getMonth() - 1);
      return nextDate;
    });
  };

  const navigateNext = () => {
    setCurrentDate((prev) => {
      const nextDate = new Date(prev);
      if (view === 'month') nextDate.setMonth(nextDate.getMonth() + 1);
      else if (view === 'week') nextDate.setDate(nextDate.getDate() + 7);
      else nextDate.setMonth(nextDate.getMonth() + 1);
      return nextDate;
    });
  };

  const goToToday = () => setCurrentDate(new Date());
  const goToDate = (date: Date) => setCurrentDate(date);

  const handleEmptyDayClick = (date: Date) => {
    setInitialDate(date);
    setEditingEvent(null);
    setShowEventForm(true);
  };

  const handleEmptySlotClick = (date: Date, hour: number) => {
    const d = new Date(date);
    setInitialDate(d);
    setEditingEvent(null);
    setShowEventForm(true);
  };

  const handleSaveEvent = (event: CalendarEvent) => {
    if (editingEvent) {
      setEvents((prev) => prev.map((item) => (item.id === event.id ? event : item)));
    } else {
      setEvents((prev) => [...prev, { ...event, id: `ce_${Date.now()}` }]);
    }
    setShowEventForm(false);
    setEditingEvent(null);
    setInitialDate(null);
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    setSelectedEvent(null);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setSelectedEvent(null);
    setShowEventForm(true);
  };

  const handleUpdateParticipants = (eventId: string, participants: Participant[]) => {
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, participants } : e));
    if (selectedEvent?.id === eventId) {
      setSelectedEvent(prev => prev ? { ...prev, participants } : null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={buildingFilter} onValueChange={setBuildingFilter}>
          <SelectTrigger className="w-52"><SelectValue placeholder="Todos os ativos" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os ativos</SelectItem>
            {buildingNames.map((name) => <SelectItem key={name} value={name!}>{name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isMobile && (
        <MiniCalendarSidebar
          currentDate={currentDate}
          onDateSelect={goToDate}
          events={filteredEvents}
        />
      )}

      <CalendarHeader
        currentDate={currentDate}
        view={view}
        onViewChange={setView}
        onPrev={navigatePrev}
        onNext={navigateNext}
        onToday={goToToday}
        activeFilters={activeFilters}
        onToggleFilter={toggleFilter}
        canCreate={canCreateEvents}
        onNewEvent={() => {
          setEditingEvent(null);
          setInitialDate(null);
          setShowEventForm(true);
        }}
        events={scopedEvents}
        showAgendaPanel={showAgendaPanel}
        onToggleAgendaPanel={() => setShowAgendaPanel(p => !p)}
      />

      <div className="flex gap-4">
        {/* Main calendar area */}
        <div className={cn("flex-1 min-w-0", showAgendaPanel && !isMobile && "max-w-[calc(100%-296px)]")}>
          {view === 'month' && (
            <MonthView
              currentDate={currentDate}
              events={filteredEvents}
              onEventClick={setSelectedEvent}
              onDateClick={goToDate}
              onEmptyDayClick={handleEmptyDayClick}
            />
          )}
          {view === 'week' && (
            <WeekView
              currentDate={currentDate}
              events={filteredEvents}
              onEventClick={setSelectedEvent}
              onEmptySlotClick={handleEmptySlotClick}
            />
          )}
          {view === 'agenda' && (
            <AgendaView
              currentDate={currentDate}
              events={filteredEvents}
              onEventClick={setSelectedEvent}
            />
          )}
        </div>

        {/* Agenda side panel */}
        {showAgendaPanel && !isMobile && (
          <div className="w-[280px] shrink-0">
            <div className="bg-card rounded-xl border p-4 sticky top-4">
              <h3 className="text-sm font-bold text-foreground mb-3">📋 Próximos 30 dias</h3>
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="space-y-3 pr-2">
                  {next30Grouped.map(([dateKey, dayEvents]) => {
                    const date = new Date(dateKey + 'T12:00:00');
                    const isToday = dateKey === '2026-04-08';
                    const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' });
                    const dayLabel = `${date.getDate()} ${date.toLocaleDateString('pt-BR', { month: 'short' })}`;

                    return (
                      <div key={dateKey}>
                        <div className="flex items-center gap-2 mb-1">
                          <p className={cn("text-xs font-bold", isToday ? "text-primary" : "text-foreground")}>
                            {isToday ? 'HOJE' : dayLabel} — <span className="capitalize">{dayName}</span>
                          </p>
                        </div>
                        {dayEvents.map(ev => {
                          const cfg = EVENT_TYPE_CONFIG[ev.event_type];
                          const isUrgent = ev.priority === 'urgent';
                          return (
                            <button
                              key={ev.id}
                              onClick={() => setSelectedEvent(ev)}
                              className={cn(
                                "w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] mb-1 transition-colors cursor-pointer",
                                isUrgent ? "bg-red-50 hover:bg-red-100 border border-red-200" : "hover:bg-muted"
                              )}
                            >
                              <p className="font-medium truncate">
                                {cfg.emoji} {ev.title}
                              </p>
                              {!ev.is_all_day && (
                                <p className="text-[10px] text-muted-foreground">
                                  {new Date(ev.start_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                  {ev.end_at && ` – ${new Date(ev.end_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                                </p>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                  {next30Grouped.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">Nenhum evento nos próximos 30 dias</p>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
      </div>

      <EventDetailDrawer
        event={selectedEvent}
        open={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
        onUpdateParticipants={handleUpdateParticipants}
        userRole={user.role}
      />

      <EventForm
        open={showEventForm}
        onClose={() => {
          setShowEventForm(false);
          setEditingEvent(null);
          setInitialDate(null);
        }}
        onSave={handleSaveEvent}
        editingEvent={editingEvent}
        availableBuildings={user.role === 'gestor_fundo' ? portfolioBuildings.map((building) => building.name) : undefined}
        initialDate={initialDate}
      />
    </div>
  );
};

export default CalendarPage;
