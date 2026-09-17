import { useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileText, History, ArrowRight, User } from "lucide-react";
import type { TenantContract } from "@/lib/mock-data";
import {
  buildHistoricoContratual, historicoTipoLabels, historicoTipoColor,
} from "@/lib/contract-management-data";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function fmtBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

function fmtEventDate(d: string) {
  const date = new Date(d.length > 10 ? d : `${d}T12:00:00`);
  if (Number.isNaN(date.getTime())) return '—';
  return d.length > 10
    ? format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    : format(date, 'dd/MM/yyyy');
}

interface Props {
  contract: TenantContract;
  /** usado apenas para forçar recálculo após mutações */
  refreshKey?: number;
}

export default function HistoricoContratual({ contract, refreshKey = 0 }: Props) {
  const eventos = useMemo(
    () => buildHistoricoContratual(contract),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [contract.id, refreshKey],
  );

  return (
    <div className="space-y-2">
      <div>
        <h4 className="text-sm font-semibold flex items-center gap-1">
          <History className="h-3.5 w-3.5" /> Histórico Contratual
        </h4>
        <p className="text-[11px] text-muted-foreground">
          Como o contrato chegou ao valor atual — nenhum evento é sobrescrito
        </p>
      </div>

      <div className="relative pl-4 border-l-2 border-border space-y-3">
        {eventos.map(ev => {
          const isNum = typeof ev.valor_novo === 'number';
          return (
            <div key={ev.id} className="relative">
              <div className="absolute -left-[21px] top-1.5 h-3 w-3 rounded-full bg-primary/70 border-2 border-background" />
              <div className="rounded-md border bg-card p-2.5 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">{ev.titulo}</p>
                    <Badge variant="outline" className={cn('text-[10px] h-4 px-1.5 mt-1', historicoTipoColor[ev.tipo])}>
                      {historicoTipoLabels[ev.tipo]}
                    </Badge>
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap tabular-nums">
                    {fmtEventDate(ev.data)}
                  </span>
                </div>

                {isNum && (
                  <div className="flex items-center gap-2 text-[11px]">
                    {typeof ev.valor_anterior === 'number' && (
                      <>
                        <span className="text-muted-foreground line-through">{fmtBRL(ev.valor_anterior)}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      </>
                    )}
                    <span className="font-semibold">{fmtBRL(ev.valor_novo as number)}</span>
                    {ev.percentual != null && (
                      <span className={cn('font-medium', ev.percentual >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
                        {ev.percentual >= 0 ? '+' : ''}{ev.percentual.toFixed(1)}%
                      </span>
                    )}
                  </div>
                )}

                {ev.detalhes && ev.detalhes.length > 0 && (
                  <div className="space-y-0.5">
                    {ev.detalhes.map((d, i) => (
                      <p key={i} className="text-[11px] text-muted-foreground">
                        <span className="font-medium text-foreground">{d.campo}:</span> {d.antes} → {d.depois}
                      </p>
                    ))}
                  </div>
                )}

                {ev.motivo && <p className="text-[11px] text-muted-foreground italic">"{ev.motivo}"</p>}

                <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-0.5">
                  {ev.usuario && <span className="flex items-center gap-1"><User className="h-3 w-3" /> {ev.usuario}</span>}
                  {ev.documento && <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> {ev.documento}</span>}
                </div>
              </div>
            </div>
          );
        })}
        {eventos.length === 0 && (
          <p className="text-[11px] text-muted-foreground">Nenhum evento registrado para este contrato.</p>
        )}
      </div>
    </div>
  );
}
