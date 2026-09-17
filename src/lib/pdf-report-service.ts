import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { PATRIA_LOGO_WHITE_BASE64 } from '@/lib/patria-logo-base64'


// ── TOKENS DE DESIGN — Brand Kit Patria Real Estate ─────────
// Referência: Relatório Gerencial HGRE11 (azul royal Patria sobre branco,
// tipografia geométrica, blocos chapados sem gradiente).
export const PDF_COLORS = {
  navyDark:   [10,  22, 110]  as [number, number, number], // azul profundo Patria
  navyMed:    [27,  54, 214]  as [number, number, number], // azul royal Patria (marca)
  navyLight:  [58,  84, 226]  as [number, number, number],
  green:      [16,  185, 129] as [number, number, number],
  greenLight: [209, 250, 229] as [number, number, number],
  amber:      [249, 115, 22]  as [number, number, number], // laranja Patria (destaques)
  amberLight: [255, 237, 213] as [number, number, number],

  red:        [225, 29,  72]  as [number, number, number],
  redLight:   [254, 226, 226] as [number, number, number],
  blue:       [27,  54, 214]  as [number, number, number], // accent = azul Patria
  blueSoft:   [169, 189, 245] as [number, number, number], // azul claro dos subtítulos
  purple:     [139, 92,  246] as [number, number, number],
  purpleLight:[237, 233, 254] as [number, number, number],
  grayBg:     [246, 248, 252] as [number, number, number],
  grayLine:   [224, 230, 242] as [number, number, number],
  grayText:   [92,  106, 132] as [number, number, number],
  white:      [255, 255, 255] as [number, number, number],
  black:      [12,  18,  38]  as [number, number, number],
}

export interface ReportConfig {
  title: string
  subtitle: string
  period: string
  module: string
  gestorName: string
  fundName?: string
  logoUrl?: string
  tableOfContents: { page: number; title: string }[]
  previewKpis: { value: string; label: string }[]
}

export interface ReportSection {
  title: string
  type: 'table' | 'kpi-cards' | 'chart-image' | 'text' | 'alert-list'
  data?: any
  chartImageBase64?: string
  kpis?: { value: string; label: string; sub?: string; color?: number[] }[]
  tableHeaders?: string[]
  tableRows?: (string | number)[][]
  columnWidths?: number[]
  rowHealthCodes?: string[]
  totalRow?: (string | number)[]
  text?: string
  footnote?: string
}

// ── FUNÇÕES DE BAIXO NÍVEL ───────────────────────────────────

export function setupDoc(): jsPDF {
  return new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
}

