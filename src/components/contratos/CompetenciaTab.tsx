import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, FileSpreadsheet, Calendar, Info, Lock } from "lucide-react";
import { toast } from "sonner";
import type { TenantContract } from "@/lib/mock-data";
import {
  getSnapshotCompetencia, exportSnapshotExcel, formatCompetencia, getNextCompetencia,
} from "@/lib/contract-management-data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Props {
  contracts: TenantContract[];
  showAllBuildings: boolean;
  getBuildingName: (id: string) => string;
}

export default function CompetenciaTab({ contracts, showAllBuildings, getBuildingName }: Props) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-based

  const isCurrent = year === now.getFullYear() && month === now.getMonth();
  const isFuture = new Date(year, month, 1) > new Date(now.getFullYear(), now.getMonth(), 1);

  const snapshot = useMemo(
    () => getSnapshotCompetencia(contracts, year, month),
    [contracts, year, month],
  );

  const totals = useMemo(() => {
    const valor = snapshot.reduce((s, c) => s + c.effective.valor_mensal, 0);
    const area = snapshot.reduce((s, c) => s + c.effective.area_m2, 0);
    const areaTotal = contracts.reduce((s, c) => s + c.area_m2, 0);
    const refEnd = new Date(year, month + 1, 0);
    const limite = new Date(year, month + 13, 0);
    const vencendo = snapshot.filter(c => {
      if (!c.effective.vigencia_fim) return false;
      const f = new Date(c.effective.vigencia_fim);
      return f >= refEnd && f <= limite;
    }).length;
    return {
      valor, area, count: snapshot.length,
      ocupacao: areaTotal > 0 ? (area / areaTotal) * 100 : 0,
      valorM2: area > 0 ? valor / area : 0,
      receitaAnual: valor * 12,
      vencendo,
    };
  }, [snapshot, contracts, year, month]);

  const posicaoLabel = new Date(year, month + 1, 0).toLocaleDateString('pt-BR');

  const compLabel = formatCompetencia(year, month);
  const proxima = getNextCompetencia(year, month);

  const navigate = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear()); setMonth(d.getMonth());
  };

  const handleExport = () => {
    exportSnapshotExcel(snapshot, compLabel, getBuildingName);
    toast.success(`Recorte de ${compLabel} exportado em Excel (${snapshot.length} contratos).`);
  };

  return (
    <div className="space-y-4">
      {/* Seletor de competência */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Competência</span>
              <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => navigate(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-base font-semibold tabular-nums min-w-[80px] text-center">{compLabel}</span>
              <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => navigate(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              {isCurrent && <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">atual</Badge>}
              {!isCurrent && !isFuture && <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">fechada</Badge>}
              {isFuture && <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">futura</Badge>}
              <Badge className="bg-primary text-primary-foreground text-[10px]">Posição em {posicaoLabel}</Badge>
              <Badge variant="outline" className="text-[10px] gap-1"><Lock className="h-3 w-3" /> Recorte imutável</Badge>
            </div>
            <Button size="sm" variant="outline" onClick={handleExport} className="gap-2">
              <FileSpreadsheet className="h-4 w-4" /> Exportar Excel
            </Button>
          </div>
          <div className="rounded-md bg-muted/40 border p-3 text-xs text-muted-foreground flex items-start gap-2">
            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>
              Este recorte congela os contratos vigentes em <strong>{compLabel}</strong> aplicando todos os aditivos e reajustes até <strong>{new Date(year, month + 1, 0).toLocaleDateString('pt-BR')}</strong>.
              É a base que gera as cobranças da competência <strong>{proxima.label}</strong>. Alterações posteriores não afetam competências já fechadas.
            </span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <KpiMini label="Contratos vigentes" value={String(totals.count)} />
            <KpiMini label="Área locada" value={`${totals.area.toLocaleString('pt-BR')} m²`} />
            <KpiMini label="Ocupação" value={`${totals.ocupacao.toFixed(1)}%`} />
            <KpiMini label="Aluguel vigente / mês" value={totals.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })} />
            <KpiMini label="R$/m² médio" value={totals.valorM2.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 })} />
            <KpiMini label="Receita contratada (12m)" value={totals.receitaAnual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })} />
          </div>
          <p className="text-[11px] text-muted-foreground">
            {totals.vencendo} contrato(s) com vencimento nos 12 meses seguintes a esta competência.
          </p>
        </CardContent>
      </Card>

      {/* Lista */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {showAllBuildings && <TableHead>Ativo</TableHead>}
                <TableHead>Locatário</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead className="text-right">Área (m²)</TableHead>
                <TableHead className="text-right">Aluguel vigente</TableHead>
                <TableHead className="text-right">R$/m²</TableHead>
                <TableHead>Índice</TableHead>
                <TableHead>Vigência fim</TableHead>
                <TableHead>Aditivos</TableHead>
                <TableHead>Reajustes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {snapshot.map(c => (
                <TableRow key={c.id}>
                  {showAllBuildings && <TableCell className="text-xs">{getBuildingName(c.building_id)}</TableCell>}
                  <TableCell className="font-medium">{c.tenant_name}</TableCell>
                  <TableCell>{c.unit_id}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.effective.area_m2.toLocaleString('pt-BR')}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {c.effective.valor_mensal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {c.effective.valor_m2.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-xs">{c.effective.indice}</TableCell>
                  <TableCell className="text-sm">{c.effective.vigencia_fim ? new Date(c.effective.vigencia_fim).toLocaleDateString('pt-BR') : '—'}</TableCell>
                  <TableCell>
                    {c.effective.aditivos_aplicados > 0
                      ? <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">{c.effective.aditivos_aplicados}</Badge>
                      : <span className="text-[11px] text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    {c.effective.reajustes_aplicados > 0
                      ? <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 text-[10px]">{c.effective.reajustes_aplicados}</Badge>
                      : <span className="text-[11px] text-muted-foreground">—</span>}
                  </TableCell>
                </TableRow>
              ))}
              {snapshot.length === 0 && (
                <TableRow>
                  <TableCell colSpan={showAllBuildings ? 10 : 9} className="text-center py-10 text-sm text-muted-foreground">
                    Nenhum contrato vigente em {compLabel}.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-card p-3">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}
