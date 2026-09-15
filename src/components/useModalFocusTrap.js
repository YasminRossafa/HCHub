import { useEffect, useRef } from 'react'

const FOCUSABLE_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

/**
 * Shared modal accessibility behavior, factored out of ConfirmDialog so any
 * portal-rendered modal (see CertificateImageModal) gets the same contract:
 * focus moves into the modal on open (to `initialFocusRef`, or the container
 * itself if omitted), Tab/Shift+Tab wrap within it instead of escaping to the
 * page behind it, Escape closes it (unless `disabled`, e.g. a request in
 * flight), and focus returns to whatever triggered it once it closes.
 */
export function useModalFocusTrap({ open, onClose, containerRef, initialFocusRef, disabled = false }) {
  const previouslyFocusedRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    previouslyFocusedRef.current = document.activeElement
    ;(initialFocusRef?.current ?? containerRef.current)?.focus()

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        if (disabled) return
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !containerRef.current) return

      const focusables = Array.from(containerRef.current.querySelectorAll(FOCUSABLE_SELECTOR))
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (previouslyFocusedRef.current instanceof HTMLElement) {
        previouslyFocusedRef.current.focus()
      }
    }
  }, [open, onClose, containerRef, initialFocusRef, disabled])
}
