import { useNavigate } from "react-router-dom";
import { Percent, DollarSign, Package } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useApp } from "@/contexts/AppContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { seedPackages, packageTypeConfig, formatRelativeTime } from "@/lib/packages-data";

const DashboardGroupC = () => {
  const navigate = useNavigate();
  const { selectedBuilding } = useApp();
  const { t } = useLanguage();

  const occupiedPct = selectedBuilding.occupancy_rate;
  const occupancyData = [
    { name: t('common.occupied'), value: occupiedPct, fill: 'hsl(var(--success))' },
    { name: t('common.available'), value: 100 - occupiedPct, fill: 'hsl(var(--muted))' },
  ];

  const waitingPkgs = seedPackages.filter(p => p.status === 'waiting');
  const pendingOver24h = waitingPkgs.filter(p => (Date.now() - p.arrivedAt.getTime()) > 86400000);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Taxa de Ocupação */}
      <div className="bg-card rounded-2xl p-5 premium-shadow animate-fade-in cursor-pointer hover:shadow-xl transition-all" onClick={() => navigate('/edificio')}>
        <div className="flex items-center gap-2 mb-3">
          <Percent size={18} className="text-interactive" />
          <h3 className="text-sm font-semibold text-foreground">{t('dashboard.occupancyRate')}</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={occupancyData} cx="50%" cy="50%" innerRadius={25} outerRadius={38} dataKey="value" strokeWidth={0}>
                  {occupancyData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-foreground">{occupiedPct}%</span>
            </div>
          </div>
          <div className="text-xs space-y-1 text-muted-foreground">
            <p>✅ Vivo (Telefônica Brasil) — 7º</p>
            <p>✅ Totvs S.A. — 13º</p>
            <p>✅ WeWork Brasil — 2º–4º</p>
          </div>
        </div>
      </div>

      {/* Financeiro resumido */}
      <div className="bg-card rounded-2xl p-5 premium-shadow animate-fade-in cursor-pointer hover:shadow-xl transition-all" onClick={() => navigate('/financeiro')}>
        <div className="flex items-center gap-2 mb-3">
          <DollarSign size={18} className="text-interactive" />
          <h3 className="text-sm font-semibold text-foreground">{t('dashboard.financial')}</h3>
        </div>
        <div className="space-y-3">
          <div className="bg-destructive/5 rounded-xl p-3">
            <p className="text-xs text-muted-foreground">{t('dashboard.defaultRate')}</p>
            <p className="text-lg font-bold text-destructive">0,0%</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-muted/50 rounded-xl p-2">
              <p className="text-xs text-muted-foreground">{t('dashboard.monthRevenue')}</p>
              <p className="text-sm font-bold text-foreground">—</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-2">
              <p className="text-xs text-muted-foreground">NOI</p>
              <p className="text-sm font-bold text-foreground">—</p>
            </div>
          </div>
        </div>
      </div>

      {/* Encomendas */}
      <div className="bg-card rounded-2xl p-5 premium-shadow animate-fade-in cursor-pointer hover:shadow-xl transition-all" onClick={() => navigate('/encomendas')}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Package size={18} className="text-interactive" />
            <h3 className="text-sm font-semibold text-foreground">{t('dashboard.packages')}</h3>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
            {waitingPkgs.length} {t('dashboard.packagesWaiting')}
          </span>
        </div>
        <div className="space-y-2">
          {pendingOver24h.length > 0 ? (
            pendingOver24h.slice(0, 3).map(p => (
              <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30">
                <span>{packageTypeConfig[p.type].icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{p.recipientCompany} — {p.recipientFloor}</p>
                  <p className="text-[10px] text-muted-foreground">{formatRelativeTime(p.arrivedAt)} • {p.volumes} vol.</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground py-2">{t('dashboard.noPendingOver24h')}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardGroupC;
