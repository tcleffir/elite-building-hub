import { useState, useEffect, useMemo } from "react";
import { CalendarEvent, CalendarEventType, EVENT_TYPE_CONFIG, Participant } from "@/constants/calendar/eventTypeConfig";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { getHGRE11PortfolioBuildings } from "@/lib/mock-data";
import { mockContacts } from "@/lib/contacts-data";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, X, Search, Plus } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
  editingEvent: CalendarEvent | null;
  availableBuildings?: string[];
  initialDate?: Date | null;
}

const TIME_OPTIONS = Array.from({ length: 29 }, (_, i) => {
  const h = Math.floor(i / 2) + 8;
  const m = i % 2 === 0 ? '00' : '30';
  return `${String(h).padStart(2, '0')}:${m}`;
});

const CATEGORY_BUTTONS: { type: CalendarEventType; emoji: string; label: string }[] = [
  { type: 'contract_expiry', emoji: '📋', label: 'Contratos' },
  { type: 'maintenance_scheduled', emoji: '🔧', label: 'Manutenção' },
  { type: 'assembly_ago', emoji: '🏛', label: 'Assembleia' },
  { type: 'invoice_due', emoji: '💰', label: 'Boleto' },
  { type: 'inspection', emoji: '🔍', label: 'Vistoria' },
  { type: 'custom', emoji: '⭐', label: 'Personalizado' },
];