export function drawCoverPage(doc: jsPDF, config: ReportConfig): void {
  const W = 210, H = 297, M = 18

  // Fundo navy
  doc.setFillColor(...PDF_COLORS.navyDark)
  doc.rect(0, 0, W, H, 'F')

  // Barra azul lateral
  doc.setFillColor(...PDF_COLORS.blue)
  doc.rect(0, 0, 5, H, 'F')

  // Faixa topo
  doc.setFillColor(...PDF_COLORS.navyMed)
  doc.rect(5, 0, W - 5, 10, 'F')

  // Logotipo oficial Patria (branco sobre o navy da capa)
  const lw = 52, lh = 10.1
  const lx = W - M - lw, ly = M
  try {
    doc.addImage(config.logoUrl || PATRIA_LOGO_WHITE_BASE64, 'PNG', lx, ly, lw, lh)
  } catch {
    doc.setFontSize(11)
    doc.setTextColor(...PDF_COLORS.white)
    doc.text('PATRIA', W - M, ly + 7, { align: 'right' })
  }


  // Accent line + Título
  const tx = M + 8, ty = H * 0.60

  doc.setFillColor(...PDF_COLORS.blue)
  doc.rect(tx, ty - 2, 12, 1.2, 'F')

  doc.setFontSize(27)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...PDF_COLORS.white)
  doc.text(config.title, tx, ty + 6)

  doc.setFontSize(13)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...PDF_COLORS.blueSoft)
  doc.text(config.subtitle, tx, ty + 14)

  doc.setFontSize(9.5)
  doc.setTextColor(100, 116, 135)
  doc.text(config.module + ' — ' + (config.fundName || config.gestorName), tx, ty + 22)

  // Badge período
  doc.setFillColor(...PDF_COLORS.navyMed)
  doc.roundedRect(tx, ty + 28, 58, 10, 3, 3, 'F')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...PDF_COLORS.white)
  doc.text('Período de Referência: ' + config.period, tx + 5, ty + 35)

  // Linha divisória
  doc.setDrawColor(30, 58, 95)
  doc.setLineWidth(0.5)
  doc.line(tx, ty + 44, W - M, ty + 44)

  // KPI Preview Cards
  const kx = tx, ky = ty + 50
  const kcount = config.previewKpis.length
  const kw = (W - M - tx - (kcount - 1) * 2) / kcount
  const kh = 20

  config.previewKpis.forEach((kpi, i) => {
    const cx = kx + i * (kw + 2)
    doc.setFillColor(...PDF_COLORS.navyLight)
    doc.roundedRect(cx, ky, kw, kh, 2.5, 2.5, 'F')
    doc.setFillColor(...PDF_COLORS.blue)
    doc.roundedRect(cx, ky, kw, 2, 2.5, 2.5, 'F')
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...PDF_COLORS.white)
    doc.text(kpi.value, cx + kw / 2, ky + 12, { align: 'center' })
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...PDF_COLORS.blueSoft)
    doc.text(kpi.label, cx + kw / 2, ky + 17, { align: 'center' })
  })

  // Índice lateral
  const ix = W - M - 56, iy = H * 0.38
  doc.setFillColor(...PDF_COLORS.navyMed)
  doc.roundedRect(ix, iy, 56, config.tableOfContents.length * 9 + 20, 3, 3, 'F')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...PDF_COLORS.white)
  doc.text('CONTEÚDO', ix + 5, iy + 10)
  doc.setDrawColor(...PDF_COLORS.blue)
  doc.setLineWidth(1.5)
  doc.line(ix + 5, iy + 13, ix + 51, iy + 13)

  config.tableOfContents.forEach((item, i) => {
    const yy = iy + 22 + i * 9
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...PDF_COLORS.blue)
    doc.text(String(item.page).padStart(2, '0'), ix + 5, yy)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(203, 213, 225)
    doc.text(item.title, ix + 13, yy)
  })

  // Rodapé da capa
  doc.setDrawColor(30, 58, 95)
  doc.setLineWidth(0.5)
  doc.line(5, H - M - 6, W - M, H - M - 6)

  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(71, 85, 105)
  const now = new Date().toLocaleDateString('pt-BR')
  doc.text(
    `Gerado em ${now}  |  Documento Confidencial  |  Uso exclusivo do Gestor do Fundo`,
    M, H - M - 1
  )
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...PDF_COLORS.white)
  doc.text('Patria Real Estate', W - M, H - M - 1, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...PDF_COLORS.blue)
  doc.text('Real Estate — Gestão de Ativos Imobiliários', W - M, H - M + 4, { align: 'right' })
}

export function drawHeaderFooter(
  doc: jsPDF,
  pageTitle: string,
  period: string,
  pageNum: number,
  totalPages: number
): void {
  const W = 210, H = 297, M = 18

  // Header
  doc.setFillColor(...PDF_COLORS.navyDark)
  doc.rect(0, 0, W, 11, 'F')
  doc.setFillColor(...PDF_COLORS.blue)
  doc.rect(0, 0, 5, 11, 'F')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...PDF_COLORS.white)
  doc.text('Patria Real Estate — ' + pageTitle, M, 7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...PDF_COLORS.blueSoft)
  doc.text(period + '  |  Confidencial', W - M, 7.5, { align: 'right' })

  // Footer
  doc.setFillColor(...PDF_COLORS.grayBg)
  doc.rect(0, H - 10, W, 10, 'F')
  doc.setDrawColor(...PDF_COLORS.grayLine)
  doc.setLineWidth(0.4)
  doc.line(M, H - 10, W - M, H - 10)
  doc.setFontSize(7)
  doc.setTextColor(...PDF_COLORS.grayText)
  doc.text('Documento confidencial — Uso exclusivo do Gestor do Fundo Imobiliário', M, H - 3.5)
  doc.text(`Página ${pageNum} de ${totalPages}`, W - M, H - 3.5, { align: 'right' })
}

