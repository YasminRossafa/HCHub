import { forwardRef } from 'react'

const VARIANT_CLASSES = {
  primary:
    'bg-emerald-600 text-white shadow-md shadow-emerald-900/10 hover:bg-emerald-700 active:bg-emerald-800',
  secondary:
    'bg-white text-slate-900 border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50 active:bg-slate-100',
  danger:
    'bg-rose-600 text-white shadow-md shadow-rose-900/10 hover:bg-rose-700 active:bg-rose-800',
}

const SIZE_CLASSES = {
  md: 'px-5 py-3 text-base',
  sm: 'px-3.5 py-2.5 text-sm',
}

const BASE_CLASSES =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold ' +
  'transition-colors disabled:opacity-50 disabled:pointer-events-none'

/**
 * Shared action button. `variant` establishes the visual languages the rest
 * of the app reuses: "primary" for the one main action on a screen,
 * "secondary" for everything else, "danger" for destructive confirmations.
 * `size="sm"` keeps compact inline actions (e.g. list row edit/delete) at a
 * comfortable ~44px touch target without needing className overrides.
 */
const Button = forwardRef(function Button(
  { as: Component = 'button', variant = 'primary', size = 'md', className = '', ...props },
  ref,
) {
  const classes = `${BASE_CLASSES} ${SIZE_CLASSES[size]} ${VARIANT_CLASSES[variant]} ${className}`.trim()
  return <Component ref={ref} className={classes} {...props} />
})

export default Button
