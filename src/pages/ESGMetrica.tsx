import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Zap, Droplets, Flame, Recycle } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Line } from "recharts";
import { Button } from "@/components/ui/button";
import KpiCard from "@/components/KpiCard";

const energyData = [
  { month: 'Set', kwh: 142000, target: 135000, cost: 127800 },
  { month: 'Out', kwh: 138000, target: 135000, cost: 124200 },
  { month: 'Nov', kwh: 135000, target: 135000, cost: 121500 },
  { month: 'Dez', kwh: 145000, target: 135000, cost: 130500 },
  { month: 'Jan', kwh: 148000, target: 135000, cost: 133200 },
  { month: 'Fev', kwh: 140000, target: 135000, cost: 126000 },
  { month: 'Mar', kwh: 138000, target: 135000, cost: 124200 },
];

const energyBreakdown = [
  { name: 'HVAC', value: 45, fill: 'hsl(var(--interactive))' },
  { name: 'Iluminação', value: 22, fill: 'hsl(var(--success))' },
  { name: 'Elevadores', value: 15, fill: 'hsl(var(--warning))' },
  { name: 'Equipamentos', value: 12, fill: 'hsl(var(--operational))' },
  { name: 'Áreas Comuns', value: 6, fill: 'hsl(var(--hover))' },
];

const waterData = [
  { month: 'Set', m3: 1950, target: 1700, cost: 35100 },
  { month: 'Out', m3: 1880, target: 1700, cost: 33840 },
  { month: 'Nov', m3: 1820, target: 1700, cost: 32760 },
  { month: 'Dez', m3: 1900, target: 1700, cost: 34200 },
  { month: 'Jan', m3: 1850, target: 1700, cost: 33300 },
  { month: 'Fev', m3: 1780, target: 1700, cost: 32040 },
  { month: 'Mar', m3: 1800, target: 1700, cost: 32400 },
];

const waterBreakdown = [
  { name: 'Sanitários', value: 42, fill: 'hsl(var(--interactive))' },
  { name: 'Limpeza', value: 18, fill: 'hsl(var(--success))' },
  { name: 'Torres Resfriamento', value: 25, fill: 'hsl(var(--warning))' },
  { name: 'Irrigação', value: 10, fill: 'hsl(var(--operational))' },
  { name: 'Outros', value: 5, fill: 'hsl(var(--hover))' },
];

const gasData = [
  { month: 'Set', m3: 3800, target: 3800, cost: 15960, co2: 7.98 },
  { month: 'Out', m3: 3900, target: 3800, cost: 16380, co2: 8.19 },
  { month: 'Nov', m3: 4100, target: 3800, cost: 17220, co2: 8.61 },
  { month: 'Dez', m3: 3700, target: 3800, cost: 15540, co2: 7.77 },
  { month: 'Jan', m3: 3600, target: 3800, cost: 15120, co2: 7.56 },
  { month: 'Fev', m3: 3900, target: 3800, cost: 16380, co2: 8.19 },
  { month: 'Mar', m3: 4000, target: 3800, cost: 16800, co2: 8.40 },
];

const gasBreakdown = [
  { name: 'Aquecimento', value: 65, fill: 'hsl(var(--interactive))' },
  { name: 'Geração', value: 20, fill: 'hsl(var(--warning))' },
  { name: 'Cocção', value: 10, fill: 'hsl(var(--success))' },
  { name: 'Outros', value: 5, fill: 'hsl(var(--operational))' },
];

const wasteMonthly = [
  { month: 'Set', papel: 2.1, plastico: 1.4, vidro: 0.8, organico: 3.2, rejeito: 0.9, total: 8.4, reciclagem: 62 },
  { month: 'Out', papel: 2.3, plastico: 1.2, vidro: 0.9, organico: 3.0, rejeito: 0.8, total: 8.2, reciclagem: 64 },
  { month: 'Nov', papel: 1.9, plastico: 1.5, vidro: 0.7, organico: 3.4, rejeito: 0.7, total: 8.2, reciclagem: 66 },
  { month: 'Dez', papel: 2.5, plastico: 1.6, vidro: 1.0, organico: 3.1, rejeito: 0.6, total: 8.8, reciclagem: 65 },
  { month: 'Jan', papel: 2.0, plastico: 1.3, vidro: 0.8, organico: 2.9, rejeito: 0.8, total: 7.8, reciclagem: 67 },
  { month: 'Fev', papel: 1.8, plastico: 1.1, vidro: 0.6, organico: 2.7, rejeito: 0.7, total: 6.9, reciclagem: 68 },
  { month: 'Mar', papel: 1.7, plastico: 1.0, vidro: 0.5, organico: 2.5, rejeito: 0.6, total: 6.3, reciclagem: 70 },
];

