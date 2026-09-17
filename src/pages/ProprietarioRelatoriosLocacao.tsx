import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/contexts/AppContext";
import { getHGRE11PortfolioBuildings, mockTenantContracts } from "@/lib/mock-data";
import {
  mockGuarantees, mockInsurances, mockIPTUs, mockMonthlyPayments,
  mockInadimplencia, mockReportHistory, type ReportHistoryEntry,
  guaranteeTypeLabels, iptuResponsibleLabels,
} from "@/lib/contract-finance-data";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { FileText, Mail, Download, RotateCcw, Search, X, ChevronRight, Eye, AlertTriangle, Loader2, ArrowRight, Check, ClipboardList, Building2, LayoutTemplate, CalendarClock, Play, Pause, Pencil, Copy, Trash2, Sparkles } from "lucide-react";
import { REPORT_MODELS, mockScheduledReports, type ReportModelId, type ScheduledReport } from "@/lib/report-models";
import { listBasket, removeFromBasket, subscribeBasket, type ReportBasketItem } from "@/lib/report-basket";
import { toast } from "sonner";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

const monthNamesFull = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const monthNamesShort = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

// Generate period options: Jan/2025 to Dec/2027
const periodOptions: { label: string; value: string }[] = [];
for (let y = 2025; y <= 2027; y++) {
  for (let m = 0; m < 12; m++) {
    periodOptions.push({ label: `${monthNamesFull[m]} ${y}`, value: `${y}-${String(m + 1).padStart(2, '0')}` });
  }
}

const sectionGroups = [
  {
    id: 'contrato',
    title: 'Contrato & Cadastro',
    sections: [
      { key: 'cadastral', label: 'Dados Cadastrais', default: true },
      { key: 'contract', label: 'Resumo do Contrato', default: true },
      { key: 'notes', label: 'Condições Especiais', default: false },
      { key: 'reajustes', label: 'Reajustes', default: true },
    ],
  },
  {
    id: 'compliance',
    title: 'Compliance & Garantias',
    sections: [
      { key: 'guarantee', label: 'Garantias', default: true },
      { key: 'insurance', label: 'Seguro Patrimonial', default: true },
      { key: 'iptu', label: 'IPTU', default: true },
      { key: 'obrigacoes', label: 'Obrigações Contratuais', default: false },
    ],
  },
  {
    id: 'financeiro',
    title: 'Financeiro & Histórico',
    sections: [
      { key: 'payments', label: 'Histórico de Pagamentos', default: true },
      { key: 'btg', label: 'Controle Banco', default: false },
      { key: 'default', label: 'Inadimplência', default: true },
      { key: 'receita_contratada', label: 'Receita Contratada', default: true },
      { key: 'receita_realizada', label: 'Receita Realizada', default: true },
    ],
  },
  {
    id: 'vencimentos',
    title: 'Vencimentos',
    sections: [
      { key: 'alerts', label: 'Próximos Vencimentos', default: true },
      { key: 'reajustes_futuros', label: 'Reajustes Futuros', default: false },
      { key: 'expiracao', label: 'Expiração de Contratos', default: false },
      { key: 'renovacao', label: 'Opções de Renovação', default: false },
    ],
  },
];

const allSections = sectionGroups.flatMap(g => g.sections);

