import { collection, deleteDoc, doc, getDocs, query, serverTimestamp, setDoc, where } from 'firebase/firestore'
import { db } from './config'

/**
 * Student-side management of `shareLinks/{token}` documents — the tokens a
 * professor presents to the Cloud Functions in functions/index.js. Only the
 * owning student ever touches this collection from the client (create, and
 * list/delete their own — see firestore.rules); the professor's read happens
 * server-side.
 *
 * The token is a UUID v4 straight from the Web Crypto API: 122 bits of
 * randomness, URL-safe, and used verbatim as the document id.
 */

function shareLinksCollection() {
  return collection(db, 'shareLinks')
}

/** The public URL a professor opens for a given token. */
export function buildProfessorPanelUrl(token) {
  return `${window.location.origin}/professor/${token}`
}

/**
 * Returns this student's currently active link, or `null` if they've never
 * generated one. Used on mount so a link already shared with a professor
 * keeps showing up after navigating away and back, instead of looking like
 * it never existed until "Gerar link compartilhável" is clicked again.
 */
export async function getActiveShareLink(uid) {
  const existing = await getDocs(query(shareLinksCollection(), where('studentId', '==', uid)))
  if (existing.empty) return null
  // By construction there's at most one, but if the client somehow created
  // duplicates (racing tabs, a failed revoke), take one — never "the newest",
  // since these are `createShareLink`'s own docs, not the professor's, so any
  // one of them can stand in until the next Save.
  const token = existing.docs[0].id
  return { token, url: buildProfessorPanelUrl(token) }
}

/**
 * Mints a fresh share link for this student, revoking any existing one first
 * so exactly one token is ever valid at a time. Revocation happens before
 * creation deliberately: if the create fails, the student ends up with no
 * link (and simply retries) rather than two.
 */
export async function createShareLink(uid) {
  const existing = await getDocs(query(shareLinksCollection(), where('studentId', '==', uid)))
  await Promise.all(existing.docs.map((snapshot) => deleteDoc(snapshot.ref)))

  const token = crypto.randomUUID()
  await setDoc(doc(shareLinksCollection(), token), {
    studentId: uid,
    criadoEm: serverTimestamp(),
  })

  return { token, url: buildProfessorPanelUrl(token), revokedCount: existing.size }
}
