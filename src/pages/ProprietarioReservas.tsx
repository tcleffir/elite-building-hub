import { useState, useMemo } from "react";
import { CalendarDays, Plus, Clock, Eye, X, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getVILG11PortfolioBuildings, mockReservations, Reservation } from "@/lib/mock-data";
import { toast } from "sonner";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import OperationsKpiBanner from "@/components/OperationsKpiBanner";

const statusLabels: Record<string, string> = { confirmed: 'Confirmado', pending: 'Pendente', cancelled: 'Cancelado', in_progress: 'Em andamento', completed: 'Concluído' };
const statusColors: Record<string, string> = { confirmed: 'bg-emerald-100 text-emerald-700', pending: 'bg-amber-100 text-amber-700', cancelled: 'bg-muted text-muted-foreground', in_progress: 'bg-blue-100 text-blue-700', completed: 'bg-slate-100 text-slate-700' };

const areaIcons: Record<string, string> = {
  'Salão de Eventos': '🎉', 'Sala de Reunião — Mezanino': '📋', 'Terraço': '🌿',
  'Espaço Coworking': '💻', 'Sala de Videoconferência': '📹',
};

const commonAreas = [
  { name: 'Salão de Eventos', capacity: 80 },
  { name: 'Sala de Reunião — Mezanino', capacity: 12 },
  { name: 'Terraço', capacity: 40 },
  { name: 'Espaço Coworking', capacity: 20 },
  { name: 'Sala de Videoconferência', capacity: 8 },
];

const timeSlots = Array.from({ length: 29 }, (_, i) => {
  const h = Math.floor(i / 2) + 8;
  const m = i % 2 === 0 ? '00' : '30';
  return `${h.toString().padStart(2, '0')}:${m}`;
});

const occupiedSlots: Record<string, { date: string; start: string; end: string }[]> = {
  'Salão de Eventos': [{ date: '2026-04-15', start: '14:00', end: '16:00' }],
  'Sala de Reunião — Mezanino': [{ date: '2026-04-10', start: '10:00', end: '12:00' }],
  'Terraço': [{ date: '2026-04-12', start: '16:00', end: '19:00' }],
  'Espaço Coworking': [{ date: '2026-04-08', start: '08:00', end: '11:00' }],
  'Sala de Videoconferência': [{ date: '2026-04-09', start: '09:00', end: '10:30' }],
};

