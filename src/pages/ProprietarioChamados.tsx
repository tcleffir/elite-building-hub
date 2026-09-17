import { useState, useMemo } from "react";
import { MessageSquare, Paperclip, Upload, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/contexts/AppContext";
import { toast } from "sonner";
import { differenceInDays } from "date-fns";
import OperationsKpiBanner from "@/components/OperationsKpiBanner";

interface Chamado {
  id: string; building: string; unit: string; title: string;
  status: string; priority: string; openedAt: string; updatedAt: string;
  openedBy: string; responsible: string | null; estimatedCost: number;
  slaDeadline: string; description: string;
  timeline: { date: string; text: string }[];
}

const mockChamados: Chamado[] = [
  { id: 'CH-011', building: 'WT Morumbi', unit: '3º andar', title: 'Infiltração no teto — SL 301', status: 'aberto', priority: 'high', openedAt: '2026-03-10', updatedAt: '2026-03-10', openedBy: 'KPMG', responsible: 'LuxNexus Manutenção', estimatedCost: 3500, slaDeadline: '2026-03-17', description: 'Infiltração de água no teto da sala 301, próximo à janela leste.', timeline: [{ date: '2026-03-10T09:00', text: 'Chamado aberto por KPMG' }, { date: '2026-03-10T14:30', text: 'Atribuído a LuxNexus Manutenção' }] },
  { id: 'CH-012', building: 'WT Morumbi', unit: 'Térreo', title: 'Elevador social intermitente', status: 'em_execucao', priority: 'urgent', openedAt: '2026-03-09', updatedAt: '2026-03-12', openedBy: 'Administradora', responsible: 'TechElev Elevadores', estimatedCost: 12000, slaDeadline: '2026-03-12', description: 'Elevador social parou 3 vezes nos últimos 2 dias.', timeline: [{ date: '2026-03-09T08:00', text: 'Chamado aberto por Administradora' }, { date: '2026-03-09T10:00', text: 'Classificado como URGENTE' }, { date: '2026-03-10T09:00', text: 'Atribuído a TechElev Elevadores' }, { date: '2026-03-12T09:00', text: 'Status alterado para "Em Execução"' }] },
  { id: 'CH-013', building: 'Work Bela Cintra', unit: '2º andar', title: 'Ar-condicionado CJ22 — não refrigera', status: 'aberto', priority: 'normal', openedAt: '2026-03-11', updatedAt: '2026-03-11', openedBy: 'Bain & Company', responsible: null, estimatedCost: 800, slaDeadline: '2026-03-18', description: 'Split do CJ22 ligado mas não refrigera.', timeline: [{ date: '2026-03-11T10:00', text: 'Chamado aberto por Bain & Company' }] },
  { id: 'CH-014', building: 'Work Bela Cintra', unit: 'Lobby', title: 'Lâmpada queimada — recepção', status: 'resolvido', priority: 'normal', openedAt: '2026-03-05', updatedAt: '2026-03-06', openedBy: 'Recepção', responsible: 'LuxNexus Manutenção', estimatedCost: 150, slaDeadline: '2026-03-07', description: 'Lâmpada da recepção principal queimada.', timeline: [{ date: '2026-03-05T08:00', text: 'Chamado aberto por Recepção' }, { date: '2026-03-05T14:00', text: 'Atribuído a LuxNexus Manutenção' }, { date: '2026-03-06T11:00', text: 'Resolvido — lâmpada substituída' }] },
  { id: 'CH-015', building: 'WT Morumbi', unit: '15º andar', title: 'Torneira vazando — banheiro masculino', status: 'resolvido', priority: 'normal', openedAt: '2026-03-08', updatedAt: '2026-03-09', openedBy: 'PwC Brasil', responsible: 'LuxNexus Manutenção', estimatedCost: 200, slaDeadline: '2026-03-15', description: 'Torneira do banheiro masculino do 15º andar com vazamento.', timeline: [{ date: '2026-03-08T09:00', text: 'Chamado aberto por PwC Brasil' }, { date: '2026-03-09T10:00', text: 'Resolvido — torneira trocada' }] },
  { id: 'CH-016', building: 'Work Bela Cintra', unit: 'SS1', title: 'Portão de garagem com falha', status: 'em_execucao', priority: 'high', openedAt: '2026-04-02', updatedAt: '2026-04-05', openedBy: 'Administradora', responsible: 'SecTech Segurança', estimatedCost: 2500, slaDeadline: '2026-04-09', description: 'Portão eletrônico SS1 abrindo com atraso ou não respondendo ao controle.', timeline: [{ date: '2026-04-02T08:00', text: 'Chamado aberto por Administradora' }, { date: '2026-04-03T09:00', text: 'Atribuído a SecTech Segurança' }, { date: '2026-04-05T14:00', text: 'Status alterado para "Em Execução"' }] },
];

const statusLabels: Record<string, string> = { aberto: 'Aberto', em_execucao: '⚙️ Em Execução', resolvido: '✅ Resolvido' };
const statusColors: Record<string, string> = { aberto: 'bg-blue-100 text-blue-700', em_execucao: 'bg-amber-100 text-amber-700', resolvido: 'bg-green-100 text-green-700' };
const priorityLabels: Record<string, string> = { normal: 'Normal', high: '⚠️ High', urgent: '🚨 Urgente' };
const priorityColors: Record<string, string> = { normal: 'bg-gray-100 text-gray-600', high: 'bg-orange-100 text-orange-700', urgent: 'bg-red-600 text-white' };

const getSlaStatus = (chamado: Chamado) => {
  const now = new Date();
  const deadline = new Date(chamado.slaDeadline);
  const daysLeft = differenceInDays(deadline, now);
  if (chamado.status === 'resolvido') {
    const resolved = new Date(chamado.updatedAt);
    return resolved <= deadline
      ? { label: '✅ No prazo', color: 'text-green-700' }
      : { label: '⚠️ Atrasado', color: 'text-red-600' };
  }
  if (daysLeft < 0) return { label: '⚠️ SLA VENCIDO', color: 'text-red-600 font-semibold' };
  if (daysLeft <= 2) return { label: `${daysLeft}d restantes`, color: 'text-amber-600' };
  return { label: `${daysLeft}d restantes`, color: 'text-green-600' };
};

const ProprietarioChamados = () => {
  const { user } = useApp();
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<Chamado | null>(null);
  const [comment, setComment] = useState('');
  const [selectedChamados, setSelectedChamados] = useState<Set<string>>(new Set());
  const [batchResolveOpen, setBatchResolveOpen] = useState(false);
  const [chamadosState, setChamadosState] = useState(mockChamados);

  const tickets = useMemo(() => {
    let result = [...chamadosState];
    if (statusFilter === 'aberto') result = result.filter(t => t.status === 'aberto');
    else if (statusFilter === 'em_execucao') result = result.filter(t => t.status === 'em_execucao');
    else if (statusFilter === 'resolvido') result = result.filter(t => t.status === 'resolvido');
    else if (statusFilter === 'urgent') result = result.filter(t => t.priority === 'urgent');
    if (priorityFilter !== 'all') result = result.filter(t => t.priority === priorityFilter);
    return result;
  }, [statusFilter, priorityFilter, chamadosState]);

  const unresolvedTickets = tickets.filter(t => t.status !== 'resolvido');
  const allUnresolvedSelected = unresolvedTickets.length > 0 && unresolvedTickets.every(t => selectedChamados.has(t.id));

  const kpis = useMemo(() => {
    const open = chamadosState.filter(t => t.status === 'aberto').length;
    const exec = chamadosState.filter(t => t.status === 'em_execucao').length;
    const urgent = chamadosState.filter(t => t.priority === 'urgent' && t.status !== 'resolvido').length;
    const resolved = chamadosState.filter(t => t.status === 'resolvido').length;
    const hasStale = chamadosState.some(t => t.status === 'aberto' && differenceInDays(new Date(), new Date(t.updatedAt)) > 5);
    return { open, exec, urgent, resolved, hasStale };
  }, [chamadosState]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedChamados(new Set(unresolvedTickets.map(t => t.id)));
    } else {
      setSelectedChamados(new Set());
    }
  };

  const handleBatchResolve = () => {
    setChamadosState(prev => prev.map(t => {
      if (selectedChamados.has(t.id)) {
        return {
          ...t,
          status: 'resolvido',
          updatedAt: new Date().toISOString().slice(0, 10),
          timeline: [...t.timeline, { date: new Date().toISOString(), text: 'Resolvido em lote pelo Gestor de Fundo' }],
        };
      }
      return t;
    }));
    toast.success(`${selectedChamados.size} chamado(s) marcado(s) como resolvido(s)`);
    setSelectedChamados(new Set());
    setBatchResolveOpen(false);
  };

  const bannerData = { openTickets: kpis.open, slaAtRisk: chamadosState.filter(t => t.status !== 'resolvido' && differenceInDays(new Date(t.slaDeadline), new Date()) < 0).length, activeAnnouncements: 6, weekReservations: 3 };

  return (
    <div className="space-y-4">
      <OperationsKpiBanner data={bannerData} />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Chamados</h1>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="aberto">Abertos</SelectItem>
              <SelectItem value="em_execucao">Em Execução</SelectItem>
              <SelectItem value="resolvido">Resolvidos</SelectItem>
              <SelectItem value="urgent">Urgentes</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Prioridade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas prioridades</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('aberto')}>
          <p className="text-xs text-muted-foreground">🔴 Abertos</p>
          <p className="text-2xl font-bold">{kpis.open}</p>
          <p className="text-xs text-muted-foreground">chamados</p>
          {kpis.hasStale && <Badge className="bg-red-100 text-red-700 text-[9px] mt-1">Sem atualização &gt;5d</Badge>}
        </Card>
        <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('em_execucao')}>
          <p className="text-xs text-muted-foreground">⚙️ Execução</p>
          <p className="text-2xl font-bold">{kpis.exec}</p>
          <p className="text-xs text-muted-foreground">em andamento</p>
        </Card>
        <Card className={`p-4 cursor-pointer hover:shadow-md transition-shadow ${kpis.urgent > 0 ? 'bg-red-50' : ''}`} onClick={() => setStatusFilter('urgent')}>
          <p className="text-xs text-muted-foreground">⚠️ Urgentes</p>
          <p className="text-2xl font-bold">{kpis.urgent}</p>
          <p className="text-xs text-muted-foreground">aguardando</p>
        </Card>
        <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('resolvido')}>
          <p className="text-xs text-muted-foreground">✅ Resolvidos</p>
          <p className="text-2xl font-bold">{kpis.resolved}</p>
          <p className="text-xs text-muted-foreground">este mês</p>
        </Card>
      </div>

      {/* Batch action bar */}
      {selectedChamados.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between sticky top-0 z-10">
          <span className="text-sm text-blue-800 font-medium">
            {selectedChamados.size} chamado(s) selecionado(s)
          </span>
          <Button size="sm" className="gap-1" onClick={() => setBatchResolveOpen(true)}>
            <CheckCircle2 size={14} /> Marcar como Resolvidos
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="hidden bg-card rounded-xl border overflow-hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 text-xs">
                <Checkbox
                  checked={allUnresolvedSelected && unresolvedTickets.length > 0}
                  onCheckedChange={(checked) => handleSelectAll(!!checked)}
                />
              </TableHead>
              <TableHead className="text-xs">Ativo</TableHead>
              <TableHead className="text-xs">Título</TableHead>
              <TableHead className="text-xs">Unidade</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Prioridade</TableHead>
              <TableHead className="text-xs">SLA</TableHead>
              <TableHead className="text-xs">Custo Est.</TableHead>
              <TableHead className="text-xs">Aberto em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map(t => {
              const sla = getSlaStatus(t);
              const isResolved = t.status === 'resolvido';
              return (
                <TableRow key={t.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {!isResolved && (
                      <Checkbox
                        checked={selectedChamados.has(t.id)}
                        onCheckedChange={(checked) => {
                          const next = new Set(selectedChamados);
                          checked ? next.add(t.id) : next.delete(t.id);
                          setSelectedChamados(next);
                        }}
                      />
                    )}
                  </TableCell>
                  <TableCell className="text-sm font-medium" onClick={() => setSelectedTicket(t)}>{t.building}</TableCell>
                  <TableCell className="text-sm font-medium" onClick={() => setSelectedTicket(t)}>{t.title}</TableCell>
                  <TableCell className="text-sm" onClick={() => setSelectedTicket(t)}>{t.unit}</TableCell>
                  <TableCell onClick={() => setSelectedTicket(t)}><Badge className={`${statusColors[t.status]} text-[10px]`}>{statusLabels[t.status]}</Badge></TableCell>
                  <TableCell onClick={() => setSelectedTicket(t)}><Badge className={`${priorityColors[t.priority]} text-[10px]`}>{priorityLabels[t.priority]}</Badge></TableCell>
                  <TableCell onClick={() => setSelectedTicket(t)}><span className={`text-xs ${sla.color}`}>{sla.label}</span></TableCell>
                  <TableCell className="text-sm" onClick={() => setSelectedTicket(t)}>R$ {t.estimatedCost.toLocaleString('pt-BR')}</TableCell>
                  <TableCell className="text-sm" onClick={() => setSelectedTicket(t)}>{new Date(t.openedAt).toLocaleDateString('pt-BR')}</TableCell>
                </TableRow>
              );
            })}
            {tickets.length === 0 && (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Nenhum chamado encontrado.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="space-y-3 md:hidden">
        {tickets.map(t => {
          const sla = getSlaStatus(t);
          const isResolved = t.status === 'resolvido';
          return <Card key={t.id} className="p-4" onClick={() => setSelectedTicket(t)}><div className="flex items-start gap-3"><div onClick={e => e.stopPropagation()}>{!isResolved && <Checkbox checked={selectedChamados.has(t.id)} onCheckedChange={checked => { const next = new Set(selectedChamados); checked ? next.add(t.id) : next.delete(t.id); setSelectedChamados(next); }} />}</div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div><p className="text-sm font-semibold">{t.title}</p><p className="mt-1 text-xs text-muted-foreground">{t.building} · {t.unit}</p></div><Badge className={`${statusColors[t.status]} shrink-0 text-[10px]`}>{statusLabels[t.status]}</Badge></div><div className="mt-3 grid grid-cols-3 gap-2 text-xs"><div><span className="block text-muted-foreground">Prioridade</span><strong>{priorityLabels[t.priority]}</strong></div><div><span className="block text-muted-foreground">SLA</span><strong className={sla.color}>{sla.label}</strong></div><div><span className="block text-muted-foreground">Custo</span><strong>R$ {t.estimatedCost.toLocaleString('pt-BR')}</strong></div></div></div></div></Card>;
        })}
        {tickets.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Nenhum chamado encontrado.</p>}
      </div>

      {/* Batch resolve dialog */}
      <Dialog open={batchResolveOpen} onOpenChange={setBatchResolveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolver Chamados em Lote</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja marcar {selectedChamados.size} chamado(s) como resolvido(s)?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {Array.from(selectedChamados).map(id => {
              const t = chamadosState.find(c => c.id === id);
              if (!t) return null;
              return (
                <div key={id} className="flex items-center gap-2 text-sm bg-muted/30 rounded px-3 py-2">
                  <span className="font-medium">{t.id}</span>
                  <span className="text-muted-foreground truncate flex-1">{t.title}</span>
                  <Badge className={`${priorityColors[t.priority]} text-[9px]`}>{priorityLabels[t.priority]}</Badge>
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchResolveOpen(false)}>Cancelar</Button>
            <Button onClick={handleBatchResolve} className="gap-1">
              <CheckCircle2 size={14} /> Confirmar ({selectedChamados.size})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Drawer */}
      <Sheet open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <SheetContent side="center" className="overflow-y-auto">
          {selectedTicket && (() => {
            const sla = getSlaStatus(selectedTicket);
            return (
              <>
                <SheetHeader><SheetTitle>{selectedTicket.id} — {selectedTicket.title}</SheetTitle></SheetHeader>
                <div className="space-y-4 mt-4">
                  <div className="flex gap-2 flex-wrap">
                    <Badge className={`${statusColors[selectedTicket.status]} text-[10px]`}>{statusLabels[selectedTicket.status]}</Badge>
                    <Badge className={`${priorityColors[selectedTicket.priority]} text-[10px]`}>{priorityLabels[selectedTicket.priority]}</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm bg-muted/30 rounded-lg p-3">
                    <div><p className="text-xs text-muted-foreground">Ativo</p><p className="font-semibold">{selectedTicket.building}</p></div>
                    <div><p className="text-xs text-muted-foreground">Unidade</p><p className="font-semibold">{selectedTicket.unit}</p></div>
                    <div><p className="text-xs text-muted-foreground">Aberto em</p><p className="font-semibold">{new Date(selectedTicket.openedAt).toLocaleDateString('pt-BR')}</p></div>
                    <div><p className="text-xs text-muted-foreground">SLA</p><p className="font-semibold">{new Date(selectedTicket.slaDeadline).toLocaleDateString('pt-BR')}</p></div>
                    <div><p className="text-xs text-muted-foreground">Aberto por</p><p className="font-semibold">{selectedTicket.openedBy}</p></div>
                    <div><p className="text-xs text-muted-foreground">Custo est.</p><p className="font-semibold">R$ {selectedTicket.estimatedCost.toLocaleString('pt-BR')}</p></div>
                    <div><p className="text-xs text-muted-foreground">Responsável</p><p className="font-semibold">{selectedTicket.responsible || 'Não atribuído'}</p></div>
                    <div><p className="text-xs text-muted-foreground">SLA Status</p><p className={`font-semibold ${sla.color}`}>{sla.label}</p></div>
                  </div>

                  <p className="text-sm text-muted-foreground">{selectedTicket.description}</p>

                  {/* Timeline */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Histórico</h4>
                    <div className="space-y-0">
                      {selectedTicket.timeline.map((ev, i) => {
                        const isLast = i === selectedTicket.timeline.length - 1;
                        return (
                          <div key={i} className={`flex gap-3 pb-3 ${isLast ? '' : 'border-l-2 border-muted ml-[5px]'}`}>
                            <div className={`w-3 h-3 rounded-full mt-0.5 shrink-0 ${isLast ? 'bg-blue-500 ring-2 ring-blue-200' : 'bg-muted-foreground/30'} ${isLast ? '' : '-ml-[7px]'}`} />
                            <div className={isLast ? '-ml-[1px]' : ''}>
                              <p className={`text-xs ${isLast ? 'font-semibold' : 'font-medium'}`}>{ev.text}</p>
                              <p className="text-[10px] text-muted-foreground">{new Date(ev.date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Attachments */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1"><Paperclip size={12} /> Anexos (0)</h4>
                    <Button size="sm" variant="outline" className="gap-1 text-xs">
                      <Upload size={12} /> Adicionar foto/PDF
                    </Button>
                  </div>

                  {/* Comment */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Adicionar Comentário</h4>
                    <Textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Escreva seu comentário..." rows={3} />
                    <Button size="sm" className="mt-2 gap-1" onClick={() => { setComment(''); toast.success("Comentário enviado!"); }}>
                      <MessageSquare size={14} /> Enviar
                    </Button>
                  </div>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ProprietarioChamados;
