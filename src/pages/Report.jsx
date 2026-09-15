import { ChevronDown, FileDown, FileText, Info, Link2, Mail } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import Button from '../components/Button'
import CategoryCard from '../components/CategoryCard'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import ExpandableCertificateImage from '../components/ExpandableCertificateImage'
import LoadingScreen from '../components/LoadingScreen'
import LoadingState from '../components/LoadingState'
import StatusBadge from '../components/StatusBadge'
import { CATEGORIES_BY_KEY } from '../constants/categories'
import { CERTIFICATE_STATUS_CONFIG } from '../constants/statusConfig'
import { useAuth } from '../contexts/AuthContext'
import { getCertificates } from '../firebase/certificateService'
import { createShareLink, getActiveShareLink } from '../firebase/shareLinkService'
import { getCategoryCardSpanClassName, getCategoryGridClassName } from '../utils/categoryGrid'
import { formatDate } from '../utils/date'
import { isMobileDevice } from '../utils/device'
import { buildGmailComposeUrl, buildMailtoUrl } from '../utils/email'
import { generateReportPdf } from '../utils/pdf'
import { getActiveCategories, getCategoryProgress, getOverallProgress, getPendingCertificates, getValidatedCertificates } from '../utils/progress'

/** e.g. "1 certificado validado · 2 pendentes de validação" — whichever counts are nonzero, joined. */
function buildInclusionSummary(validatedCount, pendingCount) {
  const parts = []
  if (validatedCount > 0) {
    parts.push(`${validatedCount} certificado${validatedCount === 1 ? '' : 's'} validado${validatedCount === 1 ? '' : 's'}`)
  }
  if (pendingCount > 0) {
    parts.push(`${pendingCount} pendente${pendingCount === 1 ? '' : 's'} de validação`)
  }
  return parts.join(' · ')
}

/** One row in either the "validados" or "pendentes" certificate list below. */
function ReportCertificateItem({ cert }) {
  const category = CATEGORIES_BY_KEY[cert.categoria]
  return (
    <li className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:shadow-none dark:ring-slate-800">
      <ExpandableCertificateImage src={cert.anexoUrl} title={cert.titulo} className="h-14 w-14 rounded-lg" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-slate-900 dark:text-slate-100">{cert.titulo}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {category?.label ?? cert.categoria} · {cert.cargaHoraria}h · {formatDate(cert.data)}
        </p>
      </div>
      <StatusBadge status={cert.status} config={CERTIFICATE_STATUS_CONFIG} />
    </li>
  )
}

