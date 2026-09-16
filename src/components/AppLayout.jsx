import { ClipboardList, FileText, LayoutDashboard, PlusCircle, Settings } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { signOut } from '../firebase/authService'
import AppHeader from './AppHeader'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Painel', icon: LayoutDashboard },
  { to: '/registrar', label: 'Registrar', icon: PlusCircle },
  { to: '/historico', label: 'Histórico', icon: ClipboardList },
  { to: '/relatorio', label: 'Relatório', icon: FileText },
]

const SETTINGS_LINK = { to: '/configuracoes', label: 'Configurações', icon: Settings }

async function handleLogout() {
  try {
    await signOut()
  } catch (error) {
    console.error(error)
  }
}

function bottomLinkClass({ isActive }) {
  return `flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${
    isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
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
      <AppHeader navLinks={NAV_ITEMS} settingsLink={SETTINGS_LINK} onLogout={handleLogout} />

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