export default function ProprietarioRelatoriosLocacao() {
  const { user } = useApp();
  const buildings = getHGRE11PortfolioBuildings();
  // Ativo padrão: Chucri Zaidan (b12) — possui cadastro completo de locatários
  const firstBuildingId = buildings.find(b => b.id === 'b12')?.id || buildings[0]?.id || '';
  const [activeTab, setActiveTab] = useState('gestao');

  // ── Escopo: modelo, ativos, locatários, período ──
  const [reportModel, setReportModel] = useState<ReportModelId>('mensal');
  const [allAssetsSelected, setAllAssetsSelected] = useState(false);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([firstBuildingId]);
  const [assetPopoverOpen, setAssetPopoverOpen] = useState(false);
  const effectiveAssetIds = allAssetsSelected ? buildings.map(b => b.id) : selectedAssetIds;
  const selectedBuildingId = effectiveAssetIds[0] ?? firstBuildingId;

  // Ativo em foco na aba Pendências (independente do escopo do relatório)
  const [pendBuildingId, setPendBuildingId] = useState(firstBuildingId);

  // Itens de KPI enviados pela tela de Métricas e KPIs
  const [basket, setBasket] = useState<ReportBasketItem[]>(() => listBasket());
  useEffect(() => subscribeBasket(() => setBasket(listBasket())), []);

  // Relatórios agendados (mock)
  const [scheduled, setScheduled] = useState<ScheduledReport[]>(mockScheduledReports);

  // Gestão state
  const [selectedTenants, setSelectedTenants] = useState<string[]>([]);
  const [allTenantsSelected, setAllTenantsSelected] = useState(true);
  const [startPeriod, setStartPeriod] = useState('2026-01');
  const [endPeriod, setEndPeriod] = useState('2026-04');
  const [checkedSections, setCheckedSections] = useState<Record<string, boolean>>(
    Object.fromEntries(allSections.map(s => [s.key, s.default]))
  );
  const [format, setFormat] = useState<'pdf' | 'excel'>('pdf');
  const [generating, setGenerating] = useState(false);
  const [tenantSearch, setTenantSearch] = useState('');
  const [tenantPopoverOpen, setTenantPopoverOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Pendências state
  const [emailModal, setEmailModal] = useState(false);
  const [emailTo, setEmailTo] = useState('gestao@tellus.com.br');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  // History state
  const [history, setHistory] = useState<ReportHistoryEntry[]>(mockReportHistory);
  const [historySearch, setHistorySearch] = useState('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState('all');
  const [regenerateId, setRegenerateId] = useState<string | null>(null);

  const tenantContracts = useMemo(() =>
    mockTenantContracts.filter(tc => effectiveAssetIds.includes(tc.building_id) && tc.tenant_name),
    [effectiveAssetIds.join(',')]
  );

  /** Contratos do ativo em foco na aba Pendências. */
  const pendContracts = useMemo(() =>
    mockTenantContracts.filter(tc => tc.building_id === pendBuildingId && tc.tenant_name),
    [pendBuildingId]
  );

  const toggleAsset = (id: string) => {
    setAllAssetsSelected(false);
    setSelectedAssetIds(prev => {
      const next = prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id];
      return next.length ? next : [id];
    });
  };
  const selectAllAssets = () => { setAllAssetsSelected(true); setSelectedAssetIds([]); };

  /** Aplica as seções recomendadas do modelo selecionado. */
  const applyModel = (id: ReportModelId) => {
    setReportModel(id);
    const model = REPORT_MODELS.find(m => m.id === id);
    if (!model || !model.sections.length) return;
    setCheckedSections(Object.fromEntries(allSections.map(s => [s.key, model.sections.includes(s.key)])));
  };

  const allTenantNames = useMemo(() => tenantContracts.map(tc => tc.tenant_name!), [tenantContracts]);
  const filteredTenantList = useMemo(() =>
    allTenantNames.filter(n => n.toLowerCase().includes(tenantSearch.toLowerCase())),
    [allTenantNames, tenantSearch]
  );

  const effectiveSelectedTenants = allTenantsSelected ? allTenantNames : selectedTenants;

  const toggleTenant = (name: string) => {
    setAllTenantsSelected(false);
    setSelectedTenants(prev =>
      prev.includes(name) ? prev.filter(t => t !== name) : [...prev, name]
    );
  };

  const selectAllTenants = () => { setAllTenantsSelected(true); setSelectedTenants([]); };
  const clearTenants = () => { setAllTenantsSelected(false); setSelectedTenants([]); };
  const removeTenantChip = (name: string) => {
    if (allTenantsSelected) {
      setAllTenantsSelected(false);
      setSelectedTenants(allTenantNames.filter(n => n !== name));
    } else {
      setSelectedTenants(prev => prev.filter(t => t !== name));
    }
  };

  const toggleGroupSections = (groupId: string, checked: boolean) => {
    const group = sectionGroups.find(g => g.id === groupId);
    if (!group) return;
    setCheckedSections(prev => {
      const next = { ...prev };
      group.sections.forEach(s => { next[s.key] = checked; });
      return next;
    });
  };

  const isGroupChecked = (groupId: string) => {
    const group = sectionGroups.find(g => g.id === groupId);
    return group?.sections.every(s => checkedSections[s.key]) ?? false;
  };

  const isGroupIndeterminate = (groupId: string) => {
    const group = sectionGroups.find(g => g.id === groupId);
    if (!group) return false;
    const checked = group.sections.filter(s => checkedSections[s.key]).length;
    return checked > 0 && checked < group.sections.length;
  };

  const selectAllSections = () => setCheckedSections(Object.fromEntries(allSections.map(s => [s.key, true])));
  const clearAllSections = () => setCheckedSections(Object.fromEntries(allSections.map(s => [s.key, false])));

  const buildingName = buildings.find(b => b.id === selectedBuildingId)?.name || '';
  const assetScopeLabel = allAssetsSelected
    ? `Todos os ativos (${buildings.length})`
    : effectiveAssetIds.length === 1
      ? buildingName
      : `${effectiveAssetIds.length} ativos selecionados`;
  const pendBuildingName = buildings.find(b => b.id === pendBuildingId)?.name || '';
  const contractsInScope = tenantContracts.length;
  const selectedTenantCount = effectiveSelectedTenants.length;
  const selectedSectionCount = Object.values(checkedSections).filter(Boolean).length;
  const totalSectionCount = allSections.length;
  const canGenerate = selectedTenantCount > 0 && selectedSectionCount > 0;

  const startM = parseInt(startPeriod.split('-')[1]) - 1;
  const startY = parseInt(startPeriod.split('-')[0]);
  const endM = parseInt(endPeriod.split('-')[1]) - 1;
  const endY = parseInt(endPeriod.split('-')[0]);
  const monthCount = (endY - startY) * 12 + (endM - startM) + 1;
  const periodLabel = `${monthNamesFull[startM]} ${startY} → ${monthNamesFull[endM]} ${endY}`;
  const periodLabelShort = `${monthNamesShort[startM]}/${startY} — ${monthNamesShort[endM]}/${endY}`;

  // ── Generate Report ──
  const handleGenerate = async () => {
    setGenerating(true);
    await new Promise(r => setTimeout(r, 1500));

    const filteredContracts = tenantContracts.filter(tc => effectiveSelectedTenants.includes(tc.tenant_name!));

    if (format === 'pdf') {
      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.text('Patria Real Estate', 105, 50, { align: 'center' });
      doc.setFontSize(16);
      doc.text('Relatório de Gestão de Locatários', 105, 70, { align: 'center' });
      doc.setFontSize(12);
      doc.text(buildingName, 105, 85, { align: 'center' });
      doc.text(`Período: ${periodLabel}`, 105, 95, { align: 'center' });
      doc.setFontSize(10);
      doc.text(`Locatários: ${effectiveSelectedTenants.length}`, 105, 108, { align: 'center' });
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 105, 118, { align: 'center' });
      doc.text('Safra Gestão', 105, 128, { align: 'center' });

      filteredContracts.forEach((tc) => {
        doc.addPage();
        let y = 20;
        doc.setFontSize(14);
        doc.text(tc.tenant_name!, 14, y); y += 10;
        doc.setFontSize(10);

        if (checkedSections.cadastral) {
          doc.text(`CNPJ: ${tc.tenant_cnpj || '—'} | Unidade: ${tc.unit_id}`, 14, y); y += 6;
          doc.text(`Área: ${tc.area_m2} m²`, 14, y); y += 10;
        }
        if (checkedSections.contract) {
          doc.text(`Vigência: ${tc.contract_start} → ${tc.contract_end}`, 14, y); y += 6;
          doc.text(`Valor: R$ ${Math.round(tc.area_m2 * (tc.price_per_m2 || 0)).toLocaleString('pt-BR')}/mês | Índice: IGP-M`, 14, y); y += 10;
        }
        if (checkedSections.guarantee) {
          const g = mockGuarantees.find(g => g.contract_id === tc.id);
          if (g) {
            doc.text(`Garantia: ${guaranteeTypeLabels[g.type]} | R$ ${g.value.toLocaleString('pt-BR')}${g.valid_until ? ` | Até ${new Date(g.valid_until).toLocaleDateString('pt-BR')}` : ''}`, 14, y); y += 10;
          }
        }
        if (checkedSections.insurance) {
          const ins = mockInsurances.find(i => i.contract_id === tc.id);
          if (ins) {
            doc.text(`Seguro: ${ins.insurer} | Apólice ${ins.policy_number} | R$ ${ins.insured_value.toLocaleString('pt-BR')}`, 14, y); y += 10;
          }
        }
        if (checkedSections.iptu) {
          const iptu = mockIPTUs.find(i => i.contract_id === tc.id);
          if (iptu) {
            doc.text(`IPTU: ${iptuResponsibleLabels[iptu.responsible]} | R$ ${iptu.annual_value.toLocaleString('pt-BR')}/ano`, 14, y); y += 10;
          }
        }
        if (checkedSections.payments) {
          const payments = mockMonthlyPayments.filter(p => p.tenant_name === tc.tenant_name && effectiveAssetIds.includes(p.building_id));
          if (payments.length > 0) {
            doc.text('Histórico de Pagamentos:', 14, y); y += 6;
            (doc as any).autoTable({
              startY: y,
              head: [['Competência', 'Valor', 'Status']],
              body: payments.map(p => [p.competence, `R$ ${p.billable_value.toLocaleString('pt-BR')}`, p.status === 'paid' ? 'Pago' : p.status === 'overdue' ? 'Em Atraso' : 'Pendente']),
              margin: { left: 14 },
              styles: { fontSize: 8 },
            });
            y = (doc as any).lastAutoTable.finalY + 10;
          }
        }

        doc.setFontSize(8);
        doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} — Plataforma Patria Real Estate | Safra Gestão`, 105, 285, { align: 'center' });
      });

      doc.save(`Patria Real Estate_Gestao_${buildingName.replace(/\s/g, '_')}_${startPeriod}_${endPeriod}.pdf`);
    } else {
      const wb = XLSX.utils.book_new();
      filteredContracts.forEach(tc => {
        const data: any[][] = [
          ['Locatário', tc.tenant_name],
          ['Unidade', tc.unit_id],
          ['CNPJ', tc.tenant_cnpj || '—'],
          ['Área (m²)', tc.area_m2],
          ['Vigência', `${tc.contract_start} → ${tc.contract_end}`],
        ];
        if (checkedSections.payments) {
          data.push([], ['Competência', 'Valor', 'Status']);
          mockMonthlyPayments
            .filter(p => p.tenant_name === tc.tenant_name && effectiveAssetIds.includes(p.building_id))
            .forEach(p => data.push([p.competence, p.billable_value, p.status === 'paid' ? 'Pago' : p.status === 'overdue' ? 'Em Atraso' : 'Pendente']));
        }
        const ws = XLSX.utils.aoa_to_sheet(data);
        const sheetName = (tc.tenant_name || 'Locatário').substring(0, 31);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      });
      XLSX.writeFile(wb, `Patria Real Estate_Gestao_${buildingName.replace(/\s/g, '_')}_${startPeriod}_${endPeriod}.xlsx`);
    }

    toast.success('Relatório gerado com sucesso!');

    const newEntry: ReportHistoryEntry = {
      id: `rh-${Date.now()}`, type: 'gestao', building_name: assetScopeLabel,
      tenants: allTenantsSelected ? ['Todos'] : selectedTenants,
      period: periodLabelShort, generated_at: new Date().toISOString(), generated_by: user.full_name,
      format, size: format === 'pdf' ? '1.4 MB' : '620 KB',
    };
    setHistory(prev => [newEntry, ...prev]);
    setGenerating(false);

    setTimeout(() => setActiveTab('historico'), 1000);
  };

  // ── Pendências ──
  const pendencies = useMemo(() => {
    const items: { tenant: string; type: string; typeKey: string; description: string; daysLeft: number; severity: 'red' | 'yellow' | 'blue'; contractId?: string; policyNumber?: string }[] = [];

    // Inadimplência
    mockInadimplencia.filter(i => i.building_id === pendBuildingId).forEach(i => {
      items.push({
        tenant: i.tenant_name, type: 'Inadimplência', typeKey: 'inadimplencia',
        description: `💰 R$ ${i.value.toLocaleString('pt-BR')} — ${i.competence} | ${i.days_overdue} dias em atraso`,
        daysLeft: -i.days_overdue, severity: 'red',
      });
    });

    // Garantias — exclude caução and null valid_until
    mockGuarantees.forEach(g => {
      if (g.type === 'caucao' || !g.valid_until) return;
      const tc = pendContracts.find(c => c.id === g.contract_id);
      if (!tc) return;
      const daysLeft = Math.floor((new Date(g.valid_until).getTime() - Date.now()) / 86400000);
      if (daysLeft < 120) {
        const desc = daysLeft < 0
          ? `🔒 ${guaranteeTypeLabels[g.type]} ${g.guarantor} — VENCIDA há ${Math.abs(daysLeft)} dias`
          : `🔒 ${guaranteeTypeLabels[g.type]} ${g.guarantor} — vence ${new Date(g.valid_until).toLocaleDateString('pt-BR')}`;
        items.push({
          tenant: tc.tenant_name!, type: 'Garantia', typeKey: 'garantia',
          description: desc, daysLeft, severity: daysLeft < 60 ? 'red' : 'yellow',
        });
      }
    });

    // Seguros
    mockInsurances.forEach(ins => {
      const tc = pendContracts.find(c => c.id === ins.contract_id);
      if (!tc) return;
      const daysLeft = Math.floor((new Date(ins.end_date).getTime() - Date.now()) / 86400000);
      if (daysLeft < 120) {
        items.push({
          tenant: tc.tenant_name!, type: 'Seguro', typeKey: 'seguro',
          description: `🛡️ Apólice ${ins.policy_number} — vence ${new Date(ins.end_date).toLocaleDateString('pt-BR')}`,
          daysLeft, severity: daysLeft < 60 ? 'red' : 'yellow', policyNumber: ins.policy_number,
        });
      }
    });

    // Contratos vencendo
    pendContracts.forEach(tc => {
      const daysLeft = Math.floor((new Date(tc.contract_end!).getTime() - Date.now()) / 86400000);
      if (daysLeft < 365 && daysLeft > 0) {
        items.push({
          tenant: tc.tenant_name!, type: 'Contrato', typeKey: 'contrato',
          description: `📋 Contrato ${tc.unit_id} — vence ${new Date(tc.contract_end!).toLocaleDateString('pt-BR')}`,
          daysLeft, severity: daysLeft < 180 ? 'red' : daysLeft < 365 ? 'yellow' : 'blue',
          contractId: tc.id,
        });
      }
    });

    return items;
  }, [pendBuildingId, pendContracts]);

  const criticalCount = pendencies.filter(p => p.severity === 'red').length;
  const attentionCount = pendencies.filter(p => p.severity === 'yellow').length;
  const totalInadimplente = pendencies.filter(p => p.typeKey === 'inadimplencia').reduce((sum, p) => {
    const match = p.description.match(/R\$ ([\d.]+)/);
    return sum + (match ? parseFloat(match[1].replace('.', '').replace(',', '.')) : 0);
  }, 0);
  const inadimValues = mockInadimplencia.filter(i => i.building_id === pendBuildingId).reduce((s, i) => s + i.value, 0);
  const nextExpiry = pendencies.filter(p => p.daysLeft > 0).sort((a, b) => a.daysLeft - b.daysLeft)[0];

  const getDaysDisplay = (days: number) => {
    if (days < 0) return `VENCIDA há ${Math.abs(days)} dias`;
    if (days === 0) return 'Vence HOJE';
    return `${days} dias`;
  };

  const generatePendenciesPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Relatório de Pendências — ${pendBuildingName}`, 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(new Date().toLocaleDateString('pt-BR'), 105, 28, { align: 'center' });

    (doc as any).autoTable({
      startY: 35,
      head: [['Locatário', 'Tipo', 'Descrição', 'Prazo', 'Severidade']],
      body: pendencies.map(p => [
        p.tenant, p.type,
        p.description.replace(/[💰🔒🛡️📋]/g, '').trim(),
        getDaysDisplay(p.daysLeft),
        p.severity === 'red' ? 'Crítico' : 'Atenção',
      ]),
      styles: { fontSize: 8 },
    });

    doc.setFontSize(9);
    const finalY = (doc as any).lastAutoTable?.finalY || 200;
    doc.text(`Resumo: ${criticalCount} críticos | ${attentionCount} atenção | R$ ${inadimValues.toLocaleString('pt-BR')} inadimplente`, 14, finalY + 10);
    doc.setFontSize(8);
    doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} — Patria Real Estate | Safra Gestão`, 105, 285, { align: 'center' });

    doc.save(`Patria Real Estate_Pendencias_${pendBuildingName.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF de pendências gerado!');

    setHistory(prev => [{
      id: `rh-${Date.now()}`, type: 'pendencias', building_name: pendBuildingName,
      tenants: Array.from(new Set(pendencies.map(p => p.tenant))),
      period: new Date().toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
      generated_at: new Date().toISOString(), generated_by: user.full_name,
      format: 'pdf', size: '310 KB',
    }, ...prev]);
  };

  const openEmailModal = () => {
    const month = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    setEmailSubject(`Patria Real Estate — Pendências ${pendBuildingName} — ${month}`);
    setEmailBody(`Segue em anexo o relatório de pendências do ativo ${pendBuildingName} referente ao período ${month}.\n\nResumo: ${criticalCount} itens críticos | ${attentionCount} itens de atenção | R$ ${inadimValues.toLocaleString('pt-BR')} em inadimplência.\n\nAcesse a plataforma Patria Real Estate para mais detalhes.`);
    setEmailModal(true);
  };

  const sendEmail = () => {
    const mailto = `mailto:${emailTo}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(mailto);
    setEmailModal(false);
    toast.success('E-mail preparado no seu cliente de e-mail!');
  };

  // History filtered
  const filteredHistory = useMemo(() => {
    return history.filter(h => {
      if (historyTypeFilter !== 'all' && h.type !== historyTypeFilter) return false;
      if (historySearch) {
        const s = historySearch.toLowerCase();
        return h.building_name.toLowerCase().includes(s) || h.tenants.some(t => t.toLowerCase().includes(s));
      }
      return true;
    });
  }, [history, historySearch, historyTypeFilter]);

  const handleRegenerate = (id: string) => {
    setRegenerateId(null);
    const original = history.find(h => h.id === id);
    if (!original) return;
    const newEntry: ReportHistoryEntry = {
      ...original,
      id: `rh-${Date.now()}`,
      generated_at: new Date().toISOString(),
      generated_by: user.full_name,
      size: original.size,
    };
    setHistory(prev => [newEntry, ...prev]);
    toast.success('Relatório regenerado com dados atuais!');
  };

  const formatTenantDisplay = (tenants: string[]) => {
    if (tenants.length <= 2) return tenants.join(', ');
    return `${tenants[0]} + ${tenants.length - 1} outros`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Relatórios de Locação</h1>
        <p className="text-muted-foreground text-sm">Gere, configure e acompanhe relatórios personalizados do portfólio</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="gestao">Gestão de Locatários</TabsTrigger>
          <TabsTrigger value="pendencias" className="flex items-center gap-1.5">
            Pendências
            {criticalCount > 0 && <span className="bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.5 leading-none font-bold">{pendencies.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="agendados" className="flex items-center gap-1.5">
            Agendados
            <span className="bg-gray-200 text-gray-700 text-[10px] rounded-full px-1.5 py-0.5 leading-none font-medium">{scheduled.filter(x => x.status === 'ativo').length}</span>
          </TabsTrigger>
          <TabsTrigger value="historico" className="flex items-center gap-1.5">
            Histórico
            <span className="bg-gray-200 text-gray-700 text-[10px] rounded-full px-1.5 py-0.5 leading-none font-medium">{history.length}</span>
          </TabsTrigger>
        </TabsList>

        {/* ── GESTÃO DE LOCATÁRIOS ── */}
        <TabsContent value="gestao" className="mt-4">
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            {/* Left Column (60%) */}
            <div className="xl:col-span-3 space-y-4">
              {/* Card 0: Modelo de relatório */}
              <Card>
                <CardContent className="pt-5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <LayoutTemplate className="h-3.5 w-3.5" /> Modelo de relatório
                  </Label>
                  <Select value={reportModel} onValueChange={(v) => applyModel(v as ReportModelId)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {REPORT_MODELS.map(m => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-2">
                    {REPORT_MODELS.find(m => m.id === reportModel)?.description}
                    {' '}As seções recomendadas são pré-selecionadas e podem ser alteradas manualmente.
                  </p>
                </CardContent>
              </Card>

              {/* Card 1: Escopo */}
              <Card>
                <CardContent className="pt-5 space-y-4">
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ativos</Label>
                    <Popover open={assetPopoverOpen} onOpenChange={setAssetPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full mt-1 justify-between font-normal text-left h-auto min-h-[40px]">
                          <div className="flex items-center gap-2 text-sm">
                            <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground">{assetScopeLabel}</span>
                          </div>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-0" align="start">
                        <div className="max-h-60 overflow-y-auto p-2 space-y-1">
                          <label className="flex items-center gap-2 text-sm p-1.5 rounded hover:bg-accent cursor-pointer font-medium">
                            <Checkbox checked={allAssetsSelected} onCheckedChange={() => { if (allAssetsSelected) { setAllAssetsSelected(false); setSelectedAssetIds([firstBuildingId]); } else { selectAllAssets(); } }} />
                            Todos os ativos
                          </label>
                          <Separator className="my-1" />
                          {buildings.map(b => (
                            <label key={b.id} className="flex items-center gap-2 text-sm p-1.5 rounded hover:bg-accent cursor-pointer">
                              <Checkbox checked={allAssetsSelected || selectedAssetIds.includes(b.id)} onCheckedChange={() => toggleAsset(b.id)} />
                              {b.name}
                            </label>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>



                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Locatários</Label>
                    <Popover open={tenantPopoverOpen} onOpenChange={setTenantPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full mt-1 justify-between font-normal text-left h-auto min-h-[40px]">
                          <div className="flex items-center gap-2 text-sm">
                            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground">
                              {allTenantsSelected ? `Todos (${allTenantNames.length})` : selectedTenants.length > 0 ? `${selectedTenants.length} selecionados` : 'Buscar locatário...'}
                            </span>
                          </div>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-0" align="start">
                        <div className="p-3 border-b">
                          <Input
                            placeholder="Filtrar locatários..."
                            value={tenantSearch}
                            onChange={e => setTenantSearch(e.target.value)}
                            className="h-8"
                          />
                        </div>
                        <div className="max-h-60 overflow-y-auto p-2 space-y-1">
                          <label className="flex items-center gap-2 text-sm p-1.5 rounded hover:bg-accent cursor-pointer font-medium">
                            <Checkbox
                              checked={allTenantsSelected}
                              onCheckedChange={() => allTenantsSelected ? clearTenants() : selectAllTenants()}
                            />
                            Todos os locatários
                          </label>
                          <Separator className="my-1" />
                          {filteredTenantList.map(name => (
                            <label key={name} className="flex items-center gap-2 text-sm p-1.5 rounded hover:bg-accent cursor-pointer">
                              <Checkbox
                                checked={allTenantsSelected || selectedTenants.includes(name)}
                                onCheckedChange={() => toggleTenant(name)}
                              />
                              {name}
                            </label>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                    {/* Chips */}
                    {effectiveSelectedTenants.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {effectiveSelectedTenants.map(name => (
                          <span key={name} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                            {name}
                            <button onClick={() => removeTenantChip(name)} className="hover:text-red-500">
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                        <div className="flex gap-2 text-xs mt-1">
                          <button onClick={selectAllTenants} className="text-primary hover:underline">+ Adicionar todos</button>
                          <button onClick={clearTenants} className="text-muted-foreground hover:underline">Limpar</button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Período</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Select value={startPeriod} onValueChange={setStartPeriod}>
                        <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {periodOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      <Select value={endPeriod} onValueChange={setEndPeriod}>
                        <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {periodOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: Seções */}
              <Card>
                <CardContent className="pt-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Seções a incluir</Label>
                    <div className="flex gap-2 text-xs">
                      <button onClick={selectAllSections} className="text-primary hover:underline font-medium">Selecionar tudo</button>
                      <span className="text-muted-foreground">|</span>
                      <button onClick={clearAllSections} className="text-muted-foreground hover:underline">Limpar</button>
                    </div>
                  </div>

                  {sectionGroups.map(group => (
                    <div key={group.id} className="border rounded-lg p-3">
                      <label className="flex items-center gap-2 text-sm font-semibold mb-2 cursor-pointer">
                        <Checkbox
                          checked={isGroupChecked(group.id)}
                          // @ts-ignore
                          indeterminate={isGroupIndeterminate(group.id)}
                          onCheckedChange={(v) => toggleGroupSections(group.id, !!v)}
                        />
                        {group.title}
                      </label>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 ml-6">
                        {group.sections.map(s => (
                          <label key={s.key} className="flex items-center gap-2 text-sm cursor-pointer">
                            <Checkbox
                              checked={checkedSections[s.key]}
                              onCheckedChange={(v) => setCheckedSections(prev => ({ ...prev, [s.key]: !!v }))}
                            />
                            {s.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Card 3: Formato */}
              <Card>
                <CardContent className="pt-5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Formato</Label>
                  <ToggleGroup type="single" value={format} onValueChange={(v) => v && setFormat(v as 'pdf' | 'excel')} className="w-full">
                    <ToggleGroupItem value="pdf" className="flex-1 data-[state=on]:bg-[#1E3A5F] data-[state=on]:text-white border">
                      📄 PDF — Completo
                    </ToggleGroupItem>
                    <ToggleGroupItem value="excel" className="flex-1 data-[state=on]:bg-[#1E3A5F] data-[state=on]:text-white border">
                      📊 Excel — Planilha
                    </ToggleGroupItem>
                  </ToggleGroup>
                </CardContent>
              </Card>
            </div>

            {/* Right Column (40%) - Sticky */}
            <div className="xl:col-span-2">
              <div className="xl:sticky xl:top-4 space-y-4">
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="pt-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-foreground">Resumo do Relatório</h3>
                    </div>
                    <Separator />
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Ativo / Escopo</p>
                        <p className="text-foreground">{assetScopeLabel}</p>
                        <p className="text-xs text-muted-foreground">
                          {contractsInScope} contrato{contractsInScope !== 1 ? 's' : ''} · {selectedTenantCount} locatário{selectedTenantCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Período</p>
                        <p className="text-foreground">{monthNamesShort[startM]}/{startY} → {monthNamesShort[endM]}/{endY} ({monthCount} {monthCount === 1 ? 'mês' : 'meses'})</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Seções</p>
                        <p className="text-foreground">{selectedSectionCount} de {totalSectionCount} selecionadas</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Formato</p>
                        <p className="text-foreground">{format === 'pdf' ? 'PDF' : 'Excel (.xlsx)'}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Data-base</p>
                        <p className="text-foreground">Dados atualizados em {new Date().toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Status dos dados</p>
                        {criticalCount > 0 ? (
                          <p className="text-amber-700 flex items-center gap-1.5">
                            <AlertTriangle className="h-3.5 w-3.5" /> Existem dados pendentes ({criticalCount})
                          </p>
                        ) : (
                          <p className="text-emerald-700 flex items-center gap-1.5">
                            <Check className="h-3.5 w-3.5" /> Dados disponíveis
                          </p>
                        )}
                      </div>
                    </div>

                    {basket.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5" /> Seções do KPI ({basket.length})
                          </p>
                          <div className="space-y-2">
                            {basket.map(item => (
                              <div key={item.id} className="rounded-md border bg-background p-2">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="text-xs font-medium text-foreground">{item.label}</p>
                                    <p className="text-[11px] text-muted-foreground">{item.escopo}</p>
                                  </div>
                                  <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Remover do relatório"
                                    onClick={() => removeFromBasket(item.id)}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                                <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{item.resumo}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    <Separator />
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Seções incluídas</p>
                      <div className="space-y-1">
                        {allSections.map(s => (
                          <div key={s.key} className="flex items-center gap-2 text-sm">
                            {checkedSections[s.key]
                              ? <Check className="h-3.5 w-3.5 text-green-600" />
                              : <span className="text-muted-foreground">─</span>
                            }
                            <span className={checkedSections[s.key] ? 'text-foreground' : 'text-muted-foreground line-through'}>{s.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <Button onClick={handleGenerate} disabled={!canGenerate || generating} className="w-full" size="lg">
                        {generating ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Gerando relatório...</>
                        ) : (
                          <><FileText className="h-4 w-4 mr-2" /> Gerar Relatório</>
                        )}
                      </Button>
                      <Button variant="outline" onClick={() => setPreviewOpen(true)} disabled={!canGenerate} className="w-full">
                        <Eye className="h-4 w-4 mr-2" /> Preview
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── PENDÊNCIAS ── */}
        <TabsContent value="pendencias" className="space-y-4 mt-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
              <p className="text-xs text-muted-foreground">🔴 Itens Críticos</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{attentionCount}</p>
              <p className="text-xs text-muted-foreground">🟡 Itens Atenção</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold text-foreground">R$ {inadimValues.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-muted-foreground">💰 Total Inadimplente</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold text-foreground">{nextExpiry ? `${nextExpiry.daysLeft} dias` : '—'}</p>
              <p className="text-xs text-muted-foreground truncate">📅 {nextExpiry ? nextExpiry.tenant : 'Próx. Vencimento'}</p>
            </CardContent></Card>
          </div>

          <Card>
            <CardContent className="pt-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs">Ativo em foco</Label>
                  <Select value={pendBuildingId} onValueChange={setPendBuildingId}>
                    <SelectTrigger className="w-56 mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {buildings.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={generatePendenciesPDF}>
                    <FileText className="h-3.5 w-3.5 mr-1.5" /> PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={openEmailModal}>
                    <Mail className="h-3.5 w-3.5 mr-1.5" /> E-mail
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Locatário</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Prazo</TableHead>
                      <TableHead>Severidade</TableHead>
                      <TableHead>Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendencies.map((p, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium whitespace-nowrap">{p.tenant}</TableCell>
                        <TableCell className="whitespace-nowrap">{p.type}</TableCell>
                        <TableCell className="text-sm max-w-[300px]">{p.description}</TableCell>
                        <TableCell className={`whitespace-nowrap ${p.daysLeft < 0 ? 'text-red-600 font-semibold' : ''}`}>
                          {getDaysDisplay(p.daysLeft)}
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            p.severity === 'red' ? 'bg-red-100 text-red-700 border border-red-200'
                              : p.severity === 'yellow' ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                : 'bg-blue-100 text-blue-700 border border-blue-200'
                          }>
                            {p.severity === 'red' ? '🔴 Crítico' : p.severity === 'yellow' ? '🟡 Atenção' : '🔵 Info'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {p.typeKey === 'inadimplencia' && (
                            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => toast.info('Função de cobrança disponível na tab Controle')}>
                              📧 Cobrar
                            </Button>
                          )}
                          {p.typeKey === 'garantia' && (
                            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => toast.info('Acesse Contratos > Garantias para renovar')}>
                              🔄 Renovar
                            </Button>
                          )}
                          {p.typeKey === 'contrato' && (
                            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => toast.info('Acesse a aba Contratos para detalhes')}>
                              📋 Ver
                            </Button>
                          )}
                          {p.typeKey === 'seguro' && (
                            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => toast.info(`Seguro: ${p.policyNumber}`)}>
                              📁 Ver
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {pendencies.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                          <div className="flex flex-col items-center gap-2">
                            <Check className="h-8 w-8 text-green-500" />
                            <p>Nenhuma pendência encontrada</p>
                            <p className="text-xs">Todos os itens estão em dia!</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── HISTÓRICO ── */}
        <TabsContent value="historico" className="space-y-4 mt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por ativo, locatário..."
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={historyTypeFilter} onValueChange={setHistoryTypeFilter}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Filtrar por tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="gestao">Gestão</SelectItem>
                <SelectItem value="pendencias">Pendências</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0">
              {filteredHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <ClipboardList className="h-10 w-10 mb-3" />
                  <p className="font-medium">Nenhum relatório encontrado</p>
                  <Button variant="link" className="mt-2" onClick={() => { setActiveTab('gestao'); }}>
                    Gerar Primeiro Relatório →
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-left">Relatório</TableHead>
                      <TableHead className="text-left">Ativo/Escopo</TableHead>
                      <TableHead className="text-left">Período</TableHead>
                      <TableHead className="text-left">Gerado em</TableHead>
                      <TableHead className="text-left">Gerado por</TableHead>
                      <TableHead className="text-left">Formato</TableHead>
                      <TableHead className="text-left">Status</TableHead>
                      <TableHead className="text-left">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistory.map(h => (
                      <TableRow key={h.id}>
                        <TableCell className="text-left">
                          <div className="flex items-center gap-2">
                            <Badge className={h.type === 'gestao' ? 'bg-[#1E3A5F] text-white' : 'bg-red-100 text-red-700'}>
                              {h.type === 'gestao' ? 'Gestão' : 'Pendências'}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild><span className="cursor-default">{formatTenantDisplay(h.tenants)}</span></TooltipTrigger>
                                  {h.tenants.length > 2 && <TooltipContent><p>{h.tenants.join(', ')}</p></TooltipContent>}
                                </Tooltip>
                              </TooltipProvider>
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-left font-medium">{h.building_name}</TableCell>
                        <TableCell className="text-left">{h.period}</TableCell>
                        <TableCell className="text-left text-sm">{new Date(h.generated_at).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="text-left text-sm">{h.generated_by}</TableCell>
                        <TableCell className="text-left text-sm">{h.format === 'excel' ? 'Excel' : 'PDF'} {h.size ? `· ${h.size}` : ''}</TableCell>
                        <TableCell className="text-left">
                          <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200">Concluído</Badge>
                        </TableCell>
                        <TableCell className="text-left">
                          <div className="flex gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Visualizar"
                                    onClick={() => { setPreviewOpen(true); }}>
                                    <Eye className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Visualizar</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Baixar"
                                    onClick={() => toast.success(`Baixando ${h.building_name} — ${h.period}...`)}>
                                    <Download className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Baixar</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Duplicar configuração"
                                    onClick={() => {
                                      setFormat(h.format === 'excel' ? 'excel' : 'pdf');
                                      setActiveTab('gestao');
                                      toast.success('Configuração duplicada — ajuste o escopo e gere novamente.');
                                    }}>
                                    <Copy className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Duplicar configuração</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Regenerar" onClick={() => setRegenerateId(h.id)}>
                                    <RotateCcw className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Regenerar</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── AGENDADOS ── */}
        <TabsContent value="agendados" className="space-y-4 mt-4">
          <Card>
            <CardContent className="pt-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-primary" /> Relatórios recorrentes
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Configurações de geração automática. A execução automática será habilitada na integração com o backend.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => toast.info('Configure o escopo em Gestão de Locatários e salve como agendamento.')}>
                  <CalendarClock className="h-3.5 w-3.5 mr-1.5" /> Novo agendamento
                </Button>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-left">Relatório</TableHead>
                      <TableHead className="text-left">Escopo</TableHead>
                      <TableHead className="text-left">Periodicidade</TableHead>
                      <TableHead className="text-left">Próxima geração</TableHead>
                      <TableHead className="text-left">Destinatários</TableHead>
                      <TableHead className="text-left">Formato</TableHead>
                      <TableHead className="text-left">Status</TableHead>
                      <TableHead className="text-left">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scheduled.map(sc => (
                      <TableRow key={sc.id}>
                        <TableCell className="text-left font-medium">{sc.modelLabel}</TableCell>
                        <TableCell className="text-left">{sc.escopo}</TableCell>
                        <TableCell className="text-left">{sc.periodicidade}</TableCell>
                        <TableCell className="text-left">{new Date(`${sc.proximaGeracao}T12:00:00`).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="text-left text-sm">{sc.destinatarios.join(' / ')}</TableCell>
                        <TableCell className="text-left text-sm">{sc.formato === 'excel' ? 'Excel' : 'PDF'}</TableCell>
                        <TableCell className="text-left">
                          <Badge variant="outline" className={sc.status === 'ativo'
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                            : 'bg-muted text-muted-foreground'}>
                            {sc.status === 'ativo' ? 'Ativo' : 'Pausado'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-left">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Editar agendamento"
                              onClick={() => { applyModel(sc.model); setActiveTab('gestao'); toast.info('Modelo carregado — ajuste o escopo do agendamento.'); }}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8"
                              aria-label={sc.status === 'ativo' ? 'Pausar agendamento' : 'Ativar agendamento'}
                              onClick={() => {
                                setScheduled(prev => prev.map(x => x.id === sc.id
                                  ? { ...x, status: x.status === 'ativo' ? 'pausado' : 'ativo' } : x));
                                toast.success(sc.status === 'ativo' ? 'Agendamento pausado.' : 'Agendamento ativado.');
                              }}>
                              {sc.status === 'ativo' ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Executar agora"
                              onClick={() => {
                                setHistory(prev => [{
                                  id: `rh-${Date.now()}`, type: 'gestao', building_name: sc.escopo,
                                  tenants: ['Todos'],
                                  period: new Date().toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
                                  generated_at: new Date().toISOString(), generated_by: user.full_name,
                                  format: sc.formato, size: sc.formato === 'pdf' ? '1.2 MB' : '540 KB',
                                }, ...prev]);
                                toast.success('Execução registrada no histórico.');
                                setActiveTab('historico');
                              }}>
                              <Play className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Prévia do Relatório — {buildingName} — {periodLabelShort}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Cover */}
            <div className="text-center border-b pb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold">Relatório de Gestão — {buildingName}</h2>
              <p className="text-muted-foreground">Período: {periodLabel}</p>
              <p className="text-sm text-muted-foreground mt-1">{selectedTenantCount} locatários | {selectedSectionCount} seções</p>
              <p className="text-xs text-muted-foreground mt-2">Patria Real Estate — Safra Gestão</p>
            </div>

            {/* First tenant preview */}
            {tenantContracts.filter(tc => effectiveSelectedTenants.includes(tc.tenant_name!)).slice(0, 1).map(tc => (
              <div key={tc.id} className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">{tc.tenant_name}</h3>

                {checkedSections.cadastral && (
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">Dados Cadastrais</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-muted-foreground">CNPJ:</span> {tc.tenant_cnpj || '—'}</div>
                      <div><span className="text-muted-foreground">Unidade:</span> {tc.unit_id}</div>
                      <div><span className="text-muted-foreground">Área:</span> {tc.area_m2} m²</div>
                    </div>
                  </div>
                )}

                {checkedSections.contract && (
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">Resumo do Contrato</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-muted-foreground">Vigência:</span> {tc.contract_start} → {tc.contract_end}</div>
                      <div><span className="text-muted-foreground">Valor:</span> R$ {Math.round(tc.area_m2 * (tc.price_per_m2 || 0)).toLocaleString('pt-BR')}/mês</div>
                    </div>
                  </div>
                )}

                {checkedSections.guarantee && (() => {
                  const g = mockGuarantees.find(g => g.contract_id === tc.id);
                  return g ? (
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-2">Garantias</h4>
                      <p className="text-sm">{guaranteeTypeLabels[g.type]} — R$ {g.value.toLocaleString('pt-BR')} {g.valid_until ? `— Até ${new Date(g.valid_until).toLocaleDateString('pt-BR')}` : ''}</p>
                    </div>
                  ) : null;
                })()}

                {checkedSections.payments && (() => {
                  const payments = mockMonthlyPayments.filter(p => p.tenant_name === tc.tenant_name && effectiveAssetIds.includes(p.building_id)).slice(0, 3);
                  return payments.length > 0 ? (
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-2">Histórico de Pagamentos (últimos 3)</h4>
                      <Table>
                        <TableHeader>
                          <TableRow><TableHead>Competência</TableHead><TableHead>Valor</TableHead><TableHead>Status</TableHead></TableRow>
                        </TableHeader>
                        <TableBody>
                          {payments.map(p => (
                            <TableRow key={p.id}>
                              <TableCell>{p.competence}</TableCell>
                              <TableCell>R$ {p.billable_value.toLocaleString('pt-BR')}</TableCell>
                              <TableCell>
                                <Badge variant={p.status === 'paid' ? 'default' : 'destructive'}>
                                  {p.status === 'paid' ? 'Pago' : p.status === 'overdue' ? 'Atraso' : 'Pendente'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : null;
                })()}

                <p className="text-xs text-muted-foreground italic">... prévia do primeiro locatário. O relatório completo inclui todos os {selectedTenantCount} selecionados.</p>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>Fechar</Button>
            <Button onClick={() => { setPreviewOpen(false); handleGenerate(); }}>
              <FileText className="h-4 w-4 mr-2" /> Gerar Relatório Completo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Modal */}
      <Dialog open={emailModal} onOpenChange={setEmailModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Disparar Relatório de Pendências por E-mail</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Para</Label><Input value={emailTo} onChange={e => setEmailTo(e.target.value)} /></div>
            <div><Label>Assunto</Label><Input value={emailSubject} onChange={e => setEmailSubject(e.target.value)} /></div>
            <div><Label>Mensagem</Label><Textarea rows={5} value={emailBody} onChange={e => setEmailBody(e.target.value)} /></div>
            {pendencies.filter(p => p.severity === 'red').length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-red-700 mb-1">Pendências Críticas ({Math.min(pendencies.filter(p => p.severity === 'red').length, 5)})</p>
                {pendencies.filter(p => p.severity === 'red').slice(0, 5).map((p, i) => (
                  <p key={i} className="text-xs text-red-600">• {p.tenant} — {p.type}</p>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailModal(false)}>Cancelar</Button>
            <Button onClick={sendEmail}><Mail className="h-4 w-4 mr-2" /> Enviar por E-mail</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Regenerate Dialog */}
      <Dialog open={!!regenerateId} onOpenChange={() => setRegenerateId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Regenerar Relatório</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Regenerar este relatório com dados atuais?</p>
          <p className="text-xs text-muted-foreground">Isso irá criar uma nova versão do relatório com as informações mais recentes.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegenerateId(null)}>Cancelar</Button>
            <Button onClick={() => regenerateId && handleRegenerate(regenerateId)}>
              <RotateCcw className="h-4 w-4 mr-2" /> Regenerar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
