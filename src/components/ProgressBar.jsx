/**
 * A labeled progress bar. `fillClassName` sets the primary filled-segment
 * color; the track is always a solid, visibly darker-than-white gray so the
 * filled vs. empty portions never collapse into each other.
 *
 * `secondaryPercent` optionally renders a second segment right after the
 * primary one (e.g. pending hours next to validated hours) — it's clamped so
 * the two segments never overlap or exceed 100% together, and gets a 2px
 * white seam (`border-l-2 border-white`) so it stays visually distinct from
 * the primary segment even when both happen to share a similar hue (e.g. a
 * category whose own brand color is also amber). Omit it (default 0) for the
 * original single-segment bar — this is pixel-identical to before in that case.
 */
export default function ProgressBar({
  percent,
  label,
  fillClassName = 'bg-emerald-600',
  secondaryPercent = 0,
  secondaryClassName = 'bg-amber-500',
  size = 'md',
}) {
  const clamped = Math.max(0, Math.min(100, percent))
  const clampedSecondary = Math.max(0, Math.min(100 - clamped, secondaryPercent))
  const height = size === 'lg' ? 'h-4' : 'h-2.5'

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={`flex w-full ${height} rounded-full bg-slate-200 overflow-hidden`}
    >
      <div
        className={`${height} shrink-0 ${fillClassName} transition-[width] duration-500 ease-out`}
        style={{ width: `${clamped}%` }}
      />
      {clampedSecondary > 0 && (
        <div
          className={`${height} shrink-0 border-l-2 border-white ${secondaryClassName} transition-[width] duration-500 ease-out`}
          style={{ width: `${clampedSecondary}%` }}
        />
      )}
    </div>
  )
}
