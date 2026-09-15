import { CATEGORIES } from '../constants/categories'

export const STATUS = {
  NOT_STARTED: 'nao-iniciada',
  IN_PROGRESS: 'em-andamento',
  COMPLETE: 'completa',
}

// UFSCar only formally validates complementary hours twice in the whole
// course, so "status" (não iniciada/em andamento/completa) deliberately
// reflects validated hours only — that's the only number that "counts"
// officially between validation windows.
function statusFor(validatedHours, requiredHours) {
  if (requiredHours > 0 && validatedHours >= requiredHours) return STATUS.COMPLETE
  if (validatedHours > 0) return STATUS.IN_PROGRESS
  return STATUS.NOT_STARTED
}

function sumHours(certificados, predicate) {
  return certificados.filter(predicate).reduce((sum, c) => sum + (Number(c.cargaHoraria) || 0), 0)
}

function toProgress(validatedHours, pendingHours, requiredHours) {
  const percent = requiredHours > 0 ? Math.min(100, Math.round((validatedHours / requiredHours) * 100)) : 0
  const pendingPercent =
    requiredHours > 0 ? Math.min(100 - percent, Math.round((pendingHours / requiredHours) * 100)) : 0
  return {
    validatedHours,
    pendingHours,
    requiredHours,
    percent,
    pendingPercent,
    status: statusFor(validatedHours, requiredHours),
  }
}

/** Categories with a nonzero goal — a goal of 0 hides a category everywhere it'd otherwise be offered. */
export function getActiveCategories(aluno) {
  return CATEGORIES.filter((category) => (aluno?.metas?.[category.key] ?? 0) > 0)
}

/**
 * Validated and pending hours for a single category. Rejected certificates
 * count toward neither — they're excluded from progress entirely, though
 * they still show normally in History.
 */
export function getCategoryProgress(categoryKey, aluno, certificados) {
  const requiredHours = aluno?.metas?.[categoryKey] ?? 0
  const inCategory = (c) => c.categoria === categoryKey
  const validatedHours = sumHours(certificados, (c) => inCategory(c) && c.status === 'validado')
  const pendingHours = sumHours(certificados, (c) => inCategory(c) && c.status === 'pendente')
  return toProgress(validatedHours, pendingHours, requiredHours)
}

/** Certificates confirmed by a professor — the only ones that count toward the official validated-hours total. */
export function getValidatedCertificates(certificados) {
  return certificados.filter((c) => c.status === 'validado')
}

/** Certificates awaiting a professor's decision — shown in the report alongside validated ones, but not yet counted. */
export function getPendingCertificates(certificados) {
  return certificados.filter((c) => c.status === 'pendente')
}

/**
 * Validated and pending hours across every active category (goal > 0),
 * against the sum of their goals. A zeroed-out category contributes nothing
 * here, the same way it renders no card on the Dashboard.
 */
export function getOverallProgress(aluno, certificados) {
  const totals = getActiveCategories(aluno).reduce(
    (acc, category) => {
      const { validatedHours, pendingHours, requiredHours } = getCategoryProgress(category.key, aluno, certificados)
      acc.validatedHours += validatedHours
      acc.pendingHours += pendingHours
      acc.requiredHours += requiredHours
      return acc
    },
    { validatedHours: 0, pendingHours: 0, requiredHours: 0 },
  )
  return toProgress(totals.validatedHours, totals.pendingHours, totals.requiredHours)
}
