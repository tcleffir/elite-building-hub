import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Download, Landmark, RefreshCw, AlertTriangle } from "lucide-react";
import { getHGRE11PortfolioBuildings } from "@/lib/mock-data";
import { COMPETENCIAS, CURRENT_COMPETENCIA, competenciaLabel } from "@/lib/portfolio-competencia";
import { exportExcel } from "@/lib/export-service";
import { toast } from "sonner";

const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

type ParcelaStatus = "pago" | "aberto" | "vencido";

interface IptuRow {
  buildingId: string;
  building: string;
  city: string;
  inscricao: string;
  areaM2: number;
  valorAnual: number;
  parcelas: number;
  parcelaAtual: number;
  valorParcela: number;
  status: ParcelaStatus;
  vencimento: string;
  origem: "API Prefeitura" | "Controle interno";
}

/** Base determinística por ativo (proporcional à ABL) — substituível pela API da prefeitura. */
const buildRows = (competencia: string): IptuRow[] => {
  const [yearStr, monthStr] = competencia.split("-");
  const month = Number(monthStr);
  return getHGRE11PortfolioBuildings().map((b, i) => {
    const area = b.gla_m2 ?? b.total_area_m2;
    const valorAnual = Math.round(area * (38 + (i % 5) * 3.5));
    const parcelas = 10;
    const parcelaAtual = Math.min(month, parcelas);
    const status: ParcelaStatus = i % 7 === 0 ? "vencido" : i % 3 === 0 ? "aberto" : "pago";
    return {
      buildingId: b.id,
      building: b.name,
      city: `${b.city}/${b.state}`,
      inscricao: `${100 + i}.${(234 + i * 7).toString().padStart(3, "0")}.${(10 + i).toString().padStart(4, "0")}-${i % 10}`,
      areaM2: area,
      valorAnual,
      parcelas,
      parcelaAtual,
      valorParcela: Math.round(valorAnual / parcelas),
      status,
      vencimento: `10/${monthStr}/${yearStr}`,
      origem: i % 4 === 0 ? "Controle interno" : "API Prefeitura",
    };
  });
};

const statusBadge: Record<ParcelaStatus, { label: string; className: string }> = {
  pago: { label: "Pago", className: "bg-emerald-100 text-emerald-700" },
  aberto: { label: "Em aberto", className: "bg-amber-100 text-amber-700" },
  vencido: { label: "Vencido", className: "bg-red-100 text-red-700" },
};

