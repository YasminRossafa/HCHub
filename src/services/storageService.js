import { v4 as uuidv4 } from 'uuid'

/**
 * Local persistence for the HCHub prototype's certificates.
 *
 * Every read/write to the browser's storage goes through this module — no
 * component or hook should touch `localStorage` directly. That keeps the
 * storage medium swappable: replacing this file's internals with real API
 * calls (returning the same shapes) is enough to move to a backend later.
 *
 * The student profile itself now lives in Firestore (see src/firebase/studentService.js)
 * — this is the "split" data model until certificates are migrated too.
 */

const STORAGE_KEY = 'hchub:data'

function readState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { certificados: [] }
    const parsed = JSON.parse(raw)
    return { certificados: Array.isArray(parsed.certificados) ? parsed.certificados : [] }
  } catch {
    return { certificados: [] }
  }
}

function writeState(state) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
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
