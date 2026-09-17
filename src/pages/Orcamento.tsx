import { useState } from "react";
import { DollarSign, TrendingUp, TrendingDown, Download, Send, CheckCircle2, XCircle, MessageSquare, Pencil, Plus, Landmark, ShieldCheck, PiggyBank, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/contexts/AppContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RPieChart, Pie, Cell, Legend } from "recharts";
import { toast } from "sonner";
import { mockContracts } from "@/lib/mock-data";

const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

type BudgetLine = { name: string; values: number[] };
type ExpenseCategory = { category: string; lines: BudgetLine[] };

// Arrecadação = cota condominial paga pelos locatários
const initialArrecadacao: BudgetLine[] = mockContracts.map(c => ({
  name: c.tenant_name,
  values: Array(12).fill(Math.round(c.area_m2 * 18)), // ~R$18/m²
}));

const initialDespesasOrdinarias: ExpenseCategory[] = [
  { category: 'Pessoal e Terceirizados', lines: [
    { name: 'Segurança Patrimonial', values: Array(12).fill(28000) },
    { name: 'Limpeza e Conservação', values: Array(12).fill(22000) },
    { name: 'Recepção / Concierge', values: Array(12).fill(12000) },
    { name: 'Paisagismo e Jardinagem', values: Array(12).fill(4500) },
  ]},
  { category: 'Manutenção e Conservação', lines: [
    { name: 'Manutenção Preventiva (PMOC)', values: Array(12).fill(14000) },
    { name: 'Manutenção Corretiva (provisão)', values: Array(12).fill(6000) },
    { name: 'Elevadores — contrato', values: Array(12).fill(9500) },
    { name: 'HVAC / Climatização', values: Array(12).fill(7000) },
    { name: 'Sistema Hidráulico', values: Array(12).fill(3000) },
    { name: 'Sistema Elétrico', values: Array(12).fill(3500) },
    { name: 'Grupo Gerador', values: Array(12).fill(4000) },
  ]},
  { category: 'Utilities — Áreas Comuns', lines: [
    { name: 'Energia Elétrica', values: [15000,14500,15500,16000,14000,13500,14000,15000,16000,15500,15000,14500] },
    { name: 'Água e Esgoto', values: Array(12).fill(7000) },
    { name: 'Gás', values: [2500,2500,2800,3000,3200,3500,3500,3200,2800,2500,2500,2500] },
    { name: 'Internet / Telecom', values: Array(12).fill(3800) },
  ]},
  { category: 'Administrativo', lines: [
    { name: 'Honorários Administradora (Administradora)', values: Array(12).fill(16000) },
    { name: 'Seguros Obrigatórios', values: Array(12).fill(5500) },
    { name: 'IPTU (proporcional)', values: Array(12).fill(9000) },
    { name: 'Taxas e Licenças', values: Array(12).fill(1800) },
    { name: 'Material de Consumo', values: Array(12).fill(2200) },
    { name: 'Despesas Jurídicas (provisão)', values: Array(12).fill(2000) },
    { name: 'Contabilidade', values: Array(12).fill(3500) },
  ]},
];

const initialDespesasExtraordinarias: ExpenseCategory[] = [
  { category: 'Obras e Reformas', lines: [
    { name: 'Reforma Bicicletário (SS3)', values: [0,0,25000,25000,25000,25000,0,0,0,0,0,0] },
    { name: 'Instalação Vagas EV (SS2)', values: [0,0,0,18000,18000,18000,18000,0,0,0,0,0] },
  ]},
  { category: 'Equipamentos e Tecnologia', lines: [
    { name: 'Modernização CFTV', values: [0,0,0,0,0,35000,35000,0,0,0,0,0] },
  ]},
  { category: 'Projetos ESG', lines: [
    { name: 'Renovação LEED Gold', values: [0,0,0,0,0,0,0,0,15000,15000,0,0] },
  ]},
];

// Realizado (simulação — apenas primeiros 3 meses preenchidos, restante 0)
const buildRealized = (projected: number[]): number[] =>
  projected.map((v, i) => i < 3 ? Math.round(v * (0.9 + Math.random() * 0.2)) : 0);

const COLORS = ['hsl(var(--interactive))','hsl(var(--success))','hsl(var(--warning))','hsl(var(--destructive))','#4F7F99','#0F3834','#8BC34A'];

const formatBRL = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 0 });
const formatK = (v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v);

