import { useState } from "react";
import { DollarSign, TrendingUp, TrendingDown, Plus, Download, CreditCard, Receipt, BarChart3, Landmark, PiggyBank, Calculator } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MobileTabSelect } from "@/components/MobileTabSelect";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { mockContracts } from "@/lib/mock-data";
import { toast } from "sonner";

type Transaction = { id: string; entity: string; category: string; value: number; status: string; due: string; type: 'income' | 'expense'; description?: string };

const initialReceivables: Transaction[] = [
  { id: 'r1', entity: 'Lux Energia', category: 'Condomínio', value: 9000, status: 'received', due: '05/03/2026', type: 'income' },
  { id: 'r2', entity: 'Capitale Energia', category: 'Condomínio', value: 17280, status: 'pending', due: '10/03/2026', type: 'income' },
  { id: 'r3', entity: 'You Intermediação', category: 'Condomínio', value: 17280, status: 'received', due: '01/03/2026', type: 'income' },
  { id: 'r4', entity: 'Windmöller & Hölscher', category: 'Condomínio', value: 8640, status: 'received', due: '05/03/2026', type: 'income' },
  { id: 'r5', entity: 'Apex Partners', category: 'Condomínio', value: 25920, status: 'pending', due: '10/03/2026', type: 'income' },
  { id: 'r6', entity: 'Sul América', category: 'Condomínio', value: 17280, status: 'received', due: '05/03/2026', type: 'income' },
  { id: 'r7', entity: 'Geribá Energy', category: 'Condomínio', value: 34560, status: 'received', due: '05/03/2026', type: 'income' },
  { id: 'r8', entity: 'Estacionamento', category: 'Receita Diversa', value: 8000, status: 'pending', due: '15/03/2026', type: 'income' },
];

const initialPayables: Transaction[] = [
  { id: 'p1', entity: 'Limpeza SP Ltda', category: 'Serviços Terceirizados', value: 18000, status: 'paid', due: '05/03/2026', type: 'expense' },
  { id: 'p2', entity: 'SecurTech', category: 'Segurança', value: 22000, status: 'pending', due: '10/03/2026', type: 'expense' },
  { id: 'p3', entity: 'CPFL Energia', category: 'Utilities', value: 15000, status: 'pending', due: '15/03/2026', type: 'expense' },
  { id: 'p4', entity: 'Sabesp', category: 'Utilities', value: 6000, status: 'overdue', due: '28/02/2026', type: 'expense' },
  { id: 'p5', entity: 'Administradora', category: 'Administrativo', value: 14000, status: 'paid', due: '01/03/2026', type: 'expense' },
  { id: 'p6', entity: 'Comgás', category: 'Utilities', value: 3500, status: 'pending', due: '12/03/2026', type: 'expense' },
  { id: 'p7', entity: 'Elevadores Otis', category: 'Manutenção', value: 8500, status: 'paid', due: '05/03/2026', type: 'expense' },
  { id: 'p8', entity: 'Jardinagem Verde Vivo', category: 'Serviços Terceirizados', value: 3200, status: 'paid', due: '05/03/2026', type: 'expense' },
  { id: 'p9', entity: 'Seguro Ativo', category: 'Administrativo', value: 4800, status: 'paid', due: '01/03/2026', type: 'expense' },
];

const categories = ['Condomínio', 'Serviços Terceirizados', 'Utilities', 'Administrativo', 'Manutenção', 'Segurança', 'Receita Diversa', 'CAPEX', 'Outro'];

const rateioMethods = [
  { id: 'fracao', label: 'Fração Ideal (m²)' },
  { id: 'igual', label: 'Cotas Iguais' },
  { id: 'individual', label: 'Medição Individual' },
];

