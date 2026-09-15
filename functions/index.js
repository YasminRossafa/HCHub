const { initializeApp } = require('firebase-admin/app')
const { FieldValue, getFirestore } = require('firebase-admin/firestore')
const { HttpsError, onCall } = require('firebase-functions/v2/https')
const logger = require('firebase-functions/logger')

// Default credentials: Cloud Functions injects the project's service account
// at runtime (and the emulator injects its own), so nothing is checked in.
initializeApp()
const db = getFirestore()

/**
 * Professor-facing access to a student's data. The professor has no account,
 * so the client can't satisfy the owner-only Firestore rules — instead these
 * callables run with Admin SDK privileges and use a `shareLinks/{token}`
 * document as the sole proof of access. Because the token is the whole
 * credential, both functions are deliberately narrow: the report is read-only,
 * and the status update can only ever touch one field on one document.
 *
 * Neither function requires Firebase Auth — a professor opens the link
 * anonymously. App Check is not enforced here; the token itself is the gate.
 */

/**
 * Both invalid-input cases (missing token, unknown token) surface to the
 * client as the same `not-found` with the same message, so a caller can't
 * distinguish "no such token" from anything else about the system.
 */
const LINK_NOT_FOUND_MESSAGE = 'Link inválido ou expirado.'

const ALLOWED_STATUSES = new Set(['validado', 'rejeitado'])

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

/**
 * Firestore document ids can't contain "/" — rejecting it up front means a
 * token like "abc/../other" can never be interpreted as a nested path.
 */
function isPlausibleDocId(value) {
  return isNonEmptyString(value) && !value.includes('/') && value.length <= 256
}

/** Resolves a share token to the owning student's uid, or throws `not-found`. */
async function resolveStudentId(token) {
  if (!isPlausibleDocId(token)) {
    throw new HttpsError('not-found', LINK_NOT_FOUND_MESSAGE)
  }
  const linkSnap = await db.doc(`shareLinks/${token}`).get()
  const studentId = linkSnap.exists ? linkSnap.get('studentId') : null
  if (!isNonEmptyString(studentId)) {
    throw new HttpsError('not-found', LINK_NOT_FOUND_MESSAGE)
  }
  return studentId
}

/**
 * Firestore Timestamps don't survive the callable JSON boundary as-is, so
 * anything that isn't a plain value is converted to an ISO string. Only the
 * fields the panel needs are forwarded — no `temaPreferido`, no raw internals.
 */
function toIso(value) {
  return value && typeof value.toDate === 'function' ? value.toDate().toISOString() : null
}

function serializeCertificate(snapshot) {
  const data = snapshot.data() ?? {}
  return {
    id: snapshot.id,
    titulo: data.titulo ?? '',
    categoria: data.categoria ?? '',
    cargaHoraria: Number(data.cargaHoraria) || 0,
    data: data.data ?? '',
    observacoes: data.observacoes ?? '',
    status: data.status ?? 'pendente',
    anexoUrl: data.anexoUrl ?? null,
    atualizadoEm: toIso(data.atualizadoEm),
  }
}

/**
 * Re-throws HttpsErrors we raised on purpose; anything else is logged
 * server-side and replaced with a generic `internal` so stack traces and
 * Firestore internals never reach the client.
 */
function rethrowAsCallableError(error, context) {
  if (error instanceof HttpsError) throw error
  logger.error(`${context} failed`, error)
  throw new HttpsError('internal', 'Ocorreu um erro inesperado. Tente novamente.')
}

/**
 * getStudentReportByToken({ token })
 *   → { student: { nome, curso, anoIngresso, metas }, certificados: [...] }
 *
 * Returns every certificate regardless of status: the professor needs the
 * full picture (what's pending, what they already decided), not just the
 * queue.
 */
exports.getStudentReportByToken = onCall(async (request) => {
  const token = request.data?.token
  try {
    const studentId = await resolveStudentId(token)

    const studentRef = db.doc(`students/${studentId}`)
    const [studentSnap, certificatesSnap] = await Promise.all([
      studentRef.get(),
      studentRef.collection('certificados').get(),
    ])

    // A link whose student document has since been deleted is, from the
    // professor's point of view, just as dead as an unknown token.
    if (!studentSnap.exists) {
      throw new HttpsError('not-found', LINK_NOT_FOUND_MESSAGE)
    }

    const student = studentSnap.data()
    return {
      student: {
        nome: student.nome ?? '',
        curso: student.curso ?? '',
        anoIngresso: student.anoIngresso ?? null,
        metas: student.metas ?? {},
      },
      certificados: certificatesSnap.docs.map(serializeCertificate),
    }
  } catch (error) {
    rethrowAsCallableError(error, 'getStudentReportByToken')
  }
})

/**
 * updateCertificateStatusByToken({ token, certId, newStatus }) → { success: true }
 *
 * The single write path a professor has. Hard constraints, enforced in code
 * because this runs with admin privileges and no Firestore rule applies:
 *   - `newStatus` must be exactly "validado" or "rejeitado" — never "pendente"
 *     (a mistaken decision is corrected by flipping validado ⇄ rejeitado, not
 *     by reverting to the queue);
 *   - only `status` and `atualizadoEm` are ever written. Título, categoria,
 *     carga horária, anexo etc. are untouchable through this function.
 */
exports.updateCertificateStatusByToken = onCall(async (request) => {
  const { token, certId, newStatus } = request.data ?? {}
  try {
    if (!ALLOWED_STATUSES.has(newStatus)) {
      throw new HttpsError('invalid-argument', 'Status inválido. Use "validado" ou "rejeitado".')
    }
    if (!isPlausibleDocId(certId)) {
      throw new HttpsError('invalid-argument', 'Identificador do certificado inválido.')
    }

    const studentId = await resolveStudentId(token)

    // By construction this path can only reach a certificate under the
    // student the token resolves to — there is no way to address another
    // student's subcollection from here.
    const certRef = db.doc(`students/${studentId}/certificados/${certId}`)
    const certSnap = await certRef.get()
    if (!certSnap.exists) {
      throw new HttpsError('not-found', 'Certificado não encontrado.')
    }

    // `update` (not `set`) so a vanished document can never be recreated
    // with just these two fields.
    await certRef.update({
      status: newStatus,
      atualizadoEm: FieldValue.serverTimestamp(),
    })

    return { success: true }
  } catch (error) {
    rethrowAsCallableError(error, 'updateCertificateStatusByToken')
  }
})
