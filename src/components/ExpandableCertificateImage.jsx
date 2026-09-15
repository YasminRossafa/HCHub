import { Expand } from 'lucide-react'
import { useState } from 'react'
import CertificateImageModal from './CertificateImageModal'

/**
 * A certificate thumbnail that opens CertificateImageModal in place instead
 * of navigating anywhere. `className` sizes the thumbnail itself (callers
 * vary from a compact 56px row thumbnail to a large review-card preview);
 * `showOverlayLabel` adds a small "Ampliar" pill for thumbnails big enough
 * for it to read as an affordance rather than clutter.
 *
 * The trigger is a single `<button>` with its own aria-label, so the inner
 * `<img>` is marked decorative (empty alt) to avoid announcing the same
 * name twice — the real `alt="Certificado: {título}"` lives on the
 * full-size image inside the modal.
 */
export default function ExpandableCertificateImage({ src, title, className = '', showOverlayLabel = false }) {
  const [open, setOpen] = useState(false)

  if (!src) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Ampliar certificado: ${title}`}
        className={`group relative block shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800 ${className}`}
      >
        <img src={src} alt="" loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]" />
        {showOverlayLabel && (
          <span className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-lg bg-slate-900/80 px-2 py-1 text-xs font-medium text-white">
            <Expand aria-hidden="true" size={12} />
            Ampliar
          </span>
        )}
      </button>
      <CertificateImageModal open={open} imageUrl={src} title={title} onClose={() => setOpen(false)} />
    </>
  )
}
