export async function captureChartAsBase64(
  elementId: string,
  width = 800,
  height = 400
): Promise<string | null> {
  try {
    const { default: html2canvas } = await import('html2canvas')
    const el = document.getElementById(elementId)
    if (!el) return null
    const canvas = await html2canvas(el, {
      width, height, scale: 2, backgroundColor: '#ffffff',
      logging: false, useCORS: true
    })
    return canvas.toDataURL('image/png').split(',')[1]
  } catch {
    return null
  }
}
