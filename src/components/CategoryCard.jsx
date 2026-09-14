import { PROGRESS_STATUS_CONFIG } from '../constants/statusConfig'
import ProgressBar from './ProgressBar'
import StatusBadge from './StatusBadge'

export default function CategoryCard({ category, progress }) {
  const Icon = category.icon
  const { completed, goal, percent, status } = progress

  return (
    <li className="rounded-2xl bg-white p-5 shadow-sm shadow-slate-900/5 ring-1 ring-slate-100">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${category.softBg}`}>
            <Icon aria-hidden="true" className={category.text} size={20} />
          </span>
          <h3 className="font-semibold text-slate-900">{category.label}</h3>
        </div>
      </div>

      <p className="mt-4 text-sm text-slate-500">
        <span className="text-lg font-bold text-slate-900">{completed}</span> de {goal}h
      </p>

      <div className="mt-2">
        <ProgressBar
          percent={percent}
          fillClassName={category.solidBg}
          label={`Progresso em ${category.label}: ${completed} de ${goal} horas`}
        />
      </div>

      <div className="mt-4">
        <StatusBadge status={status} config={PROGRESS_STATUS_CONFIG} />
      </div>
    </li>
  )
}
