import { CATEGORIES } from '../constants/categories'
import { categoryHasSubcategories, getSubcategoryOptions } from '../constants/subcategories'

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
 * Percentage breakdown of a category's hours by subcategoria, for the "Ver
 * por tipo" control on CategoryCard. Each subcategory's percentage is its
 * share of the category's GOAL — not of the raw registered total — so a
 * student who registers more hours than the goal needs doesn't get an
 * inflated-looking split. This mirrors exactly how the main card's own bar
 * already caps validado at the goal and caps pendente at whatever capacity
 * remains after that:
 *   cappedValidatedHours = min(totalValidatedHours, goal)
 *   remainingCapacityForPending = max(0, goal - totalValidatedHours)
 *   cappedPendingHours = min(totalPendingHours, remainingCapacityForPending)
 * Each subcategory then gets a proportional slice of each capped bucket,
 * sized by its own share of that bucket's raw (uncapped) hours:
 *   subcategoryValidatedPercent = (subcategoryValidatedHours / totalValidatedHours) * (cappedValidatedHours / goal) * 100
 *   subcategoryPendingPercent = (subcategoryPendingHours / totalPendingHours) * (cappedPendingHours / goal) * 100
 * Surplus hours beyond the goal still show up in the row's own raw
 * `validatedHours`/`pendingHours` (never capped — only the percent/bar-fill
 * is), they just contribute no extra percentage once the goal capacity
 * they'd occupy is exhausted. Summed across every row (including "Não
 * especificado"), `percent + pendingPercent` equals what the main overall
 * bar already shows: `(cappedValidatedHours + cappedPendingHours) / goal * 100`.
 *
 * Returns:
 *   - `null` if this category has no subcategories at all (control hidden)
 *   - `[]` if the goal is 0 (shouldn't happen — zero-goal categories are
 *     already hidden — but guards divide-by-zero defensively) or there are
 *     no validado/pendente certificates at all (a true empty category)
 *   - otherwise one row per subcategory with at least one validado or
 *     pendente certificate, in the category's canonical subcategory order,
 *     with a trailing "Não especificado" row for certificates missing the
 *     field (stale data from before this feature existed).
 */
export function getSubcategoryBreakdown(categoryKey, aluno, certificados) {
  if (!categoryHasSubcategories(categoryKey)) return null

  const goal = aluno?.metas?.[categoryKey] ?? 0
  const relevant = certificados.filter((c) => c.categoria === categoryKey && c.status !== 'rejeitado')
  if (goal <= 0 || relevant.length === 0) return []

  const hoursByKey = new Map()
  for (const cert of relevant) {
    const key = cert.subcategoria || null
    const bucket = hoursByKey.get(key) ?? { validatedHours: 0, pendingHours: 0 }
    const hours = Number(cert.cargaHoraria) || 0
    if (cert.status === 'validado') bucket.validatedHours += hours
    else bucket.pendingHours += hours
    hoursByKey.set(key, bucket)
  }

  const totalValidatedHours = sumHours(relevant, (c) => c.status === 'validado')
  const totalPendingHours = sumHours(relevant, (c) => c.status === 'pendente')
  const cappedValidatedHours = Math.min(totalValidatedHours, goal)
  const remainingCapacityForPending = Math.max(0, goal - totalValidatedHours)
  const cappedPendingHours = Math.min(totalPendingHours, remainingCapacityForPending)

  const rows = getSubcategoryOptions(categoryKey)
    .filter((option) => hoursByKey.has(option.key))
    .map((option) => ({ key: option.key, label: option.label, ...hoursByKey.get(option.key) }))

  if (hoursByKey.has(null)) {
    rows.push({ key: '__unspecified__', label: 'Não especificado', ...hoursByKey.get(null) })
  }

  return rows.map((row) => {
    const validatedPercent =
      totalValidatedHours > 0 ? (row.validatedHours / totalValidatedHours) * (cappedValidatedHours / goal) * 100 : 0
    const pendingPercent =
      totalPendingHours > 0 ? (row.pendingHours / totalPendingHours) * (cappedPendingHours / goal) * 100 : 0
    return { ...row, percent: Math.round(validatedPercent), pendingPercent: Math.round(pendingPercent) }
  })
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
