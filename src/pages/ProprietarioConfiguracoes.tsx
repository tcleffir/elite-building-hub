import { useState } from "react";
import { User, Bell, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getHGRE11PortfolioBuildings } from "@/lib/mock-data";
import { useApp } from "@/contexts/AppContext";
import { toast } from "sonner";

const ProprietarioConfiguracoes = () => {
  const { user } = useApp();
  const userBuildings = getHGRE11PortfolioBuildings();

  const [notifications, setNotifications] = useState({
    contractCritical: true,
    documentUrgent: true,
    newTicket: true,
    newReservation: false,
    newAnnouncement: true,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl md:text-2xl font-bold text-foreground">Configurações</h1>

      <Tabs defaultValue="conta">
        <TabsList>
          <TabsTrigger value="conta" className="gap-1"><User size={14} /> Minha Conta</TabsTrigger>
          <TabsTrigger value="notificacoes" className="gap-1"><Bell size={14} /> Notificações</TabsTrigger>
          <TabsTrigger value="edificios" className="gap-1"><Building2 size={14} /> Meus Ativos</TabsTrigger>
        </TabsList>

        <TabsContent value="conta" className="space-y-4">
          <div className="bg-card rounded-xl border p-6 max-w-lg space-y-4">
            <div><Label className="text-xs">Nome</Label><Input defaultValue={user.full_name} /></div>
            <div><Label className="text-xs">E-mail</Label><Input defaultValue={user.email} /></div>
            <div><Label className="text-xs">Nova senha</Label><Input type="password" placeholder="Deixe em branco para manter" /></div>
            <div>
              <Label className="text-xs">Foto de perfil</Label>
              <div className="flex items-center gap-3 mt-1">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: user.avatar_bg || '#4338CA' }}>
                  {user.avatar_initials}
                </div>
                <Button variant="outline" size="sm" onClick={() => toast.info("Upload de foto")}>Alterar foto</Button>
              </div>
            </div>
            <Button onClick={() => toast.success("Dados atualizados!")}>Salvar</Button>
          </div>
        </TabsContent>

        <TabsContent value="notificacoes" className="space-y-4">
          <div className="bg-card rounded-xl border p-6 max-w-lg space-y-5">
            {[
              { key: 'contractCritical', label: 'Contrato crítico (< 6 meses)' },
              { key: 'documentUrgent', label: 'Documento urgente (< 60 dias)' },
              { key: 'newTicket', label: 'Novo chamado aberto' },
              { key: 'newReservation', label: 'Nova reserva solicitada' },
              { key: 'newAnnouncement', label: 'Novo comunicado publicado' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between">
                <span className="text-sm">{item.label}</span>
                <Switch
                  checked={notifications[item.key as keyof typeof notifications]}
                  onCheckedChange={v => setNotifications(prev => ({ ...prev, [item.key]: v }))}
                />
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="edificios" className="space-y-4">
          <div className="bg-card rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Ativo</TableHead>
                  <TableHead className="text-xs">Endereço</TableHead>
                  <TableHead className="text-xs text-right">GLA (m²)</TableHead>
                  <TableHead className="text-xs text-right">Ocupação</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userBuildings.map(b => (
                  <TableRow key={b.id}>
                    <TableCell className="text-sm font-medium">{b.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{b.address}</TableCell>
                    <TableCell className="text-sm text-right">{(b.gla_m2 || b.total_area_m2).toLocaleString('pt-BR')}</TableCell>
                    <TableCell className="text-sm text-right">{b.occupancy_pct || b.occupancy_rate}%</TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] ${b.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>
                        {b.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground italic">Lista somente leitura — entre em contato com o administrador para alterações.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProprietarioConfiguracoes;
