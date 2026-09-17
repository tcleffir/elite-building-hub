import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Paperclip } from "lucide-react";
import { toast } from "sonner";
import type { Asset, AssetMaintenance } from "@/lib/assets-data";

interface Props {
  asset: Asset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (m: AssetMaintenance) => void;
}

const AssetMaintenanceDialog = ({ asset, open, onOpenChange, onSave }: Props) => {
  const today = new Date().toISOString().slice(0, 10);
  const [performedAt, setPerformedAt] = useState(today);
  const [company, setCompany] = useState("");
  const [technician, setTechnician] = useState("");
  const [amount, setAmount] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [warrantyDays, setWarrantyDays] = useState("90");
  const [notes, setNotes] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [fileName, setFileName] = useState("");

  if (!asset) return null;

  const handleSubmit = () => {
    if (!company.trim() || !technician.trim() || !amount || !validUntil) {
      toast.error("Preencha empresa, técnico, valor e validade.");
      return;
    }
    const maint: AssetMaintenance = {
      id: `MN-${Date.now()}`,
      assetId: asset.id,
      performedAt,
      company: company.trim(),
      technician: technician.trim(),
      amountPaid: Number(amount.replace(",", ".")),
      validUntil,
      serviceWarrantyDays: Number(warrantyDays) || 0,
      invoice: invoiceNumber || fileName
        ? { number: invoiceNumber || "—", issuedAt: performedAt, fileName: fileName || "NF-anexa.pdf" }
        : undefined,
      notes: notes.trim() || undefined,
    };
    onSave(maint);
    toast.success("Manutenção registrada com sucesso.");
    onOpenChange(false);
    // reset
    setCompany(""); setTechnician(""); setAmount(""); setValidUntil("");
    setWarrantyDays("90"); setNotes(""); setInvoiceNumber(""); setFileName("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Manutenção — {asset.name}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="performedAt">Data realizada</Label>
              <Input id="performedAt" type="date" value={performedAt} onChange={e => setPerformedAt(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="validUntil">Próxima manutenção</Label>
              <Input id="validUntil" type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="company">Empresa executante *</Label>
            <Input id="company" value={company} onChange={e => setCompany(e.target.value)} placeholder="Ex: ClimaTech Solutions" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="technician">Técnico responsável *</Label>
              <Input id="technician" value={technician} onChange={e => setTechnician(e.target.value)} placeholder="Nome" />
            </div>
            <div>
              <Label htmlFor="amount">Valor pago (R$) *</Label>
              <Input id="amount" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} placeholder="2400,00" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="warrantyDays">Garantia do serviço (dias)</Label>
              <Input id="warrantyDays" type="number" value={warrantyDays} onChange={e => setWarrantyDays(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="invoiceNumber">Nº da NF</Label>
              <Input id="invoiceNumber" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder="NF-12345" />
            </div>
          </div>
          <div>
            <Label>Anexo da NF</Label>
            <label className="flex items-center gap-2 cursor-pointer rounded-2xl border border-dashed border-input px-3 py-2 text-sm text-muted-foreground hover:bg-muted/50 transition">
              <Upload className="h-4 w-4" />
              <span className="truncate">{fileName || "Selecionar arquivo (mock)"}</span>
              <input
                type="file"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) setFileName(f.name);
                }}
              />
            </label>
            {fileName && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Paperclip className="h-3 w-3" /> {fileName}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Detalhes do serviço executado..." rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit}>Registrar manutenção</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssetMaintenanceDialog;
