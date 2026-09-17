import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CalendarEvent } from "@/constants/calendar/eventTypeConfig";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface Props {
  currentDate: Date;
  onDateSelect: (d: Date) => void;
  events: CalendarEvent[];
}

const DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const MiniCalendarSidebar = ({ currentDate, onDateSelect, events }: Props) => {
  const [miniDate, setMiniDate] = useState(new Date(currentDate));

  const cells = useMemo(() => {
    const year = miniDate.getFullYear();
    const month = miniDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevDays = new Date(year, month, 0).getDate();

    const result: { date: Date; isCurrentMonth: boolean }[] = [];
    for (let i = firstDay - 1; i >= 0; i--) result.push({ date: new Date(year, month - 1, prevDays - i), isCurrentMonth: false });
    for (let d = 1; d <= daysInMonth; d++) result.push({ date: new Date(year, month, d), isCurrentMonth: true });
    const remaining = 42 - result.length;
    for (let d = 1; d <= remaining; d++) result.push({ date: new Date(year, month + 1, d), isCurrentMonth: false });
    return result;
  }, [miniDate]);

  const today = new Date();
  const isToday = (d: Date) => d.toDateString() === today.toDateString();
  const isSelected = (d: Date) => d.toDateString() === currentDate.toDateString();

  const hasEvent = (d: Date) => {
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return events.some(e => e.start_at.startsWith(dateStr));
  };

  const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

  return (
    <div className="bg-muted/30 rounded-xl p-3 border border-border/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-foreground">
          {monthNames[miniDate.getMonth()]} {miniDate.getFullYear()}
        </span>
        <div className="flex gap-0.5">
          <button onClick={() => setMiniDate(d => { const n = new Date(d); n.setMonth(n.getMonth() - 1); return n; })}
            className="p-0.5 rounded hover:bg-muted"><ChevronLeft size={14} /></button>
          <button onClick={() => setMiniDate(d => { const n = new Date(d); n.setMonth(n.getMonth() + 1); return n; })}
            className="p-0.5 rounded hover:bg-muted"><ChevronRight size={14} /></button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-0">
        {DAYS.map((d, i) => (
          <div key={i} className="text-center text-[9px] text-muted-foreground font-medium py-1">{d}</div>
        ))}
        {cells.map(({ date, isCurrentMonth }, i) => (
          <button
            key={i}
            onClick={() => { onDateSelect(date); }}
            className={cn(
              "relative w-7 h-7 flex items-center justify-center rounded-full text-[11px] transition-colors",
              !isCurrentMonth && "text-muted-foreground/30",
              isCurrentMonth && "hover:bg-muted",
              isToday(date) && "bg-primary text-primary-foreground font-bold",
              isSelected(date) && !isToday(date) && "bg-primary/10 text-primary font-semibold"
            )}
          >
            {date.getDate()}
            {hasEvent(date) && isCurrentMonth && !isToday(date) && (
              <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MiniCalendarSidebar;
