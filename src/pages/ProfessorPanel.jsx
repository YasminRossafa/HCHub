import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  RefreshCw,
  SearchX,
  XCircle,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import Button from '../components/Button'
import CategoryCard from '../components/CategoryCard'
import ChipRadio from '../components/ChipRadio'
import EmptyState from '../components/EmptyState'
import ExpandableCertificateImage from '../components/ExpandableCertificateImage'
import LoadingState from '../components/LoadingState'
import OverallProgressHero from '../components/OverallProgressHero'
import StatusBadge from '../components/StatusBadge'
import { CATEGORIES_BY_KEY } from '../constants/categories'
import { CERTIFICATE_STATUS_CONFIG } from '../constants/statusConfig'
import {
  getStudentReportByToken,
  isNotFoundError,
  updateCertificateStatusByToken,
} from '../firebase/professorService'
import { getCategoryCardSpanClassName, getCategoryGridClassName } from '../utils/categoryGrid'
import { formatDate } from '../utils/date'
import { getActiveCategories, getCategoryProgress, getOverallProgress } from '../utils/progress'

const STATUS_FILTERS = [
  { value: 'todos', label: 'Todos' },
  { value: 'pendente', label: 'Pendentes' },
  { value: 'validado', label: 'Validados' },
  { value: 'rejeitado', label: 'Rejeitados' },
]

/** Pending first (that's the professor's queue), then newest activity first within each group. */
const STATUS_ORDER = { pendente: 0, validado: 1, rejeitado: 2 }
function sortForReview(certificados) {
  return [...certificados].sort((a, b) => {
    const byStatus = (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3)
    if (byStatus !== 0) return byStatus
    return a.data < b.data ? 1 : a.data > b.data ? -1 : 0
  })
}

const DECISION_LABELS = {
  validado: { idle: 'Validar', busy: 'Validando…', done: 'validado' },
  rejeitado: { idle: 'Rejeitar', busy: 'Rejeitando…', done: 'rejeitado' },
}

const DECISION_BUTTON_CLASSES = {
  validado:
    'border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 ' +
    'dark:border-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-500',
  rejeitado:
    'border-rose-200 bg-white text-rose-700 hover:border-rose-300 hover:bg-rose-50 active:bg-rose-100 ' +
    'dark:border-rose-800 dark:bg-slate-800 dark:text-rose-300 dark:hover:border-rose-700 dark:hover:bg-rose-950',
}

/**
 * One "Validar" or "Rejeitar" button. While its own call is in flight it
 * announces that via `aria-busy` and swaps its label; the sibling button is
 * merely disabled so a second decision can't race the first. Never icon-only:
 * the text label is the accessible name.
 */
