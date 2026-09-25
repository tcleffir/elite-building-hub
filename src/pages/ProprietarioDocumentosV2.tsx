import { useState, useMemo, useRef, useEffect } from "react";
import { FileText, Upload, Download, Trash2, Plus, BarChart3, FolderOpen, CheckCircle2, Clock, AlertCircle, Search, ChevronRight, FolderClosed, Edit, MoreVertical, LayoutGrid, LayoutList, RefreshCw, X, ArrowUp, ArrowDown, Bot, Loader2, Pencil, FolderPlus, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getHGRE11PortfolioBuildings, mockTenantContracts, upsertTenantContract, type TenantContract, mockBuildingDocuments, mockEnergyData, mockReportFolders, ReportFolder, ReportFile } from "@/lib/mock-data";
import { getDocumentHealth, daysUntil, healthColors, healthLabels, HealthStatus, getOccupancyStatus } from "@/lib/health-utils";
import { toast } from "sonner";
import { generateReport, ReportConfig, ReportSection, PDF_COLORS } from "@/lib/pdf-report-service";
import { exportExcel } from "@/lib/export-service";
import { supabase } from "@/integrations/supabase/client";
import AiDocumentReview from "@/components/documents/AiDocumentReview";
import { AiDocumentAnalysis, taxonomyAsText, assetsAsText, mockAnalysisFor, resolveDestination } from "@/lib/document-ai";


const docTypeOptions = [
  'Segurança e Compliance', 'Técnico / Engenharia', 'Gestão Predial',
  'ESG & Sustentabilidade', 'Financeiro', 'Fornecedores',
];

type FileWithMeta = ReportFile & { categoryName: string; subfolderName: string };

function getDocStatus(file: ReportFile): { label: string; statusKey: string; color: string; icon: typeof CheckCircle2; needsAttention: boolean; daysLeft: number | null } {
  if (!file.expires_at) return { label: "Sem prazo", statusKey: 'none', color: "bg-gray-100 text-gray-500", icon: CheckCircle2, needsAttention: false, daysLeft: null };
  const now = new Date();
  const exp = new Date(file.expires_at);
  const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: "Vencido", statusKey: 'expired', color: "bg-red-100 text-red-700 border border-red-200", icon: AlertCircle, needsAttention: true, daysLeft: diffDays };
  if (diffDays <= 60) return { label: `Vence em ${diffDays}d`, statusKey: 'expiring', color: "bg-amber-100 text-amber-700 border border-amber-200", icon: Clock, needsAttention: true, daysLeft: diffDays };
  return { label: "Atualizado", statusKey: 'ok', color: "bg-green-100 text-green-700 border border-green-200", icon: CheckCircle2, needsAttention: false, daysLeft: diffDays };
}

function getAllFilesWithMeta(folders: ReportFolder[]): FileWithMeta[] {
  const result: FileWithMeta[] = [];
  for (const folder of folders) {
    if (folder.children) {
      for (const sub of folder.children) {
        if (sub.files) {
          for (const f of sub.files) result.push({ ...f, categoryName: folder.name, subfolderName: sub.name });
        }
      }
    }
  }
  return result;
}

const monthOptions = (() => {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const opts: { label: string; value: string }[] = [];
  for (let y = 2025; y <= 2027; y++) {
    for (let m = 0; m < 12; m++) {
      opts.push({ label: `${months[m]} ${y}`, value: `${y}-${String(m + 1).padStart(2, '0')}` });
    }
  }
  return opts;
})();