export function drawSectionTitle(doc: jsPDF, title: string, y: number): number {
  const M = 18
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...PDF_COLORS.navyDark)
  doc.text(title, M, y)
  doc.setDrawColor(...PDF_COLORS.grayLine)
  doc.setLineWidth(0.4)
  doc.line(M, y + 2, 210 - M, y + 2)
  return y + 8
}

export function drawKpiCards(
  doc: jsPDF,
  kpis: { value: string; label: string; sub?: string; color?: number[] }[],
  y: number
): number {
  const M = 18, W = 210, CW = W - 2 * M
  const cols = kpis.length <= 3 ? kpis.length : 3
  const cw = CW / cols
  const ch = 18

  for (let i = 0; i < kpis.length; i++) {
    const row = Math.floor(i / cols)
    const col = i % cols
    const cx = M + col * cw
    const cy = y + row * (ch + 2)
    const kpi = kpis[i]

    doc.setFillColor(...PDF_COLORS.grayBg)
    doc.rect(cx, cy, cw - 1, ch, 'F')
    doc.setDrawColor(...PDF_COLORS.grayLine)
    doc.setLineWidth(0.3)
    doc.rect(cx, cy, cw - 1, ch, 'S')

    // Accent bar topo
    const accentColor = (kpi.color || PDF_COLORS.blue) as [number, number, number]
    doc.setFillColor(...accentColor)
    doc.rect(cx, cy, cw - 1, 1.5, 'F')

    doc.setFontSize(15)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...(kpi.color as [number, number, number] || PDF_COLORS.navyDark))
    doc.text(kpi.value, cx + 6, cy + 9)

    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...PDF_COLORS.grayText)
    doc.text(kpi.label, cx + 6, cy + 14)

    if (kpi.sub) {
      doc.setFontSize(6.5)
      doc.text(kpi.sub, cx + 6, cy + 17.5)
    }
  }

  const rows = Math.ceil(kpis.length / cols)
  return y + rows * (ch + 2) + 4
}

