import { useMemo, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { mockTenantContracts, mockTickets, TenantContract } from "@/lib/mock-data";
import StackingPlan from "@/components/assets/StackingPlan";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getUnitStackingData } from "@/lib/stacking-plan-data";

/**
 * Mapa do Ativo (Super Admin / Administradora CBRE) — mesmo Stacking Plan
 * da visão da gestora (Natalia Landi), lendo a mesma base de contratos e
 * conjuntos. As duas visões conversam: mesmos ativos, conjuntos e números.
 */
const Edificio = () => {
  const { selectedBuilding } = useApp();
  const [selectedContract, setSelectedContract] = useState<TenantContract | null>(null);

  const contracts = useMemo(
    () => mockTenantContracts.filter((c) => c.building_id === selectedBuilding.id),
    [selectedBuilding.id]
  );
  const buildingTickets = useMemo(
    () => mockTickets.filter((t) => t.building_id === selectedBuilding.id && t.status !== "completed" && t.status !== "cancelled"),
    [selectedBuilding.id]
  );

  const totalUnits = contracts.length;
  const occupiedUnits = contracts.filter((c) => c.status !== "vacant").length;
  const vacantUnits = totalUnits - occupiedUnits;
  const areaLocada = contracts.filter((c) => c.status !== "vacant").reduce((s, c) => s + c.area_m2, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Mapa do Ativo</h1>
        <p className="text-sm text-muted-foreground">
          {selectedBuilding.name} — {selectedBuilding.total_floors} andares •{" "}
          {(selectedBuilding.gla_m2 || selectedBuilding.total_area_m2 || 0).toLocaleString("pt-BR")} m² GLA •{" "}
          {occupiedUnits}/{totalUnits} conjuntos ocupados
        </p>
      </div>

      <StackingPlan
        buildingName={selectedBuilding.name}
        totalFloors={selectedBuilding.total_floors}
        contracts={contracts}
        tickets={buildingTickets as never}
        levelLabel="andar"
        onOpenContract={(c) => setSelectedContract(c)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl p-5 premium-shadow text-center">
          <p className="text-3xl font-bold text-success">{occupiedUnits}</p>
          <p className="text-sm text-muted-foreground mt-1">Conjuntos Ocupados</p>
        </div>
        <div className="bg-card rounded-2xl p-5 premium-shadow text-center">
          <p className="text-3xl font-bold text-muted-foreground tabular-nums">{vacantUnits}</p>
          <p className="text-sm text-muted-foreground mt-1">Conjuntos Vagos</p>
        </div>
        <div className="bg-card rounded-2xl p-5 premium-shadow text-center">
          <p className="text-3xl font-bold text-interactive tabular-nums">{areaLocada.toLocaleString("pt-BR")}</p>
          <p className="text-sm text-muted-foreground mt-1">m² Locados</p>
        </div>
      </div>

      {/* Detalhe do conjunto */}
      <Sheet open={!!selectedContract} onOpenChange={(o) => !o && setSelectedContract(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selectedContract?.unit_id} — {selectedBuilding.name}</SheetTitle>
          </SheetHeader>
          {selectedContract && (
            <div className="mt-6 space-y-4 text-sm">
              {(() => {
                const d = getUnitStackingData(selectedContract);
                return (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-muted/50 rounded-xl p-3">
                        <p className="text-xs text-muted-foreground">Locatário</p>
                        <p className="font-semibold text-foreground">{selectedContract.tenant_name ?? "Vago"}</p>
                      </div>
                      <div className="bg-muted/50 rounded-xl p-3">
                        <p className="text-xs text-muted-foreground">Área (NBR / BOMA)</p>
                        <p className="font-semibold text-foreground">{d.areaNbr.toLocaleString("pt-BR")} / {d.areaBoma.toLocaleString("pt-BR")} m²</p>
                      </div>
                      <div className="bg-muted/50 rounded-xl p-3">
                        <p className="text-xs text-muted-foreground">Aluguel</p>
                        <p className="font-semibold text-foreground">{selectedContract.price_per_m2 ? `R$ ${selectedContract.price_per_m2}/m²` : "—"}</p>
                      </div>
                      <div className="bg-muted/50 rounded-xl p-3">
                        <p className="text-xs text-muted-foreground">Vigência</p>
                        <p className="font-semibold text-foreground">
                          {selectedContract.contract_start ? new Date(selectedContract.contract_start + "T00:00:00").toLocaleDateString("pt-BR") : "—"} — {selectedContract.contract_end ? new Date(selectedContract.contract_end + "T00:00:00").toLocaleDateString("pt-BR") : "—"}
                        </p>
                      </div>
                      <div className="bg-muted/50 rounded-xl p-3">
                        <p className="text-xs text-muted-foreground">Reajuste</p>
                        <p className="font-semibold text-foreground">{selectedContract.indice_reajuste ?? "—"} ({selectedContract.periodicidade_reajuste ?? "—"})</p>
                      </div>
                      <div className="bg-muted/50 rounded-xl p-3">
                        <p className="text-xs text-muted-foreground">Garantia</p>
                        <p className="font-semibold text-foreground">{d.garantiaModalidade}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Contato</p>
                      <p className="text-foreground">{d.contato.nome} — {d.contato.cargo}</p>
                      <p className="text-muted-foreground">{d.contato.email} • {d.contato.telefone}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Histórico do conjunto</p>
                      <ul className="space-y-2">
                        {d.historico.map((h, i) => (
                          <li key={i} className="flex gap-3">
                            <span className="text-muted-foreground tabular-nums shrink-0">{new Date(h.date + "T00:00:00").toLocaleDateString("pt-BR")}</span>
                            <span className="text-foreground"><strong>{h.tipo}:</strong> {h.descricao}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Edificio;
