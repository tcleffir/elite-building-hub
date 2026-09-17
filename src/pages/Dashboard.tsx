import { useApp } from "@/contexts/AppContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { mockTickets } from "@/lib/mock-data";
import { filterTicketsByRole, getWidgetVisibility } from "@/lib/dashboard-visibility";
import DashboardGroupA from "@/components/dashboard/DashboardGroupA";
import DashboardGroupB from "@/components/dashboard/DashboardGroupB";
import DashboardGroupC from "@/components/dashboard/DashboardGroupC";
import { Navigate } from "react-router-dom";

const Dashboard = () => {
  const { selectedBuilding, user } = useApp();
  const { t } = useLanguage();

  // Gestor Proprietário redirects to their portfolio
  if (user.role === 'gestor_fundo') {
    return <Navigate to="/proprietario/portfolio" replace />;
  }

  const visibility = getWidgetVisibility(user.role);
  const filteredTickets = filterTicketsByRole(mockTickets, user);

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">{t("dashboard.title")}</h1>
        <p className="text-sm text-muted-foreground">{selectedBuilding.name} — {t("dashboard.operationalOverview")}</p>
      </div>

      <DashboardGroupA filteredTickets={filteredTickets} showAllAlerts={visibility.showAllAlerts} />

      <div className="border-b border-border/20" />

      <DashboardGroupB />

      {(visibility.showOccupancy || visibility.showFinancials || visibility.showPackagesGeneral) && (
        <>
          <div className="border-b border-border/20" />
          <DashboardGroupC />
        </>
      )}
    </div>
  );
};

export default Dashboard;
