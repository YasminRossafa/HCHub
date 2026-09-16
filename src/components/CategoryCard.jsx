import { ChevronDown, Clock } from 'lucide-react'
import { useId, useState } from 'react'
import { PROGRESS_STATUS_CONFIG } from '../constants/statusConfig'
import ProgressBar from './ProgressBar'
import StatusBadge from './StatusBadge'

/** e.g. "3h validadas + 2h pendentes" — omits either half when its hours are 0 (a row never has both at 0). */
function hoursSummaryText(validatedHours, pendingHours) {
  const parts = []
  if (validatedHours > 0) parts.push(`${validatedHours}h validadas`)
  if (pendingHours > 0) parts.push(`${pendingHours}h pendentes`)
  return parts.join(' + ')
}

/** Same text as `hoursSummaryText`, with the "pendentes" half colored amber to match the segmented bar next to it. */
function SubcategoryHoursText({ validatedHours, pendingHours }) {
  return (
    <>
      {validatedHours > 0 && `${validatedHours}h validadas`}
      {validatedHours > 0 && pendingHours > 0 && ' + '}
      {pendingHours > 0 && (
        <span className="font-medium text-amber-800 dark:text-amber-300">{pendingHours}h pendentes</span>
      )}
    </>
  )
}

/**
 * `className` merges into the root `<li>` — used by Dashboard to apply a grid col-span when the adaptive category grid needs one (see utils/categoryGrid).
 * `subcategoryBreakdown` comes from utils/progress.getSubcategoryBreakdown: `null` for a category with no
 * subcategories (no control shown at all), `[]` for one with subcategories but zero validado+pendente hours
 * (also no control — a true empty category), or the rows to render behind the "Ver por tipo" toggle — each
 * with `percent`/`pendingPercent` sized for ProgressBar's segmented (validado-then-pendente) bar.
 */
export default function CategoryCard({ category, progress, subcategoryBreakdown = null, className = '' }) {
  const Icon = category.icon
  const { validatedHours, pendingHours, requiredHours, percent, pendingPercent, status } = progress
  const hasPending = pendingHours > 0
  const hasBreakdown = Boolean(subcategoryBreakdown && subcategoryBreakdown.length > 0)
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false)
  const breakdownId = useId()

  return (
    <li
      className={`rounded-2xl bg-white p-5 shadow-sm shadow-slate-900/5 ring-1 ring-slate-100 dark:bg-slate-900 dark:shadow-none dark:ring-slate-800 ${className}`.trim()}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${category.softBg}`}>
            <Icon aria-hidden="true" className={category.text} size={20} />
          </span>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">{category.label}</h3>
        </div>
        <span className="flex h-10 shrink-0 items-center text-sm font-normal text-slate-500 dark:text-slate-400">
          {requiredHours}h
        </span>
      </div>

      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
        <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{validatedHours}h</span> validadas
        {hasPending && (
          <>
            {' + '}
            <span className="font-semibold text-amber-800 dark:text-amber-300">{pendingHours}h</span> pendentes
          </>
        )}
      </p>

      <div className="mt-2">
        <ProgressBar
          percent={percent}
          secondaryPercent={pendingPercent}
          fillClassName={category.solidBg}
          secondaryClassName="bg-amber-500 dark:bg-amber-500"
          label={`Progresso em ${category.label}: ${validatedHours}h validadas${
            hasPending ? ` e ${pendingHours}h pendentes` : ''
          } de ${requiredHours}h necessárias`}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <StatusBadge status={status} config={PROGRESS_STATUS_CONFIG} />
        {hasPending && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            <Clock aria-hidden="true" size={14} />
            {pendingHours}h aguardando validação
          </span>
        )}
      </div>

      {hasBreakdown && (
        <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setIsBreakdownOpen((open) => !open)}
            aria-expanded={isBreakdownOpen}
            aria-controls={breakdownId}
            className="flex w-full items-center justify-between gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
          >
            {isBreakdownOpen ? 'Ocultar por tipo' : 'Ver por tipo'}
            <ChevronDown
              aria-hidden="true"
              size={18}
              className={`shrink-0 transition-transform ${isBreakdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          <ul id={breakdownId} hidden={!isBreakdownOpen} className="mt-3 flex flex-col gap-3">
            {subcategoryBreakdown.map((row) => {
              const totalPercent = Math.min(100, row.percent + row.pendingPercent)
              const hoursText = hoursSummaryText(row.validatedHours, row.pendingHours)
              return (
                <li key={row.key}>
                  <div className="flex items-center justify-between gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <span>{row.label}</span>
                    <span className="font-medium text-slate-800 dark:text-slate-100">{totalPercent}%</span>
                  </div>
                  <p className="mb-1 text-sm text-slate-500 dark:text-slate-400">
                    <SubcategoryHoursText validatedHours={row.validatedHours} pendingHours={row.pendingHours} />
                  </p>
                  <ProgressBar
                    percent={row.percent}
                    secondaryPercent={row.pendingPercent}
                    fillClassName={category.solidBg}
                    secondaryClassName="bg-amber-500 dark:bg-amber-500"
                    label={`${row.label}: ${hoursText} — ${totalPercent}% das horas de ${category.label}`}
                  />
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </li>
  )
}
