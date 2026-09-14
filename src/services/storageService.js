import { v4 as uuidv4 } from 'uuid'
import { DEFAULT_METAS } from '../constants/categories'

/**
 * Local persistence for the HCHub prototype.
 *
 * Every read/write to the browser's storage goes through this module — no
 * component or hook should touch `localStorage` directly. That keeps the
 * storage medium swappable: replacing this file's internals with real API
 * calls (returning the same shapes) is enough to move to a backend later.
 */

const STORAGE_KEY = 'hchub:data'

const EMPTY_STATE = {
  aluno: null,
  certificados: [],
}

function readState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...EMPTY_STATE }
    const parsed = JSON.parse(raw)
    return {
      aluno: parsed.aluno ?? null,
      certificados: Array.isArray(parsed.certificados) ? parsed.certificados : [],
    }
  } catch {
    return { ...EMPTY_STATE }
  }
}

function writeState(state) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

/** Returns the student profile, or `null` if none has been registered yet. */
export function getStudent() {
  return readState().aluno
}

/** Whether a student profile already exists (used for onboarding redirect logic). */
export function hasStudent() {
  return getStudent() !== null
}

/** Persists the student profile, merging goal defaults for any category left unset. */
export function saveStudent(aluno) {
  const state = readState()
  state.aluno = {
    nome: aluno.nome ?? '',
    curso: aluno.curso ?? '',
    anoIngresso: aluno.anoIngresso ?? new Date().getFullYear(),
    metas: { ...DEFAULT_METAS, ...aluno.metas },
  }
  writeState(state)
  return state.aluno
}

/** Returns all registered certificates. */
export function getCertificates() {
  return readState().certificados
}

/** Adds a new certificate, generating its id, and returns the created record. */
export function addCertificate(certificado) {
  const state = readState()
  const novo = {
    id: uuidv4(),
    titulo: certificado.titulo ?? '',
    categoria: certificado.categoria ?? '',
    cargaHoraria: Number(certificado.cargaHoraria) || 0,
    data: certificado.data ?? '',
    observacoes: certificado.observacoes ?? '',
    status: certificado.status ?? 'pendente',
    anexo: certificado.anexo ?? null,
  }
  state.certificados.push(novo)
  writeState(state)
  return novo
}

/** Applies a partial update to an existing certificate by id. */
export function updateCertificate(id, patch) {
  const state = readState()
  const index = state.certificados.findIndex((c) => c.id === id)
  if (index === -1) return null
  state.certificados[index] = { ...state.certificados[index], ...patch, id }
  writeState(state)
  return state.certificados[index]
}

/** Removes a certificate by id. */
export function deleteCertificate(id) {
  const state = readState()
  state.certificados = state.certificados.filter((c) => c.id !== id)
  writeState(state)
}