const Orcamento = () => {
  const { user } = useApp();
  const [year, setYear] = useState(2026);
  const [status, setStatus] = useState<'draft'|'pending'|'approved'|'rejected'>('draft');
  const [tab, setTab] = useState('arrecadacao');
  const isOwner = user.role === 'owner';

  const [arrecadacao, setArrecadacao] = useState<BudgetLine[]>(initialArrecadacao.map(r => ({ ...r, values: [...r.values] })));
  const [despOrdinarias, setDespOrdinarias] = useState<ExpenseCategory[]>(initialDespesasOrdinarias.map(c => ({ ...c, lines: c.lines.map(l => ({ ...l, values: [...l.values] })) })));
  const [despExtraordinarias, setDespExtraordinarias] = useState<ExpenseCategory[]>(initialDespesasExtraordinarias.map(c => ({ ...c, lines: c.lines.map(l => ({ ...l, values: [...l.values] })) })));

  // Fundos
  const [fundoReservaPct, setFundoReservaPct] = useState(10);
  const [fundoObrasPct, setFundoObrasPct] = useState(5);
  const [inadimplenciaPct, setInadimplenciaPct] = useState(5);

  // Edit state
  const [editingCell, setEditingCell] = useState<{ table: string; catIdx?: number; lineIdx: number; monthIdx: number } | null>(null);
  const [editValue, setEditValue] = useState('');

  // Dialogs
  const [showSolicitar, setShowSolicitar] = useState(false);
  const [solicitarForm, setSolicitarForm] = useState({ name: '', type: 'ordinaria' as 'ordinaria'|'extraordinaria', category: '', estimatedValue: '', justification: '' });
  const [showAddLine, setShowAddLine] = useState<{ table: string; catIdx?: number } | null>(null);
  const [newLineName, setNewLineName] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const [history, setHistory] = useState([
    { action: 'Orçamento criado como rascunho', user: 'Tatiana Caracciolo', date: '15/01/2026 às 10:30' },
  ]);

  // Totals
  const totalArrecadacao = arrecadacao.reduce((s, r) => s + r.values.reduce((a, b) => a + b, 0), 0);
  const totalDespOrd = despOrdinarias.reduce((cs, c) => cs + c.lines.reduce((ls, l) => ls + l.values.reduce((a, b) => a + b, 0), 0), 0);
  const totalDespExtra = despExtraordinarias.reduce((cs, c) => cs + c.lines.reduce((ls, l) => ls + l.values.reduce((a, b) => a + b, 0), 0), 0);
  const totalDespesas = totalDespOrd + totalDespExtra;
  const fundoReserva = Math.round(totalArrecadacao * fundoReservaPct / 100);
  const fundoObras = Math.round(totalArrecadacao * fundoObrasPct / 100);
  const provisaoInadimplencia = Math.round(totalArrecadacao * inadimplenciaPct / 100);
  const resultado = totalArrecadacao - totalDespesas - fundoReserva - fundoObras;

  const monthlyData = months.map((m, i) => ({
    name: m,
    arrecadacao: arrecadacao.reduce((s, r) => s + r.values[i], 0),
    despOrd: despOrdinarias.reduce((cs, c) => cs + c.lines.reduce((ls, l) => ls + l.values[i], 0), 0),
    despExtra: despExtraordinarias.reduce((cs, c) => cs + c.lines.reduce((ls, l) => ls + l.values[i], 0), 0),
  }));

  const pieData = [
    ...despOrdinarias.map(c => ({ name: c.category, value: c.lines.reduce((s, l) => s + l.values.reduce((a, b) => a + b, 0), 0) })),
    ...despExtraordinarias.map(c => ({ name: c.category, value: c.lines.reduce((s, l) => s + l.values.reduce((a, b) => a + b, 0), 0) })),
    { name: 'Fundo de Reserva', value: fundoReserva },
    { name: 'Fundo de Obras', value: fundoObras },
  ].filter(d => d.value > 0);

  const statusBadge: Record<string, { label: string; cls: string }> = {
    draft: { label: 'Rascunho', cls: 'bg-muted text-muted-foreground' },
    pending: { label: 'Aguardando Aprovação', cls: 'bg-interactive/10 text-interactive' },
    approved: { label: 'Aprovado', cls: 'bg-success/10 text-success' },
    rejected: { label: 'Reprovado', cls: 'bg-destructive/10 text-destructive' },
  };

  const startEdit = (table: string, lineIdx: number, monthIdx: number, currentValue: number, catIdx?: number) => {
    if (isOwner) return;
    setEditingCell({ table, catIdx, lineIdx, monthIdx });
    setEditValue(String(currentValue));
  };

  const commitEdit = () => {
    if (!editingCell) return;
    const val = parseFloat(editValue) || 0;
    const { table, catIdx, lineIdx, monthIdx } = editingCell;
    if (table === 'arrec') {
      setArrecadacao(prev => { const n = prev.map(r => ({ ...r, values: [...r.values] })); n[lineIdx].values[monthIdx] = val; return n; });
    } else {
      const setter = table === 'ord' ? setDespOrdinarias : setDespExtraordinarias;
      setter(prev => prev.map((c, ci) => {
        if (ci !== catIdx) return c;
        return { ...c, lines: c.lines.map((l, li) => { if (li !== lineIdx) return l; const nv = [...l.values]; nv[monthIdx] = val; return { ...l, values: nv }; }) };
      }));
    }
    setEditingCell(null);
    toast.success('Valor atualizado');
  };

  const handleAddLine = () => {
    if (!showAddLine || !newLineName.trim()) return;
    const { table, catIdx } = showAddLine;
    if (table === 'arrec') {
      setArrecadacao(prev => [...prev, { name: newLineName.trim(), values: Array(12).fill(0) }]);
    } else {
      const setter = table === 'ord' ? setDespOrdinarias : setDespExtraordinarias;
      setter(prev => prev.map((c, ci) => ci !== catIdx ? c : { ...c, lines: [...c.lines, { name: newLineName.trim(), values: Array(12).fill(0) }] }));
    }
    setNewLineName(''); setShowAddLine(null); toast.success('Linha adicionada');
  };

  const handleSolicitar = () => {
    if (!solicitarForm.name.trim()) return;
    const setter = solicitarForm.type === 'ordinaria' ? setDespOrdinarias : setDespExtraordinarias;
    const cats = solicitarForm.type === 'ordinaria' ? despOrdinarias : despExtraordinarias;
    const targetCat = solicitarForm.category ? cats.findIndex(c => c.category === solicitarForm.category) : 0;
    const idx = targetCat >= 0 ? targetCat : 0;
    const val = parseFloat(solicitarForm.estimatedValue) || 0;
    setter(prev => prev.map((c, ci) => ci !== idx ? c : { ...c, lines: [...c.lines, { name: solicitarForm.name.trim(), values: Array(12).fill(val) }] }));
    setHistory(prev => [{ action: `Solicitação: "${solicitarForm.name}" — ${solicitarForm.type === 'ordinaria' ? 'Ordinária' : 'Extraordinária'}`, user: user.full_name, date: new Date().toLocaleString('pt-BR') }, ...prev]);
    toast.success('Despesa adicionada ao orçamento');
    setSolicitarForm({ name: '', type: 'ordinaria', category: '', estimatedValue: '', justification: '' });
    setShowSolicitar(false);
  };

  const handleSendApproval = () => { setStatus('pending'); setHistory(prev => [{ action: 'Orçamento enviado para aprovação do proprietário', user: user.full_name, date: new Date().toLocaleString('pt-BR') }, ...prev]); toast.success('Enviado para aprovação'); };
  const handleApprove = () => { setStatus('approved'); setHistory(prev => [{ action: 'Orçamento aprovado pelo proprietário', user: user.full_name, date: new Date().toLocaleString('pt-BR') }, ...prev]); toast.success('Orçamento aprovado!'); };
  const handleReject = () => {
    if (rejectReason.length < 10) { toast.error('Motivo mínimo de 10 caracteres'); return; }
    setStatus('rejected'); setHistory(prev => [{ action: `Reprovado — "${rejectReason}"`, user: user.full_name, date: new Date().toLocaleString('pt-BR') }, ...prev]);
    toast.info('Orçamento reprovado'); setRejectReason(''); setShowReject(false);
  };

  const renderCell = (value: number, table: string, lineIdx: number, monthIdx: number, catIdx?: number) => {
    const isEditing = editingCell?.table === table && editingCell.lineIdx === lineIdx && editingCell.monthIdx === monthIdx && editingCell.catIdx === catIdx;
    if (isEditing) {
      return (
        <Input type="number" value={editValue} onChange={e => setEditValue(e.target.value)}
          onBlur={commitEdit} onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingCell(null); }}
          className="h-7 w-20 text-right text-xs p-1" autoFocus />
      );
    }
    return (
      <button onClick={() => startEdit(table, lineIdx, monthIdx, value, catIdx)}
        className={`text-right text-xs w-full group flex items-center justify-end gap-1 ${isOwner ? 'cursor-default' : 'cursor-pointer hover:text-interactive'}`} disabled={isOwner}>
        <span>{formatK(value)}</span>
        {!isOwner && <Pencil size={10} className="opacity-0 group-hover:opacity-50" />}
      </button>
    );
  };

  const renderExpenseTable = (categories: ExpenseCategory[], tableKey: string, setter: React.Dispatch<React.SetStateAction<ExpenseCategory[]>>) => (
    <table className="mobile-annual-table w-full text-sm">
      <thead>
        <tr className="border-b">
          <th className="text-left py-2 px-2 text-xs font-semibold text-muted-foreground min-w-[220px]">Item</th>
          {months.map(m => <th key={m} className="text-right py-2 px-2 text-xs font-semibold text-muted-foreground w-[72px]">{m}</th>)}
          <th className="text-right py-2 px-2 text-xs font-bold text-foreground w-[80px]">Total</th>
        </tr>
      </thead>
      <tbody>
        {categories.map((cat, ci) => (
          <> 
            <tr key={`cat-${ci}`} className="bg-muted/20">
              <td colSpan={14} className="py-2 px-2 font-semibold text-foreground text-xs uppercase tracking-wide">{cat.category}</td>
            </tr>
            {cat.lines.map((line, li) => (
              <tr key={`${ci}-${li}`} className="border-b border-border/20 hover:bg-muted/10">
                <td className="py-1.5 px-2 pl-6 text-muted-foreground text-xs">{line.name}</td>
                {line.values.map((v, j) => <td key={j} className="py-1.5 px-2">{renderCell(v, tableKey, li, j, ci)}</td>)}
                <td className="py-1.5 px-2 text-right font-medium text-xs">{formatK(line.values.reduce((a,b)=>a+b,0))}</td>
              </tr>
            ))}
            {!isOwner && (
              <tr><td colSpan={14} className="py-1 px-2 pl-6">
                <Button variant="ghost" size="sm" className="text-xs gap-1 h-6" onClick={() => setShowAddLine({ table: tableKey, catIdx: ci })}><Plus size={10} />Adicionar linha</Button>
              </td></tr>
            )}
          </>
        ))}
        <tr className="bg-muted/30 font-bold">
          <td className="py-2 px-2 text-xs">TOTAL</td>
          {months.map((_, i) => <td key={i} className="py-2 px-2 text-right text-xs">{formatK(categories.reduce((cs,c)=>cs+c.lines.reduce((ls,l)=>ls+l.values[i],0),0))}</td>)}
          <td className="py-2 px-2 text-right text-xs">{formatK(categories.reduce((cs,c)=>cs+c.lines.reduce((ls,l)=>ls+l.values.reduce((a,b)=>a+b,0),0),0))}</td>
        </tr>
      </tbody>
    </table>
  );

  // Projetado vs Realizado
  const allExpenseLines = [...despOrdinarias.flatMap(c => c.lines), ...despExtraordinarias.flatMap(c => c.lines)];
  const allCategories = [...despOrdinarias.map(c => ({ cat: c.category, total: c.lines.reduce((s,l) => s + l.values.reduce((a,b)=>a+b,0),0) })),
    ...despExtraordinarias.map(c => ({ cat: c.category, total: c.lines.reduce((s,l) => s + l.values.reduce((a,b)=>a+b,0),0) }))];
  const realizedCategories = allCategories.map(c => ({ ...c, realizado: Math.round(c.total * (3/12) * (0.85 + Math.random()*0.3)), meses: 3 }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Orçamento Anual — {year}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusBadge[status].cls}`}>{statusBadge[status].label}</span>
            <span className="text-xs text-muted-foreground">360JK — Administradora</span>
          </div>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center sm:flex-wrap">
          <select value={year} onChange={e => setYear(+e.target.value)} className="border rounded-lg px-3 py-2 text-sm bg-card">
            {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {!isOwner && <Button variant="outline" className="gap-2" onClick={() => setShowSolicitar(true)}><Plus size={14} />Solicitar Despesa</Button>}
          <Button variant="outline" className="gap-2"><Download size={14} />Exportar PDF</Button>
          {!isOwner && (status === 'draft' || status === 'rejected') && (
            <Button className="premium-gradient gap-2" onClick={handleSendApproval}><Send size={14} />Enviar para Aprovação</Button>
          )}
          {isOwner && status === 'pending' && (
            <>
              <Button className="bg-success hover:bg-success/90 gap-2" onClick={handleApprove}><CheckCircle2 size={14} />Aprovar</Button>
              <Button variant="destructive" className="gap-2" onClick={() => setShowReject(true)}><XCircle size={14} />Reprovar</Button>
            </>
          )}
        </div>
      </div>

      {status === 'rejected' && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-4"><p className="text-sm font-semibold text-destructive">⚠️ Orçamento Reprovado</p>
          <p className="text-sm text-muted-foreground mt-1">{history.find(h => h.action.startsWith('Reprovado'))?.action}</p></CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <Card><CardContent className="pt-5"><div className="flex items-center gap-2"><div className="p-2 rounded-xl bg-success/10"><TrendingUp size={18} className="text-success" /></div><div><p className="text-[10px] text-muted-foreground uppercase">Arrecadação</p><p className="text-lg font-bold">R$ {formatBRL(totalArrecadacao)}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="flex items-center gap-2"><div className="p-2 rounded-xl bg-destructive/10"><TrendingDown size={18} className="text-destructive" /></div><div><p className="text-[10px] text-muted-foreground uppercase">Despesas Totais</p><p className="text-lg font-bold">R$ {formatBRL(totalDespesas)}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="flex items-center gap-2"><div className="p-2 rounded-xl bg-interactive/10"><PiggyBank size={18} className="text-interactive" /></div><div><p className="text-[10px] text-muted-foreground uppercase">Fundo Reserva ({fundoReservaPct}%)</p><p className="text-lg font-bold">R$ {formatBRL(fundoReserva)}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="flex items-center gap-2"><div className="p-2 rounded-xl bg-warning/10"><Landmark size={18} className="text-warning" /></div><div><p className="text-[10px] text-muted-foreground uppercase">Fundo Obras ({fundoObrasPct}%)</p><p className="text-lg font-bold">R$ {formatBRL(fundoObras)}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="flex items-center gap-2"><div className={`p-2 rounded-xl ${resultado >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}><DollarSign size={18} className={resultado >= 0 ? 'text-success' : 'text-destructive'} /></div><div><p className="text-[10px] text-muted-foreground uppercase">Resultado</p><p className={`text-lg font-bold ${resultado >= 0 ? 'text-success' : 'text-destructive'}`}>R$ {formatBRL(resultado)}</p></div></div></CardContent></Card>
      </div>

      {/* Provisão de Inadimplência info */}
      <div className="flex items-center gap-3 p-3 bg-warning/5 border border-warning/20 rounded-xl">
        <AlertTriangle size={16} className="text-warning shrink-0" />
        <p className="text-xs text-muted-foreground">
          <strong>Provisão de Inadimplência ({inadimplenciaPct}%):</strong> R$ {formatBRL(provisaoInadimplencia)} reservados para cobrir atrasos na arrecadação condominial.
          {!isOwner && <button className="text-interactive ml-2 underline" onClick={() => { const v = prompt('Percentual de inadimplência (%)', String(inadimplenciaPct)); if (v) setInadimplenciaPct(parseFloat(v) || 5); }}>Alterar</button>}
        </p>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Arrecadação vs. Despesas por Mês</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v/1000}k`} />
                <Tooltip formatter={(v: number) => `R$ ${formatBRL(v)}`} />
                <Bar dataKey="arrecadacao" fill="hsl(var(--success))" radius={[4,4,0,0]} name="Arrecadação" />
                <Bar dataKey="despOrd" fill="hsl(var(--interactive))" radius={[4,4,0,0]} name="Desp. Ordinárias" />
                <Bar dataKey="despExtra" fill="hsl(var(--warning))" radius={[4,4,0,0]} name="Desp. Extraordinárias" />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Distribuição de Despesas + Fundos</CardTitle></CardHeader>
          <CardContent>
              <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="shrink-0 w-[160px] h-[160px] sm:w-[200px] sm:h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RPieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} innerRadius={40} paddingAngle={1} stroke="none">
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => `R$ ${formatBRL(v)}`} />
                  </RPieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-1.5 min-w-0">
                {pieData.map((entry, i) => {
                  const total = pieData.reduce((s, e) => s + e.value, 0);
                  const pct = total > 0 ? ((entry.value / total) * 100).toFixed(0) : '0';
                  return (
                    <div key={i} className="flex items-center gap-2 text-[11px] leading-tight">
                      <span className="shrink-0 w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="truncate text-muted-foreground">{entry.name}</span>
                      <span className="shrink-0 font-semibold text-foreground">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full overflow-x-auto flex-nowrap justify-start">
          <TabsTrigger value="arrecadacao" className="whitespace-nowrap text-xs sm:text-sm">💰 Arrecadação</TabsTrigger>
          <TabsTrigger value="ordinarias" className="whitespace-nowrap text-xs sm:text-sm">📋 Ordinárias</TabsTrigger>
          <TabsTrigger value="extraordinarias" className="whitespace-nowrap text-xs sm:text-sm">🔧 Extraordinárias</TabsTrigger>
          <TabsTrigger value="fundos" className="whitespace-nowrap text-xs sm:text-sm">🏦 Fundos</TabsTrigger>
          <TabsTrigger value="projetado" className="whitespace-nowrap text-xs sm:text-sm">📊 Proj. vs Real.</TabsTrigger>
          <TabsTrigger value="historico" className="whitespace-nowrap text-xs sm:text-sm">📝 Histórico</TabsTrigger>
        </TabsList>

        {/* Arrecadação */}
        <TabsContent value="arrecadacao">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign size={16} className="text-success" />Arrecadação Condominial — Cotas dos Locatários
              </CardTitle>
              <p className="text-xs text-muted-foreground">Rateio da cota condominial paga mensalmente por cada locatário</p>
            </CardHeader>
            <CardContent className="overflow-hidden sm:overflow-x-auto">
              <table className="mobile-annual-table w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 text-xs font-semibold text-muted-foreground min-w-[220px]">Locatário</th>
                    {months.map(m => <th key={m} className="text-right py-2 px-2 text-xs font-semibold text-muted-foreground w-[72px]">{m}</th>)}
                    <th className="text-right py-2 px-2 text-xs font-bold text-foreground w-[80px]">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {arrecadacao.map((r, i) => (
                    <tr key={i} className="border-b border-border/30 hover:bg-muted/10">
                      <td className="py-1.5 px-2 text-xs">{r.name}</td>
                      {r.values.map((v, j) => <td key={j} className="py-1.5 px-2">{renderCell(v, 'arrec', i, j)}</td>)}
                      <td className="py-1.5 px-2 text-right font-semibold text-xs">{formatK(r.values.reduce((a,b)=>a+b,0))}</td>
                    </tr>
                  ))}
                  <tr className="bg-muted/30 font-bold">
                    <td className="py-2 px-2 text-xs">TOTAL ARRECADAÇÃO</td>
                    {months.map((_, i) => <td key={i} className="py-2 px-2 text-right text-xs">{formatK(arrecadacao.reduce((s,r)=>s+r.values[i],0))}</td>)}
                    <td className="py-2 px-2 text-right text-xs">{formatK(totalArrecadacao)}</td>
                  </tr>
                </tbody>
              </table>
              {!isOwner && <Button variant="ghost" size="sm" className="mt-2 gap-1 text-xs" onClick={() => setShowAddLine({ table: 'arrec' })}><Plus size={12} />Adicionar Locatário</Button>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Despesas Ordinárias */}
        <TabsContent value="ordinarias">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingDown size={16} className="text-interactive" />Despesas Ordinárias (Recorrentes)
              </CardTitle>
              <p className="text-xs text-muted-foreground">Despesas mensais de operação do condomínio</p>
            </CardHeader>
            <CardContent className="overflow-hidden sm:overflow-x-auto">
              {renderExpenseTable(despOrdinarias, 'ord', setDespOrdinarias)}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Despesas Extraordinárias */}
        <TabsContent value="extraordinarias">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Landmark size={16} className="text-warning" />Despesas Extraordinárias (Obras, CAPEX)
              </CardTitle>
              <p className="text-xs text-muted-foreground">Investimentos de grande porte e obras planejadas</p>
            </CardHeader>
            <CardContent className="overflow-hidden sm:overflow-x-auto">
              {renderExpenseTable(despExtraordinarias, 'extra', setDespExtraordinarias)}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fundos */}
        <TabsContent value="fundos">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><PiggyBank size={16} className="text-interactive" />Fundo de Reserva</CardTitle></CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">Percentual da arrecadação reservado para imprevistos e emergências (obrigatório por lei).</p>
                <div className="flex items-center gap-2 mb-3">
                  <Label className="text-xs w-20">Percentual:</Label>
                  {!isOwner ? (
                    <Input type="number" value={fundoReservaPct} onChange={e => setFundoReservaPct(parseFloat(e.target.value) || 0)} className="h-8 w-20 text-sm" min={0} max={100} />
                  ) : <span className="font-semibold">{fundoReservaPct}%</span>}
                  <span className="text-xs text-muted-foreground">da arrecadação</span>
                </div>
                <div className="p-3 bg-interactive/5 rounded-lg border border-interactive/20">
                  <p className="text-xs text-muted-foreground">Valor Anual</p>
                  <p className="text-xl font-bold text-interactive">R$ {formatBRL(fundoReserva)}</p>
                  <p className="text-xs text-muted-foreground">≈ R$ {formatBRL(Math.round(fundoReserva/12))}/mês</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Landmark size={16} className="text-warning" />Fundo de Obras</CardTitle></CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">Fundo para obras planejadas de grande vulto, rateado entre os condôminos.</p>
                <div className="flex items-center gap-2 mb-3">
                  <Label className="text-xs w-20">Percentual:</Label>
                  {!isOwner ? (
                    <Input type="number" value={fundoObrasPct} onChange={e => setFundoObrasPct(parseFloat(e.target.value) || 0)} className="h-8 w-20 text-sm" min={0} max={100} />
                  ) : <span className="font-semibold">{fundoObrasPct}%</span>}
                  <span className="text-xs text-muted-foreground">da arrecadação</span>
                </div>
                <div className="p-3 bg-warning/5 rounded-lg border border-warning/20">
                  <p className="text-xs text-muted-foreground">Valor Anual</p>
                  <p className="text-xl font-bold text-warning">R$ {formatBRL(fundoObras)}</p>
                  <p className="text-xs text-muted-foreground">≈ R$ {formatBRL(Math.round(fundoObras/12))}/mês</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle size={16} className="text-destructive" />Provisão de Inadimplência</CardTitle></CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">Margem de segurança para cobrir possíveis atrasos nas cotas condominiais.</p>
                <div className="flex items-center gap-2 mb-3">
                  <Label className="text-xs w-20">Percentual:</Label>
                  {!isOwner ? (
                    <Input type="number" value={inadimplenciaPct} onChange={e => setInadimplenciaPct(parseFloat(e.target.value) || 0)} className="h-8 w-20 text-sm" min={0} max={100} />
                  ) : <span className="font-semibold">{inadimplenciaPct}%</span>}
                  <span className="text-xs text-muted-foreground">da arrecadação</span>
                </div>
                <div className="p-3 bg-destructive/5 rounded-lg border border-destructive/20">
                  <p className="text-xs text-muted-foreground">Valor Anual</p>
                  <p className="text-xl font-bold text-destructive">R$ {formatBRL(provisaoInadimplencia)}</p>
                  <p className="text-xs text-muted-foreground">≈ R$ {formatBRL(Math.round(provisaoInadimplencia/12))}/mês</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rateio method info */}
          <Card className="mt-4">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Método de Rateio da Cota Condominial</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { name: 'Fração Ideal (Área)', desc: 'Proporcional à área de cada unidade. Quem tem mais m² paga mais.', badge: 'Padrão' },
                  { name: 'Cotas Iguais', desc: 'Todos os locatários pagam o mesmo valor independente da área.', badge: 'Igualitário' },
                  { name: 'Misto', desc: 'Algumas despesas por fração ideal, outras igualitariamente.', badge: 'Flexível' },
                ].map((m, i) => (
                  <div key={i} className={`p-4 rounded-xl border-2 ${i === 0 ? 'border-interactive bg-interactive/5' : 'border-border'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold">{m.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{m.badge}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{m.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projetado vs Realizado */}
        <TabsContent value="projetado">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <ShieldCheck size={16} className="text-success" />Projetado vs. Realizado — {year}
              </CardTitle>
              <p className="text-xs text-muted-foreground">Acompanhamento da execução orçamentária por categoria (dados até Mar/{year})</p>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Categoria</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Orçado Anual</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Realizado (Jan-Mar)</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">% Executado</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Desvio</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {realizedCategories.map((c, i) => {
                    const expectedPct = (3/12) * 100; // 25% expected at month 3
                    const actualPct = c.total > 0 ? (c.realizado / c.total) * 100 : 0;
                    const desvio = c.realizado - Math.round(c.total * 3/12);
                    const statusLabel = actualPct > expectedPct * 1.15 ? 'Acima' : actualPct < expectedPct * 0.85 ? 'Abaixo' : 'Normal';
                    const statusCls = statusLabel === 'Acima' ? 'bg-destructive/10 text-destructive' : statusLabel === 'Abaixo' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground';
                    return (
                      <tr key={i} className="border-b border-border/30 hover:bg-muted/10">
                        <td className="py-2 px-3 text-xs font-medium">{c.cat}</td>
                        <td className="py-2 px-3 text-right text-xs">R$ {formatBRL(c.total)}</td>
                        <td className="py-2 px-3 text-right text-xs">R$ {formatBRL(c.realizado)}</td>
                        <td className="py-2 px-3 text-right text-xs">{actualPct.toFixed(1)}%</td>
                        <td className={`py-2 px-3 text-right text-xs font-medium ${desvio > 0 ? 'text-destructive' : 'text-success'}`}>{desvio > 0 ? '+' : ''}{formatBRL(desvio)}</td>
                        <td className="py-2 px-3 text-center"><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusCls}`}>{statusLabel}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="mt-6">
                <h4 className="text-sm font-semibold mb-3">Evolução Mensal: Orçado vs Realizado</h4>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={months.slice(0, 3).map((m, i) => ({
                    name: m,
                    orcado: monthlyData[i].despOrd + monthlyData[i].despExtra,
                    realizado: Math.round((monthlyData[i].despOrd + monthlyData[i].despExtra) * (0.85 + Math.random()*0.3)),
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v/1000}k`} />
                    <Tooltip formatter={(v: number) => `R$ ${formatBRL(v)}`} />
                    <Bar dataKey="orcado" fill="hsl(var(--interactive))" radius={[4,4,0,0]} name="Orçado" />
                    <Bar dataKey="realizado" fill="hsl(var(--success))" radius={[4,4,0,0]} name="Realizado" />
                    <Legend />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Histórico */}
        <TabsContent value="historico">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {history.map((h, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg">
                    <MessageSquare size={16} className="text-interactive mt-0.5 shrink-0" />
                    <div><p className="text-sm font-medium">{h.action}</p><p className="text-xs text-muted-foreground">{h.user} • {h.date}</p></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Solicitar Despesa Dialog */}
      <Dialog open={showSolicitar} onOpenChange={setShowSolicitar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar Nova Despesa</DialogTitle>
            <DialogDescription>Adicione uma despesa ao orçamento para aprovação.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome da Despesa *</Label>
              <Input placeholder="Ex: Manutenção do telhado" value={solicitarForm.name} onChange={e => setSolicitarForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tipo</Label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm bg-card" value={solicitarForm.type} onChange={e => setSolicitarForm(p => ({ ...p, type: e.target.value as any }))}>
                <option value="ordinaria">Despesa Ordinária (recorrente)</option>
                <option value="extraordinaria">Despesa Extraordinária (pontual/CAPEX)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Categoria</Label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm bg-card" value={solicitarForm.category} onChange={e => setSolicitarForm(p => ({ ...p, category: e.target.value }))}>
                <option value="">Selecionar...</option>
                {(solicitarForm.type === 'ordinaria' ? despOrdinarias : despExtraordinarias).map(c => <option key={c.category} value={c.category}>{c.category}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Valor Mensal Estimado (R$)</Label>
              <Input type="number" placeholder="0" value={solicitarForm.estimatedValue} onChange={e => setSolicitarForm(p => ({ ...p, estimatedValue: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Justificativa</Label>
              <Textarea placeholder="Por que esta despesa é necessária..." value={solicitarForm.justification} onChange={e => setSolicitarForm(p => ({ ...p, justification: e.target.value }))} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSolicitar(false)}>Cancelar</Button>
            <Button className="premium-gradient" onClick={handleSolicitar}>Adicionar ao Orçamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Line Dialog */}
      <Dialog open={!!showAddLine} onOpenChange={() => setShowAddLine(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adicionar Linha</DialogTitle><DialogDescription>Crie uma nova linha no orçamento.</DialogDescription></DialogHeader>
          <div className="space-y-1.5 py-2">
            <Label className="text-xs">Nome</Label>
            <Input placeholder="Ex: Nova despesa..." value={newLineName} onChange={e => setNewLineName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAddLine(); }} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddLine(null)}>Cancelar</Button>
            <Button className="premium-gradient" onClick={handleAddLine}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showReject} onOpenChange={setShowReject}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reprovar Orçamento</DialogTitle><DialogDescription>Informe o motivo da reprovação.</DialogDescription></DialogHeader>
          <div className="space-y-1.5 py-2">
            <Label className="text-xs">Motivo *</Label>
            <Textarea placeholder="Mínimo 10 caracteres..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={4} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReject(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleReject}>Confirmar Reprovação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orcamento;
