/** Inline loading indicator for content that's still being fetched (as opposed to LoadingScreen's full-page use). */
export default function LoadingState({ label = 'Carregando…' }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="flex flex-col items-center justify-center gap-3 py-16">
      <span
        aria-hidden="true"
        className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600 dark:border-slate-700 dark:border-t-emerald-500"
      />
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  )
}
