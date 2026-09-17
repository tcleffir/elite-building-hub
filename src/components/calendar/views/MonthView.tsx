import { useMemo } from "react";
import { CalendarEvent, EVENT_TYPE_CONFIG } from "@/constants/calendar/eventTypeConfig";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";

interface Props {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (e: CalendarEvent) => void;
  onDateClick: (d: Date) => void;
  onEmptyDayClick?: (d: Date) => void;
}

const DAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

const MonthView = ({ currentDate, events, onEventClick, onDateClick, onEmptyDayClick }: Props) => {
  const isMobile = useIsMobile();
  const maxPills = isMobile ? 0 : 3;

  const cells = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevDays = new Date(year, month, 0).getDate();

    const result: { date: Date; isCurrentMonth: boolean }[] = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      result.push({ date: new Date(year, month - 1, prevDays - i), isCurrentMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      result.push({ date: new Date(year, month, d), isCurrentMonth: true });
    }
    const remaining = 42 - result.length;
    for (let d = 1; d <= remaining; d++) {
      result.push({ date: new Date(year, month + 1, d), isCurrentMonth: false });
    }
    return result;
  }, [currentDate]);

  const getEventsForDate = (date: Date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return events.filter(e => e.start_at.startsWith(dateStr));
  };

  const today = new Date();
  const isToday = (d: Date) => d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();

  const handleDayClick = (date: Date, dayEvents: CalendarEvent[]) => {
    if (dayEvents.length === 0 && onEmptyDayClick) {
      onEmptyDayClick(date);
    } else {
      onDateClick(date);
    }
  };

  return (
    <div className="bg-card rounded-xl border overflow-hidden">
      <div className="grid grid-cols-7 bg-muted/50">
        {DAYS.map(day => (
          <div key={day} className="px-1 py-2 text-center text-[10px] font-semibold text-muted-foreground uppercase">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map(({ date, isCurrentMonth }, i) => {
          const dayEvents = getEventsForDate(date);
          const hasEvents = dayEvents.length > 0;
          const overflowCount = dayEvents.length - maxPills;

          return (
            <div
              key={i}
              className={cn(
                "min-h-[80px] sm:min-h-[110px] border-r border-b border-border/50 p-1 cursor-pointer transition-colors hover:bg-muted/30",
                !isCurrentMonth && "bg-muted/20",
                isToday(date) && "bg-primary/5"
              )}
              onClick={() => handleDayClick(date, dayEvents)}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className={cn(
                  "w-6 h-6 flex items-center justify-center text-xs font-medium rounded-full",
                  isToday(date) && "bg-primary text-primary-foreground font-bold",
                  !isCurrentMonth && "text-muted-foreground/40"
                )}>
                  {date.getDate()}
                </span>
                {isMobile && hasEvents && (
                  <div className="flex gap-0.5">
                    {dayEvents.slice(0, 3).map((e, j) => {
                      const cfg = EVENT_TYPE_CONFIG[e.event_type];
                      return <div key={j} className={cn("w-1.5 h-1.5 rounded-full", cfg.pillBg)} />;
                    })}
                  </div>
                )}
              </div>

              {!isMobile && (
                <div className="space-y-0.5">
                  {dayEvents.slice(0, maxPills).map(ev => {
                    const cfg = EVENT_TYPE_CONFIG[ev.event_type];
                    return (
                      <button
                        key={ev.id}
                        onClick={(e) => { e.stopPropagation(); onEventClick(ev); }}
                        className={cn(
                          "w-full text-left px-1.5 py-0.5 rounded text-[10px] font-medium truncate cursor-pointer",
                          cfg.pillBg, cfg.pillText
                        )}
                      >
                        {cfg.emoji} {ev.title}
                      </button>
                    );
                  })}
                  {overflowCount > 0 && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="text-[10px] text-muted-foreground hover:text-foreground font-medium pl-1"
                        >
                          +{overflowCount} mais
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-2 space-y-1" align="start">
                        {dayEvents.map(ev => {
                          const cfg = EVENT_TYPE_CONFIG[ev.event_type];
                          return (
                            <button
                              key={ev.id}
                              onClick={() => onEventClick(ev)}
                              className={cn("w-full text-left px-2 py-1.5 rounded text-xs font-medium", cfg.pillBg, cfg.pillText)}
                            >
                              {cfg.emoji} {ev.title}
                            </button>
                          );
                        })}
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthView;