export function drawTable(
  doc: jsPDF,
  headers: string[],
  rows: (string | number)[][],
  y: number,
  options?: {
    columnWidths?: number[]
    rowHealthCodes?: string[]
    totalRow?: (string | number)[]
    footnote?: string
  }
): number {
  const M = 18

  const headStyles = {
    fillColor: PDF_COLORS.navyDark as [number, number, number],
    textColor: PDF_COLORS.white as [number, number, number],
    fontStyle: 'bold' as const,
    fontSize: 8,
  }

  const getRowStyle = (code?: string) => {
    switch (code) {
      case 'C': return { fillColor: PDF_COLORS.redLight, textColor: PDF_COLORS.black }
      case 'A': return { fillColor: PDF_COLORS.amberLight, textColor: PDF_COLORS.black }
      case 'S': return { fillColor: PDF_COLORS.greenLight, textColor: PDF_COLORS.black }
      case 'V': return { fillColor: PDF_COLORS.purpleLight, textColor: PDF_COLORS.black }
      default: return null
    }
  }

  const bodyRows = rows.map((row, i) => {
    const code = options?.rowHealthCodes?.[i]
    const style = getRowStyle(code)
    if (style) {
      return row.map(cell => ({
        content: String(cell),
        styles: { fillColor: style.fillColor, textColor: style.textColor }
      }))
    }
    return row.map(cell => ({ content: String(cell), styles: {} }))
  })

  const allRows = options?.totalRow
    ? [...bodyRows, options.totalRow.map(cell => ({
        content: String(cell),
        styles: {
          fillColor: PDF_COLORS.navyMed as [number, number, number],
          textColor: PDF_COLORS.white as [number, number, number],
          fontStyle: 'bold' as const,
        }
      }))]
    : bodyRows

  autoTable(doc, {
    head: [headers],
    body: allRows as any,
    startY: y,
    margin: { left: M, right: M },
    columnStyles: options?.columnWidths
      ? Object.fromEntries(
          options.columnWidths.map((w, i) => [i, { cellWidth: w }])
        )
      : {},
    headStyles,
    alternateRowStyles: { fillColor: PDF_COLORS.grayBg as [number, number, number] },
    styles: {
      fontSize: 8,
      cellPadding: { top: 4, bottom: 4, left: 5, right: 4 },
      lineColor: PDF_COLORS.grayLine as [number, number, number],
      lineWidth: 0.2,
    },
    didParseCell: (data: any) => {
      const code = options?.rowHealthCodes?.[data.row.index]
      if (code === 'C' && data.column.index === headers.length - 1) {
        data.cell.styles.textColor = PDF_COLORS.red
        data.cell.styles.fontStyle = 'bold'
      } else if (code === 'A' && data.column.index === headers.length - 1) {
        data.cell.styles.textColor = PDF_COLORS.amber
        data.cell.styles.fontStyle = 'bold'
      }
    }
  })

  let finalY = (doc as any).lastAutoTable.finalY + 4

  if (options?.footnote) {
    doc.setFontSize(7)
    doc.setTextColor(...PDF_COLORS.grayText)
    doc.text(options.footnote, 210 / 2, finalY + 3, { align: 'center' })
    finalY += 8
  }

  return finalY
}

export function addPageWithHeader(
  doc: jsPDF,
  pageTitle: string,
  period: string,
  pageNum: number,
  totalPages: number
): number {
  doc.addPage()
  drawHeaderFooter(doc, pageTitle, period, pageNum, totalPages)
  return 20
}

// ── FUNÇÃO PRINCIPAL ──────────────────────────────────────────

export async function generateReport(
  config: ReportConfig,
  sections: ReportSection[]
): Promise<void> {
  const doc = setupDoc()
  const totalPages = sections.length + 1

  // Página 1: Capa
  drawCoverPage(doc, config)

  // Páginas de conteúdo
  sections.forEach((section, idx) => {
    const pageNum = idx + 2
    let y = addPageWithHeader(doc, config.title, config.period, pageNum, totalPages)

    y = drawSectionTitle(doc, section.title, y)

    if (section.type === 'kpi-cards' && section.kpis) {
      y = drawKpiCards(doc, section.kpis, y)
    }

    if (section.type === 'table' && section.tableHeaders && section.tableRows) {
      y = drawTable(doc, section.tableHeaders, section.tableRows, y, {
        columnWidths: section.columnWidths,
        rowHealthCodes: section.rowHealthCodes,
        totalRow: section.totalRow,
        footnote: section.footnote,
      })
    }

    if (section.type === 'chart-image' && section.chartImageBase64) {
      const M = 18, CW = 210 - 2 * M
      doc.addImage(section.chartImageBase64, 'PNG', M, y, CW, CW * 0.45)
      y += CW * 0.45 + 4
      if (section.footnote) {
        doc.setFontSize(7)
        doc.setTextColor(...PDF_COLORS.grayText)
        doc.text(section.footnote, 210 / 2, y + 2, { align: 'center' })
      }
    }

    if (section.type === 'text' && section.text) {
      const M = 18
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...PDF_COLORS.black)
      const lines = doc.splitTextToSize(section.text, 210 - 2 * M)
      doc.text(lines, M, y)
      y += lines.length * 5 + 4
    }
  })

  // Salvar
  const filename = `Patria Real Estate_${config.module.replace(/\s/g, '_')}_${config.period.replace(/\s/g, '_')}.pdf`
  doc.save(filename)
}