function DecisionButton({ decision, certificateTitle, busyDecision, onClick }) {
  const Icon = decision === 'validado' ? CheckCircle2 : XCircle
  const isBusy = busyDecision === decision
  const labels = DECISION_LABELS[decision]
  return (
    <button
      type="button"
      onClick={() => onClick(decision)}
      disabled={busyDecision !== null && !isBusy}
      aria-busy={isBusy || undefined}
      aria-label={`${labels.idle} certificado ${certificateTitle}`}
      className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border-2 px-4 py-2 text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 ${DECISION_BUTTON_CLASSES[decision]}`}
    >
      {isBusy ? (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : (
        <Icon aria-hidden="true" size={16} />
      )}
      {isBusy ? labels.busy : labels.idle}
    </button>
  )
}

/**
 * A certificate as the professor reviews it: the image large enough to
 * actually read (and openable full-size), the metadata the student entered,
 * and the decision controls for its current state.
 *
 * `action` is this card's slice of the panel's per-certificate UI state:
 *   { busy: 'validado' | 'rejeitado' | null, error, flash, editing }
 */
function ReviewCard({ cert, action, onDecide, onStartEdit, onCancelEdit, cardRef }) {
  const category = CATEGORIES_BY_KEY[cert.categoria]
  const Icon = category?.icon
  const isPending = cert.status === 'pendente'
  const showDecisionButtons = isPending || action.editing
  // For a decided certificate, the only meaningful change is the *other* verdict.
  const decisions = isPending ? ['validado', 'rejeitado'] : [cert.status === 'validado' ? 'rejeitado' : 'validado']
  const titleId = `cert-${cert.id}-titulo`

  return (
    <li
      ref={cardRef}
      tabIndex={-1}
      aria-labelledby={titleId}
      className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:p-5 dark:bg-slate-900 dark:shadow-none dark:ring-slate-800"
    >
      <div className="flex flex-col gap-4 md:flex-row">
        {cert.anexoUrl ? (
          <ExpandableCertificateImage
            src={cert.anexoUrl}
            title={cert.titulo}
            showOverlayLabel
            className="h-48 w-full md:h-40 md:w-56"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-48 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-400 md:h-40 md:w-56 dark:bg-slate-800 dark:text-slate-500"
          >
            Sem imagem
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h3 id={titleId} className="break-words text-base font-semibold text-slate-900 dark:text-slate-100">
                {cert.titulo}
              </h3>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                {Icon && <Icon aria-hidden="true" size={14} className={category.text} />}
                {category?.label ?? cert.categoria}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <StatusBadge status={cert.status} config={CERTIFICATE_STATUS_CONFIG} />
              {action.flash && (
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Atualizado</span>
              )}
            </div>
          </div>

          <dl className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-300">
            <div className="inline-flex items-center gap-1">
              <dt className="sr-only">Carga horária</dt>
              <Clock3 aria-hidden="true" size={14} />
              <dd>{cert.cargaHoraria}h</dd>
            </div>
            <div className="inline-flex items-center gap-1">
              <dt className="sr-only">Data</dt>
              <CalendarDays aria-hidden="true" size={14} />
              <dd>{formatDate(cert.data)}</dd>
            </div>
          </dl>

          {cert.observacoes && (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              <span className="font-medium text-slate-700 dark:text-slate-200">Observações do aluno: </span>
              {cert.observacoes}
            </p>
          )}

          <div className="mt-auto flex flex-col gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
            <div
              role="group"
              aria-label={`Decisão sobre o certificado ${cert.titulo}`}
              className="flex flex-wrap items-center gap-2"
            >
              {showDecisionButtons ? (
                <>
                  {decisions.map((decision) => (
                    <DecisionButton
                      key={decision}
                      decision={decision}
                      certificateTitle={cert.titulo}
                      busyDecision={action.busy}
                      onClick={(chosen) => onDecide(cert, chosen)}
                    />
                  ))}
                  {action.editing && (
                    <button
                      type="button"
                      onClick={() => onCancelEdit(cert.id)}
                      disabled={action.busy !== null}
                      className="min-h-11 rounded-xl px-3 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Cancelar
                    </button>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => onStartEdit(cert.id)}
                  className="min-h-11 rounded-xl px-2 text-sm font-medium text-slate-500 underline-offset-4 hover:text-slate-800 hover:underline dark:text-slate-400 dark:hover:text-slate-200"
                >
                  Alterar decisão
                </button>
              )}
            </div>

            {action.error && (
              <p role="alert" className="flex items-start gap-1.5 text-sm text-rose-600 dark:text-rose-400">
                <AlertTriangle aria-hidden="true" size={16} className="mt-0.5 shrink-0" />
                {action.error}
              </p>
            )}
          </div>
        </div>
      </div>
    </li>
  )
}

function PanelShell({ studentName, children }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="bg-slate-900 px-4 py-2.5 text-center text-sm font-medium text-white dark:bg-slate-800">
        <span className="inline-flex items-center gap-2">
          <ClipboardCheck aria-hidden="true" size={16} />
          Painel do professor{studentName ? ` — validação de certificados de ${studentName}` : ''}
        </span>
      </div>
      <AppHeader />
      {children}
    </div>
  )
}

function CenteredMessage({ icon: Icon, title, children }) {
  return (
    <main aria-live="polite" className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950">
        <Icon aria-hidden="true" className="text-rose-600 dark:text-rose-400" size={32} />
      </span>
      <h1 className="mt-5 text-xl font-bold text-slate-900 dark:text-slate-100">{title}</h1>
      {children}
    </main>
  )
}

const IDLE_ACTION = { busy: null, error: null, flash: false, editing: false }

/**
 * The professor's view of one student, addressed purely by the share token in
 * the URL. Deliberately outside AppLayout/RequireStudent: the professor has no
 * account here. All data access goes through the two callables in
 * firebase/professorService — this component never touches Firestore.
 */
export default function ProfessorPanel() {
  const { token } = useParams()
  const [loadState, setLoadState] = useState({ status: 'loading', student: null, certificados: [] })
  const [statusFilter, setStatusFilter] = useState('todos')
  const [actions, setActions] = useState({})
  const [announcement, setAnnouncement] = useState('')
  const cardRefs = useRef({})
  const flashTimers = useRef({})

  const load = useCallback(async () => {
    setLoadState({ status: 'loading', student: null, certificados: [] })
    setActions({})
    try {
      const { student, certificados } = await getStudentReportByToken(token)
      setLoadState({ status: 'ready', student, certificados })
    } catch (err) {
      if (isNotFoundError(err)) {
        setLoadState({ status: 'not-found', student: null, certificados: [] })
      } else {
        console.error(err)
        setLoadState({ status: 'error', student: null, certificados: [] })
      }
    }
  }, [token])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const timers = flashTimers.current
    return () => Object.values(timers).forEach(clearTimeout)
  }, [])

  const { status, student, certificados } = loadState

  const counts = useMemo(
    () =>
      certificados.reduce(
        (acc, cert) => {
          acc.todos += 1
          if (cert.status in acc) acc[cert.status] += 1
          return acc
        },
        { todos: 0, pendente: 0, validado: 0, rejeitado: 0 },
      ),
    [certificados],
  )

  const visible = useMemo(() => {
    const filtered = statusFilter === 'todos' ? certificados : certificados.filter((c) => c.status === statusFilter)
    return sortForReview(filtered)
  }, [certificados, statusFilter])

  function patchAction(certId, patch) {
    setActions((prev) => ({ ...prev, [certId]: { ...IDLE_ACTION, ...prev[certId], ...patch } }))
  }

  async function handleDecide(cert, newStatus) {
    patchAction(cert.id, { busy: newStatus, error: null, flash: false })
    try {
      await updateCertificateStatusByToken(token, cert.id, newStatus)
      setLoadState((prev) => ({
        ...prev,
        certificados: prev.certificados.map((c) => (c.id === cert.id ? { ...c, status: newStatus } : c)),
      }))
      patchAction(cert.id, { busy: null, flash: true, editing: false })
      setAnnouncement(`Certificado "${cert.titulo}" marcado como ${DECISION_LABELS[newStatus].done}.`)
      // The buttons the professor was on are about to disappear (the status
      // changed) — keep focus on this card so keyboard users don't land back
      // at the top of the page.
      cardRefs.current[cert.id]?.focus({ preventScroll: true })
      clearTimeout(flashTimers.current[cert.id])
      flashTimers.current[cert.id] = setTimeout(() => patchAction(cert.id, { flash: false }), 3000)
    } catch (err) {
      if (!isNotFoundError(err)) console.error(err)
      patchAction(cert.id, {
        busy: null,
        error: isNotFoundError(err)
          ? 'Este link não é mais válido. Peça um novo link ao aluno.'
          : 'Não foi possível salvar a decisão. Verifique sua conexão e tente novamente.',
      })
    }
  }

  if (status === 'loading') {
    return (
      <PanelShell>
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <LoadingState label="Carregando certificados do aluno…" />
        </main>
      </PanelShell>
    )
  }

  if (status === 'not-found') {
    return (
      <PanelShell>
        <CenteredMessage icon={AlertTriangle} title="Link inválido ou expirado">
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Peça ao aluno que gere um novo link no HCHub e envie novamente.
          </p>
        </CenteredMessage>
      </PanelShell>
    )
  }

  if (status === 'error') {
    return (
      <PanelShell>
        <CenteredMessage icon={AlertTriangle} title="Não foi possível carregar os dados">
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Verifique sua conexão e tente novamente.
          </p>
          <Button type="button" variant="secondary" onClick={load} className="mt-6">
            <RefreshCw aria-hidden="true" size={18} />
            Tentar novamente
          </Button>
        </CenteredMessage>
      </PanelShell>
    )
  }

  const overall = getOverallProgress(student, certificados)
  const activeCategories = getActiveCategories(student)

  return (
    <PanelShell studentName={student.nome}>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <p role="status" aria-live="polite" className="sr-only">
          {announcement}
        </p>

        <header>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{student.nome}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {student.curso} · Ingresso em {student.anoIngresso}
          </p>
        </header>

        <div className="mt-6">
          <OverallProgressHero
            validatedHours={overall.validatedHours}
            pendingHours={overall.pendingHours}
            requiredHours={overall.requiredHours}
            percent={overall.percent}
          />
        </div>

        <section aria-labelledby="categorias-heading" className="mt-8">
          <h2 id="categorias-heading" className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            Progresso por categoria
          </h2>
          {/*
            Same adaptive layout as the Dashboard (see utils/categoryGrid.js)
            — 1-3 active categories share a single row, exactly 4 form a
            2×2 grid, exactly 5 split 3-then-2-wider — rather than a plain
            "2 or 3 per row" grid that leaves an orphan card at several counts.
          */}
          <ul className={`mt-4 grid gap-4 ${getCategoryGridClassName(activeCategories.length)}`}>
            {activeCategories.map((category, index) => (
              <CategoryCard
                key={category.key}
                category={category}
                progress={getCategoryProgress(category.key, student, certificados)}
                className={getCategoryCardSpanClassName(activeCategories.length, index)}
              />
            ))}
          </ul>
        </section>

        <section aria-labelledby="certificados-heading" className="mt-8">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="certificados-heading" className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                Certificados ({counts.todos})
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {counts.pendente > 0
                  ? `${counts.pendente} aguardando sua decisão.`
                  : 'Nenhum certificado aguardando decisão.'}
              </p>
            </div>
          </div>

          {counts.todos === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="Nenhum certificado registrado"
                description="O aluno ainda não registrou certificados neste link."
                onAction={load}
                actionLabel="Atualizar"
              />
            </div>
          ) : (
            <>
              <fieldset className="mt-4">
                <legend className="text-sm font-medium text-slate-700 dark:text-slate-300">Filtrar por status</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {STATUS_FILTERS.map((option) => (
                    <ChipRadio
                      key={option.value}
                      name="status-filtro"
                      value={option.value}
                      label={`${option.label} (${counts[option.value]})`}
                      checked={statusFilter === option.value}
                      onChange={setStatusFilter}
                    />
                  ))}
                </div>
              </fieldset>

              {visible.length === 0 ? (
                <div className="mt-4">
                  <EmptyState
                    icon={SearchX}
                    title="Nenhum certificado com este status"
                    description="Escolha outro filtro para ver os demais certificados."
                    actionLabel="Mostrar todos"
                    onAction={() => setStatusFilter('todos')}
                  />
                </div>
              ) : (
                <ul className="mt-4 flex flex-col gap-4">
                  {visible.map((cert) => (
                    <ReviewCard
                      key={cert.id}
                      cert={cert}
                      action={actions[cert.id] ?? IDLE_ACTION}
                      onDecide={handleDecide}
                      onStartEdit={(id) => patchAction(id, { editing: true, error: null })}
                      onCancelEdit={(id) => patchAction(id, { editing: false, error: null })}
                      cardRef={(el) => {
                        cardRefs.current[cert.id] = el
                      }}
                    />
                  ))}
                </ul>
              )}
            </>
          )}
        </section>
      </main>
    </PanelShell>
  )
}
