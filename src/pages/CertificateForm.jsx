import { ArrowLeft, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import Button from '../components/Button'
import LoadingState from '../components/LoadingState'
import { CATEGORIES_BY_KEY } from '../constants/categories'
import { categoryHasSubcategories, getSubcategoryOptions } from '../constants/subcategories'
import { useAuth } from '../contexts/AuthContext'
import { addCertificate, getCertificate, updateCertificate } from '../firebase/certificateService'
import { todayISO } from '../utils/date'
import { compressImage, isImageFile, MAX_ANEXO_ORIGINAL_BYTES } from '../utils/file'
import { getActiveCategories } from '../utils/progress'

export default function CertificateForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, studentProfile: aluno } = useAuth()
  const isEditing = Boolean(id)

  const [loadState, setLoadState] = useState(isEditing ? 'loading' : 'ready')

  const [titulo, setTitulo] = useState('')
  const [categoria, setCategoria] = useState('')
  const [subcategoria, setSubcategoria] = useState('')
  const [cargaHoraria, setCargaHoraria] = useState('')
  const [data, setData] = useState('')
  const [observacoes, setObservacoes] = useState('')

  // `imageFile` is the newly compressed Blob staged for upload (null until the
  // student picks a file, or after they remove one). `previewUrl` is what the
  // <img> shows: an existing certificate's anexoUrl, or an object URL for a
  // freshly picked file. Both are cleared together by "Remover".
  const [imageFile, setImageFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const objectUrlRef = useRef(null)

  const [isProcessingFile, setIsProcessingFile] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [errors, setErrors] = useState({})
  const fileInputRef = useRef(null)

  // A category with a zeroed-out goal is normally hidden from this dropdown,
  // but if the certificate being edited was already tagged with one (goal
  // zeroed after the fact, or before this account had any goals), it's kept
  // as an option so editing doesn't blank out or silently change existing data.
  const categoryOptions = useMemo(() => {
    const active = getActiveCategories(aluno)
    if (categoria && !active.some((c) => c.key === categoria)) {
      const original = CATEGORIES_BY_KEY[categoria]
      if (original) return [...active, original]
    }
    return active
  }, [aluno, categoria])

  useEffect(() => {
    if (!isEditing || !user) return
    let active = true
    getCertificate(user.uid, id)
      .then((existing) => {
        if (!active) return
        if (!existing) {
          setLoadState('not-found')
          return
        }
        setTitulo(existing.titulo ?? '')
        setCategoria(existing.categoria ?? '')
        setSubcategoria(existing.subcategoria ?? '')
        setCargaHoraria(String(existing.cargaHoraria ?? ''))
        setData(existing.data ?? '')
        setObservacoes(existing.observacoes ?? '')
        setPreviewUrl(existing.anexoUrl ?? null)
        setLoadState('ready')
      })
      .catch(() => {
        if (active) setLoadState('not-found')
      })
    return () => {
      active = false
    }
  }, [isEditing, id, user])

  // Revoke any object URL we created for a freshly picked file when it's replaced or the form unmounts.
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    }
  }, [])

  if (loadState === 'not-found') {
    return <Navigate to="/historico" replace />
  }

  function setPreviewFromFile(blob) {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    const url = URL.createObjectURL(blob)
    objectUrlRef.current = url
    setPreviewUrl(url)
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0]
    if (!file) return

    if (!isImageFile(file)) {
      setErrors((prev) => ({ ...prev, anexo: 'Envie uma imagem (JPEG ou PNG).' }))
      event.target.value = ''
      return
    }
    if (file.size > MAX_ANEXO_ORIGINAL_BYTES) {
      setErrors((prev) => ({ ...prev, anexo: 'A imagem deve ter no máximo 5MB.' }))
      event.target.value = ''
      return
    }

    setErrors((prev) => {
      const { anexo: _removed, ...rest } = prev
      return rest
    })
    setIsProcessingFile(true)
    compressImage(file)
      .then((blob) => {
        setImageFile(blob)
        setPreviewFromFile(blob)
      })
      .catch(() => setErrors((prev) => ({ ...prev, anexo: 'Falha ao processar a imagem. Tente novamente.' })))
      .finally(() => setIsProcessingFile(false))
  }

  function handleCategoriaChange(value) {
    setCategoria(value)
    if (!categoryHasSubcategories(value)) setSubcategoria('')
  }

  function handleRemoveAnexo() {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
    setImageFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function validate() {
    const nextErrors = {}
    if (!titulo.trim()) nextErrors.titulo = 'Informe o título da atividade.'
    if (!categoria) nextErrors.categoria = 'Selecione uma categoria.'
    if (categoryHasSubcategories(categoria) && !subcategoria) {
      nextErrors.subcategoria = 'Selecione o tipo de atividade.'
    }

    const horas = Number(cargaHoraria)
    if (!cargaHoraria || Number.isNaN(horas) || horas <= 0) {
      nextErrors.cargaHoraria = 'Informe uma carga horária maior que zero.'
    }

    if (!data) {
      nextErrors.data = 'Informe a data da atividade.'
    } else if (data > todayISO()) {
      nextErrors.data = 'A data não pode ser no futuro.'
    }

    if (!previewUrl) {
      nextErrors.anexo = 'Anexe uma foto do certificado para confirmar as horas.'
    }

    return nextErrors
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const payload = {
      titulo: titulo.trim(),
      categoria,
      subcategoria: categoryHasSubcategories(categoria) ? subcategoria : '',
      cargaHoraria: Number(cargaHoraria),
      data,
      observacoes: observacoes.trim(),
      status: 'pendente',
    }

    setSubmitError(null)
    setIsSubmitting(true)
    try {
      if (isEditing) {
        await updateCertificate(user.uid, id, payload, imageFile)
        navigate('/historico', { state: { flash: 'Certificado atualizado e reenviado para revisão.' } })
      } else {
        await addCertificate(user.uid, payload, imageFile)
        navigate('/historico', { state: { flash: 'Certificado registrado com sucesso!' } })
      }
    } catch (err) {
      console.error(err)
      setSubmitError('Não foi possível salvar o certificado. Verifique sua conexão e tente novamente.')
      setIsSubmitting(false)
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
        {isEditing ? 'Editar certificado' : 'Registrar nova atividade'}
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {isEditing
          ? 'Alterar os dados envia o certificado novamente para revisão.'
          : 'Preencha os dados do certificado. Ele ficará pendente até ser validado.'}
      </p>

      <div className="mt-6 rounded-3xl bg-white p-6 shadow-lg shadow-slate-900/5 ring-1 ring-slate-100 sm:p-8 dark:bg-slate-900 dark:shadow-none dark:ring-slate-800">
        {loadState === 'loading' ? (
          <LoadingState label="Carregando certificado…" />
        ) : (
          <form onSubmit={handleSubmit} noValidate aria-busy={isSubmitting} className="flex flex-col gap-6">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="titulo" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Título
              </label>
              <input
                id="titulo"
                name="titulo"
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                aria-describedby={errors.titulo ? 'titulo-erro' : undefined}
                aria-invalid={Boolean(errors.titulo)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus-visible:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              {errors.titulo && (
                <p id="titulo-erro" className="text-sm text-rose-600 dark:text-rose-400">
                  {errors.titulo}
                </p>
              )}
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="categoria" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Categoria
                  </label>
                  <select
                    id="categoria"
                    name="categoria"
                    value={categoria}
                    onChange={(e) => handleCategoriaChange(e.target.value)}
                    aria-describedby={errors.categoria ? 'categoria-erro' : undefined}
                    aria-invalid={Boolean(errors.categoria)}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus-visible:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="" disabled>
                      Selecione uma categoria
                    </option>
                    {categoryOptions.map((category) => (
                      <option key={category.key} value={category.key}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                  {errors.categoria && (
                    <p id="categoria-erro" className="text-sm text-rose-600 dark:text-rose-400">
                      {errors.categoria}
                    </p>
                  )}
                </div>

                {categoryHasSubcategories(categoria) && (
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="subcategoria" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Tipo de atividade
                    </label>
                    <select
                      id="subcategoria"
                      name="subcategoria"
                      value={subcategoria}
                      onChange={(e) => setSubcategoria(e.target.value)}
                      aria-describedby={errors.subcategoria ? 'subcategoria-erro' : undefined}
                      aria-invalid={Boolean(errors.subcategoria)}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus-visible:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    >
                      <option value="" disabled>
                        Selecione o tipo de atividade
                      </option>
                      {getSubcategoryOptions(categoria).map((sub) => (
                        <option key={sub.key} value={sub.key}>
                          {sub.label}
                        </option>
                      ))}
                    </select>
                    {errors.subcategoria && (
                      <p id="subcategoria-erro" className="text-sm text-rose-600 dark:text-rose-400">
                        {errors.subcategoria}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="cargaHoraria" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Carga horária
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="cargaHoraria"
                    name="cargaHoraria"
                    type="number"
                    min="1"
                    inputMode="numeric"
                    value={cargaHoraria}
                    onChange={(e) => setCargaHoraria(e.target.value)}
                    aria-describedby={errors.cargaHoraria ? 'cargaHoraria-erro' : undefined}
                    aria-invalid={Boolean(errors.cargaHoraria)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus-visible:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                  <span className="text-sm text-slate-500 dark:text-slate-400">horas</span>
                </div>
                {errors.cargaHoraria && (
                  <p id="cargaHoraria-erro" className="text-sm text-rose-600 dark:text-rose-400">
                    {errors.cargaHoraria}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5 sm:w-1/2 sm:pr-3">
              <label htmlFor="data" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Data
              </label>
              <input
                id="data"
                name="data"
                type="date"
                max={todayISO()}
                value={data}
                onChange={(e) => setData(e.target.value)}
                aria-describedby={errors.data ? 'data-erro' : undefined}
                aria-invalid={Boolean(errors.data)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus-visible:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:[color-scheme:dark]"
              />
              {errors.data && (
                <p id="data-erro" className="text-sm text-rose-600 dark:text-rose-400">
                  {errors.data}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="observacoes" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Observações <span className="font-normal text-slate-400 dark:text-slate-500">(opcional)</span>
              </label>
              <textarea
                id="observacoes"
                name="observacoes"
                rows={3}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus-visible:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="anexo" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Foto do certificado
              </label>
              <input
                id="anexo"
                name="anexo"
                type="file"
                accept="image/jpeg,image/png"
                ref={fileInputRef}
                onChange={handleFileChange}
                aria-describedby={errors.anexo ? 'anexo-erro' : 'anexo-dica'}
                aria-invalid={Boolean(errors.anexo)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 focus-visible:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:file:bg-slate-700 dark:file:text-slate-200"
              />
              <p id="anexo-dica" className="text-sm text-slate-500 dark:text-slate-400">
                Obrigatória para confirmar as horas. JPEG ou PNG, até 5MB — a imagem é comprimida
                automaticamente ao ser enviada.
              </p>
              {errors.anexo && (
                <p id="anexo-erro" className="text-sm text-rose-600 dark:text-rose-400">
                  {errors.anexo}
                </p>
              )}
              {isProcessingFile && (
                <p role="status" aria-live="polite" className="text-sm text-slate-500 dark:text-slate-400">
                  Comprimindo imagem…
                </p>
              )}

              {previewUrl && !isProcessingFile && (
                <div className="mt-1 flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                  <div className="flex min-w-0 items-center gap-3">
                    <img
                      src={previewUrl}
                      alt="Pré-visualização da foto do certificado"
                      className="h-12 w-12 shrink-0 rounded-lg object-cover"
                    />
                    <span className="truncate text-sm text-slate-600 dark:text-slate-400">Foto anexada</span>
                  </div>
                  <Button type="button" variant="secondary" size="sm" onClick={handleRemoveAnexo}>
                    <X aria-hidden="true" size={16} />
                    Remover
                  </Button>
                </div>
              )}
            </div>

            {submitError && (
              <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">
                {submitError}
              </p>
            )}
            {isSubmitting && (
              <p role="status" aria-live="polite" className="text-sm text-slate-500 dark:text-slate-400">
                Enviando certificado…
              </p>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => navigate(-1)} disabled={isSubmitting}>
                <ArrowLeft aria-hidden="true" size={18} />
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={isProcessingFile || isSubmitting}>
                {isSubmitting ? 'Enviando…' : isEditing ? 'Salvar alterações' : 'Registrar atividade'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </main>
  )
}
