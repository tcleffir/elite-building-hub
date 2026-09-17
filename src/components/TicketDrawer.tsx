import { X, MessageSquare, Paperclip, AlertTriangle, Clock, User, Star, Send, CheckCircle2, Circle, ArrowRight, FileText, Shield } from "lucide-react";
import VendorReviewSection from "@/components/VendorReviewSection";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import StatusBadge from "@/components/StatusBadge";
import { Ticket, categoryIcons } from "@/lib/mock-data";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PhotoCapture from "@/components/PhotoCapture";

interface TicketDrawerProps {
  ticket: Ticket | null;
  open: boolean;
  onClose: () => void;
  onUpdatePhotos?: (ticketId: string, photos: string[]) => void;
}

const eventIcons: Record<string, { icon: React.ReactNode; color: string }> = {
  created: { icon: <Circle size={14} />, color: 'text-interactive' },
  assigned: { icon: <User size={14} />, color: 'text-purple-500' },
  status_changed: { icon: <ArrowRight size={14} />, color: 'text-amber-500' },
  comment: { icon: <MessageSquare size={14} />, color: 'text-muted-foreground' },
  attachment: { icon: <Paperclip size={14} />, color: 'text-amber-600' },
  escalated: { icon: <AlertTriangle size={14} />, color: 'text-destructive' },
  completed: { icon: <CheckCircle2 size={14} />, color: 'text-success' },
};

