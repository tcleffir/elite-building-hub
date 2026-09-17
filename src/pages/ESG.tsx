import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Award, ChevronRight, ShieldCheck, Activity, Gauge, Radio, Wifi } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MobileTabSelect } from "@/components/MobileTabSelect";
import ESGTelemetry from "@/components/ESGTelemetry";
import PremiumGate from "@/components/PremiumGate";

const wasteData = [
  { month: "Set", papel: 2.1, plastico: 1.4, vidro: 0.8, organico: 3.2 },
  { month: "Out", papel: 2.3, plastico: 1.2, vidro: 0.9, organico: 3.0 },
  { month: "Nov", papel: 1.9, plastico: 1.5, vidro: 0.7, organico: 3.4 },
  { month: "Dez", papel: 2.5, plastico: 1.6, vidro: 1.0, organico: 3.1 },
  { month: "Jan", papel: 2.0, plastico: 1.3, vidro: 0.8, organico: 2.9 },
  { month: "Fev", papel: 1.8, plastico: 1.1, vidro: 0.6, organico: 2.7 },
  { month: "Mar", papel: 1.7, plastico: 1.0, vidro: 0.5, organico: 2.5 },
];

const leedCategories = [
  { name: "Localização e Transporte", obtained: 14, possible: 16 },
  { name: "Sustentabilidade do Terreno", obtained: 8, possible: 10 },
  { name: "Eficiência no Uso da Água", obtained: 9, possible: 11 },
  { name: "Energia e Atmosfera", obtained: 25, possible: 33 },
  { name: "Materiais e Recursos", obtained: 8, possible: 13 },
  { name: "Qualidade do Ambiente", obtained: 12, possible: 16 },
  { name: "Inovação", obtained: 5, possible: 6 },
  { name: "Prioridade Regional", obtained: 3, possible: 4 },
];

// Telemetry real-time mock data
const telemetryLive = {
  energy: { current: 42.8, unit: 'kW', peak: 68.3, avg24h: 38.2, status: 'normal' as const },
  water: { current: 1.2, unit: 'm³/h', peak: 3.4, avg24h: 1.0, status: 'normal' as const },
  gas: { current: 0.8, unit: 'm³/h', peak: 2.1, avg24h: 0.7, status: 'attention' as const },
};

const telemetryHourly = Array.from({ length: 24 }, (_, i) => ({
  hour: `${String(i).padStart(2, '0')}:00`,
  energia: Math.round((25 + Math.sin(i / 3) * 15 + Math.random() * 8) * 10) / 10,
  agua: Math.round((0.6 + Math.sin(i / 4) * 0.5 + Math.random() * 0.3) * 100) / 100,
  gas: Math.round((0.3 + Math.sin(i / 5) * 0.3 + Math.random() * 0.2) * 100) / 100,
}));

const telemetryDaily = [
  { day: '10/03', energia: 920, agua: 24, gas: 18 },
  { day: '11/03', energia: 885, agua: 22, gas: 16 },
  { day: '12/03', energia: 940, agua: 26, gas: 19 },
  { day: '13/03', energia: 870, agua: 21, gas: 15 },
  { day: '14/03', energia: 910, agua: 23, gas: 17 },
  { day: '15/03', energia: 650, agua: 15, gas: 10 },
  { day: '16/03', energia: 580, agua: 12, gas: 8 },
  { day: '17/03', energia: 930, agua: 25, gas: 18 },
  { day: '18/03', energia: 905, agua: 23, gas: 17 },
  { day: '19/03', energia: 945, agua: 27, gas: 20 },
  { day: '20/03', energia: 890, agua: 22, gas: 16 },
];

