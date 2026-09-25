import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/contexts/AppContext";
import { FundProvider } from "@/contexts/FundContext";
import { FinanceProvider } from "@/contexts/FinanceContext";
import { PortfolioProvider } from "@/contexts/PortfolioContext";
import Layout from "@/components/Layout";
import RoleGuard from "@/components/RoleGuard";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Comunicados from "@/pages/Comunicados";
import ComunicadoNovo from "@/pages/ComunicadoNovo";
import Contratos from "@/pages/Contratos";
import Chamados from "@/pages/Chamados";
import Edificio from "@/pages/Edificio";
import Reservas from "@/pages/Reservas";
import Marketplace from "@/pages/Marketplace";
import ESG from "@/pages/ESG";
import ESGMetrica from "@/pages/ESGMetrica";
import ESGRateio from "@/pages/ESGRateio";
import ESGCertificacao from "@/pages/ESGCertificacao";
import Visitantes from "@/pages/Visitantes";
import Relatorios from "@/pages/Relatorios";
import Configuracoes from "@/pages/Configuracoes";
import Orcamento from "@/pages/Orcamento";
import Assembleia from "@/pages/Assembleia";
import Inspecao from "@/pages/Inspecao";
import CalculadoraM2 from "@/pages/CalculadoraM2";
import Apoio from "@/pages/Apoio";
import Financeiro from "@/pages/Financeiro";
import Ativos from "@/pages/Ativos";
import ProprietarioDocumentos from "@/pages/ProprietarioDocumentos";
import RelatoriosGerar from "@/pages/RelatoriosGerar";
import Contatos from "@/pages/Contatos";
import Encomendas from "@/pages/Encomendas";
import Portfolio from "@/pages/Portfolio";
import CalendarPage from "@/pages/CalendarPage";
import DashboardTellus from "@/pages/DashboardTellus";
import BuildingDetail from "@/pages/BuildingDetail";
import ProprietarioPortfolio from "@/pages/ProprietarioPortfolio";
import ProprietarioEdificios from "@/pages/ProprietarioEdificios";
import ProprietarioSustentabilidade from "@/pages/ProprietarioSustentabilidade";
import ProprietarioDocumentosV2 from "@/pages/ProprietarioDocumentosV2";
import ProprietarioChamados from "@/pages/ProprietarioChamados";
import ProprietarioReservas from "@/pages/ProprietarioReservas";
import ProprietarioComunicacao from "@/pages/ProprietarioComunicacao";
import ProprietarioConfiguracoes from "@/pages/ProprietarioConfiguracoes";
import ProprietarioContratos from "@/pages/ProprietarioContratos";
import ProprietarioFinanceiroLocacao from "@/pages/ProprietarioFinanceiroLocacao";
import ProprietarioRelatoriosLocacao from "@/pages/ProprietarioRelatoriosLocacao";