const TicketDrawer = ({ ticket, open, onClose, onUpdatePhotos }: TicketDrawerProps) => {
  const [comment, setComment] = useState("");
  const [isInternal, setIsInternal] = useState(false);

  if (!ticket) return null;

  const photos = ticket.photos ?? [];

  const slaDeadline = new Date(ticket.sla_deadline);
  const created = new Date(ticket.created_at);
  const now = new Date();
  const totalSla = slaDeadline.getTime() - created.getTime();
  const elapsed = now.getTime() - created.getTime();
  const slaPercent = Math.min(100, Math.max(0, (elapsed / totalSla) * 100));
  const slaExpired = now > slaDeadline;
  const hoursRemaining = Math.max(0, Math.floor((slaDeadline.getTime() - now.getTime()) / (1000 * 60 * 60)));

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="center" className="overflow-y-auto p-0">
        {/* Header */}
        <div className="sticky top-0 bg-card z-10 border-b p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-muted-foreground">{ticket.id}</span>
              <StatusBadge status={ticket.status} />
              <StatusBadge status={ticket.priority} type="priority" />
            </div>
          </div>
          <SheetHeader>
            <SheetTitle className="text-left text-lg">{ticket.title}</SheetTitle>
          </SheetHeader>
        </div>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-5 h-auto py-0">
            <TabsTrigger value="info" className="rounded-none border-b-2 border-transparent data-[state=active]:border-interactive data-[state=active]:bg-transparent py-3 text-sm">Informações</TabsTrigger>
            <TabsTrigger value="timeline" className="rounded-none border-b-2 border-transparent data-[state=active]:border-interactive data-[state=active]:bg-transparent py-3 text-sm">Timeline</TabsTrigger>
            <TabsTrigger value="comments" className="rounded-none border-b-2 border-transparent data-[state=active]:border-interactive data-[state=active]:bg-transparent py-3 text-sm">
              Comentários ({ticket.comments_count})
            </TabsTrigger>
            <TabsTrigger value="files" className="rounded-none border-b-2 border-transparent data-[state=active]:border-interactive data-[state=active]:bg-transparent py-3 text-sm">
              Arquivos ({ticket.attachments_count})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="p-5 space-y-5 mt-0">
            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Categoria</p>
                <p className="text-sm font-medium">{categoryIcons[ticket.category] || '📋'} {ticket.category}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Esfera</p>
                <p className="text-sm font-medium">{ticket.sphere}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Localização</p>
                <p className="text-sm font-medium">{ticket.floor > 0 ? `${ticket.floor}º andar` : ticket.floor === 0 ? 'Térreo/Comum' : `Subsolo ${Math.abs(ticket.floor)}`}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Solicitante</p>
                <p className="text-sm font-medium">{ticket.requester}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Responsável</p>
                <div className="flex items-center gap-2">
                  {ticket.assigned_to ? (
                    <>
                      <div className="w-6 h-6 rounded-full bg-interactive/20 flex items-center justify-center text-xs font-bold text-interactive">
                        {ticket.assigned_to[0]}
                      </div>
                      <p className="text-sm font-medium">{ticket.assigned_to}</p>
                    </>
                  ) : (
                    <p className="text-sm text-destructive font-medium">Não atribuído</p>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Data de Abertura</p>
                <p className="text-sm font-medium">{new Date(ticket.created_at).toLocaleDateString('pt-BR')} {new Date(ticket.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>

            {/* Description */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Descrição</p>
              <p className="text-sm text-foreground leading-relaxed">{ticket.description}</p>
            </div>

            {/* Photos preview (read-only here, full management in Arquivos tab) */}
            {photos.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">📸 Fotos do problema ({photos.length})</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {photos.map((src, i) => (
                    <a
                      key={i}
                      href={src}
                      target="_blank"
                      rel="noreferrer"
                      className="aspect-square rounded-xl overflow-hidden border bg-muted block hover:opacity-90"
                    >
                      <img src={src} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* SLA */}
            <div className="bg-muted/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock size={14} className={slaExpired ? 'text-destructive' : slaPercent > 80 ? 'text-destructive' : slaPercent > 50 ? 'text-amber-500' : 'text-success'} />
                  <span className="text-sm font-semibold">SLA</span>
                </div>
                <span className={`text-xs font-semibold ${slaExpired ? 'text-destructive' : 'text-success'}`}>
                  {slaExpired ? `VENCIDO` : `${hoursRemaining}h restantes`}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${slaExpired ? 'bg-destructive' : slaPercent > 80 ? 'bg-destructive' : slaPercent > 50 ? 'bg-amber-500' : 'bg-success'}`}
                  style={{ width: `${Math.min(100, slaPercent)}%` }}
                />
              </div>
            </div>

            {/* Vendor Review (only when completed) */}
            <VendorReviewSection ticket={ticket} />
          </TabsContent>

          <TabsContent value="timeline" className="p-5 mt-0">
            <div className="relative pl-6 space-y-4">
              <div className="absolute left-[11px] top-1 bottom-1 w-px bg-border" />
              {ticket.timeline.map((event) => {
                const iconConfig = eventIcons[event.type] || eventIcons.comment;
                return (
                  <div key={event.id} className="relative">
                    <div className={`absolute -left-6 top-0.5 w-6 h-6 rounded-full bg-card border-2 border-border flex items-center justify-center ${iconConfig.color}`}>
                      {iconConfig.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{event.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.author} • {new Date(event.created_at).toLocaleDateString('pt-BR')} {new Date(event.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="comments" className="p-5 mt-0 space-y-4">
            <div className="space-y-3">
              {ticket.timeline.filter(e => e.type === 'comment').map((event) => (
                <div key={event.id} className={`p-3 rounded-xl ${event.is_internal ? 'bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30' : 'bg-muted/50'}`}>
                  {event.is_internal && <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1 block">🔒 Comentário Interno</span>}
                  <p className="text-sm">{event.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">{event.author} • {new Date(event.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
              ))}
              {ticket.timeline.filter(e => e.type === 'comment').length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum comentário ainda</p>
              )}
            </div>

            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsInternal(!isInternal)}
                  className={`text-xs font-semibold px-3 py-1 rounded-full transition-colors ${isInternal ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-muted text-muted-foreground'}`}
                >
                  {isInternal ? '🔒 Interno' : '🌐 Público'}
                </button>
              </div>
              <div className="flex gap-2">
                <Textarea placeholder="Adicionar comentário..." value={comment} onChange={(e) => setComment(e.target.value)} className="min-h-[80px]" />
              </div>
              <div className="flex justify-between">
                <Button variant="outline" size="sm" className="gap-1"><Paperclip size={14} /> Anexar</Button>
                <Button size="sm" className="premium-gradient gap-1"><Send size={14} /> Comentar</Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="files" className="p-5 mt-0">
            {onUpdatePhotos ? (
              <PhotoCapture
                photos={photos}
                onChange={(p) => onUpdatePhotos(ticket.id, p)}
                label="Fotos do chamado"
                max={8}
              />
            ) : photos.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {photos.map((src, i) => (
                  <a key={i} href={src} target="_blank" rel="noreferrer" className="aspect-square rounded-xl overflow-hidden border bg-muted block">
                    <img src={src} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum arquivo anexado</p>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default TicketDrawer;
