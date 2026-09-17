import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Megaphone, AlertTriangle, Clock, Ticket } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import TicketDrawer from "@/components/TicketDrawer";
import ContractDrawer from "@/components/ContractDrawer";
import AnnouncementModal from "@/components/AnnouncementModal";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  mockAnnouncements, mockContracts,
  Ticket as TicketType, Contract, Announcement,
} from "@/lib/mock-data";

interface Props {
  filteredTickets: TicketType[];
  showAllAlerts: boolean;
}

const DashboardGroupA = ({ filteredTickets, showAllAlerts }: Props) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  const youincContract = mockContracts.find(c => c.tenant_name === 'You Intermediação');
  const daysUntilExpiry = youincContract
    ? Math.max(0, Math.ceil((new Date(youincContract.end_date).getTime() - Date.now()) / 86400000))
    : 0;

  const openTickets = filteredTickets.filter(t => ['open', 'in_analysis', 'in_progress', 'awaiting_approval'].includes(t.status));
  const statusCounts = {
    open: openTickets.filter(t => t.status === 'open').length,
    in_progress: openTickets.filter(t => t.status === 'in_progress').length,
    awaiting: openTickets.filter(t => t.status === 'in_analysis' || t.status === 'awaiting_approval').length,
  };

  return (
    <>
      <div className="space-y-4">
        {/* 1. Comunicados */}
        <div className="bg-card rounded-2xl p-5 premium-shadow animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Megaphone size={18} className="text-interactive" />
              <h3 className="text-base font-semibold text-foreground">{t('dashboard.recentAnnouncements')}</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
                {mockAnnouncements.filter(a => !a.read).length} {t('dashboard.newOnes')}
              </span>
              <a href="/comunicados" className="text-xs font-medium text-interactive hover:text-secondary transition-colors">{t('dashboard.viewAllArrow')}</a>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {mockAnnouncements.slice(0, 3).map((a) => (
              <div key={a.id} className={`flex items-start gap-3 p-3 rounded-xl transition-colors hover:bg-muted/50 cursor-pointer ${!a.read ? 'bg-interactive/5 border border-interactive/10' : 'border border-border/50'}`} onClick={() => setSelectedAnnouncement(a)}>
                {!a.read && <div className="w-2 h-2 rounded-full bg-interactive shrink-0 mt-1.5" />}
                <div className="flex-1 min-w-0">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${a.category === 'Manutenção' ? 'bg-amber-100 text-amber-700' : a.category === 'ESG' ? 'bg-success/10 text-success' : 'bg-interactive/10 text-interactive'}`}>
                    {a.category}
                  </span>
                  <p className="text-sm font-medium text-foreground mt-1 line-clamp-2">{a.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(a.published_at).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Alertas ativos */}
        <div className="bg-card rounded-2xl p-5 premium-shadow animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-destructive" />
            <h3 className="text-base font-semibold text-foreground">{t('dashboard.activeAlerts')}</h3>
          </div>
          <div className="space-y-2">
            {showAllAlerts && youincContract && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-destructive/5 border border-destructive/10 cursor-pointer hover:bg-destructive/10 transition-colors" onClick={() => setSelectedContract(youincContract)}>
                <Clock size={16} className="text-destructive shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">You Intermediação (2º, 4º) {t('dashboard.contractExpires')} {daysUntilExpiry} {t('dashboard.days')}</p>
                  <p className="text-xs text-muted-foreground">{t('dashboard.startRenewal')}</p>
                </div>
              </div>
            )}
            {showAllAlerts && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-900/10 dark:border-amber-800/30 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors" onClick={() => navigate('/edificio')}>
                <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">3 {t('dashboard.vacantFloors')}: 5º, 6º, 8º</p>
                  <p className="text-xs text-muted-foreground">19 {t('dashboard.floorsAvailable')}</p>
                </div>
              </div>
            )}
            {filteredTickets.filter(t => t.priority === 'urgent' || t.priority === 'high').slice(0, 2).map(t => (
              <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-destructive/5 border border-destructive/10 cursor-pointer hover:bg-destructive/10 transition-colors" onClick={() => setSelectedTicket(t)}>
                <AlertTriangle size={16} className="text-destructive shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">{t.title}</p>
                  <p className="text-xs text-muted-foreground">{t.requester} • {t.id}</p>
                </div>
              </div>
            ))}
            {!showAllAlerts && filteredTickets.filter(t => t.priority === 'urgent' || t.priority === 'high').length === 0 && (
              <p className="text-sm text-muted-foreground py-2">{t('dashboard.noActiveAlerts')}</p>
            )}
          </div>
        </div>

        {/* 3. Chamados em aberto */}
        <div className="bg-card rounded-2xl p-5 premium-shadow animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Ticket size={18} className="text-interactive" />
              <h3 className="text-base font-semibold text-foreground">{t('dashboard.openTickets')}</h3>
            </div>
            <a href="/chamados" className="text-xs font-medium text-interactive hover:text-secondary transition-colors">{t('dashboard.viewAllArrow')}</a>
          </div>
          {/* Status counters */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1 bg-destructive/5 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-destructive">{statusCounts.open}</p>
              <p className="text-xs text-muted-foreground">{t('dashboard.open')}</p>
            </div>
            <div className="flex-1 bg-interactive/5 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-interactive">{statusCounts.in_progress}</p>
              <p className="text-xs text-muted-foreground">{t('dashboard.inExecution')}</p>
            </div>
            <div className="flex-1 bg-amber-50 dark:bg-amber-900/10 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{statusCounts.awaiting}</p>
              <p className="text-xs text-muted-foreground">{t('dashboard.awaiting')}</p>
            </div>
          </div>
          {/* Ticket list */}
          <div className="space-y-2">
            {openTickets.slice(0, 5).map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0 cursor-pointer hover:bg-muted/30 rounded-lg px-2 transition-colors" onClick={() => setSelectedTicket(ticket)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-mono text-muted-foreground">{ticket.id}</span>
                    <StatusBadge status={ticket.priority} type="priority" />
                    <span className="text-xs text-muted-foreground">• {ticket.floor > 0 ? `${ticket.floor}º ${t('common.floor').toLowerCase()}` : ticket.floor === 0 ? t('edificio.ground') : `SS${Math.abs(ticket.floor)}`}</span>
                  </div>
                  <p className="text-sm font-medium text-foreground truncate">{ticket.title}</p>
                </div>
                <StatusBadge status={ticket.status} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <TicketDrawer ticket={selectedTicket} open={!!selectedTicket} onClose={() => setSelectedTicket(null)} />
      <ContractDrawer contract={selectedContract} open={!!selectedContract} onClose={() => setSelectedContract(null)} />
      <AnnouncementModal announcement={selectedAnnouncement} open={!!selectedAnnouncement} onClose={() => setSelectedAnnouncement(null)} />
    </>
  );
};

export default DashboardGroupA;
