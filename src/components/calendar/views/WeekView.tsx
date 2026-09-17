import { useMemo } from "react";
import { CalendarEvent, EVENT_TYPE_CONFIG } from "@/constants/calendar/eventTypeConfig";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface Props {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (e: CalendarEvent) => void;
  onEmptySlotClick?: (date: Date, hour: number) => void;
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 8);
const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const WeekView = ({ currentDate, events, onEventClick, onEmptySlotClick }: Props) => {
  const isMobile = useIsMobile();
  const daysToShow = isMobile ? 3 : 7;

  const weekDays = useMemo(() => {
    const d = new Date(currentDate);
    if (!isMobile) {
      d.setDate(d.getDate() - d.getDay());
    } else {
      d.setDate(d.getDate() - 1);
    }
    return Array.from({ length: daysToShow }, (_, i) => {
      const day = new Date(d);
      day.setDate(d.getDate() + i);
      return day;
    });
  }, [currentDate, daysToShow, isMobile]);

  const today = new Date();
  const isToday = (d: Date) => d.toDateString() === today.toDateString();
  const nowHour = today.getHours() + today.getMinutes() / 60;

  const getEventsForDay = (date: Date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return events.filter(e => !e.is_all_day && e.start_at.startsWith(dateStr));
  };

  const getAllDayEvents = (date: Date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return events.filter(e => e.is_all_day && e.start_at.startsWith(dateStr));
  };

  const getEventPosition = (event: CalendarEvent) => {
    const start = new Date(event.start_at);
    const end = event.end_at ? new Date(event.end_at) : new Date(start.getTime() + 3600000);
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;
    const top = (startHour - 8) * 48;
    const height = Math.max((endHour - startHour) * 48, 24);
    return { top, height };
  };

  return (
    <div className="bg-card rounded-xl border overflow-hidden">
      <div className="grid border-b" style={{ gridTemplateColumns: `3.5rem repeat(${daysToShow}, 1fr)` }}>
        <div className="border-r p-2" />
        {weekDays.map(day => (
          <div key={day.toISOString()} className={cn("text-center py-2 border-r", isToday(day) && "bg-primary/5")}>
            <p className="text-[10px] text-muted-foreground uppercase">{DAY_NAMES[day.getDay()]}</p>
            <span className={cn(
              "inline-flex w-7 h-7 items-center justify-center text-sm font-semibold rounded-full",
              isToday(day) && "bg-primary text-primary-foreground"
            )}>
              {day.getDate()}
            </span>
          </div>
        ))}
      </div>

      <div className="grid border-b min-h-[40px]" style={{ gridTemplateColumns: `3.5rem repeat(${daysToShow}, 1fr)` }}>
        <div className="border-r flex items-center justify-center text-[9px] text-muted-foreground">Dia<br/>todo</div>
        {weekDays.map(day => {
          const allDay = getAllDayEvents(day);
          return (
            <div key={day.toISOString()} className="border-r p-0.5 space-y-0.5">
              {allDay.map(ev => {
                const cfg = EVENT_TYPE_CONFIG[ev.event_type];
                return (
                  <button key={ev.id} onClick={() => onEventClick(ev)}
                    className={cn("w-full text-left px-1 py-0.5 rounded text-[9px] font-medium truncate", cfg.pillBg, cfg.pillText)}>
                    {cfg.emoji} {ev.title}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="relative overflow-y-auto max-h-[600px]">
        <div className="grid" style={{ gridTemplateColumns: `3.5rem repeat(${daysToShow}, 1fr)` }}>
          <div className="border-r">
            {HOURS.map(h => (
              <div key={h} className="h-12 flex items-start justify-end pr-1 -mt-2">
                <span className="text-[10px] text-muted-foreground">{String(h).padStart(2, '0')}:00</span>
              </div>
            ))}
          </div>

          {weekDays.map(day => {
            const dayEvents = getEventsForDay(day);
            return (
              <div key={day.toISOString()} className="border-r relative">
                {HOURS.map(h => (
                  <div
                    key={h}
                    className="h-12 border-b border-border/30 cursor-pointer hover:bg-muted/20 transition-colors"
                    onClick={() => onEmptySlotClick?.(day, h)}
                  />
                ))}

                {isToday(day) && nowHour >= 8 && nowHour <= 22 && (
                  <div
                    className="absolute left-0 right-0 z-10 flex items-center"
                    style={{ top: `${(nowHour - 8) * 48}px` }}
                  >
                    <div className="w-2 h-2 rounded-full bg-primary -ml-1" />
                    <div className="flex-1 h-[2px] bg-primary" />
                  </div>
                )}

                {dayEvents.map(ev => {
                  const { top, height } = getEventPosition(ev);
                  const cfg = EVENT_TYPE_CONFIG[ev.event_type];
                  return (
                    <button
                      key={ev.id}
                      onClick={(e) => { e.stopPropagation(); onEventClick(ev); }}
                      className={cn(
                        "absolute left-0.5 right-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium overflow-hidden border-l-[3px] cursor-pointer z-[5]",
                        cfg.pillBg, cfg.pillText
                      )}
                      style={{ top: `${top}px`, height: `${height}px`, borderLeftColor: 'currentColor' }}
                    >
                      <p className="truncate">{cfg.emoji} {ev.title}</p>
                      {height > 30 && (
                        <p className="text-[9px] opacity-70 truncate">
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
        </div>
      </div>
    </div>
  );
};

export default WeekView;
