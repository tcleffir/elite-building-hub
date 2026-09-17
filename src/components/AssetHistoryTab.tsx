import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Sparkles, Pencil, Plus, Trash2, Wrench, Paperclip } from "lucide-react";
import {
  AssetChangeLog, AssetChangeType, fieldLabel, formatBRLFull,
} from "@/lib/assets-data";

interface Props {
  logs: AssetChangeLog[];
}

const typeMeta: Record<AssetChangeType, { icon: React.ReactNode; label: string; className: string }> = {
  create:        { icon: <Plus className="h-3.5 w-3.5" />,       label: "Criação",      className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
  update:        { icon: <Pencil className="h-3.5 w-3.5" />,     label: "Edição",       className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  delete:        { icon: <Trash2 className="h-3.5 w-3.5" />,     label: "Exclusão",     className: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300" },
  maintenance:   { icon: <Wrench className="h-3.5 w-3.5" />,     label: "Manutenção",   className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  attachment:    { icon: <Paperclip className="h-3.5 w-3.5" />,  label: "Anexo",        className: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300" },
  ai_extraction: { icon: <Sparkles className="h-3.5 w-3.5" />,   label: "IA",           className: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300" },
};

const formatVal = (v: unknown): string => {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "number") {
    // Heuristic: large numbers → currency
    if (v >= 1000) return formatBRLFull(v);
    return String(v);
  }
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
    return format(parseISO(v), "dd/MM/yyyy", { locale: ptBR });
  }
  return String(v);
};

const fmtWhen = (iso: string) => {
  try {
    return format(parseISO(iso), "dd/MM/yyyy HH:mm", { locale: ptBR });
  } catch {
    return iso;
  }
};

const AssetHistoryTab = ({ logs }: Props) => {
  const sorted = [...logs].sort((a, b) => b.performedAt.localeCompare(a.performedAt));

  if (sorted.length === 0) {
    return (
      <Card className="p-6 rounded-2xl text-center text-sm text-muted-foreground">
        <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
        Nenhuma alteração registrada para este ativo ainda.
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold flex items-center gap-2">
        <History className="h-4 w-4" /> Histórico de alterações ({sorted.length})
      </p>
      <div className="relative pl-5 space-y-3 before:content-[''] before:absolute before:left-1.5 before:top-1 before:bottom-1 before:w-px before:bg-border">
        {sorted.map((log) => {
          const meta = typeMeta[log.type];
          return (
            <div key={log.id} className="relative">
              <div className="absolute -left-[18px] top-2 w-3 h-3 rounded-full bg-background border-2 border-border" />
              <Card className="p-3 rounded-2xl">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={`text-xs gap-1 ${meta.className}`}>
                        {meta.icon} {meta.label}
                      </Badge>
                      {log.source === "ai" && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <Sparkles className="h-3 w-3" /> via IA
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium mt-1.5">{log.summary}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      por <span className="font-medium">{log.userName}</span> · {log.userRole}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground shrink-0">{fmtWhen(log.performedAt)}</p>
                </div>
                {log.changes && log.changes.length > 0 && (
                  <div className="mt-2 pt-2 border-t space-y-1">
                    {log.changes.map((c, i) => (
                      <div key={i} className="text-xs flex flex-wrap items-center gap-1.5">
                        <span className="font-medium text-foreground">{fieldLabel(c.field)}:</span>
                        <span className="text-muted-foreground line-through">{formatVal(c.before)}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="text-foreground font-medium">{formatVal(c.after)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AssetHistoryTab;