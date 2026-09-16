/**
 * Fetches a certificate's Storage image as a Blob. Throws a specific,
 * human-readable reason on any failure instead of a bare "failed" — callers
 * (PDF generation, ZIP export) log it verbatim, and a vague error here would
 * make that logging useless.
 *
 * Extracted from the PDF export code, which already fetches images from
 * `anexoUrl` successfully against the Storage bucket's CORS configuration —
 * shared so the ZIP export doesn't have to reinvent it.
 */
export async function fetchCertificateImageBlob(url) {
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
  return response.blob()
}
