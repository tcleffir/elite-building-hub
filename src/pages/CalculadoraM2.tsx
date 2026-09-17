import { useState } from "react";
import { Calculator, Users, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const occupancyTypes = [
  { value: 'open_space', label: 'Escritório Open Space', comfortable: 12, max: 9.3, emergency: 5 },
  { value: 'private', label: 'Escritório Privativo', comfortable: 15, max: 12, emergency: 6 },
  { value: 'meeting', label: 'Sala de Reunião', comfortable: 3, max: 2, emergency: 1.5 },
  { value: 'auditorium', label: 'Auditório / Evento', comfortable: 1, max: 0.65, emergency: 0.25 },
  { value: 'restaurant', label: 'Restaurante / Refeitório', comfortable: 2.5, max: 1.5, emergency: 1 },
  { value: 'gym', label: 'Academia / Ginásio', comfortable: 6, max: 4, emergency: 2.5 },
  { value: 'parking', label: 'Estacionamento (por vaga)', comfortable: 25, max: 20, emergency: 15 },
  { value: 'corridor', label: 'Corredor / Circulação', comfortable: 5, max: 3, emergency: 1.5 },
];

const CalculadoraM2 = () => {
  const [area, setArea] = useState<number>(500);
  const [type, setType] = useState('open_space');
  const [fixedPeople, setFixedPeople] = useState(30);
  const [dailyVisitors, setDailyVisitors] = useState(10);
  const [peakVisitors, setPeakVisitors] = useState(5);

  const config = occupancyTypes.find(t => t.value === type)!;
  const comfortable = Math.floor(area / config.comfortable);
  const maxRecommended = Math.floor(area / config.max);
  const emergencyCap = Math.floor(area / config.emergency);
  const currentTotal = fixedPeople + peakVisitors;
  const isOverCapacity = currentTotal > maxRecommended;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Calculadora de Pessoas por m²</h1>
        <p className="text-sm text-muted-foreground">Com base na NBR 9050 e padrões ABNT/CREA</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Building2 size={16} />Dados do Espaço</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Área total (m²)</label>
              <Input type="number" value={area} onChange={e => setArea(+e.target.value)} min={1} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Tipo de ocupação</label>
              <select value={type} onChange={e => setType(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm bg-card">
                {occupancyTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-3">
              <div>
                <label className="text-[10px] text-muted-foreground">Colaboradores fixos</label>
                <Input type="number" value={fixedPeople} onChange={e => setFixedPeople(+e.target.value)} min={0} />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">Visitantes/dia</label>
                <Input type="number" value={dailyVisitors} onChange={e => setDailyVisitors(+e.target.value)} min={0} />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">Pico simultâneo</label>
                <Input type="number" value={peakVisitors} onChange={e => setPeakVisitors(+e.target.value)} min={0} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-3">
            <Card className="border-success/30">
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-success">{comfortable}</p>
                <p className="text-xs text-muted-foreground mt-1">🟢 Confortável</p>
                <p className="text-[10px] text-muted-foreground">{config.comfortable} m²/pessoa</p>
              </CardContent>
            </Card>
            <Card className="border-amber-400/30">
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-amber-500">{maxRecommended}</p>
                <p className="text-xs text-muted-foreground mt-1">🟡 Máximo</p>
                <p className="text-[10px] text-muted-foreground">{config.max} m²/pessoa</p>
              </CardContent>
            </Card>
            <Card className="border-destructive/30">
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-destructive">{emergencyCap}</p>
                <p className="text-xs text-muted-foreground mt-1">🔴 Emergência</p>
                <p className="text-[10px] text-muted-foreground">{config.emergency} m²/pessoa</p>
              </CardContent>
            </Card>
          </div>

          <Card className={isOverCapacity ? 'border-destructive/50 bg-destructive/5' : 'border-success/50 bg-success/5'}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users size={20} className={isOverCapacity ? 'text-destructive' : 'text-success'} />
                <div>
                  <p className="text-sm font-semibold">Sua ocupação atual: <span className={isOverCapacity ? 'text-destructive' : 'text-success'}>{currentTotal} pessoas</span></p>
                  <p className="text-xs text-muted-foreground">
                    {isOverCapacity
                      ? `⚠️ Acima do limite máximo recomendado (${maxRecommended}) para ${area} m²`
                      : `✅ Dentro do limite recomendado para ${area} m²`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button variant="outline" className="w-full">Salvar no cadastro do andar</Button>
        </div>
      </div>
    </div>
  );
};

export default CalculadoraM2;
