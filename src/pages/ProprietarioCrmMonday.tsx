import { Link2, Loader2 } from "lucide-react";

const ProprietarioCrmMonday = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 animate-fade-in">
      <div className="w-full max-w-xl rounded-2xl border bg-card p-10 text-center shadow-sm">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Link2 className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-3">CRM Monday</h1>
        <p className="text-muted-foreground leading-relaxed">
          Esta página será desenvolvida junto ao time do Patria, com validação
          da conexão com a API do Monday.
        </p>
        <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Integração em planejamento
        </div>
      </div>
    </div>
  );
};

export default ProprietarioCrmMonday;
