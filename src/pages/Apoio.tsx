import { useState } from "react";
import { Search, Clock, ThumbsUp, ThumbsDown, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const categories = [
  { icon: '📋', title: 'Prestação de Contas', articles: [
    { title: 'Como montar uma Pasta de Prestação de Contas', type: 'guide', time: 8 },
    { title: 'Template: Relatório Mensal de Despesas', type: 'template', time: 3 },
    { title: 'Checklist: Documentos para prestação de contas', type: 'checklist', time: 5 },
    { title: 'Prazo legal para entrega', type: 'legislation', time: 4 },
  ]},
  { icon: '💰', title: 'Orçamento e Finanças', articles: [
    { title: 'Passo a Passo: Como elaborar o Orçamento Anual', type: 'guide', time: 12 },
    { title: 'Template: Planilha de Orçamento Anual', type: 'template', time: 2 },
    { title: 'Como calcular taxa de condomínio', type: 'guide', time: 6 },
    { title: 'Como lidar com inadimplência: fluxo jurídico', type: 'guide', time: 10 },
  ]},
  { icon: '🔧', title: 'Manutenção e Operações', articles: [
    { title: 'O que é PMOC e como montar', type: 'guide', time: 15 },
    { title: 'Checklist mensal de manutenção preventiva', type: 'checklist', time: 5 },
    { title: 'Como contratar e fiscalizar prestadores', type: 'guide', time: 8 },
    { title: 'Laudo de Vistoria: o que deve conter', type: 'guide', time: 7 },
  ]},
  { icon: '🗳️', title: 'Assembleia e Reuniões', articles: [
    { title: 'Passo a Passo: Como convocar uma AGO', type: 'guide', time: 10 },
    { title: 'Modelo de Convocação de Assembleia', type: 'template', time: 3 },
    { title: 'Template de Ata de Reunião', type: 'template', time: 2 },
    { title: 'Quórum necessário por tipo de deliberação', type: 'legislation', time: 6 },
  ]},
  { icon: '👥', title: 'Gestão de Locatários', articles: [
    { title: 'Processo de onboarding de novo locatário', type: 'guide', time: 8 },
    { title: 'Política de reserva de ambientes', type: 'guide', time: 5 },
    { title: 'Processo de rescisão de contrato', type: 'guide', time: 12 },
  ]},
  { icon: '🌿', title: 'ESG e Sustentabilidade', articles: [
    { title: 'Guia LEED: primeiros passos', type: 'guide', time: 15 },
    { title: 'O que é I-REC e como contratar', type: 'guide', time: 8 },
    { title: 'Como reduzir consumo de energia em 20%', type: 'guide', time: 10 },
  ]},
  { icon: '⚖️', title: 'Jurídico e Compliance', articles: [
    { title: 'Legislação básica de condomínios (Lei 4.591)', type: 'legislation', time: 20 },
    { title: 'LGPD aplicada à gestão de portfólio', type: 'legislation', time: 12 },
    { title: 'Normas ABNT relevantes', type: 'legislation', time: 15 },
  ]},
];

const typeConfig: Record<string, { label: string; cls: string }> = {
  guide: { label: 'Guia', cls: 'bg-interactive/10 text-interactive' },
  template: { label: 'Template', cls: 'bg-success/10 text-success' },
  checklist: { label: 'Checklist', cls: 'bg-amber-100 text-amber-800' },
  legislation: { label: 'Legislação', cls: 'bg-purple-100 text-purple-800' },
};

const Apoio = () => {
  const [search, setSearch] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<{ cat: string; title: string; type: string; time: number } | null>(null);

  const filtered = search
    ? categories.map(c => ({ ...c, articles: c.articles.filter(a => a.title.toLowerCase().includes(search.toLowerCase())) })).filter(c => c.articles.length > 0)
    : categories;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Apoio ao Gerente</h1>
          <p className="text-sm text-muted-foreground">Base de conhecimento, manuais e templates</p>
        </div>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar na base de conhecimento..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {selectedArticle ? (
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => setSelectedArticle(null)} className="gap-1">
            <ArrowLeft size={14} />Voltar ao menu principal
          </Button>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${typeConfig[selectedArticle.type].cls}`}>{typeConfig[selectedArticle.type].label}</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock size={10} />{selectedArticle.time} min de leitura</span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">{selectedArticle.cat}</span>
              </div>
              <h2 className="text-lg font-bold text-foreground">{selectedArticle.title}</h2>
              <div className="prose prose-sm max-w-none text-muted-foreground space-y-3">
                <p>Este é um conteúdo de exemplo para o artigo "{selectedArticle.title}". Em uma implementação real, o conteúdo completo seria carregado do banco de dados.</p>
                <h3 className="text-foreground font-semibold">Passo 1 — Planejamento</h3>
                <p>Inicie o processo com um levantamento detalhado das necessidades e requisitos aplicáveis.</p>
                <h3 className="text-foreground font-semibold">Passo 2 — Execução</h3>
                <p>Siga o checklist de verificação e documente todos os achados durante o processo.</p>
                <h3 className="text-foreground font-semibold">Passo 3 — Documentação</h3>
                <p>Gere o relatório final e compartilhe com os stakeholders relevantes.</p>
              </div>
              <div className="flex items-center gap-4 pt-4 border-t">
                <span className="text-sm text-muted-foreground">Este guia foi útil?</span>
                <Button variant="outline" size="sm" className="gap-1"><ThumbsUp size={12} />Sim</Button>
                <Button variant="outline" size="sm" className="gap-1"><ThumbsDown size={12} />Não</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((cat, ci) => (
            <Card key={ci}>
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{cat.icon}</span>
                  <h3 className="text-sm font-semibold text-foreground">{cat.title}</h3>
                </div>
                <div className="space-y-1.5">
                  {cat.articles.map((article, ai) => (
                    <button key={ai} onClick={() => setSelectedArticle({ ...article, cat: cat.title })}
                      className="w-full text-left flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors group">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${typeConfig[article.type].cls}`}>{typeConfig[article.type].label}</span>
                        <span className="text-xs text-foreground truncate group-hover:text-interactive transition-colors">{article.title}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{article.time}min</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Apoio;
