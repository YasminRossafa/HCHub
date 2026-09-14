import { doc, getDoc, setDoc } from 'firebase/firestore'
import { DEFAULT_METAS } from '../constants/categories'
import { db } from './config'

/** Returns the student profile for this uid, or `null` if onboarding hasn't been completed yet. */
export async function getStudentProfile(uid) {
  const snapshot = await getDoc(doc(db, 'students', uid))
  return snapshot.exists() ? snapshot.data() : null
}

/** Persists the student profile to `students/{uid}`, merging goal defaults for any category left unset. */
export async function saveStudentProfile(uid, aluno) {
  const profile = {
    nome: aluno.nome ?? '',
    curso: aluno.curso ?? '',
    anoIngresso: aluno.anoIngresso ?? new Date().getFullYear(),
    metas: { ...DEFAULT_METAS, ...aluno.metas },
  }
  await setDoc(doc(db, 'students', uid), profile)
  return profile
}
