/**
 * A labeled progress bar. `fillClassName` sets the filled-segment color; the
 * track is always a solid, visibly darker-than-white gray so the filled vs.
 * empty portions never collapse into each other.
 */
export default function ProgressBar({ percent, label, fillClassName = 'bg-emerald-600', size = 'md' }) {
  const clamped = Math.max(0, Math.min(100, percent))
  const height = size === 'lg' ? 'h-4' : 'h-2.5'

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={`w-full ${height} rounded-full bg-slate-200 overflow-hidden`}
    >
      <div
        className={`${height} rounded-full ${fillClassName} transition-[width] duration-500 ease-out`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
