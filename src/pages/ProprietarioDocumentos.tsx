import { useState } from "react";
import { FileText, Download, Eye, Clock, AlertTriangle, CheckCircle2, XCircle, FolderOpen, Upload, X, FileImage, FileSpreadsheet, File } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

const folders = [
  { name: 'Relatórios Mensais', icon: '📊', subfolders: ['Manutenção', 'Consumos', 'Gastos Consolidados', 'Relatório Executivo'] },
  { name: 'Contratos e Documentos Legais', icon: '📋', subfolders: ['Contratos de Locação', 'Aditivos', 'Cartas Formais'] },
  { name: 'Financeiro', icon: '💰', subfolders: ['Prestação de Contas', 'DRE Mensal', 'Notas Fiscais'] },
  { name: 'Licenças e Certificações', icon: '🏆', subfolders: ['Alvará', 'LEED/I-REC', 'AVCB', 'Licenças'] },
  { name: 'Laudos Técnicos', icon: '🔍', subfolders: ['Fachada', 'Estrutural', 'Inspeções Prediais'] },
  { name: 'Orçamentos Aprovados', icon: '💵', subfolders: ['Orçamento 2025 (Aprovado)', 'Orçamento 2026 (Aguardando)'] },
];

const mockFiles = [
  { name: 'Relatório Mensal Manutenção — Fev/2026.pdf', type: 'pdf', date: '05/03/2026', by: 'Tatiana Caracciolo', expiry: null },
  { name: 'DRE Consolidado — Fev/2026.pdf', type: 'pdf', date: '03/03/2026', by: 'Administradora', expiry: null },
  { name: 'Contrato Locação — Lux Energia.pdf', type: 'pdf', date: '01/01/2025', by: 'Gestão', expiry: '31/12/2027' },
  { name: 'AVCB — Ed. Work Bela Cintra.pdf', type: 'pdf', date: '15/06/2025', by: 'Corpo de Bombeiros', expiry: '15/06/2026' },
  { name: 'Certificação LEED Gold.pdf', type: 'pdf', date: '10/01/2026', by: 'USGBC', expiry: '10/01/2028' },
];

const expirations = [
  { doc: 'AVCB — Ed. Work Bela Cintra', category: 'Licenças', expiry: '15/06/2026', daysLeft: 87, status: 'attention' as const },
  { doc: 'Alvará de Funcionamento', category: 'Licenças', expiry: '30/04/2026', daysLeft: 41, status: 'critical' as const },
  { doc: 'Contrato You.inc', category: 'Contratos', expiry: '28/02/2026', daysLeft: -20, status: 'expired' as const },
  { doc: 'Certificação LEED Gold', category: 'Certificações', expiry: '10/01/2028', daysLeft: 661, status: 'ok' as const },
  { doc: 'Laudo de Fachada', category: 'Laudos', expiry: '20/08/2026', daysLeft: 153, status: 'ok' as const },
];

const statusConfig = {
  expired: { label: 'Vencido', cls: 'bg-destructive/10 text-destructive', icon: XCircle },
  critical: { label: 'Crítico (< 30d)', cls: 'bg-amber-100 text-amber-800', icon: AlertTriangle },
  attention: { label: 'Atenção (< 90d)', cls: 'bg-amber-50 text-amber-600', icon: Clock },
  ok: { label: 'OK', cls: 'bg-success/10 text-success', icon: CheckCircle2 },
};

const docCategories = ['Contrato', 'Alvará', 'Planta', 'Laudo Técnico', 'AVCB', 'Seguro', 'Ata', 'Outro'];
const visibilityOptions = [
  { value: 'internal', label: 'Interno — só gestão' },
  { value: 'floor', label: 'Meu andar' },
  { value: 'tenants', label: 'Todos os locatários' },
  { value: 'public', label: 'Público' },
];

const acceptedFormats = '.pdf,.docx,.jpg,.jpeg,.png,.xlsx';
const maxSize = 20 * 1024 * 1024; // 20MB