const ProprietarioDocumentosV2 = () => {
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
  const [activeTab, setActiveTab] = useState('resumo');
  const [showUpload, setShowUpload] = useState(false);

  // Resumo state
  const [searchSummary, setSearchSummary] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCompany, setFilterCompany] = useState('all');
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [editDoc, setEditDoc] = useState<FileWithMeta | null>(null);
  const [deleteDoc, setDeleteDoc] = useState<FileWithMeta | null>(null);

  // Biblioteca state
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["rf1", "rf2", "rf3"]));
  const [selectedFolder, setSelectedFolder] = useState<ReportFolder | null>(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [renameFile, setRenameFile] = useState<ReportFile | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Pastas criadas pelo usuário (nesta sessão)
  const [customFolders, setCustomFolders] = useState<ReportFolder[]>([]);
  const [customSubfolders, setCustomSubfolders] = useState<Record<string, ReportFolder[]>>({});
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderKind, setNewFolderKind] = useState<'folder' | 'subfolder'>('folder');
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderParent, setNewFolderParent] = useState('');

  // Report generation state
  const [reportStart, setReportStart] = useState('2026-01');
  const [reportEnd, setReportEnd] = useState('2026-04');
  const [utilityToggles, setUtilityToggles] = useState({ energy: true, water: true, gas: true, waste: true });
  const [attentionDays, setAttentionDays] = useState([120]);
  const [generalFormat, setGeneralFormat] = useState('pdf');
  const [generalGroupBy, setGeneralGroupBy] = useState('category');
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] = useState<Record<string, string>>({});

  // Upload IA state
  const [uploadTab, setUploadTab] = useState('ia');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [aiProgressLabel, setAiProgressLabel] = useState('');
  const [aiResult, setAiResult] = useState<any>(null);
  const [uploadForm, setUploadForm] = useState({ name: '', type: '', folder: '', issued: '', expires: '', company: '', notes: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch real documents from building_documents table
  const [realDocs, setRealDocs] = useState<FileWithMeta[]>([]);
  useEffect(() => {
    const fetchRealDocs = async () => {
      const { data, error } = await supabase.from("building_documents").select("*").order("created_at", { ascending: false });
      if (error) { console.error("Error fetching building_documents:", error); return; }
      if (data) {
        const mapped: FileWithMeta[] = data.map((d: any) => ({
          id: d.id,
          name: d.file_name,
          type: (d.file_type || "pdf") as any,
          size: d.file_size || "—",
          uploaded_by: d.uploaded_by || "IA Assistant",
          uploaded_at: d.created_at?.split("T")[0] || "",
          responsible_company: d.responsible_company || undefined,
          issued_at: d.issued_at || undefined,
          expires_at: d.expires_at || undefined,
          categoryName: d.category,
          subfolderName: d.subcategory || d.category,
        }));
        setRealDocs(mapped);
      }
    };
    fetchRealDocs();
  }, []);

  const userBuildings = getHGRE11PortfolioBuildings();
  const building = userBuildings.find(b => b.id === selectedBuildingId);

  const docs = useMemo(() => {
    if (!selectedBuildingId) return [];
    return [...mockBuildingDocuments.filter(d => d.building_id === selectedBuildingId)].sort((a, b) => {
      const ha = getDocumentHealth(a.valid_until);
      const hb = getDocumentHealth(b.valid_until);
      const order: Record<HealthStatus, number> = { critical: 0, warning: 1, healthy: 2 };
      return order[ha] - order[hb];
    });
  }, [selectedBuildingId]);

  // Docs archived in this session by the AI reader (preview of the destination folder)
  const [sessionDocs, setSessionDocs] = useState<{ subfolderId: string; file: FileWithMeta }[]>([]);

  const libraryFolders = useMemo<ReportFolder[]>(() => {
    const base = [...mockReportFolders, ...customFolders];
    return base.map(cat => ({
      ...cat,
      children: [...(cat.children || []), ...(customSubfolders[cat.id] || [])].map(sub => {
        const extras = sessionDocs.filter(d => d.subfolderId === sub.id).map(d => d.file as ReportFile);
        return extras.length ? { ...sub, files: [...extras, ...(sub.files || [])] } : sub;
      }),
    }));
  }, [sessionDocs, customFolders, customSubfolders]);

  const createFolder = () => {
    const name = newFolderName.trim();
    if (!name) { toast.error('Informe o nome da pasta.'); return; }
    if (newFolderKind === 'folder') {
      const id = `cf-${Date.now()}`;
      setCustomFolders(prev => [...prev, { id, name, icon: '📁', children: [] }]);
      setExpandedFolders(prev => new Set(prev).add(id));
      toast.success(`Pasta "${name}" criada`);
    } else {
      if (!newFolderParent) { toast.error('Selecione a pasta principal.'); return; }
      const id = `csf-${Date.now()}`;
      setCustomSubfolders(prev => ({ ...prev, [newFolderParent]: [...(prev[newFolderParent] || []), { id, name, icon: '📂', files: [] }] }));
      setExpandedFolders(prev => new Set(prev).add(newFolderParent));
      setSelectedFolder({ id, name, icon: '📂', files: [] });
      toast.success(`Subpasta "${name}" criada`);
    }
    setNewFolderName('');
    setShowNewFolder(false);
  };

  const activeFolder = useMemo<ReportFolder | null>(() => {
    if (!selectedFolder) return null;
    for (const cat of libraryFolders) {
      if (cat.id === selectedFolder.id) return cat;
      for (const sub of cat.children || []) if (sub.id === selectedFolder.id) return sub;
    }
    return selectedFolder;
  }, [selectedFolder, libraryFolders]);

  const allFiles = useMemo(
    () => [...getAllFilesWithMeta(libraryFolders), ...realDocs],
    [libraryFolders, realDocs],
  );


  const companies = useMemo(() => {
    const set = new Set(allFiles.map(f => f.responsible_company).filter(Boolean));
    return Array.from(set) as string[];
  }, [allFiles]);

  const categories = useMemo(() => {
    const set = new Set(allFiles.map(f => f.categoryName));
    return Array.from(set);
  }, [allFiles]);

  const filteredSummaryFiles = useMemo(() => {
    let list = allFiles;
    if (searchSummary) {
      const q = searchSummary.toLowerCase();
      list = list.filter(f => f.name.toLowerCase().includes(q) || f.categoryName.toLowerCase().includes(q));
    }
    if (filterCategory !== 'all') list = list.filter(f => f.categoryName === filterCategory);
    if (filterCompany !== 'all') list = list.filter(f => f.responsible_company === filterCompany);
    if (filterStatus !== 'all') {
      list = list.filter(f => {
        const s = getDocStatus(f);
        if (filterStatus === 'expired') return s.statusKey === 'expired';
        if (filterStatus === 'expiring') return s.statusKey === 'expiring';
        if (filterStatus === 'ok') return s.statusKey === 'ok';
        return true;
      });
    }
    return list;
  }, [allFiles, searchSummary, filterCategory, filterStatus, filterCompany]);

  const sortedFiles = useMemo(() => {
    if (!sortField) return filteredSummaryFiles;
    return [...filteredSummaryFiles].sort((a, b) => {
      let valA: string, valB: string;
      if (sortField === 'name') { valA = a.name; valB = b.name; }
      else if (sortField === 'category') { valA = a.categoryName; valB = b.categoryName; }
      else if (sortField === 'status') {
        const order: Record<string, number> = { expired: 0, expiring: 1, ok: 2, none: 3 };
        valA = String(order[getDocStatus(a).statusKey] ?? 9);
        valB = String(order[getDocStatus(b).statusKey] ?? 9);
      }
      else if (sortField === 'company') { valA = a.responsible_company || ''; valB = b.responsible_company || ''; }
      else if (sortField === 'issued') { valA = a.uploaded_at || ''; valB = b.uploaded_at || ''; }
      else if (sortField === 'expires') { valA = a.expires_at || ''; valB = b.expires_at || ''; }
      else { valA = ''; valB = ''; }
      const cmp = String(valA).localeCompare(String(valB), 'pt-BR');
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filteredSummaryFiles, sortField, sortDir]);

  const expiredCount = allFiles.filter(f => getDocStatus(f).statusKey === 'expired').length;
  const expiringCount = allFiles.filter(f => getDocStatus(f).statusKey === 'expiring').length;
  const okCount = allFiles.filter(f => getDocStatus(f).statusKey === 'ok' || getDocStatus(f).statusKey === 'none').length;

  const hasActiveFilters = filterCategory !== 'all' || filterStatus !== 'all' || filterCompany !== 'all' || searchSummary !== '';

  const handleSort = (field: string) => {
    if (sortField === field) {
      if (sortDir === 'asc') setSortDir('desc');
      else { setSortField(null); setSortDir('asc'); }
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const clearFilters = () => {
    setSearchSummary(''); setFilterCategory('all'); setFilterStatus('all'); setFilterCompany('all');
  };

  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const SortHeader = ({ field, label }: { field: string; label: string }) => (
    <th
      className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase cursor-pointer hover:text-foreground select-none"
      onClick={() => handleSort(field)}
    >
      <span className="flex items-center gap-1">
        {label}
        {sortField === field && (sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
      </span>
    </th>
  );

  const handleAiUpload = async () => {
    if (!uploadFile) return;
    setAiAnalyzing(true);
    setAiProgress(0);
    setAiProgressLabel('Lendo documento...');

    const steps = [
      { label: 'Lendo documento...', pct: 15 },
      { label: 'Classificando tipo de documento...', pct: 35 },
      { label: 'Extraindo valores, índices e datas de reajuste...', pct: 60 },
      { label: 'Identificando pasta de destino...', pct: 80 },
    ];

    for (const step of steps) {
      await new Promise(r => setTimeout(r, 500));
      setAiProgress(step.pct);
      setAiProgressLabel(step.label);
    }

    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(uploadFile);
      });

      const { data, error } = await supabase.functions.invoke('analyze-document-ai', {
        body: {
          fileBase64: base64,
          fileName: uploadFile.name,
          taxonomy: taxonomyAsText(),
          assets: assetsAsText(),
        },
      });

      if (error || !data?.success) {
        setAiResult(mockAnalysisFor(uploadFile.name));
        toast.info('Exibindo leitura de demonstração (IA indisponível).');
      } else {
        setAiResult(data.data as AiDocumentAnalysis);
      }
    } catch {
      setAiResult(mockAnalysisFor(uploadFile.name));
      toast.info('Exibindo leitura de demonstração (IA indisponível).');
    }

    setAiProgress(100);
    setAiProgressLabel('Leitura concluída');
    setAiAnalyzing(false);
  };


  const isLeaseDoc = (a: AiDocumentAnalysis | null) => !!a && ['contrato_locacao', 'aditivo'].includes(a.docTypeKey || '');
  const [linkBuildingId, setLinkBuildingId] = useState('');
  const [linkUnitId, setLinkUnitId] = useState('');
  const linkBuilding = linkBuildingId || selectedBuildingId || 'b12';
  const vacantUnits = useMemo(
    () => mockTenantContracts.filter(c => c.building_id === linkBuilding && (c.status === 'vacant' || !c.tenant_name)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [linkBuilding, aiResult],
  );
  useEffect(() => {
    if (!aiResult) return;
    const a = aiResult as AiDocumentAnalysis;
    const text = JSON.stringify(a).toLowerCase();
    const floorMatch = text.match(/(\d{1,2})\s*[ºo°]?\s*andar/);
    const byFloor = floorMatch ? vacantUnits.find(u => String(u.floor ?? '') === floorMatch[1] || u.unit_id.replace(/\D/g, '').startsWith(floorMatch[1])) : undefined;
    setLinkUnitId(prev => (vacantUnits.some(u => u.id === prev) ? prev : (byFloor ?? vacantUnits[0])?.id ?? ''));
  }, [aiResult, vacantUnits]);

  const allocateLease = (a: AiDocumentAnalysis): string | null => {
    const unit = mockTenantContracts.find(c => c.id === linkUnitId);
    if (!unit) return null;
    const tenant = (a.contraparte || a.empresa || '').trim();
    if (!tenant) return null;
    const idx = (a.reajuste?.indice || 'IPCA').toUpperCase();
    const g = (a.garantia?.tipo || (JSON.stringify(a).toLowerCase().includes('fiador') ? 'fiador' : '')).toLowerCase();
    const garantia: TenantContract['garantia'] = g.includes('seguro') ? 'Seguro fiança' : g.includes('cau') ? 'Depósito caução' : g.includes('fiad') ? 'Fiador' : 'Fiança bancária';
    const area = a.financeiro?.areaM2 || unit.area_m2;
    const m2 = a.financeiro?.valorPorM2 || (a.financeiro?.valorAluguel && area ? Math.round((a.financeiro.valorAluguel / area) * 100) / 100 : null);
    upsertTenantContract({
      ...unit,
      tenant_name: tenant,
      area_m2: area,
      price_per_m2: m2 ?? unit.price_per_m2 ?? null,
      contract_start: a.prazos?.dataInicio || unit.contract_start,
      contract_end: a.prazos?.dataFim || unit.contract_end,
      status: 'active',
      indice_reajuste: (idx.includes('IGP') ? 'IGP-M' : 'IPCA') as TenantContract['indice_reajuste'],
      periodicidade_reajuste: 'anual',
      data_base_reajuste: a.prazos?.dataInicio || undefined,
      garantia,
    } as TenantContract);
    return `${tenant} alocado em ${unit.unit_id}`;
  };

  const handleArchiveAiDoc = () => {
    const analysis = aiResult as AiDocumentAnalysis | null;
    if (!analysis || !uploadFile) return;
    const allocated = isLeaseDoc(analysis) ? allocateLease(analysis) : null;
    const dest = resolveDestination(analysis.destino, analysis.docTypeKey);
    if (!dest) { toast.error('Não foi possível identificar a pasta de destino.'); return; }
    const ext = (uploadFile.name.split('.').pop() || 'pdf').toLowerCase();
    const file: FileWithMeta = {
      id: `ai-${Date.now()}`,
      name: analysis.nome || uploadFile.name,
      type: (['pdf', 'xlsx', 'docx', 'png', 'jpg'].includes(ext) ? ext : 'pdf') as FileWithMeta['type'],
      size: `${(uploadFile.size / 1024).toFixed(0)} KB`,
      uploaded_by: 'IA Assistant',
      uploaded_at: new Date().toISOString().split('T')[0],
      responsible_company: analysis.empresa || undefined,
      issued_at: analysis.dataEmissao || undefined,
      expires_at: analysis.dataValidade || undefined,
      categoryName: dest.category,
      subfolderName: dest.subfolder,
    };
    setSessionDocs(prev => [{ subfolderId: dest.subfolderId, file }, ...prev]);
    setExpandedFolders(prev => new Set(prev).add(dest.categoryId));
    setSelectedFolder({ id: dest.subfolderId, name: dest.subfolder, icon: '📂' });
    setActiveTab('biblioteca');
    setShowUpload(false);
    setUploadFile(null);
    setAiResult(null);
    toast.success(`Arquivado em ${dest.category} › ${dest.subfolder}${allocated ? ` — ${allocated} (Mapa de Ativos atualizado)` : ''}`);
  };

  const reportTitles: Record<string, string> = {
    utilities: 'Relatório de Consumo',
    docs_critical: 'Documentos Críticos',
    docs_attention: 'Documentos de Atenção',
    docs_general: 'Relatório Geral de Documentação',
  };

  const monthLabel = (v: string) => monthOptions.find(o => o.value === v)?.label || v;

  const generatePDF = async (type: string) => {
    setGeneratingReport(type);
    const bName = building?.name || 'Portfólio HGRE11';
    const title = reportTitles[type] || 'Relatório';
    const period = type === 'utilities'
      ? `${monthLabel(reportStart)} — ${monthLabel(reportEnd)}`
      : new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    try {
      const docStatusRows = (files: FileWithMeta[]) => files.map(f => {
        const s = getDocStatus(f);
        return [
          f.name,
          f.categoryName,
          s.label,
          f.expires_at ? new Date(f.expires_at).toLocaleDateString('pt-BR') : '—',
          f.responsible_company || '—',
        ];
      });

      const relevantFiles = type === 'docs_critical'
        ? criticalDocs
        : type === 'docs_attention'
        ? allFiles.filter(f => { const d = getDocStatus(f).daysLeft; return d !== null && d > 30 && d <= attentionDays[0]; })
        : allFiles;

      // Exportação Excel do Relatório Geral
      if (type === 'docs_general' && generalFormat === 'excel') {
        const sorted = [...relevantFiles].sort((a, b) => {
          if (generalGroupBy === 'status') return getDocStatus(a).statusKey.localeCompare(getDocStatus(b).statusKey);
          if (generalGroupBy === 'expires') return (a.expires_at || '9999').localeCompare(b.expires_at || '9999');
          return a.categoryName.localeCompare(b.categoryName, 'pt-BR');
        });
        exportExcel({
          fileName: `Patria_${title.replace(/\s/g, '_')}_${bName.replace(/\s/g, '-')}.xlsx`,
          sheets: [{
            sheetName: 'Documentos',
            columns: [
              { header: 'Documento', get: (r: FileWithMeta) => r.name },
              { header: 'Categoria', get: (r: FileWithMeta) => r.categoryName },
              { header: 'Subpasta', get: (r: FileWithMeta) => r.subfolderName },
              { header: 'Status', get: (r: FileWithMeta) => getDocStatus(r).label },
              { header: 'Emissão', get: (r: FileWithMeta) => r.issued_at || '' },
              { header: 'Vencimento', get: (r: FileWithMeta) => r.expires_at || '' },
              { header: 'Empresa responsável', get: (r: FileWithMeta) => r.responsible_company || '' },
            ],
            rows: sorted,
          }],
        });
        toast.success('Planilha gerada com sucesso');
        setLastGenerated(prev => ({ ...prev, [type]: new Date().toLocaleString('pt-BR') }));
        setGeneratingReport(null);
        return;
      }

      const sections: ReportSection[] = [];

      if (type === 'utilities') {
        const headers: string[] = ['Mês'];
        if (utilityToggles.energy) headers.push('Energia (kWh)', 'Custo');
        if (utilityToggles.water) headers.push('Água (m³)', 'Custo');
        if (utilityToggles.gas) headers.push('Gás (m³)', 'Custo');
        if (utilityToggles.waste) headers.push('Resíduos (ton)');
        const rows = mockEnergyData.map(d => {
          const row: (string | number)[] = [d.month];
          if (utilityToggles.energy) row.push(d.kwh.toLocaleString('pt-BR'), `R$ ${(d.kwh * 0.85).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`);
          if (utilityToggles.water) row.push(d.water.toLocaleString('pt-BR'), `R$ ${(d.water * 12.5).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`);
          if (utilityToggles.gas) row.push(d.gas.toLocaleString('pt-BR'), `R$ ${(d.gas * 4.2).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`);
          if (utilityToggles.waste) row.push('2,8');
          return row;
        });
        sections.push({
          title: 'Consumo por competência',
          type: 'table',
          tableHeaders: headers,
          tableRows: rows,
          footnote: 'Valores de consumo e custo estimados a partir das medições registradas na plataforma.',
        });
      } else {
        sections.push({
          title: 'Panorama da documentação',
          type: 'kpi-cards',
          kpis: [
            { value: String(okCount), label: 'Atualizados', color: PDF_COLORS.green },
            { value: String(expiringCount), label: 'A vencer', color: PDF_COLORS.amber },
            { value: String(expiredCount), label: 'Vencidos', color: PDF_COLORS.red },
            { value: String(relevantFiles.length), label: 'Neste relatório' },
          ],
        });

        const sorted = [...relevantFiles].sort((a, b) => {
          if (type === 'docs_general' && generalGroupBy === 'status') return getDocStatus(a).statusKey.localeCompare(getDocStatus(b).statusKey);
          if (type === 'docs_general' && generalGroupBy === 'expires') return (a.expires_at || '9999').localeCompare(b.expires_at || '9999');
          return a.categoryName.localeCompare(b.categoryName, 'pt-BR');
        });

        sections.push({
          title: type === 'docs_attention' ? `Documentos com vencimento em até ${attentionDays[0]} dias` : 'Relação de documentos',
          type: 'table',
          tableHeaders: ['Documento', 'Categoria', 'Status', 'Vencimento', 'Empresa'],
          tableRows: sorted.length ? docStatusRows(sorted) : [['Nenhum documento encontrado', '—', '—', '—', '—']],
          columnWidths: [58, 38, 26, 24, 28],
          rowHealthCodes: sorted.map(f => {
            const k = getDocStatus(f).statusKey;
            return k === 'expired' ? 'critical' : k === 'expiring' ? 'warning' : 'healthy';
          }),
        });
      }

      const config: ReportConfig = {
        title,
        subtitle: bName,
        period,
        module: 'Documentos',
        gestorName: 'Patria Investimentos',
        fundName: 'HGRE11',
        tableOfContents: sections.map((s, i) => ({ page: i + 2, title: s.title })),
        previewKpis: type === 'utilities'
          ? [
              { value: `${mockEnergyData.length}`, label: 'Competências' },
              { value: `${Object.values(utilityToggles).filter(Boolean).length}`, label: 'Indicadores' },
            ]
          : [
              { value: String(relevantFiles.length), label: 'Documentos' },
              { value: String(expiredCount), label: 'Vencidos' },
              { value: String(expiringCount), label: 'A vencer' },
            ],
      };

      await generateReport(config, sections);
      toast.success(`Relatório Patria gerado: ${title}`);
      setLastGenerated(prev => ({ ...prev, [type]: new Date().toLocaleString('pt-BR') }));
    } catch (e) {
      console.error(e);
      toast.error('Não foi possível gerar o relatório.');
    } finally {
      setGeneratingReport(null);
    }
  };

  // Critical/attention doc counts for report tab
  const criticalDocs = allFiles.filter(f => getDocStatus(f).statusKey === 'expired' || (getDocStatus(f).daysLeft !== null && getDocStatus(f).daysLeft! <= 30 && getDocStatus(f).daysLeft! >= 0));
  const attentionDocsCount = allFiles.filter(f => { const d = getDocStatus(f).daysLeft; return d !== null && d > 30 && d <= attentionDays[0]; }).length;

  const FolderTree = ({ folders, depth = 0 }: { folders: ReportFolder[]; depth?: number }) => (
    <div className="space-y-0.5">
      {folders.map(folder => {
        const isExpanded = expandedFolders.has(folder.id);
        const isSelected = selectedFolder?.id === folder.id;
        const hasChildren = folder.children && folder.children.length > 0;
        const hasFiles = folder.files && folder.files.length > 0;
        const fileCount = folder.files?.length || 0;
        return (
          <div key={folder.id} className="group">
            <button
              onClick={() => {
                if (hasChildren) toggleFolder(folder.id);
                if (hasFiles || !hasChildren) { setSelectedFolder(folder); setActiveTab("biblioteca"); }
              }}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${isSelected ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-muted/50"}`}
              style={{ paddingLeft: `${depth * 16 + 8}px` }}
            >
              {hasChildren && <ChevronRight size={14} className={`transition-transform flex-shrink-0 ${isExpanded ? "rotate-90" : ""}`} />}
              {!hasChildren && <span className="w-3.5" />}
              {isExpanded || !hasChildren ? <FolderOpen size={14} className="flex-shrink-0 text-muted-foreground" /> : <FolderClosed size={14} className="flex-shrink-0 text-muted-foreground" />}
              <span className="truncate">{folder.name}</span>
              {fileCount > 0 && <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{fileCount}</span>}
              <span className="hidden group-hover:flex items-center gap-1 ml-1">
                <Plus size={12} className="text-muted-foreground hover:text-primary" onClick={e => { e.stopPropagation(); setShowUpload(true); }} />
              </span>
            </button>
            {isExpanded && hasChildren && <FolderTree folders={folder.children!} depth={depth + 1} />}
          </div>
        );
      })}
    </div>
  );

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Documentos</h1>
            <p className="text-sm text-muted-foreground">Biblioteca de documentos e relatórios</p>
          </div>
          <div className="grid w-full grid-cols-1 gap-2 min-[360px]:grid-cols-[minmax(0,1fr)_auto] sm:flex sm:w-auto sm:items-center">
            <Select value={selectedBuildingId} onValueChange={setSelectedBuildingId}>
              <SelectTrigger className="w-full sm:w-[280px]"><SelectValue placeholder="Selecione o ativo" /></SelectTrigger>
              <SelectContent>
                {userBuildings.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button className="gap-2" onClick={() => { setShowUpload(true); setUploadTab('ia'); setUploadFile(null); setAiResult(null); }}><Upload size={16} /> Upload</Button>
          </div>
        </div>

        {!selectedBuildingId ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Selecione um ativo abaixo para gerenciar a documentação — {userBuildings.length} ativos no portfólio.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {userBuildings.map(b => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBuildingId(b.id)}
                  className="text-left bg-card rounded-2xl p-4 premium-shadow border hover:border-interactive transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-foreground flex items-center gap-2">
                        <Building2 size={15} /> {b.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{b.city}/{b.state}</p>
                    </div>
                    <Badge className={`${healthColors[getOccupancyStatus(b.occupancy_pct || 0)].badge} text-[10px]`}>
                      {b.occupancy_pct}% ocup.
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    {(b.gla_m2 || b.total_area_m2 || 0).toLocaleString('pt-BR')} m² · {b.total_floors || 0} andares
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="resumo" className="gap-1.5">
                <FileText size={14} /> Resumo
                {(expiredCount + expiringCount) > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
              </TabsTrigger>
              <TabsTrigger value="biblioteca" className="gap-1.5"><FolderOpen size={14} /> Biblioteca</TabsTrigger>
              <TabsTrigger value="gerar" className="gap-1.5"><BarChart3 size={14} /> Gerar Relatórios</TabsTrigger>
            </TabsList>

            {/* ═══ RESUMO ═══ */}
            <TabsContent value="resumo" className="space-y-4 mt-4">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button onClick={() => { clearFilters(); setFilterStatus(filterStatus === 'ok' ? 'all' : 'ok'); }} className={`bg-card rounded-2xl border p-4 flex items-center gap-3 text-left transition-all hover:shadow-md ${filterStatus === 'ok' ? 'ring-2 ring-green-400' : ''}`}>
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center"><CheckCircle2 size={20} className="text-green-600" /></div>
                  <div><p className="text-2xl font-bold text-foreground">{okCount}</p><p className="text-xs text-muted-foreground">Atualizados</p></div>
                </button>
                <button onClick={() => { clearFilters(); setFilterStatus(filterStatus === 'expiring' ? 'all' : 'expiring'); }} className={`rounded-2xl border p-4 flex items-center gap-3 text-left transition-all hover:shadow-md bg-amber-50 ${filterStatus === 'expiring' ? 'ring-2 ring-amber-400' : ''}`}>
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center"><Clock size={20} className="text-amber-600" /></div>
                  <div><p className="text-2xl font-bold text-foreground">{expiringCount}</p><p className="text-xs text-muted-foreground">Prestes a vencer</p></div>
                </button>
                <button onClick={() => { clearFilters(); setFilterStatus(filterStatus === 'expired' ? 'all' : 'expired'); }} className={`rounded-2xl border p-4 flex items-center gap-3 text-left transition-all hover:shadow-md bg-red-50 ${filterStatus === 'expired' ? 'ring-2 ring-red-400' : ''}`}>
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center"><AlertCircle size={20} className="text-red-600" /></div>
                  <div><p className="text-2xl font-bold text-foreground">{expiredCount}</p><p className="text-xs text-muted-foreground">Vencidos</p></div>
                </button>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 lg:flex lg:flex-wrap lg:items-center">
                <div className="relative min-w-0 min-[360px]:col-span-2 lg:flex-1 lg:max-w-sm">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Buscar por nome..." className="pl-9" value={searchSummary} onChange={e => setSearchSummary(e.target.value)} />
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-full lg:w-[180px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas categorias</SelectItem>
                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full lg:w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos status</SelectItem>
                    <SelectItem value="ok">Atualizado</SelectItem>
                    <SelectItem value="expiring">Vencendo</SelectItem>
                    <SelectItem value="expired">Vencido</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterCompany} onValueChange={setFilterCompany}>
                  <SelectTrigger className="w-full lg:w-[180px]"><SelectValue placeholder="Empresa" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas empresas</SelectItem>
                    {companies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs gap-1"><X size={14} /> Limpar filtros</Button>
                )}
              </div>

              {/* Table */}
              <div className="bg-card rounded-xl border overflow-hidden">
                <div className="hidden md:block">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <SortHeader field="name" label="Documento" />
                        <SortHeader field="category" label="Categoria" />
                        <SortHeader field="status" label="Status" />
                        <SortHeader field="company" label="Empresa" />
                        <SortHeader field="issued" label="Emissão" />
                        <SortHeader field="expires" label="Vencimento" />
                        <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedFiles.map((file, i) => {
                        const status = getDocStatus(file);
                        const StatusIcon = status.icon;
                        const daysLeft = status.daysLeft;
                        return (
                          <tr key={file.id} className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${i % 2 === 1 ? "bg-muted/10" : ""}`}>
                            <td className="px-5 py-3"><span className="text-sm font-medium">{file.name}</span></td>
                            <td className="px-5 py-3"><span className="text-sm text-muted-foreground">{file.categoryName}</span></td>
                            <td className="px-5 py-3"><Badge className={`${status.color} text-[10px] gap-1`}><StatusIcon size={10} />{status.label}</Badge></td>
                            <td className="px-5 py-3"><span className="text-xs">{file.responsible_company || '-'}</span></td>
                            <td className="px-5 py-3"><span className="text-xs">{file.uploaded_at ? new Date(file.uploaded_at).toLocaleDateString('pt-BR') : '-'}</span></td>
                            <td className="px-5 py-3">
                              {file.expires_at ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs">{new Date(file.expires_at).toLocaleDateString('pt-BR')}</span>
                                  {daysLeft !== null && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                                      daysLeft < 0 ? 'bg-red-100 text-red-700' :
                                      daysLeft <= 30 ? 'bg-red-100 text-red-700' :
                                      daysLeft <= 60 ? 'bg-amber-100 text-amber-700' :
                                      'bg-green-100 text-green-700'
                                    }`}>
                                      {daysLeft < 0 ? 'VENCIDO' : `${daysLeft}d`}
                                    </span>
                                  )}
                                </div>
                              ) : <span className="text-xs text-muted-foreground">—</span>}
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex items-center justify-center gap-1">
                                <Tooltip><TooltipTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => toast.success("Download iniciado")}><Download size={13} /></Button>
                                </TooltipTrigger><TooltipContent>Download</TooltipContent></Tooltip>
                                <Tooltip><TooltipTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditDoc(file)}><Pencil size={13} /></Button>
                                </TooltipTrigger><TooltipContent>Editar</TooltipContent></Tooltip>
                                <Tooltip><TooltipTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => setDeleteDoc(file)}><Trash2 size={13} /></Button>
                                </TooltipTrigger><TooltipContent>Excluir</TooltipContent></Tooltip>
                                {status.statusKey === 'expired' && (
                                  <Tooltip><TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-600" onClick={() => toast.info("Abrir renovação")}><RefreshCw size={13} /></Button>
                                  </TooltipTrigger><TooltipContent>Renovar</TooltipContent></Tooltip>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {sortedFiles.length === 0 && (
                        <tr><td colSpan={7} className="text-center py-10 text-muted-foreground text-sm">Nenhum documento encontrado para os filtros selecionados</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="divide-y md:hidden">
                  {sortedFiles.map(file => {
                    const status = getDocStatus(file);
                    const StatusIcon = status.icon;
                    return (
                      <div key={file.id} className="space-y-3 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0"><p className="break-words text-sm font-semibold">{file.name}</p><p className="mt-1 text-xs text-muted-foreground">{file.categoryName}</p></div>
                          <Badge className={`${status.color} shrink-0 text-[10px] gap-1`}><StatusIcon size={10} />{status.label}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div><span className="block text-muted-foreground">Empresa</span>{file.responsible_company || '—'}</div>
                          <div><span className="block text-muted-foreground">Vencimento</span>{file.expires_at ? new Date(file.expires_at).toLocaleDateString('pt-BR') : '—'}</div>
                        </div>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" aria-label="Baixar documento" onClick={() => toast.success("Download iniciado")}><Download size={16} /></Button>
                          <Button variant="ghost" size="icon" aria-label="Editar documento" onClick={() => setEditDoc(file)}><Pencil size={16} /></Button>
                          <Button variant="ghost" size="icon" aria-label="Excluir documento" className="text-destructive" onClick={() => setDeleteDoc(file)}><Trash2 size={16} /></Button>
                        </div>
                      </div>
                    );
                  })}
                  {sortedFiles.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Nenhum documento encontrado</p>}
                </div>
              </div>
            </TabsContent>

            {/* ═══ BIBLIOTECA ═══ */}
            <TabsContent value="biblioteca" className="mt-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="w-full lg:w-64 bg-card rounded-xl border p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Pastas</p>
                  </div>
                  <div className="flex gap-1 mb-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-7 text-[11px] gap-1"
                      onClick={() => { setNewFolderKind('folder'); setNewFolderName(''); setShowNewFolder(true); }}
                    >
                      <FolderPlus size={12} /> Nova pasta
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-7 text-[11px] gap-1"
                      onClick={() => {
                        setNewFolderKind('subfolder');
                        setNewFolderName('');
                        setNewFolderParent(prev => prev || libraryFolders[0]?.id || '');
                        setShowNewFolder(true);
                      }}
                    >
                      <Plus size={12} /> Subpasta
                    </Button>
                  </div>
                  <FolderTree folders={libraryFolders} />
                </div>
                <div className="flex-1 bg-card rounded-xl border p-4">
                  {activeFolder?.files ? (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold">{activeFolder.name}</h3>
                        <div className="flex gap-1">
                          <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="sm" className="h-7 w-7 p-0" onClick={() => setViewMode('list')}><LayoutList size={14} /></Button>
                          <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="sm" className="h-7 w-7 p-0" onClick={() => setViewMode('grid')}><LayoutGrid size={14} /></Button>
                        </div>
                      </div>

                      {viewMode === 'list' ? (
                        <div className="space-y-2">
                          {activeFolder.files.filter(f => !search || f.name.toLowerCase().includes(search.toLowerCase())).map(f => {
                            const status = getDocStatus(f);
                            const StatusIcon = status.icon;
                            return (
                              <div key={f.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 border">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <span>📄</span>
                                  <span className="text-sm font-medium truncate">{f.name}</span>
                                  <Badge className={`${status.color} text-[10px] gap-1 flex-shrink-0`}><StatusIcon size={10} />{status.label}</Badge>
                                  <span className="text-[10px] text-muted-foreground ml-auto flex-shrink-0">{f.size}</span>
                                </div>
                                <div className="flex items-center gap-1 ml-2">
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => toast.success("Download")}><Download size={13} /></Button>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setRenameFile(f); setRenameValue(f.name); }}><Pencil size={13} /></Button>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-7 w-7 p-0"><MoreVertical size={13} /></Button></DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => toast.info("Selecionar pasta destino")}>📁 Mover para pasta</DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(`luxcondo://docs/${f.id}`); toast.success("Link copiado"); }}>📋 Copiar link</DropdownMenuItem>
                                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleteDoc(f as any)}>🗑️ Excluir</DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {activeFolder.files.filter(f => !search || f.name.toLowerCase().includes(search.toLowerCase())).map(f => {
                            const status = getDocStatus(f);
                            const StatusIcon = status.icon;
                            return (
                              <div key={f.id} className="border rounded-xl p-4 hover:shadow-md transition-shadow text-center">
                                <span className="text-3xl block mb-2">📄</span>
                                <p className="text-xs font-medium truncate">{f.name}</p>
                                <Badge className={`${status.color} text-[9px] gap-0.5 mt-1`}><StatusIcon size={9} />{status.label}</Badge>
                                <p className="text-[10px] text-muted-foreground mt-1">{f.size}</p>
                                <div className="flex justify-center gap-1 mt-2">
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => toast.success("Download")}><Download size={12} /></Button>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setRenameFile(f); setRenameValue(f.name); }}><Pencil size={12} /></Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-10 text-muted-foreground">
                      <FolderOpen size={40} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Selecione uma pasta na árvore ao lado</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* ═══ GERAR RELATÓRIOS ═══ */}
            <TabsContent value="gerar" className="space-y-4 mt-4">
              <div>
                <h2 className="text-base font-semibold">Gerar relatório de documentação para <span className="text-primary">{building?.name || '—'}</span></h2>
                <p className="text-xs text-muted-foreground">Selecione o tipo de relatório e configure os parâmetros</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Card 1 — Utilities */}
                <div className="rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col bg-card">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-2xl flex-shrink-0">⚡</div>
                    <div><h3 className="font-semibold text-sm">Relatório de Consumo</h3><p className="text-xs text-muted-foreground">Energia, água, gás e resíduos com tendências e metas ESG</p></div>
                  </div>
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2">
                      <Select value={reportStart} onValueChange={setReportStart}>
                        <SelectTrigger className="flex-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{monthOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                      </Select>
                      <span className="text-muted-foreground text-xs">→</span>
                      <Select value={reportEnd} onValueChange={setReportEnd}>
                        <SelectTrigger className="flex-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{monthOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[{ key: 'energy', icon: '⚡', label: 'Energia' }, { key: 'water', icon: '💧', label: 'Água' }, { key: 'gas', icon: '🔥', label: 'Gás' }, { key: 'waste', icon: '♻️', label: 'Resíduos' }].map(u => (
                        <button
                          key={u.key}
                          onClick={() => setUtilityToggles(prev => ({ ...prev, [u.key]: !prev[u.key as keyof typeof prev] }))}
                          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${utilityToggles[u.key as keyof typeof utilityToggles] ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border'}`}
                        >
                          {u.icon} {u.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {lastGenerated.utilities && <p className="text-[10px] text-gray-400 mt-2">Última geração: {lastGenerated.utilities}</p>}
                  <Button onClick={() => generatePDF('utilities')} className="gap-2 w-full mt-3" disabled={generatingReport === 'utilities'}>
                    {generatingReport === 'utilities' ? <><Loader2 size={14} className="animate-spin" /> Gerando...</> : <><BarChart3 size={14} /> Gerar PDF</>}
                  </Button>
                </div>

                {/* Card 2 — Critical */}
                <div className="rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col bg-card">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center text-2xl flex-shrink-0">🔴</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">Documentos Críticos</h3>
                        {criticalDocs.length > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold">{criticalDocs.length}</span>}
                      </div>
                      <p className="text-xs text-muted-foreground">Vencidos ou vencendo em menos de 30 dias</p>
                    </div>
                  </div>
                  <div className="flex-1">
                    {criticalDocs.length > 0 ? (
                      <div className="text-xs text-muted-foreground space-y-1 bg-red-50/50 rounded-lg p-2">
                        {criticalDocs.slice(0, 4).map(f => {
                          const s = getDocStatus(f);
                          return <p key={f.id}>• {f.name} ({s.daysLeft !== null && s.daysLeft < 0 ? 'VENCIDO' : `${s.daysLeft}d`})</p>;
                        })}
                        {criticalDocs.length > 4 && <p className="text-muted-foreground">+{criticalDocs.length - 4} mais</p>}
                      </div>
                    ) : <p className="text-xs text-muted-foreground italic">Nenhum documento crítico</p>}
                  </div>
                  {lastGenerated.docs_critical && <p className="text-[10px] text-gray-400 mt-2">Última geração: {lastGenerated.docs_critical}</p>}
                  <Button onClick={() => generatePDF('docs_critical')} className="gap-2 w-full mt-3" disabled={generatingReport === 'docs_critical'}>
                    {generatingReport === 'docs_critical' ? <><Loader2 size={14} className="animate-spin" /> Gerando...</> : <><FileText size={14} /> Gerar PDF</>}
                  </Button>
                </div>

                {/* Card 3 — Attention */}
                <div className="rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col bg-card">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center text-2xl flex-shrink-0">🟡</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">Documentos de Atenção</h3>
                        {attentionDocsCount > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">{attentionDocsCount}</span>}
                      </div>
                      <p className="text-xs text-muted-foreground">Vencimento entre 30 e {attentionDays[0]} dias</p>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-xs text-muted-foreground">Mostrar documentos vencendo em até <span className="font-semibold text-foreground">{attentionDays[0]}</span> dias</p>
                    <Slider value={attentionDays} onValueChange={setAttentionDays} min={30} max={365} step={10} className="w-full" />
                    <div className="flex justify-between text-[10px] text-muted-foreground"><span>30 dias</span><span>365 dias</span></div>
                  </div>
                  {lastGenerated.docs_attention && <p className="text-[10px] text-gray-400 mt-2">Última geração: {lastGenerated.docs_attention}</p>}
                  <Button onClick={() => generatePDF('docs_attention')} className="gap-2 w-full mt-3" disabled={generatingReport === 'docs_attention'}>
                    {generatingReport === 'docs_attention' ? <><Loader2 size={14} className="animate-spin" /> Gerando...</> : <><FileText size={14} /> Gerar PDF</>}
                  </Button>
                </div>

                {/* Card 4 — General */}
                <div className="rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col bg-card">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-2xl flex-shrink-0">📋</div>
                    <div><h3 className="font-semibold text-sm">Relatório Geral</h3><p className="text-xs text-muted-foreground">Visão completa de todos os documentos com status, validade e categorias</p></div>
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <Label className="text-xs mb-1 block">Formato</Label>
                      <ToggleGroup type="single" value={generalFormat} onValueChange={v => v && setGeneralFormat(v)} className="justify-start">
                        <ToggleGroupItem value="pdf" className="text-xs gap-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">📄 PDF</ToggleGroupItem>
                        <ToggleGroupItem value="excel" className="text-xs gap-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">📊 Excel</ToggleGroupItem>
                      </ToggleGroup>
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">Agrupar por</Label>
                      <RadioGroup value={generalGroupBy} onValueChange={setGeneralGroupBy} className="flex gap-4">
                        <div className="flex items-center gap-1.5"><RadioGroupItem value="category" id="gc" /><label htmlFor="gc" className="text-xs">Categoria</label></div>
                        <div className="flex items-center gap-1.5"><RadioGroupItem value="status" id="gs" /><label htmlFor="gs" className="text-xs">Status</label></div>
                        <div className="flex items-center gap-1.5"><RadioGroupItem value="expires" id="ge" /><label htmlFor="ge" className="text-xs">Vencimento</label></div>
                      </RadioGroup>
                    </div>
                  </div>
                  {lastGenerated.docs_general && <p className="text-[10px] text-gray-400 mt-2">Última geração: {lastGenerated.docs_general}</p>}
                  <Button onClick={() => generatePDF('docs_general')} className="gap-2 w-full mt-3" disabled={generatingReport === 'docs_general'}>
                    {generatingReport === 'docs_general' ? <><Loader2 size={14} className="animate-spin" /> Gerando...</> : <><FileText size={14} /> Gerar Relatório</>}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* ═══ UPLOAD DIALOG ═══ */}
        <Dialog open={showUpload} onOpenChange={v => { setShowUpload(v); if (!v) { setUploadFile(null); setAiResult(null); setAiAnalyzing(false); } }}>
          <DialogContent className="sm:max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Upload de Documento</DialogTitle>
              <DialogDescription>A IA lê o documento, identifica o tipo, extrai os dados relevantes e sugere a pasta de arquivamento</DialogDescription>
            </DialogHeader>
            <Tabs value={uploadTab} onValueChange={setUploadTab}>
              <TabsList className="w-full">
                <TabsTrigger value="ia" className="flex-1 gap-1"><Bot size={14} /> Upload com IA</TabsTrigger>
                <TabsTrigger value="manual" className="flex-1 gap-1"><Pencil size={14} /> Preencher manualmente</TabsTrigger>
              </TabsList>

              <TabsContent value="ia" className="space-y-4 mt-3">
                {!uploadFile ? (
                  <div
                    className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setUploadFile(f); }}
                  >
                    <Upload size={40} className="mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm font-medium">Arraste o documento aqui</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG — máx 20MB</p>
                    <Button variant="outline" size="sm" className="mt-3">Selecionar arquivo</Button>
                    <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) setUploadFile(f); }} />
                  </div>
                ) : !aiResult ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <FileText size={20} className="text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{uploadFile.name}</p>
                        <p className="text-xs text-muted-foreground">{(uploadFile.size / 1024).toFixed(0)} KB</p>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setUploadFile(null)}><X size={14} /></Button>
                    </div>
                    {aiAnalyzing && (
                      <div className="space-y-2">
                        <Progress value={aiProgress} className="h-2" />
                        <p className="text-xs text-muted-foreground">{aiProgressLabel}</p>
                      </div>
                    )}
                    {!aiAnalyzing && (
                      <Button onClick={handleAiUpload} className="w-full gap-2"><Bot size={14} /> Analisar Documento com IA</Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <AiDocumentReview
                      analysis={aiResult as AiDocumentAnalysis}
                      onChange={next => setAiResult(next)}
                      fileName={uploadFile.name}
                    />
                    {isLeaseDoc(aiResult as AiDocumentAnalysis) && (
                      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
                        <p className="text-sm font-semibold">Vincular ao Mapa de Ativos</p>
                        <p className="text-xs text-muted-foreground">O locatário <strong>{(aiResult as AiDocumentAnalysis).contraparte || (aiResult as AiDocumentAnalysis).empresa || '—'}</strong> será alocado no conjunto escolhido e aparecerá no Stacking Plan, Contratos, IPTU e Fechamento.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div><Label className="text-xs">Ativo</Label>
                            <Select value={linkBuilding} onValueChange={v => { setLinkBuildingId(v); setLinkUnitId(''); }}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>{userBuildings.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div><Label className="text-xs">Conjunto vago</Label>
                            <Select value={linkUnitId || 'none'} onValueChange={v => setLinkUnitId(v === 'none' ? '' : v)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Não vincular</SelectItem>
                                {vacantUnits.map(u => <SelectItem key={u.id} value={u.id}>{u.unit_id} · {u.area_m2.toLocaleString('pt-BR')} m²</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        {vacantUnits.length === 0 && <p className="text-xs text-muted-foreground">Nenhum conjunto vago neste ativo.</p>}
                      </div>
                    )}
                    <div className="flex gap-2 sticky bottom-0 bg-background pt-2">
                      <Button variant="outline" className="flex-1" onClick={() => { setUploadFile(null); setAiResult(null); }}>Descartar leitura</Button>
                      <Button className="flex-1" onClick={handleArchiveAiDoc}>Arquivar na pasta sugerida</Button>
                    </div>
                  </div>
                )}

              </TabsContent>

              <TabsContent value="manual" className="space-y-4 mt-3">
                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <Upload size={28} className="mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{uploadFile ? uploadFile.name : 'Selecionar arquivo'}</p>
                  <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.docx" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) setUploadFile(f); }} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2"><Label className="text-xs">Nome</Label><Input value={uploadForm.name} onChange={e => setUploadForm(p => ({ ...p, name: e.target.value }))} placeholder="Nome do documento" /></div>
                  <div><Label className="text-xs">Tipo</Label>
                    <Select value={uploadForm.type} onValueChange={v => setUploadForm(p => ({ ...p, type: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>{docTypeOptions.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">Empresa</Label><Input value={uploadForm.company} onChange={e => setUploadForm(p => ({ ...p, company: e.target.value }))} /></div>
                  <div><Label className="text-xs">Data de emissão</Label><Input type="date" value={uploadForm.issued} onChange={e => setUploadForm(p => ({ ...p, issued: e.target.value }))} /></div>
                  <div><Label className="text-xs">Data de validade</Label><Input type="date" value={uploadForm.expires} onChange={e => setUploadForm(p => ({ ...p, expires: e.target.value }))} /></div>
                  <div className="col-span-2"><Label className="text-xs">Observações</Label><Textarea value={uploadForm.notes} onChange={e => setUploadForm(p => ({ ...p, notes: e.target.value }))} rows={2} /></div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowUpload(false)}>Cancelar</Button>
                  <Button className="flex-1" onClick={() => { setShowUpload(false); toast.success("Documento salvo!"); }}>Salvar</Button>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={!!editDoc} onOpenChange={() => setEditDoc(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Editar Documento</DialogTitle></DialogHeader>
            {editDoc && (
              <div className="space-y-3">
                <div><Label className="text-xs">Nome</Label><Input defaultValue={editDoc.name} /></div>
                <div><Label className="text-xs">Categoria</Label>
                  <Select defaultValue={editDoc.categoryName}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{docTypeOptions.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">Empresa</Label><Input defaultValue={editDoc.responsible_company || ''} /></div>
                <div><Label className="text-xs">Data de validade</Label><Input type="date" defaultValue={editDoc.expires_at || ''} /></div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDoc(null)}>Cancelar</Button>
              <Button onClick={() => { setEditDoc(null); toast.success("Documento atualizado!"); }}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={!!deleteDoc} onOpenChange={() => setDeleteDoc(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Excluir documento</DialogTitle><DialogDescription>Excluir "{deleteDoc?.name}"? Esta ação não pode ser desfeita.</DialogDescription></DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDoc(null)}>Cancelar</Button>
              <Button variant="destructive" onClick={() => { setDeleteDoc(null); toast.success("Documento excluído"); }}>Excluir</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Nova Pasta / Subpasta */}
        <Dialog open={showNewFolder} onOpenChange={setShowNewFolder}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{newFolderKind === 'folder' ? 'Nova pasta' : 'Nova subpasta'}</DialogTitle>
              <DialogDescription>
                {newFolderKind === 'folder'
                  ? 'Cria uma pasta principal na biblioteca de documentos.'
                  : 'Cria uma subpasta dentro de uma pasta principal existente.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Tipo</Label>
                <Select value={newFolderKind} onValueChange={v => setNewFolderKind(v as 'folder' | 'subfolder')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="folder">Pasta principal</SelectItem>
                    <SelectItem value="subfolder">Subpasta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newFolderKind === 'subfolder' && (
                <div>
                  <Label className="text-xs">Pasta principal</Label>
                  <Select value={newFolderParent} onValueChange={setNewFolderParent}>
                    <SelectTrigger><SelectValue placeholder="Selecione a pasta" /></SelectTrigger>
                    <SelectContent>
                      {libraryFolders.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label className="text-xs">Nome</Label>
                <Input value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="Ex.: Jurídico e Compliance" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewFolder(false)}>Cancelar</Button>
              <Button onClick={createFolder}>Criar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Rename Dialog */}
        <Dialog open={!!renameFile} onOpenChange={() => setRenameFile(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Renomear documento</DialogTitle></DialogHeader>
            <div><Label className="text-xs">Novo nome</Label><Input value={renameValue} onChange={e => setRenameValue(e.target.value)} /></div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRenameFile(null)}>Cancelar</Button>
              <Button onClick={() => { setRenameFile(null); toast.success("Documento renomeado"); }}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default ProprietarioDocumentosV2;