import ProprietarioConciliacaoFinanceira from "@/pages/ProprietarioConciliacaoFinanceira";
import ProprietarioOutrosRecebimentos from "@/pages/ProprietarioOutrosRecebimentos";
import ProprietarioMetricasKPIs from "@/pages/ProprietarioMetricasKPIs";
import ProprietarioDespesas from "@/pages/ProprietarioDespesas";
import ProprietarioAlertas from "@/pages/ProprietarioAlertas";
import ProprietarioRelatorioMensal from "@/pages/ProprietarioRelatorioMensal";
import ProprietarioCrmMonday from "@/pages/ProprietarioCrmMonday";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <Layout>
    <RoleGuard>{children}</RoleGuard>
  </Layout>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <AppProvider>
        <FundProvider>
        <FinanceProvider>
        <PortfolioProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          {/* Proprietário routes */}
          <Route path="/proprietario/portfolio" element={<AppLayout><ProprietarioPortfolio /></AppLayout>} />
          <Route path="/proprietario/edificios" element={<AppLayout><ProprietarioEdificios /></AppLayout>} />
          <Route path="/proprietario/calendario" element={<AppLayout><CalendarPage /></AppLayout>} />
          <Route path="/proprietario/sustentabilidade" element={<AppLayout><ProprietarioSustentabilidade /></AppLayout>} />
          <Route path="/proprietario/documentos" element={<AppLayout><ProprietarioDocumentosV2 /></AppLayout>} />
          <Route path="/proprietario/chamados" element={<AppLayout><ProprietarioChamados /></AppLayout>} />
          <Route path="/proprietario/reservas" element={<AppLayout><ProprietarioReservas /></AppLayout>} />
          <Route path="/proprietario/comunicacao" element={<AppLayout><ProprietarioComunicacao /></AppLayout>} />
          <Route path="/proprietario/contratos" element={<AppLayout><ProprietarioContratos /></AppLayout>} />
          <Route path="/proprietario/financeiro-locacao" element={<AppLayout><ProprietarioFinanceiroLocacao /></AppLayout>} />
          <Route path="/proprietario/relatorios-locacao" element={<AppLayout><ProprietarioRelatoriosLocacao /></AppLayout>} />
          
          <Route path="/proprietario/conciliacao-financeira" element={<AppLayout><ProprietarioConciliacaoFinanceira /></AppLayout>} />
          <Route path="/proprietario/outros-recebimentos" element={<AppLayout><ProprietarioOutrosRecebimentos /></AppLayout>} />
          <Route path="/proprietario/metricas-kpis" element={<AppLayout><ProprietarioMetricasKPIs /></AppLayout>} />
          <Route path="/proprietario/despesas" element={<AppLayout><ProprietarioDespesas /></AppLayout>} />
          <Route path="/proprietario/alertas" element={<AppLayout><ProprietarioAlertas /></AppLayout>} />
          <Route path="/proprietario/relatorio-mensal" element={<AppLayout><ProprietarioRelatorioMensal /></AppLayout>} />
          <Route path="/proprietario/crm-monday" element={<AppLayout><ProprietarioCrmMonday /></AppLayout>} />
          <Route path="/proprietario/configuracoes" element={<AppLayout><ProprietarioConfiguracoes /></AppLayout>} />
          <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
          <Route path="/comunicados" element={<AppLayout><Comunicados /></AppLayout>} />
          <Route path="/comunicados/novo" element={<AppLayout><ComunicadoNovo /></AppLayout>} />
          <Route path="/contratos" element={<AppLayout><Contratos /></AppLayout>} />
          <Route path="/chamados" element={<AppLayout><Chamados /></AppLayout>} />
          <Route path="/edificio" element={<AppLayout><Edificio /></AppLayout>} />
          <Route path="/reservas" element={<AppLayout><Reservas /></AppLayout>} />
          <Route path="/marketplace" element={<AppLayout><Marketplace /></AppLayout>} />
          <Route path="/esg" element={<AppLayout><ESG /></AppLayout>} />
          <Route path="/esg/metricas/:type" element={<AppLayout><ESGMetrica /></AppLayout>} />
          <Route path="/esg/certificacoes/:type" element={<AppLayout><ESGCertificacao /></AppLayout>} />
          <Route path="/esg/rateio" element={<AppLayout><ESGRateio /></AppLayout>} />
          <Route path="/rateio" element={<AppLayout><ESGRateio /></AppLayout>} />
          <Route path="/visitantes" element={<AppLayout><Visitantes /></AppLayout>} />
          <Route path="/relatorios" element={<AppLayout><Relatorios /></AppLayout>} />
          <Route path="/relatorios/gerar" element={<AppLayout><RelatoriosGerar /></AppLayout>} />
          <Route path="/configuracoes" element={<AppLayout><Configuracoes /></AppLayout>} />
          <Route path="/orcamento" element={<AppLayout><Orcamento /></AppLayout>} />
          <Route path="/assembleia" element={<AppLayout><Assembleia /></AppLayout>} />
          <Route path="/inspecao" element={<AppLayout><Inspecao /></AppLayout>} />
          <Route path="/ativos" element={<AppLayout><Ativos /></AppLayout>} />
          <Route path="/ferramentas/calculadora-m2" element={<AppLayout><CalculadoraM2 /></AppLayout>} />
          <Route path="/apoio" element={<AppLayout><Apoio /></AppLayout>} />
          <Route path="/financeiro" element={<AppLayout><Financeiro /></AppLayout>} />
          <Route path="/contatos" element={<AppLayout><Contatos /></AppLayout>} />
          <Route path="/proprietario/documentos" element={<AppLayout><ProprietarioDocumentos /></AppLayout>} />
          <Route path="/encomendas" element={<AppLayout><Encomendas /></AppLayout>} />
          <Route path="/portfolio" element={<AppLayout><Portfolio /></AppLayout>} />
          <Route path="/portfolio/:buildingId" element={<AppLayout><BuildingDetail /></AppLayout>} />
          <Route path="/dashboard-proprietario" element={<AppLayout><DashboardTellus /></AppLayout>} />
          <Route path="/calendario" element={<AppLayout><CalendarPage /></AppLayout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </PortfolioProvider>
        </FinanceProvider>
        </FundProvider>
        </AppProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
