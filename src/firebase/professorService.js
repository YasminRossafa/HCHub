import { httpsCallable } from 'firebase/functions'
import { functions } from './config'

/**
 * Everything the professor panel needs, as thin wrappers over the two
 * callables in functions/index.js. No Firebase Auth is involved: the
 * professor is anonymous and the share token is the whole credential, so
 * these must never be extended to read/write Firestore from the client.
 *
 * Errors surface as FirebaseError with `code` like "functions/not-found";
 * `isNotFoundError` is the one distinction the UI cares about (dead link vs.
 * everything else).
 */

const getStudentReportCallable = httpsCallable(functions, 'getStudentReportByToken')
const updateCertificateStatusCallable = httpsCallable(functions, 'updateCertificateStatusByToken')

/** Resolves to `{ student, certificados }` for a valid token. */
export async function getStudentReportByToken(token) {
  const { data } = await getStudentReportCallable({ token })
  return data
}

/** `newStatus` must be "validado" or "rejeitado" — the function rejects anything else. */
export async function updateCertificateStatusByToken(token, certId, newStatus) {
  const { data } = await updateCertificateStatusCallable({ token, certId, newStatus })
  return data
}

export function isNotFoundError(error) {
  return error?.code === 'functions/not-found'
}
