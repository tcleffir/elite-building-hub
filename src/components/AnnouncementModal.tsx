import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Announcement } from "@/lib/mock-data";
import { User, Building2, Calendar, Eye, MessageSquare, CheckCircle, Send, BarChart3 } from "lucide-react";
import { useState } from "react";
import { Progress } from "@/components/ui/progress";

interface AnnouncementModalProps {
  announcement: Announcement | null;
  open: boolean;
  onClose: () => void;
}

const categoryColors: Record<string, string> = {
  Manutenção: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Segurança: 'bg-destructive/10 text-destructive',
  ESG: 'bg-success/10 text-success',
  Administrativo: 'bg-interactive/10 text-interactive',
  Urgente: 'bg-destructive/10 text-destructive',
};

const AnnouncementModal = ({ announcement, open, onClose }: AnnouncementModalProps) => {
  const [newComment, setNewComment] = useState("");

  if (!announcement) return null;

  const readPercent = Math.round((announcement.read_count / announcement.total_recipients) * 100);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${categoryColors[announcement.category] || 'bg-muted text-muted-foreground'}`}>
              {announcement.category}
            </span>
            {announcement.priority === 'urgent' && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-destructive/10 text-destructive">⚠️ Urgente</span>
            )}
            {announcement.expires_at && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-interactive/10 text-interactive">
                Válido até {new Date(announcement.expires_at).toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>
          <DialogTitle className="text-xl">{announcement.title}</DialogTitle>
        </DialogHeader>

        {/* Author */}
        <div className="flex items-center gap-3 mt-2">
          <div className="w-10 h-10 rounded-full premium-gradient flex items-center justify-center text-xs font-bold text-primary-foreground">
            {announcement.author.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <p className="text-sm font-medium">{announcement.author.name}</p>
            <p className="text-xs text-muted-foreground">{announcement.author.position} — {announcement.author.company}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-muted-foreground">
              <Calendar size={12} className="inline mr-1" />
              {new Date(announcement.published_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Read stats */}
        <div className="bg-muted/50 rounded-xl p-3 flex items-center gap-3">
          <Eye size={14} className="text-muted-foreground" />
          <span className="text-sm">Lido por {announcement.read_count} de {announcement.total_recipients} ({readPercent}%)</span>
          <Progress value={readPercent} className="flex-1 h-1.5" />
        </div>

        {/* Content */}
        <div className="prose prose-sm max-w-none text-foreground mt-2">
          <p className="text-sm leading-relaxed">{announcement.content}</p>
        </div>

        {/* Poll */}
        {announcement.has_poll && announcement.poll && (
          <div className="bg-muted/50 rounded-xl p-4 mt-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 size={16} className="text-interactive" />
              <h4 className="text-sm font-semibold">Enquete</h4>
            </div>
            <p className="text-sm font-medium mb-3">{announcement.poll.question}</p>
            <div className="space-y-2">
              {announcement.poll.options.map((opt) => {
                const totalVotes = announcement.poll!.options.reduce((s, o) => s + o.votes, 0);
                const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                return (
                  <div key={opt.id} className="relative">
                    <div className="flex items-center justify-between py-2 px-3 bg-card rounded-lg border relative z-10">
                      <span className="text-sm">{opt.text}</span>
                      <span className="text-xs font-semibold text-muted-foreground">{pct}% ({opt.votes})</span>
                    </div>
                    <div className="absolute inset-0 bg-interactive/10 rounded-lg" style={{ width: `${pct}%` }} />
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Encerra em {new Date(announcement.poll.ends_at).toLocaleDateString('pt-BR')}</p>
          </div>
        )}

        {/* Confirmation */}
        {announcement.requires_confirmation && (
          <Button className="w-full premium-gradient gap-2 mt-2">
            <CheckCircle size={16} /> Confirmo que li este comunicado
          </Button>
        )}

        {/* Comments */}
        {announcement.allow_comments && (
          <div className="border-t pt-4 mt-4 space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <MessageSquare size={14} /> Comentários
            </h4>
            {announcement.comments?.map((c) => (
              <div key={c.id} className="bg-muted/50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">{c.author}</span>
                  <span className="text-xs text-muted-foreground">{c.company}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{new Date(c.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
                <p className="text-sm">{c.text}</p>
              </div>
            ))}
            <div className="flex gap-2">
              <Textarea placeholder="Adicionar comentário..." value={newComment} onChange={(e) => setNewComment(e.target.value)} className="min-h-[60px]" />
            </div>
            <Button size="sm" className="premium-gradient gap-1"><Send size={14} /> Comentar</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AnnouncementModal;