const getFileIcon = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return <FileText size={16} className="text-destructive" />;
  if (['jpg', 'jpeg', 'png'].includes(ext || '')) return <FileImage size={16} className="text-interactive" />;
  if (['xlsx', 'xls'].includes(ext || '')) return <FileSpreadsheet size={16} className="text-success" />;
  return <File size={16} className="text-muted-foreground" />;
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const ProprietarioDocumentos = () => {
  const [selectedFolder, setSelectedFolder] = useState(0);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState({
    name: '',
    category: docCategories[0],
    hasExpiry: true,
    expiryDate: '',
    visibility: 'internal',
    observations: '',
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const expiredCount = expirations.filter(e => e.status === 'expired').length;
  const criticalCount = expirations.filter(e => e.status === 'critical').length;
  const attentionCount = expirations.filter(e => e.status === 'attention').length;
  const okCount = expirations.filter(e => e.status === 'ok').length;

  const handleFileSelect = (file: File | null) => {
    if (!file) return;
    if (file.size > maxSize) {
      toast.error('Arquivo excede o limite de 20MB');
      return;
    }
    setUploadFile(file);
    setUploadForm(prev => ({ ...prev, name: file.name.replace(/\.[^/.]+$/, '') }));
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      toast.error('Selecione um arquivo');
      return;
    }
    if (!uploadForm.name.trim()) {
      toast.error('Informe o nome do documento');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 95) { clearInterval(interval); return 95; }
        return prev + Math.random() * 15;
      });
    }, 200);

    setTimeout(() => {
      clearInterval(interval);
      setUploadProgress(100);
      setTimeout(() => {
        setUploading(false);
        setUploadOpen(false);
        setUploadFile(null);
        setUploadForm({ name: '', category: docCategories[0], hasExpiry: true, expiryDate: '', visibility: 'internal', observations: '' });
        setUploadProgress(0);
        toast.success('✅ Documento enviado com sucesso');
      }, 500);
    }, 2000);
  };

  const isExpiryClose = uploadForm.expiryDate && uploadForm.hasExpiry
    ? (new Date(uploadForm.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24) < 30 && new Date(uploadForm.expiryDate) > new Date()
    : false;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Documentos e Relatórios</h1>
          <p className="text-sm text-muted-foreground">Biblioteca completa do seu portfólio</p>
        </div>
        <Button className="premium-gradient gap-2" onClick={() => setUploadOpen(true)}><Upload size={14} />Fazer Upload</Button>
      </div>

      <Tabs defaultValue="documentos">
        <TabsList className="w-full overflow-x-auto flex-nowrap justify-start">
          <TabsTrigger value="documentos" className="whitespace-nowrap"><FolderOpen size={14} className="mr-1" />Documentos</TabsTrigger>
          <TabsTrigger value="vencimentos" className="whitespace-nowrap"><Clock size={14} className="mr-1" />⏰ Vencimentos</TabsTrigger>
        </TabsList>

        <TabsContent value="documentos">
          <div className="grid grid-cols-12 gap-4">
            {/* Sidebar de pastas */}
            <div className="col-span-12 md:col-span-4 lg:col-span-3 space-y-1">
              {folders.map((f, i) => (
                <button key={i} onClick={() => setSelectedFolder(i)}
                  className={`w-full text-left p-2.5 rounded-lg flex items-center gap-2 transition-colors text-sm ${selectedFolder === i ? 'bg-interactive/10 text-interactive font-medium' : 'text-muted-foreground hover:bg-muted/30'}`}>
                  <span>{f.icon}</span>
                  <span className="truncate">{f.name}</span>
                </button>
              ))}
            </div>
            {/* Conteúdo */}
            <div className="col-span-12 md:col-span-8 lg:col-span-9">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <span>{folders[selectedFolder].icon}</span>
                    {folders[selectedFolder].name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 mb-4 flex-wrap">
                    {folders[selectedFolder].subfolders.map((sf, i) => (
                      <button key={i} className="px-2.5 py-1 rounded-lg bg-muted/50 text-xs text-muted-foreground hover:bg-muted transition-colors">{sf}</button>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {mockFiles.map((f, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border/40 hover:bg-muted/20">
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText size={16} className="text-destructive shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{f.name}</p>
                            <p className="text-[10px] text-muted-foreground">{f.date} • {f.by}</p>
                          </div>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <Button variant="ghost" size="sm"><Eye size={14} /></Button>
                          <Button variant="ghost" size="sm"><Download size={14} /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="vencimentos">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <Card className="border-destructive/30"><CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold text-destructive">{expiredCount}</p>
              <p className="text-xs text-muted-foreground">🔴 Vencidos</p>
            </CardContent></Card>
            <Card className="border-amber-400/30"><CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold text-amber-600">{criticalCount}</p>
              <p className="text-xs text-muted-foreground">🟠 Críticos</p>
            </CardContent></Card>
            <Card className="border-amber-200/30"><CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold text-amber-500">{attentionCount}</p>
              <p className="text-xs text-muted-foreground">🟡 Atenção</p>
            </CardContent></Card>
            <Card className="border-success/30"><CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold text-success">{okCount}</p>
              <p className="text-xs text-muted-foreground">🟢 OK</p>
            </CardContent></Card>
          </div>
          <Card>
            <CardContent className="pt-4">
              <table className="w-full text-sm">
                <thead><tr className="border-b">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Documento</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Categoria</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-muted-foreground">Vencimento</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-muted-foreground">Dias</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-muted-foreground">Status</th>
                </tr></thead>
                <tbody>
                  {expirations.sort((a, b) => a.daysLeft - b.daysLeft).map((e, i) => {
                    const config = statusConfig[e.status];
                    const Icon = config.icon;
                    return (
                      <tr key={i} className="border-b border-border/30 hover:bg-muted/20">
                        <td className="py-2 px-3 font-medium">{e.doc}</td>
                        <td className="py-2 px-3 text-muted-foreground">{e.category}</td>
                        <td className="py-2 px-3 text-center text-muted-foreground">{e.expiry}</td>
                        <td className="py-2 px-3 text-center font-medium">{e.daysLeft < 0 ? `${Math.abs(e.daysLeft)}d atrás` : `${e.daysLeft}d`}</td>
                        <td className="py-2 px-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${config.cls}`}>
                            <Icon size={10} />{config.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={v => { if (!uploading) setUploadOpen(v); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload de Documento</DialogTitle>
            <DialogDescription>Envie um arquivo e preencha os metadados.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Arquivo <span className="text-destructive">*</span></Label>
              <div className="border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-interactive/50 transition-colors cursor-pointer relative"
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); handleFileSelect(e.dataTransfer.files[0]); }}>
                <input type="file" accept={acceptedFormats} className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleFileSelect(e.target.files?.[0] || null)} />
                {uploadFile ? (
                  <div className="flex items-center gap-3 justify-center">
                    {getFileIcon(uploadFile.name)}
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">{uploadFile.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(uploadFile.size)}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={e => { e.stopPropagation(); setUploadFile(null); }}><X size={12} /></Button>
                  </div>
                ) : (
                  <>
                    <Upload size={24} className="mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Arraste ou clique para selecionar</p>
                    <p className="text-[10px] text-muted-foreground mt-1">PDF, DOCX, JPG, PNG, XLSX • Máx 20MB</p>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Nome do documento</Label>
              <Input value={uploadForm.name} onChange={e => setUploadForm(p => ({ ...p, name: e.target.value }))} placeholder="Nome do documento" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Categoria</Label>
              <Select value={uploadForm.category} onValueChange={v => setUploadForm(p => ({ ...p, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {docCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Data de vencimento</Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Não expira</span>
                  <Switch checked={!uploadForm.hasExpiry} onCheckedChange={v => setUploadForm(p => ({ ...p, hasExpiry: !v }))} />
                </div>
              </div>
              {uploadForm.hasExpiry && (
                <>
                  <Input type="date" value={uploadForm.expiryDate} onChange={e => setUploadForm(p => ({ ...p, expiryDate: e.target.value }))} />
                  {isExpiryClose && (
                    <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-semibold"><AlertTriangle size={12} /> Vencimento em menos de 30 dias</span>
                  )}
                </>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Visibilidade</Label>
              <Select value={uploadForm.visibility} onValueChange={v => setUploadForm(p => ({ ...p, visibility: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {visibilityOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Observações</Label>
              <Textarea placeholder="Observações opcionais..." value={uploadForm.observations} onChange={e => setUploadForm(p => ({ ...p, observations: e.target.value }))} rows={2} />
            </div>

            {uploading && (
              <div className="space-y-2">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">Enviando arquivo... {Math.round(uploadProgress)}%</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)} disabled={uploading}>Cancelar</Button>
            <Button className="premium-gradient" onClick={handleUpload} disabled={uploading || !uploadFile}>
              {uploading ? 'Enviando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProprietarioDocumentos;
