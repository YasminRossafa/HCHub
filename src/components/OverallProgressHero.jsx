import { CheckCircle2, Clock, TrendingUp } from 'lucide-react'
import ProgressBar from './ProgressBar'

/**
 * The single most important element on the dashboard: a large, high-weight
 * summary of total validated hours vs. the total required across every
 * category. Deliberately styled far bigger/heavier than any category card.
 *
 * The big percentage is deliberately validated-only — UFSCar only formally
 * validates hours twice in the whole course, so this stays the "official"
 * number. Pending hours get a visually secondary pill (smaller, amber, paired
 * with a clock icon + label so the distinction never rests on color alone)
 * so students can still see progress sitting between validation windows
 * without it being mistaken for confirmed progress.
 */
export default function OverallProgressHero({ validatedHours, pendingHours, requiredHours, percent }) {
  const hasPending = pendingHours > 0

  return (
    <section
      aria-labelledby="overall-progress-heading"
      className="rounded-3xl bg-slate-900 p-6 text-white shadow-lg shadow-slate-900/20 sm:p-8"
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="overall-progress-heading" className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <TrendingUp aria-hidden="true" size={18} className="text-emerald-400" />
            Progresso geral
          </h2>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
            <p className="text-6xl font-extrabold tracking-tight text-white sm:text-7xl">
              {percent}
              <span className="text-3xl font-bold text-emerald-400 sm:text-4xl">%</span>
            </p>
            {hasPending && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-2.5 py-1 text-sm font-semibold text-amber-300">
                <Clock aria-hidden="true" size={14} />+{pendingHours}h pendentes de validação
              </span>
            )}
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-base text-slate-300">
            <CheckCircle2 aria-hidden="true" size={16} className="shrink-0 text-emerald-400" />
            <span>
              <span className="font-semibold text-white">{validatedHours}</span> de {requiredHours} horas
              complementares validadas
            </span>
          </p>
        </div>
      </div>

      <div className="mt-6">
        <ProgressBar
          percent={percent}
          size="lg"
          fillClassName="bg-emerald-400"
          label={`Progresso geral: ${validatedHours} de ${requiredHours} horas validadas${
            hasPending ? `, mais ${pendingHours} horas pendentes de validação` : ''
          }`}
        />
      </div>
    </section>
  )
}
