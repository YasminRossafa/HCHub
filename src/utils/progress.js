import { CATEGORIES } from '../constants/categories'

export const STATUS = {
  NOT_STARTED: 'nao-iniciada',
  IN_PROGRESS: 'em-andamento',
  COMPLETE: 'completa',
}

function statusFor(completed, goal) {
  if (goal > 0 && completed >= goal) return STATUS.COMPLETE
  if (completed > 0) return STATUS.IN_PROGRESS
  return STATUS.NOT_STARTED
}

function toProgress(completed, goal) {
  const percent = goal > 0 ? Math.min(100, Math.round((completed / goal) * 100)) : 0
  return { completed, goal, percent, status: statusFor(completed, goal) }
}

/** Validated hours for a single category, summed from certificados with status "validado". */
export function getCategoryProgress(categoryKey, aluno, certificados) {
  const goal = aluno?.metas?.[categoryKey] ?? 0
  const completed = certificados
    .filter((c) => c.categoria === categoryKey && c.status === 'validado')
    .reduce((sum, c) => sum + (Number(c.cargaHoraria) || 0), 0)
  return toProgress(completed, goal)
}

/** Certificates confirmed by a professor — the only ones that count toward progress or a report. */
export function getValidatedCertificates(certificados) {
  return certificados.filter((c) => c.status === 'validado')
}

/** Validated hours across every category, against the sum of all goals. */
export function getOverallProgress(aluno, certificados) {
  const totals = CATEGORIES.reduce(
    (acc, category) => {
      const { completed, goal } = getCategoryProgress(category.key, aluno, certificados)
      acc.completed += completed
      acc.goal += goal
      return acc
    },
    { completed: 0, goal: 0 },
  )
  return toProgress(totals.completed, totals.goal)
}
