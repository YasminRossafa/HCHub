import { AlertTriangle, Link2 } from 'lucide-react'
import { useRef } from 'react'
import { createPortal } from 'react-dom'
import Button from './Button'
import { useModalFocusTrap } from './useModalFocusTrap'

const VARIANTS = {
  danger: {
    Icon: AlertTriangle,
    iconBg: 'bg-rose-50 dark:bg-rose-950',
    iconColor: 'text-rose-600 dark:text-rose-400',
    confirmVariant: 'danger',
  },
  info: {
    Icon: Link2,
    iconBg: 'bg-emerald-50 dark:bg-emerald-950',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    confirmVariant: 'primary',
  },
}

/**
 * A modal confirmation dialog with a focus trap: focus moves into it on
 * open, Tab/Shift+Tab wrap within it, Escape cancels, and focus returns to
 * whatever triggered it on close. Rendered via portal so it always sits
 * above the fixed mobile nav bar regardless of where it's mounted.
 *
 * `variant="danger"` (default) is the destructive-confirmation look used by
 * the delete flow; `variant="info"` swaps in a neutral tone for non-destructive
 * confirmations (e.g. account linking). `children` renders extra content
 * (like a password field) between the description and the action buttons.
 * `isConfirming` disables both actions while an async onConfirm is in flight.
 */
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  variant = 'danger',
  isConfirming = false,
  children,
}) {
  const dialogRef = useRef(null)
  const cancelButtonRef = useRef(null)
  const { Icon, iconBg, iconColor, confirmVariant } = VARIANTS[variant]

  useModalFocusTrap({ open, onClose: onCancel, containerRef: dialogRef, initialFocusRef: cancelButtonRef, disabled: isConfirming })

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center"
      onClick={isConfirming ? undefined : onCancel}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-lg dark:bg-slate-900 dark:shadow-none dark:ring-1 dark:ring-slate-800"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
            <Icon aria-hidden="true" className={iconColor} size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="confirm-dialog-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {title}
            </h2>
            <p id="confirm-dialog-description" className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {description}
            </p>
          </div>
        </div>

        {children && <div className="mt-4">{children}</div>}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button ref={cancelButtonRef} type="button" variant="secondary" onClick={onCancel} disabled={isConfirming}>
            {cancelLabel}
          </Button>
          <Button type="button" variant={confirmVariant} onClick={onConfirm} disabled={isConfirming}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
