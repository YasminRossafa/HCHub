import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

const OPTIONS = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: Monitor },
]

/**
 * A 3-way segmented control (Claro/Escuro/Sistema) rather than a single
 * cycle-through button — with three possible states, a lone toggle can't
 * carry an unambiguous aria-pressed, while each option button here reports
 * its own pressed state and has its own accessible name.
 */
export default function ThemeToggle({ className = '' }) {
  const { preference, setPreference } = useTheme()

  return (
    <div
      role="group"
      aria-label="Tema do aplicativo"
      className={`inline-flex items-center gap-0.5 rounded-xl bg-slate-100 p-1 dark:bg-slate-800 ${className}`}
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = preference === value
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            aria-label={`Usar tema ${label.toLowerCase()}`}
            title={`Tema ${label}`}
            onClick={() => setPreference(value)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
              active
                ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-700 dark:text-emerald-400'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Icon aria-hidden="true" size={16} />
          </button>
        )
      })}
    </div>
  )
}
