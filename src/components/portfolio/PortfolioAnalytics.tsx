import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { getPortfolioSnapshot, competenciaLabel, CURRENT_COMPETENCIA } from "@/lib/portfolio-competencia";
import { getContractHealth } from "@/lib/health-utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, ReferenceLine, LabelList
} from "recharts";
import { TrendingUp, AlertTriangle, ArrowUp, Zap, Building2 } from "lucide-react";

const fmt = (v: number) => v >= 1000000 ? `R$ ${(v / 1000000).toFixed(2).replace('.', ',')}M` : `R$ ${v.toLocaleString('pt-BR')}`;
const COLORS = ['hsl(var(--primary))', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280'];
const healthBarColors: Record<string, string> = { healthy: '#10b981', warning: '#f59e0b', critical: '#ef4444' };

interface PortfolioAnalyticsProps {
  /** Competência global da página (YYYY-MM) */
  competencia?: string;
}

const PortfolioAnalytics = ({ competencia = CURRENT_COMPETENCIA }: PortfolioAnalyticsProps) => {
  const snapshot = useMemo(() => getPortfolioSnapshot(competencia), [competencia]);
  const portfolioBuildings = snapshot.buildings;
  const mockTenantContracts = snapshot.contracts;
  const portfolioBuildingIds = new Set(portfolioBuildings.map((b) => b.id));
  /** Referência de mercado R$/m² — variável por competência (importada) */
  const mercadoM2 = snapshot.mercadoM2;
  const mercadoRef = mercadoM2 ?? 0;

  // Pricing tab — selected asset for per-tenant R$/m² breakdown
  const defaultPricingAsset = useMemo(() => {
    const withTenants = portfolioBuildings.find(b =>
      mockTenantContracts.some(c => c.building_id === b.id && c.status === 'active' && c.price_per_m2)
    );
    return withTenants?.id || 'all';
  }, [snapshot]);
  const [pricingAssetId, setPricingAssetId] = useState<string>(defaultPricingAsset);

  // Revenue by building
  const revenueData = useMemo(() => {
    return portfolioBuildings
      .map(b => ({
        name: b.short_name || b.name,
        revenue: b.monthly_revenue || 0,
        occupancy: b.occupancy_pct || 0,
        fill: (b.occupancy_pct || 0) >= 90 ? '#10b981' : (b.occupancy_pct || 0) >= 70 ? '#f59e0b' : '#ef4444',
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [snapshot]);

  // Tenant concentration
  const tenantConcentration = useMemo(() => {
    const tenantRevenue: Record<string, number> = {};
    mockTenantContracts.filter(c => portfolioBuildingIds.has(c.building_id) && c.status === 'active' && c.tenant_name && c.price_per_m2).forEach(c => {
      tenantRevenue[c.tenant_name!] = (tenantRevenue[c.tenant_name!] || 0) + c.area_m2 * (c.price_per_m2 || 0);
    });
    const sorted = Object.entries(tenantRevenue).sort((a, b) => b[1] - a[1]);
    const total = sorted.reduce((s, [, v]) => s + v, 0);
    const top5 = sorted.slice(0, 5).map(([name, value]) => ({ name, value, pct: ((value / total) * 100).toFixed(1) }));
    const othersValue = sorted.slice(5).reduce((s, [, v]) => s + v, 0);
    if (othersValue > 0) top5.push({ name: 'Outros', value: othersValue, pct: ((othersValue / total) * 100).toFixed(1) });
    const maxTenant = sorted[0];
    const maxPct = maxTenant ? ((maxTenant[1] / total) * 100) : 0;
    return { data: top5, total, maxTenant: maxTenant?.[0], maxPct };
  }, [snapshot]);

  // Receita de aluguel da competência por contrato ativo (base dos donuts)
  const revenueContracts = useMemo(() => {
    return mockTenantContracts
      .filter(c => portfolioBuildingIds.has(c.building_id) && c.status === 'active' && c.tenant_name && c.price_per_m2)
      .map(c => {
        const building = portfolioBuildings.find(b => b.id === c.building_id);
        return {
          id: c.id,
          tenant: c.tenant_name!,
          unit: c.unit_id,
          asset: building?.short_name || building?.name || '',
          state: building?.state || '—',
          nature: c.lease_nature === 'atipico' ? 'Atípico' : 'Típico',
          segment: c.tenant_segment || 'Não informado',
          areaM2: c.area_m2,
          revenue: c.area_m2 * (c.price_per_m2 || 0),
        };
      });
  }, [snapshot]);

  const groupRevenue = (key: 'nature' | 'segment' | 'state') => {
    const totals: Record<string, number> = {};
    revenueContracts.forEach(c => { totals[c[key]] = (totals[c[key]] || 0) + c.revenue; });
    const total = Object.values(totals).reduce((s, v) => s + v, 0);
    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value, pct: total > 0 ? (value / total) * 100 : 0 }));
  };

  const revenueByNature = useMemo(() => groupRevenue('nature'), [revenueContracts]);
  const revenueBySegment = useMemo(() => groupRevenue('segment'), [revenueContracts]);
  // Estado usa a receita integral dos ativos, inclusive aqueles ainda sem contratos
  // individualizados na base (como Guaíba/RS e Teleporto/RJ).
  const revenueByState = useMemo(() => {
    const totals = portfolioBuildings.reduce<Record<string, number>>((acc, building) => {
      const state = building.state || "—";
      acc[state] = (acc[state] || 0) + (building.monthly_revenue || 0);
      return acc;
    }, {});
    const total = Object.values(totals).reduce((sum, value) => sum + value, 0);
    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value, pct: total > 0 ? (value / total) * 100 : 0 }));
  }, [portfolioBuildings]);

  const [breakdownFilter, setBreakdownFilter] = useState<{ key: 'nature' | 'segment' | 'state'; value: string } | null>(null);
  const breakdownContracts = breakdownFilter
    ? revenueContracts.filter(c => c[breakdownFilter.key] === breakdownFilter.value)
    : [];
  const breakdownTitles: Record<'nature' | 'segment' | 'state', string> = {
    nature: 'Tipo de Contrato',
    segment: 'Segmento de Atuação',
    state: 'Estado',
  };

  const DonutCard = ({
    title, data, filterKey,
  }: { title: string; data: { name: string; value: number; pct: number }[]; filterKey: 'nature' | 'segment' | 'state' }) => (
    <div className="rounded-lg border p-3">
      <h5 className="text-xs font-medium text-muted-foreground mb-2">{title}</h5>
      <ResponsiveContainer width="100%" height={170}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={38}
            outerRadius={62}
            paddingAngle={2}
            onClick={(entry: any) => setBreakdownFilter({ key: filterKey, value: entry?.name })}
          >
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} className="cursor-pointer" />)}
          </Pie>
          <Tooltip formatter={(v: number) => fmt(v)} />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-1 mt-1">
        {data.map((d, i) => (
          <button
            key={d.name}
            onClick={() => setBreakdownFilter({ key: filterKey, value: d.name })}
            className={`w-full flex items-center gap-2 text-left text-[11px] rounded px-1 py-0.5 hover:bg-muted ${breakdownFilter?.key === filterKey && breakdownFilter.value === d.name ? 'bg-muted font-medium' : ''}`}
          >
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
            <span className="flex-1 truncate">{d.name}</span>
            <span className="text-muted-foreground">{d.pct.toFixed(1)}%</span>
          </button>
        ))}
      </div>
    </div>
  );



  // Timeline data — stacked bars by month for next 18 months
  const timelineData = useMemo(() => {
    const now = new Date();
    const buildingIds = portfolioBuildings.map(b => b.id);
    const contracts = mockTenantContracts.filter(c => c.status === 'active' && c.contract_end && buildingIds.includes(c.building_id));

    return Array.from({ length: 18 }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const mes = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      const expiring = contracts.filter(c => {
        const end = new Date(c.contract_end!);
        return end.getMonth() === date.getMonth() && end.getFullYear() === date.getFullYear();
      });
      const glaExpirando = expiring.reduce((sum, c) => sum + c.area_m2, 0);
      let criticos = 0, atencao = 0, saudavel = 0;
      expiring.forEach(c => {
        const mLeft = Math.round((new Date(c.contract_end!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30));
        if (mLeft < 6) criticos++;
        else if (mLeft < 12) atencao++;
        else saudavel++;
      });
      const acao = criticos > 0 ? 'Renovação urgente' : atencao > 0 ? 'Iniciar negociação' : saudavel > 0 ? 'Monitorar' : '—';
      return { mes, criticos, atencao, saudavel, glaExpirando, acao };
    });
  }, [snapshot]);

  const timelineWithExpiries = timelineData.filter(d => d.criticos + d.atencao + d.saudavel > 0);

  // FIX 3: Gantt with expired contracts separated
  const ganttData = useMemo(() => {
    const now = new Date();
    const contracts = mockTenantContracts.filter(c => portfolioBuildingIds.has(c.building_id) && c.contract_end && c.tenant_name && c.status !== 'vacant');
    return contracts.map(c => {
      const building = portfolioBuildings.find(b => b.id === c.building_id);
      const endDate = new Date(c.contract_end!);
      const diffMs = endDate.getTime() - now.getTime();
      const monthsLeft = Math.round(diffMs / (1000 * 60 * 60 * 24 * 30));
      const vencido = monthsLeft < 0;
      const diasVencido = vencido ? Math.abs(Math.round(diffMs / (1000 * 60 * 60 * 24))) : 0;
      const health = getContractHealth(c.contract_end!);
      return {
        name: `${c.tenant_name} — ${c.unit_id}`,
        building: building?.short_name || building?.name || '',
        endDate: endDate.toLocaleDateString('pt-BR'),
        monthsLeft: Math.max(monthsLeft, 0),
        totalMonths: 24,
        fill: vencido ? '#EF4444' : healthBarColors[health],
        health,
        vencido,
        diasVencido,
        areaM2: c.area_m2,
      };
    }).sort((a, b) => a.monthsLeft - b.monthsLeft);
  }, [snapshot]);

  const contratosVencidos = ganttData.filter(c => c.vencido);
  const contratosAtivos = ganttData.filter(c => !c.vencido);

  // FIX 4: Timeline table with expired contracts and contract column
  const timelineTableData = useMemo(() => {
    const now = new Date();
    const buildingIds = portfolioBuildings.map(b => b.id);
    const contracts = mockTenantContracts.filter(c => c.contract_end && c.tenant_name && buildingIds.includes(c.building_id) && c.status !== 'vacant');

    // Expired contracts
    const expired = contracts.filter(c => new Date(c.contract_end!).getTime() < now.getTime()).map(c => {
      const building = portfolioBuildings.find(b => b.id === c.building_id);
      return {
        mes: 'Vencido',
        contrato: `${c.tenant_name} — ${c.unit_id} (${building?.short_name || ''})`,
        gla: c.area_m2,
        acao: '⚡ Renovação imediata',
        isExpired: true,
      };
    });

    // Future by month
    const future: typeof expired = [];
    timelineWithExpiries.forEach(d => {
      const date = new Date();
      // Find matching contracts for this month
      const monthContracts = contracts.filter(c => {
        const end = new Date(c.contract_end!);
        const mesStr = end.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        return mesStr === d.mes && end.getTime() >= now.getTime();
      });
      if (monthContracts.length > 0) {
        monthContracts.forEach(c => {
          const building = portfolioBuildings.find(b => b.id === c.building_id);
          future.push({
            mes: d.mes,
            contrato: `${c.tenant_name} — ${c.unit_id} (${building?.short_name || ''})`,
            gla: c.area_m2,
            acao: d.acao,
            isExpired: false,
          });
        });
      } else {
        future.push({
          mes: d.mes,
          contrato: '—',
          gla: d.glaExpirando,
          acao: d.acao,
          isExpired: false,
        });
      }
    });

    return [...expired, ...future];
  }, [snapshot, timelineWithExpiries]);

  // R$/m² comparison — per asset (default) or aggregated by building
  const pricingData = useMemo(() => {
    const data = portfolioBuildings.map(b => {
      const contracts = mockTenantContracts.filter(c => c.building_id === b.id && c.status === 'active' && c.price_per_m2);
      const totalArea = contracts.reduce((s, c) => s + c.area_m2, 0);
      const totalRevenue = contracts.reduce((s, c) => s + c.area_m2 * (c.price_per_m2 || 0), 0);

      let avgPrice: number;
      if (totalArea > 0) {
        avgPrice = totalRevenue / totalArea;
      } else if (b.monthly_revenue && b.occupancy_pct && b.gla_m2) {
        const occupiedArea = b.gla_m2 * (b.occupancy_pct / 100);
        avgPrice = occupiedArea > 0 ? b.monthly_revenue / occupiedArea : 0;
      } else {
        avgPrice = 0;
      }

      const glaOccupied = totalArea > 0 ? totalArea : Math.round((b.gla_m2 || 0) * ((b.occupancy_pct || 90) / 100));
      const revenue = totalRevenue > 0 ? totalRevenue : (b.monthly_revenue || 0);

      return {
        name: b.short_name || b.name,
        pricePerM2: Math.round(avgPrice),
        glaOccupied,
        revenue,
      };
    }).sort((a, b) => b.pricePerM2 - a.pricePerM2);

    const totalArea = data.reduce((s, d) => s + d.glaOccupied, 0);
    const totalRev = data.reduce((s, d) => s + d.revenue, 0);
    const avgPortfolio = totalArea > 0 ? Math.round(totalRev / totalArea) : 0;

    const best = data.reduce((a, b) => a.pricePerM2 > b.pricePerM2 ? a : b, data[0]);
    const belowBenchmark = data.filter(d => d.pricePerM2 < mercadoRef && d.pricePerM2 > 0);
    const upsideTotal = belowBenchmark.reduce((sum, d) => sum + (mercadoRef - d.pricePerM2) * d.glaOccupied, 0);

    return { data, avgPortfolio, best, belowBenchmark: belowBenchmark.length, upsideTotal };
  }, [snapshot]);

  // Tenant-level R$/m² for the selected asset
  const assetTenantPricing = useMemo(() => {
    if (pricingAssetId === 'all') return null;
    const building = portfolioBuildings.find(b => b.id === pricingAssetId);
    if (!building) return null;
    const contracts = mockTenantContracts
      .filter(c => c.building_id === pricingAssetId && c.status === 'active' && c.price_per_m2 && c.tenant_name)
      .map(c => ({
        name: c.tenant_name!,
        unit: c.unit_id,
        pricePerM2: c.price_per_m2!,
        areaM2: c.area_m2,
        monthly: c.area_m2 * (c.price_per_m2 || 0),
      }))
      .sort((a, b) => b.pricePerM2 - a.pricePerM2);
    const totalArea = contracts.reduce((s, c) => s + c.areaM2, 0);
    const totalRevenue = contracts.reduce((s, c) => s + c.monthly, 0);
    const avgAsset = totalArea > 0 ? Math.round(totalRevenue / totalArea) : 0;
    const benchmark = building.id === 'b12' ? 110 : mercadoRef;
    const best = contracts[0];
    const worst = contracts[contracts.length - 1];
    const belowBenchmark = contracts.filter(c => c.pricePerM2 < benchmark).length;
    const upside = contracts.reduce((s, c) => s + Math.max(0, (benchmark - c.pricePerM2)) * c.areaM2, 0);
    return { building, contracts, totalArea, totalRevenue, avgAsset, benchmark, best, worst, belowBenchmark, upside };
  }, [snapshot, pricingAssetId]);


  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">📊 Análise do Portfólio</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="revenue">
          <TabsList className="mb-4">
            <TabsTrigger value="revenue">Receita & Ocupação</TabsTrigger>
            <TabsTrigger value="timeline">Timeline de Vencimentos</TabsTrigger>
            <TabsTrigger value="pricing">Comparativo R$/m²</TabsTrigger>
          </TabsList>

          {/* Tab A - Revenue & Occupancy */}
          <TabsContent value="revenue">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3">
                <h4 className="text-sm font-medium mb-3 text-muted-foreground">Receita Mensal por Ativo</h4>
                <div id="chart-receita-edificio">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueData} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} fontSize={11} />
                    <YAxis type="category" dataKey="name" width={80} fontSize={11} />
                    <Tooltip formatter={(v: number) => fmt(v)} labelStyle={{ fontWeight: 600 }} />
                    <Bar dataKey="revenue" name="Receita" radius={[0, 4, 4, 0]}>
                      {revenueData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                </div>
              </div>
              <div className="lg:col-span-2">
                <h4 className="text-sm font-medium mb-3 text-muted-foreground">Concentração da Receita por Locatário</h4>
                <div id="chart-tenant-concentration">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={tenantConcentration.data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2}>
                      {tenantConcentration.data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Legend formatter={(value) => {
                      const item = tenantConcentration.data.find(d => d.name === value);
                      return <span className="text-xs">{value} ({item?.pct}%)</span>;
                    }} />
                  </PieChart>
                </ResponsiveContainer>
                </div>
                {tenantConcentration.maxPct > 30 ? (
                  <p className="text-xs text-amber-600 mt-2">⚠ {tenantConcentration.maxTenant} representa {tenantConcentration.maxPct.toFixed(1)}% da receita — concentração elevada</p>
                ) : (
                  <p className="text-xs text-emerald-600 mt-2">✅ {tenantConcentration.maxTenant} representa {tenantConcentration.maxPct.toFixed(1)}% da receita — dentro do limite</p>
                )}
              </div>
            </div>

            {/* Composição da receita de aluguel da competência */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <DonutCard title="Receita por Tipo de Contrato" data={revenueByNature} filterKey="nature" />
              <DonutCard title="Receita por Segmento de Atuação" data={revenueBySegment} filterKey="segment" />
              <DonutCard title="Receita por Estado" data={revenueByState} filterKey="state" />
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">
              Percentuais calculados pela participação na receita de aluguel da competência {competenciaLabel(competencia)}.
            </p>

            {breakdownFilter && (
              <div className="mt-4 rounded-lg border">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                  <div className="flex items-center gap-2">
                    <Building2 size={14} className="text-primary" />
                    <span className="text-sm font-medium">
                      {breakdownTitles[breakdownFilter.key]}: {breakdownFilter.value}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {breakdownContracts.length} contrato{breakdownContracts.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setBreakdownFilter(null)}>
                    Limpar filtro
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs text-left">Locatário</TableHead>
                        <TableHead className="text-xs text-left">Ativo</TableHead>
                        <TableHead className="text-xs text-left">Unidade</TableHead>
                        <TableHead className="text-xs text-left">Tipo</TableHead>
                        <TableHead className="text-xs text-left">Segmento</TableHead>
                        <TableHead className="text-xs text-left">UF</TableHead>
                        <TableHead className="text-xs text-right">Aluguel/mês</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {breakdownContracts.map(c => (
                        <TableRow key={c.id}>
                          <TableCell className="text-sm text-left font-medium">{c.tenant}</TableCell>
                          <TableCell className="text-sm text-left">{c.asset}</TableCell>
                          <TableCell className="text-sm text-left text-muted-foreground">{c.unit}</TableCell>
                          <TableCell className="text-sm text-left">{c.nature}</TableCell>
                          <TableCell className="text-sm text-left">{c.segment}</TableCell>
                          <TableCell className="text-sm text-left">{c.state}</TableCell>
                          <TableCell className="text-sm text-right">{fmt(c.revenue)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Tab B - Timeline */}
          <TabsContent value="timeline">
            <h4 className="text-sm font-medium mb-3 text-muted-foreground">Vencimentos — próximos 24 meses</h4>

            {/* FIX 3: Expired contracts section */}
            {contratosVencidos.length > 0 && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50/50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={16} className="text-red-600" />
                  <span className="text-sm font-semibold text-red-700">Ação Imediata — {contratosVencidos.length} contrato{contratosVencidos.length > 1 ? 's' : ''} vencido{contratosVencidos.length > 1 ? 's' : ''}</span>
                </div>
                <div className="space-y-2">
                  {contratosVencidos.map((c, i) => (
                    <div key={i} className="flex items-center justify-between bg-white/80 rounded-md px-3 py-2 border border-red-100">
                      <div>
                        <span className="text-sm font-medium">{c.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">({c.building})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Venceu: {c.endDate}</span>
                        <Badge variant="destructive" className="text-xs">VENCIDO há {c.diasVencido}d</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <ResponsiveContainer width="100%" height={Math.max(300, contratosAtivos.length * 32)}>
              <BarChart data={contratosAtivos} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 24]} tickFormatter={(v) => `${v}m`} fontSize={11} />
                <YAxis type="category" dataKey="name" width={180} fontSize={10} tick={{ fill: 'hsl(var(--foreground))' }} />
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-popover border rounded-md p-3 shadow-md text-sm">
                      <p className="font-semibold">{d.name}</p>
                      <p className="text-muted-foreground">{d.building} | Vence: {d.endDate}</p>
                      <p className={d.monthsLeft < 6 ? 'text-rose-600' : d.monthsLeft < 12 ? 'text-amber-600' : 'text-emerald-600'}>
                        {d.monthsLeft} meses restantes
                      </p>
                    </div>
                  );
                }} />
                <ReferenceLine x={0} stroke="hsl(var(--foreground))" strokeDasharray="4 4" label={{ value: 'Hoje', position: 'top', fontSize: 10 }} />
                <Bar dataKey="monthsLeft" name="Meses" radius={[0, 4, 4, 0]} barSize={18}>
                  {contratosAtivos.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Stacked bar chart */}
            <h4 className="text-sm font-medium mt-6 mb-3 text-muted-foreground">Contratos expirando por mês</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={timelineData} margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="mes" fontSize={10} />
                <YAxis fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="criticos" name="Críticos" stackId="a" fill="#ef4444" />
                <Bar dataKey="atencao" name="Atenção" stackId="a" fill="#f59e0b" />
                <Bar dataKey="saudavel" name="Saudável" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            {/* FIX 4: Timeline table with contract column and expired rows */}
            {timelineTableData.length > 0 && (
              <div className="mt-4 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs text-left">Mês</TableHead>
                      <TableHead className="text-xs text-left">Contrato</TableHead>
                      <TableHead className="text-xs text-right">GLA (m²)</TableHead>
                      <TableHead className="text-xs text-left">Ação Recomendada</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timelineTableData.map((d, i) => (
                      <TableRow key={i} className={d.isExpired ? 'bg-red-50/50' : ''}>
                        <TableCell className={`text-sm text-left ${d.isExpired ? 'text-red-600 font-semibold' : ''}`}>{d.mes}</TableCell>
                        <TableCell className="text-sm text-left">{d.contrato}</TableCell>
                        <TableCell className="text-sm text-right">{d.gla.toLocaleString('pt-BR')}</TableCell>
                        <TableCell className={`text-sm text-left ${d.isExpired ? 'text-red-600 font-bold' : ''}`}>{d.acao}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Tab C - Pricing per asset / per tenant */}
          <TabsContent value="pricing">
            {/* Asset selector */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-3 mb-4">
              <div className="flex-1 max-w-md">
                <Label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <Building2 size={13} /> Selecione o ativo para ver o R$/m² por locatário
                </Label>
                <Select value={pricingAssetId} onValueChange={setPricingAssetId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Visão consolidada — todos os ativos</SelectItem>
                    {portfolioBuildings.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.short_name || b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {assetTenantPricing && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{assetTenantPricing.contracts.length}</span> locatários ativos · GLA ocupado <span className="font-medium text-foreground">{assetTenantPricing.totalArea.toLocaleString('pt-BR')} m²</span>
                </div>
              )}
            </div>

            {assetTenantPricing ? (
              <>
                <h4 className="text-sm font-medium mb-3 text-muted-foreground">
                  R$/m² por Locatário — {assetTenantPricing.building.short_name || assetTenantPricing.building.name}
                </h4>
                <ResponsiveContainer width="100%" height={Math.max(280, assetTenantPricing.contracts.length * 40)}>
                  <BarChart data={assetTenantPricing.contracts} layout="vertical" margin={{ left: 10, right: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tickFormatter={(v) => `R$ ${v}`} fontSize={11} domain={[0, 'auto']} />
                    <YAxis type="category" dataKey="name" width={180} fontSize={11} />
                    <Tooltip formatter={(v: number, _n, p: any) => [`R$ ${v}/m²`, `${p.payload.unit} · ${p.payload.areaM2.toLocaleString('pt-BR')} m²`]} />
                    <ReferenceLine x={assetTenantPricing.benchmark} stroke="hsl(var(--destructive))" strokeDasharray="6 3" strokeWidth={2} label={{ value: `Referência R$ ${assetTenantPricing.benchmark}/m² — ${competenciaLabel(competencia)}`, position: 'top', fontSize: 10, fill: 'hsl(var(--destructive))' }} />
                    <ReferenceLine x={assetTenantPricing.avgAsset} stroke="#6b7280" strokeDasharray="3 3" label={{ value: `Média ativo R$ ${assetTenantPricing.avgAsset}/m²`, position: 'insideTopRight', fontSize: 10, fill: '#6b7280' }} />
                    <Bar dataKey="pricePerM2" name="R$/m²" radius={[0, 4, 4, 0]}>
                      {assetTenantPricing.contracts.map((entry, i) => (
                        <Cell key={i} fill={entry.pricePerM2 >= assetTenantPricing.benchmark ? 'hsl(var(--success))' : 'hsl(var(--primary))'} />
                      ))}
                      <LabelList dataKey="pricePerM2" position="right" formatter={(v: number) => `R$${v}/m²`} style={{ fontSize: 11, fill: '#374151' }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                  {assetTenantPricing.best && (
                    <div className="rounded-lg border p-3 bg-emerald-50/50">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp size={14} className="text-emerald-600" />
                        <span className="text-xs font-medium text-emerald-700">Maior R$/m²</span>
                      </div>
                      <p className="text-sm font-semibold">{assetTenantPricing.best.name}</p>
                      <p className="text-xs text-muted-foreground">R$ {assetTenantPricing.best.pricePerM2}/m² · {assetTenantPricing.best.unit}</p>
                    </div>
                  )}
                  {assetTenantPricing.worst && (
                    <div className="rounded-lg border p-3 bg-amber-50/50">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle size={14} className="text-amber-600" />
                        <span className="text-xs font-medium text-amber-700">Menor R$/m²</span>
                      </div>
                      <p className="text-sm font-semibold">{assetTenantPricing.worst.name}</p>
                      <p className="text-xs text-muted-foreground">R$ {assetTenantPricing.worst.pricePerM2}/m² · {assetTenantPricing.worst.unit}</p>
                    </div>
                  )}
                  <div className="rounded-lg border p-3 bg-primary/5">
                    <div className="flex items-center gap-2 mb-1">
                      <ArrowUp size={14} className="text-primary" />
                      <span className="text-xs font-medium text-primary">Upside até Mercado</span>
                    </div>
                    <p className="text-sm font-semibold">{fmt(assetTenantPricing.upside)}/mês</p>
                    <p className="text-xs text-muted-foreground">{assetTenantPricing.belowBenchmark} locatário{assetTenantPricing.belowBenchmark !== 1 ? 's' : ''} abaixo de R$ {assetTenantPricing.benchmark}/m²</p>
                  </div>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs text-left">Locatário</TableHead>
                        <TableHead className="text-xs text-left">Unidade</TableHead>
                        <TableHead className="text-xs text-right">Área (m²)</TableHead>
                        <TableHead className="text-xs text-right">R$/m²</TableHead>
                        <TableHead className="text-xs text-right">Aluguel/mês</TableHead>
                        <TableHead className="text-xs text-right">vs. Média Ativo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assetTenantPricing.contracts.map(c => {
                        const diff = c.pricePerM2 - assetTenantPricing.avgAsset;
                        const diffPct = assetTenantPricing.avgAsset > 0 ? (diff / assetTenantPricing.avgAsset) * 100 : 0;
                        return (
                          <TableRow key={`${c.name}-${c.unit}`}>
                            <TableCell className="text-sm text-left font-medium">{c.name}</TableCell>
                            <TableCell className="text-sm text-left text-muted-foreground">{c.unit}</TableCell>
                            <TableCell className="text-sm text-right">{c.areaM2.toLocaleString('pt-BR')}</TableCell>
                            <TableCell className={`text-sm text-right font-semibold ${c.pricePerM2 < assetTenantPricing.benchmark ? 'text-amber-600' : 'text-emerald-600'}`}>R$ {c.pricePerM2}/m²</TableCell>
                            <TableCell className="text-sm text-right">{fmt(c.monthly)}</TableCell>
                            <TableCell className={`text-xs text-right ${diff >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {diff >= 0 ? '+' : ''}{diff.toFixed(0)} ({diffPct >= 0 ? '+' : ''}{diffPct.toFixed(1)}%)
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : (
              <>
                <h4 className="text-sm font-medium mb-3 text-muted-foreground">R$/m² Médio por Ativo</h4>
                <ResponsiveContainer width="100%" height={Math.max(300, pricingData.data.length * 40)}>
                  <BarChart data={pricingData.data} layout="vertical" margin={{ left: 10, right: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tickFormatter={(v) => `R$ ${v}`} fontSize={11} domain={[0, 'auto']} />
                    <YAxis type="category" dataKey="name" width={140} fontSize={11} />
                    <Tooltip formatter={(v: number) => `R$ ${v}/m²`} />
                    <ReferenceLine x={mercadoRef} stroke="#EF4444" strokeDasharray="6 3" strokeWidth={2} label={{ value: `Mercado R$ ${mercadoRef}/m²`, position: 'top', fontSize: 10, fill: '#EF4444' }} />
                    <Bar dataKey="pricePerM2" name="R$/m²" fill="#3B82F6" radius={[0, 4, 4, 0]}>
                      {pricingData.data.map((entry, i) => (
                        <Cell key={i} fill={entry.pricePerM2 >= mercadoRef ? '#10b981' : '#3B82F6'} />
                      ))}
                      <LabelList dataKey="pricePerM2" position="right" formatter={(v: number) => `R$${v}/m²`} style={{ fontSize: 11, fill: '#374151' }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                  {pricingData.best && (
                    <div className="rounded-lg border p-3 bg-emerald-50/50">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp size={14} className="text-emerald-600" />
                        <span className="text-xs font-medium text-emerald-700">Melhor desempenho</span>
                      </div>
                      <p className="text-sm font-semibold">{pricingData.best.name}</p>
                      <p className="text-xs text-muted-foreground">R$ {pricingData.best.pricePerM2}/m²</p>
                    </div>
                  )}
                  <div className="rounded-lg border p-3 bg-amber-50/50">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle size={14} className="text-amber-600" />
                      <span className="text-xs font-medium text-amber-700">Abaixo do Mercado</span>
                    </div>
                    <p className="text-sm font-semibold">{pricingData.belowBenchmark} ativo{pricingData.belowBenchmark !== 1 ? 's' : ''}</p>
                    <p className="text-xs text-muted-foreground">Mercado: R$ {mercadoRef}/m² · {competenciaLabel(competencia)}</p>
                  </div>
                  <div className="rounded-lg border p-3 bg-primary/5">
                    <div className="flex items-center gap-2 mb-1">
                      <ArrowUp size={14} className="text-primary" />
                      <span className="text-xs font-medium text-primary">Upside potencial</span>
                    </div>
                    <p className="text-sm font-semibold">{fmt(pricingData.upsideTotal)}/mês</p>
                    <p className="text-xs text-muted-foreground">Se todos chegarem ao valor de mercado</p>
                  </div>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs text-left">Ativo</TableHead>
                        <TableHead className="text-xs text-right">R$/m² médio</TableHead>
                        <TableHead className="text-xs text-right">GLA ocupado</TableHead>
                        <TableHead className="text-xs text-right">Receita total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pricingData.data.map(d => (
                        <TableRow key={d.name}>
                          <TableCell className="text-sm text-left">{d.name}</TableCell>
                          <TableCell className={`text-sm text-right ${d.pricePerM2 < mercadoRef ? 'text-amber-600' : 'text-emerald-600'}`}>R$ {d.pricePerM2}/m²</TableCell>
                          <TableCell className="text-sm text-right">{d.glaOccupied.toLocaleString('pt-BR')} m²</TableCell>
                          <TableCell className="text-sm text-right">{fmt(d.revenue)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PortfolioAnalytics;
