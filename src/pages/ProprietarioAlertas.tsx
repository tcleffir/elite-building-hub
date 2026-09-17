import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Download } from "lucide-react";
import { getHGRE11PortfolioBuildings, mockTenantContracts, mockBuildingDocuments } from "@/lib/mock-data";
import { getContractHealth, getDocumentHealth, daysUntil, healthColors, HealthStatus } from "@/lib/health-utils";
import { toast } from "sonner";

interface Alert {
  severity: HealthStatus;
  type: string;
  building: string;
  item: string;
  daysLeft: number;
}

const ProprietarioAlertas = () => {
  const [filterType, setFilterType] = useState('all');
  const portfolioBuildings = getHGRE11PortfolioBuildings();
  const portfolioBuildingIds = new Set(portfolioBuildings.map((b) => b.id));

  const allAlerts: Alert[] = useMemo(() => {
    const contractAlerts = mockTenantContracts
      .filter(c => portfolioBuildingIds.has(c.building_id) && c.status === 'active' && c.contract_end)
      .map(c => {
        const health = getContractHealth(c.contract_end!);
        const building = portfolioBuildings.find(b => b.id === c.building_id);
        return { severity: health, type: 'Contrato', building: building?.name || '', item: `${c.unit_id} — ${c.tenant_name}`, daysLeft: daysUntil(c.contract_end!) };
      })
      .filter(a => a.severity !== 'healthy');

    const docAlerts = mockBuildingDocuments.filter(d => portfolioBuildingIds.has(d.building_id)).map(d => {
      const health = getDocumentHealth(d.valid_until);
      const building = portfolioBuildings.find(b => b.id === d.building_id);
      return { severity: health, type: 'Documento', building: building?.name || '', item: d.doc_name, daysLeft: daysUntil(d.valid_until) };
    }).filter(a => a.severity !== 'healthy');

    return [...contractAlerts, ...docAlerts].sort((a, b) => {
      const order: Record<HealthStatus, number> = { critical: 0, warning: 1, healthy: 2 };
      return order[a.severity] - order[b.severity] || a.daysLeft - b.daysLeft;
    });
  }, []);

  const filtered = filterType === 'all' ? allAlerts : allAlerts.filter(a => a.type === filterType);
  const types = ['all', ...Array.from(new Set(allAlerts.map(a => a.type)))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Alertas do Portfólio</h1>
          <p className="text-sm text-muted-foreground">{allAlerts.length} alertas ativos</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => toast.info("Exportação disponível em breve")}>
          <Download size={14} /> Exportar lista
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {types.map(t => (
          <Button key={t} variant={filterType === t ? 'default' : 'outline'} size="sm" onClick={() => setFilterType(t)} className="text-xs">
            {t === 'all' ? 'Todos' : t}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0 divide-y">
          {filtered.map((alert, i) => (
            <div key={i} className="px-5 py-3 flex items-center gap-3 hover:bg-muted/50 cursor-pointer group">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${healthColors[alert.severity].dot}`} />
              <span className={`text-xs font-medium w-20 shrink-0 ${healthColors[alert.severity].text}`}>{alert.type}</span>
              <span className="text-sm text-foreground shrink-0">{alert.building}</span>
              <span className="text-sm text-muted-foreground flex-1 truncate">{alert.item}</span>
              <span className={`text-xs font-medium whitespace-nowrap ${healthColors[alert.severity].text}`}>
                {alert.daysLeft > 0 ? `${alert.daysLeft}d restantes` : `Vencido há ${Math.abs(alert.daysLeft)}d`}
              </span>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">Nenhum alerta encontrado.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProprietarioAlertas;
