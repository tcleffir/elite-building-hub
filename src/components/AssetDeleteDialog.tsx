import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";
import type { Asset } from "@/lib/assets-data";

interface Props {
  asset: Asset | null;
  openTickets: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

const AssetDeleteDialog = ({ asset, openTickets, open, onOpenChange, onConfirm }: Props) => {
  if (!asset) return null;
  const blocked = openTickets > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Excluir ativo?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                Você está prestes a excluir <span className="font-semibold text-foreground">{asset.name}</span> ({asset.id}).
              </p>
              {blocked ? (
                <p className="text-destructive font-medium">
                  ⚠ Existem {openTickets} chamado{openTickets > 1 ? "s" : ""} aberto{openTickets > 1 ? "s" : ""} vinculado{openTickets > 1 ? "s" : ""}.
                  Resolva ou desvincule antes de excluir.
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Esta ação não pode ser desfeita. Manutenções e chamados antigos vinculados ficarão órfãos
                  (referenciando um ativo inexistente). O histórico de alterações deste ativo também será removido.
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={blocked}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Excluir definitivamente
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AssetDeleteDialog;