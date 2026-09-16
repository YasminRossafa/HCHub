import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { categoryHasSubcategories } from '../constants/subcategories'
import { db, storage } from './config'

/**
 * Every certificate read/write goes through this module — no component
 * should touch Firestore's `students/{uid}/certificados` subcollection or
 * Firebase Storage's `certificados/{uid}/` prefix directly. Images live in
 * Storage (uploaded before the Firestore write) with only their download URL
 * stored on the document; the image path is deterministic per certificate id
 * (`certificados/{uid}/{certId}.jpg`), so re-uploading on edit naturally
 * overwrites the old file instead of orphaning it.
 */

function certificatesCollection(uid) {
  return collection(db, 'students', uid, 'certificados')
}

function certificateImageRef(uid, certId) {
  return ref(storage, `certificados/${uid}/${certId}.jpg`)
}

function toCertificate(snapshot) {
  return { id: snapshot.id, ...snapshot.data() }
}

/**
 * `subcategoria` is only included when `categoria` is one that actually has
 * subcategories (see constants/subcategories) — for any other category it's
 * simply omitted here, so a fresh certificate never gets the field at all.
 */
function sanitizePayload(data) {
  const payload = {
    titulo: data.titulo ?? '',
    categoria: data.categoria ?? '',
    cargaHoraria: Number(data.cargaHoraria) || 0,
    data: data.data ?? '',
    observacoes: data.observacoes ?? '',
    status: data.status ?? 'pendente',
  }
  if (categoryHasSubcategories(payload.categoria)) {
    payload.subcategoria = data.subcategoria ?? ''
  }
  return payload
}

async function uploadCertificateImage(uid, certId, imageFile) {
  const imageRef = certificateImageRef(uid, certId)
  await uploadBytes(imageRef, imageFile, { contentType: 'image/jpeg' })
  return getDownloadURL(imageRef)
}

/** Returns every certificate registered by this student. */
export async function getCertificates(uid) {
  const snapshot = await getDocs(certificatesCollection(uid))
  return snapshot.docs.map(toCertificate)
}

/** Returns a single certificate by id, or `null` if it doesn't exist. */
export async function getCertificate(uid, certId) {
  const snapshot = await getDoc(doc(certificatesCollection(uid), certId))
  return snapshot.exists() ? toCertificate(snapshot) : null
}

/** Uploads the certificate image to Storage, then creates the Firestore document. */
export async function addCertificate(uid, data, imageFile) {
  const certRef = doc(certificatesCollection(uid))
  const anexoUrl = await uploadCertificateImage(uid, certRef.id, imageFile)
  const payload = {
    ...sanitizePayload(data),
    anexoUrl,
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  }
  await setDoc(certRef, payload)
  return { id: certRef.id, ...payload }
}

/**
 * Updates a certificate's fields. When `newImageFile` is provided, uploads it
 * first (overwriting the previous image at the same Storage path) and points
 * `anexoUrl` at the new download URL; otherwise the existing image is left untouched.
 */
export async function updateCertificate(uid, certId, data, newImageFile) {
  const certRef = doc(certificatesCollection(uid), certId)
  const payload = { ...sanitizePayload(data), atualizadoEm: serverTimestamp() }
  // Editing away from a category that has subcategories must not leave a
  // stale `subcategoria` behind — sanitizePayload only omits the field for a
  // fresh write, so an existing value needs an explicit delete here.
  if (!categoryHasSubcategories(data.categoria)) {
    payload.subcategoria = deleteField()
  }
  if (newImageFile) {
    payload.anexoUrl = await uploadCertificateImage(uid, certId, newImageFile)
  }
  await updateDoc(certRef, payload)
  return toCertificate(await getDoc(certRef))
}

/** Deletes a certificate's Storage image (if any) and its Firestore document. */
export async function deleteCertificate(uid, certId) {
  try {
    await deleteObject(certificateImageRef(uid, certId))
  } catch (error) {
    if (error?.code !== 'storage/object-not-found') throw error
  }
  await deleteDoc(doc(certificatesCollection(uid), certId))
}
