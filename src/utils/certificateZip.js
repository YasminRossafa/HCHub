import { fetchCertificateImageBlob } from './imageFetch'

/**
 * All uploads go through utils/file.js's compressImage, which re-encodes
 * everything as JPEG before it reaches Storage — so `.jpg` covers the
 * normal case. This only falls back to sniffing the Blob's own MIME type
 * for certificates uploaded before that normalization existed, if any.
 */
function extensionForBlob(blob) {
  if (blob.type === 'image/png') return 'png'
  return 'jpg'
}

/**
 * Fetches every certificate's image and packs them into a single .zip,
 * named sequentially (`certificado-1.jpg`, `certificado-2.jpg`, …) in
 * ascending order of the certificate's own registration date (`data`) —
 * oldest first — so numbering is stable and meaningful rather than tied to
 * Firestore's arbitrary read order.
 *
 * One certificate's image failing to fetch (network error, missing file,
 * no anexoUrl at all) is logged to the console — same style as the PDF
 * export's image logging — and that file is simply skipped, leaving a gap
 * in the numbering rather than shifting later files down. The rest of the
 * zip still gets built; nothing here aborts the whole download over one
 * bad image. The caller gets back how many succeeded vs. how many were
 * attempted so it can tell the student about a partial result.
 */
export async function generateCertificatesZip(certificates) {
  const { default: JSZip } = await import('jszip')
  const sorted = [...certificates].sort((a, b) => (a.data ?? '').localeCompare(b.data ?? ''))
  const zip = new JSZip()
  let successCount = 0

  for (const [index, cert] of sorted.entries()) {
    if (!cert.anexoUrl) {
      console.error(`[ZIP] Certificate "${cert.titulo}" has no attached image (anexoUrl) — skipping.`)
      continue
    }
    try {
      const blob = await fetchCertificateImageBlob(cert.anexoUrl)
      zip.file(`certificado-${index + 1}.${extensionForBlob(blob)}`, blob)
      successCount += 1
    } catch (error) {
      console.error(`[ZIP] Could not fetch the image for certificate "${cert.titulo}" (${cert.anexoUrl}): ${error.message}`, error)
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  return { blob, successCount, total: sorted.length }
}

/** Triggers a browser download of `blob` as `filename` via a throwaway object URL. */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}
