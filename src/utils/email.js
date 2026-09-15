/**
 * Normalizes every line break to CRLF ("\r\n").
 *
 * This was the actual bug behind the professor link showing up unclickable
 * in real mail clients: the body was built with plain "\n" (LF only), which
 * `encodeURIComponent`/`URLSearchParams` then encode as bare `%0A`. RFC 6068
 * (the `mailto:` URI spec) inherits RFC 5322's mail-format line-ending rule,
 * which is CRLF — several real clients (and Gmail's own mailto/compose body
 * parser) only reliably treat `%0D%0A` as a hard line break; a bare `%0A` can
 * get collapsed or ignored, silently merging the "blank line, URL, blank
 * line" isolation back into one run of text with the link glued to its
 * neighbors — which still *looks* like an isolated link in the source string
 * (this is exactly why a plain round-trip decode check missed it before),
 * but no longer *renders* as one once a real client reflows it.
 */
function toCrlf(text) {
  return text.replace(/\r\n|\r|\n/g, '\r\n')
}

/** A `mailto:` link — opens whatever mail app/client the OS has registered. */
export function buildMailtoUrl({ subject, body }) {
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(toCrlf(body))}`
}

/**
 * Gmail's web compose deep link — UFSCar uses Gmail by default, so on
 * desktop (see utils/device.js) this is preferred over `mailto:`, which on
 * most desktops either does nothing (no mail client installed) or opens one
 * nobody actually uses. `URLSearchParams` handles the encoding; the body is
 * CRLF-normalized for the same reason as `buildMailtoUrl` above — Gmail's
 * own compose-body parser is reached either directly (this URL) or via its
 * mailto-handler bridge (when Gmail is the registered default handler for
 * plain `mailto:` links), so the same line-ending fix applies to both paths.
 */
export function buildGmailComposeUrl({ to = '', subject, body }) {
  const params = new URLSearchParams({ view: 'cm', fs: '1', to, su: subject, body: toCrlf(body) })
  return `https://mail.google.com/mail/?${params.toString()}`
}
