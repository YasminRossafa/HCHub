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

/**
 * Normalizes a certificate timestamp field to milliseconds for sorting,
 * regardless of shape: a client-SDK Firestore `Timestamp` (has `.toMillis`),
 * an ISO string (how the professor-panel Cloud Function serializes it), or a
 * plain `{ seconds, nanoseconds }` object. Missing/unresolved values (e.g. a
 * `serverTimestamp()` write not yet echoed back) sort first via 0.
 */
function timestampMillis(value) {
  if (!value) return 0
  if (typeof value.toMillis === 'function') return value.toMillis()
  if (typeof value === 'string') return new Date(value).getTime() || 0
  if (typeof value.seconds === 'number') return value.seconds * 1000
  return 0
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
 * share of the category's GOAL, allocated by a FIFO walk over every
 * validado/pendente certificate in the category — not a proportional split
 * of raw totals — so that which certificates actually claimed the goal's
 * capacity (and in what order) determines the split, not just the final
 * validado/pendente head-count. This is what makes two subcategories that
 * are BOTH validado (one validated before the goal was reached, the other
 * validated after — see the example below) still split correctly instead
 * of reverting to a flat proportional share.
 *
 * Processing order: every validado certificate (ordered by `atualizadoEm` —
 * when a professor's decision actually wrote that status, since editing a
 * certificate always resets it to "pendente" for re-review, so a validado
 * certificate's `atualizadoEm` can only ever be its validation moment) comes
 * before every pendente certificate (ordered by `criadoEm`, i.e. registration
 * order — the closest thing to a queue position for hours not yet decided).
 * A running `remainingCapacity` starts at the goal; each certificate in turn
 * claims `min(cargaHoraria, remainingCapacity)` of it, attributed to its
 * subcategoria (or "Não especificado"), and `remainingCapacity` drops by
 * that amount — so once it hits 0, every later certificate (including any
 * still-pending ones) claims nothing further.
 *
 * Example: goal 100h. "Não especificado" 60h validado (validated first).
 * "Projetos de Extensão" also becomes 60h validado (validated second, so
 * total validado is 120h > goal). FIFO walk: Não especificado claims 60h of
 * capacity (remaining 40h left), Projetos then claims only 40h of its own
 * 60h (capacity exhausted) — so the split is 60%/40%, matching validation
 * order, not a 50/50 split of the raw 60h/60h totals.
 *
 * Only the percent/bar-fill uses this capped, order-dependent allocation —
 * each row's plain `validatedHours`/`pendingHours` (used for its "Xh
 * validadas"/"Yh pendentes" text) stay the TRUE raw hours the student
 * registered, uncapped and independent of ordering.
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

  // Raw, uncapped hours per subcategory — only ever used for a row's display text.
  const rawByKey = new Map()
  for (const cert of relevant) {
    const key = cert.subcategoria || null
    const bucket = rawByKey.get(key) ?? { validatedHours: 0, pendingHours: 0 }
    const hours = Number(cert.cargaHoraria) || 0
    if (cert.status === 'validado') bucket.validatedHours += hours
    else bucket.pendingHours += hours
    rawByKey.set(key, bucket)
  }

  // FIFO allocation against the goal: validado certificates (by validation
  // order) fully precede pendente ones (by registration order).
  const ordered = [
    ...relevant.filter((c) => c.status === 'validado').sort((a, b) => timestampMillis(a.atualizadoEm) - timestampMillis(b.atualizadoEm)),
    ...relevant.filter((c) => c.status === 'pendente').sort((a, b) => timestampMillis(a.criadoEm) - timestampMillis(b.criadoEm)),
  ]

  const countedByKey = new Map()
  let remainingCapacity = goal
  for (const cert of ordered) {
    const key = cert.subcategoria || null
    const countedHours = Math.max(0, Math.min(Number(cert.cargaHoraria) || 0, remainingCapacity))
    remainingCapacity -= countedHours
    const bucket = countedByKey.get(key) ?? { validatedHours: 0, pendingHours: 0 }
    bucket[cert.status === 'validado' ? 'validatedHours' : 'pendingHours'] += countedHours
    countedByKey.set(key, bucket)
  }

  const rows = getSubcategoryOptions(categoryKey)
    .filter((option) => rawByKey.has(option.key))
    .map((option) => ({ key: option.key, label: option.label, ...rawByKey.get(option.key) }))

  if (rawByKey.has(null)) {
    rows.push({ key: '__unspecified__', label: 'Não especificado', ...rawByKey.get(null) })
  }

  return rows.map((row) => {
    const bucketKey = row.key === '__unspecified__' ? null : row.key
    const counted = countedByKey.get(bucketKey) ?? { validatedHours: 0, pendingHours: 0 }
    return {
      ...row,
      percent: Math.round((counted.validatedHours / goal) * 100),
      pendingPercent: Math.round((counted.pendingHours / goal) * 100),
    }
  })
}

/**
 * A category can never contribute more to the overall total than its own
 * goal — surplus hours validated in one category (already shown as
 * "Completa" on its own card) aren't transferable to another category's
 * shortfall. Pending hours are capped to whatever goal capacity the
 * validated hours haven't already claimed, same idea one level up.
 */
function capToGoal(validatedHours, pendingHours, requiredHours) {
  const cappedValidated = Math.min(validatedHours, requiredHours)
  const remainingCapacity = Math.max(0, requiredHours - validatedHours)
  const cappedPending = Math.min(pendingHours, remainingCapacity)
  return { cappedValidated, cappedPending }
}

/**
 * Validated and pending hours across every active category (goal > 0),
 * against the sum of their goals. A zeroed-out category contributes nothing
 * here, the same way it renders no card on the Dashboard. Each category's
 * contribution is capped to its own goal (see capToGoal) — this is what
 * keeps a category validated well past its goal from inflating the overall
 * total beyond what it could ever actually require.
 */
export function getOverallProgress(aluno, certificados) {
  const totals = getActiveCategories(aluno).reduce(
    (acc, category) => {
      const { validatedHours, pendingHours, requiredHours } = getCategoryProgress(category.key, aluno, certificados)
      const { cappedValidated, cappedPending } = capToGoal(validatedHours, pendingHours, requiredHours)
      acc.validatedHours += cappedValidated
      acc.pendingHours += cappedPending
      acc.requiredHours += requiredHours
      return acc
    },
    { validatedHours: 0, pendingHours: 0, requiredHours: 0 },
  )
  return toProgress(totals.validatedHours, totals.pendingHours, totals.requiredHours)
}
