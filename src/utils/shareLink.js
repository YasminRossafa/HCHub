/**
 * Encodes/decodes the professor-panel payload, and builds the shareable link.
 *
 * The payload (student info + validated certificates, images included) is
 * packed into the URL's *hash fragment* (`#d=...`), not a query param. A
 * fragment is never sent to the server in the HTTP request line — the
 * browser resolves it entirely client-side — so even a very large encoded
 * payload can't trip server/proxy/CDN URL-length limits (commonly just a
 * few KB). The only ceiling left is the browser's own address-bar length,
 * which is far more generous (~2MB in Chromium).
 *
 * Encoding is a single `encodeURIComponent` pass, not base64: each `anexo`
 * is already a base64 JPEG data URL (from the compression step), and
 * base64-encoding that JSON blob *again* would inflate the already-largest
 * part of the payload by another ~33% for no reason — percent-encoding only
 * expands the handful of characters a URL can't carry raw (quotes, spaces,
 * the odd `+`/`/` from the embedded base64), which is far cheaper.
 *
 * `decodePayload` expects the raw (still percent-encoded) string as it
 * appears in the URL — extract it with a plain string split, not
 * `URLSearchParams.get()`, which would decode it for you and cause a
 * double-decode here. That matters concretely: a certificate title like
 * "Curso 100% EAD" contains a literal `%`, and decoding twice would throw
 * trying to interpret "% E" as a malformed escape sequence.
 */

export function encodePayload(obj) {
  return encodeURIComponent(JSON.stringify(obj))
}

export function decodePayload(encoded) {
  return JSON.parse(decodeURIComponent(encoded))
}

/**
 * Conservative vs. Chromium's ~2M character URL limit — leaves headroom for
 * the origin/path and hasn't been verified against Firefox/Safari, whose
 * practical ceilings may be lower (see report screen summary for the caveat
 * surfaced to the student when a link gets capped).
 */
export const SAFE_HASH_CHAR_LIMIT = 1_500_000

function slimCertificate(cert) {
  return {
    id: cert.id,
    titulo: cert.titulo,
    categoria: cert.categoria,
    cargaHoraria: cert.cargaHoraria,
    data: cert.data,
    status: cert.status,
    anexo: cert.anexo,
  }
}

/**
 * Builds the shareable panel URL from validated certificates. If including
 * everything would exceed SAFE_HASH_CHAR_LIMIT, keeps the most recent
 * certificates (by `data`) and drops the rest — reporting how many were
 * left out so the caller can warn the student rather than hand them a link
 * that silently omits data or risks not opening at all.
 */
export function buildShareableLink({ aluno, certificados }) {
  const basePayload = {
    aluno: { nome: aluno.nome, curso: aluno.curso, anoIngresso: aluno.anoIngresso, metas: aluno.metas },
    certificados: [],
  }

  const sorted = [...certificados].sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0))

  let included = []
  let wasCapped = false

  for (const cert of sorted) {
    const candidate = [...included, slimCertificate(cert)]
    const encoded = encodePayload({ ...basePayload, certificados: candidate })
    if (encoded.length > SAFE_HASH_CHAR_LIMIT) {
      wasCapped = true
      break
    }
    included = candidate
  }

  const finalEncoded = encodePayload({ ...basePayload, certificados: included })
  const url = `${window.location.origin}/painel#d=${finalEncoded}`

  return { url, includedCount: included.length, totalCount: sorted.length, wasCapped, encodedLength: finalEncoded.length }
}
