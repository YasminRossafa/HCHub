/** Shown while Firebase auth/session state is resolving, so the app never flashes the login screen or stale content. */
export default function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div role="status" className="flex flex-col items-center gap-3">
        <span
          aria-hidden="true"
          className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600 dark:border-slate-700 dark:border-t-emerald-500"
        />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Carregando…</p>
      </div>
    </div>
  )
}
