import { LogOut } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'

function topLinkClass({ isActive }) {
  return `flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
    isActive
      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
  }`
}

function iconLinkClass({ isActive }) {
  return `flex items-center justify-center rounded-xl p-2.5 transition-colors ${
    isActive
      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
  }`
}

/**
 * Shared top chrome for every screen outside onboarding/auth — the small
 * square logo on phones, the extended wordmark from `sm` up, plus whatever
 * links/actions the caller supplies. Used both by the authenticated student
 * app (AppLayout) and the unauthenticated Professor panel, so it never reads
 * AuthContext itself: `navLinks`/`settingsLink`/`onLogout` are all optional,
 * and omitting them (as the Professor panel does) simply hides that piece
 * rather than assuming a signed-in user exists.
 */
export default function AppHeader({ navLinks = [], settingsLink, onLogout }) {
  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:hidden dark:border-slate-800 dark:bg-slate-900">
        <img src="/logo.png" alt="logo" className="h-10 w-auto dark:hidden" />
        <img src="/logo_dark.png" alt="logo_dark" className="hidden h-10 w-auto dark:block" />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          {settingsLink && (
            <NavLink to={settingsLink.to} aria-label={settingsLink.label} className={iconLinkClass}>
              <settingsLink.icon aria-hidden="true" size={20} />
            </NavLink>
          )}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              <LogOut aria-hidden="true" size={18} />
              Sair
            </button>
          )}
        </div>
      </header>

      <nav
        aria-label="Principal"
        className="sticky top-0 z-30 hidden border-b border-slate-200 bg-white sm:block dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <img src="/logo_extendida.png" alt="extended_logo" className="h-14 w-auto dark:hidden" />
          <img src="/logo_extendida_dark.png" alt="extended_logo_dark" className="hidden h-14 w-auto dark:block" />
          <div className="flex items-center gap-1">
            {navLinks.map((item) => (
              <NavLink key={item.to} to={item.to} className={topLinkClass}>
                <item.icon aria-hidden="true" size={18} />
                {item.label}
              </NavLink>
            ))}
            {settingsLink && (
              <NavLink to={settingsLink.to} className={topLinkClass}>
                <settingsLink.icon aria-hidden="true" size={18} />
                {settingsLink.label}
              </NavLink>
            )}
            <ThemeToggle className="ml-2" />
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="ml-2 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              >
                <LogOut aria-hidden="true" size={18} />
                Sair
              </button>
            )}
          </div>
        </div>
      </nav>
    </>
  )
}