const config: Record<string, {
  title: string;
  icon: React.ReactNode;
  unit: string;
  kpis: { title: string; value: string; subtitle: string }[];
  data: any[];
  dataKey: string;
  targetKey?: string;
  color: string;
  breakdown: { name: string; value: number; fill: string }[];
  breakdownTitle: string;
}> = {
  energia: {
    title: 'Energia Elétrica', icon: <Zap size={20} />, unit: 'kWh', color: 'hsl(var(--interactive))',
    kpis: [
      { title: 'Consumo Mensal', value: '138.000 kWh', subtitle: 'Meta: 135.000 kWh' },
      { title: 'kWh/m²', value: '3.94', subtitle: 'Benchmark: 4.2 kWh/m²' },
      { title: 'Custo Mensal', value: 'R$ 124.200', subtitle: 'Tarifa média: R$ 0,90/kWh' },
      { title: 'Fonte Renovável', value: '72%', subtitle: 'I-REC ativo — Solar' },
    ],
    data: energyData, dataKey: 'kwh', targetKey: 'target',
    breakdown: energyBreakdown, breakdownTitle: 'Decomposição por Uso',
  },
  agua: {
    title: 'Água', icon: <Droplets size={20} />, unit: 'm³', color: 'hsl(var(--water))',
    kpis: [
      { title: 'Consumo Mensal', value: '1.800 m³', subtitle: 'Meta: 1.700 m³' },
      { title: 'm³/pessoa', value: '4.2', subtitle: 'Meta: 3.8 m³/pessoa' },
      { title: 'Custo Mensal', value: 'R$ 32.400', subtitle: 'Tarifa: R$ 18/m³' },
      { title: 'Reaproveitamento', value: '15%', subtitle: 'Captação de chuva ativa' },
    ],
    data: waterData, dataKey: 'm3', targetKey: 'target',
    breakdown: waterBreakdown, breakdownTitle: 'Consumo por Categoria',
  },
  gas: {
    title: 'Gás Natural', icon: <Flame size={20} />, unit: 'm³', color: 'hsl(var(--operational))',
    kpis: [
      { title: 'Consumo Mensal', value: '4.000 m³', subtitle: 'Meta: 3.800 m³' },
      { title: 'Emissões CO₂', value: '8.4 tCO₂eq', subtitle: 'Fator: 2.1 kg/m³' },
      { title: 'Custo Mensal', value: 'R$ 16.800', subtitle: 'Tarifa: R$ 4,20/m³' },
      { title: 'Uso Principal', value: 'Aquecimento', subtitle: '65% do consumo total' },
    ],
    data: gasData, dataKey: 'm3', targetKey: 'target',
    breakdown: gasBreakdown, breakdownTitle: 'Uso por Finalidade',
  },
  residuos: {
    title: 'Resíduos', icon: <Recycle size={20} />, unit: 'ton',
    color: 'hsl(var(--success))',
    kpis: [
      { title: 'Geração Mensal', value: '6.3 ton', subtitle: 'Mês anterior: 6.9 ton' },
      { title: 'Taxa de Reciclagem', value: '70%', subtitle: 'Meta: 75%' },
      { title: 'Redução vs. Ano Anterior', value: '-12%', subtitle: 'Set/25: 8.4 ton → Mar/26: 6.3 ton' },
      { title: 'Destinação Correta', value: '100%', subtitle: 'Aterro zero (meta)' },
    ],
    data: wasteMonthly, dataKey: 'total', targetKey: undefined,
    breakdown: [
      { name: 'Orgânico', value: 40, fill: 'hsl(var(--operational))' },
      { name: 'Papel', value: 27, fill: 'hsl(var(--interactive))' },
      { name: 'Plástico', value: 16, fill: 'hsl(var(--warning))' },
      { name: 'Vidro', value: 8, fill: 'hsl(var(--success))' },
      { name: 'Rejeito', value: 9, fill: 'hsl(var(--muted-foreground))' },
    ],
    breakdownTitle: 'Composição dos Resíduos',
  },
};

