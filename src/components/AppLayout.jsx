import { ClipboardList, LayoutDashboard, PlusCircle } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Painel', icon: LayoutDashboard },
  { to: '/registrar', label: 'Registrar', icon: PlusCircle },
  { to: '/historico', label: 'Histórico', icon: ClipboardList },
]

function topLinkClass({ isActive }) {
  return `flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
    isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`
}

function bottomLinkClass({ isActive }) {
  return `flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${
    isActive ? 'text-emerald-700' : 'text-slate-500'
  }`
}

/**
 * Persistent navigation shell for every screen past onboarding. A top bar
 * serves tablet/desktop (mouse-hover affordances are fine there); phones get
 * a fixed bottom tab bar instead, since that's reachable with a thumb and
 * needs no hover state — the same pattern students already know from any
 * native app. Both navs share the "Principal" label but only one is ever
 * `display`-rendered at a time, so assistive tech never sees a duplicate.
 */
export default function AppLayout() {
  return (
    <div className="min-h-screen pb-20 sm:pb-0">
      <nav aria-label="Principal" className="sticky top-0 z-30 hidden border-b border-slate-200 bg-white sm:block">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <span className="text-lg font-bold text-slate-900">HCHub</span>
          <div className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} className={topLinkClass}>
                <item.icon aria-hidden="true" size={18} />
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      <Outlet />

      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] sm:hidden"
      >
        <div className="grid grid-cols-3">
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
