// Serviço de exportação — Excel (.xlsx) e OFX.
// O mapeamento campo→coluna é isolado abaixo (TEMPLATE_PADRAO).
// Para plugar o template do cliente, basta substituir TEMPLATE_PADRAO ou
// passar `template` ao chamar `exportExcel`.

import * as XLSX from "xlsx";

export type ColumnDef<T> = {
  header: string;
  get: (row: T) => string | number | null | undefined;
};

export type ExportTemplate<T> = {
  sheetName: string;
  columns: ColumnDef<T>[];
};

export type ExcelExportInput = {
  fileName: string;
  sheets: { sheetName: string; columns: ColumnDef<any>[]; rows: any[] }[];
};

/* ============================================================
 * TEMPLATE PADRÃO (MODELO TESTE)
 * ------------------------------------------------------------
 * Substitua/estenda estes objetos pelo template específico
 * do cliente quando o formato deles for entregue.
 * O ponto de substituição fica aqui — toda a UI consome
 * estas constantes via os builders abaixo.
 * ============================================================ */

export const TEMPLATE_PADRAO = {
  cobrancas: {
    sheetName: "Cobranças",
    columns: [
      { header: "Fundo",              get: (r: any) => r.fundo ?? "" },
      { header: "Ativo",           get: (r: any) => r.edificio ?? "" },
      { header: "Unidade",            get: (r: any) => r.unidade ?? "" },
      { header: "Contrato",           get: (r: any) => r.contrato ?? "" },
      { header: "Locatário",          get: (r: any) => r.locatario ?? "" },
      { header: "Competência",        get: (r: any) => r.competencia ?? "" },
      { header: "Categoria",          get: (r: any) => r.categoria ?? "" },
      { header: "Valor esperado",     get: (r: any) => r.valorEsperado ?? 0 },
      { header: "Valor cobrado",      get: (r: any) => r.valorCobrado ?? 0 },
      { header: "Valor recebido",     get: (r: any) => r.valorRecebido ?? 0 },
      { header: "Status",             get: (r: any) => r.status ?? "" },
      { header: "Vencimento",         get: (r: any) => r.vencimento ?? "" },
      { header: "Pago em",            get: (r: any) => r.pagoEm ?? "" },
    ],
  } satisfies ExportTemplate<any>,

  entradas: {
    sheetName: "Entradas bancárias",
    columns: [
      { header: "Data",            get: (r: any) => r.data ?? "" },
      { header: "Tipo",            get: (r: any) => r.tipo ?? "" },
      { header: "Pagador",         get: (r: any) => r.pagador ?? "" },
      { header: "Documento",       get: (r: any) => r.documento ?? "" },
      { header: "Valor",           get: (r: any) => r.valor ?? 0 },
      { header: "Identificador",   get: (r: any) => r.identificador ?? "" },
      { header: "Descrição",       get: (r: any) => r.descricao ?? "" },
      { header: "Vinculada",       get: (r: any) => r.vinculada ?? "" },
    ],
  } satisfies ExportTemplate<any>,

  /* Cobranças preparadas — base para o futuro layout bancário/CNAB da Patria.
     Quando o layout for definido, substitua as colunas abaixo. */
  cobrancasPreparadas: {
    sheetName: "Cobranças preparadas",
    columns: [
      { header: "Identificador",  get: (r: any) => r.identificador ?? "" },
      { header: "Competência",    get: (r: any) => r.competencia ?? "" },
      { header: "Fundo",          get: (r: any) => r.fundo ?? "" },
      { header: "Ativo",          get: (r: any) => r.edificio ?? "" },
      { header: "Contrato",       get: (r: any) => r.contrato ?? "" },
      { header: "Locatário",      get: (r: any) => r.locatario ?? "" },
      { header: "Documento",      get: (r: any) => r.documento ?? "" },
      { header: "Unidade",        get: (r: any) => r.unidade ?? "" },
      { header: "Valor esperado", get: (r: any) => r.valorEsperado ?? 0 },
      { header: "Vencimento",     get: (r: any) => r.vencimento ?? "" },
      { header: "Preparada em",   get: (r: any) => r.preparadaEm ?? "" },
      { header: "Grupo",          get: (r: any) => r.grupo ?? "" },
    ],
  } satisfies ExportTemplate<any>,

  despesas: {
    sheetName: "Despesas",
    columns: [
      { header: "Competência",       get: (r: any) => r.competencia ?? "" },
      { header: "Fundo",             get: (r: any) => r.fundo ?? "" },
      { header: "Ativo",             get: (r: any) => r.edificio ?? "" },
      { header: "Data",              get: (r: any) => r.data ?? "" },
      { header: "Categoria",         get: (r: any) => r.categoria ?? "" },
      { header: "Fornecedor",        get: (r: any) => r.fornecedor ?? "" },
      { header: "Descrição",         get: (r: any) => r.descricao ?? "" },
      { header: "Valor esperado",    get: (r: any) => r.valorEsperado ?? 0 },
      { header: "Valor realizado",   get: (r: any) => r.valorRealizado ?? 0 },
      { header: "Diferença",         get: (r: any) => r.diferenca ?? 0 },
      { header: "Data do pagamento", get: (r: any) => r.dataPagamento ?? "" },
      { header: "Status",            get: (r: any) => r.status ?? "" },
    ],
  } satisfies ExportTemplate<any>,

  noi: {
    sheetName: "NOI",
    columns: [
      { header: "Competência",           get: (r: any) => r.competencia ?? "" },
      { header: "Receita Imobiliária",   get: (r: any) => r.receita ?? 0 },
      { header: "Despesas Imobiliárias", get: (r: any) => r.despesas ?? 0 },
      { header: "NOI",                   get: (r: any) => r.noi ?? 0 },
      { header: "Margem NOI (%)",        get: (r: any) => r.margem ?? 0 },
    ],
  } satisfies ExportTemplate<any>,

  fechamento: {
    sheetName: "Fechamento Mensal",
    columns: [
      { header: "Competência",     get: (r: any) => r.competencia ?? "" },
      { header: "Aluguel esperado",get: (r: any) => r.aluguelEsp ?? 0 },
      { header: "IPTU esperado",   get: (r: any) => r.iptuEsp ?? 0 },
      { header: "Ajustes",         get: (r: any) => r.ajustes ?? 0 },
      { header: "Esperado total",  get: (r: any) => r.esperado ?? 0 },
      { header: "Aluguel recebido",get: (r: any) => r.aluguelRec ?? 0 },
      { header: "IPTU recebido",   get: (r: any) => r.iptuRec ?? 0 },
      { header: "Multa",           get: (r: any) => r.multa ?? 0 },
      { header: "Juros",           get: (r: any) => r.juros ?? 0 },
      { header: "Recebido total",  get: (r: any) => r.recebido ?? 0 },
      { header: "Em aberto",       get: (r: any) => r.aberto ?? 0 },
      { header: "% recebido",      get: (r: any) => r.pct ?? 0 },
    ],
  } satisfies ExportTemplate<any>,

  inadimplencia: {
    sheetName: "Inadimplência",
    columns: [
      { header: "Ativo",            get: (r: any) => r.edificio ?? "" },
      { header: "Locatário",        get: (r: any) => r.locatario ?? "" },
      { header: "Unidade",          get: (r: any) => r.unidade ?? "" },
      { header: "Competência",      get: (r: any) => r.competencia ?? "" },
      { header: "Vencimento",       get: (r: any) => r.vencimento ?? "" },
      { header: "Valor esperado",   get: (r: any) => r.valorEsperado ?? 0 },
      { header: "Valor recebido",   get: (r: any) => r.valorRecebido ?? 0 },
      { header: "Valor em aberto",  get: (r: any) => r.valorAberto ?? 0 },
      { header: "Dias em atraso",   get: (r: any) => r.dias ?? 0 },
      { header: "Multa",            get: (r: any) => r.multa ?? 0 },
      { header: "Juros",            get: (r: any) => r.juros ?? 0 },
      { header: "Total devido",     get: (r: any) => r.total ?? 0 },
      { header: "Último contato",   get: (r: any) => r.ultimoContato ?? "" },
      { header: "Status",           get: (r: any) => r.status ?? "" },
    ],
  } satisfies ExportTemplate<any>,

  outrosRecebimentos: {
    sheetName: "Outros recebimentos",
    columns: [
      { header: "ID",                get: (r: any) => r.id ?? "" },
      { header: "Categoria",         get: (r: any) => r.categoria ?? "" },
      { header: "Descrição",         get: (r: any) => r.descricao ?? "" },
      { header: "Fundo",             get: (r: any) => r.fundo ?? "" },
      { header: "Ativo",             get: (r: any) => r.edificio ?? "" },
      { header: "Contraparte",       get: (r: any) => r.contraparte ?? "" },
      { header: "Valor total",       get: (r: any) => r.valorTotal ?? 0 },
      { header: "Recebido",          get: (r: any) => r.recebido ?? 0 },
      { header: "Parcelas",          get: (r: any) => r.parcelas ?? "" },
      { header: "Status",            get: (r: any) => r.status ?? "" },
      { header: "Compõe Receita",    get: (r: any) => r.compoeReceita ?? "" },
      { header: "Compõe Inadimplência", get: (r: any) => r.compoeInadimplencia ?? "" },
      { header: "Origem",            get: (r: any) => r.origem ?? "" },
    ],
  } satisfies ExportTemplate<any>,
};

