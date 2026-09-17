import { useState } from "react";
import { CalendarDays, Plus, MapPin, Users, Monitor, ChevronLeft, ChevronRight, Clock, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mockRooms, mockReservations, Room, Reservation } from "@/lib/mock-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MobileTabSelect } from "@/components/MobileTabSelect";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatusBadge from "@/components/StatusBadge";
import { useApp } from "@/contexts/AppContext";
import { permissionsByRole } from "@/lib/role-config";
import { toast } from "sonner";

const hours = Array.from({ length: 30 }, (_, i) => {
  const h = Math.floor(i / 2) + 7;
  const m = i % 2 === 0 ? '00' : '30';
  return `${h.toString().padStart(2, '0')}:${m}`;
});

const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

const Reservas = () => {
  const { user } = useApp();
  const permissions = permissionsByRole[user.role];
  const canViewAll = permissions.canViewAllReservations;
  const [tab, setTab] = useState('calendar');
  const [selectedRoom, setSelectedRoom] = useState<string[]>(mockRooms.map(r => r.id));
  const [reservations, setReservations] = useState<Reservation[]>(mockReservations);
  const [newReservaOpen, setNewReservaOpen] = useState(false);
  const [preselectedRoom, setPreselectedRoom] = useState('');
  const [form, setForm] = useState({ room: '', date: '', startTime: '', endTime: '', title: '', participants: '' });

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + 1);

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const userCompany = user.company || '';

  const getReservationsForSlot = (date: Date, hour: string) => {
    const dateStr = date.toISOString().split('T')[0];
    return reservations.filter(r =>
      r.date === dateStr && r.start_time <= hour && r.end_time > hour && selectedRoom.includes(r.room_id)
    );
  };

  const isOwnReservation = (r: Reservation) => {
    return r.tenant === userCompany || r.user === user.full_name;
  };

  const myReservations = canViewAll
    ? reservations
    : reservations.filter(r => isOwnReservation(r));

  const openNewReserva = (roomId?: string) => {
    setForm({ room: roomId || '', date: '', startTime: '', endTime: '', title: '', participants: '' });
    setPreselectedRoom(roomId || '');
    setNewReservaOpen(true);
  };

  const handleCreateReserva = () => {
    if (!form.room || !form.date || !form.startTime || !form.endTime || !form.title) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    const room = mockRooms.find(r => r.id === form.room);
    const newRes: Reservation = {
      id: `res-${Date.now()}`,
      room_id: form.room,
      room_name: room?.name || '',
      date: form.date,
      start_time: form.startTime,
      end_time: form.endTime,
      title: form.title,
      tenant: user.company || '',
      user: user.full_name,
      status: 'confirmed',
      participants: 0,
      resources: [],
    };
    setReservations(prev => [...prev, newRes]);
    toast.success(`Reserva "${form.title}" criada para ${room?.name}!`);
    setNewReservaOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Reservas</h1>
          <p className="text-sm text-muted-foreground">Gerencie reservas de ambientes do ativo</p>
        </div>
        {permissions.canCreateReservations && (
          <Button className="premium-gradient gap-2" onClick={() => openNewReserva()}><Plus size={16} />Nova Reserva</Button>
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <MobileTabSelect
          tabs={[
            { value: 'calendar', label: '📅 Calendário' },
            { value: 'rooms', label: '🏠 Ambientes' },
            { value: 'list', label: '📋 Minhas Reservas' },
          ]}
          value={tab}
          onValueChange={setTab}
        >
          <TabsList className="w-full overflow-x-auto flex-nowrap justify-start">
            <TabsTrigger value="calendar" className="whitespace-nowrap text-xs sm:text-sm">📅 Calendário</TabsTrigger>
            <TabsTrigger value="rooms" className="whitespace-nowrap text-xs sm:text-sm">🏠 Ambientes</TabsTrigger>
            <TabsTrigger value="list" className="whitespace-nowrap text-xs sm:text-sm">📋 Minhas Reservas</TabsTrigger>
          </TabsList>
        </MobileTabSelect>

        <TabsContent value="calendar" className="mt-4">
          <div className="flex gap-4">
            <div className="hidden lg:block w-48 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Ambientes</p>
              <button onClick={() => setSelectedRoom(selectedRoom.length === mockRooms.length ? [] : mockRooms.map(r => r.id))} className="text-xs text-interactive">
                {selectedRoom.length === mockRooms.length ? 'Nenhum' : 'Todos'}
              </button>
              {mockRooms.map(room => (
                <label key={room.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedRoom.includes(room.id)}
                    onChange={e => {
                      if (e.target.checked) setSelectedRoom([...selectedRoom, room.id]);
                      else setSelectedRoom(selectedRoom.filter(id => id !== room.id));
                    }}
                    className="rounded"
                  />
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: room.color }} />
                  <span className="text-xs">{room.name}</span>
                </label>
              ))}
            </div>

            <div className="flex-1 bg-card rounded-2xl premium-shadow overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <Button variant="ghost" size="icon"><ChevronLeft size={16} /></Button>
                <span className="text-sm font-semibold">{weekStart.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
                <Button variant="ghost" size="icon"><ChevronRight size={16} /></Button>
              </div>
              <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                  <div className="grid grid-cols-8 border-b">
                    <div className="p-2 text-xs text-muted-foreground" />
                    {weekDates.map((d, i) => (
                      <div key={i} className={`p-2 text-center border-l ${d.toDateString() === today.toDateString() ? 'bg-interactive/5' : ''}`}>
                        <p className="text-xs font-semibold text-muted-foreground">{weekDays[i]}</p>
                        <p className={`text-lg font-bold ${d.toDateString() === today.toDateString() ? 'text-interactive' : 'text-foreground'}`}>{d.getDate()}</p>
                      </div>
                    ))}
                  </div>
                  <div className="max-h-[500px] overflow-y-auto">
                    {hours.filter((_, i) => i % 2 === 0).map((hour) => (
                      <div key={hour} className="grid grid-cols-8 border-b border-border/30 min-h-[40px]">
                        <div className="p-1 text-[10px] text-muted-foreground text-right pr-2 flex items-start justify-end">{hour}</div>
                        {weekDates.map((d, i) => {
                          const slotReservations = getReservationsForSlot(d, hour);
                          return (
                            <div key={i} className={`border-l p-0.5 ${d.toDateString() === today.toDateString() ? 'bg-interactive/5' : ''}`}>
                              {slotReservations.map(r => {
                                const room = mockRooms.find(rm => rm.id === r.room_id);
                                const mine = isOwnReservation(r);
                                if (!canViewAll && !mine) {
                                  return (
                                    <div key={r.id} className="text-[9px] px-1 py-0.5 rounded bg-muted text-muted-foreground truncate flex items-center gap-0.5">
                                      <Lock size={8} /> Indisponível
                                    </div>
                                  );
                                }
                                return (
                                  <div key={r.id} className="text-[9px] px-1 py-0.5 rounded text-white truncate" style={{ backgroundColor: room?.color || 'hsl(var(--interactive))' }}>
                                    {r.title}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="rooms" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockRooms.map((room) => (
              <div key={room.id} className="bg-card rounded-2xl p-5 premium-shadow animate-fade-in hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{room.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin size={12} className="text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{room.floor}º andar</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${room.available ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                    {room.available ? "Disponível" : "Ocupado"}
                  </span>
                </div>
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Users size={12} />{room.capacity} pessoas</div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Monitor size={12} />{room.type}</div>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {room.amenities.map((a) => (
                    <span key={a} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{a}</span>
                  ))}
                </div>
                {permissions.canCreateReservations && (
                  <Button variant="outline" className="w-full text-sm" disabled={!room.available} onClick={() => openNewReserva(room.id)}>
                    <CalendarDays size={14} className="mr-2" />Reservar
                  </Button>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          <div className="bg-card rounded-2xl premium-shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Ambiente</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Título</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Data</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Horário</th>
                    {canViewAll && <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Empresa</th>}
                    <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {myReservations.map((r, i) => (
                    <tr key={r.id} className={`border-b border-border/50 last:border-0 hover:bg-muted/30 ${i % 2 === 1 ? "bg-muted/10" : ""}`}>
                      <td className="px-5 py-3 text-sm font-medium">{r.room_name}</td>
                      <td className="px-5 py-3 text-sm">{r.title}</td>
                      <td className="px-5 py-3 text-sm text-muted-foreground">{new Date(r.date).toLocaleDateString('pt-BR')}</td>
                      <td className="px-5 py-3 text-sm text-muted-foreground">{r.start_time} - {r.end_time}</td>
                      {canViewAll && <td className="px-5 py-3 text-sm text-muted-foreground">{r.tenant}</td>}
                      <td className="px-5 py-3 text-center"><StatusBadge status={r.status} /></td>
                    </tr>
                  ))}
                  {myReservations.length === 0 && (
                    <tr><td colSpan={canViewAll ? 6 : 5} className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhuma reserva encontrada</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Nova Reserva Dialog */}
      <Dialog open={newReservaOpen} onOpenChange={setNewReservaOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Reserva</DialogTitle>
            <DialogDescription>Preencha os dados para reservar um ambiente.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs">Ambiente *</Label>
              <Select value={form.room} onValueChange={v => setForm(p => ({ ...p, room: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione o ambiente" /></SelectTrigger>
                <SelectContent>
                  {mockRooms.filter(r => r.available).map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.name} — {r.floor}º andar ({r.capacity} pessoas)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Título da reserva *</Label>
              <Input className="mt-1" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Ex: Reunião de planejamento" />
            </div>
            <div>
              <Label className="text-xs">Data *</Label>
              <Input type="date" className="mt-1" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Horário Início *</Label>
                <Input type="time" className="mt-1" value={form.startTime} onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Horário Fim *</Label>
                <Input type="time" className="mt-1" value={form.endTime} onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Participantes (opcional)</Label>
              <Input className="mt-1" value={form.participants} onChange={e => setForm(p => ({ ...p, participants: e.target.value }))} placeholder="Nomes dos participantes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewReservaOpen(false)}>Cancelar</Button>
            <Button className="premium-gradient" onClick={handleCreateReserva}>Confirmar Reserva</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Reservas;