const meterReadings = [
  { meter: 'MED-001', location: 'Quadro Geral — Térreo', type: 'Energia', lastReading: '138.420 kWh', date: '20/03 08:00', status: 'online' },
  { meter: 'MED-002', location: 'Hidrômetro Principal', type: 'Água', lastReading: '4.872 m³', date: '20/03 08:00', status: 'online' },
  { meter: 'MED-003', location: 'Medidor de Gás Central', type: 'Gás', lastReading: '1.205 m³', date: '20/03 07:45', status: 'online' },
  { meter: 'MED-E07', location: '7º Andar — Lux Energy', type: 'Energia', lastReading: '12.340 kWh', date: '20/03 08:00', status: 'online' },
  { meter: 'MED-E13', location: '13º Andar — Capitale', type: 'Energia', lastReading: '18.920 kWh', date: '20/03 08:00', status: 'online' },
  { meter: 'MED-E08', location: '8º Andar — Sul América', type: 'Energia', lastReading: '22.150 kWh', date: '20/03 07:55', status: 'online' },
  { meter: 'MED-E10', location: '10º-11º — Geribá Energy', type: 'Energia', lastReading: '34.800 kWh', date: '20/03 08:00', status: 'online' },
  { meter: 'MED-A04', location: '4º Andar — You Intermediação', type: 'Água', lastReading: '320 m³', date: '20/03 07:30', status: 'offline' },
];

