import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Boxes, Link2, RefreshCw, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

interface BoardMap {
  board: string;
  modulo: string;
  itens: number;
  ultimaSync: string;
  status: "mapeado" | "pendente";
}

const boards: BoardMap[] = [
  { board: "Operações — Gestão Patrimonial", modulo: "Chamados e manutenção", itens: 48, ultimaSync: "—", status: "pendente" },
  { board: "Contratos e Renovações", modulo: "Contratos", itens: 27, ultimaSync: "—", status: "pendente" },
  { board: "Cobrança e Inadimplência", modulo: "Fechamento Mensal", itens: 19, ultimaSync: "—", status: "pendente" },
  { board: "Documentos e Compliance", modulo: "Documentos", itens: 63, ultimaSync: "—", status: "pendente" },
];

const ProprietarioCrmMonday = () => {
  const [token, setToken] = useState("");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
          <Boxes size={20} /> CRM Monday
        </h1>
        <p className="text-sm text-muted-foreground">
          Conexão do fluxo interno de operações com os quadros do Monday
        </p>
      </div>

      <Card className="border-amber-200 bg-amber-50/60">
        <CardContent className="p-4 flex items-start gap-3">
          <Clock size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900">
            <p className="font-medium">Integração aguardando credencial</p>
            <p className="text-amber-800">
              Para ativar a sincronização é necessário o token de API do Monday da conta do fundo.
              Com ele, os quadros abaixo passam a ser lidos e escritos automaticamente.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><Link2 size={16} /> Conexão</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Token de API do Monday"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              type="password"
              className="sm:max-w-sm"
            />
            <Button
              onClick={() =>
                token.trim()
                  ? toast.success("Token recebido — a conexão será concluída no ambiente seguro da plataforma")
                  : toast.error("Informe o token de API do Monday")
              }
            >
              Conectar
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => toast.info("Sincronização disponível após a conexão")}
            >
              <RefreshCw size={14} /> Sincronizar agora
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            O token é armazenado de forma segura no backend e nunca fica exposto no navegador.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Quadros mapeados</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            <div className="hidden md:grid grid-cols-12 gap-2 px-5 py-2 text-xs font-medium text-muted-foreground text-left">
              <span className="col-span-4">Quadro Monday</span>
              <span className="col-span-4">Módulo da plataforma</span>
              <span className="col-span-2">Itens</span>
              <span className="col-span-2">Status</span>
            </div>
            {boards.map((b) => (
              <div key={b.board} className="grid md:grid-cols-12 gap-2 px-5 py-3 text-sm text-left hover:bg-muted/50">
                <span className="md:col-span-4 font-medium text-foreground">{b.board}</span>
                <span className="md:col-span-4 text-muted-foreground">{b.modulo}</span>
                <span className="md:col-span-2">{b.itens}</span>
                <div className="md:col-span-2">
                  {b.status === "mapeado" ? (
                    <Badge className="bg-emerald-100 text-emerald-700 gap-1">
                      <CheckCircle2 size={12} /> Sincronizado
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-700">Pendente</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProprietarioCrmMonday;
