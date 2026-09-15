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
const PENDING = [146, 64, 14] // amber-800 — mirrors the app's validado=green / pendente=amber convention
const PENDING_FILL = [245, 158, 11] // amber-500 — for progress-bar fills, where amber-800 would read as near-black

/** Starts a new page if `needed` mm of vertical space isn't left on the current one; returns the (possibly reset) y. */
function ensureSpace(doc, y, needed) {
  if (y + needed > PAGE_HEIGHT - MARGIN) {
    doc.addPage()
    return MARGIN
  }
  return y
}

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
  const summary = `${overall.validatedHours} de ${overall.requiredHours} horas validadas (${overall.percent}%)`
  doc.text(summary, MARGIN, y)
  if (overall.pendingHours > 0) {
    const summaryWidth = doc.getTextWidth(summary)
    doc.setTextColor(...PENDING)
    doc.text(` + ${overall.pendingHours}h pendentes`, MARGIN + summaryWidth, y)
  }
  y += 4

  doc.setFillColor(...LINE)
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 4, 2, 2, 'F')
  const filledWidth = CONTENT_WIDTH * Math.min(1, overall.percent / 100)
  if (filledWidth > 0) {
    doc.setFillColor(...ACCENT)
    doc.roundedRect(MARGIN, y, filledWidth, 4, 2, 2, 'F')
  }
  const pendingWidth = CONTENT_WIDTH * Math.min(100 - overall.percent, overall.pendingPercent) / 100
  if (pendingWidth > 0) {
    doc.setFillColor(...PENDING_FILL)
    doc.roundedRect(MARGIN + filledWidth, y, pendingWidth, 4, 2, 2, 'F')
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
    const summary = `${progress.validatedHours}h de ${progress.requiredHours}h validadas (${progress.percent}%)`
    doc.text(summary, MARGIN + 75, y)

    if (progress.pendingHours > 0) {
      const summaryWidth = doc.getTextWidth(summary)
      doc.setTextColor(...PENDING)
      doc.text(` + ${progress.pendingHours}h pendentes`, MARGIN + 75 + summaryWidth, y)
    }

    y += 6
  }

  return y + 6
}

/**
 * NOTE: this used to resolve `{ width: 1, height: 1 }` on a decode failure
 * instead of rejecting — which produced a real, silent bug: the scale math
 * below (`boxSize / dims.width`) would still "succeed" against those
 * dimensions and hand jsPDF a technically-valid but ~1mm-square image request,
 * so the certificate photo simply vanished into a single pixel with no error
 * anywhere. Rejecting here is what lets the caller notice and log the failure
 * instead of rendering an invisible image.
 */
function loadImageDimensions(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => reject(new Error('browser could not decode the fetched image data (Image.onerror)'))
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

/**
 * Fetches a certificate's Storage image and converts it to a data URL
 * jsPDF's addImage can embed. Throws a specific, human-readable reason on
 * any failure instead of a bare "failed" — the caller logs it verbatim, and
 * a vague error here would have made this exact bug unfixable again.
 */
async function fetchAsDataUrl(url) {
  let response
  try {
    response = await fetch(url)
  } catch (networkError) {
    // The browser collapses a CORS rejection, an offline connection, and a
    // DNS failure into the same generic "Failed to fetch" with no further
    // detail — that ambiguity is exactly why this can't be swallowed.
    throw new Error(`network error while fetching the image, possibly CORS or connectivity — "${networkError.message}"`)
  }
  if (!response.ok) throw new Error(`server responded ${response.status} ${response.statusText}`)
  const blob = await response.blob()
  return blobToDataUrl(blob)
}

/**
 * Resolves one certificate's image without drawing anything yet, so the row
 * layout below can size itself against the real result — success or not —
 * before committing to a page break. On failure this never throws: it logs
 * the specific cause (title + anexoUrl + the exact error) to the console and
 * returns a placeholder descriptor instead, so one bad image degrades
 * gracefully rather than aborting the rest of the report.
 */
async function resolveCertificateImage(cert, boxSize) {
  if (!cert.anexoUrl) return null
  try {
    const dataUrl = await fetchAsDataUrl(cert.anexoUrl)
    const dims = await loadImageDimensions(dataUrl)
    const scale = Math.min(boxSize / dims.width, boxSize / dims.height, 1)
    return { ok: true, dataUrl, w: dims.width * scale, h: dims.height * scale }
  } catch (error) {
    console.error(`[PDF] Could not embed the image for certificate "${cert.titulo}" (${cert.anexoUrl}): ${error.message}`, error)
    return { ok: false, w: boxSize, h: boxSize }
  }
}

function drawResolvedImage(doc, resolved, x, y) {
  if (!resolved) return
  if (resolved.ok) {
    doc.addImage(resolved.dataUrl, 'JPEG', x, y, resolved.w, resolved.h)
    return
  }
  doc.setDrawColor(...LINE)
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(x, y, resolved.w, resolved.h, 3, 3, 'FD')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...SUBTLE)
  doc.text(['Imagem', 'indisponível'], x + resolved.w / 2, y + resolved.h / 2 - 2, { align: 'center' })
}

