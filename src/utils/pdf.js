import { CATEGORIES_BY_KEY } from '../constants/categories'
import { formatDate } from './date'

const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const MARGIN = 15
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2

const INK = [15, 23, 42] // slate-900
const SUBTLE = [71, 85, 105] // slate-600
const LINE = [226, 232, 240] // slate-200
const ACCENT = [16, 185, 129] // emerald-500

function addHeader(doc, aluno) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(...INK)
  doc.text('Relatório de Horas Complementares', MARGIN, 20)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(...SUBTLE)
  doc.text(`${aluno.nome} · ${aluno.curso}`, MARGIN, 28)
  doc.text(`Ingresso em ${aluno.anoIngresso} · Gerado em ${new Date().toLocaleDateString('pt-BR')}`, MARGIN, 34)

  doc.setDrawColor(...LINE)
  doc.line(MARGIN, 39, PAGE_WIDTH - MARGIN, 39)
}

function addOverallSummary(doc, overall, startY) {
  let y = startY
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...INK)
  doc.text('Progresso geral', MARGIN, y)
  y += 7

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(...SUBTLE)
  doc.text(`${overall.validatedHours} de ${overall.requiredHours} horas concluídas (${overall.percent}%)`, MARGIN, y)
  y += 4

  doc.setFillColor(...LINE)
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 4, 2, 2, 'F')
  const filledWidth = CONTENT_WIDTH * Math.min(1, overall.percent / 100)
  if (filledWidth > 0) {
    doc.setFillColor(...ACCENT)
    doc.roundedRect(MARGIN, y, filledWidth, 4, 2, 2, 'F')
  }

  return y + 12
}

function addCategoryBreakdown(doc, categoryBreakdown, startY) {
  let y = startY
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...INK)
  doc.text('Progresso por categoria', MARGIN, y)
  y += 8

  doc.setFontSize(10)
  for (const { label, progress } of categoryBreakdown) {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 41, 59)
    doc.text(label, MARGIN, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...SUBTLE)
    doc.text(`${progress.validatedHours}h de ${progress.requiredHours}h (${progress.percent}%)`, MARGIN + 75, y)
    y += 6
  }

  return y + 6
}

function loadImageDimensions(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => resolve({ width: 1, height: 1 })
    img.src = dataUrl
  })
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'))
    reader.readAsDataURL(blob)
  })
}

/** Fetches a certificate's Storage image and converts it to a data URL jsPDF's addImage can embed. */
async function fetchAsDataUrl(url) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Falha ao baixar imagem: ${response.status}`)
  const blob = await response.blob()
  return blobToDataUrl(blob)
}

async function addCertificates(doc, certificates, startY) {
  let y = startY
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...INK)
  doc.text(`Certificados incluídos (${certificates.length})`, MARGIN, y)
  y += 8

  const IMAGE_BOX = 30
  const textX = MARGIN + IMAGE_BOX + 6
  const textMaxWidth = CONTENT_WIDTH - IMAGE_BOX - 6

  for (const cert of certificates) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    const titleLines = doc.splitTextToSize(cert.titulo, textMaxWidth)
    const rowHeight = Math.max(IMAGE_BOX, titleLines.length * 5 + 10)

    if (y + rowHeight + 6 > PAGE_HEIGHT - MARGIN) {
      doc.addPage()
      y = MARGIN
    }

    if (cert.anexoUrl) {
      try {
        const dataUrl = await fetchAsDataUrl(cert.anexoUrl)
        const dims = await loadImageDimensions(dataUrl)
        const scale = Math.min(IMAGE_BOX / dims.width, IMAGE_BOX / dims.height, 1)
        const w = dims.width * scale
        const h = dims.height * scale
        doc.addImage(dataUrl, 'JPEG', MARGIN, y, w, h)
      } catch {
        // A single broken image shouldn't abort the whole report.
      }
    }

    let textY = y + 5
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...INK)
    doc.text(titleLines, textX, textY)
    textY += titleLines.length * 5 + 2

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...SUBTLE)
    const categoryLabel = CATEGORIES_BY_KEY[cert.categoria]?.label ?? cert.categoria
    doc.text(`${categoryLabel} · ${cert.cargaHoraria}h · ${formatDate(cert.data)}`, textX, textY)

    y += rowHeight + 6
    doc.setDrawColor(241, 245, 249)
    doc.line(MARGIN, y - 3, PAGE_WIDTH - MARGIN, y - 3)
  }
}

/**
 * Builds and downloads the PDF report. jsPDF is loaded on demand (not in the
 * main bundle) since most sessions never click "Gerar PDF". Certificate
 * images live in Firebase Storage now, so each one is fetched and converted
 * to a data URL (`fetchAsDataUrl`) before `addImage` can embed it — no
 * html2canvas round-trip needed since there's no arbitrary styled HTML to
 * rasterize, just structured text + images we lay out ourselves.
 */
export async function generateReportPdf({ aluno, overall, categoryBreakdown, certificates }) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  doc.setProperties({ title: `Relatório de horas complementares — ${aluno.nome}` })

  addHeader(doc, aluno)
  let y = addOverallSummary(doc, overall, 48)
  y = addCategoryBreakdown(doc, categoryBreakdown, y)
  await addCertificates(doc, certificates, y)

  const safeName = aluno.nome
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
  doc.save(`relatorio-horas-${safeName || 'aluno'}.pdf`)
}
