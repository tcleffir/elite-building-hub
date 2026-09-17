import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Ticket, Megaphone, FileText, CalendarDays, Leaf, CheckCheck } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/contexts/LanguageContext";

interface Notification {
  id: string;
  type: 'ticket' | 'announcement' | 'contract' | 'reservation' | 'esg';
  titleKey: string;
  message: string;
  time: string;
  read: boolean;
  link: string;
}

const mockNotifications: Notification[] = [
  { id: '1', type: 'ticket', titleKey: 'notifications.ticketUpdated', message: 'CH-002: Ar-condicionado com ruído — status alterado para "Em Execução"', time: '5 min', read: false, link: '/chamados' },
  { id: '2', type: 'announcement', titleKey: 'notifications.newAnnouncement', message: '⚠️ Manutenção elevadores centrais — 12/03 das 8h às 12h', time: '30 min', read: false, link: '/comunicados' },
  { id: '3', type: 'contract', titleKey: 'notifications.contractExpiring', message: 'Contrato You Intermediação (2º-4º andar) vence em 28/02/2026', time: '2h', read: false, link: '/contratos' },
  { id: '4', type: 'ticket', titleKey: 'notifications.newTicket', message: 'CH-008: Solicitação de proposta — Eficiência Energética', time: '3h', read: false, link: '/chamados' },
  { id: '5', type: 'reservation', titleKey: 'notifications.reservationConfirmed', message: 'Sala de Reunião 19º andar — amanhã 14h-16h', time: '5h', read: true, link: '/reservas' },
  { id: '6', type: 'esg', titleKey: 'notifications.esgReportReady', message: 'Relatório de consumo de energia de fevereiro está pronto', time: '1d', read: true, link: '/esg' },
  { id: '7', type: 'ticket', titleKey: 'notifications.ticketCompleted', message: 'CH-006: Lâmpada queimada corredor — concluído com avaliação ⭐⭐⭐⭐⭐', time: '2d', read: true, link: '/chamados' },
  { id: '8', type: 'announcement', titleKey: 'notifications.announcementPublished', message: '🌱 Sêneca renova certificação LEED Gold para o ciclo 2026-2028', time: '3d', read: true, link: '/comunicados' },
];

const iconMap = {
  ticket: Ticket,
  announcement: Megaphone,
  contract: FileText,
  reservation: CalendarDays,
  esg: Leaf,
};

const colorMap = {
  ticket: 'text-interactive bg-interactive/10',
  announcement: 'text-amber-600 bg-amber-100',
  contract: 'text-destructive bg-destructive/10',
  reservation: 'text-primary bg-primary/10',
  esg: 'text-success bg-success/10',
};

export function NotificationsPanel() {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClick = (notif: Notification) => {
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    setOpen(false);
    navigate(notif.link);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white bg-destructive rounded-full px-1">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm text-foreground">{t("notifications.title")}</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs text-interactive h-7 gap-1" onClick={markAllRead}>
              <CheckCheck size={14} /> {t("notifications.markAllRead")}
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">{t("notifications.noNotifications")}</div>
          ) : (
            <div className="divide-y">
              {notifications.map((notif) => {
                const Icon = iconMap[notif.type];
                const title = t(notif.titleKey as any);
                return (
                  <button
                    key={notif.id}
                    onClick={() => handleClick(notif)}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors ${!notif.read ? 'bg-interactive/5' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${colorMap[notif.type]}`}>
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-xs font-semibold truncate ${!notif.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {title}
                        </p>
                        {!notif.read && <span className="w-2 h-2 rounded-full bg-interactive shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">{notif.time} {t("notifications.ago")}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
