import { useState } from "react";
import { Leaf, Award, Zap, ShieldCheck, Download, Upload, Plus, Recycle, Globe, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getHGRE11PortfolioBuildings, mockLuxReports, mockLEEDData, mockIRECCertificates } from "@/lib/mock-data";
import { toast } from "sonner";

const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR')}`;

const leedLevelColors: Record<string, string> = {
  certified: 'bg-green-100 text-green-700',
  silver: 'bg-slate-100 text-slate-700',
  gold: 'bg-amber-100 text-amber-700',
  platinum: 'bg-indigo-100 text-indigo-700',
};

const irecPlans = [
  { id: 'mensal', label: 'Mensal', price: 'R$ 2.890', desc: 'Flexibilidade total, cancele quando quiser', period: '/mês' },
  { id: 'semestral', label: 'Semestral', price: 'R$ 2.450', desc: '15% de desconto vs. mensal', period: '/mês', badge: 'Popular' },
  { id: 'anual', label: 'Anual', price: 'R$ 1.990', desc: '31% de desconto vs. mensal', period: '/mês', badge: 'Melhor preço' },
];

const ProprietarioSustentabilidade = () => {
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
  const [activeTab, setActiveTab] = useState('esg');
  const [carbonNeutralized, setCarbonNeutralized] = useState(false);

  const userBuildings = getHGRE11PortfolioBuildings();
  const building = userBuildings.find(b => b.id === selectedBuildingId);
  const leedData = mockLEEDData.find(l => l.building_id === selectedBuildingId);
  const luxReports = mockLuxReports.filter(r => r.building_id === selectedBuildingId);
  const irecCerts = mockIRECCertificates.filter(c => c.building_id === selectedBuildingId);
  const totalSavings = luxReports.reduce((s, r) => s + r.savings_amount, 0);
  const totalIREC = irecCerts.reduce((s, c) => s + c.mwh_amount, 0);
  const irecActive = irecCerts.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Sustentabilidade</h1>
        <Select value={selectedBuildingId} onValueChange={setSelectedBuildingId}>
          <SelectTrigger className="w-full sm:w-[280px]"><SelectValue placeholder="Selecione o ativo" /></SelectTrigger>
          <SelectContent>
            {userBuildings.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {!building ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Leaf size={48} className="text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Selecione um ativo para visualizar dados de sustentabilidade</p>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start">
            <TabsTrigger value="esg" className="text-xs sm:text-sm gap-1"><Leaf size={14} /> ESG</TabsTrigger>
            <TabsTrigger value="leed" className="text-xs sm:text-sm gap-1"><Award size={14} /> LEED</TabsTrigger>
            <TabsTrigger value="mercado" className="text-xs sm:text-sm gap-1"><Zap size={14} /> Mercado Livre</TabsTrigger>
            <TabsTrigger value="irec" className="text-xs sm:text-sm gap-1"><ShieldCheck size={14} /> I-REC</TabsTrigger>
          </TabsList>

          {/* ESG Tab */}
          <TabsContent value="esg" className="space-y-4">
            <div className="bg-card rounded-xl border p-6">
              <h3 className="text-base font-semibold mb-4">Telemetria ESG — {building.name}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-[10px] uppercase text-muted-foreground">Pegada de Carbono</p>
                  <p className="text-lg font-bold">12.4 tCO₂e</p>
                  <p className="text-[10px] text-muted-foreground">mensal estimado</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-[10px] uppercase text-muted-foreground">Intensidade Energética</p>
                  <p className="text-lg font-bold">18.2 kWh/m²</p>
                  <p className="text-[10px] text-muted-foreground">último mês</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-[10px] uppercase text-muted-foreground">Consumo de Água</p>
                  <p className="text-lg font-bold">3.8 m³/un</p>
                  <p className="text-[10px] text-muted-foreground">por unidade</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-1 mb-1">
                    <Recycle size={14} className="text-emerald-500" />
                    <p className="text-[10px] uppercase text-muted-foreground">Resíduos Gerados</p>
                  </div>
                  <p className="text-lg font-bold">2.8 ton</p>
                  <p className="text-[10px] text-muted-foreground">mensal</p>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-[10px]"><span>Reciclável</span><span className="font-medium">1.2 ton (43%)</span></div>
                    <div className="flex justify-between text-[10px]"><span>Orgânico</span><span className="font-medium">0.9 ton (32%)</span></div>
                    <div className="flex justify-between text-[10px]"><span>Rejeito</span><span className="font-medium">0.7 ton (25%)</span></div>
                  </div>
                </div>
              </div>
              <Badge className="bg-emerald-100 text-emerald-700">ESG Score: {building.esg_score || '-'}/100</Badge>
            </div>

            {/* Carbon Credit Neutralization */}
            <div className={`bg-card rounded-xl border p-6 ${carbonNeutralized ? 'border-emerald-300 bg-emerald-50/50' : ''}`}>
              <div className="flex items-center gap-2 mb-3">
                <Globe size={20} className="text-emerald-600" />
                <h3 className="text-base font-semibold">Neutralize a operação do ativo</h3>
                {carbonNeutralized && <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Operação Neutra ✓</Badge>}
              </div>
              {!carbonNeutralized ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-[10px] uppercase text-muted-foreground">Emissões Estimadas</p>
                      <p className="text-lg font-bold">12.4 tCO₂e</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-[10px] uppercase text-muted-foreground">Custo por Tonelada</p>
                      <p className="text-lg font-bold">R$ 85,00</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-[10px] uppercase text-muted-foreground">Investimento Total</p>
                      <p className="text-lg font-bold text-primary">R$ 1.054,00</p>
                    </div>
                  </div>
                  <Button className="gap-2" onClick={() => { setCarbonNeutralized(true); toast.success("Compensação solicitada com sucesso!"); }}>
                    <Globe size={16} /> Solicitar Compensação
                  </Button>
                </>
              ) : (
                <p className="text-sm text-emerald-700">A operação deste ativo foi neutralizada via créditos de carbono. Certificado disponível para download.</p>
              )}
            </div>
          </TabsContent>

          {/* LEED Tab */}
          <TabsContent value="leed" className="space-y-4">
            {leedData && leedData.certification_status !== 'none' ? (
              <>
                <div className="bg-card rounded-xl border p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Award size={24} className="text-amber-500" />
                    <div>
                      <h3 className="font-semibold">Certificação LEED</h3>
                      <div className="flex gap-2 mt-1">
                        <Badge className={leedData.certification_level ? leedLevelColors[leedData.certification_level] : 'bg-muted'}>
                          {leedData.certification_status === 'in_progress' ? 'Em processo' : 'Certificado'} — {leedData.certification_level?.toUpperCase()}
                        </Badge>
                        <Badge className="bg-indigo-100 text-indigo-700 text-[10px]">Assessoria LUX|ESG</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium">Pontuação: {leedData.total_score}/{leedData.max_score}</p>
                      <p className="text-xs text-muted-foreground">{((leedData.total_score / leedData.max_score) * 100).toFixed(0)}%</p>
                    </div>
                    <Progress value={(leedData.total_score / leedData.max_score) * 100} className="h-3" />
                  </div>
                  <div className="space-y-2">
                    {leedData.categories.map((cat, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{cat.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{cat.obtained}/{cat.max}</span>
                          <div className="w-20"><Progress value={(cat.obtained / cat.max) * 100} className="h-1.5" /></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <Button variant="outline" className="gap-2" onClick={() => toast.info("Upload de evidências LEED")}>
                  <Upload size={16} /> Upload Documentos LEED
                </Button>
              </>
            ) : (
              <div className="bg-card rounded-xl border p-8 text-center">
                <Award size={40} className="mx-auto mb-3 text-muted-foreground/30" />
                <h3 className="font-semibold mb-2">Não certificado</h3>
                <p className="text-sm text-muted-foreground mb-6">Este ativo ainda não possui certificação LEED.</p>

                {/* LUX|ESG CTA */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 p-6 max-w-md mx-auto">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Sparkles size={20} className="text-emerald-600" />
                    <h4 className="font-semibold text-emerald-800 dark:text-emerald-300">Consultoria LUX|ESG</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Contrate a certificação LEED com a consultoria LUX|ESG. Realizamos uma análise completa do seu ativo e preparamos toda a documentação necessária.
                  </p>
                  <div className="flex flex-col gap-2">
                    <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => toast.success("Solicitação de análise gratuita enviada! Nossa equipe entrará em contato em até 48h.")}>
                      <Sparkles size={14} /> Solicitar Análise Gratuita
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={() => toast.info("Redirecionando para mais informações sobre certificação LEED...")}>
                      Saiba mais sobre LEED
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Mercado Livre Tab */}
          <TabsContent value="mercado" className="space-y-4">
            {building.lux_client ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-card rounded-lg border p-4">
                    <p className="text-[10px] text-muted-foreground uppercase">Economia Acumulada (Ano)</p>
                    <p className="text-xl font-bold text-emerald-600">{fmt(totalSavings)}</p>
                  </div>
                  <div className="bg-card rounded-lg border p-4">
                    <p className="text-[10px] text-muted-foreground uppercase">Relatórios Publicados</p>
                    <p className="text-xl font-bold">{luxReports.length}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {luxReports.map(r => (
                    <div key={r.id} className="bg-card rounded-xl border p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">📊 Relatório Lux Energia — {new Date(r.reference_month).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                        <p className="text-xs text-muted-foreground">Economia: <span className="text-emerald-600 font-medium">{fmt(r.savings_amount)}</span> · Publicado em {new Date(r.published_at).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => toast.info("Download do relatório")}><Download size={14} /> PDF</Button>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="bg-card rounded-xl border p-8 text-center">
                <Zap size={40} className="mx-auto mb-3 text-amber-500 opacity-60" />
                <h3 className="text-base font-semibold mb-2">💡 Mercado Livre de Energia</h3>
                <p className="text-sm text-muted-foreground mb-4">Este ativo ainda não está no Mercado Livre de Energia.<br />Fale com a equipe Lux Energia para uma análise gratuita.</p>
                <Button onClick={() => toast.info("Solicitação enviada!")}>Solicitar análise</Button>
              </div>
            )}
          </TabsContent>

          {/* I-REC Tab */}
          <TabsContent value="irec" className="space-y-4">
            {irecActive ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-card rounded-lg border p-4">
                    <p className="text-[10px] text-muted-foreground uppercase">Neutralização do Escopo 2 em</p>
                    <p className="text-xl font-bold">{totalIREC.toFixed(1)} MWh</p>
                  </div>
                  <div className="bg-card rounded-lg border p-4">
                    <p className="text-[10px] text-muted-foreground uppercase">Período</p>
                    <p className="text-sm font-bold">
                      {new Date(irecCerts[0].period_start).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })} a{' '}
                      {new Date(irecCerts[irecCerts.length - 1].period_end).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="bg-card rounded-lg border p-4">
                    <p className="text-[10px] text-muted-foreground uppercase">Status</p>
                    <Badge className="bg-emerald-100 text-emerald-700">Ativo</Badge>
                  </div>
                </div>
                <div className="bg-card rounded-xl border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Código</TableHead>
                        <TableHead className="text-xs text-right">MWh</TableHead>
                        <TableHead className="text-xs">Período</TableHead>
                        <TableHead className="text-xs">Emitido em</TableHead>
                        <TableHead className="text-xs text-center">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {irecCerts.map(c => (
                        <TableRow key={c.id}>
                          <TableCell className="text-sm font-mono">{c.certificate_code}</TableCell>
                          <TableCell className="text-sm text-right">{c.mwh_amount}</TableCell>
                          <TableCell className="text-sm">{new Date(c.period_start).toLocaleDateString('pt-BR')} — {new Date(c.period_end).toLocaleDateString('pt-BR')}</TableCell>
                          <TableCell className="text-sm">{new Date(c.issued_at).toLocaleDateString('pt-BR')}</TableCell>
                          <TableCell className="text-center">
                            <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => toast.info("Download do certificado")}><Download size={12} /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : (
              <div className="space-y-6">
                <div className="bg-card rounded-xl border p-8 text-center">
                  <ShieldCheck size={40} className="mx-auto mb-3 text-muted-foreground/30" />
                  <h3 className="font-semibold mb-2">Certificados I-REC</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Certificados de energia renovável garantem que a energia consumida é de fonte renovável, neutralizando o Escopo 2 das emissões.
                  </p>
                </div>

                {/* Subscription Plans */}
                <div>
                  <h3 className="text-base font-semibold mb-4 text-center">Contrate I-REC para este ativo</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {irecPlans.map(plan => (
                      <div key={plan.id} className={`bg-card rounded-xl border p-5 flex flex-col text-center relative ${plan.badge === 'Melhor preço' ? 'border-emerald-300 ring-2 ring-emerald-200' : ''}`}>
                        {plan.badge && (
                          <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-emerald-100 text-emerald-700 text-[10px]">{plan.badge}</Badge>
                        )}
                        <h4 className="font-semibold text-sm mt-2">{plan.label}</h4>
                        <p className="text-2xl font-bold mt-2">{plan.price}<span className="text-xs font-normal text-muted-foreground">{plan.period}</span></p>
                        <p className="text-xs text-muted-foreground mt-1 mb-4">{plan.desc}</p>
                        <Button
                          className="mt-auto gap-2"
                          variant={plan.badge === 'Melhor preço' ? 'default' : 'outline'}
                          onClick={() => toast.success(`Plano ${plan.label} solicitado com sucesso! Nossa equipe entrará em contato.`)}
                        >
                          Contratar
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default ProprietarioSustentabilidade;
