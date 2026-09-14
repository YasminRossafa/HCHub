export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

/** Formats an ISO "YYYY-MM-DD" date as pt-BR "DD/MM/YYYY". */
export function formatDate(isoDate) {
  const [year, month, day] = (isoDate ?? '').split('-')
  if (!year || !month || !day) return isoDate ?? ''
  return `${day}/${month}/${year}`
}
