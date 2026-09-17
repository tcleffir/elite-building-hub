import { useNavigate } from "react-router-dom";
import { Building2, ChevronRight, AlertTriangle, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getHGRE11PortfolioBuildings, mockTenantContracts, mockBuildingDocuments } from "@/lib/mock-data";
import { getContractHealth, getDocumentHealth, getOccupancyStatus, healthColors, healthLabels } from "@/lib/health-utils";

const fmt = (v: number) => v >= 1000000 ? `R$ ${(v / 1000000).toFixed(2).replace('.', ',')}M` : `R$ ${v.toLocaleString('pt-BR')}`;

const Portfolio = () => {
  const navigate = useNavigate();
  const portfolioBuildings = getHGRE11PortfolioBuildings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Portfólio</h1>
        <p className="text-sm text-muted-foreground">Proprietário Asset Management — {portfolioBuildings.length} ativos</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {portfolioBuildings.map(b => {
          const occStatus = getOccupancyStatus(b.occupancy_pct || 0);
          const occColors = healthColors[occStatus];

          // Count alerts for this building
          const contractsForBuilding = mockTenantContracts.filter(c => c.building_id === b.id && c.status === 'active' && c.contract_end);
          const criticalContracts = contractsForBuilding.filter(c => getContractHealth(c.contract_end!) === 'critical').length;
          const warningContracts = contractsForBuilding.filter(c => getContractHealth(c.contract_end!) === 'warning').length;
          const docsForBuilding = mockBuildingDocuments.filter(d => d.building_id === b.id);
          const criticalDocs = docsForBuilding.filter(d => getDocumentHealth(d.valid_until) === 'critical').length;
          const warningDocs = docsForBuilding.filter(d => getDocumentHealth(d.valid_until) === 'warning').length;
          const hasAlerts = criticalContracts > 0 || warningContracts > 0 || criticalDocs > 0 || warningDocs > 0;

          return (
            <div key={b.id} className="bg-card rounded-xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-5 border-b flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 size={20} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{b.name}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin size={10} /> {b.address}
                    </p>
                  </div>
                </div>
                <Badge className={`${occColors.badge} text-xs whitespace-nowrap`}>
                  {b.occupancy_pct}% ocupação
                </Badge>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">GLA Total</p>
                    <p className="text-sm font-semibold">{(b.gla_m2 || 0).toLocaleString('pt-BR')} m²</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Ocupação</p>
                    <p className="text-sm font-semibold">{b.occupancy_pct}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">WAULT</p>
                    <p className="text-sm font-semibold">{b.wault_months ? `${(b.wault_months / 12).toFixed(1)} anos` : '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">NOI Mensal</p>
                    <p className="text-sm font-semibold">{fmt(b.monthly_noi || 0)}</p>
                  </div>
                </div>

                {/* Alerts */}
                <div className="flex flex-wrap gap-2">
                  {!hasAlerts && (
                    <span className="text-xs text-emerald-600">✅ Sem alertas</span>
                  )}
                  {criticalContracts > 0 && (
                    <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 text-[10px]">
                      🔴 {criticalContracts} contrato{criticalContracts > 1 ? 's' : ''} crítico{criticalContracts > 1 ? 's' : ''}
                    </Badge>
                  )}
                  {warningContracts > 0 && (
                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-[10px]">
                      🟡 {warningContracts} contrato{warningContracts > 1 ? 's' : ''} atenção
                    </Badge>
                  )}
                  {criticalDocs > 0 && (
                    <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 text-[10px]">
                      🔴 {criticalDocs} doc. urgente{criticalDocs > 1 ? 's' : ''}
                    </Badge>
                  )}
                  {warningDocs > 0 && (
                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-[10px]">
                      🟡 {warningDocs} doc. próxim{warningDocs > 1 ? 'os' : 'o'}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="border-t px-5 py-3 flex justify-end">
                <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate(`/portfolio/${b.id}`)}>
                  Ver Detalhes <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Portfolio;