const EventForm = ({ open, onClose, onSave, editingEvent, availableBuildings, initialDate }: Props) => {
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState<CalendarEventType>('custom');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [endTime, setEndTime] = useState('10:00');
  const [isAllDay, setIsAllDay] = useState(false);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [buildingName, setBuildingName] = useState('');
  const [reminder, setReminder] = useState('none');
  const [recurrence, setRecurrence] = useState('none');
  const [priority, setPriority] = useState<'normal' | 'high' | 'urgent'>('normal');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [participantSearch, setParticipantSearch] = useState('');
  const [emailInput, setEmailInput] = useState('');

  const portfolioBuildings = getHGRE11PortfolioBuildings();
  const buildingOptions = availableBuildings?.length ? availableBuildings : portfolioBuildings.map(b => b.name);

  const filteredContacts = useMemo(() =>
    mockContacts.filter(c =>
      c.isActive &&
      !participants.some(p => p.email === c.email) &&
      (c.name.toLowerCase().includes(participantSearch.toLowerCase()) || c.email.toLowerCase().includes(participantSearch.toLowerCase()))
    ).slice(0, 6),
    [participantSearch, participants]
  );

  useEffect(() => {
    if (editingEvent) {
      setTitle(editingEvent.title);
      setEventType(editingEvent.event_type);
      setStartDate(new Date(editingEvent.start_at.split('T')[0] + 'T12:00:00'));
      setStartTime(editingEvent.start_at.includes('T') ? editingEvent.start_at.split('T')[1]?.slice(0, 5) || '09:00' : '09:00');
      if (editingEvent.end_at) {
        setEndDate(new Date(editingEvent.end_at.split('T')[0] + 'T12:00:00'));
        setEndTime(editingEvent.end_at.includes('T') ? editingEvent.end_at.split('T')[1]?.slice(0, 5) || '10:00' : '10:00');
      } else {
        setEndDate(undefined);
        setEndTime('10:00');
      }
      setIsAllDay(editingEvent.is_all_day);
      setLocation(editingEvent.location || '');
      setDescription(editingEvent.description || '');
      setBuildingName(editingEvent.building_name || '');
      setReminder(editingEvent.reminder || 'none');
      setRecurrence(editingEvent.recurrence || 'none');
      setPriority(editingEvent.priority || 'normal');
      setParticipants(editingEvent.participants || []);
    } else {
      setTitle(''); setEventType('custom');
      setStartDate(initialDate || undefined);
      setStartTime('09:00');
      setEndDate(undefined); setEndTime('10:00'); setIsAllDay(false); setLocation(''); setDescription('');
      setBuildingName(''); setReminder('none'); setRecurrence('none'); setPriority('normal'); setParticipants([]);
    }
  }, [editingEvent, open, initialDate]);

  // Auto-set end time to start + 1h
  useEffect(() => {
    if (!editingEvent) {
      const idx = TIME_OPTIONS.indexOf(startTime);
      if (idx >= 0 && idx + 2 < TIME_OPTIONS.length) {
        setEndTime(TIME_OPTIONS[idx + 2]);
      }
    }
  }, [startTime, editingEvent]);

  const handleAddParticipant = (name: string, email: string, type: 'contact' | 'external' = 'contact') => {
    if (participants.some(p => p.email === email)) return;
    setParticipants(prev => [...prev, { name, email, type }]);
    setParticipantSearch('');
  };

  const handleEmailSubmit = () => {
    const email = emailInput.trim();
    if (email && email.includes('@')) {
      handleAddParticipant(email, email, 'external');
      setEmailInput('');
    }
  };

  const handleSave = () => {
    if (!title.trim() || title.trim().length < 3) {
      toast.error('O título deve ter pelo menos 3 caracteres');
      return;
    }
    if (!startDate) {
      toast.error('Selecione a data de início');
      return;
    }

    const sd = format(startDate, 'yyyy-MM-dd');
    const ed = endDate ? format(endDate, 'yyyy-MM-dd') : undefined;
    const start_at = isAllDay ? sd : `${sd}T${startTime}:00`;
    const end_at = ed ? (isAllDay ? ed : `${ed}T${endTime}:00`) : (!isAllDay ? `${sd}T${endTime}:00` : undefined);

    onSave({
      id: editingEvent?.id || '',
      event_type: eventType,
      title: title.trim(),
      description: description.trim() || undefined,
      start_at,
      end_at,
      is_all_day: isAllDay,
      location: location.trim() || undefined,
      status: editingEvent?.status || 'scheduled',
      source: 'manual',
      building_name: buildingName || undefined,
      reminder,
      recurrence,
      priority,
      participants: participants.length > 0 ? participants : undefined,
    });

    toast.success(editingEvent ? 'Evento atualizado!' : 'Evento criado!');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingEvent ? 'Editar Evento' : 'Novo Evento'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Title */}
          <div>
            <Label>Título <span className="text-destructive">*</span></Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título do evento" className="mt-1" />
          </div>

          {/* Event type - ToggleGroup */}
          <div>
            <Label>Tipo de Evento</Label>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {CATEGORY_BUTTONS.map(cat => {
                const active = eventType === cat.type;
                const cfg = EVENT_TYPE_CONFIG[cat.type];
                return (
                  <button
                    key={cat.type}
                    type="button"
                    onClick={() => setEventType(cat.type)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                      active
                        ? `${cfg.pillBg} ${cfg.pillText} border-current`
                        : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
                    )}
                  >
                    {cat.emoji} {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Building */}
          <div>
            <Label>Ativo</Label>
            <Select value={buildingName} onValueChange={setBuildingName}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos / Geral</SelectItem>
                {buildingOptions.map(name => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dates with DatePicker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Data início <span className="text-destructive">*</span></Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal mt-1", !startDate && "text-muted-foreground")}>
                    <CalendarIcon size={14} className="mr-2" />
                    {startDate ? format(startDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar data'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} locale={ptBR} />
                </PopoverContent>
              </Popover>
            </div>
            {!isAllDay && (
              <div>
                <Label>Hora início</Label>
                <Select value={startTime} onValueChange={setStartTime}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-48">
                    {TIME_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Data fim</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal mt-1", !endDate && "text-muted-foreground")}>
                    <CalendarIcon size={14} className="mr-2" />
                    {endDate ? format(endDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Mesma data'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} locale={ptBR} />
                </PopoverContent>
              </Popover>
            </div>
            {!isAllDay && (
              <div>
                <Label>Hora fim</Label>
                <Select value={endTime} onValueChange={setEndTime}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-48">
                    {TIME_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox checked={isAllDay} onCheckedChange={v => setIsAllDay(!!v)} id="allday" />
            <Label htmlFor="allday" className="text-sm cursor-pointer">Dia inteiro</Label>
          </div>

          {/* Location */}
          <div>
            <Label>Local</Label>
            <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="Local do evento" className="mt-1" />
          </div>

          {/* Participants */}
          <div>
            <Label>Participantes / Stakeholders</Label>
            {participants.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1.5 mb-2">
                {participants.map((p, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-xs font-medium">
                    👤 {p.name}
                    <button type="button" onClick={() => setParticipants(prev => prev.filter((_, j) => j !== i))} className="ml-0.5 hover:text-destructive">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="relative mt-1">
              <Search size={14} className="absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input
                value={participantSearch}
                onChange={e => setParticipantSearch(e.target.value)}
                placeholder="Buscar contato ou digitar e-mail..."
                className="pl-8"
              />
            </div>
            {participantSearch && (
              <div className="border rounded-lg mt-1 max-h-36 overflow-y-auto">
                {filteredContacts.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleAddParticipant(c.name, c.email)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors border-b last:border-0"
                  >
                    <p className="font-medium">{c.name}</p>
                    <p className="text-[10px] text-muted-foreground">{c.jobTitle} — {c.email}</p>
                  </button>
                ))}
                {filteredContacts.length === 0 && participantSearch.includes('@') && (
                  <button
                    type="button"
                    onClick={() => { handleAddParticipant(participantSearch, participantSearch, 'external'); setParticipantSearch(''); }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-muted"
                  >
                    <Plus size={12} className="inline mr-1" />Adicionar "{participantSearch}" como externo
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Priority */}
          <div>
            <Label>Prioridade</Label>
            <div className="flex gap-1.5 mt-1.5">
              {(['normal', 'high', 'urgent'] as const).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                    priority === p
                      ? p === 'urgent' ? 'bg-red-100 text-red-700 border-red-300'
                        : p === 'high' ? 'bg-orange-100 text-orange-700 border-orange-300'
                        : 'bg-slate-100 text-slate-700 border-slate-300'
                      : 'bg-muted text-muted-foreground border-transparent'
                  )}
                >
                  {p === 'urgent' ? '🚨 Urgente' : p === 'high' ? '⚠️ Alta' : 'Normal'}
                </button>
              ))}
            </div>
          </div>

          {/* Reminder & Recurrence */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Lembrete</Label>
              <Select value={reminder} onValueChange={setReminder}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem lembrete</SelectItem>
                  <SelectItem value="15min">15 min antes</SelectItem>
                  <SelectItem value="1h">1 hora antes</SelectItem>
                  <SelectItem value="1d">1 dia antes</SelectItem>
                  <SelectItem value="1w">1 semana antes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Recorrência</Label>
              <Select value={recurrence} onValueChange={setRecurrence}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Não repete</SelectItem>
                  <SelectItem value="daily">Diariamente</SelectItem>
                  <SelectItem value="weekly">Semanalmente</SelectItem>
                  <SelectItem value="monthly">Mensalmente</SelectItem>
                  <SelectItem value="yearly">Anualmente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div>
            <Label>Notas / Descrição</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descreva o evento..." rows={3} className="mt-1" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button className="premium-gradient" onClick={handleSave}>
            {editingEvent ? 'Salvar alterações' : 'Criar evento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EventForm;