async function addCertificates(doc, certificates, startY, { heading, headingColor = INK }) {
  let y = ensureSpace(doc, startY, 20)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...headingColor)
  doc.text(heading, MARGIN, y)
  y += 8

  // Large enough to actually make out what's in the photo, not just confirm
  // one was attached — this deliberately fits fewer certificates per page.
  const IMAGE_BOX = 70
  const ROW_GAP = 10
  const textX = MARGIN + IMAGE_BOX + 8
  const textMaxWidth = CONTENT_WIDTH - IMAGE_BOX - 8

  for (const cert of certificates) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    const titleLines = doc.splitTextToSize(cert.titulo, textMaxWidth)
    const textBlockHeight = titleLines.length * 5 + 2 + 5

    // Resolved (fetched + measured, or logged-and-placeholdered) *before* the
    // row height is decided, so a real image's actual height — not just
    // IMAGE_BOX — determines how much room the row needs and where the page
    // breaks; a short/landscape photo doesn't leave the row unnecessarily tall.
    const resolvedImage = await resolveCertificateImage(cert, IMAGE_BOX)
    const rowHeight = Math.max(resolvedImage?.h ?? 0, textBlockHeight, 15)

    if (y + rowHeight + ROW_GAP > PAGE_HEIGHT - MARGIN) {
      doc.addPage()
      y = MARGIN
    }

    drawResolvedImage(doc, resolvedImage, MARGIN, y + (rowHeight - (resolvedImage?.h ?? 0)) / 2)

    let textY = y + (rowHeight - textBlockHeight) / 2 + 5
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

    y += rowHeight + ROW_GAP
    doc.setDrawColor(241, 245, 249)
    doc.line(MARGIN, y - ROW_GAP / 2, PAGE_WIDTH - MARGIN, y - ROW_GAP / 2)
  }

  return y
}

/**
 * Builds and downloads the PDF report. jsPDF is loaded on demand (not in the
 * main bundle) since most sessions never click "Gerar PDF". Certificate
 * images live in Firebase Storage now, so each one is fetched and converted
 * to a data URL (`fetchAsDataUrl`) before `addImage` can embed it — no
 * html2canvas round-trip needed since there's no arbitrary styled HTML to
 * rasterize, just structured text + images we lay out ourselves.
 *
 * Validated and pending certificates get their own labeled sections (never
 * merged into one ambiguous list) so the distinction survives on paper, not
 * just on screen — each section is skipped entirely when its list is empty.
 * Rejected certificates aren't passed in at all; they were never meant to
 * count toward anything the professor or student would file away.
 */
export async function generateReportPdf({ aluno, overall, categoryBreakdown, validatedCertificates, pendingCertificates }) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  doc.setProperties({ title: `Relatório de horas complementares — ${aluno.nome}` })

  addHeader(doc, aluno)
  let y = addOverallSummary(doc, overall, 48)
  y = addCategoryBreakdown(doc, categoryBreakdown, y)

  if (validatedCertificates.length > 0) {
    y = await addCertificates(doc, validatedCertificates, y, {
      heading: `Certificados validados (${validatedCertificates.length})`,
      headingColor: ACCENT,
    })
  }
  if (pendingCertificates.length > 0) {
    y = await addCertificates(doc, pendingCertificates, y, {
      heading: `Certificados pendentes de validação (${pendingCertificates.length})`,
      headingColor: PENDING,
    })
  }

  const safeName = aluno.nome
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
  doc.save(`relatorio-horas-${safeName || 'aluno'}.pdf`)
}
