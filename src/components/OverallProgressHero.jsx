import { TrendingUp } from 'lucide-react'
import ProgressBar from './ProgressBar'

/**
 * The single most important element on the dashboard: a large, high-weight
 * summary of total validated hours vs. the total required across every
 * category. Deliberately styled far bigger/heavier than any category card.
 */
export default function OverallProgressHero({ completed, goal, percent }) {
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
          <p className="mt-1 text-6xl font-extrabold tracking-tight text-white sm:text-7xl">
            {percent}
            <span className="text-3xl font-bold text-emerald-400 sm:text-4xl">%</span>
          </p>
          <p className="mt-2 text-base text-slate-300">
            <span className="font-semibold text-white">{completed}</span> de {goal} horas
            complementares concluídas
          </p>
        </div>
      </div>

      <div className="mt-6">
        <ProgressBar
          percent={percent}
          size="lg"
          fillClassName="bg-emerald-400"
          label={`Progresso geral: ${completed} de ${goal} horas concluídas`}
        />
      </div>
    </section>
  )
}
