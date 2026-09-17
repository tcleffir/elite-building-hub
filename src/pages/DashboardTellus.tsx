import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2, Maximize2, TrendingUp, DollarSign, BarChart3,
  Calendar, Leaf, AlertTriangle, FileText, ChevronRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getVILG11PortfolioBuildings, mockTenantContracts, mockBuildingDocuments } from "@/lib/mock-data";
import { getContractHealth, getDocumentHealth, getOccupancyStatus, daysUntil, healthColors, HealthStatus } from "@/lib/health-utils";
import { useLanguage } from "@/contexts/LanguageContext";

const fmt = (v: number) => v >= 1000000 ? `R$ ${(v / 1000000).toFixed(2).replace('.', ',')}M` : `R$ ${v.toLocaleString('pt-BR')}`;

interface Alert {
  severity: HealthStatus;
  type: string;
  building: string;
  item: string;
  daysLeft: number;
}

const DashboardTellus = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const portfolioBuildings = getVILG11PortfolioBuildings();
  const portfolioBuildingIds = new Set(portfolioBuildings.map((b) => b.id));

  const totalGla = portfolioBuildings.reduce((s, b) => s + (b.gla_m2 || 0), 0);
  const occupiedGla = portfolioBuildings.reduce((s, b) => s + ((b.gla_m2 || 0) * (b.occupancy_pct || 0) / 100), 0);
  const avgOccupancy = totalGla > 0 ? (occupiedGla / totalGla * 100) : 0;
  const totalRevenue = portfolioBuildings.reduce((s, b) => s + (b.monthly_revenue || 0), 0);
  const totalNoi = portfolioBuildings.reduce((s, b) => s + (b.monthly_noi || 0), 0);
  const noiMargin = totalRevenue > 0 ? (totalNoi / totalRevenue * 100) : 0;
  const avgWault = Math.round(portfolioBuildings.reduce((s, b) => s + (b.wault_months || 0), 0) / portfolioBuildings.length);

  // Contract alerts
  const contractAlerts = useMemo(() => {
    return mockTenantContracts
      .filter(c => portfolioBuildingIds.has(c.building_id) && c.status === 'active' && c.contract_end)
      .map(c => {
        const health = getContractHealth(c.contract_end!);
        const building = portfolioBuildings.find(b => b.id === c.building_id);
        return { severity: health, type: 'Contrato', building: building?.name || '', item: `${c.unit_id} — ${c.tenant_name}`, daysLeft: daysUntil(c.contract_end!) };
      })
      .filter(a => a.severity !== 'healthy');
  }, []);

  // Document alerts
  const docAlerts = useMemo(() => {
    return mockBuildingDocuments.filter(d => portfolioBuildingIds.has(d.building_id)).map(d => {
      const health = getDocumentHealth(d.valid_until);
      const building = portfolioBuildings.find(b => b.id === d.building_id);
      return { severity: health, type: 'Documento', building: building?.name || '', item: d.doc_name, daysLeft: daysUntil(d.valid_until) };
    }).filter(a => a.severity !== 'healthy');
  }, []);

  const allAlerts: Alert[] = useMemo(() => {
    return [...contractAlerts, ...docAlerts].sort((a, b) => {
      const order: Record<HealthStatus, number> = { critical: 0, warning: 1, healthy: 2 };
      return order[a.severity] - order[b.severity] || a.daysLeft - b.daysLeft;
    });
  }, [contractAlerts, docAlerts]);

  const criticalContracts = contractAlerts.filter(a => a.severity === 'critical').length;
  const warningContracts = contractAlerts.filter(a => a.severity === 'warning').length;
  const criticalDocs = docAlerts.filter(a => a.severity === 'critical').length;
  const warningDocs = docAlerts.filter(a => a.severity === 'warning').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Proprietário — Gestão de Investimentos Imobiliários — visão consolidada</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* GLA */}
        <div className="bg-card rounded-xl border p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center"><Maximize2 size={20} className="text-emerald-500" /></div>
            <div><p className="text-2xl font-bold">{totalGla.toLocaleString('pt-BR')} m²</p><p className="text-xs text-muted-foreground">GLA Total</p></div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-emerald-600">● {Math.round(occupiedGla).toLocaleString('pt-BR')} m² ocupados</span>
            <span className="text-muted-foreground">● {Math.round(totalGla - occupiedGla).toLocaleString('pt-BR')} m² vagos</span>
          </div>
        </div>

        {/* Ocupação */}
        <div className="bg-card rounded-xl border p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center"><TrendingUp size={20} className="text-emerald-500" /></div>
            <div><p className="text-2xl font-bold text-emerald-600">{avgOccupancy.toFixed(1)}%</p><p className="text-xs text-muted-foreground">Ocupação Média</p></div>
          </div>
          <Progress value={avgOccupancy} className="h-2" />
        </div>

        {/* NOI */}
        <div className="bg-card rounded-xl border p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center"><BarChart3 size={20} className="text-indigo-500" /></div>
            <div><p className="text-2xl font-bold">{fmt(totalNoi)}</p><p className="text-xs text-muted-foreground">NOI Consolidado</p></div>
          </div>
          <p className="text-xs text-emerald-600">Margem NOI: {noiMargin.toFixed(1)}%</p>
        </div>

        {/* WAULT */}
        <div className="bg-card rounded-xl border p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center"><Calendar size={20} className="text-amber-500" /></div>
            <div><p className="text-2xl font-bold">{avgWault} meses</p><p className="text-xs text-muted-foreground">WAULT Médio</p></div>
          </div>
          <Progress value={(avgWault / 48) * 100} className="h-2" />
        </div>

        {/* Receita */}
        <div className="bg-card rounded-xl border p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><DollarSign size={20} className="text-primary" /></div>
            <div><p className="text-2xl font-bold">{fmt(totalRevenue)}</p><p className="text-xs text-muted-foreground">Receita Mensal</p></div>
          </div>
          <p className="text-xs text-muted-foreground">{fmt(totalRevenue * 12)} projetado/ano</p>
        </div>

        {/* Total Ativos */}
        <div className="bg-card rounded-xl border p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Building2 size={20} className="text-primary" /></div>
            <div><p className="text-2xl font-bold">{portfolioBuildings.length}</p><p className="text-xs text-muted-foreground">Ativos no Portfólio</p></div>
          </div>
        </div>

        {/* Contratos Críticos */}
        <button
          onClick={() => navigate('/portfolio')}
          className="bg-card rounded-xl border border-rose-200 p-5 shadow-sm text-left hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center"><AlertTriangle size={20} className="text-rose-500" /></div>
            <div>
              <p className="text-lg font-bold">⚠️ Contratos</p>
              <p className="text-xs text-muted-foreground">requerem atenção</p>
            </div>
          </div>
          <div className="flex gap-2">
            {criticalContracts > 0 && <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">🔴 {criticalContracts} críticos</Badge>}
            {warningContracts > 0 && <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">🟡 {warningContracts} atenção</Badge>}
            {criticalContracts === 0 && warningContracts === 0 && <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">✅ Todos saudáveis</Badge>}
          </div>
        </button>

        {/* Documentação */}
        <button
          onClick={() => navigate('/portfolio')}
          className="bg-card rounded-xl border border-amber-200 p-5 shadow-sm text-left hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center"><FileText size={20} className="text-amber-500" /></div>
            <div>
              <p className="text-lg font-bold">📋 Documentação</p>
              <p className="text-xs text-muted-foreground">compliance dos ativos</p>
            </div>
          </div>
          <div className="flex gap-2">
            {criticalDocs > 0 && <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">🔴 {criticalDocs} urgentes</Badge>}
            {warningDocs > 0 && <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">🟡 {warningDocs} próximos</Badge>}
            {criticalDocs === 0 && warningDocs === 0 && <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">✅ Tudo em dia</Badge>}
          </div>
        </button>
      </div>

      {/* Alertas do Portfólio */}
      {allAlerts.length > 0 && (
        <div className="bg-card rounded-xl border shadow-sm">
          <div className="p-5 border-b flex items-center justify-between">
            <h2 className="text-base font-semibold">Alertas do Portfólio</h2>
            <Badge variant="secondary" className="text-xs">{allAlerts.length} alertas</Badge>
          </div>
          <div className="divide-y">
            {allAlerts.slice(0, 6).map((alert, i) => (
              <div key={i} className="px-5 py-3 flex items-center gap-3 hover:bg-muted/50">
                <span className={`w-2 h-2 rounded-full ${healthColors[alert.severity].dot}`} />
                <span className={`text-xs font-medium w-20 ${healthColors[alert.severity].text}`}>
                  {alert.type}
                </span>
                <span className="text-sm text-foreground flex-1 truncate">{alert.building}</span>
                <span className="text-sm text-muted-foreground truncate max-w-[200px]">{alert.item}</span>
                <span className={`text-xs font-medium whitespace-nowrap ${healthColors[alert.severity].text}`}>
                  {alert.daysLeft > 0 ? `${alert.daysLeft}d restantes` : `Vencido há ${Math.abs(alert.daysLeft)}d`}
                </span>
              </div>
            ))}
          </div>
          {allAlerts.length > 6 && (
            <div className="p-3 border-t text-center">
              <Button variant="ghost" size="sm" onClick={() => navigate('/portfolio')} className="text-xs gap-1">
                Ver todos os alertas <ChevronRight size={14} />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardTellus;
