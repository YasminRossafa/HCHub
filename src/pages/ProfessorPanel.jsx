import { AlertTriangle, CheckCircle2, Eye, XCircle } from 'lucide-react'
import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import CategoryCard from '../components/CategoryCard'
import OverallProgressHero from '../components/OverallProgressHero'
import { CATEGORIES, CATEGORIES_BY_KEY } from '../constants/categories'
import { formatDate } from '../utils/date'
import { getCategoryProgress, getOverallProgress } from '../utils/progress'
import { decodePayload } from '../utils/shareLink'

/**
 * SLOT for the professor's validate/reject controls — inert for now.
 *
 * TODO(validation): once the panel moves to Firebase and can write a
 * certificate's status back, replace this with real `onValidate`/`onReject`
 * handlers wired to that certificate's id. Until then these buttons use
 * `aria-disabled` rather than the native `disabled` attribute, so they stay
 * in the tab order and still show the app's usual focus ring — a truly
 * `disabled` button is unreachable by keyboard, which would fail this
 * screen's a11y requirement even for a placeholder.
 */
function ReviewActionsSlot({ certificateTitle }) {
  function handlePlaceholderClick(event) {
    event.preventDefault()
  }

  return (
    <div
      role="group"
      aria-label={`Ações do professor para ${certificateTitle} (em breve)`}
      className="mt-1 flex shrink-0 items-center justify-end gap-2 border-t border-slate-100 pt-3 sm:mt-0 sm:border-0 sm:pt-0"
    >
      <button
        type="button"
        aria-disabled="true"
        title="Validação pelo professor — disponível em breve"
        onClick={handlePlaceholderClick}
        className="inline-flex items-center gap-1.5 rounded-xl border-2 border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 opacity-60 cursor-not-allowed"
      >
        <CheckCircle2 aria-hidden="true" size={16} />
        Validar
      </button>
      <button
        type="button"
        aria-disabled="true"
        title="Rejeição pelo professor — disponível em breve"
        onClick={handlePlaceholderClick}
        className="inline-flex items-center gap-1.5 rounded-xl border-2 border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 opacity-60 cursor-not-allowed"
      >
        <XCircle aria-hidden="true" size={16} />
        Rejeitar
      </button>
    </div>
  )
}

function parsePayloadFromHash(hash) {
  // Deliberately not URLSearchParams: it would percent-decode `d`'s value for
  // us, and decodePayload does its own decodeURIComponent pass — decoding
  // twice corrupts any payload text containing a raw "%" (see utils/shareLink.js).
  const raw = hash.startsWith('#') ? hash.slice(1) : hash
  if (!raw.startsWith('d=')) return { data: null, error: 'Este link não contém dados de progresso.' }
  const encoded = raw.slice(2)
  try {
    return { data: decodePayload(encoded), error: null }
  } catch {
    return { data: null, error: 'Não foi possível carregar os dados deste link. Verifique se ele foi copiado por completo.' }
  }
}

/**
 * A read-only view of a student's progress, rendered entirely from the URL
 * (the `d=` payload lives in the hash fragment, never sent to any server —
 * see utils/shareLink.js). Deliberately outside AppLayout/RequireStudent:
 * whoever opens this link has no account of their own here, and shouldn't
 * see the app's edit-oriented nav.
 */
export default function ProfessorPanel() {
  const location = useLocation()
  const { data, error } = useMemo(() => parsePayloadFromHash(location.hash), [location.hash])

  if (error || !data) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-50">
          <AlertTriangle aria-hidden="true" className="text-rose-600" size={32} />
        </span>
        <h1 className="mt-5 text-xl font-bold text-slate-900">Não foi possível abrir este link</h1>
        <p className="mt-2 text-sm text-slate-500">{error ?? 'Link inválido.'}</p>
      </main>
    )
  }

  const { aluno, certificados } = data
  const overall = getOverallProgress(aluno, certificados)

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-slate-900 px-4 py-2.5 text-center text-sm font-medium text-white">
        <span className="inline-flex items-center gap-2">
          <Eye aria-hidden="true" size={16} />
          Visualização somente leitura do progresso de {aluno.nome}, compartilhada via link.
        </span>
      </div>

      <nav aria-label="Principal" className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center px-4 py-4 sm:px-6">
          <span className="text-lg font-bold text-slate-900">HCHub</span>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <header>
          <h1 className="text-2xl font-bold text-slate-900">{aluno.nome}</h1>
          <p className="text-sm text-slate-500">
            {aluno.curso} · Ingresso em {aluno.anoIngresso}
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
          <h2 id="categorias-heading" className="text-lg font-semibold text-slate-800">
            Progresso por categoria
          </h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((category) => {
              const progress = getCategoryProgress(category.key, aluno, certificados)
              const count = certificados.filter((c) => c.categoria === category.key).length
              return <CategoryCard key={category.key} category={category} progress={progress} count={count} />
            })}
          </ul>
        </section>

        <section aria-labelledby="certificados-heading" className="mt-8">
          <h2 id="certificados-heading" className="text-lg font-semibold text-slate-800">
            Certificados validados ({certificados.length})
          </h2>

          {certificados.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Nenhum certificado validado foi incluído neste link.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {certificados.map((cert) => {
                const category = CATEGORIES_BY_KEY[cert.categoria]
                const Icon = category?.icon
                return (
                  <li
                    key={cert.id}
                    className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:flex-row sm:items-center"
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                      {cert.anexoUrl && (
                        <img
                          src={cert.anexoUrl}
                          alt={`Certificado: ${cert.titulo}`}
                          className="h-32 w-full shrink-0 rounded-xl object-cover sm:h-16 sm:w-16"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">{cert.titulo}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                          {Icon && <Icon aria-hidden="true" size={14} className={category.text} />}
                          {category?.label ?? cert.categoria} · {cert.cargaHoraria}h · {formatDate(cert.data)}
                        </p>
                      </div>
                    </div>

                    <ReviewActionsSlot certificateTitle={cert.titulo} />
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}
