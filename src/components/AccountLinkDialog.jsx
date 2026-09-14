import { useState } from 'react'
import ConfirmDialog from './ConfirmDialog'

/**
 * Renders whichever cross-provider linking confirmation `useAccountLinking`
 * currently has open. `onLinked` receives the confirmLink() result so the
 * caller can show its own success message and handle post-login routing.
 */
export default function AccountLinkDialog({ linking, onLinked }) {
  const { dialog, isConfirming, dialogError, cancelDialog, confirmLink } = linking
  const [password, setPassword] = useState('')

  if (!dialog) return null

  function handleCancel() {
    setPassword('')
    cancelDialog()
  }

  async function handleConfirm() {
    const result = await confirmLink(dialog.type === 'password-exists' ? password : undefined)
    if (result) {
      setPassword('')
      onLinked(result)
    }
  }

  if (dialog.type === 'google-exists') {
    return (
      <ConfirmDialog
        open
        variant="info"
        title="Conta encontrada com Google"
        description="Este e-mail já tem uma conta feita com login do Google. Deseja continuar com o Google e vincular uma senha a essa conta?"
        confirmLabel={isConfirming ? 'Conectando…' : 'Continuar com Google'}
        cancelLabel="Cancelar"
        isConfirming={isConfirming}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      >
        {dialogError && (
          <p role="alert" className="text-sm text-rose-600">
            {dialogError}
          </p>
        )}
      </ConfirmDialog>
    )
  }

  return (
    <ConfirmDialog
      open
      variant="info"
      title="Conta encontrada com senha"
      description="Este e-mail já tem uma conta com senha. Digite sua senha para confirmar e vincular o login com Google a ela."
      confirmLabel={isConfirming ? 'Confirmando…' : 'Confirmar'}
      cancelLabel="Cancelar"
      isConfirming={isConfirming}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="link-password" className="text-sm font-medium text-slate-700">
          Senha
        </label>
        <input
          id="link-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleConfirm()
            }
          }}
          aria-describedby={dialogError ? 'link-password-erro' : undefined}
          aria-invalid={Boolean(dialogError)}
          className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 focus-visible:border-emerald-500"
        />
        {dialogError && (
          <p id="link-password-erro" className="text-sm text-rose-600">
            {dialogError}
          </p>
        )}
      </div>
    </ConfirmDialog>
  )
}