const ESG = () => {
  const navigate = useNavigate();
  const [mainTab, setMainTab] = useState('dashboard');
  const [telemetryPeriod, setTelemetryPeriod] = useState<'hourly' | 'daily'>('hourly');
  const totalObtained = leedCategories.reduce((s, c) => s + c.obtained, 0);
  const totalPossible = leedCategories.reduce((s, c) => s + c.possible, 0);

  const esgCards = [
    { icon: '⚡', title: 'Energia', value: '138.000 kWh', subtitle: 'Meta: 135.000 kWh', trend: '-4.8%', positive: true, href: '/esg/metricas/energia' },
    { icon: '💧', title: 'Água', value: '1.800 m³', subtitle: 'Meta: 1.700 m³', trend: '-3.7%', positive: true, href: '/esg/metricas/agua' },
    { icon: '🔥', title: 'Gás', value: '4.000 m³', subtitle: 'Meta: 3.800 m³', trend: '+2.6%', positive: false, href: '/esg/metricas/gas' },
    { icon: '♻️', title: 'Resíduos', value: '68%', subtitle: 'Taxa de reciclagem', trend: '+3%', positive: true, href: '/esg/metricas/residuos' },
  ];

  const statusColor = (s: string) => s === 'normal' ? 'text-success' : s === 'attention' ? 'text-amber-500' : 'text-destructive';
  const statusBg = (s: string) => s === 'normal' ? 'bg-success/10' : s === 'attention' ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-destructive/10';

  return (
    <PremiumGate
      moduleName="Sustentabilidade & ESG"
      moduleKey="sustainability"
      benefits={[
        "Dashboard ESG completo",
        "Score ESG com sub-indicadores E, S, G",
        "Telemetria de consumo (energia, água, gás) com medidores em tempo real",
        "Rateio de Consumo por locatário",
        "Relatórios de sustentabilidade em PDF",
        "Monitoramento de metas e alertas",
      ]}
    >
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground">ESG & Sustentabilidade</h1>
        <p className="text-sm text-muted-foreground">Métricas ambientais, sociais e de governança</p>
      </div>

      <Tabs value={mainTab} onValueChange={setMainTab}>
        <MobileTabSelect
          tabs={[
            { value: 'dashboard', label: 'Dashboard', icon: <span>📊</span> },
            { value: 'telemetria', label: 'Telemetria', icon: <span>📡</span> },
          ]}
          value={mainTab}
          onValueChange={setMainTab}
        >
          <TabsList className="w-full overflow-x-auto flex-nowrap justify-start">
            <TabsTrigger value="dashboard" className="whitespace-nowrap">📊 Dashboard</TabsTrigger>
            <TabsTrigger value="telemetria" className="whitespace-nowrap">📡 Telemetria</TabsTrigger>
          </TabsList>
        </MobileTabSelect>

        {/* ───── Dashboard Tab ───── */}
        <TabsContent value="dashboard" className="mt-4 space-y-6">
          {/* ESG Score + Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-card rounded-2xl p-6 premium-shadow animate-fade-in text-center">
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">ESG Score Geral</p>
              <div className="relative w-32 h-32 mx-auto mb-3">
                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
                  <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--success))" strokeWidth="10" strokeDasharray={`${78 * 3.27} ${100 * 3.27}`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-foreground">78</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">de 100 pontos</p>
            </div>
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {esgCards.map(c => (
                <div key={c.title} onClick={() => navigate(c.href)} className="bg-card rounded-2xl p-4 premium-shadow cursor-pointer hover:shadow-xl transition-all animate-fade-in">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl">{c.icon}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.positive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                      {c.positive ? '↓' : '↑'} {c.trend}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-foreground">{c.value}</p>
                  <p className="text-sm font-medium text-foreground/80">{c.title}</p>
                  <p className="text-xs text-muted-foreground">{c.subtitle}</p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-interactive font-medium">Ver detalhes <ChevronRight size={12} /></div>
                </div>
              ))}
            </div>
          </div>

          {/* Certifications */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div onClick={() => navigate('/esg/certificacoes/leed')} className="bg-card rounded-2xl p-5 premium-shadow animate-fade-in cursor-pointer hover:shadow-xl transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Award size={24} className="text-success" />
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Certificação LEED</h3>
                    <p className="text-xs text-muted-foreground">{totalObtained}/{totalPossible} pontos</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-sm font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">🏅 Gold</span>
              </div>
              <div className="space-y-2">
                {leedCategories.slice(0, 4).map(cat => (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs text-foreground">{cat.name}</span>
                      <span className="text-xs font-semibold text-muted-foreground">{cat.obtained}/{cat.possible}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full success-gradient" style={{ width: `${(cat.obtained / cat.possible) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1 mt-3 text-xs text-interactive font-medium">Ver certificação completa <ChevronRight size={12} /></div>
            </div>

            <div onClick={() => navigate('/esg/certificacoes/irec')} className="bg-card rounded-2xl p-5 premium-shadow animate-fade-in cursor-pointer hover:shadow-xl transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={24} className="text-success" />
                  <div>
                    <h3 className="text-base font-semibold text-foreground">I-REC</h3>
                    <p className="text-xs text-muted-foreground">Rastreabilidade de Energia Renovável</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-sm font-bold bg-success/10 text-success">✅ Ativo</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground">Créditos Ativos</p>
                  <p className="text-lg font-bold text-foreground">1.250 MWh</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground">Fonte</p>
                  <p className="text-lg font-bold text-foreground">Solar</p>
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3 text-xs text-interactive font-medium">Ver certificados I-REC <ChevronRight size={12} /></div>
            </div>
          </div>

          {/* Rateio Link */}
          <div onClick={() => navigate('/esg/rateio')} className="bg-card rounded-2xl p-5 premium-shadow animate-fade-in cursor-pointer hover:shadow-xl transition-all border-2 border-dashed border-interactive/30">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-foreground">⚡ Rateio de Consumo</h3>
                <p className="text-sm text-muted-foreground">Configure e lance o rateio mensal de energia, água e gás</p>
              </div>
              <ChevronRight size={20} className="text-interactive" />
            </div>
          </div>

          {/* Waste chart */}
          <div className="bg-card rounded-2xl p-5 premium-shadow animate-fade-in">
            <h3 className="text-base font-semibold text-foreground mb-4">Resíduos por Tipo (toneladas/mês)</h3>
            <ResponsiveContainer width="100%" height={200} className="sm:!h-[240px] lg:!h-[280px]">
              <BarChart data={wasteData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" fontSize={12} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis fontSize={12} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="papel" fill="hsl(var(--interactive))" radius={[4, 4, 0, 0]} name="Papel" stackId="a" />
                <Bar dataKey="plastico" fill="hsl(var(--hover))" name="Plástico" stackId="a" />
                <Bar dataKey="vidro" fill="hsl(var(--success))" name="Vidro" stackId="a" />
                <Bar dataKey="organico" fill="hsl(var(--operational))" radius={[4, 4, 0, 0]} name="Orgânico" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="telemetria" className="mt-4">
          <ESGTelemetry />
        </TabsContent>
      </Tabs>
    </div>
    </PremiumGate>
  );
};

export default ESG;
