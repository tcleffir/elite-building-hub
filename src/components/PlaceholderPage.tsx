import { Building2, Wrench, BarChart3, CalendarDays, Users, ShoppingCart } from "lucide-react";

const pages: Record<string, { title: string; description: string; icon: React.ReactNode }> = {
  visitantes: { title: "Visitantes", description: "Gestão de visitantes e controle de acesso", icon: <Users size={40} /> },
  relatorios: { title: "Relatórios", description: "Relatórios operacionais, financeiros e ESG", icon: <BarChart3 size={40} /> },
  configuracoes: { title: "Configurações", description: "Configure ativos, usuários e integrações", icon: <Wrench size={40} /> },
};

interface PlaceholderPageProps {
  pageKey: string;
}

const PlaceholderPage = ({ pageKey }: PlaceholderPageProps) => {
  const page = pages[pageKey] || { title: "Página", description: "Em construção", icon: <Building2 size={40} /> };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
      <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground mb-6">
        {page.icon}
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">{page.title}</h1>
      <p className="text-muted-foreground text-center max-w-md">{page.description}</p>
      <p className="text-sm text-muted-foreground mt-4">Este módulo será implementado em breve.</p>
    </div>
  );
};

export default PlaceholderPage;
