import { useState, useMemo } from "react";
import { FolderOpen, File, Upload, Search, Download, MoreHorizontal, ChevronRight, FolderClosed, AlertCircle, CheckCircle2, Clock, FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mockReportFolders, ReportFolder, ReportFile } from "@/lib/mock-data";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const fileTypeIcons: Record<string, string> = {
  pdf: "📄", xlsx: "📊", docx: "📝", png: "🖼️", jpg: "🖼️",
};

const fileTypeColors: Record<string, string> = {
  pdf: "bg-destructive/10 text-destructive",
  xlsx: "bg-success/10 text-success",
  docx: "bg-interactive/10 text-interactive",
  png: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  jpg: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

type FileWithMeta = ReportFile & { categoryName: string; subfolderName: string };

function getDocStatus(file: ReportFile): { label: string; color: string; icon: typeof CheckCircle2; needsAttention: boolean } {
  if (!file.expires_at) {
    return { label: "Atualizado", color: "bg-success/10 text-success", icon: CheckCircle2, needsAttention: false };
  }
  const now = new Date();
  const exp = new Date(file.expires_at);
  const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) {
    return { label: "Vencido", color: "bg-destructive/10 text-destructive", icon: AlertCircle, needsAttention: true };
  }
  if (diffDays <= 30) {
    return { label: `Vence em ${diffDays}d`, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: Clock, needsAttention: true };
  }
  if (diffDays <= 90) {
    return { label: `Vence em ${diffDays}d`, color: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400", icon: Clock, needsAttention: true };
  }
  return { label: "Atualizado", color: "bg-success/10 text-success", icon: CheckCircle2, needsAttention: false };
}

function getAllFilesWithMeta(folders: ReportFolder[], parentName = ""): FileWithMeta[] {
  const result: FileWithMeta[] = [];
  for (const folder of folders) {
    if (folder.children) {
      for (const sub of folder.children) {
        if (sub.files) {
          for (const f of sub.files) {
            result.push({ ...f, categoryName: folder.name, subfolderName: sub.name });
          }
        }
      }
    }
  }
  return result;
}

function getCategoryAttention(files: FileWithMeta[], catName: string): boolean {
  return files.some(f => f.categoryName === catName && getDocStatus(f).needsAttention);
}

const Relatorios = () => {
  const [activeTab, setActiveTab] = useState("resumo");
  const [selectedFolder, setSelectedFolder] = useState<ReportFolder | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["rf1", "rf2", "rf3"]));
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string; name: string }[]>([]);
  const [searchSummary, setSearchSummary] = useState("");

  const allFiles = useMemo(() => getAllFilesWithMeta(mockReportFolders), []);
  const categories = useMemo(() => [...new Set(allFiles.map(f => f.categoryName))], [allFiles]);

  const filteredSummaryFiles = useMemo(() => {
    if (!searchSummary) return allFiles;
    const q = searchSummary.toLowerCase();
    return allFiles.filter(f =>
      f.name.toLowerCase().includes(q) ||
      f.categoryName.toLowerCase().includes(q) ||
      (f.responsible_company || "").toLowerCase().includes(q)
    );
  }, [allFiles, searchSummary]);

  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectFolder = (folder: ReportFolder, parentName?: string) => {
    setSelectedFolder(folder);
    if (parentName) {
      setBreadcrumbs([{ id: "root", name: parentName }, { id: folder.id, name: folder.name }]);
    } else {
      setBreadcrumbs([{ id: folder.id, name: folder.name }]);
    }
  };

  const currentFiles = selectedFolder?.files || [];
  const displayFiles = search && !selectedFolder
    ? getAllFilesWithMeta(mockReportFolders).filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
    : currentFiles.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  const FolderTree = ({ folders, depth = 0, parentName }: { folders: ReportFolder[]; depth?: number; parentName?: string }) => (
    <div className="space-y-0.5">
      {folders.map(folder => {
        const isExpanded = expandedFolders.has(folder.id);
        const isSelected = selectedFolder?.id === folder.id;
        const hasChildren = folder.children && folder.children.length > 0;
        const hasFiles = folder.files && folder.files.length > 0;
        const fileCount = folder.files?.length || 0;
        const catHasAttention = depth === 0 && getCategoryAttention(allFiles, folder.name);

        return (
          <div key={folder.id}>
            <button
              onClick={() => {
                if (hasChildren) toggleFolder(folder.id);
                if (hasFiles || !hasChildren) { selectFolder(folder, parentName); setActiveTab("biblioteca"); }
              }}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${
                isSelected ? "bg-interactive/10 text-interactive font-medium" : "text-foreground hover:bg-muted/50"
              }`}
              style={{ paddingLeft: `${depth * 16 + 8}px` }}
            >
              {hasChildren && (
                <ChevronRight size={14} className={`transition-transform flex-shrink-0 ${isExpanded ? "rotate-90" : ""}`} />
              )}
              {!hasChildren && <span className="w-3.5" />}
              {isExpanded || !hasChildren ? <FolderOpen size={14} className="flex-shrink-0 text-muted-foreground" /> : <FolderClosed size={14} className="flex-shrink-0 text-muted-foreground" />}
              <span className="truncate">{folder.name}</span>
              {catHasAttention && (
                <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0 animate-pulse" />
              )}
              {fileCount > 0 && (
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{fileCount}</span>
              )}
            </button>
            {isExpanded && hasChildren && (
              <FolderTree folders={folder.children!} depth={depth + 1} parentName={folder.name} />
            )}
          </div>
        );
      })}
    </div>
  );

  // KPI counts
  const expiredCount = allFiles.filter(f => { const s = getDocStatus(f); return f.expires_at && s.label === "Vencido"; }).length;
  const expiringCount = allFiles.filter(f => { const s = getDocStatus(f); return f.expires_at && s.needsAttention && s.label !== "Vencido"; }).length;
  const okCount = allFiles.filter(f => !getDocStatus(f).needsAttention).length;

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Relatórios</h1>
            <p className="text-sm text-muted-foreground">Biblioteca de documentos e relatórios do ativo</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={showUpload} onOpenChange={setShowUpload}>
              <DialogTrigger asChild>
                <Button className="premium-gradient gap-2"><Upload size={16} />Fazer Upload</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload de Arquivo</DialogTitle>
                  <DialogDescription>Adicione um novo documento à biblioteca.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-interactive/50 transition-colors cursor-pointer">
                    <Upload size={32} className="mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Arraste arquivos aqui ou clique para selecionar</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, Excel, Word, Imagens (máx. 50MB)</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Categoria *</Label>
                    <select className="w-full border rounded-lg px-3 py-2 text-sm bg-card">
                      <option value="">Selecione a categoria...</option>
                      <optgroup label="Gestão Predial">
                        <option>Chamados e Manutenção</option>
                        <option>Contratos de Locação</option>
                        <option>Ocupação e Vacância</option>
                        <option>Reservas de Ambientes</option>
                      </optgroup>
                      <optgroup label="Técnico / Engenharia">
                        <option>PMOC</option>
                        <option>TVOC — Qualidade do Ar</option>
                        <option>ART / RRT</option>
                        <option>Laudos e Inspeções</option>
                        <option>PCIP — Combate a Incêndio</option>
                        <option>Projeto Executivo</option>
                      </optgroup>
                      <optgroup label="ESG & Sustentabilidade">
                        <option>Relatórios LEED</option>
                        <option>Relatórios I-REC</option>
                        <option>Consumo de Energia</option>
                        <option>Consumo de Água</option>
                        <option>Consumo de Gás</option>
                        <option>Resíduos e Reciclagem</option>
                        <option>Carbono e Emissões</option>
                      </optgroup>
                      <optgroup label="Financeiro">
                        <option>Rateio de Consumo</option>
                        <option>Receita de Locação</option>
                        <option>Inadimplência</option>
                        <option>Orçamento e Despesas</option>
                      </optgroup>
                      <optgroup label="Segurança e Compliance">
                        <option>Visitas e Controle de Acesso</option>
                        <option>Incidentes de Segurança</option>
                        <option>Auditorias Internas</option>
                        <option>Licenças e Alvarás</option>
                      </optgroup>
                      <optgroup label="Fornecedores">
                        <option>Contratos de Fornecimento</option>
                        <option>Avaliações de Fornecedores</option>
                        <option>Propostas e Cotações</option>
                      </optgroup>
                    </select>
                  </div>
                  <div className="space-y-1.5"><Label className="text-xs">Pasta de Destino</Label><Input placeholder="Selecione a pasta..." value={selectedFolder?.name || ""} readOnly /></div>
                  <div className="space-y-1.5"><Label className="text-xs">Descrição</Label><Textarea placeholder="Descrição opcional do arquivo..." rows={2} /></div>
                  <div className="space-y-1.5"><Label className="text-xs">Tags</Label><Input placeholder="Ex: PMOC, 2026, trimestral" /></div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowUpload(false)}>Cancelar</Button>
                  <Button className="premium-gradient" onClick={() => setShowUpload(false)}>Enviar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="resumo" className="gap-1.5">
              <FileText size={14} />
              Resumo
              {(expiredCount + expiringCount) > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </TabsTrigger>
            <TabsTrigger value="biblioteca" className="gap-1.5">
              <FolderOpen size={14} />
              Biblioteca
            </TabsTrigger>
          </TabsList>

          {/* ═══ TAB RESUMO ═══ */}
          <TabsContent value="resumo" className="space-y-4 mt-4">
            {/* KPI Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-card rounded-2xl premium-shadow p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center"><CheckCircle2 size={20} className="text-success" /></div>
                <div><p className="text-2xl font-bold text-foreground">{okCount}</p><p className="text-xs text-muted-foreground">Atualizados</p></div>
              </div>
              <div className="bg-card rounded-2xl premium-shadow p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center"><Clock size={20} className="text-amber-600" /></div>
                <div><p className="text-2xl font-bold text-foreground">{expiringCount}</p><p className="text-xs text-muted-foreground">Prestes a vencer</p></div>
              </div>
              <div className="bg-card rounded-2xl premium-shadow p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center"><AlertCircle size={20} className="text-destructive" /></div>
                <div><p className="text-2xl font-bold text-foreground">{expiredCount}</p><p className="text-xs text-muted-foreground">Vencidos</p></div>
              </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por nome, categoria ou empresa..." className="pl-9" value={searchSummary} onChange={e => setSearchSummary(e.target.value)} />
            </div>

            {/* Summary Table */}
            <div className="bg-card rounded-2xl premium-shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Documento</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Categoria</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Empresa Responsável</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Emissão</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Vencimento</th>
                      <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSummaryFiles.map((file, i) => {
                      const status = getDocStatus(file);
                      const StatusIcon = status.icon;
                      const catAttention = getCategoryAttention(allFiles, file.categoryName);
                      return (
                        <tr key={file.id} className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${i % 2 === 1 ? "bg-muted/10" : ""}`}>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-base">{fileTypeIcons[file.type] || "📄"}</span>
                              <span className="text-sm font-medium text-foreground">{file.name}</span>
                              {status.needsAttention && (
                                <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0 animate-pulse" />
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm text-muted-foreground">{file.categoryName}</span>
                              {catAttention && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0 animate-pulse cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent><p className="text-xs">Categoria com documentos a vencer</p></TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${status.color}`}>
                              <StatusIcon size={12} />
                              {status.label}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-sm text-muted-foreground">{file.responsible_company || "—"}</td>
                          <td className="px-5 py-3 text-sm text-muted-foreground">
                            {file.issued_at ? new Date(file.issued_at).toLocaleDateString("pt-BR") : "—"}
                          </td>
                          <td className="px-5 py-3 text-sm text-muted-foreground">
                            {file.expires_at ? (
                              <span className={status.needsAttention ? "font-semibold text-foreground" : ""}>
                                {new Date(file.expires_at).toLocaleDateString("pt-BR")}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/50">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8"><Download size={14} /></Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal size={14} /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>Renomear</DropdownMenuItem>
                                  <DropdownMenuItem>Mover para...</DropdownMenuItem>
                                  <DropdownMenuItem>Compartilhar</DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive">Excluir</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filteredSummaryFiles.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <File size={40} className="mb-3 opacity-30" />
                  <p className="text-sm font-medium">Nenhum documento encontrado</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ═══ TAB BIBLIOTECA ═══ */}
          <TabsContent value="biblioteca" className="mt-4">
            <div className="flex gap-6">
              <div className="hidden lg:block w-72 bg-card rounded-2xl premium-shadow p-4 h-fit sticky top-24">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-3 px-2">Pastas</p>
                <FolderTree folders={mockReportFolders} />
              </div>
              <div className="flex-1">
                {breadcrumbs.length > 0 && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
                    <button onClick={() => { setSelectedFolder(null); setBreadcrumbs([]); }} className="hover:text-foreground transition-colors">Todos</button>
                    {breadcrumbs.map((bc, i) => (
                      <span key={bc.id} className="flex items-center gap-1.5">
                        <ChevronRight size={12} />
                        <span className={i === breadcrumbs.length - 1 ? "text-foreground font-medium" : ""}>{bc.name}</span>
                      </span>
                    ))}
                  </div>
                )}
                <div className="relative mb-4 max-w-md">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Buscar arquivo por nome..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="bg-card rounded-2xl premium-shadow overflow-hidden">
                  {displayFiles.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/30">
                            <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Arquivo</th>
                            {!selectedFolder && <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Pasta</th>}
                            <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Tipo</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Tamanho</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Enviado por</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Data</th>
                            <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {displayFiles.map((file, i) => (
                            <tr key={file.id} className={`border-b border-border/50 hover:bg-muted/30 ${i % 2 === 1 ? "bg-muted/10" : ""}`}>
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{fileTypeIcons[file.type] || "📄"}</span>
                                  <span className="text-sm font-medium text-foreground">{file.name}</span>
                                </div>
                              </td>
                              {!selectedFolder && "categoryName" in file && (
                                <td className="px-5 py-3 text-sm text-muted-foreground">{(file as any).categoryName} &gt; {(file as any).subfolderName}</td>
                              )}
                              <td className="px-5 py-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${fileTypeColors[file.type] || "bg-muted text-muted-foreground"}`}>{file.type}</span>
                              </td>
                              <td className="px-5 py-3 text-sm text-muted-foreground">{file.size}</td>
                              <td className="px-5 py-3 text-sm text-muted-foreground">{file.uploaded_by}</td>
                              <td className="px-5 py-3 text-sm text-muted-foreground">{new Date(file.uploaded_at).toLocaleDateString("pt-BR")}</td>
                              <td className="px-5 py-3 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <Button variant="ghost" size="icon" className="h-8 w-8"><Download size={14} /></Button>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal size={14} /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem>Renomear</DropdownMenuItem>
                                      <DropdownMenuItem>Mover para...</DropdownMenuItem>
                                      <DropdownMenuItem>Compartilhar</DropdownMenuItem>
                                      <DropdownMenuItem className="text-destructive">Excluir</DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                      <File size={40} className="mb-3 opacity-30" />
                      <p className="text-sm font-medium">Nenhum arquivo encontrado</p>
                      <p className="text-xs mt-1">{selectedFolder ? "Esta pasta está vazia." : "Selecione uma pasta à esquerda ou faça uma busca."}</p>
                      <Button variant="outline" className="mt-4 gap-2" onClick={() => setShowUpload(true)}><Upload size={14} />Fazer Upload</Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
};

export default Relatorios;