const Financeiro = () => {
  const [activeTab, setActiveTab] = useState('categorias');
  const [receivables, setReceivables] = useState(initialReceivables);
  const [payables, setPayables] = useState(initialPayables);
  const [showDialog, setShowDialog] = useState<'income' | 'expense' | null>(null);
  const [form, setForm] = useState({ entity: '', category: categories[0], value: '', due: '', description: '' });
  const [rateioMethod, setRateioMethod] = useState('fracao');
  const [utilityBill, setUtilityBill] = useState({ energy: '15000', water: '6000', gas: '3500' });

  const cashBalance = 185000;
  const reserveFund = 120000;

  const totalReceived = receivables.filter(r => r.status === 'received').reduce((s, r) => s + r.value, 0);
  const totalPending = receivables.filter(r => r.status === 'pending').reduce((s, r) => s + r.value, 0);
  const totalPaid = payables.filter(p => p.status === 'paid').reduce((s, p) => s + p.value, 0);
  const totalPayPending = payables.filter(p => p.status !== 'paid').reduce((s, p) => s + p.value, 0);

  // Group expenses by category
  const expenseByCategory = payables.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + p.value;
    return acc;
  }, {});
  const expenseCategoryData = Object.entries(expenseByCategory).map(([cat, val]) => ({ category: cat, value: val })).sort((a, b) => b.value - a.value);

  const statusCls: Record<string, string> = {
    received: 'bg-success/10 text-success', paid: 'bg-success/10 text-success',
    pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400', overdue: 'bg-destructive/10 text-destructive',
  };
  const statusLabel: Record<string, string> = { received: 'Recebido', paid: 'Pago', pending: 'Pendente', overdue: 'Vencido' };

  const handleAdd = () => {
    if (!form.entity.trim() || !form.value) { toast.error('Preencha os campos obrigatórios'); return; }
    const tx: Transaction = {
      id: `tx-${Date.now()}`, entity: form.entity, category: form.category,
      value: parseFloat(form.value), status: 'pending', due: form.due || new Date().toLocaleDateString('pt-BR'),
      type: showDialog!, description: form.description,
    };
    if (showDialog === 'income') setReceivables(prev => [...prev, tx]);
    else setPayables(prev => [...prev, tx]);
    toast.success(showDialog === 'income' ? 'Receita registrada' : 'Despesa registrada');
    setForm({ entity: '', category: categories[0], value: '', due: '', description: '' });
    setShowDialog(null);
  };

  const toggleStatus = (type: 'income' | 'expense', id: string) => {
    if (type === 'income') {
      setReceivables(prev => prev.map(r => r.id === id ? { ...r, status: r.status === 'received' ? 'pending' : 'received' } : r));
    } else {
      setPayables(prev => prev.map(p => p.id === id ? { ...p, status: p.status === 'paid' ? 'pending' : 'paid' } : p));
    }
    toast.success('Status atualizado');
  };

  // Rateio calculation
  const totalArea = mockContracts.reduce((s, c) => s + c.area_m2, 0);
  const totalUtilities = parseFloat(utilityBill.energy || '0') + parseFloat(utilityBill.water || '0') + parseFloat(utilityBill.gas || '0');
  const totalCondominial = payables.filter(p => p.category !== 'Utilities').reduce((s, p) => s + p.value, 0);
  const totalToRateio = totalCondominial + totalUtilities;

  const activeContracts = mockContracts.filter(c => c.status === 'active' || c.status === 'expiring');

  const rateioRows = activeContracts.map(c => {
    let condShare = 0;
    let utilShare = 0;
    if (rateioMethod === 'fracao') {
      const pct = c.area_m2 / totalArea;
      condShare = totalCondominial * pct;
      utilShare = totalUtilities * pct;
    } else if (rateioMethod === 'igual') {
      condShare = totalCondominial / activeContracts.length;
      utilShare = totalUtilities / activeContracts.length;
    } else {
      condShare = totalCondominial * (c.area_m2 / totalArea);
      utilShare = totalUtilities * (c.area_m2 / totalArea);
    }
    return {
      tenant: c.tenant_name,
      floors: c.floors.join(', '),
      area: c.area_m2,
      pct: (c.area_m2 / totalArea * 100),
      condominial: condShare,
      utilities: utilShare,
      total: condShare + utilShare,
    };
  });

  const downloadCSV = (headers: string[], rows: string[][], filename: string) => {
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportFinanceiroCSV = () => {
    const headers = ['Entidade', 'Categoria', 'Valor', 'Vencimento', 'Status', 'Tipo'];
    const allTx = [...receivables.map(r => ({ ...r, typeLabel: 'Receita' })), ...payables.map(p => ({ ...p, typeLabel: 'Despesa' }))];
    const rows = allTx.map(t => [t.entity, t.category, t.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), t.due, statusLabel[t.status] || t.status, t.typeLabel]);
    downloadCSV(headers, rows, `Financeiro_360JK_${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}.csv`);
    toast.success('📊 Planilha exportada com sucesso');
  };

  const handleExportRateioCSV = () => {
    const headers = ['Locatário', 'Andares', 'Área (m²)', '%', 'Condomínio', 'Utilities', 'Total'];
    const rows = rateioRows.map(r => [r.tenant, r.floors, r.area.toLocaleString('pt-BR'), r.pct.toFixed(1) + '%', `R$ ${r.condominial.toFixed(2)}`, `R$ ${r.utilities.toFixed(2)}`, `R$ ${r.total.toFixed(2)}`]);
    downloadCSV(headers, rows, `Rateio_360JK_Marco2026.csv`);
    toast.success('📊 Planilha exportada com sucesso');
  };

  const handleExportRateioPDF = () => {
    const method = rateioMethods.find(m => m.id === rateioMethod)?.label || rateioMethod;
    const printWindow = window.open('', '_blank');
    if (!printWindow) { toast.error('Popup bloqueado. Permita popups para exportar.'); return; }
    const tableRows = rateioRows.map(r => `<tr><td>${r.tenant}</td><td style="text-align:center">${r.floors}</td><td style="text-align:right">${r.area.toLocaleString('pt-BR')}</td><td style="text-align:right">${r.pct.toFixed(1)}%</td><td style="text-align:right">R$ ${r.condominial.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td><td style="text-align:right">R$ ${r.utilities.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td><td style="text-align:right;font-weight:bold">R$ ${r.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td></tr>`).join('');
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Rateio</title><style>body{font-family:Arial,sans-serif;margin:40px;color:#333}h1{font-size:18px;margin-bottom:4px}p{font-size:12px;color:#666;margin:2px 0}table{width:100%;border-collapse:collapse;margin-top:20px;font-size:11px}th,td{padding:6px 8px;border:1px solid #ddd;text-align:left}th{background:#f5f5f5;font-weight:600}tfoot td{background:#f5f5f5;font-weight:bold}.footer{margin-top:30px;font-size:10px;color:#999;border-top:1px solid #ddd;padding-top:10px}</style></head><body><h1>Patria — Relatório de Rateio de Consumo</h1><p>Período: Março/2026 | Ativo: 360JK</p><p>Método: ${method}</p><table><thead><tr><th>Locatário</th><th style="text-align:center">Andar(es)</th><th style="text-align:right">Área (m²)</th><th style="text-align:right">%</th><th style="text-align:right">Condomínio</th><th style="text-align:right">Utilities</th><th style="text-align:right">Total</th></tr></thead><tbody>${tableRows}</tbody><tfoot><tr><td colspan="2"><strong>TOTAL</strong></td><td style="text-align:right">${totalArea.toLocaleString('pt-BR')}</td><td style="text-align:right">100%</td><td style="text-align:right">R$ ${totalCondominial.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td><td style="text-align:right">R$ ${totalUtilities.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td><td style="text-align:right">R$ ${totalToRateio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td></tr></tfoot></table><div class="footer">Gerado em ${new Date().toLocaleString('pt-BR')} | Patria | 360JK</div></body></html>`);
    printWindow.document.close();
    printWindow.print();
    toast.success('📄 PDF exportado com sucesso');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">Financeiro — IPMS</h1>
          <p className="text-sm text-muted-foreground">Visão consolidada de receitas, despesas e rateio condominial</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" className="gap-2 h-11 sm:h-10 w-full sm:w-auto" onClick={handleExportFinanceiroCSV}><Download size={14} />Exportar</Button>
          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex">
            <Button variant="outline" className="gap-2 h-11 sm:h-10 border-success text-success hover:bg-success/10" onClick={() => setShowDialog('income')}>
              <Plus size={14} />Receita
            </Button>
            <Button className="premium-gradient gap-2 h-11 sm:h-10" onClick={() => setShowDialog('expense')}>
              <Plus size={14} />Despesa
            </Button>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card><CardContent className="p-4 md:pt-6"><div className="flex items-center gap-3"><div className="p-2.5 rounded-xl bg-success/10 shrink-0"><TrendingUp size={20} className="text-success" /></div><div className="min-w-0"><p className="text-xs text-muted-foreground">Receitas do Mês</p><p className="text-lg font-bold text-foreground">R$ {((totalReceived + totalPending)/1000).toFixed(0)}k</p><p className="text-xs text-success">R$ {(totalReceived/1000).toFixed(0)}k recebido</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4 md:pt-6"><div className="flex items-center gap-3"><div className="p-2.5 rounded-xl bg-destructive/10 shrink-0"><TrendingDown size={20} className="text-destructive" /></div><div className="min-w-0"><p className="text-xs text-muted-foreground">Despesas do Mês</p><p className="text-lg font-bold text-foreground">R$ {((totalPaid + totalPayPending)/1000).toFixed(0)}k</p><p className="text-xs text-muted-foreground">R$ {(totalPaid/1000).toFixed(0)}k pago</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4 md:pt-6"><div className="flex items-center gap-3"><div className="p-2.5 rounded-xl bg-interactive/10 shrink-0"><DollarSign size={20} className="text-interactive" /></div><div className="min-w-0"><p className="text-xs text-muted-foreground">Saldo Operacional</p><p className={`text-lg font-bold ${((totalReceived + totalPending) - (totalPaid + totalPayPending)) >= 0 ? 'text-success' : 'text-destructive'}`}>R$ {(((totalReceived + totalPending) - (totalPaid + totalPayPending))/1000).toFixed(0)}k</p></div></div></CardContent></Card>
        <Card className="border-interactive/30"><CardContent className="p-4 md:pt-6"><div className="flex items-center gap-3"><div className="p-2.5 rounded-xl bg-interactive/10 shrink-0"><Landmark size={20} className="text-interactive" /></div><div className="min-w-0"><p className="text-xs text-muted-foreground">Saldo em Caixa</p><p className="text-lg font-bold text-foreground">R$ {(cashBalance/1000).toFixed(0)}k</p></div></div></CardContent></Card>
        <Card className="border-amber-500/30"><CardContent className="p-4 md:pt-6"><div className="flex items-center gap-3"><div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/30 shrink-0"><PiggyBank size={20} className="text-amber-600" /></div><div className="min-w-0"><p className="text-xs text-muted-foreground">Fundo de Reserva</p><p className="text-lg font-bold text-foreground">R$ {(reserveFund/1000).toFixed(0)}k</p></div></div></CardContent></Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <MobileTabSelect
          tabs={[
            { value: 'categorias', label: 'Custos', icon: <BarChart3 size={14} /> },
            { value: 'receber', label: 'A Receber', icon: <CreditCard size={14} /> },
            { value: 'pagar', label: 'A Pagar', icon: <Receipt size={14} /> },
            { value: 'rateio', label: 'Rateio', icon: <Calculator size={14} /> },
            { value: 'dre', label: 'DRE', icon: <DollarSign size={14} /> },
          ]}
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
            <TabsList className="inline-flex w-auto min-w-full sm:min-w-0 whitespace-nowrap">
              <TabsTrigger value="categorias" className="text-xs sm:text-sm whitespace-nowrap"><BarChart3 size={14} className="mr-1 shrink-0" />Custos</TabsTrigger>
              <TabsTrigger value="receber" className="text-xs sm:text-sm whitespace-nowrap"><CreditCard size={14} className="mr-1 shrink-0" />A Receber</TabsTrigger>
              <TabsTrigger value="pagar" className="text-xs sm:text-sm whitespace-nowrap"><Receipt size={14} className="mr-1 shrink-0" />A Pagar</TabsTrigger>
              <TabsTrigger value="rateio" className="text-xs sm:text-sm whitespace-nowrap"><Calculator size={14} className="mr-1 shrink-0" />Rateio</TabsTrigger>
              <TabsTrigger value="dre" className="text-xs sm:text-sm whitespace-nowrap"><DollarSign size={14} className="mr-1 shrink-0" />DRE</TabsTrigger>
            </TabsList>
          </div>
        </MobileTabSelect>

        {/* ── Custos por Categoria ── */}
        <TabsContent value="categorias" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-sm font-semibold text-foreground mb-4">Despesas por Categoria — Março/2026</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={expenseCategoryData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" fontSize={11} tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `R$ ${(v/1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="category" width={100} fontSize={10} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '11px' }} formatter={(v: number) => `R$ ${v.toLocaleString('pt-BR')}`} />
                    <Bar dataKey="value" fill="hsl(var(--interactive))" radius={[0, 6, 6, 0]} name="Valor" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            {/* Donut Chart */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-sm font-semibold text-foreground mb-4">Distribuição de Despesas</h3>
                <ResponsiveContainer width="100%" height={200} className="sm:!h-[260px]">
                  <PieChart>
                    <Pie
                      data={expenseCategoryData}
                      dataKey="value"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      innerRadius={45}
                      paddingAngle={3}
                      label={false}
                      labelLine={false}
                    >
                      {expenseCategoryData.map((_, i) => {
                        const COLORS = ['hsl(var(--interactive))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--operational))', '#8B5CF6', '#EC4899'];
                        return <Cell key={i} fill={COLORS[i % COLORS.length]} />;
                      })}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '11px' }}
                      formatter={(v: number, name: string) => [`R$ ${v.toLocaleString('pt-BR')}`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Legend grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 mt-4">
                  {expenseCategoryData.map((cat, i) => {
                    const COLORS = ['hsl(var(--interactive))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--operational))', '#8B5CF6', '#EC4899'];
                    const pct = ((cat.value / (totalPaid + totalPayPending)) * 100).toFixed(1);
                    return (
                      <div key={cat.category} className="flex items-center gap-2 text-sm">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-foreground truncate">{cat.category}</span>
                        <span className="text-muted-foreground ml-auto shrink-0">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Contas a Receber ── */}
        <TabsContent value="receber" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              {/* Mobile card view */}
              <div className="sm:hidden space-y-3">
                {receivables.map(r => (
                  <div key={r.id} className="p-3 rounded-xl border border-border/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground truncate max-w-[160px]">{r.entity}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusCls[r.status]}`}>{statusLabel[r.status]}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{r.category}</span>
                      <span>{r.due}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground tabular-nums">R$ {r.value.toLocaleString('pt-BR')}</span>
                      <Button variant="ghost" size="sm" className="text-xs h-8" onClick={() => toggleStatus('income', r.id)}>
                        {r.status === 'received' ? 'Desfazer' : 'Confirmar'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead><tr className="border-b">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Locatário / Origem</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Categoria</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Valor</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold text-muted-foreground">Vencimento</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold text-muted-foreground">Status</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold text-muted-foreground">Ações</th>
                  </tr></thead>
                  <tbody>
                    {receivables.map(r => (
                      <tr key={r.id} className="border-b border-border/30 hover:bg-muted/20">
                        <td className="py-2 px-3 font-medium max-w-[160px] truncate">{r.entity}</td>
                        <td className="py-2 px-3 text-muted-foreground hidden md:table-cell">{r.category}</td>
                        <td className="py-2 px-3 text-right tabular-nums">R$ {r.value.toLocaleString('pt-BR')}</td>
                        <td className="py-2 px-3 text-center text-muted-foreground">{r.due}</td>
                        <td className="py-2 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusCls[r.status]}`}>{statusLabel[r.status]}</span>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => toggleStatus('income', r.id)}>
                            {r.status === 'received' ? 'Desfazer' : 'Confirmar'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Contas a Pagar ── */}
        <TabsContent value="pagar" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              {/* Mobile card view */}
              <div className="sm:hidden space-y-3">
                {payables.map(p => (
                  <div key={p.id} className="p-3 rounded-xl border border-border/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground truncate max-w-[160px]">{p.entity}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusCls[p.status]}`}>{statusLabel[p.status]}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{p.category}</span>
                      <span>{p.due}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground tabular-nums">R$ {p.value.toLocaleString('pt-BR')}</span>
                      <Button variant="ghost" size="sm" className="text-xs h-8" onClick={() => toggleStatus('expense', p.id)}>
                        {p.status === 'paid' ? 'Desfazer' : 'Confirmar'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead><tr className="border-b">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Fornecedor</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Categoria</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Valor</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold text-muted-foreground">Vencimento</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold text-muted-foreground">Status</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold text-muted-foreground">Ações</th>
                  </tr></thead>
                  <tbody>
                    {payables.map(p => (
                      <tr key={p.id} className="border-b border-border/30 hover:bg-muted/20">
                        <td className="py-2 px-3 font-medium max-w-[160px] truncate">{p.entity}</td>
                        <td className="py-2 px-3 text-muted-foreground hidden md:table-cell">{p.category}</td>
                        <td className="py-2 px-3 text-right tabular-nums">R$ {p.value.toLocaleString('pt-BR')}</td>
                        <td className="py-2 px-3 text-center text-muted-foreground">{p.due}</td>
                        <td className="py-2 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusCls[p.status]}`}>{statusLabel[p.status]}</span>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => toggleStatus('expense', p.id)}>
                            {p.status === 'paid' ? 'Desfazer' : 'Confirmar'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Rateio Condominial ── */}
        <TabsContent value="rateio" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Config panel */}
            <Card className="lg:col-span-1">
              <CardContent className="pt-6 space-y-5">
                <h3 className="text-sm font-semibold text-foreground">Configuração do Rateio</h3>

                <div className="space-y-2">
                  <Label className="text-xs">Método de Rateio — Condomínio</Label>
                  <Select value={rateioMethod} onValueChange={setRateioMethod}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {rateioMethods.map(m => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase">Contas de Utilities do Mês</h4>
                  <div className="space-y-2">
                    <Label className="text-xs">⚡ Energia (R$)</Label>
                    <Input type="number" value={utilityBill.energy} onChange={e => setUtilityBill(p => ({ ...p, energy: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">💧 Água (R$)</Label>
                    <Input type="number" value={utilityBill.water} onChange={e => setUtilityBill(p => ({ ...p, water: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">🔥 Gás (R$)</Label>
                    <Input type="number" value={utilityBill.gas} onChange={e => setUtilityBill(p => ({ ...p, gas: e.target.value }))} />
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Total Custos Condominiais</span>
                    <span className="font-semibold">R$ {totalCondominial.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Total Utilities</span>
                    <span className="font-semibold">R$ {totalUtilities.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold border-t pt-2">
                    <span>Total a Ratear</span>
                    <span>R$ {totalToRateio.toLocaleString('pt-BR')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rateio result table */}
            <Card className="lg:col-span-2">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-foreground">Rateio por Unidade — Março/2026</h3>
                  <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={handleExportRateioCSV}><Download size={12} />Exportar</Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Locatário</th>
                        <th className="text-center py-2 px-3 text-xs font-semibold text-muted-foreground">Andar(es)</th>
                        <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Área (m²)</th>
                        <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">%</th>
                        <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Condomínio</th>
                        <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Utilities</th>
                        <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground font-bold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rateioRows.map((r, i) => (
                        <tr key={i} className="border-b border-border/30 hover:bg-muted/20">
                          <td className="py-2 px-3 font-medium text-xs">{r.tenant}</td>
                          <td className="py-2 px-3 text-center text-xs text-muted-foreground">{r.floors}</td>
                          <td className="py-2 px-3 text-right text-xs tabular-nums">{r.area.toLocaleString('pt-BR')}</td>
                          <td className="py-2 px-3 text-right text-xs tabular-nums">{r.pct.toFixed(1)}%</td>
                          <td className="py-2 px-3 text-right text-xs tabular-nums">R$ {r.condominial.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="py-2 px-3 text-right text-xs tabular-nums">R$ {r.utilities.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="py-2 px-3 text-right text-xs font-bold tabular-nums">R$ {r.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-muted/30 font-bold">
                        <td className="py-2 px-3 text-xs" colSpan={2}>TOTAL</td>
                        <td className="py-2 px-3 text-right text-xs tabular-nums">{totalArea.toLocaleString('pt-BR')}</td>
                        <td className="py-2 px-3 text-right text-xs">100%</td>
                        <td className="py-2 px-3 text-right text-xs tabular-nums">R$ {totalCondominial.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="py-2 px-3 text-right text-xs tabular-nums">R$ {totalUtilities.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="py-2 px-3 text-right text-xs tabular-nums">R$ {totalToRateio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button className="premium-gradient text-xs" onClick={() => toast.success('Rateio confirmado e boletos gerados')}>Confirmar e Gerar Boletos</Button>
                  <Button variant="outline" className="text-xs" onClick={handleExportRateioPDF}>Exportar PDF</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── DRE ── */}
        <TabsContent value="dre" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <table className="w-full text-sm">
                <thead><tr className="border-b">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Demonstrativo</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Mar/2026</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Acumulado</th>
                </tr></thead>
                <tbody>
                  <tr className="border-b bg-success/5"><td className="py-2 px-3 font-semibold text-success">Receitas</td><td className="py-2 px-3 text-right font-semibold text-success">R$ {(totalReceived + totalPending).toLocaleString('pt-BR')}</td><td className="py-2 px-3 text-right text-success">R$ {((totalReceived + totalPending) * 3).toLocaleString('pt-BR')}</td></tr>
                  <tr className="border-b"><td className="py-2 px-3 pl-6 text-muted-foreground">Arrecadação Condominial</td><td className="py-2 px-3 text-right">R$ {receivables.filter(r => r.category === 'Condomínio').reduce((s, r) => s + r.value, 0).toLocaleString('pt-BR')}</td><td className="py-2 px-3 text-right">R$ {(receivables.filter(r => r.category === 'Condomínio').reduce((s, r) => s + r.value, 0) * 3).toLocaleString('pt-BR')}</td></tr>
                  <tr className="border-b"><td className="py-2 px-3 pl-6 text-muted-foreground">Outras receitas</td><td className="py-2 px-3 text-right">R$ {receivables.filter(r => r.category !== 'Condomínio').reduce((s, r) => s + r.value, 0).toLocaleString('pt-BR')}</td><td className="py-2 px-3 text-right">R$ {(receivables.filter(r => r.category !== 'Condomínio').reduce((s, r) => s + r.value, 0) * 3).toLocaleString('pt-BR')}</td></tr>
                  <tr className="border-b bg-destructive/5"><td className="py-2 px-3 font-semibold text-destructive">(-) Despesas</td><td className="py-2 px-3 text-right font-semibold text-destructive">R$ {(totalPaid + totalPayPending).toLocaleString('pt-BR')}</td><td className="py-2 px-3 text-right text-destructive">R$ {((totalPaid + totalPayPending) * 3).toLocaleString('pt-BR')}</td></tr>
                  {expenseCategoryData.map(cat => (
                    <tr key={cat.category} className="border-b"><td className="py-2 px-3 pl-6 text-muted-foreground">{cat.category}</td><td className="py-2 px-3 text-right">R$ {cat.value.toLocaleString('pt-BR')}</td><td className="py-2 px-3 text-right">R$ {(cat.value * 3).toLocaleString('pt-BR')}</td></tr>
                  ))}
                  <tr className="bg-interactive/5 font-bold"><td className="py-2 px-3">(=) Resultado Operacional</td><td className="py-2 px-3 text-right text-success">R$ {((totalReceived + totalPending) - (totalPaid + totalPayPending)).toLocaleString('pt-BR')}</td><td className="py-2 px-3 text-right text-success">R$ {(((totalReceived + totalPending) - (totalPaid + totalPayPending)) * 3).toLocaleString('pt-BR')}</td></tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Register Dialog */}
      <Dialog open={!!showDialog} onOpenChange={() => setShowDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{showDialog === 'income' ? 'Registrar Receita' : 'Registrar Despesa'}</DialogTitle>
            <DialogDescription>{showDialog === 'income' ? 'Adicione uma nova entrada de receita.' : 'Adicione uma nova despesa ao controle financeiro.'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">{showDialog === 'income' ? 'Origem / Locatário *' : 'Fornecedor / Entidade *'}</Label>
              <Input placeholder={showDialog === 'income' ? 'Ex: Lux Energia' : 'Ex: CPFL Energia'} value={form.entity} onChange={e => setForm(p => ({ ...p, entity: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Categoria</Label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm bg-card" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Valor (R$) *</Label>
                <Input type="number" placeholder="0,00" value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Vencimento</Label>
                <Input type="date" value={form.due} onChange={e => setForm(p => ({ ...p, due: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Descrição</Label>
              <Textarea placeholder="Descrição opcional..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(null)}>Cancelar</Button>
            <Button className="premium-gradient" onClick={handleAdd}>{showDialog === 'income' ? 'Registrar Receita' : 'Registrar Despesa'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Financeiro;
