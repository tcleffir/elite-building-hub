import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import ContactGroupSelector from "@/components/ContactGroupSelector";
import PhotoCapture from "@/components/PhotoCapture";
import { Ticket, categoryIcons } from "@/lib/mock-data";
import { toast } from "sonner";
import { ChevronDown, ChevronUp } from "lucide-react";

const categories = Object.keys(categoryIcons);

const spheres = [
  "Gestão de Ativos",
  "Segurança Patrimonial",
  "Limpeza e Conservação",
  "Manutenção Predial",
  "Climatização (PMOC)",
  "Facilities Gerais",
];

const sphereGroupMap: Record<string, string[]> = {
  "Segurança Patrimonial": ["g1"],
  "Limpeza e Conservação": ["g4"],
  "Gestão de Ativos": ["g5"],
  "Manutenção Predial": ["g4"],
  "Climatização (PMOC)": ["g4"],
  "Facilities Gerais": ["g5"],
};

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (ticket: Ticket) => void;
}

export default function NewTicketDialog({ open, onClose, onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [sphere, setSphere] = useState("");
  const [priority, setPriority] = useState<"low" | "normal" | "high" | "urgent">("normal");
  const [floor, setFloor] = useState("0");
  const [notifyGroupIds, setNotifyGroupIds] = useState<string[]>([]);
  const [notifyContactIds, setNotifyContactIds] = useState<string[]>([]);
  const [showNotify, setShowNotify] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);

  const handleSphereChange = (val: string) => {
    setSphere(val);
    const preselect = sphereGroupMap[val];
    if (preselect) {
      setNotifyGroupIds(preselect);
      setShowNotify(true);
    }
  };

  const handleSubmit = () => {
    if (!title.trim() || !category || !sphere) {
      toast.error("Preencha título, categoria e esfera de gestão.");
      return;
    }

    const now = new Date();
    const slaHours = priority === "urgent" ? 4 : priority === "high" ? 8 : priority === "normal" ? 24 : 48;
    const slaDeadline = new Date(now.getTime() + slaHours * 60 * 60 * 1000);

    const newTicket: Ticket = {
      id: `CH-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      title: title.trim(),
      description: description.trim(),
      category,
      sphere,
      priority,
      status: "open",
      requester: "Usuário Atual",
      floor: parseInt(floor),
      created_at: now.toISOString(),
      sla_deadline: slaDeadline.toISOString(),
      comments_count: 0,
      attachments_count: photos.length,
      photos,
      timeline: [
        {
          id: "e1",
          type: "created",
          description: "Chamado aberto",
          author: "Usuário Atual",
          created_at: now.toISOString(),
        },
        ...(photos.length > 0 ? [{
          id: "e2",
          type: "attachment" as const,
          description: `Anexou ${photos.length} foto${photos.length > 1 ? "s" : ""} do problema`,
          author: "Usuário Atual",
          created_at: now.toISOString(),
        }] : []),
      ],
    };

    onCreated(newTicket);

    const totalNotified = notifyGroupIds.length + notifyContactIds.length;
    if (totalNotified > 0) {
      toast.success(`Chamado ${newTicket.id} criado e notificação enviada.`);
    } else {
      toast.success(`Chamado ${newTicket.id} criado com sucesso!`);
    }

    // Reset
    setTitle("");
    setDescription("");
    setCategory("");
    setSphere("");
    setPriority("normal");
    setFloor("0");
    setNotifyGroupIds([]);
    setNotifyContactIds([]);
    setShowNotify(false);
    setPhotos([]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Chamado</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Título *</Label>
            <Input placeholder="Ex: Ar-condicionado do 5º andar com vazamento" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div>
            <Label>Descrição</Label>
            <Textarea placeholder="Descreva o problema em detalhes..." value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[80px]" />
          </div>

          <div className="border rounded-xl p-3">
            <PhotoCapture
              photos={photos}
              onChange={setPhotos}
              label="Fotos do problema"
              max={6}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Categoria *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>{categoryIcons[c]} {c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prioridade</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">🟢 Baixa</SelectItem>
                  <SelectItem value="normal">🟡 Normal</SelectItem>
                  <SelectItem value="high">🟠 Alta</SelectItem>
                  <SelectItem value="urgent">🔴 Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Esfera de Gestão *</Label>
              <Select value={sphere} onValueChange={handleSphereChange}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {spheres.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Andar / Localização</Label>
              <Select value={floor} onValueChange={setFloor}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="-2">Subsolo 2</SelectItem>
                  <SelectItem value="-1">Subsolo 1</SelectItem>
                  <SelectItem value="0">Térreo / Área Comum</SelectItem>
                  {Array.from({ length: 25 }, (_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}º andar</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notification section */}
          <div className="border rounded-xl">
            <button
              onClick={() => setShowNotify(!showNotify)}
              className="w-full flex items-center justify-between p-3 text-left"
            >
              <div>
                <p className="text-sm font-semibold text-foreground">📧 Notificar Contatos / Grupos</p>
                <p className="text-xs text-muted-foreground">Quem deve ser notificado sobre este chamado?</p>
              </div>
              {showNotify ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
            </button>
            {showNotify && (
              <div className="px-3 pb-3">
                <ContactGroupSelector
                  selectedGroupIds={notifyGroupIds}
                  selectedContactIds={notifyContactIds}
                  onGroupsChange={setNotifyGroupIds}
                  onContactsChange={setNotifyContactIds}
                />
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button className="premium-gradient" onClick={handleSubmit}>Criar Chamado</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
