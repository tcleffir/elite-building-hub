import { useMemo } from "react";
import {
  FileText, FolderOpen, ChevronRight, AlertTriangle, Sparkles, Tag, ScrollText,
  TrendingUp, CalendarClock, ShieldCheck, Building2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AiDocumentAnalysis, buildTaxonomy, resolveDestination, docTypeLabels, relevantGroups, brl, ptDate,
} from "@/lib/document-ai";

interface Props {
  analysis: AiDocumentAnalysis;
  onChange: (next: AiDocumentAnalysis) => void;
  fileName: string;
}

const Section = ({ icon: Icon, title, className, children }: { icon: typeof FileText; title: string; className?: string; children: React.ReactNode }) => (
  <div className={`rounded-xl border border-border bg-card ${className ?? ""}`}>
    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
      <Icon size={14} className="text-primary" />
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
    </div>
    <div className="p-4">{children}</div>
  </div>
);

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="min-w-0">
    <p className="text-[11px] text-muted-foreground">{label}</p>
    <p className="text-sm font-medium break-words">{value ?? "—"}</p>
  </div>
);

const AiDocumentReview = ({ analysis, onChange, fileName }: Props) => {
  const taxonomy = useMemo(() => buildTaxonomy(), []);
  const destination = useMemo(
    () => resolveDestination(analysis.destino, analysis.docTypeKey),
    [analysis.destino, analysis.docTypeKey],
  );
  const categories = useMemo(() => Array.from(new Set(taxonomy.map(t => t.category))), [taxonomy]);
  const subfolders = useMemo(
    () => taxonomy.filter(t => t.category === (destination?.category ?? "")).map(t => t.subfolder),
    [taxonomy, destination],
  );

  const groups = relevantGroups(analysis.docTypeKey);
  const extras = analysis.camposAdicionais || [];
  const grouped = groups
    .map(g => ({ group: g, fields: extras.filter(f => (f.grupo || "Outros") === g) }))
    .filter(g => g.fields.length > 0);
  const ungrouped = extras.filter(f => !groups.includes(f.grupo || "Outros"));

  const set = (patch: Partial<AiDocumentAnalysis>) => onChange({ ...analysis, ...patch });
  const confidence = typeof analysis.confianca === "number" ? analysis.confianca : 75;

  const hasFinance =
    analysis.financeiro && Object.values(analysis.financeiro).some(v => typeof v === "number" && v !== null);
  const hasReajuste = analysis.reajuste && Object.values(analysis.reajuste).some(v => v !== null && v !== undefined && v !== "");
  const hasPrazos = analysis.prazos && Object.values(analysis.prazos).some(v => v !== null && v !== undefined && v !== "");
  const hasGarantia = analysis.garantia && Object.values(analysis.garantia).some(v => v !== null && v !== undefined && v !== "");

  return (
    <div className="space-y-4">
      {/* Classification header */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Sparkles size={14} className="text-primary" />
              <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-primary/20">
                {analysis.docType || docTypeLabels[analysis.docTypeKey || "outro"]}
              </Badge>
              {analysis.ativo && (
                <Badge variant="outline" className="gap-1"><Building2 size={11} /> {analysis.ativo}</Badge>
              )}
            </div>
            <p className="text-sm font-semibold mt-2 break-words">{analysis.nome || fileName}</p>
          </div>
          <div className="w-40">
            <p className="text-[11px] text-muted-foreground mb-1">Confiança da leitura</p>
            <div className="flex items-center gap-2">
              <Progress value={confidence} className="h-2 flex-1" />
              <span className="text-xs font-semibold">{confidence}%</span>
            </div>
          </div>
        </div>
        {analysis.resumo && <p className="text-xs text-muted-foreground leading-relaxed">{analysis.resumo}</p>}
        {!!analysis.tags?.length && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Tag size={11} className="text-muted-foreground" />
            {analysis.tags.map(t => (
              <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{t}</span>
            ))}
          </div>
        )}
      </div>

      {/* Destination */}
      <Section icon={FolderOpen} title="Destino na biblioteca de documentos">
        <div className="flex items-center gap-1.5 text-sm mb-3 flex-wrap">
          <FolderOpen size={14} className="text-amber-500" />
          <span className="font-medium">{destination?.category || "—"}</span>
          <ChevronRight size={12} className="text-muted-foreground" />
          <span className="font-medium">{destination?.subfolder || "—"}</span>
          <ChevronRight size={12} className="text-muted-foreground" />
          <span className="text-muted-foreground truncate">{analysis.nome || fileName}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Categoria</Label>
            <Select
              value={destination?.category || ""}
              onValueChange={v => {
                const firstSub = taxonomy.find(t => t.category === v)?.subfolder;
                set({ destino: { categoria: v, subpasta: firstSub } });
              }}
            >
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Subpasta</Label>
            <Select
              value={destination?.subfolder || ""}
              onValueChange={v => set({ destino: { categoria: destination?.category, subpasta: v } })}
            >
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>{subfolders.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">
          Pré-visualização do arquivamento — o documento será gravado nesta pasta ao salvar.
        </p>
      </Section>

      {/* Detailed sections — two columns on wide screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
      {/* Identification (editable) */}
      <Section icon={FileText} title="Identificação" className="lg:col-span-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="sm:col-span-2 lg:col-span-3">
            <Label className="text-xs">Nome do documento</Label>
            <Input value={analysis.nome || ""} onChange={e => set({ nome: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Ativo</Label>
            <Input value={analysis.ativo || ""} onChange={e => set({ ativo: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Contraparte / Locatário</Label>
            <Input value={analysis.contraparte || ""} onChange={e => set({ contraparte: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Empresa / Órgão emissor</Label>
            <Input value={analysis.empresa || ""} onChange={e => set({ empresa: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Nº do documento</Label>
            <Input value={analysis.documentoNumero || ""} onChange={e => set({ documentoNumero: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Data de emissão</Label>
            <Input type="date" value={analysis.dataEmissao || ""} onChange={e => set({ dataEmissao: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Validade / Vencimento</Label>
            <Input type="date" value={analysis.dataValidade || ""} onChange={e => set({ dataValidade: e.target.value })} />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <Label className="text-xs">Resumo</Label>
            <Textarea rows={3} value={analysis.resumo || ""} onChange={e => set({ resumo: e.target.value })} />
          </div>
        </div>
      </Section>

      {/* Financial */}
      {hasFinance && (
        <Section icon={TrendingUp} title="Financeiro">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Field label="Aluguel mensal" value={brl(analysis.financeiro?.valorAluguel)} />
            <Field label="Valor por m²" value={brl(analysis.financeiro?.valorPorM2)} />
            <Field label="Área locada" value={analysis.financeiro?.areaM2 ? `${analysis.financeiro.areaM2.toLocaleString("pt-BR")} m²` : "—"} />
            <Field label="Valor total" value={brl(analysis.financeiro?.valorTotal)} />
          </div>
        </Section>
      )}

      {/* Reajuste */}
      {hasReajuste && (
        <Section icon={TrendingUp} title="Reajuste">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Field label="Índice" value={analysis.reajuste?.indice || "—"} />
            <Field label="Periodicidade" value={analysis.reajuste?.periodicidade || "—"} />
            <Field label="Mês de aniversário" value={analysis.reajuste?.mesAniversario || "—"} />
            <Field label="Próximo reajuste" value={ptDate(analysis.reajuste?.proximaDataReajuste)} />
            <Field label="Último reajuste" value={ptDate(analysis.reajuste?.ultimoReajusteAplicado)} />
            <Field
              label="% último reajuste"
              value={typeof analysis.reajuste?.percentualUltimoReajuste === "number"
                ? `${analysis.reajuste.percentualUltimoReajuste.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}%`
                : "—"}
            />
          </div>
        </Section>
      )}

      {/* Prazos */}
      {hasPrazos && (
        <Section icon={CalendarClock} title="Prazos">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Field label="Início" value={ptDate(analysis.prazos?.dataInicio)} />
            <Field label="Término" value={ptDate(analysis.prazos?.dataFim)} />
            <Field label="Prazo (meses)" value={analysis.prazos?.prazoMeses ?? "—"} />
            <Field label="Carência (meses)" value={analysis.prazos?.carenciaMeses ?? "—"} />
            <Field label="Próxima revisional" value={ptDate(analysis.prazos?.proximaRevisional)} />
          </div>
        </Section>
      )}

      {/* Garantia */}
      {hasGarantia && (
        <Section icon={ShieldCheck} title="Garantias">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Field label="Tipo" value={analysis.garantia?.tipo || "—"} />
            <Field label="Valor" value={brl(analysis.garantia?.valor)} />
            <Field label="Validade" value={ptDate(analysis.garantia?.validade)} />
          </div>
        </Section>
      )}

      {/* Extra fields by group */}
      {(grouped.length > 0 || ungrouped.length > 0) && (
        <Section icon={ScrollText} title="Outras informações extraídas">
          <div className="space-y-4">
            {grouped.map(g => (
              <div key={g.group}>
                <p className="text-[11px] font-semibold uppercase text-muted-foreground mb-2">{g.group}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {g.fields.map((f, i) => <Field key={`${f.rotulo}-${i}`} label={f.rotulo} value={String(f.valor ?? "—")} />)}
                </div>
              </div>
            ))}
            {ungrouped.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold uppercase text-muted-foreground mb-2">Outros</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {ungrouped.map((f, i) => <Field key={`${f.rotulo}-u${i}`} label={f.rotulo} value={String(f.valor ?? "—")} />)}
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Clauses */}
      {!!analysis.clausulas?.length && (
        <Section icon={ScrollText} title="Cláusulas relevantes">
          <div className="space-y-2">
            {analysis.clausulas.map((c, i) => (
              <div key={`${c.titulo}-${i}`} className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs font-semibold">{c.titulo}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{c.resumo}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Alerts */}
      {!!analysis.alertas?.length && (
        <Section icon={AlertTriangle} title="Alertas e pendências">
          <ul className="space-y-1.5">
            {analysis.alertas.map((a, i) => (
              <li key={i} className="flex gap-2 text-xs">
                <AlertTriangle size={13} className="text-amber-500 shrink-0 mt-0.5" />
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}
      </div>
    </div>
  );
};

export default AiDocumentReview;