export default function Report() {
  const { studentProfile: aluno, user } = useAuth()
  const [certificados, setCertificados] = useState([])
  const [certificatesLoading, setCertificatesLoading] = useState(true)
  // Best-effort heuristic (see utils/device.js) — computed once per mount rather
  // than on every render, since neither the UA nor the pointer type changes mid-session.
  const [isMobile] = useState(isMobileDevice)

  useEffect(() => {
    if (!user) return undefined
    let active = true
    setCertificatesLoading(true)
    getCertificates(user.uid)
      .then((data) => active && setCertificados(data))
      .catch((err) => console.error(err))
      .finally(() => active && setCertificatesLoading(false))
    return () => {
      active = false
    }
  }, [user])

  const validated = useMemo(() => getValidatedCertificates(certificados), [certificados])
  const pending = useMemo(() => getPendingCertificates(certificados), [certificados])
  const hasCertificates = certificados.length > 0
  // "Reportable" = everything that isn't rejected — the report exists to give
  // the student a complete picture, including what's still awaiting a
  // decision; only rejected certificates were never meant to count here.
  const hasReportable = validated.length > 0 || pending.length > 0

  // Only active (goal > 0) categories are shown — same rule as the
  // Dashboard and professor panel — so a zeroed-out category shows neither a
  // card here nor a line in the generated PDF.
  const activeCategories = useMemo(() => getActiveCategories(aluno), [aluno])

  // Computed from the full `certificados` list (not just `validated`) so
  // pendingHours comes through correctly — getCategoryProgress filters by
  // status internally, so rejected certificates still contribute nothing.
  const categoryBreakdown = useMemo(
    () => activeCategories.map((category) => ({ label: category.label, progress: getCategoryProgress(category.key, aluno, certificados) })),
    [activeCategories, aluno, certificados],
  )

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [pdfError, setPdfError] = useState(null)
  const [shareResult, setShareResult] = useState(null)
  const [isLoadingShareLink, setIsLoadingShareLink] = useState(true)
  const [isGeneratingLink, setIsGeneratingLink] = useState(false)
  const [shareError, setShareError] = useState(null)
  const [copyLabel, setCopyLabel] = useState('Copiar link')
  const [isRegenerateConfirmOpen, setIsRegenerateConfirmOpen] = useState(false)
  // Collapsed by default so the screen reads as a quick summary + action at a
  // glance; the full category/certificate breakdown is opt-in via the toggle below.
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  // A link generated earlier is still active in Firestore until explicitly
  // replaced — check for one on mount so it keeps showing after navigating
  // away and back, instead of looking like it never existed.
  useEffect(() => {
    if (!user) return undefined
    let active = true
    getActiveShareLink(user.uid)
      .then((result) => active && setShareResult(result))
      .catch((err) => console.error(err))
      .finally(() => active && setIsLoadingShareLink(false))
    return () => {
      active = false
    }
  }, [user])

  // RequireStudent already guarantees a profile is loaded before this route renders; this is a defensive fallback.
  if (!aluno) return <LoadingScreen />

  async function handleGeneratePdf() {
    setIsGeneratingPdf(true)
    setPdfError(null)
    try {
      await generateReportPdf({
        aluno,
        overall: getOverallProgress(aluno, certificados),
        categoryBreakdown,
        validatedCertificates: validated,
        pendingCertificates: pending,
      })
    } catch (err) {
      console.error(err)
      setPdfError('Não foi possível gerar o PDF. Tente novamente.')
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  /**
   * Shared by both the first-ever "Gerar link compartilhável" click (no
   * confirmation needed — there's nothing to lose yet) and the confirmed
   * "Gerar novo link" flow below. The confirm dialog stays open on failure
   * (mirroring History's delete flow) so the error and a retry are right
   * there; it only closes once a new link actually exists.
   */
  async function handleGenerateShareLink() {
    setIsGeneratingLink(true)
    setShareError(null)
    setCopyLabel('Copiar link')
    try {
      setShareResult(await createShareLink(user.uid))
      setIsRegenerateConfirmOpen(false)
    } catch (err) {
      console.error(err)
      setShareError('Não foi possível gerar o link. Verifique sua conexão e tente novamente.')
    } finally {
      setIsGeneratingLink(false)
    }
  }

  async function handleCopyLink() {
    if (!shareResult) return
    try {
      await navigator.clipboard.writeText(shareResult.url)
      setCopyLabel('Copiado!')
      setTimeout(() => setCopyLabel('Copiar link'), 2000)
    } catch {
      setCopyLabel('Não foi possível copiar')
    }
  }

  const mailSubject = `Certificados para validação — ${aluno.nome}`
  const mailBody =
    `Olá, professor(a),\n\nSegue o link para acompanhar e validar meus certificados de horas complementares ` +
    `(${aluno.curso}, ingresso em ${aluno.anoIngresso}):\n\n` +
    (shareResult
      ? `${shareResult.url}\n\n`
      : '[gere o link compartilhável no HCHub e cole aqui]\n\n') +
    'Pelo link é possível ver todos os certificados, com as imagens, e marcar cada um como validado ou rejeitado — ' +
    'não é necessário criar conta.\n\n' +
    `Atenciosamente,\n${aluno.nome}`
  const mailtoHref = buildMailtoUrl({ subject: mailSubject, body: mailBody })

  /**
   * Mobile keeps the native `mailto:` behavior (opens the phone's mail app,
   * via the anchor's own `href`). On desktop we intercept the click and open
   * Gmail's web compose instead, since UFSCar uses Gmail by default and a
   * bare `mailto:` on desktop usually either does nothing or opens a client
   * nobody actually uses. The visible button is identical either way — only
   * this handler differs.
   */
  function handleEmailClick(event) {
    if (isMobile) return
    event.preventDefault()
    window.open(buildGmailComposeUrl({ subject: mailSubject, body: mailBody }), '_blank', 'noopener,noreferrer')
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Relatório para o professor</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Envie um link para o professor validar seus certificados, ou gere um PDF com o resumo completo.
      </p>

      {certificatesLoading ? (
        <div className="mt-8">
          <LoadingState label="Carregando certificados…" />
        </div>
      ) : !hasCertificates ? (
        <div className="mt-8">
          <EmptyState
            icon={FileText}
            title="Nenhum certificado registrado ainda"
            description="Registre seus certificados primeiro — depois você poderá enviar um link para o professor validá-los."
          />
        </div>
      ) : (
        <>
          <section
            aria-labelledby="link-heading"
            className="mt-8 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6 dark:bg-slate-900 dark:shadow-none dark:ring-slate-800"
          >
            <h2 id="link-heading" className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              Link para validação
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              O professor abre o link sem precisar de conta, vê todos os seus certificados
              {pending.length > 0 && (
                <>
                  {' '}
                  (<strong className="font-semibold text-amber-800 dark:text-amber-300">{pending.length} pendente
                  {pending.length === 1 ? '' : 's'}</strong>)
                </>
              )}{' '}
              e marca cada um como validado ou rejeitado.
            </p>

            {isLoadingShareLink ? (
              <div className="mt-4">
                <LoadingState label="Verificando link existente…" />
              </div>
            ) : (
              <>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  {!shareResult && (
                    <Button
                      type="button"
                      variant="primary"
                      onClick={handleGenerateShareLink}
                      disabled={isGeneratingLink}
                      aria-busy={isGeneratingLink || undefined}
                    >
                      <Link2 aria-hidden="true" size={18} />
                      {isGeneratingLink ? 'Gerando link…' : 'Gerar link compartilhável'}
                    </Button>
                  )}

                  <Button as="a" href={mailtoHref} onClick={handleEmailClick} variant="secondary">
                    <Mail aria-hidden="true" size={18} />
                    Enviar por e-mail
                  </Button>
                </div>

                <div aria-live="polite">
                  {shareError && !shareResult && (
                    <p role="alert" className="mt-3 text-sm text-rose-600 dark:text-rose-400">
                      {shareError}
                    </p>
                  )}

                  {shareResult && (
                    <div className="mt-4 flex flex-col gap-2 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                      <label htmlFor="share-link" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Seu link ativo
                      </label>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <input
                          id="share-link"
                          type="text"
                          readOnly
                          value={shareResult.url}
                          onFocus={(e) => e.target.select()}
                          className="w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus-visible:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        />
                        <Button type="button" variant="secondary" size="sm" onClick={handleCopyLink} className="shrink-0">
                          {copyLabel}
                        </Button>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Qualquer pessoa com este link poderá ver e avaliar seus certificados — compartilhe apenas com
                        o professor responsável.
                      </p>
                    </div>
                  )}
                </div>

                {shareResult && (
                  // Deliberately a plain text-style trigger, not a Button — replacing the
                  // active link is the rare path here and shouldn't compete visually with
                  // Copiar/Enviar por e-mail above. Actually invalidating it happens only
                  // after the confirmation dialog below.
                  <button
                    type="button"
                    onClick={() => setIsRegenerateConfirmOpen(true)}
                    className="mt-3 text-sm font-medium text-slate-500 underline-offset-4 hover:text-slate-800 hover:underline dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    Gerar novo link
                  </button>
                )}

                <p className="mt-3 flex items-start gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <Info aria-hidden="true" size={16} className="mt-0.5 shrink-0" />
                  <span>
                    Apenas um link fica ativo por vez: gerar um novo invalida o atual. O e-mail abre seu aplicativo
                    de e-mail no celular, ou o Gmail no navegador do computador.
                  </span>
                </p>
              </>
            )}

            <ConfirmDialog
              open={isRegenerateConfirmOpen}
              variant="danger"
              title="Gerar um novo link?"
              description="Isso vai invalidar o link atual. Qualquer professor que já tenha esse link perderá o acesso. Deseja continuar?"
              confirmLabel={isGeneratingLink ? 'Gerando novo link…' : 'Gerar novo link'}
              isConfirming={isGeneratingLink}
              onConfirm={handleGenerateShareLink}
              onCancel={() => {
                setShareError(null)
                setIsRegenerateConfirmOpen(false)
              }}
            >
              {shareError && (
                <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">
                  {shareError}
                </p>
              )}
            </ConfirmDialog>
          </section>

          <div className="mt-8 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:p-5 dark:bg-slate-900 dark:shadow-none dark:ring-slate-800">
            {!hasReportable ? (
              <EmptyState
                icon={FileText}
                title="Nenhum certificado disponível para relatório"
                description="Todos os certificados registrados foram rejeitados pelo professor."
                actionLabel="Ver histórico"
                actionTo="/historico"
              />
            ) : (
              <>
                {/*
                  The toggle's hit area must cover the whole header row —
                  title, summary text, and chevron all toggle it — while
                  "Gerar PDF" sits visually between them but stays its own
                  independent control that never also flips aria-expanded.
                  A <button> can't contain another <button>, and CSS `order`
                  can't pull an element out of its own parent's box, so
                  there's no way to get "one contiguous <button> reaching
                  from the title to the chevron, with a *different* button
                  sandwiched visually in the middle" other than a "stretched
                  hit area": an invisible <button> is absolutely positioned
                  to fill the entire row (`inset-0`), and every purely
                  decorative visible piece gets `pointer-events-none` so
                  clicks pass straight through it to that button underneath
                  — "Gerar PDF" is the one exception, explicitly opting back
                  in with `pointer-events-auto` (plus its own `relative`,
                  which `Button`'s real background/border need in order to
                  actually win the hit test over the invisible button, the
                  same way a positioned element normally would) so its own
                  clicks land on it.
                  Note this is NOT the more obvious "give every visible
                  piece `relative` so it stacks above the invisible button"
                  approach — that alone still leaves an SVG icon (the
                  chevron) unclickable: SVG child shapes don't reliably
                  participate in ancestor z-index/stacking for hit-testing
                  the way normal HTML boxes do, even with explicit z-index
                  on the <svg> itself (verified empirically) — pointer-events
                  sidesteps that entirely instead of fighting it.
                  Don't "simplify" this back to a <span>-wrapped title with
                  a bare decorative chevron sitting outside any button —
                  that's the exact shape of the bug this fixes.
                */}
                <div className="relative flex flex-col gap-3 rounded-xl sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={() => setIsDetailsOpen((open) => !open)}
                    aria-expanded={isDetailsOpen}
                    aria-controls="detalhes-relatorio"
                    aria-label={isDetailsOpen ? 'Ocultar detalhes do que será incluído' : 'Relatório'}
                    className="absolute inset-0 z-0 rounded-xl"
                  />

                  <span aria-hidden="true" className="pointer-events-none text-base font-semibold text-slate-800 dark:text-slate-200">
                    {isDetailsOpen ? 'Ocultar detalhes do que será incluído' : 'Relatório'}
                  </span>

                  <div className="pointer-events-none flex items-center gap-3">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      {buildInclusionSummary(validated.length, pending.length)}
                    </p>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handleGeneratePdf}
                      disabled={isGeneratingPdf}
                      aria-busy={isGeneratingPdf || undefined}
                      className="relative pointer-events-auto shrink-0"
                    >
                      <FileDown aria-hidden="true" size={16} />
                      {isGeneratingPdf ? 'Gerando PDF…' : 'Gerar PDF'}
                    </Button>
                    <ChevronDown
                      aria-hidden="true"
                      size={20}
                      className={`shrink-0 text-slate-500 transition-transform dark:text-slate-400 ${isDetailsOpen ? 'rotate-180' : ''}`}
                    />
                  </div>
                </div>

                {pdfError && (
                  <p role="alert" className="mt-3 text-sm text-rose-600 dark:text-rose-400">
                    {pdfError}
                  </p>
                )}

                <div id="detalhes-relatorio" hidden={!isDetailsOpen} className="mt-5">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    O PDF reúne seus certificados <strong className="font-semibold text-emerald-700 dark:text-emerald-400">validados</strong>{' '}
                    e <strong className="font-semibold text-amber-800 dark:text-amber-300">pendentes de validação</strong>, em
                    seções separadas — certificados rejeitados não entram no relatório.
                  </p>

                  {/*
                    Same adaptive layout as the Dashboard (see
                    utils/categoryGrid.js) — 1-3 active categories share a
                    single row, exactly 4 form a 2×2 grid, exactly 5 split
                    3-then-2-wider — rather than a plain "2 or 3 per row"
                    grid that leaves an orphan card at several counts.
                  */}
                  <ul className={`mt-4 grid gap-4 ${getCategoryGridClassName(activeCategories.length)}`}>
                    {activeCategories.map((category, index) => {
                      const entry = categoryBreakdown.find((c) => c.label === category.label)
                      return (
                        <CategoryCard
                          key={category.key}
                          category={category}
                          progress={entry.progress}
                          className={getCategoryCardSpanClassName(activeCategories.length, index)}
                        />
                      )
                    })}
                  </ul>

                  {validated.length > 0 && (
                    <>
                      <h3 className="mt-8 flex items-center gap-2 text-base font-semibold text-slate-800 dark:text-slate-200">
                        Certificados validados ({validated.length})
                      </h3>
                      <ul className="mt-3 flex flex-col gap-3">
                        {validated.map((cert) => (
                          <ReportCertificateItem key={cert.id} cert={cert} />
                        ))}
                      </ul>
                    </>
                  )}

                  {pending.length > 0 && (
                    <>
                      <h3 className="mt-8 flex items-center gap-2 text-base font-semibold text-slate-800 dark:text-slate-200">
                        Certificados pendentes de validação ({pending.length})
                      </h3>
                      <ul className="mt-3 flex flex-col gap-3">
                        {pending.map((cert) => (
                          <ReportCertificateItem key={cert.id} cert={cert} />
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </main>
  )
}
