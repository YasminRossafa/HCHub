import { EmailAuthProvider, GoogleAuthProvider, fetchSignInMethodsForEmail, linkWithCredential } from 'firebase/auth'
import { useState } from 'react'
import { auth } from './config'
import { getAuthErrorMessage, signInWithEmail, signInWithGoogle } from './authService'

/**
 * Detects and resolves the two cross-provider conflicts Firebase Auth doesn't
 * handle on its own: an email already registered via Google being retried
 * with a password, and vice versa. Never links silently — every link goes
 * through an explicit confirmation dialog (see AccountLinkDialog).
 */
export function useAccountLinking() {
  const [dialog, setDialog] = useState(null)
  const [isConfirming, setIsConfirming] = useState(false)
  const [dialogError, setDialogError] = useState(null)

  /**
   * Call from a failed email/password sign-in or sign-up. If the email turns
   * out to be registered via Google only, opens the linking dialog and
   * returns true (the caller should suppress its own generic error).
   */
  async function offerGoogleLink(email, password) {
    try {
      const methods = await fetchSignInMethodsForEmail(auth, email)
      if (methods.length === 1 && methods[0] === 'google.com') {
        setDialogError(null)
        setDialog({ type: 'google-exists', email, password })
        return true
      }
    } catch {
      // Can't determine sign-in methods — fall back to the caller's own error.
    }
    return false
  }

  /**
   * Call from a failed Google sign-in, passing the caught error. If it's a
   * genuine cross-provider conflict with an existing password account, opens
   * the linking dialog and returns true.
   */
  async function offerPasswordLink(error) {
    if (error?.code !== 'auth/account-exists-with-different-credential') return false
    const pendingCredential = GoogleAuthProvider.credentialFromError(error)
    const email = error?.customData?.email
    if (!pendingCredential || !email) return false
    try {
      const methods = await fetchSignInMethodsForEmail(auth, email)
      if (methods.includes('password')) {
        setDialogError(null)
        setDialog({ type: 'password-exists', email, pendingCredential })
        return true
      }
    } catch {
      // Can't determine sign-in methods — fall back to the caller's own error.
    }
    return false
  }

  function cancelDialog() {
    setDialog(null)
    setDialogError(null)
    setIsConfirming(false)
  }

  /**
   * Confirms whichever dialog is open. `enteredPassword` is only used for
   * the "password-exists" direction (the existing account's password); the
   * "google-exists" direction already carries the password from the original
   * attempt. Returns `{ user, linked }` on success (`linked: false` means the
   * user is signed in but the link itself failed), or `null` if canceled or
   * still awaiting a retry (dialog stays open with `dialogError` set).
   */
  async function confirmLink(enteredPassword) {
    if (!dialog) return null
    setIsConfirming(true)
    setDialogError(null)
    try {
      let userCredential
      let credentialToLink
      if (dialog.type === 'google-exists') {
        userCredential = await signInWithGoogle()
        credentialToLink = EmailAuthProvider.credential(dialog.email, dialog.password)
      } else {
        userCredential = await signInWithEmail(dialog.email, enteredPassword)
        credentialToLink = dialog.pendingCredential
      }

      try {
        await linkWithCredential(userCredential.user, credentialToLink)
        setDialog(null)
        return { user: userCredential.user, linked: true }
      } catch (linkError) {
        console.error(linkError)
        setDialog(null)
        return { user: userCredential.user, linked: false }
      }
    } catch (err) {
      const isAbandonedPopup =
        dialog.type === 'google-exists' &&
        (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request')
      if (isAbandonedPopup) {
        setDialog(null)
        return null
      }
      setDialogError(getAuthErrorMessage(err))
      return null
    } finally {
      setIsConfirming(false)
    }
  }

  return { dialog, isConfirming, dialogError, offerGoogleLink, offerPasswordLink, cancelDialog, confirmLink }
}
