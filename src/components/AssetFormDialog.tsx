import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Sparkles, Eraser } from "lucide-react";
import { toast } from "sonner";
import {
  Asset, AssetCategory, AssetStatus, MaintenancePeriodicity, WarrantyType,
  defaultCategoryLabels, statusLabels, periodicityLabels,
} from "@/lib/assets-data";
import AssetUploadZone from "./AssetUploadZone";
import PhotoCapture from "./PhotoCapture";
import type { CategoryEntry } from "@/hooks/use-assets-store";

type Mode = "create" | "edit";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: Mode;
  initial?: Asset | null;
  buildingId: string;
  onSubmit: (asset: Asset, aiFileName?: string) => void;
  categories?: CategoryEntry[];
}

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = (buildingId: string): Asset => ({
  id: "",
  name: "", brand: "", model: "", serialNumber: "", description: "",
  category: "outros",
  buildingId,
  floor: 0,
  area: "",
  status: "active",
  purchaseDate: today(),
  purchasePrice: 0,
  supplier: "", buyer: "", installer: "",
  installationDate: today(),
  installationLocation: "",
  invoice: { number: "", issuedAt: today(), fileName: "" },
  warranty: {
    type: "manufacturer", startDate: today(), endDate: today(),
    terms: "", supplierContactName: "", supplierContactPhone: "", supplierContactEmail: "",
  },
  periodicity: "quarterly",
  nextMaintenanceDate: today(),
  photos: [],
});

const builtinCategoryKeys = Object.keys(defaultCategoryLabels);

const schema = z.object({
  name: z.string().trim().min(2, "Nome obrigatório").max(120),
  brand: z.string().trim().max(80),
  model: z.string().trim().max(120),
  serialNumber: z.string().trim().max(80),
  category: z.string().min(1, "Categoria obrigatória"),
  status: z.enum(["active", "maintenance", "inactive"]),
  floor: z.number().int().min(-5).max(80),
  area: z.string().trim().max(160),
  purchaseDate: z.string().min(1, "Data de compra obrigatória"),
  purchasePrice: z.number().min(0, "Valor inválido"),
  warranty: z.object({
    startDate: z.string().min(1),
    endDate: z.string().min(1),
  }),
}).refine((d) => d.warranty.endDate >= d.warranty.startDate, {
  message: "Fim da garantia deve ser ≥ início",
  path: ["warranty", "endDate"],
});

// Map AI -> Asset
const applyAi = (current: Asset, ai: Record<string, unknown>, fileName: string): { next: Asset; fields: Set<string> } => {
  const next: Asset = JSON.parse(JSON.stringify(current));
  const filled = new Set<string>();
  const set = (key: string, val: unknown) => {
    if (val === null || val === undefined || val === "") return;
    filled.add(key);
    // assign
    const parts = key.split(".");
    let obj: any = next;
    for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
    obj[parts[parts.length - 1]] = val;
  };
  set("name", ai.name);
  set("brand", ai.brand);
  set("model", ai.model);
  set("serialNumber", ai.serialNumber);
  set("description", ai.description);
  if (ai.category && builtinCategoryKeys.includes(String(ai.category))) {
    set("category", ai.category);
  }
  set("purchaseDate", ai.purchaseDate);
  if (typeof ai.purchasePrice === "number") set("purchasePrice", ai.purchasePrice);
  set("supplier", ai.supplier);
  set("buyer", ai.supplier ?? current.buyer);
  set("installer", ai.installer);
  set("installationDate", ai.installationDate);
  set("invoice.number", ai.invoiceNumber);
  set("invoice.issuedAt", ai.invoiceDate ?? ai.purchaseDate);
  if (fileName) {
    next.invoice.fileName = fileName;
    filled.add("invoice.fileName");
  }
  if (ai.warrantyType === "manufacturer" || ai.warrantyType === "extended") {
    set("warranty.type", ai.warrantyType);
  }
  set("warranty.startDate", ai.warrantyStartDate);
  set("warranty.endDate", ai.warrantyEndDate);
  set("warranty.terms", ai.warrantyTerms);
  set("warranty.supplierContactName", ai.supplierContactName);
  set("warranty.supplierContactPhone", ai.supplierContactPhone);
  set("warranty.supplierContactEmail", ai.supplierContactEmail);
  if (ai.periodicity && ["monthly","quarterly","biannual","annual"].includes(String(ai.periodicity))) {
    set("periodicity", ai.periodicity);
  }
  return { next, fields: filled };
};

