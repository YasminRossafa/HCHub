import { AlertTriangle, FileDown, FileText, Link2, Mail } from 'lucide-react'
import { useMemo, useState } from 'react'
import Button from '../components/Button'
import CategoryCard from '../components/CategoryCard'
import EmptyState from '../components/EmptyState'
import LoadingScreen from '../components/LoadingScreen'
import { CATEGORIES, CATEGORIES_BY_KEY } from '../constants/categories'
import { useAuth } from '../contexts/AuthContext'
import { getCertificates } from '../services/storageService'
import { formatDate } from '../utils/date'
import { generateReportPdf } from '../utils/pdf'
import { getCategoryProgress, getOverallProgress, getValidatedCertificates } from '../utils/progress'
import { buildShareableLink } from '../utils/shareLink'

export default function Report() {
  const { studentProfile: aluno } = useAuth()
  // Certificates still live in localStorage; the student profile now comes from Firestore (see AuthContext).
  const [certificados] = useState(getCertificates)
  const validated = useMemo(() => getValidatedCertificates(certificados), [certificados])
  const hasValidated = validated.length > 0

  const categoryBreakdown = useMemo(
    () => CATEGORIES.map((category) => ({ label: category.label, progress: getCategoryProgress(category.key, aluno, certificados) })),
    [aluno, certificados],
  )

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [pdfError, setPdfError] = useState(null)
  const [shareResult, setShareResult] = useState(null)
  const [copyLabel, setCopyLabel] = useState('Copiar')

  // RequireStudent already guarantees a profile is loaded before this route renders; this is a defensive fallback.
  if (!aluno) return <LoadingScreen />

  const overall = getOverallProgress(aluno, certificados)

  async function handleGeneratePdf() {
    setIsGeneratingPdf(true)
    setPdfError(null)
    try {
      await generateReportPdf({ aluno, overall, categoryBreakdown, certificates: validated })
    } catch (err) {
      console.error(err)
      setPdfError('Não foi possível gerar o PDF. Tente novamente.')
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  function handleGenerateShareLink() {
    const result = buildShareableLink({ aluno, certificados: validated })
    setShareResult(result)
    setCopyLabel('Copiar')
  }

  async function handleCopyLink() {
    if (!shareResult) return
    try {
      await navigator.clipboard.writeText(shareResult.url)
      setCopyLabel('Copiado!')
      setTimeout(() => setCopyLabel('Copiar'), 2000)
    } catch {
      setCopyLabel('Não foi possível copiar')
    }
  }

  const mailSubject = `Relatório de horas complementares — ${aluno.nome}`
  const mailBody =
    `Olá,\n\nSegue o relatório de horas complementares de ${aluno.nome} (${aluno.curso}).\n\n` +
    'IMPORTANTE: este link apenas abre seu aplicativo de e-mail com o texto pronto — não há um servidor para anexar ' +
    'o arquivo automaticamente. Anexe manualmente o PDF baixado com o botão "Gerar PDF" antes de enviar esta mensagem.\n\n' +
    `Atenciosamente,\n${aluno.nome}`
  const mailtoHref = `mailto:?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">Relatório para o professor</h1>
      <p className="mt-1 text-sm text-slate-500">
        Gere um PDF ou um link com o resumo das suas horas validadas para enviar ao professor responsável.
      </p>

      <section aria-labelledby="incluido-heading" className="mt-8">
        <h2 id="incluido-heading" className="text-lg font-semibold text-slate-800">
          O que será incluído
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Somente certificados com status <strong className="font-semibold text-slate-700">validado</strong> entram
          no relatório — são os únicos já confirmados pelo professor.
        </p>

        {!hasValidated ? (
          <div className="mt-4">
            <EmptyState
              icon={FileText}
              title="Nenhum certificado validado ainda"
              description="Assim que certificados forem validados, você poderá gerar um relatório para seu professor."
              actionLabel="Ver histórico"
              actionTo="/historico"
            />
          </div>
        ) : (
          <>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {CATEGORIES.map((category) => {
                const count = validated.filter((c) => c.categoria === category.key).length
                const entry = categoryBreakdown.find((c) => c.label === category.label)
                return <CategoryCard key={category.key} category={category} progress={entry.progress} count={count} />
              })}
            </ul>

            <h3 className="mt-8 text-base font-semibold text-slate-800">
              Certificados incluídos ({validated.length})
            </h3>
            <ul className="mt-3 flex flex-col gap-3">
              {validated.map((cert) => {
                const category = CATEGORIES_BY_KEY[cert.categoria]
                return (
                  <li
                    key={cert.id}
                    className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-100"
                  >
                    <img
                      src={cert.anexo}
                      alt={`Certificado: ${cert.titulo}`}
                      className="h-14 w-14 shrink-0 rounded-lg object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{cert.titulo}</p>
                      <p className="text-sm text-slate-500">
                        {category?.label ?? cert.categoria} · {cert.cargaHoraria}h · {formatDate(cert.data)}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </section>

      {hasValidated && (
        <section
          aria-labelledby="acoes-heading"
          className="mt-8 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6"
        >
          <h2 id="acoes-heading" className="text-lg font-semibold text-slate-800">
            Gerar e compartilhar
          </h2>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button type="button" variant="primary" onClick={handleGeneratePdf} disabled={isGeneratingPdf}>
              <FileDown aria-hidden="true" size={18} />
              {isGeneratingPdf ? 'Gerando PDF…' : 'Gerar PDF'}
            </Button>

            <Button as="a" href={mailtoHref} variant="secondary">
              <Mail aria-hidden="true" size={18} />
              Enviar por e-mail
            </Button>

            <Button type="button" variant="secondary" onClick={handleGenerateShareLink}>
              <Link2 aria-hidden="true" size={18} />
              Gerar link compartilhável
            </Button>
          </div>

          {pdfError && (
            <p role="alert" className="mt-3 text-sm text-rose-600">
              {pdfError}
            </p>
          )}

          <p className="mt-3 text-sm text-slate-500">
            O e-mail abre seu aplicativo com o texto já pronto — como não há um servidor para enviar arquivos, você
            precisa anexar o PDF baixado manualmente antes de enviar.
          </p>

          {shareResult && (
            <div className="mt-4 flex flex-col gap-2 rounded-xl border border-slate-200 p-3">
              <label htmlFor="share-link" className="text-sm font-medium text-slate-700">
                Link compartilhável (somente leitura)
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  id="share-link"
                  type="text"
                  readOnly
                  value={shareResult.url}
                  onFocus={(e) => e.target.select()}
                  className="w-full min-w-0 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 focus-visible:border-emerald-500"
                />
                <Button type="button" variant="secondary" size="sm" onClick={handleCopyLink} className="shrink-0">
                  {copyLabel}
                </Button>
              </div>
              <p className="text-sm text-slate-500">
                Qualquer pessoa com este link poderá ver este resumo — não é necessário login.
              </p>
              {shareResult.wasCapped && (
                <p className="flex items-start gap-2 text-sm text-amber-800">
                  <AlertTriangle aria-hidden="true" size={16} className="mt-0.5 shrink-0" />
                  Para manter o link em um tamanho seguro, apenas os {shareResult.includedCount} certificados mais
                  recentes (de {shareResult.totalCount}) foram incluídos. Baixe o PDF para ver o relatório completo.
                </p>
              )}
            </div>
          )}
        </section>
      )}
    </main>
  )
}