const ProprietarioIPTU = () => {
  const [competencia, setCompetencia] = useState(CURRENT_COMPETENCIA);
  const [ativo, setAtivo] = useState("all");
  const [status, setStatus] = useState<"all" | ParcelaStatus>("all");

  const rows = useMemo(() => buildRows(competencia), [competencia]);
  const filtered = rows.filter(
    (r) => (ativo === "all" || r.buildingId === ativo) && (status === "all" || r.status === status),
  );

  const totalAnual = filtered.reduce((s, r) => s + r.valorAnual, 0);
  const totalParcela = filtered.reduce((s, r) => s + r.valorParcela, 0);
  const emAberto = filtered.filter((r) => r.status !== "pago");
  const custoM2 = filtered.reduce((s, r) => s + r.areaM2, 0)
    ? totalAnual / filtered.reduce((s, r) => s + r.areaM2, 0) / 12
    : 0;

  const handleExport = () => {
    exportExcel({
      fileName: `iptu-${competencia}`,
      sheetName: "IPTU",
      columns: [
        { key: "building", header: "Ativo" },
        { key: "city", header: "Município" },
        { key: "inscricao", header: "Inscrição imobiliária" },
        { key: "areaM2", header: "Área (m²)" },
        { key: "valorAnual", header: "IPTU anual (R$)" },
        { key: "valorParcela", header: "Parcela (R$)" },
        { key: "parcelaAtual", header: "Parcela nº" },
        { key: "parcelas", header: "Total parcelas" },
        { key: "status", header: "Status" },
        { key: "vencimento", header: "Vencimento" },
        { key: "origem", header: "Origem do dado" },
      ],
      rows: filtered,
    });
    toast.success("Planilha de IPTU exportada");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            <Landmark size={20} /> IPTU
          </h1>
          <p className="text-sm text-muted-foreground">
            Controle de IPTU por ativo — competência {competenciaLabel(competencia)}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => toast.info("Sincronização com a prefeitura pendente de credencial de acesso")}
          >
            <RefreshCw size={14} /> Sincronizar prefeitura
          </Button>
          <Button size="sm" className="gap-2" onClick={handleExport}>
            <Download size={14} /> Exportar Excel
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={competencia} onValueChange={setCompetencia}>
          <SelectTrigger className="w-[150px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            {COMPETENCIAS.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={ativo} onValueChange={setAtivo}>
          <SelectTrigger className="w-[220px] h-9 text-sm"><SelectValue placeholder="Ativo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os ativos</SelectItem>
            {getHGRE11PortfolioBuildings().map((b) => (
              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <SelectTrigger className="w-[160px] h-9 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="pago">Pago</SelectItem>
            <SelectItem value="aberto">Em aberto</SelectItem>
            <SelectItem value="vencido">Vencido</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "IPTU anual", value: brl(totalAnual) },
          { label: "Parcela da competência", value: brl(totalParcela) },
          { label: "Parcelas em aberto", value: `${emAberto.length} de ${filtered.length}` },
          { label: "Custo médio R$/m²/mês", value: brl(custoM2) },
        ].map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{k.label}</p>
              <p className="text-lg font-bold text-foreground mt-1">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {emAberto.some((r) => r.status === "vencido") && (
        <Card className="border-red-200 bg-red-50/60">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle size={18} className="text-red-600 shrink-0" />
            <p className="text-sm text-red-800">
              {emAberto.filter((r) => r.status === "vencido").length} parcela(s) de IPTU vencida(s) — regularizar junto à prefeitura.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 size={16} /> IPTU por ativo
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            <div className="hidden md:grid grid-cols-12 gap-2 px-5 py-2 text-xs font-medium text-muted-foreground text-left">
              <span className="col-span-3">Ativo</span>
              <span className="col-span-2">Inscrição</span>
              <span className="col-span-2">IPTU anual</span>
              <span className="col-span-2">Parcela</span>
              <span className="col-span-1">Venc.</span>
              <span className="col-span-2">Status / origem</span>
            </div>
            {filtered.map((r) => (
              <div key={r.buildingId} className="grid md:grid-cols-12 gap-2 px-5 py-3 text-sm text-left hover:bg-muted/50">
                <div className="md:col-span-3">
                  <p className="font-medium text-foreground">{r.building}</p>
                  <p className="text-xs text-muted-foreground">{r.city} — {r.areaM2.toLocaleString("pt-BR")} m²</p>
                </div>
                <span className="md:col-span-2 text-muted-foreground">{r.inscricao}</span>
                <span className="md:col-span-2 font-medium">{brl(r.valorAnual)}</span>
                <span className="md:col-span-2">
                  {brl(r.valorParcela)}
                  <span className="text-xs text-muted-foreground"> ({r.parcelaAtual}/{r.parcelas})</span>
                </span>
                <span className="md:col-span-1 text-muted-foreground">{r.vencimento}</span>
                <div className="md:col-span-2 flex items-center gap-2 flex-wrap">
                  <Badge className={statusBadge[r.status].className}>{statusBadge[r.status].label}</Badge>
                  <span className="text-xs text-muted-foreground">{r.origem}</span>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">Nenhum lançamento de IPTU para o filtro.</div>
            )}
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Valores exibidos a partir do controle interno da plataforma. Ao habilitar a integração com a prefeitura,
        a coluna de origem passa a indicar os lançamentos capturados automaticamente.
      </p>
    </div>
  );
};

export default ProprietarioIPTU;
