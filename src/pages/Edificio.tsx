import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { mockFloorConfig, FloorConfig, mockTickets, mockContracts } from "@/lib/mock-data";
import { Building2, Users, FileText, Ticket, Construction, Zap, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatusBadge from "@/components/StatusBadge";

const floorStatusColors: Record<string, string> = {
  occupied: "bg-success/20 border-success text-success",
  partial: "bg-amber-100 border-amber-400 text-amber-700 dark:bg-amber-900/20 dark:border-amber-600 dark:text-amber-400",
  vacant: "bg-muted border-border text-muted-foreground",
  work: "bg-amber-200 border-amber-500 text-amber-800 dark:bg-amber-900/30 dark:border-amber-600 dark:text-amber-300",
  urgent: "bg-destructive/20 border-destructive text-destructive",
  building_use: "bg-interactive/10 border-interactive text-interactive",
};

const legendItems = [
  { status: 'occupied', label: 'Ocupado', color: 'bg-success/20 border-success' },
  { status: 'partial', label: 'Parcial', color: 'bg-amber-100 border-amber-400 dark:bg-amber-900/20 dark:border-amber-600' },
  { status: 'vacant', label: 'Vago', color: 'bg-muted border-border' },
  { status: 'work', label: 'Obra', color: 'bg-amber-200 border-amber-500 dark:bg-amber-900/30 dark:border-amber-600' },
  { status: 'building_use', label: 'Uso do Ativo', color: 'bg-interactive/10 border-interactive' },
];

const Edificio = () => {
  const { selectedBuilding } = useApp();
  const [selectedFloor, setSelectedFloor] = useState<FloorConfig | null>(null);
  const floors = mockFloorConfig;

  const corporateFloors = floors.filter(f => f.type === 'corporativo' || f.type === 'sala_reuniao');
  const occupiedCount = corporateFloors.filter(f => f.status === 'occupied').length;
  const partialCount = corporateFloors.filter(f => f.status === 'partial').length;
  const vacantCount = corporateFloors.filter(f => f.status === 'vacant').length;
  const totalEmployees = floors.reduce((sum, f) => sum + (f.employees || 0), 0);

  const getFloorLabel = (f: FloorConfig) => {
    if (f.type === 'subsolo') return f.name.split('(')[1]?.replace(')', '') || f.name;
    if (f.type === 'terreo') return 'TER';
    if (f.type === 'mezanino') return 'MEZ';
    if (f.type === 'sala_reuniao') return `${f.floor}º`;
    return `${f.floor}º`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Mapa do Ativo</h1>
        <p className="text-sm text-muted-foreground">{selectedBuilding.name} — Térreo + Mezanino + 2º ao 19º andar + 4 subsolos • {totalEmployees.toLocaleString('pt-BR')} pessoas</p>
      </div>

      <div className="flex flex-wrap gap-4">
        {legendItems.map(l => (
          <div key={l.status} className="flex items-center gap-2 text-sm">
            <div className={`w-4 h-4 rounded border ${l.color}`} />
            <span className="text-foreground">{l.label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-2xl p-6 premium-shadow animate-fade-in">
          <div className="flex flex-col items-center gap-1 max-w-lg mx-auto">
            <div className="w-full h-3 rounded-t-xl premium-gradient" />
            {floors.slice().reverse().map((floor) => (
              <div
                key={`${floor.type}-${floor.floor}`}
                className={`w-full flex items-center justify-between px-4 py-2 rounded-md border cursor-pointer hover:shadow-md transition-all text-sm ${floorStatusColors[floor.status]}`}
                onClick={() => setSelectedFloor(floor)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="font-bold w-10 text-xs shrink-0">{getFloorLabel(floor)}</span>
                  {floor.special_icon && <span className="shrink-0">{floor.special_icon}</span>}
                  <span className="font-medium text-xs truncate">{floor.tenant}</span>
                  {floor.employees != null && floor.employees > 0 && (
                    <span className="text-[10px] bg-foreground/5 px-1.5 py-0.5 rounded-full shrink-0">{floor.employees} 👥</span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {floor.tickets_count > 0 && <span className="text-xs bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-full">{floor.tickets_count} 🎫</span>}
                  {floor.works && floor.works.length > 0 && <Construction size={12} />}
                </div>
              </div>
            ))}
            <div className="w-full h-4 rounded-b-xl bg-foreground/10 flex items-center justify-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Base</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-card rounded-2xl p-5 premium-shadow text-center">
            <p className="text-3xl font-bold text-success">{occupiedCount}</p>
            <p className="text-sm text-muted-foreground mt-1">Andares Ocupados</p>
          </div>
          <div className="bg-card rounded-2xl p-5 premium-shadow text-center">
            <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{partialCount}</p>
            <p className="text-sm text-muted-foreground mt-1">Parcialmente Ocupados</p>
          </div>
          <div className="bg-card rounded-2xl p-5 premium-shadow text-center">
            <p className="text-3xl font-bold text-foreground tabular-nums">{totalEmployees.toLocaleString('pt-BR')}</p>
            <p className="text-sm text-muted-foreground mt-1">Pessoas no Ativo</p>
          </div>
        </div>
      </div>

      {/* Floor Detail Sheet */}
      <Sheet open={!!selectedFloor} onOpenChange={(v) => !v && setSelectedFloor(null)}>
        <SheetContent side="center" className="overflow-y-auto p-0">
          {selectedFloor && (
            <>
              <div className="sticky top-0 bg-card z-10 border-b p-5">
                <SheetHeader>
                  <SheetTitle className="text-left">{selectedFloor.name}</SheetTitle>
                </SheetHeader>
                <p className="text-xs text-muted-foreground mt-1">{selectedFloor.tenant} • {selectedFloor.area_m2.toLocaleString('pt-BR')} m²</p>
              </div>
              <Tabs defaultValue={selectedFloor.works && selectedFloor.works.length > 0 ? 'works' : 'general'}>
                <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-5 h-auto py-0">
                  <TabsTrigger value="general" className="rounded-none border-b-2 border-transparent data-[state=active]:border-interactive data-[state=active]:bg-transparent py-3 text-sm">Geral</TabsTrigger>
                  <TabsTrigger value="tenants" className="rounded-none border-b-2 border-transparent data-[state=active]:border-interactive data-[state=active]:bg-transparent py-3 text-sm">Locatários</TabsTrigger>
                  <TabsTrigger value="tickets" className="rounded-none border-b-2 border-transparent data-[state=active]:border-interactive data-[state=active]:bg-transparent py-3 text-sm">Chamados</TabsTrigger>
                  <TabsTrigger value="works" className="rounded-none border-b-2 border-transparent data-[state=active]:border-interactive data-[state=active]:bg-transparent py-3 text-sm">Obras</TabsTrigger>
                </TabsList>
                <TabsContent value="general" className="p-5 space-y-4 mt-0">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/50 rounded-xl p-4">
                      <p className="text-xs text-muted-foreground">Área Total</p>
                      <p className="text-lg font-bold">{selectedFloor.area_m2.toLocaleString('pt-BR')} m²</p>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-4">
                      <p className="text-xs text-muted-foreground">Tipo</p>
                      <p className="text-lg font-bold capitalize">{selectedFloor.type}</p>
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-4">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <StatusBadge status={selectedFloor.status === 'work' ? 'pending' : selectedFloor.status === 'occupied' ? 'active' : selectedFloor.status === 'vacant' ? 'terminated' : 'expiring'} />
                  </div>
                </TabsContent>
                <TabsContent value="tenants" className="p-5 mt-0">
                  {selectedFloor.tenants && selectedFloor.tenants.length > 0 ? (
                    <div className="space-y-3">
                      {selectedFloor.tenants.map((t, i) => (
                        <div key={i} className="bg-muted/50 rounded-xl p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-lg bg-interactive/20 flex items-center justify-center text-interactive font-bold text-sm">{t.name[0]}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">{t.name}</p>
                              <p className="text-xs text-muted-foreground">{t.suites} • {t.employees > 0 ? `${t.employees} pessoas` : '—'}</p>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p>📧 {t.email}</p>
                            {t.contact && <p>👤 {t.contact}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : selectedFloor.status === 'occupied' ? (
                    <div className="bg-muted/50 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-interactive/20 flex items-center justify-center text-interactive font-bold">{selectedFloor.tenant[0]}</div>
                        <div>
                          <p className="text-sm font-semibold">{selectedFloor.tenant}</p>
                          <p className="text-xs text-muted-foreground">{selectedFloor.area_m2} m²</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">Nenhum locatário neste andar</p>
                  )}
                </TabsContent>
                <TabsContent value="tickets" className="p-5 mt-0">
                  {mockTickets.filter(t => t.floor === selectedFloor.floor).length > 0 ? (
                    <div className="space-y-2">
                      {mockTickets.filter(t => t.floor === selectedFloor.floor).map(t => (
                        <div key={t.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                          <div>
                            <p className="text-sm font-medium">{t.id} — {t.title}</p>
                            <p className="text-xs text-muted-foreground">{t.category}</p>
                          </div>
                          <div className="flex gap-2">
                            <StatusBadge status={t.priority} type="priority" />
                            <StatusBadge status={t.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">Nenhum chamado neste andar</p>
                  )}
                </TabsContent>
                <TabsContent value="works" className="p-5 mt-0">
                  {selectedFloor.works && selectedFloor.works.length > 0 ? (
                    <div className="space-y-3">
                      {selectedFloor.works.map((w, i) => (
                        <div key={i} className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Construction size={16} className="text-amber-600 dark:text-amber-400" />
                            <p className="text-sm font-semibold">{w.title}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">Status: {w.status} • Previsão: {new Date(w.end_date).toLocaleDateString('pt-BR')}</p>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-amber-500" style={{ width: `${w.progress}%` }} />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{w.progress}% concluído</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">Nenhuma obra registrada</p>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Edificio;
