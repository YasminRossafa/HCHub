import { Award, Briefcase, FlaskConical, GraduationCap, HandHeart } from 'lucide-react'

/**
 * Single source of truth for the fixed set of complementary-hours categories.
 * `key` must match both `aluno.metas` and `certificado.categoria` in the data model.
 * Colors are Tailwind color names (not classes) so callers can compose whichever
 * utility they need (bg-*, text-*, border-*) while keeping one color per category.
 * All `text` shades are chosen to meet WCAG AA (4.5:1) on a white background,
 * and `solid` shades meet AA (3:1+) for icons/large text on their own fill.
 */
export const CATEGORIES = [
  {
    key: 'extensao',
    label: 'Extensão',
    color: 'violet',
    text: 'text-violet-700 dark:text-violet-300',
    solidBg: 'bg-violet-600 dark:bg-violet-500',
    softBg: 'bg-violet-50 dark:bg-violet-950',
    ring: 'ring-violet-200 dark:ring-violet-800/60',
    icon: HandHeart,
    defaultGoal: 100,
  },
  {
    key: 'monitoria',
    label: 'Monitoria',
    color: 'amber',
    text: 'text-amber-800 dark:text-amber-300',
    solidBg: 'bg-amber-500 dark:bg-amber-500',
    softBg: 'bg-amber-50 dark:bg-amber-950',
    ring: 'ring-amber-200 dark:ring-amber-800/60',
    icon: GraduationCap,
    defaultGoal: 40,
  },
  {
    key: 'iniciacaoCientifica',
    label: 'Iniciação Científica',
    color: 'teal',
    text: 'text-teal-700 dark:text-teal-300',
    solidBg: 'bg-teal-600 dark:bg-teal-500',
    softBg: 'bg-teal-50 dark:bg-teal-950',
    ring: 'ring-teal-200 dark:ring-teal-800/60',
    icon: FlaskConical,
    defaultGoal: 80,
  },
  {
    key: 'estagio',
    label: 'Estágio',
    color: 'rose',
    text: 'text-rose-700 dark:text-rose-300',
    solidBg: 'bg-rose-600 dark:bg-rose-500',
    softBg: 'bg-rose-50 dark:bg-rose-950',
    ring: 'ring-rose-200 dark:ring-rose-800/60',
    icon: Briefcase,
    defaultGoal: 100,
  },
  {
    key: 'atividadesComplementares',
    label: 'Atividades Complementares',
    color: 'indigo',
    text: 'text-indigo-700 dark:text-indigo-300',
    solidBg: 'bg-indigo-600 dark:bg-indigo-500',
    softBg: 'bg-indigo-50 dark:bg-indigo-950',
    ring: 'ring-indigo-200 dark:ring-indigo-800/60',
    icon: Award,
    defaultGoal: 40,
  },
]

export const CATEGORIES_BY_KEY = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]))

export const DEFAULT_METAS = Object.fromEntries(CATEGORIES.map((c) => [c.key, c.defaultGoal]))
