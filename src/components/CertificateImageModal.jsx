import { X } from 'lucide-react'
import { useRef } from 'react'
import { createPortal } from 'react-dom'
import { useModalFocusTrap } from './useModalFocusTrap'

/**
 * Full-size, in-page view of a certificate's image — opened from
 * ExpandableCertificateImage instead of navigating to a new tab/route.
 * Same accessibility contract as ConfirmDialog (see useModalFocusTrap):
 * focus trap, Escape to close, focus returns to the trigger, portal-rendered
 * so it sits above the fixed mobile nav regardless of where it's mounted.
 */
export default function CertificateImageModal({ open, imageUrl, title, onClose }) {
  const dialogRef = useRef(null)
  const closeButtonRef = useRef(null)

  useModalFocusTrap({ open, onClose, containerRef: dialogRef, initialFocusRef: closeButtonRef })

  if (!open || !imageUrl) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Certificado: ${title}`}
        className="relative flex max-h-[90vh] max-w-full items-center justify-center"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute -top-3 -right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 shadow-lg hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <X aria-hidden="true" size={20} />
        </button>
        <img
          src={imageUrl}
          alt={`Certificado: ${title}`}
          className="max-h-[90vh] max-w-full rounded-2xl object-contain shadow-2xl sm:max-h-[700px] sm:max-w-[700px]"
        />
      </div>
    </div>,
    document.body,
  )
}
