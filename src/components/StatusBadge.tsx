import { statusColors, priorityColors } from "@/lib/mock-data";
import { useLanguage } from "@/contexts/LanguageContext";
import { TranslationKey } from "@/lib/translations";

interface StatusBadgeProps {
  status: string;
  type?: 'status' | 'priority';
}

const statusKeyMap: Record<string, TranslationKey> = {
  open: "status.open",
  in_analysis: "status.in_analysis",
  in_progress: "status.in_progress",
  awaiting_approval: "status.awaiting_approval",
  completed: "status.completed",
  cancelled: "status.cancelled",
  active: "status.active",
  expiring: "status.expiring",
  expired: "status.expired",
  negotiation: "status.negotiation",
  terminated: "status.terminated",
  confirmed: "status.confirmed",
  pending: "status.pending",
  scheduled: "status.scheduled",
  waiting: "status.waiting",
  present: "status.present",
  departed: "status.departed",
  denied: "status.denied",
  received: "status.received",
  paid: "status.paid",
  overdue: "status.overdue",
  approved: "status.approved",
  suspended: "status.suspended",
};

const priorityKeyMap: Record<string, TranslationKey> = {
  low: "priority.low",
  normal: "priority.normal",
  high: "priority.high",
  urgent: "priority.urgent",
};

const StatusBadge = ({ status, type = 'status' }: StatusBadgeProps) => {
  const { t } = useLanguage();
  const colors = type === 'priority' ? priorityColors : statusColors;
  const keyMap = type === 'priority' ? priorityKeyMap : statusKeyMap;
  const label = keyMap[status] ? t(keyMap[status]) : status;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors[status] || 'bg-muted text-muted-foreground'}`}>
      {label}
    </span>
  );
};

export default StatusBadge;
