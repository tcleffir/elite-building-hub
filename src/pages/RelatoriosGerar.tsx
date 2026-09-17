import { useState } from "react";
import { FileText, Zap, DollarSign, TrendingUp, BarChart3, Download, Mail, Save, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";

const reportTypes = [
  { id: 'maintenance', icon: '📋', title: 'Relatório Mensal de Manutenção', desc: 'Chamados, SLA, categorias, avaliações de fornecedores', color: 'border-interactive/30' },
  { id: 'consumption', icon: '⚡', title: 'Relatório Mensal de Consumos', desc: 'Energia, água, gás — comparativos e rateio por locatário', color: 'border-success/30' },
  { id: 'expenses', icon: '💰', title: 'Relatório de Gastos Consolidados', desc: 'Despesas por categoria vs. orçamento, DRE simplificado', color: 'border-amber-400/30' },
  { id: 'capex', icon: '📈', title: 'Relatório de Investimentos (CAPEX)', desc: 'Obras, projetos em andamento, ROI esperado', color: 'border-hover/30' },
  { id: 'executive', icon: '📊', title: 'Relatório Executivo Completo', desc: 'Versão condensada para o Proprietário (máx 8 páginas)', color: 'border-destructive/30' },
];

const RelatoriosGerar = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setProgress(0);
    const steps = ['Consolidando chamados...', 'Calculando consumos...', 'Compilando despesas...', 'Gerando PDF...'];
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setProgress(Math.min(100, (step / steps.length) * 100));
      if (step >= steps.length) {
        clearInterval(interval);
        setGenerating(false);
        setGenerated(true);
      }
    }, 800);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/relatorios')}><ArrowLeft size={16} /></Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gerar Relatório Automático</h1>
          <p className="text-sm text-muted-foreground">Selecione o tipo de relatório e configure</p>
        </div>
      </div>

      {!selected ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportTypes.map(rt => (
            <Card key={rt.id} className={`cursor-pointer hover:shadow-lg transition-all hover:scale-[1.01] ${rt.color}`}
              onClick={() => setSelected(rt.id)}>
              <CardContent className="pt-6 space-y-2">
                <span className="text-2xl">{rt.icon}</span>
                <h3 className="text-sm font-semibold text-foreground">{rt.title}</h3>
                <p className="text-xs text-muted-foreground">{rt.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">{reportTypes.find(r => r.id === selected)?.icon}</span>
              <h3 className="text-lg font-semibold">{reportTypes.find(r => r.id === selected)?.title}</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Período</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm bg-card">
                  <option>Março 2026</option><option>Fevereiro 2026</option><option>Janeiro 2026</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Nível de Detalhe</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm bg-card">
                  <option>Executivo (resumido)</option><option>Operacional (detalhado)</option>
                </select>
              </div>
            </div>

            {generating && (
              <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-foreground font-medium">Gerando relatório...</p>
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground">{progress < 25 ? 'Consolidando chamados...' : progress < 50 ? 'Calculando consumos...' : progress < 75 ? 'Compilando despesas...' : 'Gerando PDF...'}</p>
              </div>
            )}

            {generated && (
              <div className="p-4 bg-success/5 border border-success/20 rounded-lg space-y-3">
                <p className="text-sm font-semibold text-success">✅ Relatório gerado com sucesso!</p>
                <div className="flex gap-2 flex-wrap">
                  <Button className="gap-2"><Download size={14} />Baixar PDF</Button>
                  <Button variant="outline" className="gap-2"><Mail size={14} />Enviar por E-mail</Button>
                  <Button variant="outline" className="gap-2"><Save size={14} />Salvar na Biblioteca</Button>
                </div>
              </div>
            )}

            {!generating && !generated && (
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setSelected(null)}>Voltar</Button>
                <Button className="premium-gradient gap-2 flex-1" onClick={handleGenerate}>
                  <Zap size={14} />Gerar Relatório
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RelatoriosGerar;
