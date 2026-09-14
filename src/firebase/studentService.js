import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { DEFAULT_METAS } from '../constants/categories'
import { db } from './config'

/** Returns the student profile for this uid, or `null` if onboarding hasn't been completed yet. */
export async function getStudentProfile(uid) {
  const snapshot = await getDoc(doc(db, 'students', uid))
  return snapshot.exists() ? snapshot.data() : null
}

/**
 * Persists the student profile to `students/{uid}`, merging goal defaults for any category left unset.
 * `temaPreferido` ("light" | "dark" | "system") defaults to "system" — callers that already have a
 * loaded profile should pass its current value through so a Settings save doesn't reset it.
 */
export async function saveStudentProfile(uid, aluno) {
  const profile = {
    nome: aluno.nome ?? '',
    curso: aluno.curso ?? '',
    anoIngresso: aluno.anoIngresso ?? new Date().getFullYear(),
    metas: { ...DEFAULT_METAS, ...aluno.metas },
    temaPreferido: aluno.temaPreferido ?? 'system',
  }
  await setDoc(doc(db, 'students', uid), profile)
  return profile
}

/** Updates only the theme preference on an existing profile, without touching any other field. */
export async function updateThemePreference(uid, temaPreferido) {
  await updateDoc(doc(db, 'students', uid), { temaPreferido })
}
