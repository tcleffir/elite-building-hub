import { useNavigate } from "react-router-dom";
import { Zap, Droplets, Flame } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, ReferenceLine, Legend,
} from "recharts";
import { mockEnergyData } from "@/lib/mock-data";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguage } from "@/contexts/LanguageContext";

function momChange(data: typeof mockEnergyData, key: 'kwh' | 'water' | 'gas'): { text: string; down: boolean } {
  if (data.length < 2) return { text: '', down: false };
  const curr = data[data.length - 1][key];
  const prev = data[data.length - 2][key];
  const pct = ((curr - prev) / prev * 100).toFixed(1);
  const down = Number(pct) <= 0;
  return { text: `${down ? '↓' : '↑'} ${Math.abs(Number(pct))}%`, down };
}

const DashboardGroupB = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const energyTrend = momChange(mockEnergyData, 'kwh');
  const waterTrend = momChange(mockEnergyData, 'water');
  const gasTrend = momChange(mockEnergyData, 'gas');

  const chartStyle = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Energia */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="bg-card rounded-2xl p-4 premium-shadow animate-fade-in cursor-pointer hover:shadow-xl transition-all" onClick={() => navigate('/esg/metricas/energia')}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-interactive" />
                <h3 className="text-sm font-semibold text-foreground">{t('dashboard.energy')}</h3>
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${energyTrend.down ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                {energyTrend.text} {t('dashboard.vsPrevMonth')}
              </span>
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={mockEnergyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" fontSize={10} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis fontSize={9} tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <RTooltip contentStyle={chartStyle} />
                <ReferenceLine y={135000} stroke="hsl(var(--success))" strokeDasharray="5 5" />
                <Bar dataKey="kwh" fill="hsl(var(--interactive))" radius={[4, 4, 0, 0]} name="kWh" />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground mt-1">{t('dashboard.goalEnergy')}</p>
          </div>
        </TooltipTrigger>
        <TooltipContent>{t('dashboard.goToEnergy')}</TooltipContent>
      </Tooltip>

      {/* Água */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="bg-card rounded-2xl p-4 premium-shadow animate-fade-in cursor-pointer hover:shadow-xl transition-all" onClick={() => navigate('/esg/metricas/agua')}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Droplets size={16} className="text-water" />
                <h3 className="text-sm font-semibold text-foreground">{t('dashboard.water')}</h3>
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${waterTrend.down ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                {waterTrend.text} {t('dashboard.vsPrevMonth')}
              </span>
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={mockEnergyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" fontSize={10} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis fontSize={9} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <RTooltip contentStyle={chartStyle} />
                <Bar dataKey="water" fill="hsl(var(--water))" radius={[4, 4, 0, 0]} name="m³" />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground mt-1">{t('dashboard.goalWater')}</p>
          </div>
        </TooltipTrigger>
        <TooltipContent>{t('dashboard.goToWater')}</TooltipContent>
      </Tooltip>

      {/* Gás */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="bg-card rounded-2xl p-4 premium-shadow animate-fade-in cursor-pointer hover:shadow-xl transition-all" onClick={() => navigate('/esg/metricas/gas')}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Flame size={16} className="text-amber-500" />
                <h3 className="text-sm font-semibold text-foreground">{t('dashboard.gas')}</h3>
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${gasTrend.down ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                {gasTrend.text} {t('dashboard.vsPrevMonth')}
              </span>
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={mockEnergyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" fontSize={10} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis fontSize={9} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <RTooltip contentStyle={chartStyle} />
                <Bar dataKey="gas" fill="hsl(var(--operational))" radius={[4, 4, 0, 0]} name="m³" />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground mt-1">{t('dashboard.goalGas')}</p>
          </div>
        </TooltipTrigger>
        <TooltipContent>{t('dashboard.goToGas')}</TooltipContent>
      </Tooltip>

      {/* ESG Score */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="bg-card rounded-2xl p-4 premium-shadow animate-fade-in cursor-pointer hover:shadow-xl transition-all" onClick={() => navigate('/esg')}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-foreground">{t('dashboard.esgScore')}</h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-success/10 text-success whitespace-nowrap">📈 +2 pts</span>
            </div>
            <div className="flex justify-center mb-2">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="hsl(var(--muted))" strokeWidth="7" />
                  <circle cx="40" cy="40" r="32" fill="none" stroke="hsl(var(--success))" strokeWidth="7" strokeDasharray={`${78 * 2.01} ${100 * 2.01}`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-foreground">78</span>
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              {[
                { label: `E — ${t('esg.energy')}`, pct: 82, color: 'bg-interactive' },
                { label: `S — ${t('esg.water')}/${t('esg.gas')}`, pct: 74, color: 'bg-operational' },
                { label: 'G — Gov.', pct: 78, color: 'bg-success' },
              ].map(s => (
                <div key={s.label}>
                  <div className="flex justify-between text-xs text-muted-foreground mb-0.5">
                    <span>{s.label}</span><span>{s.pct}%</span>
                  </div>
                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>{t('dashboard.goToESG')}</TooltipContent>
      </Tooltip>
    </div>
  );
};

export default DashboardGroupB;