/* ============================================================
 * EXCEL
 * ============================================================ */

export function exportExcel(input: ExcelExportInput) {
  const wb = XLSX.utils.book_new();
  for (const s of input.sheets) {
    const data = [
      s.columns.map((c) => c.header),
      ...s.rows.map((row) => s.columns.map((c) => c.get(row) ?? "")),
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, s.sheetName.slice(0, 31));
  }
  XLSX.writeFile(wb, input.fileName.endsWith(".xlsx") ? input.fileName : input.fileName + ".xlsx");
}

/* ============================================================
 * OFX (formato simplificado, suficiente para importação básica)
 * ============================================================ */

export type OfxTransaction = {
  date: string;          // YYYY-MM-DD
  amount: number;        // positivo = crédito; negativo = débito
  memo: string;
  fitid: string;         // ID único da transação
  type?: "CREDIT" | "DEBIT";
};

export function exportOFX(opts: {
  fileName: string;
  bankId?: string;
  accountId?: string;
  transactions: OfxTransaction[];
}) {
  const { fileName, bankId = "0000", accountId = "0000-0", transactions } = opts;
  const dt = (s: string) => s.replace(/-/g, "") + "120000";
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  const txs = transactions
    .map((t) => {
      const type = t.type ?? (t.amount >= 0 ? "CREDIT" : "DEBIT");
      return `<STMTTRN>
<TRNTYPE>${type}
<DTPOSTED>${dt(t.date)}
<TRNAMT>${t.amount.toFixed(2)}
<FITID>${t.fitid}
<MEMO>${escapeOfx(t.memo)}
</STMTTRN>`;
    })
    .join("\n");

  const ofx = `OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<OFX>
<BANKMSGSRSV1>
<STMTTRNRS>
<TRNUID>1
<STATUS><CODE>0<SEVERITY>INFO</STATUS>
<STMTRS>
<CURDEF>BRL
<BANKACCTFROM>
<BANKID>${bankId}
<ACCTID>${accountId}
<ACCTTYPE>CHECKING
</BANKACCTFROM>
<BANKTRANLIST>
<DTSTART>${today}
<DTEND>${today}
${txs}
</BANKTRANLIST>
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>`;

  downloadText(fileName.endsWith(".ofx") ? fileName : fileName + ".ofx", ofx);
}

function escapeOfx(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function downloadText(fileName: string, content: string) {
  const blob = new Blob([content], { type: "application/x-ofx" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
