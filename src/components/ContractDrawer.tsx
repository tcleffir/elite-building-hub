import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import { Contract } from "@/lib/mock-data";
import { Download, FileText, Calendar, DollarSign, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface ContractDrawerProps {
  contract: Contract | null;
  open: boolean;
  onClose: () => void;
}

const ContractDrawer = ({ contract, open, onClose }: ContractDrawerProps) => {
  if (!contract) return null;

  const start = new Date(contract.start_date);
  const end = new Date(contract.end_date);
  const now = new Date();
  const totalDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  const elapsedDays = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  const progressPercent = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
  const daysRemaining = Math.max(0, Math.floor((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  const revenueData = contract.payments.map(p => ({
    month: p.month.split('-')[1] + '/' + p.month.split('-')[0].slice(2),
    value: p.value / 1000,
  }));

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="center" className="overflow-y-auto p-0">
        <div className="sticky top-0 bg-card z-10 border-b p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-mono text-muted-foreground">{contract.number}</span>
            <StatusBadge status={contract.status} />
          </div>
          <SheetHeader>
            <SheetTitle className="text-left text-lg">{contract.tenant_name}</SheetTitle>
          </SheetHeader>
          <p className="text-xs text-muted-foreground mt-1">CNPJ: {contract.cnpj}</p>
        </div>

        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-5 h-auto py-0">
            <TabsTrigger value="summary" className="rounded-none border-b-2 border-transparent data-[state=active]:border-interactive data-[state=active]:bg-transparent py-3 text-sm">Resumo</TabsTrigger>
            <TabsTrigger value="financial" className="rounded-none border-b-2 border-transparent data-[state=active]:border-interactive data-[state=active]:bg-transparent py-3 text-sm">Financeiro</TabsTrigger>
            <TabsTrigger value="documents" className="rounded-none border-b-2 border-transparent data-[state=active]:border-interactive data-[state=active]:bg-transparent py-3 text-sm">Documentos</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="p-5 space-y-5 mt-0">
            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={14} className="text-interactive" />
                  <span className="text-xs font-semibold text-muted-foreground">Vigência</span>
                </div>
                <p className="text-sm font-medium">{start.toLocaleDateString('pt-BR')} — {end.toLocaleDateString('pt-BR')}</p>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-2">
                  <div className="h-full rounded-full bg-interactive" style={{ width: `${progressPercent}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{daysRemaining} dias restantes</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign size={14} className="text-success" />
                  <span className="text-xs font-semibold text-muted-foreground">Valor Mensal</span>
                </div>
                <p className="text-lg font-bold text-foreground">R$ {contract.monthly_value.toLocaleString('pt-BR')}</p>
                <p className="text-xs text-muted-foreground">Índice: {contract.adjustment_index}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded-xl p-4">
                <span className="text-xs font-semibold text-muted-foreground">Andares</span>
                <p className="text-sm font-medium mt-1">{contract.floors.map(f => `${f}º`).join(', ')}</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-4">
                <span className="text-xs font-semibold text-muted-foreground">Área Locada</span>
                <p className="text-sm font-medium mt-1">{contract.area_m2.toLocaleString('pt-BR')} m²</p>
              </div>
            </div>

            <div className="bg-muted/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={14} className="text-amber-500" />
                <span className="text-xs font-semibold text-muted-foreground">Próximo Reajuste</span>
              </div>
              <p className="text-sm font-medium">{new Date(contract.next_adjustment).toLocaleDateString('pt-BR')} — {contract.adjustment_index}</p>
            </div>

            <div>
              <span className="text-xs font-semibold text-muted-foreground">Proprietário</span>
              <p className="text-sm font-medium mt-1">{contract.owner}</p>
            </div>
          </TabsContent>

          <TabsContent value="financial" className="p-5 space-y-5 mt-0">
            {/* Payments Table */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Histórico de Pagamentos</h4>
              <div className="space-y-2">
                {contract.payments.map((p, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <span className="text-sm">{p.month}</span>
                    <span className="text-sm font-medium">R$ {p.value.toLocaleString('pt-BR')}</span>
                    <StatusBadge status={p.status} />
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue Chart */}
            {revenueData.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-3">Receita Mensal (R$ mil)</h4>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" fontSize={11} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis fontSize={11} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                    <Bar dataKey="value" fill="hsl(var(--interactive))" radius={[4, 4, 0, 0]} name="Valor (R$ mil)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Adjustments */}
            {contract.adjustments.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-3">Histórico de Reajustes</h4>
                <div className="space-y-2">
                  {contract.adjustments.map((adj, i) => (
                    <div key={i} className="bg-muted/50 rounded-xl p-3">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">{new Date(adj.date).toLocaleDateString('pt-BR')}</span>
                        <span className="text-xs font-semibold text-success">+{adj.percentage}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {adj.index}: R$ {adj.value_before.toLocaleString('pt-BR')} → R$ {adj.value_after.toLocaleString('pt-BR')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="documents" className="p-5 space-y-3 mt-0">
            {contract.documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <FileText size={20} className="text-destructive" />
                  <div>
                    <p className="text-sm font-medium">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">{doc.size} • {new Date(doc.uploaded_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon"><Download size={16} /></Button>
              </div>
            ))}
            <Button variant="outline" className="w-full gap-2 mt-2"><FileText size={14} /> Upload de Documento</Button>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default ContractDrawer;