const ESGMetrica = () => {
  const navigate = useNavigate();
  const { type: typeParam } = useParams<{ type: string }>();
  const type = (typeParam as keyof typeof config) || 'energia';
  const c = config[type] || config.energia;
  const isWaste = type === 'residuos';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/esg')}><ArrowLeft size={20} /></Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{c.title}</h1>
          <p className="text-sm text-muted-foreground">Detalhamento de consumo e métricas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {c.kpis.map((kpi, i) => (
          <KpiCard key={i} title={kpi.title} value={kpi.value} subtitle={kpi.subtitle} icon={c.icon} />
        ))}
      </div>

      {/* Main Chart */}
      <div className="bg-card rounded-2xl p-5 premium-shadow animate-fade-in">
        <h3 className="text-base font-semibold text-foreground mb-4">
          {isWaste ? 'Geração Mensal de Resíduos (ton)' : `Consumo Mensal — Últimos 7 meses (${c.unit})`}
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          {isWaste ? (
            <BarChart data={c.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" fontSize={12} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis fontSize={12} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
              <Bar dataKey="papel" stackId="a" fill="hsl(var(--interactive))" name="Papel" />
              <Bar dataKey="plastico" stackId="a" fill="hsl(var(--warning))" name="Plástico" />
              <Bar dataKey="vidro" stackId="a" fill="hsl(var(--success))" name="Vidro" />
              <Bar dataKey="organico" stackId="a" fill="hsl(var(--operational))" name="Orgânico" />
              <Bar dataKey="rejeito" stackId="a" fill="hsl(var(--muted-foreground))" radius={[4,4,0,0]} name="Rejeito" />
              <Legend />
            </BarChart>
          ) : (
            <AreaChart data={c.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" fontSize={12} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis fontSize={12} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
              <Area type="monotone" dataKey={c.dataKey} stroke={c.color} fill={c.color} fillOpacity={0.1} strokeWidth={2} name={`${c.title} (${c.unit})`} />
              {c.targetKey && <Line type="monotone" dataKey={c.targetKey} stroke="hsl(var(--success))" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Meta" />}
              <Legend />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl p-5 premium-shadow animate-fade-in">
          <h3 className="text-base font-semibold text-foreground mb-4">{c.breakdownTitle}</h3>
          <div className="space-y-3">
            {c.breakdown.map(item => (
              <div key={item.name}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-foreground">{item.name}</span>
                  <span className="text-sm font-semibold text-foreground">{item.value}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${item.value}%`, backgroundColor: item.fill }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-2xl p-5 premium-shadow animate-fade-in">
          <h3 className="text-base font-semibold text-foreground mb-4">
            {isWaste ? 'Taxa de Reciclagem (%)' : `Custo Mensal (R$)`}
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={c.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" fontSize={12} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis fontSize={12} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
              <Bar dataKey={isWaste ? 'reciclagem' : 'cost'} fill={c.color} radius={[4,4,0,0]} name={isWaste ? 'Reciclagem (%)' : 'Custo (R$)'} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Rateio link */}
      {!isWaste && (
        <div className="bg-card rounded-2xl p-5 premium-shadow animate-fade-in border-2 border-dashed border-interactive/30 cursor-pointer hover:shadow-xl transition-all" onClick={() => navigate('/esg/rateio')}>
          <p className="text-sm font-semibold text-foreground">📊 Rateio de Consumo → Configurar e lançar rateio de {c.title.toLowerCase()}</p>
        </div>
      )}

      {/* Gas-specific: CO2 chart */}
      {type === 'gas' && (
        <div className="bg-card rounded-2xl p-5 premium-shadow animate-fade-in">
          <h3 className="text-base font-semibold text-foreground mb-4">Emissões de CO₂ Equivalente (tCO₂eq/mês)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={gasData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" fontSize={12} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis fontSize={12} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
              <Area type="monotone" dataKey="co2" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.1} strokeWidth={2} name="tCO₂eq" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Waste-specific: Destinação */}
      {isWaste && (
        <div className="bg-card rounded-2xl p-5 premium-shadow animate-fade-in">
          <h3 className="text-base font-semibold text-foreground mb-4">Destinação Final</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-success/5 rounded-xl p-4 text-center border border-success/20">
              <p className="text-2xl font-bold text-success">70%</p>
              <p className="text-sm text-muted-foreground">Reciclagem</p>
            </div>
            <div className="bg-interactive/5 rounded-xl p-4 text-center border border-interactive/20">
              <p className="text-2xl font-bold text-interactive">22%</p>
              <p className="text-sm text-muted-foreground">Compostagem</p>
            </div>
            <div className="bg-muted rounded-xl p-4 text-center border border-border">
              <p className="text-2xl font-bold text-muted-foreground">8%</p>
              <p className="text-sm text-muted-foreground">Aterro Sanitário</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ESGMetrica;
