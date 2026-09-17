import { useRef, useState } from "react";
import { Upload, Sparkles, Loader2, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  onExtracted: (data: Record<string, unknown>, fileName: string) => void;
  disabled?: boolean;
}

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const AssetUploadZone = ({ onExtracted, disabled }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = (f: File | null) => {
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máx. 10MB).");
      return;
    }
    const ok = /\.(jpg|jpeg|png|webp|pdf)$/i.test(f.name);
    if (!ok) {
      toast.error("Formato não suportado. Use JPG, PNG, WEBP ou PDF.");
      return;
    }
    setFile(f);
  };

  const handleExtract = async () => {
    if (!file) {
      toast.error("Selecione um arquivo primeiro.");
      return;
    }
    setLoading(true);
    try {
      const fileBase64 = await fileToBase64(file);
      const { data, error } = await supabase.functions.invoke("extract-asset-document", {
        body: { fileBase64, fileName: file.name },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Falha na extração");
      const confianca = data.data?.confianca ?? "media";
      toast.success(`✨ Dados extraídos (confiança: ${confianca})`);
      onExtracted(data.data, file.name);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(`Falha na extração: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-dashed border-input p-3 space-y-2 bg-muted/30">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs font-medium flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
          Anexar foto ou documento (NF, plaqueta, termo de garantia)
        </p>
        <Button
          type="button"
          size="sm"
          variant="default"
          onClick={handleExtract}
          disabled={!file || loading || disabled}
          className="gap-1"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {loading ? "Analisando..." : "Extrair com IA"}
        </Button>
      </div>
      <label className="flex items-center gap-2 cursor-pointer rounded-xl border border-input bg-background px-3 py-2 text-sm hover:bg-muted/50 transition">
        {file ? (
          <>
            <FileCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">{file.name}</span>
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">Clique para selecionar arquivo (JPG, PNG, PDF — até 10MB)</span>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.pdf"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
      </label>
    </div>
  );
};

export default AssetUploadZone;