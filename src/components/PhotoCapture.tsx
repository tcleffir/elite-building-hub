import { useRef, useState } from "react";
import { Camera, Upload, X, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  photos: string[];
  onChange: (photos: string[]) => void;
  max?: number;
  label?: string;
  compact?: boolean;
}

const MAX_BYTES = 5 * 1024 * 1024; // 5MB per file

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Comprime imagem via canvas (lado maior 1280px, jpeg 0.82)
 * para evitar estourar localStorage.
 */
async function compressImage(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxSide = 1280;
      let { width, height } = img;
      if (width > maxSide || height > maxSide) {
        if (width >= height) {
          height = Math.round((height * maxSide) / width);
          width = maxSide;
        } else {
          width = Math.round((width * maxSide) / height);
          height = maxSide;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

const PhotoCapture = ({ photos, onChange, max = 6, label = "Fotos", compact = false }: Props) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      const remaining = max - photos.length;
      const toAdd = Array.from(files).slice(0, remaining);
      const next: string[] = [];
      for (const f of toAdd) {
        if (!f.type.startsWith("image/")) {
          toast.error(`Arquivo ignorado (não é imagem): ${f.name}`);
          continue;
        }
        if (f.size > MAX_BYTES) {
          toast.error(`Imagem muito grande (>5MB): ${f.name}`);
          continue;
        }
        const raw = await fileToDataUrl(f);
        const compressed = await compressImage(raw);
        next.push(compressed);
      }
      if (next.length > 0) {
        onChange([...photos, ...next]);
        toast.success(`${next.length} foto(s) adicionada(s).`);
      }
      if (files.length > remaining) {
        toast.info(`Máximo de ${max} fotos atingido.`);
      }
    } catch (e) {
      toast.error("Falha ao processar imagem.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
      if (cameraRef.current) cameraRef.current.value = "";
    }
  };

  const remove = (idx: number) => {
    onChange(photos.filter((_, i) => i !== idx));
  };

  const canAdd = photos.length < max;

  return (
    <div className="space-y-2">
      {!compact && (
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium flex items-center gap-1.5">
            <ImagePlus className="h-4 w-4" /> {label}
            <span className="text-xs text-muted-foreground font-normal">({photos.length}/{max})</span>
          </p>
        </div>
      )}

      {photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {photos.map((src, i) => (
            <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border bg-muted">
              <img src={src} alt={`${label} ${i + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label="Remover foto"
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-background/90 border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {canAdd && (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => cameraRef.current?.click()}
            className="gap-1"
          >
            <Camera className="h-4 w-4" /> Tirar foto
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className="gap-1"
          >
            <Upload className="h-4 w-4" /> Da galeria
          </Button>
        </div>
      )}

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
};

export default PhotoCapture;