import { useState } from "react";
import { Plus, Calendar, Users, Vote, FileText, Video, MapPin, Clock, Link2, Trash2, GripVertical, ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";

type AgendaItem = { title: string; type: 'informative' | 'vote' | 'deliberation'; time: number; description?: string; result?: string };
type Assembly = {
  id: string; title: string; type: 'AGO' | 'AGE' | 'meeting';
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  date: string; endDate: string; modality: 'presential' | 'online' | 'hybrid';
  meetingUrl: string; location?: string; confirmed: number; total: number;
  agenda: AgendaItem[]; ataContent?: string;
};

const statusConfig = {
  scheduled: { label: 'Agendada', cls: 'bg-interactive/10 text-interactive' },
  active: { label: 'Em andamento', cls: 'bg-success/10 text-success animate-pulse' },
  completed: { label: 'Encerrada', cls: 'bg-muted text-muted-foreground' },
  cancelled: { label: 'Cancelada', cls: 'bg-destructive/10 text-destructive' },
};

const typeConfig = {
  AGO: { label: 'AGO', cls: 'bg-interactive/10 text-interactive' },
  AGE: { label: 'AGE', cls: 'bg-amber-100 text-amber-800' },
  meeting: { label: 'Reunião', cls: 'bg-muted text-muted-foreground' },
};

const modalityIcons = { presential: MapPin, online: Video, hybrid: Video };

const Assembleia = () => {
  const [assemblies, setAssemblies] = useState<Assembly[]>([
    {
      id: 'asm-1', title: 'AGO 2026 — Aprovação de Orçamento e Prestação de Contas',
      type: 'AGO', status: 'scheduled',
      date: '2026-04-15T14:00:00', endDate: '2026-04-15T17:00:00',
      modality: 'hybrid', meetingUrl: 'https://meet.google.com/abc-xyz',
      confirmed: 12, total: 18,
      agenda: [
        { title: 'Leitura e aprovação da ata anterior', type: 'informative', time: 10 },
        { title: 'Prestação de contas do exercício 2025', type: 'deliberation', time: 30 },
        { title: 'Aprovação do orçamento 2026', type: 'vote', time: 45 },
        { title: 'Assuntos gerais', type: 'informative', time: 20 },
      ],
    },
    {
      id: 'asm-2', title: 'AGE — Aprovação de Reforma do Bicicletário (SS3)',
      type: 'AGE', status: 'completed',
      date: '2026-02-10T10:00:00', endDate: '2026-02-10T12:00:00',
      modality: 'presential', meetingUrl: '', location: 'Auditório Térreo',
      confirmed: 15, total: 18,
      agenda: [
        { title: 'Apresentação do projeto de reforma', type: 'informative', time: 15 },
        { title: 'Aprovação do orçamento da reforma', type: 'vote', time: 30, result: 'Aprovado por 13 votos a favor, 2 contra' },
      ],
      ataContent: 'Aos dez dias do mês de fevereiro de 2026, reuniram-se os condôminos do Condomínio 360JK para deliberar sobre a reforma do bicicletário no SS3. Com quórum de 83%, a assembleia foi aberta pela Sra. Tatiana Caracciolo. O projeto foi apresentado e aprovado por 13 votos a favor e 2 contra.',
    },
  ]);

  const [selected, setSelected] = useState<string | null>(null);
  const [showConvocation, setShowConvocation] = useState(false);
  const [votes, setVotes] = useState<Record<string, string>>({});

  // Convocation form
  const [convForm, setConvForm] = useState({
    title: '', type: 'AGO' as 'AGO' | 'AGE' | 'meeting',
    date: '', startTime: '14:00', endTime: '17:00',
    modality: 'hybrid' as 'presential' | 'online' | 'hybrid',
    meetingUrl: '', location: '',
    agenda: [{ title: '', type: 'informative' as AgendaItem['type'], time: 30, description: '' }] as AgendaItem[],
  });

  const selectedAssembly = assemblies.find(a => a.id === selected);

  const addAgendaItem = () => {
    setConvForm(p => ({ ...p, agenda: [...p.agenda, { title: '', type: 'informative', time: 15, description: '' }] }));
  };

  const removeAgendaItem = (idx: number) => {
    setConvForm(p => ({ ...p, agenda: p.agenda.filter((_, i) => i !== idx) }));
  };

  const updateAgendaItem = (idx: number, field: string, value: any) => {
    setConvForm(p => ({ ...p, agenda: p.agenda.map((a, i) => i === idx ? { ...a, [field]: value } : a) }));
  };

  const handleConvoke = () => {
    if (!convForm.title.trim() || !convForm.date || convForm.agenda.every(a => !a.title.trim())) {
      toast.error('Preencha o título, data e ao menos um item de pauta');
      return;
    }
    const newAsm: Assembly = {
      id: `asm-${Date.now()}`, title: convForm.title, type: convForm.type, status: 'scheduled',
      date: `${convForm.date}T${convForm.startTime}:00`, endDate: `${convForm.date}T${convForm.endTime}:00`,
      modality: convForm.modality, meetingUrl: convForm.meetingUrl, location: convForm.location,
      confirmed: 0, total: 18,
      agenda: convForm.agenda.filter(a => a.title.trim()),
    };
    setAssemblies(prev => [newAsm, ...prev]);
    toast.success('Assembleia convocada com sucesso!');
    setConvForm({ title: '', type: 'AGO', date: '', startTime: '14:00', endTime: '17:00', modality: 'hybrid', meetingUrl: '', location: '', agenda: [{ title: '', type: 'informative', time: 30, description: '' }] });
    setShowConvocation(false);
    setSelected(newAsm.id);
  };

  const handleVote = (itemTitle: string, vote: string) => {
    setVotes(prev => ({ ...prev, [itemTitle]: vote }));
    toast.success(`Voto registrado: ${vote}`);
  };

  const generateAta = () => {
    if (!selectedAssembly) return;
    const dateStr = new Date(selectedAssembly.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = new Date(selectedAssembly.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const ata = `ATA DA ${selectedAssembly.type === 'AGO' ? 'ASSEMBLEIA GERAL ORDINÁRIA' : selectedAssembly.type === 'AGE' ? 'ASSEMBLEIA GERAL EXTRAORDINÁRIA' : 'REUNIÃO DE CONDÔMINOS'}\n\nCondomínio 360JK — Administradora\n\nData: ${dateStr}\nHorário: ${timeStr}\nModalidade: ${selectedAssembly.modality === 'hybrid' ? 'Híbrida' : selectedAssembly.modality === 'presential' ? 'Presencial' : 'Online'}\n${selectedAssembly.meetingUrl ? `Link: ${selectedAssembly.meetingUrl}\n` : ''}${selectedAssembly.location ? `Local: ${selectedAssembly.location}\n` : ''}\nPresentes: ${selectedAssembly.confirmed} de ${selectedAssembly.total} convocados (${Math.round((selectedAssembly.confirmed / selectedAssembly.total) * 100)}%)\n\n--- PAUTA ---\n${selectedAssembly.agenda.map((a, i) => `${i + 1}. ${a.title} (${a.type === 'vote' ? 'Votação' : a.type === 'deliberation' ? 'Deliberação' : 'Informativo'}) — ${a.time} min${a.result ? `\n   Resultado: ${a.result}` : ''}`).join('\n')}\n\n--- DELIBERAÇÕES ---\n${selectedAssembly.agenda.filter(a => a.type === 'vote').map(a => `• ${a.title}: ${a.result || 'Pendente de votação'}`).join('\n') || 'Nenhuma votação registrada.'}\n\nNada mais havendo a tratar, a assembleia foi encerrada, da qual eu, secretário(a), lavrei a presente ata.\n\n___________________________\nPresidente da Mesa\n\n___________________________\nSecretário(a)`;

    setAssemblies(prev => prev.map(a => a.id === selectedAssembly.id ? { ...a, ataContent: ata } : a));
    toast.success('Ata gerada automaticamente!');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Assembleias</h1>
          <p className="text-sm text-muted-foreground">{assemblies.length} assembleias registradas</p>
        </div>
        <Button className="premium-gradient gap-2" onClick={() => setShowConvocation(true)}><Plus size={16} />Convocar Nova Assembleia</Button>
      </div>

      {!selected ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assemblies.map(asm => {
            const ModalityIcon = modalityIcons[asm.modality];
            return (
              <Card key={asm.id} className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.01]" onClick={() => setSelected(asm.id)}>
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${typeConfig[asm.type].cls}`}>{typeConfig[asm.type].label}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusConfig[asm.status].cls}`}>{statusConfig[asm.status].label}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{asm.title}</h3>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar size={12} />{new Date(asm.date).toLocaleDateString('pt-BR')} {new Date(asm.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="flex items-center gap-1"><ModalityIcon size={12} />{asm.modality === 'hybrid' ? 'Híbrida' : asm.modality === 'presential' ? 'Presencial' : 'Online'}</span>
                  </div>
                  {asm.meetingUrl && <div className="flex items-center gap-1 text-xs text-interactive"><Link2 size={12} /><span className="truncate">{asm.meetingUrl}</span></div>}
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{asm.confirmed}/{asm.total} confirmados</span>
                    <Progress value={(asm.confirmed / asm.total) * 100} className="h-1.5 flex-1" />
                  </div>
                  <div className="text-xs text-muted-foreground">Pauta: {asm.agenda.map(a => a.title).join(' • ').substring(0, 80)}...</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : selectedAssembly && (
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => setSelected(null)} className="gap-1"><ArrowLeft size={14} />Voltar</Button>
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${typeConfig[selectedAssembly.type].cls}`}>{typeConfig[selectedAssembly.type].label}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusConfig[selectedAssembly.status].cls}`}>{statusConfig[selectedAssembly.status].label}</span>
          </div>
          <h2 className="text-xl font-bold text-foreground">{selectedAssembly.title}</h2>

          {/* Info bar */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2"><Calendar size={14} className="text-muted-foreground" /><span>{new Date(selectedAssembly.date).toLocaleDateString('pt-BR')} — {new Date(selectedAssembly.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} às {new Date(selectedAssembly.endDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span></div>
                <div className="flex items-center gap-2">{selectedAssembly.modality === 'presential' ? <MapPin size={14} className="text-muted-foreground" /> : <Video size={14} className="text-muted-foreground" />}<span>{selectedAssembly.modality === 'hybrid' ? 'Híbrida' : selectedAssembly.modality === 'presential' ? 'Presencial' : 'Online'}</span></div>
                {selectedAssembly.meetingUrl && <a href={selectedAssembly.meetingUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-interactive hover:underline"><Link2 size={14} />Link da reunião</a>}
                {selectedAssembly.location && <span className="flex items-center gap-1"><MapPin size={14} className="text-muted-foreground" />{selectedAssembly.location}</span>}
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="pauta">
            <TabsList>
              <TabsTrigger value="pauta"><FileText size={14} className="mr-1" />Pauta</TabsTrigger>
              <TabsTrigger value="presencas"><Users size={14} className="mr-1" />Presenças</TabsTrigger>
              <TabsTrigger value="votacoes"><Vote size={14} className="mr-1" />Votações</TabsTrigger>
              <TabsTrigger value="ata"><FileText size={14} className="mr-1" />Ata</TabsTrigger>
            </TabsList>
            <TabsContent value="pauta">
              <Card>
                <CardContent className="pt-6 space-y-3">
                  {selectedAssembly.agenda.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-border/40 hover:bg-muted/20">
                      <div className="w-6 h-6 rounded-full bg-interactive/10 text-interactive flex items-center justify-center text-xs font-bold">{i + 1}</div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                        {item.description && <p className="text-xs text-muted-foreground mt-1">{item.description}</p>}
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${item.type === 'vote' ? 'bg-amber-100 text-amber-800' : item.type === 'deliberation' ? 'bg-interactive/10 text-interactive' : 'bg-muted text-muted-foreground'}`}>
                            {item.type === 'vote' ? 'Votação' : item.type === 'deliberation' ? 'Deliberação' : 'Informativo'}
                          </span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Clock size={10} />{item.time} min</span>
                          {item.result && <span className="text-[10px] text-success font-medium">✅ {item.result}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="presencas">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4 mb-4">
                    <p className="text-sm font-medium">{selectedAssembly.confirmed} de {selectedAssembly.total} confirmados</p>
                    <Progress value={(selectedAssembly.confirmed / selectedAssembly.total) * 100} className="h-2 flex-1" />
                    <span className="text-xs text-muted-foreground">{Math.round((selectedAssembly.confirmed / selectedAssembly.total) * 100)}%</span>
                  </div>
                  <div className="space-y-2">
                    {['Lux Energia', 'Capitale', 'You Intermediação', 'Renault do Brasil', 'Accenture', 'Dentons Cardoso'].map((name, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/20">
                        <span className="text-sm">{name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${i < 4 ? 'bg-success/10 text-success' : 'bg-amber-100 text-amber-800'}`}>
                          {i < 4 ? 'Confirmado' : 'Pendente'}
                        </span>
                      </div>
                    ))}
                  </div>
                  <Button className="mt-4 w-full" variant="outline">Confirmar minha presença</Button>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="votacoes">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  {selectedAssembly.agenda.filter(a => a.type === 'vote').map((item, i) => (
                    <div key={i} className="p-4 rounded-lg border border-border/40 space-y-3">
                      <p className="text-sm font-semibold">{item.title}</p>
                      {item.result ? (
                        <div className="p-3 rounded-lg bg-success/10 text-success text-sm font-medium">✅ {item.result}</div>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <Button variant={votes[item.title] === 'favor' ? 'default' : 'outline'} className={`h-11 sm:h-10 ${votes[item.title] === 'favor' ? 'bg-success hover:bg-success/90' : 'border-success text-success hover:bg-success/10'}`} onClick={() => handleVote(item.title, 'favor')}>✅ A Favor</Button>
                            <Button variant={votes[item.title] === 'contra' ? 'default' : 'outline'} className={`h-11 sm:h-10 ${votes[item.title] === 'contra' ? 'bg-destructive hover:bg-destructive/90' : 'border-destructive text-destructive hover:bg-destructive/10'}`} onClick={() => handleVote(item.title, 'contra')}>❌ Contra</Button>
                            <Button variant={votes[item.title] === 'abstencao' ? 'default' : 'outline'} className="h-11 sm:h-10" onClick={() => handleVote(item.title, 'abstencao')}>⬜ Abstenção</Button>
                          </div>
                          {votes[item.title] && <p className="text-xs text-success">Seu voto: {votes[item.title] === 'favor' ? 'A Favor' : votes[item.title] === 'contra' ? 'Contra' : 'Abstenção'}</p>}
                        </>
                      )}
                    </div>
                  ))}
                  {selectedAssembly.agenda.filter(a => a.type === 'vote').length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">Nenhum item de votação na pauta</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="ata">
              <Card>
                <CardContent className="pt-6">
                  {selectedAssembly.ataContent ? (
                    <div className="space-y-4">
                      <pre className="whitespace-pre-wrap text-sm text-foreground bg-muted/20 p-6 rounded-xl border font-sans leading-relaxed">{selectedAssembly.ataContent}</pre>
                      <div className="flex gap-2">
                        <Button variant="outline" className="gap-2"><Download size={14} />Exportar PDF</Button>
                        <Button variant="outline" className="gap-2" onClick={generateAta}>Regenerar Ata</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="min-h-[200px] border-2 border-dashed border-border rounded-lg p-6 flex items-center justify-center">
                      <div className="text-center">
                        <FileText size={32} className="mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">A ata será disponibilizada após a assembleia</p>
                        <Button className="mt-3 premium-gradient gap-2" size="sm" onClick={generateAta}>
                          <FileText size={14} />Gerar Ata Automática
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Convocation Dialog */}
      <Dialog open={showConvocation} onOpenChange={setShowConvocation}>
        <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Convocar Nova Assembleia</DialogTitle>
            <DialogDescription>Preencha os dados para convocar uma nova assembleia.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-2">
            {/* Basic info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs">Título da Assembleia *</Label>
                <Input placeholder="Ex: AGO 2026 — Aprovação de Orçamento" value={convForm.title} onChange={e => setConvForm(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tipo</Label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm bg-card" value={convForm.type} onChange={e => setConvForm(p => ({ ...p, type: e.target.value as any }))}>
                  <option value="AGO">AGO — Assembleia Geral Ordinária</option>
                  <option value="AGE">AGE — Assembleia Geral Extraordinária</option>
                  <option value="meeting">Reunião de Condôminos</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Modalidade</Label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm bg-card" value={convForm.modality} onChange={e => setConvForm(p => ({ ...p, modality: e.target.value as any }))}>
                  <option value="presential">Presencial</option>
                  <option value="online">Online</option>
                  <option value="hybrid">Híbrida</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Data *</Label>
                <Input type="date" value={convForm.date} onChange={e => setConvForm(p => ({ ...p, date: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Início</Label>
                  <Input type="time" value={convForm.startTime} onChange={e => setConvForm(p => ({ ...p, startTime: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Término</Label>
                  <Input type="time" value={convForm.endTime} onChange={e => setConvForm(p => ({ ...p, endTime: e.target.value }))} />
                </div>
              </div>
              {(convForm.modality === 'online' || convForm.modality === 'hybrid') && (
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs">Link da Videoconferência</Label>
                  <Input placeholder="https://meet.google.com/..." value={convForm.meetingUrl} onChange={e => setConvForm(p => ({ ...p, meetingUrl: e.target.value }))} />
                </div>
              )}
              {(convForm.modality === 'presential' || convForm.modality === 'hybrid') && (
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs">Local</Label>
                  <Input placeholder="Ex: Auditório Térreo, Sala de Reunião 19º" value={convForm.location} onChange={e => setConvForm(p => ({ ...p, location: e.target.value }))} />
                </div>
              )}
            </div>

            {/* Agenda */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Pauta</Label>
                <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={addAgendaItem}><Plus size={12} />Adicionar Item</Button>
              </div>
              {convForm.agenda.map((item, i) => (
                <div key={i} className="p-3 rounded-lg border border-border/40 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground w-6">{i + 1}.</span>
                    <Input placeholder="Título do item de pauta" value={item.title} onChange={e => updateAgendaItem(i, 'title', e.target.value)} className="flex-1 h-8 text-sm" />
                    <select className="border rounded px-2 py-1 text-xs bg-card" value={item.type} onChange={e => updateAgendaItem(i, 'type', e.target.value)}>
                      <option value="informative">Informativo</option>
                      <option value="vote">Votação</option>
                      <option value="deliberation">Deliberação</option>
                    </select>
                    <Input type="number" value={item.time} onChange={e => updateAgendaItem(i, 'time', +e.target.value)} className="w-16 h-8 text-xs text-center" />
                    <span className="text-[10px] text-muted-foreground">min</span>
                    {convForm.agenda.length > 1 && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeAgendaItem(i)}><Trash2 size={12} className="text-destructive" /></Button>
                    )}
                  </div>
                  <Input placeholder="Descrição (opcional)" value={item.description || ''} onChange={e => updateAgendaItem(i, 'description', e.target.value)} className="h-7 text-xs pl-8" />
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConvocation(false)}>Cancelar</Button>
            <Button className="premium-gradient gap-2" onClick={handleConvoke}><Plus size={14} />Convocar Assembleia</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Assembleia;
