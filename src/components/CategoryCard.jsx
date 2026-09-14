import { Clock } from 'lucide-react'
import { PROGRESS_STATUS_CONFIG } from '../constants/statusConfig'
import ProgressBar from './ProgressBar'
import StatusBadge from './StatusBadge'

/** `count`, when passed, appends "· N certificado(s)" — used by Report/ProfessorPanel. */
export default function CategoryCard({ category, progress, count }) {
  const Icon = category.icon
  const { validatedHours, pendingHours, requiredHours, percent, pendingPercent, status } = progress
  const hasPending = pendingHours > 0

  return (
    <li className="rounded-2xl bg-white p-5 shadow-sm shadow-slate-900/5 ring-1 ring-slate-100 dark:bg-slate-900 dark:shadow-none dark:ring-slate-800">
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
        {typeof count === 'number' && count > 0 && (
          <span className="ml-1">
            · {count} certificado{count === 1 ? '' : 's'}
          </span>
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
    </li>
  )
}
