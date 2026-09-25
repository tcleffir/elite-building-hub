import { useState } from "react";
import { Plus, Radio, Wifi, WifiOff, PenLine, X, ChevronRight, AlertTriangle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  seedMeters, generateSparkline, generateReadings, getMeterAlerts,
  UtilityMeter, UtilityReading, MeterType, MeterStatus,
  meterTypeConfig, meterStatusConfig,
} from "@/lib/telemetry-data";
import { tenantDirectory } from "@/lib/packages-data";

const ESGTelemetry = () => {
  const [meters, setMeters] = useState<UtilityMeter[]>(seedMeters);
  const [showAddMeter, setShowAddMeter] = useState(false);
  const [showAddReading, setShowAddReading] = useState<string | null>(null); // meterId
  const [selectedMeter, setSelectedMeter] = useState<UtilityMeter | null>(null);
  const [historyPeriod, setHistoryPeriod] = useState<'30d' | '90d' | '12m'>('12m');

  // Form states for new meter
  const [newMeter, setNewMeter] = useState({
    name: '', type: 'energy' as MeterType, unit: 'kWh', location: '',
    linkedTenant: false, tenantId: '', integrationType: 'manual' as 'manual' | 'api',
    apiEndpoint: '', readingFrequency: 'monthly' as 'daily' | 'weekly' | 'monthly',
  });

  // Form states for reading
  const [newReading, setNewReading] = useState({ value: '', observation: '' });

  const alerts = getMeterAlerts(meters);
  const metersByType = {
    energy: meters.filter(m => m.type === 'energy'),
    water: meters.filter(m => m.type === 'water'),
    gas: meters.filter(m => m.type === 'gas'),
  };

  const handleAddMeter = () => {
    const id = `mtr-${Date.now()}`;
    const tenant = tenantDirectory.find(t => t.id === newMeter.tenantId);
    const meter: UtilityMeter = {
      id, buildingId: 'b12', name: newMeter.name, type: newMeter.type,
      unit: newMeter.unit, location: newMeter.location,
      tenantId: tenant?.id, tenantName: tenant?.company,
      integrationType: newMeter.integrationType,
      apiEndpoint: newMeter.integrationType === 'api' ? newMeter.apiEndpoint : undefined,
      readingFrequency: newMeter.readingFrequency,
      lastReadingValue: 0, lastReadingAt: new Date(),
      status: 'manual', isActive: true, createdAt: new Date(),
    };
    setMeters(prev => [...prev, meter]);
    setShowAddMeter(false);
    setNewMeter({ name: '', type: 'energy', unit: 'kWh', location: '', linkedTenant: false, tenantId: '', integrationType: 'manual', apiEndpoint: '', readingFrequency: 'monthly' });
  };

  const handleAddReading = () => {
    if (!showAddReading) return;
    const val = parseFloat(newReading.value);
    if (isNaN(val)) return;
    setMeters(prev => prev.map(m => m.id === showAddReading ? { ...m, lastReadingValue: val, lastReadingAt: new Date(), status: 'manual' as MeterStatus } : m));
    setShowAddReading(null);
    setNewReading({ value: '', observation: '' });
  };

  const renderMeterCard = (meter: UtilityMeter) => {
    const typeConf = meterTypeConfig[meter.type];
    const statusConf = meterStatusConfig[meter.status];
    const sparkline = generateSparkline(meter.lastReadingValue).map((v, i) => ({ i, v }));

    return (
      <div key={meter.id} className="bg-card rounded-2xl p-4 premium-shadow animate-fade-in border border-border/50 hover:shadow-lg transition-all">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{meter.name}</p>
            <p className="text-xs text-muted-foreground">{meter.location}{meter.tenantName ? ` • ${meter.tenantName}` : ''}</p>
          </div>
          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusConf.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusConf.dot} ${meter.status === 'online' ? 'animate-pulse' : ''}`} />
            {statusConf.label}
          </span>
        </div>

        {/* Current reading */}
        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-2xl font-bold text-foreground tabular-nums">{meter.lastReadingValue.toLocaleString('pt-BR')}</span>
          <span className="text-xs text-muted-foreground">{typeConf.unit}</span>
        </div>
        <p className="text-[10px] text-muted-foreground mb-2">
          Última leitura: {meter.lastReadingAt.toLocaleDateString('pt-BR')} {meter.lastReadingAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </p>

        {/* Sparkline */}
        <div className="h-10 mb-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkline}>
              <Line type="monotone" dataKey="v" stroke={typeConf.color} strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setShowAddReading(meter.id)}>
            <PenLine size={12} /> Inserir Leitura
          </Button>
          <Button variant="ghost" size="sm" className="text-xs text-interactive" onClick={() => setSelectedMeter(meter)}>
            Histórico <ChevronRight size={12} />
          </Button>
        </div>
      </div>
    );
  };

  const historyData = selectedMeter ? generateReadings(selectedMeter.id, selectedMeter.lastReadingValue,
    historyPeriod === '30d' ? 30 : historyPeriod === '90d' ? 12 : 12
  ).map(r => ({
    date: r.readAt.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
    value: r.value,
    type: r.inputType,
    insertedBy: r.insertedBy || '—',
    variation: '',
  })) : [];

  // Add variation
  for (let i = 1; i < historyData.length; i++) {
    const pct = ((historyData[i].value - historyData[i - 1].value) / historyData[i - 1].value * 100).toFixed(1);
    historyData[i].variation = `${Number(pct) >= 0 ? '+' : ''}${pct}%`;
  }

  return (
    <div className="space-y-6">
      {/* Header + Add */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Radio size={18} className="text-interactive" /> Medidores Cadastrados
        </h3>
        <Button size="sm" onClick={() => setShowAddMeter(true)}>
          <Plus size={14} /> Cadastrar Medidor
        </Button>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map(a => (
            <div key={a.meterId} className="flex items-center gap-3 p-3 rounded-xl bg-destructive/5 border border-destructive/10">
              <AlertTriangle size={16} className="text-destructive shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">{a.meterName}</p>
                <p className="text-xs text-muted-foreground">{a.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Meters by type */}
      {(['energy', 'water', 'gas'] as MeterType[]).map(type => {
        const items = metersByType[type];
        if (items.length === 0) return null;
        const conf = meterTypeConfig[type];
        return (
          <div key={type}>
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <span>{conf.icon}</span> {conf.label}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {items.map(renderMeterCard)}
            </div>
          </div>
        );
      })}

      {/* ── Add Meter Dialog ── */}
      <Dialog open={showAddMeter} onOpenChange={setShowAddMeter}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cadastrar Medidor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome do medidor *</Label>
              <Input value={newMeter.name} onChange={e => setNewMeter(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Sub-medidor 7º Andar" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo</Label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={newMeter.type} onChange={e => {
                  const t = e.target.value as MeterType;
                  setNewMeter(p => ({ ...p, type: t, unit: t === 'energy' ? 'kWh' : 'm³' }));
                }}>
                  <option value="energy">⚡ Energia</option>
                  <option value="water">💧 Água</option>
                  <option value="gas">🔥 Gás</option>
                </select>
              </div>
              <div>
                <Label>Unidade</Label>
                <Input value={newMeter.unit} readOnly className="bg-muted" />
              </div>
            </div>
            <div>
              <Label>Localização</Label>
              <Input value={newMeter.location} onChange={e => setNewMeter(p => ({ ...p, location: e.target.value }))} placeholder="Ex: 7º Andar" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="linked" checked={newMeter.linkedTenant} onChange={e => setNewMeter(p => ({ ...p, linkedTenant: e.target.checked }))} className="rounded" />
              <Label htmlFor="linked" className="text-sm">Vinculado a locatário</Label>
            </div>
            {newMeter.linkedTenant && (
              <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={newMeter.tenantId} onChange={e => setNewMeter(p => ({ ...p, tenantId: e.target.value }))}>
                <option value="">Selecionar locatário...</option>
                {tenantDirectory.map(t => <option key={t.id} value={t.id}>{t.company} — {t.floor}</option>)}
              </select>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Integração</Label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={newMeter.integrationType} onChange={e => setNewMeter(p => ({ ...p, integrationType: e.target.value as 'manual' | 'api' }))}>
                  <option value="manual">Manual</option>
                  <option value="api">API (futuro)</option>
                </select>
              </div>
              <div>
                <Label>Periodicidade</Label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={newMeter.readingFrequency} onChange={e => setNewMeter(p => ({ ...p, readingFrequency: e.target.value as 'daily' | 'weekly' | 'monthly' }))}>
                  <option value="daily">Diária</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensal</option>
                </select>
              </div>
            </div>
            <Button className="w-full" onClick={handleAddMeter} disabled={!newMeter.name}>
              Cadastrar Medidor
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Add Reading Dialog ── */}
      <Dialog open={!!showAddReading} onOpenChange={() => setShowAddReading(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Inserir Leitura Manual</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Medidor</Label>
              <p className="text-sm font-medium text-foreground">{meters.find(m => m.id === showAddReading)?.name}</p>
            </div>
            <div>
              <Label>Leitura *</Label>
              <Input type="number" value={newReading.value} onChange={e => setNewReading(p => ({ ...p, value: e.target.value }))} placeholder="Ex: 4832.5" />
            </div>
            <div>
              <Label>Observação</Label>
              <Textarea value={newReading.observation} onChange={e => setNewReading(p => ({ ...p, observation: e.target.value }))} placeholder="Ex: Leitura após manutenção" rows={2} />
            </div>
            <Button className="w-full" onClick={handleAddReading} disabled={!newReading.value}>
              Salvar Leitura
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── History Drawer ── */}
      <Sheet open={!!selectedMeter} onOpenChange={() => setSelectedMeter(null)}>
        <SheetContent side="center" className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {selectedMeter && <span>{meterTypeConfig[selectedMeter.type].icon}</span>}
              {selectedMeter?.name}
            </SheetTitle>
          </SheetHeader>
          {selectedMeter && (
            <div className="mt-4 space-y-4">
              <div className="flex gap-1 bg-muted rounded-lg p-0.5">
                {(['30d', '90d', '12m'] as const).map(p => (
                  <button key={p} onClick={() => setHistoryPeriod(p)} className={`px-3 py-1 text-xs rounded-md transition-colors ${historyPeriod === p ? 'bg-card text-foreground shadow-sm font-semibold' : 'text-muted-foreground'}`}>
                    {p === '30d' ? '30 dias' : p === '90d' ? '90 dias' : '12 meses'}
                  </button>
                ))}
              </div>

              {/* Chart */}
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={historyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" fontSize={10} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis fontSize={10} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '11px' }} />
                  <Line type="monotone" dataKey="value" stroke={meterTypeConfig[selectedMeter.type].color} strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2 text-xs font-semibold text-muted-foreground">Data</th>
                      <th className="text-right py-2 px-2 text-xs font-semibold text-muted-foreground">Leitura</th>
                      <th className="text-center py-2 px-2 text-xs font-semibold text-muted-foreground">Variação</th>
                      <th className="text-center py-2 px-2 text-xs font-semibold text-muted-foreground">Tipo</th>
                      <th className="text-left py-2 px-2 text-xs font-semibold text-muted-foreground">Inserido por</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyData.map((r, i) => (
                      <tr key={i} className="border-b border-border/30 hover:bg-muted/20">
                        <td className="py-2 px-2 text-xs">{r.date}</td>
                        <td className="py-2 px-2 text-right font-semibold tabular-nums">{r.value.toLocaleString('pt-BR')}</td>
                        <td className="py-2 px-2 text-center">
                          {r.variation && (
                            <span className={`text-xs font-semibold ${r.variation.startsWith('+') ? 'text-destructive' : 'text-success'}`}>{r.variation}</span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted font-semibold">{r.type === 'manual' ? 'Manual' : 'Auto'}</span>
                        </td>
                        <td className="py-2 px-2 text-xs text-muted-foreground">{r.insertedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ESGTelemetry;
