import { CalendarDays, Clock3, Pencil, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CATEGORIES_BY_KEY } from '../constants/categories'
import { CERTIFICATE_STATUS_CONFIG } from '../constants/statusConfig'
import { formatDate } from '../utils/date'
import Button from './Button'
import StatusBadge from './StatusBadge'

export default function CertificateListItem({ certificate, onDeleteRequest }) {
  const category = CATEGORIES_BY_KEY[certificate.categoria]
  const Icon = category?.icon

  return (
    <li className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          {Icon && (
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${category.softBg}`}
            >
              <Icon aria-hidden="true" className={category.text} size={20} />
            </span>
          )}
          <div className="min-w-0">
            <p className="break-words font-semibold text-slate-900">{certificate.titulo}</p>
            <p className="text-sm text-slate-500">{category?.label ?? certificate.categoria}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1">
                <Clock3 aria-hidden="true" size={14} />
                {certificate.cargaHoraria}h
              </span>
              <span className="inline-flex items-center gap-1">
                <CalendarDays aria-hidden="true" size={14} />
                {formatDate(certificate.data)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-center sm:gap-2.5">
          <StatusBadge status={certificate.status} config={CERTIFICATE_STATUS_CONFIG} />
          <div className="flex items-center gap-2">
            <Button
              as={Link}
              to={`/registrar/${certificate.id}`}
              variant="secondary"
              size="sm"
              aria-label={`Editar ${certificate.titulo}`}
            >
              <Pencil aria-hidden="true" size={16} />
              Editar
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="text-rose-700 hover:border-rose-300 hover:bg-rose-50"
              onClick={onDeleteRequest}
              aria-label={`Excluir ${certificate.titulo}`}
            >
              <Trash2 aria-hidden="true" size={16} />
              Excluir
            </Button>
          </div>
        </div>
      </div>
    </li>
  )
}
