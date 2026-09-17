// ============================================================================
// REPORT EXPORT DIALOG — seleção do conteúdo do PDF (padrão Patria Real Estate)
// Cada tela informa as seções disponíveis; o usuário escolhe o que entra no
// arquivo e o PDF é montado pelo pdf-report-service (brand kit Patria).
// ============================================================================
import { useEffect, useMemo, useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generateReport, type ReportConfig, type ReportSection } from "@/lib/pdf-report-service";
import { toast } from "sonner";

export interface ExportSectionOption {
  id: string;
  label: string;
  hint?: string;
  defaultChecked?: boolean;
  /** Monta a seção no momento da geração (permite capturar gráficos). */
  build: () => ReportSection | null | Promise<ReportSection | null>;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Título impresso na capa */
  title: string;
  subtitle: string;
  module: string;
  period: string;
  fundName?: string;
  gestorName?: string;
  previewKpis: { value: string; label: string }[];
  sections: ExportSectionOption[];
}

const ReportExportDialog = ({
  open, onOpenChange, title, subtitle, module, period,
  fundName, gestorName = "Gestor do Fundo", previewKpis, sections,
}: Props) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [customTitle, setCustomTitle] = useState(title);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCustomTitle(title);
    setSelected(sections.filter((s) => s.defaultChecked !== false).map((s) => s.id));
  }, [open, title, sections]);

  const allSelected = selected.length === sections.length;
  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));

  const orderedSelection = useMemo(
    () => sections.filter((s) => selected.includes(s.id)),
    [sections, selected],
  );

  const handleGenerate = async () => {
    if (orderedSelection.length === 0) {
      toast.error("Selecione ao menos uma informação para o relatório");
      return;
    }
    setLoading(true);
    try {
      const built: ReportSection[] = [];
      for (const opt of orderedSelection) {
        const section = await opt.build();
        if (section) built.push(section);
      }
      if (notes.trim()) {
        built.push({ title: "Observações do Gestor", type: "text", text: notes.trim() });
      }
      const config: ReportConfig = {
        title: customTitle || title,
        subtitle,
        period,
        module,
        gestorName,
        fundName,
        tableOfContents: built.map((s, i) => ({ page: i + 2, title: s.title })),
        previewKpis,
      };
      await generateReport(config, built);
      toast.success("Relatório PDF gerado no padrão Patria");
      onOpenChange(false);
    } catch (e) {
      toast.error("Não foi possível gerar o relatório");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText size={16} /> Exportar relatório em PDF
          </DialogTitle>
          <DialogDescription>
            Escolha as informações que entram no arquivo. Layout no padrão Patria Real Estate — período {period}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs">Título do relatório</Label>
            <Input value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} className="mt-1" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs">Conteúdo do relatório</Label>
              <Button
                variant="ghost" size="sm" className="h-7 text-xs"
                onClick={() => setSelected(allSelected ? [] : sections.map((s) => s.id))}
              >
                {allSelected ? "Limpar seleção" : "Selecionar tudo"}
              </Button>
            </div>
            <div className="rounded-lg border divide-y max-h-[280px] overflow-y-auto">
              {sections.map((s) => (
                <label key={s.id} className="flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/40">
                  <Checkbox checked={selected.includes(s.id)} onCheckedChange={() => toggle(s.id)} className="mt-0.5" />
                  <span className="text-left">
                    <span className="block text-sm font-medium text-foreground">{s.label}</span>
                    {s.hint && <span className="block text-xs text-muted-foreground">{s.hint}</span>}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs">Observações (opcional — entram como página final)</Label>
            <Textarea
              value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="mt-1"
              placeholder="Comentários da gestão sobre o período..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
          <Button onClick={handleGenerate} disabled={loading} className="gap-2">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {loading ? "Gerando..." : `Gerar PDF (${selected.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportExportDialog;
