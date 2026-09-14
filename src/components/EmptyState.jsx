import { FolderOpen, PlusCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from './Button'

/**
 * Reused for every "nothing to show" moment in the app (no certificates yet,
 * no filter results, etc.) — pass an `icon`/copy override and either an
 * `actionTo` (navigates) or `onAction` (runs a callback, e.g. clear filters).
 */
export default function EmptyState({
  icon: Icon = FolderOpen,
  title = 'Nenhuma atividade registrada ainda',
  description = 'Comece adicionando um certificado para acompanhar suas horas complementares em cada categoria.',
  actionLabel = 'Registrar nova atividade',
  actionTo = '/registrar',
  onAction,
}) {
  return (
    <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-slate-200 bg-white px-6 py-14 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950">
        <Icon aria-hidden="true" className="text-emerald-600 dark:text-emerald-400" size={32} />
      </span>
      <h2 className="mt-5 text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
      <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>
      {onAction ? (
        <Button type="button" variant="primary" onClick={onAction} className="mt-6">
          {actionLabel}
        </Button>
      ) : (
        <Button as={Link} to={actionTo} variant="primary" className="mt-6">
          <PlusCircle aria-hidden="true" size={20} />
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