const AiBadge = () => (
  <Badge className="text-[10px] gap-0.5 ml-1.5 bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300 hover:bg-cyan-100">
    <Sparkles className="h-2.5 w-2.5" /> IA
  </Badge>
);

const AssetFormDialog = ({ open, onOpenChange, mode, initial, buildingId, onSubmit, categories }: Props) => {
  const categoryList: CategoryEntry[] = categories ?? Object.entries(defaultCategoryLabels).map(
    ([key, label]) => ({ key, label, builtin: true })
  );
  const [form, setForm] = useState<Asset>(() => initial ?? emptyForm(buildingId));
  const [aiFields, setAiFields] = useState<Set<string>>(new Set());
  const [aiFileName, setAiFileName] = useState<string>("");

  useEffect(() => {
    if (open) {
      setForm(initial ?? emptyForm(buildingId));
      setAiFields(new Set());
      setAiFileName("");
    }
  }, [open, initial, buildingId]);

  const isAi = (k: string) => aiFields.has(k);

  const update = <K extends keyof Asset>(k: K, v: Asset[K]) => {
    setForm((prev) => ({ ...prev, [k]: v }));
    if (aiFields.has(k as string)) {
      const next = new Set(aiFields); next.delete(k as string); setAiFields(next);
    }
  };

  const updateInvoice = (k: keyof Asset["invoice"], v: string) => {
    setForm((prev) => ({ ...prev, invoice: { ...prev.invoice, [k]: v } }));
    const path = `invoice.${k}`;
    if (aiFields.has(path)) { const n = new Set(aiFields); n.delete(path); setAiFields(n); }
  };

  const updateWarranty = (k: keyof Asset["warranty"], v: string) => {
    setForm((prev) => ({ ...prev, warranty: { ...prev.warranty, [k]: v } as Asset["warranty"] }));
    const path = `warranty.${k}`;
    if (aiFields.has(path)) { const n = new Set(aiFields); n.delete(path); setAiFields(n); }
  };

  const handleAiData = (ai: Record<string, unknown>, fileName: string) => {
    const { next, fields } = applyAi(form, ai, fileName);
    setForm(next);
    setAiFields(fields);
    setAiFileName(fileName);
  };

  const clearAiFields = () => {
    if (aiFields.size === 0) return;
    setAiFields(new Set());
    toast.info("Marcações de origem IA removidas (campos preservados).");
  };

  const handleSubmit = () => {
    const result = schema.safeParse(form);
    if (!result.success) {
      const first = result.error.errors[0];
      toast.error(first?.message ?? "Verifique os campos do formulário.");
      return;
    }
    onSubmit(form, aiFileName || undefined);
    onOpenChange(false);
  };

  const aiCount = useMemo(() => aiFields.size, [aiFields]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Novo Ativo" : `Editar — ${form.name || form.id}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <AssetUploadZone onExtracted={handleAiData} />
          <div className="rounded-2xl border p-3">
            <PhotoCapture
              photos={form.photos ?? []}
              onChange={(p) => setForm((prev) => ({ ...prev, photos: p }))}
              label="Fotos do equipamento"
              max={6}
            />
          </div>
          {aiCount > 0 && (
            <div className="flex items-center justify-between gap-2 text-xs px-1">
              <span className="text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
                {aiCount} {aiCount === 1 ? "campo preenchido" : "campos preenchidos"} pela IA
              </span>
              <Button type="button" size="sm" variant="ghost" onClick={clearAiFields} className="h-7 gap-1">
                <Eraser className="h-3 w-3" /> Limpar marcações IA
              </Button>
            </div>
          )}

          <Accordion type="multiple" defaultValue={["id", "loc", "buy", "war", "mnt"]} className="w-full">
            {/* Identificação */}
            <AccordionItem value="id">
              <AccordionTrigger className="text-sm font-semibold">Identificação</AccordionTrigger>
              <AccordionContent className="space-y-3">
                <div>
                  <Label className="flex items-center">Nome do equipamento *{isAi("name") && <AiBadge />}</Label>
                  <Input value={form.name} onChange={(e) => update("name", e.target.value)} maxLength={120} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="flex items-center">Marca{isAi("brand") && <AiBadge />}</Label>
                    <Input value={form.brand} onChange={(e) => update("brand", e.target.value)} />
                  </div>
                  <div>
                    <Label className="flex items-center">Modelo{isAi("model") && <AiBadge />}</Label>
                    <Input value={form.model} onChange={(e) => update("model", e.target.value)} />
                  </div>
                  <div>
                    <Label className="flex items-center">Nº de série{isAi("serialNumber") && <AiBadge />}</Label>
                    <Input value={form.serialNumber} onChange={(e) => update("serialNumber", e.target.value)} />
                  </div>
                  <div>
                    <Label className="flex items-center">Categoria{isAi("category") && <AiBadge />}</Label>
                    <Select value={form.category} onValueChange={(v) => update("category", v as AssetCategory)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {categoryList.map((c) => (
                          <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="flex items-center">Descrição{isAi("description") && <AiBadge />}</Label>
                  <Textarea
                    rows={2}
                    maxLength={400}
                    value={form.description ?? ""}
                    onChange={(e) => update("description", e.target.value)}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Localização */}
            <AccordionItem value="loc">
              <AccordionTrigger className="text-sm font-semibold">Localização & Status</AccordionTrigger>
              <AccordionContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Andar</Label>
                    <Input
                      type="number"
                      value={form.floor}
                      onChange={(e) => update("floor", parseInt(e.target.value, 10) || 0)}
                    />
                  </div>
                  <div>
                    <Label>Status operacional</Label>
                    <Select value={form.status} onValueChange={(v) => update("status", v as AssetStatus)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(statusLabels) as AssetStatus[]).map((s) => (
                          <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Área / sala</Label>
                  <Input value={form.area} onChange={(e) => update("area", e.target.value)} />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Compra & NF */}
            <AccordionItem value="buy">
              <AccordionTrigger className="text-sm font-semibold">Compra & Nota Fiscal</AccordionTrigger>
              <AccordionContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="flex items-center">Data de compra *{isAi("purchaseDate") && <AiBadge />}</Label>
                    <Input type="date" value={form.purchaseDate} onChange={(e) => update("purchaseDate", e.target.value)} />
                  </div>
                  <div>
                    <Label className="flex items-center">Valor pago (R$) *{isAi("purchasePrice") && <AiBadge />}</Label>
                    <Input
                      type="number" min={0} step="0.01"
                      value={form.purchasePrice}
                      onChange={(e) => update("purchasePrice", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label className="flex items-center">Fornecedor{isAi("supplier") && <AiBadge />}</Label>
                    <Input value={form.supplier} onChange={(e) => update("supplier", e.target.value)} />
                  </div>
                  <div>
                    <Label>Comprador</Label>
                    <Input value={form.buyer} onChange={(e) => update("buyer", e.target.value)} />
                  </div>
                  <div>
                    <Label className="flex items-center">Nº da NF{isAi("invoice.number") && <AiBadge />}</Label>
                    <Input value={form.invoice.number} onChange={(e) => updateInvoice("number", e.target.value)} />
                  </div>
                  <div>
                    <Label className="flex items-center">Emissão NF{isAi("invoice.issuedAt") && <AiBadge />}</Label>
                    <Input type="date" value={form.invoice.issuedAt} onChange={(e) => updateInvoice("issuedAt", e.target.value)} />
                  </div>
                  <div>
                    <Label className="flex items-center">Instalador{isAi("installer") && <AiBadge />}</Label>
                    <Input value={form.installer} onChange={(e) => update("installer", e.target.value)} />
                  </div>
                  <div>
                    <Label className="flex items-center">Data de instalação{isAi("installationDate") && <AiBadge />}</Label>
                    <Input type="date" value={form.installationDate} onChange={(e) => update("installationDate", e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label>Local de instalação</Label>
                  <Input value={form.installationLocation} onChange={(e) => update("installationLocation", e.target.value)} />
                </div>
                {form.invoice.fileName && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    📎 NF anexa: <span className="font-medium">{form.invoice.fileName}</span>
                    {isAi("invoice.fileName") && <AiBadge />}
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Garantia */}
            <AccordionItem value="war">
              <AccordionTrigger className="text-sm font-semibold">Garantia</AccordionTrigger>
              <AccordionContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="flex items-center">Tipo{isAi("warranty.type") && <AiBadge />}</Label>
                    <Select value={form.warranty.type} onValueChange={(v) => updateWarranty("type", v as WarrantyType)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manufacturer">Fabricante</SelectItem>
                        <SelectItem value="extended">Estendida</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div />
                  <div>
                    <Label className="flex items-center">Início{isAi("warranty.startDate") && <AiBadge />}</Label>
                    <Input type="date" value={form.warranty.startDate} onChange={(e) => updateWarranty("startDate", e.target.value)} />
                  </div>
                  <div>
                    <Label className="flex items-center">Fim{isAi("warranty.endDate") && <AiBadge />}</Label>
                    <Input type="date" value={form.warranty.endDate} onChange={(e) => updateWarranty("endDate", e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label className="flex items-center">Termos da garantia{isAi("warranty.terms") && <AiBadge />}</Label>
                  <Textarea rows={2} value={form.warranty.terms} onChange={(e) => updateWarranty("terms", e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="flex items-center">Contato (nome){isAi("warranty.supplierContactName") && <AiBadge />}</Label>
                    <Input value={form.warranty.supplierContactName} onChange={(e) => updateWarranty("supplierContactName", e.target.value)} />
                  </div>
                  <div>
                    <Label className="flex items-center">Telefone{isAi("warranty.supplierContactPhone") && <AiBadge />}</Label>
                    <Input value={form.warranty.supplierContactPhone} onChange={(e) => updateWarranty("supplierContactPhone", e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <Label className="flex items-center">E-mail{isAi("warranty.supplierContactEmail") && <AiBadge />}</Label>
                    <Input type="email" value={form.warranty.supplierContactEmail} onChange={(e) => updateWarranty("supplierContactEmail", e.target.value)} />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Manutenção */}
            <AccordionItem value="mnt">
              <AccordionTrigger className="text-sm font-semibold">Manutenção Preventiva</AccordionTrigger>
              <AccordionContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="flex items-center">Periodicidade{isAi("periodicity") && <AiBadge />}</Label>
                    <Select value={form.periodicity} onValueChange={(v) => update("periodicity", v as MaintenancePeriodicity)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(periodicityLabels) as MaintenancePeriodicity[]).map((p) => (
                          <SelectItem key={p} value={p}>{periodicityLabels[p]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Próxima manutenção</Label>
                    <Input
                      type="date"
                      value={form.nextMaintenanceDate}
                      onChange={(e) => update("nextMaintenanceDate", e.target.value)}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit}>{mode === "create" ? "Criar ativo" : "Salvar alterações"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssetFormDialog;