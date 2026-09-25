import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TenantContract } from "@/lib/mock-data";

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const pct = (v: number) => `${v.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}%`;

function monthlyValue(c: TenantContract) {
  return (c.price_per_m2 || 0) * c.area_m2;
}

function Frame({ title, subtitle, data }: { title: string; subtitle: string; data: { name: string; value: number }[] }) {
  return (
    <Card className="border-t-4 border-t-primary">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-foreground">{title}</CardTitle>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardHeader>
      <CardContent className="h-64 px-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} interval={0} />
            <YAxis tickFormatter={pct} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip formatter={(v: number) => [pct(v), "% da receita"]} />
            <Bar dataKey="value" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]}>
              <LabelList dataKey="value" position="top" formatter={(v: number) => (v > 0 ? pct(v) : "")} style={{ fontSize: 10, fill: "hsl(var(--foreground))" }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function MesReajusteChart({ contracts }: { contracts: TenantContract[] }) {
  const total = contracts.reduce((s, c) => s + monthlyValue(c), 0) || 1;
  const buckets = new Array(12).fill(0);
  contracts.forEach((c) => {
    const base = c.data_base_reajuste || c.contract_start;
    if (base) buckets[new Date(base).getMonth()] += monthlyValue(c);
  });
  const data = MONTHS.map((name, i) => ({ name, value: Math.round((buckets[i] / total) * 100) }));
  return <Frame title="Mês de Reajuste" subtitle="% da receita contratada por mês-base de reajuste" data={data} />;
}

export function ConcentracaoRevisionaisChart({ contracts }: { contracts: TenantContract[] }) {
  const total = contracts.reduce((s, c) => s + monthlyValue(c), 0) || 1;
  const year = new Date().getFullYear();
  const labels = ["Em aberto", String(year), String(year + 1), String(year + 2), String(year + 3), `${year + 4}+`];
  const buckets = new Array(6).fill(0);
  contracts.forEach((c) => {
    if (!c.contract_start) return;
    const s = new Date(c.contract_start);
    // revisional: a cada 3 anos de vigência (Lei 8.245/91, art. 19)
    let rev = new Date(s.getFullYear() + 3, s.getMonth(), s.getDate());
    const now = new Date();
    let idx: number;
    if (rev <= now) {
      // já elegível e não exercida → em aberto
      idx = 0;
    } else {
      const d = rev.getFullYear() - year;
      idx = Math.min(5, d + 1);
    }
    buckets[idx] += monthlyValue(c);
  });
  const data = labels.map((name, i) => ({ name, value: Math.round((buckets[i] / total) * 100) }));
  return <Frame title="Concentração das Revisionais" subtitle="% da receita contratada com revisional elegível por ano" data={data} />;
}
