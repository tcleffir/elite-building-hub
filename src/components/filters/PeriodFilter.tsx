import { Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  COMPETENCIAS,
  PERIOD_PRESETS,
  type PeriodPreset,
} from "@/lib/portfolio-competencia";

export interface PeriodFilterValue {
  preset: PeriodPreset;
  /** Competência de fechamento (YYYY-MM) */
  end: string;
  /** Competência inicial — usada apenas quando preset = "custom" */
  start: string;
}

interface PeriodFilterProps {
  value: PeriodFilterValue;
  onChange: (value: PeriodFilterValue) => void;
  className?: string;
}

/**
 * Filtro de competência com janelas de 1/3/6/12 meses e intervalo personalizado.
 * A janela resultante é calculada por `getCompetenciaWindow` / `getCompetenciaRange`.
 */
const PeriodFilter = ({ value, onChange, className }: PeriodFilterProps) => (
  <div className={`flex flex-wrap gap-2 ${className ?? ""}`}>
    <Select
      value={value.preset}
      onValueChange={(preset) => onChange({ ...value, preset: preset as PeriodPreset })}
    >
      <SelectTrigger className="h-8 w-[180px] text-xs gap-2">
        <Calendar size={14} className="shrink-0" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PERIOD_PRESETS.map((p) => (
          <SelectItem key={p.value} value={p.value} className="text-xs">{p.label}</SelectItem>
        ))}
        <SelectItem value="custom" className="text-xs">Personalizado</SelectItem>
      </SelectContent>
    </Select>

    {value.preset === "custom" && (
      <Select value={value.start} onValueChange={(start) => onChange({ ...value, start })}>
        <SelectTrigger className="h-8 w-[150px] text-xs">
          <SelectValue placeholder="De" />
        </SelectTrigger>
        <SelectContent>
          {COMPETENCIAS.map((c) => (
            <SelectItem key={c.value} value={c.value} className="text-xs">De: {c.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    )}

    <Select value={value.end} onValueChange={(end) => onChange({ ...value, end })}>
      <SelectTrigger className="h-8 w-[168px] text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {COMPETENCIAS.map((c) => (
          <SelectItem key={c.value} value={c.value} className="text-xs">
            {value.preset === "custom" ? "Até: " : "Competência: "}{c.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

export default PeriodFilter;
