import { ClipboardList, FileText, LayoutDashboard, LogOut, PlusCircle, Settings } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { signOut } from '../firebase/authService'
import ThemeToggle from './ThemeToggle'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Painel', icon: LayoutDashboard },
  { to: '/registrar', label: 'Registrar', icon: PlusCircle },
  { to: '/historico', label: 'Histórico', icon: ClipboardList },
  { to: '/relatorio', label: 'Relatório', icon: FileText },
]

async function handleLogout() {
  try {
    await signOut()
  } catch (error) {
    console.error(error)
  }
}

function topLinkClass({ isActive }) {
  return `flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
    isActive
      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
  }`
}

function bottomLinkClass({ isActive }) {
  return `flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${
    isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
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
 * Persistent navigation shell for every screen past onboarding. A top bar
 * serves tablet/desktop (mouse-hover affordances are fine there); phones get
 * a fixed bottom tab bar instead, since that's reachable with a thumb and
 * needs no hover state — the same pattern students already know from any
 * native app. Both navs share the "Principal" label but only one is ever
 * `display`-rendered at a time, so assistive tech never sees a duplicate.
 * A slim phone-only header carries the logout action and a settings
 * shortcut, since the bottom tab bar's four slots are reserved for primary
 * navigation — Settings is an account-level action, not primary content, so
 * it lives next to "Sair" on both breakpoints instead of competing for one
 * of those four slots.
 */
export default function AppLayout() {
  return (
    <div className="min-h-screen pb-20 sm:pb-0">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:hidden dark:border-slate-800 dark:bg-slate-900">
        <img src="/logo_extendida.png" alt="extended_logo" className='h-9 w-auto dark:hidden'/>
        <img src="/logo_extendida_dark.png" alt="extended_logo_dark" className='hidden h-9 w-auto dark:block'/>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <NavLink to="/configuracoes" aria-label="Configurações" className={iconLinkClass}>
            <Settings aria-hidden="true" size={20} />
          </NavLink>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <LogOut aria-hidden="true" size={18} />
            Sair
          </button>
        </div>
      </header>

      <nav aria-label="Principal" className="sticky top-0 z-30 hidden border-b border-slate-200 bg-white sm:block dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <img src="/logo_extendida.png" alt="extended_logo" className='h-14 w-auto dark:hidden'/>
          <img src="/logo_extendida_dark.png" alt="extended_logo_dark" className='hidden h-14 w-auto dark:block'/>
          <div className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} className={topLinkClass}>
                <item.icon aria-hidden="true" size={18} />
                {item.label}
              </NavLink>
            ))}
            <NavLink to="/configuracoes" className={topLinkClass}>
              <Settings aria-hidden="true" size={18} />
              Configurações
            </NavLink>
            <ThemeToggle className="ml-2" />
            <button
              type="button"
              onClick={handleLogout}
              className="ml-2 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              <LogOut aria-hidden="true" size={18} />
              Sair
            </button>
          </div>
        </div>
      </nav>

      <Outlet />

      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] sm:hidden dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="grid grid-cols-4">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} className={bottomLinkClass}>
              <item.icon aria-hidden="true" size={22} />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
