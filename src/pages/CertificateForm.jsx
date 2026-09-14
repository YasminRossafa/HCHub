import { ArrowLeft, FileText, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import Button from '../components/Button'
import { CATEGORIES } from '../constants/categories'
import { addCertificate, getCertificates, updateCertificate } from '../services/storageService'
import { todayISO } from '../utils/date'
import { isAcceptedAnexoType, MAX_ANEXO_BYTES, readFileAsDataURL } from '../utils/file'

export default function CertificateForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)
  const [existing] = useState(() => (id ? (getCertificates().find((c) => c.id === id) ?? null) : null))

  const [titulo, setTitulo] = useState(existing?.titulo ?? '')
  const [categoria, setCategoria] = useState(existing?.categoria ?? '')
  const [cargaHoraria, setCargaHoraria] = useState(existing ? String(existing.cargaHoraria) : '')
  const [data, setData] = useState(existing?.data ?? '')
  const [observacoes, setObservacoes] = useState(existing?.observacoes ?? '')
  const [anexo, setAnexo] = useState(existing?.anexo ?? null)
  const [isProcessingFile, setIsProcessingFile] = useState(false)
  const [errors, setErrors] = useState({})
  const fileInputRef = useRef(null)

  if (isEditing && !existing) {
    return <Navigate to="/historico" replace />
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0]
    if (!file) return

    if (!isAcceptedAnexoType(file)) {
      setErrors((prev) => ({ ...prev, anexo: 'Envie um arquivo de imagem ou PDF.' }))
      event.target.value = ''
      return
    }
    if (file.size > MAX_ANEXO_BYTES) {
      setErrors((prev) => ({ ...prev, anexo: 'O arquivo deve ter no máximo 400KB.' }))
      event.target.value = ''
      return
    }

    setErrors((prev) => {
      const { anexo: _removed, ...rest } = prev
      return rest
    })
    setIsProcessingFile(true)
    readFileAsDataURL(file)
      .then((dataUrl) => setAnexo(dataUrl))
      .catch(() => setErrors((prev) => ({ ...prev, anexo: 'Falha ao ler o arquivo. Tente novamente.' })))
      .finally(() => setIsProcessingFile(false))
  }

  function handleRemoveAnexo() {
    setAnexo(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function validate() {
    const nextErrors = {}
    if (!titulo.trim()) nextErrors.titulo = 'Informe o título da atividade.'
    if (!categoria) nextErrors.categoria = 'Selecione uma categoria.'

    const horas = Number(cargaHoraria)
    if (!cargaHoraria || Number.isNaN(horas) || horas <= 0) {
      nextErrors.cargaHoraria = 'Informe uma carga horária maior que zero.'
    }

    if (!data) {
      nextErrors.data = 'Informe a data da atividade.'
    } else if (data > todayISO()) {
      nextErrors.data = 'A data não pode ser no futuro.'
    }

    return nextErrors
  }

  function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const payload = {
      titulo: titulo.trim(),
      categoria,
      cargaHoraria: Number(cargaHoraria),
      data,
      observacoes: observacoes.trim(),
      anexo,
      status: 'pendente',
    }

    if (isEditing) {
      updateCertificate(existing.id, payload)
      navigate('/historico', { state: { flash: 'Certificado atualizado e reenviado para revisão.' } })
    } else {
      addCertificate(payload)
      navigate('/historico', { state: { flash: 'Certificado registrado com sucesso!' } })
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">
        {isEditing ? 'Editar certificado' : 'Registrar nova atividade'}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        {isEditing
          ? 'Alterar os dados envia o certificado novamente para revisão.'
          : 'Preencha os dados do certificado. Ele ficará pendente até ser validado.'}
      </p>

      <div className="mt-6 rounded-3xl bg-white p-6 shadow-lg shadow-slate-900/5 ring-1 ring-slate-100 sm:p-8">
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="titulo" className="text-sm font-medium text-slate-700">
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
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 focus-visible:border-emerald-500"
            />
            {errors.titulo && (
              <p id="titulo-erro" className="text-sm text-rose-600">
                {errors.titulo}
              </p>
            )}
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="categoria" className="text-sm font-medium text-slate-700">
                Categoria
              </label>
              <select
                id="categoria"
                name="categoria"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                aria-describedby={errors.categoria ? 'categoria-erro' : undefined}
                aria-invalid={Boolean(errors.categoria)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus-visible:border-emerald-500"
              >
                <option value="" disabled>
                  Selecione uma categoria
                </option>
                {CATEGORIES.map((category) => (
                  <option key={category.key} value={category.key}>
                    {category.label}
                  </option>
                ))}
              </select>
              {errors.categoria && (
                <p id="categoria-erro" className="text-sm text-rose-600">
                  {errors.categoria}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="cargaHoraria" className="text-sm font-medium text-slate-700">
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
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 focus-visible:border-emerald-500"
                />
                <span className="text-sm text-slate-500">horas</span>
              </div>
              {errors.cargaHoraria && (
                <p id="cargaHoraria-erro" className="text-sm text-rose-600">
                  {errors.cargaHoraria}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5 sm:w-1/2 sm:pr-3">
            <label htmlFor="data" className="text-sm font-medium text-slate-700">
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
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 focus-visible:border-emerald-500"
            />
            {errors.data && (
              <p id="data-erro" className="text-sm text-rose-600">
                {errors.data}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="observacoes" className="text-sm font-medium text-slate-700">
              Observações <span className="font-normal text-slate-400">(opcional)</span>
            </label>
            <textarea
              id="observacoes"
              name="observacoes"
              rows={3}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 focus-visible:border-emerald-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="anexo" className="text-sm font-medium text-slate-700">
              Anexo <span className="font-normal text-slate-400">(opcional)</span>
            </label>
            <input
              id="anexo"
              name="anexo"
              type="file"
              accept="image/*,application/pdf"
              ref={fileInputRef}
              onChange={handleFileChange}
              aria-describedby={errors.anexo ? 'anexo-erro' : 'anexo-dica'}
              aria-invalid={Boolean(errors.anexo)}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 focus-visible:border-emerald-500"
            />
            <p id="anexo-dica" className="text-sm text-slate-500">
              Imagem ou PDF, até 400KB.
            </p>
            {errors.anexo && (
              <p id="anexo-erro" className="text-sm text-rose-600">
                {errors.anexo}
              </p>
            )}
            {isProcessingFile && <p className="text-sm text-slate-500">Processando arquivo…</p>}

            {anexo && !isProcessingFile && (
              <div className="mt-1 flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
                <div className="flex min-w-0 items-center gap-3">
                  {anexo.startsWith('data:image') ? (
                    <img
                      src={anexo}
                      alt="Pré-visualização do anexo"
                      className="h-12 w-12 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                      <FileText aria-hidden="true" className="text-slate-500" size={20} />
                    </span>
                  )}
                  <span className="truncate text-sm text-slate-600">Arquivo anexado</span>
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={handleRemoveAnexo}>
                  <X aria-hidden="true" size={16} />
                  Remover
                </Button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
              <ArrowLeft aria-hidden="true" size={18} />
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={isProcessingFile}>
              {isEditing ? 'Salvar alterações' : 'Registrar atividade'}
            </Button>
          </div>
        </form>
      </div>
    </main>
  )
}
