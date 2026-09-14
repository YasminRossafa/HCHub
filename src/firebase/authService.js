import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { auth } from './config'

const googleProvider = new GoogleAuthProvider()

const ERROR_MESSAGES = {
  'auth/invalid-email': 'E-mail inválido.',
  'auth/missing-email': 'Informe seu e-mail.',
  'auth/user-disabled': 'Esta conta foi desativada.',
  'auth/user-not-found': 'Não encontramos uma conta com este e-mail.',
  'auth/wrong-password': 'Senha incorreta.',
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/missing-password': 'Informe sua senha.',
  'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
  'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres.',
  'auth/too-many-requests': 'Muitas tentativas. Tente novamente em alguns minutos.',
  'auth/popup-closed-by-user': 'Login cancelado.',
  'auth/cancelled-popup-request': 'Login cancelado.',
  'auth/popup-blocked': 'O navegador bloqueou a janela de login. Permita pop-ups e tente novamente.',
  'auth/network-request-failed': 'Falha de conexão. Verifique sua internet e tente novamente.',
  'auth/account-exists-with-different-credential': 'Este e-mail já está cadastrado com outro método de login.',
}

// Codes that are safe to surface as their own error: they say nothing about
// whether an account exists for the given email. Every other code (including
// "user not found") is swallowed by requestPasswordReset so the UI can show
// one identical message regardless of account existence.
const RESET_ERROR_CODES = new Set(['auth/invalid-email', 'auth/missing-email', 'auth/network-request-failed'])

/** Translates a Firebase Auth error into a friendly Portuguese message — never surface error.message directly. */
export function getAuthErrorMessage(error) {
  return ERROR_MESSAGES[error?.code] ?? 'Não foi possível concluir a operação. Tente novamente.'
}

export function signUpWithEmail(email, password) {
  return createUserWithEmailAndPassword(auth, email, password)
}

export function signInWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password)
}

export function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider)
}

export function signOut() {
  return firebaseSignOut(auth)
}

/**
 * Always resolves — even when no account exists for `email` — so the caller
 * can show one generic "check your inbox" message regardless of account
 * existence, preventing account enumeration via this form. Only genuine,
 * non-revealing failures (malformed email, network issues) reject.
 */
export async function requestPasswordReset(email) {
  try {
    await sendPasswordResetEmail(auth, email)
  } catch (err) {
    if (RESET_ERROR_CODES.has(err?.code)) throw err
  }
}

/** Subscribes to auth state changes; returns the unsubscribe function. */
export function onAuthStateChanged(callback) {
  return firebaseOnAuthStateChanged(auth, callback)
}