const ProprietarioReservas = () => {
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
  const [showNewReservation, setShowNewReservation] = useState(false);
  const [selectedAreaSheet, setSelectedAreaSheet] = useState<string | null>(null);
  const [reservations, setReservations] = useState(mockReservations);
  const [cancelConfirm, setCancelConfirm] = useState<Reservation | null>(null);
  const [detailReservation, setDetailReservation] = useState<Reservation | null>(null);
  const [editReservation, setEditReservation] = useState<Reservation | null>(null);
  const [editArea, setEditArea] = useState('');
  const [editDate, setEditDate] = useState<Date | undefined>(undefined);
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [editNote, setEditNote] = useState('');

  // New reservation form
  const [newArea, setNewArea] = useState('');
  const [newDate, setNewDate] = useState<Date | undefined>(undefined);
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');
  const [newNote, setNewNote] = useState('');

  const userBuildings = getVILG11PortfolioBuildings();

  const getAreaInfo = (name: string) => commonAreas.find(a => a.name === name);
  const getAreaReservationsThisMonth = (name: string) => {
    return reservations.filter(r => r.room_name === name && r.status !== 'cancelled').length;
  };
  const getNextReservation = (name: string) => {
    const future = reservations.filter(r => r.room_name === name && r.status !== 'cancelled' && new Date(r.date) >= new Date()).sort((a, b) => a.date.localeCompare(b.date));
    return future[0];
  };
  const isAvailableToday = (name: string) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const slots = occupiedSlots[name] || [];
    const now = format(new Date(), 'HH:mm');
    return !slots.some(s => s.date === today && s.start <= now && s.end > now);
  };

  // Conflict detection
  const hasConflict = useMemo(() => {
    if (!newArea || !newDate || !newStart || !newEnd) return false;
    const dateStr = format(newDate, 'yyyy-MM-dd');
    const slots = occupiedSlots[newArea] || [];
    return slots.some(s => s.date === dateStr && newStart < s.end && newEnd > s.start);
  }, [newArea, newDate, newStart, newEnd]);

  const canSubmit = newArea && newDate && newStart && newEnd && !hasConflict;

  const handleNewReservation = () => {
    if (!canSubmit || !newDate) return;
    toast.success("Reserva solicitada! Pendente de aprovação.");
    setShowNewReservation(false);
    setNewArea(''); setNewDate(undefined); setNewStart(''); setNewEnd(''); setNewNote('');
  };

  const handleCancel = () => {
    if (!cancelConfirm) return;
    setReservations(prev => prev.map(r => r.id === cancelConfirm.id ? { ...r, status: 'cancelled' as const } : r));
    toast.success("Reserva cancelada.");
    setCancelConfirm(null);
  };

  const openEdit = (r: Reservation) => {
    setEditReservation(r);
    setEditArea(r.room_name);
    setEditDate(new Date(r.date));
    setEditStart(r.start_time);
    setEditEnd(r.end_time);
    setEditNote('');
  };

  const editConflict = useMemo(() => {
    if (!editReservation || !editArea || !editDate || !editStart || !editEnd) return false;
    const dateStr = format(editDate, 'yyyy-MM-dd');
    const otherRes = reservations.filter(r => r.id !== editReservation.id && r.room_name === editArea && r.date === dateStr && r.status !== 'cancelled');
    return otherRes.some(r => editStart < r.end_time && editEnd > r.start_time);
  }, [editReservation, editArea, editDate, editStart, editEnd, reservations]);

  const handleEdit = () => {
    if (!editReservation || !editArea || !editDate || !editStart || !editEnd || editConflict) return;
    setReservations(prev => prev.map(r => r.id === editReservation.id ? {
      ...r,
      room_name: editArea,
      date: format(editDate, 'yyyy-MM-dd'),
      start_time: editStart,
      end_time: editEnd,
    } : r));
    toast.success("Reserva alterada com sucesso!");
    setEditReservation(null);
  };

  // Auto-set end time
  const handleStartChange = (v: string) => {
    setNewStart(v);
    const idx = timeSlots.indexOf(v);
    if (idx >= 0 && idx + 2 < timeSlots.length) setNewEnd(timeSlots[idx + 2]);
  };

  const handleEditStartChange = (v: string) => {
    setEditStart(v);
    const idx = timeSlots.indexOf(v);
    if (idx >= 0 && idx + 2 < timeSlots.length) setEditEnd(timeSlots[idx + 2]);
  };

  const bannerData = { openTickets: 3, slaAtRisk: 1, activeAnnouncements: 6, weekReservations: reservations.filter(r => r.status !== 'cancelled').length };

  return (
    <div className="space-y-4">
      <OperationsKpiBanner data={bannerData} />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Reservas</h1>
        <div className="flex gap-2">
          <Select value={selectedBuildingId} onValueChange={setSelectedBuildingId}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="Selecione o ativo" /></SelectTrigger>
            <SelectContent>
              {userBuildings.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" className="gap-1" onClick={() => setShowNewReservation(true)}>
            <Plus size={14} /> Nova Reserva
          </Button>
        </div>
      </div>

      <Tabs defaultValue="disponibilidade">
        <TabsList>
          <TabsTrigger value="disponibilidade">Disponibilidade</TabsTrigger>
          <TabsTrigger value="minhas">Minhas Reservas</TabsTrigger>
        </TabsList>

        <TabsContent value="disponibilidade" className="space-y-4">
          {!selectedBuildingId ? (
            <div className="bg-card rounded-xl border p-6 text-center">
              <CalendarDays size={40} className="mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Selecione um ativo para ver disponibilidade.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {commonAreas.map(area => {
                const icon = areaIcons[area.name] || '📍';
                const nextRes = getNextReservation(area.name);
                const monthCount = getAreaReservationsThisMonth(area.name);
                const availToday = isAvailableToday(area.name);
                return (
                  <Card key={area.name} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-2 mb-2">
                      <span className="text-2xl">{icon}</span>
                      <div>
                        <p className="font-medium text-sm">{area.name}</p>
                        <p className="text-xs text-muted-foreground">👥 Capacidade: {area.capacity} pessoas</p>
                      </div>
                    </div>
                    <div className="border-t pt-2 mt-2 space-y-1 text-xs">
                      <p>Hoje: {availToday ? <span className="text-green-600 font-medium">✅ Disponível</span> : <span className="text-red-600 font-medium">❌ Ocupado</span>}</p>
                      <p className="text-muted-foreground">Próxima reserva: {nextRes ? `${format(new Date(nextRes.date), 'dd/MM')} ${nextRes.start_time}` : 'Nenhuma'}</p>
                      <p className="text-muted-foreground">Reservas este mês: {monthCount}</p>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" className="flex-1 text-xs gap-1" onClick={() => setSelectedAreaSheet(area.name)}>
                        <CalendarDays size={12} /> Ver Agenda
                      </Button>
                      <Button size="sm" className="flex-1 text-xs gap-1" onClick={() => { setNewArea(area.name); setShowNewReservation(true); }}>
                        <Plus size={12} /> Reservar
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="minhas" className="space-y-4">
          <div className="bg-card rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Área</TableHead>
                  <TableHead className="text-xs">Data</TableHead>
                  <TableHead className="text-xs">Horário</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.slice(0, 8).map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm">{areaIcons[r.room_name] || '📍'} {r.room_name}</TableCell>
                    <TableCell className="text-sm">{format(new Date(r.date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell className="text-sm">{r.start_time} — {r.end_time}</TableCell>
                    <TableCell><Badge className={`${statusColors[r.status] || 'bg-muted'} text-[10px]`}>{statusLabels[r.status] || r.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1.5 rounded hover:bg-muted" onClick={() => setDetailReservation(r)} title="Detalhes"><Eye size={13} /></button>
                        {(r.status === 'pending' || r.status === 'confirmed') && new Date(r.date) >= new Date() && (
                          <>
                            <button className="p-1.5 rounded hover:bg-muted text-blue-600" onClick={() => openEdit(r)} title="Editar"><Pencil size={13} /></button>
                            <button className="p-1.5 rounded hover:bg-destructive/10 text-red-500" onClick={() => setCancelConfirm(r)} title="Cancelar"><X size={13} /></button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Ver Agenda Sheet */}
      <Sheet open={!!selectedAreaSheet} onOpenChange={() => setSelectedAreaSheet(null)}>
        <SheetContent side="center" className="overflow-y-auto">
          {selectedAreaSheet && (
            <>
              <SheetHeader><SheetTitle>{areaIcons[selectedAreaSheet]} {selectedAreaSheet} — Agenda</SheetTitle></SheetHeader>
              <div className="mt-4 space-y-4">
                <Calendar mode="single" className="rounded-md border pointer-events-auto" locale={ptBR} />
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Horários ocupados esta semana</h4>
                  <div className="space-y-2">
                    {(occupiedSlots[selectedAreaSheet] || []).map((s, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg border p-3 bg-muted/50">
                        <span className="text-sm">{format(new Date(s.date), 'dd/MM/yyyy')} — {s.start} às {s.end}</span>
                        <Badge className="bg-muted text-muted-foreground text-[10px]">Ocupado</Badge>
                      </div>
                    ))}
                    {(!occupiedSlots[selectedAreaSheet] || occupiedSlots[selectedAreaSheet].length === 0) && (
                      <p className="text-xs text-muted-foreground">Nenhuma reserva esta semana.</p>
                    )}
                  </div>
                </div>
                <Button className="w-full gap-1" onClick={() => { setSelectedAreaSheet(null); setNewArea(selectedAreaSheet); setShowNewReservation(true); }}>
                  <Plus size={14} /> Nova Reserva para este espaço
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Detail Sheet */}
      <Sheet open={!!detailReservation} onOpenChange={() => setDetailReservation(null)}>
        <SheetContent side="center" className="overflow-y-auto">
          {detailReservation && (
            <>
              <SheetHeader><SheetTitle>Reserva — {detailReservation.room_name}</SheetTitle></SheetHeader>
              <div className="space-y-4 mt-4">
                <Badge className={`${statusColors[detailReservation.status]} text-[10px]`}>{statusLabels[detailReservation.status] || detailReservation.status}</Badge>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-xs text-muted-foreground">Título</p><p className="font-semibold">{detailReservation.title}</p></div>
                  <div><p className="text-xs text-muted-foreground">Solicitante</p><p className="font-semibold">{detailReservation.tenant}</p></div>
                  <div><p className="text-xs text-muted-foreground">Data</p><p className="font-semibold">{format(new Date(detailReservation.date), 'dd/MM/yyyy')}</p></div>
                  <div><p className="text-xs text-muted-foreground">Horário</p><p className="font-semibold">{detailReservation.start_time} — {detailReservation.end_time}</p></div>
                  <div><p className="text-xs text-muted-foreground">Participantes</p><p className="font-semibold">{detailReservation.participants}</p></div>
                </div>
                {(detailReservation.status === 'pending' || detailReservation.status === 'confirmed') && new Date(detailReservation.date) >= new Date() && (
                  <div className="flex gap-2 pt-2 border-t">
                    <Button size="sm" variant="outline" className="gap-1 flex-1" onClick={() => { setDetailReservation(null); openEdit(detailReservation); }}>
                      <Pencil size={13} /> Editar
                    </Button>
                    <Button size="sm" variant="destructive" className="gap-1 flex-1" onClick={() => { setDetailReservation(null); setCancelConfirm(detailReservation); }}>
                      <X size={13} /> Cancelar
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Cancel Confirmation */}
      <Dialog open={!!cancelConfirm} onOpenChange={() => setCancelConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar reserva</DialogTitle>
            <DialogDescription>
              Cancelar reserva de {cancelConfirm?.room_name} em {cancelConfirm ? format(new Date(cancelConfirm.date), 'dd/MM/yyyy') : ''}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelConfirm(null)}>Não</Button>
            <Button variant="destructive" onClick={handleCancel}>Sim, cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Reservation Dialog */}
      <Dialog open={!!editReservation} onOpenChange={v => { if (!v) setEditReservation(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Editar Reserva</DialogTitle><DialogDescription>Altere área, data ou horário da reserva</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Área comum</Label>
              <Select value={editArea} onValueChange={setEditArea}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {commonAreas.map(a => <SelectItem key={a.name} value={a.name}>{areaIcons[a.name]} {a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal mt-1", !editDate && "text-muted-foreground")}>
                    <CalendarDays size={14} className="mr-2" />
                    {editDate ? format(editDate, 'dd/MM/yyyy') : 'Selecione a data'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                  <Calendar mode="single" selected={editDate} onSelect={setEditDate} disabled={d => d < new Date()} initialFocus className="p-3 pointer-events-auto" locale={ptBR} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Hora início</Label>
                <Select value={editStart} onValueChange={handleEditStartChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{timeSlots.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Hora fim</Label>
                <Select value={editEnd} onValueChange={setEditEnd}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{timeSlots.filter(t => t > editStart).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            {editArea && editDate && editStart && editEnd && (
              editConflict ? (
                <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">❌ Conflito de horário — escolha outro</div>
              ) : (
                <div className="p-2 rounded-lg bg-green-50 border border-green-200 text-xs text-green-700 font-medium">✅ Horário disponível</div>
              )
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditReservation(null)}>Cancelar</Button>
            <Button onClick={handleEdit} disabled={!editArea || !editDate || !editStart || !editEnd || editConflict} className="gap-1">Salvar alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Reservation Dialog */}
      <Dialog open={showNewReservation} onOpenChange={v => { if (!v) { setShowNewReservation(false); setNewArea(''); setNewDate(undefined); setNewStart(''); setNewEnd(''); setNewNote(''); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nova Reserva</DialogTitle><DialogDescription>Selecione área, data e horário</DialogDescription></DialogHeader>
          <div className="space-y-4">
            {/* Area */}
            <div>
              <Label className="text-xs">Área comum</Label>
              <Select value={newArea} onValueChange={setNewArea}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {commonAreas.map(a => <SelectItem key={a.name} value={a.name}>{areaIcons[a.name]} {a.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {newArea && (() => {
                const info = getAreaInfo(newArea);
                return info ? (
                  <div className="mt-2 p-2 rounded-lg bg-muted/50 text-xs flex items-center gap-2">
                    <span className="text-lg">{areaIcons[newArea]}</span>
                    <div>
                      <p className="font-medium">{newArea}</p>
                      <p className="text-muted-foreground">👥 {info.capacity} pessoas | {isAvailableToday(newArea) ? 'Disponível hoje' : 'Ocupado hoje'}</p>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
            {/* Date */}
            <div>
              <Label className="text-xs">Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal mt-1", !newDate && "text-muted-foreground")}>
                    <CalendarDays size={14} className="mr-2" />
                    {newDate ? format(newDate, 'dd/MM/yyyy') : 'Selecione a data'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                  <Calendar mode="single" selected={newDate} onSelect={setNewDate} disabled={d => d < new Date()} initialFocus className="p-3 pointer-events-auto" locale={ptBR} />
                </PopoverContent>
              </Popover>
            </div>
            {/* Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Hora início</Label>
                <Select value={newStart} onValueChange={handleStartChange}>
                  <SelectTrigger><SelectValue placeholder="Início" /></SelectTrigger>
                  <SelectContent>
                    {timeSlots.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Hora fim</Label>
                <Select value={newEnd} onValueChange={setNewEnd}>
                  <SelectTrigger><SelectValue placeholder="Fim" /></SelectTrigger>
                  <SelectContent>
                    {timeSlots.filter(t => t > newStart).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Conflict check */}
            {newArea && newDate && newStart && newEnd && (
              hasConflict ? (
                <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">❌ Já reservado — escolha outro horário</div>
              ) : (
                <div className="p-2 rounded-lg bg-green-50 border border-green-200 text-xs text-green-700 font-medium">✅ Disponível neste horário</div>
              )
            )}
            <div><Label className="text-xs">Observação</Label><Textarea rows={2} placeholder="Opcional..." value={newNote} onChange={e => setNewNote(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewReservation(false)}>Cancelar</Button>
            <Button onClick={handleNewReservation} disabled={!canSubmit} className="gap-1">Solicitar Reserva →</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProprietarioReservas;
