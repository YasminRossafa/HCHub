import { CheckCircle2, Circle, Clock, XCircle } from 'lucide-react'
import { STATUS } from '../utils/progress'

/** Category-progress statuses (não iniciada / em andamento / completa). */
export const PROGRESS_STATUS_CONFIG = {
  [STATUS.NOT_STARTED]: { label: 'Não iniciada', icon: Circle, className: 'bg-slate-100 text-slate-600' },
  [STATUS.IN_PROGRESS]: { label: 'Em andamento', icon: Clock, className: 'bg-amber-50 text-amber-800' },
  [STATUS.COMPLETE]: { label: 'Completa', icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-700' },
}

/** Certificate review statuses (pendente / validado / rejeitado). */
export const CERTIFICATE_STATUS_CONFIG = {
  pendente: { label: 'Pendente', icon: Clock, className: 'bg-amber-50 text-amber-800' },
  validado: { label: 'Validado', icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-700' },
  rejeitado: { label: 'Rejeitado', icon: XCircle, className: 'bg-rose-50 text-rose-700' },
}
