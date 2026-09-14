/**
 * Status is always shown as color + icon + text together, never color alone,
 * so the meaning survives for colorblind users and in grayscale printouts.
 * `config` maps a status key to { label, icon, className } — pass
 * PROGRESS_STATUS_CONFIG or CERTIFICATE_STATUS_CONFIG (constants/statusConfig)
 * depending on domain.
 */
export default function StatusBadge({ status, config }) {
  const entry = config[status] ?? Object.values(config)[0]
  const Icon = entry.icon
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${entry.className}`}
    >
      <Icon aria-hidden="true" size={16} strokeWidth={2.5} />
      {entry.label}
    </span>
  )
}
