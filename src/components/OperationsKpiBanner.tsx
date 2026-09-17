import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BannerData {
  openTickets: number;
  slaAtRisk: number;
  activeAnnouncements: number;
  weekReservations: number;
}

const OperationsKpiBanner = ({ data }: { data: BannerData }) => {
  const navigate = useNavigate();
  const monthLabel = format(new Date(), "MMM/yyyy", { locale: ptBR });

  const items = [
    { icon: "🔴", label: `${data.openTickets} chamados abertos`, onClick: () => navigate("/proprietario/chamados") },
    { icon: "⚠️", label: `${data.slaAtRisk} SLA em risco`, onClick: () => navigate("/proprietario/chamados") },
    { icon: "📢", label: `${data.activeAnnouncements} comunicados ativos`, onClick: () => navigate("/proprietario/comunicacao") },
    { icon: "📅", label: `${data.weekReservations} reservas esta semana`, onClick: () => navigate("/proprietario/reservas") },
  ];

  return (
    <Card className="p-3 mb-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase">Operações — {monthLabel}</span>
      </div>
      <div className="flex items-center divide-x divide-border flex-wrap">
        {items.map((item, i) => (
          <button
            key={i}
            onClick={item.onClick}
            className="flex items-center gap-1.5 px-3 py-1 text-xs hover:bg-muted/50 rounded transition-colors first:pl-0"
          >
            <span>{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </Card>
  );
};

export default OperationsKpiBanner;
