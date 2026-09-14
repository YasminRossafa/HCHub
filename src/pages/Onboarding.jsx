import { GraduationCap } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import { CATEGORIES, DEFAULT_METAS } from '../constants/categories'
import { useAuth } from '../contexts/AuthContext'
import { saveStudentProfile } from '../firebase/studentService'

const CURRENT_YEAR = new Date().getFullYear()

export default function Onboarding() {
  const navigate = useNavigate()
  const { user, refreshStudentProfile } = useAuth()
  const [nome, setNome] = useState('')
  const [curso, setCurso] = useState('')
  const [anoIngresso, setAnoIngresso] = useState(String(CURRENT_YEAR))
  const [metas, setMetas] = useState(DEFAULT_METAS)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  function updateMeta(key, value) {
    setMetas((prev) => ({ ...prev, [key]: value }))
  }

  function validate() {
    const nextErrors = {}
    if (!nome.trim()) nextErrors.nome = 'Informe seu nome completo.'
    if (!curso.trim()) nextErrors.curso = 'Informe o nome do seu curso.'

    const ano = Number(anoIngresso)
    if (!anoIngresso || Number.isNaN(ano) || ano < 2000 || ano > CURRENT_YEAR + 1) {
      nextErrors.anoIngresso = `Informe um ano entre 2000 e ${CURRENT_YEAR + 1}.`
    }

    for (const category of CATEGORIES) {
      const meta = Number(metas[category.key])
      if (Number.isNaN(meta) || meta < 0) {
        nextErrors[category.key] = 'Informe um número de horas válido (0 ou mais).'
      }
    }

    return nextErrors
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitError(null)
    setIsSubmitting(true)
    try {
      await saveStudentProfile(user.uid, {
        nome: nome.trim(),
        curso: curso.trim(),
        anoIngresso: Number(anoIngresso),
        metas: Object.fromEntries(CATEGORIES.map((c) => [c.key, Number(metas[c.key])])),
      })
      await refreshStudentProfile(user.uid)
      navigate('/dashboard')
    } catch (err) {
      console.error(err)
      setSubmitError('Não foi possível salvar seu perfil. Verifique sua conexão e tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-4 py-12">
      <div className="rounded-3xl bg-white p-6 shadow-lg shadow-slate-900/5 ring-1 ring-slate-100 sm:p-10">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50">
            <GraduationCap aria-hidden="true" className="text-emerald-600" size={26} />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Bem-vindo(a) ao HCHub</h1>
            <p className="text-sm text-slate-500">Vamos configurar seu perfil para acompanhar suas horas complementares.</p>
          </div>
        </div>

        <form className="mt-8 flex flex-col gap-6" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label htmlFor="nome" className="text-sm font-medium text-slate-700">
                Nome
              </label>
              <input
                id="nome"
                name="nome"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                aria-describedby={errors.nome ? 'nome-erro' : undefined}
                aria-invalid={Boolean(errors.nome)}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 focus-visible:border-emerald-500"
              />
              {errors.nome && (
                <p id="nome-erro" className="text-sm text-rose-600">
                  {errors.nome}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="curso" className="text-sm font-medium text-slate-700">
                Curso
              </label>
              <input
                id="curso"
                name="curso"
                type="text"
                value={curso}
                onChange={(e) => setCurso(e.target.value)}
                aria-describedby={errors.curso ? 'curso-erro' : undefined}
                aria-invalid={Boolean(errors.curso)}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 focus-visible:border-emerald-500"
              />
              {errors.curso && (
                <p id="curso-erro" className="text-sm text-rose-600">
                  {errors.curso}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="anoIngresso" className="text-sm font-medium text-slate-700">
                Ano de ingresso
              </label>
              <input
                id="anoIngresso"
                name="anoIngresso"
                type="number"
                inputMode="numeric"
                value={anoIngresso}
                onChange={(e) => setAnoIngresso(e.target.value)}
                aria-describedby={errors.anoIngresso ? 'ano-erro' : undefined}
                aria-invalid={Boolean(errors.anoIngresso)}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 focus-visible:border-emerald-500"
              />
              {errors.anoIngresso && (
                <p id="ano-erro" className="text-sm text-rose-600">
                  {errors.anoIngresso}
                </p>
              )}
            </div>
          </div>

          <fieldset className="rounded-2xl border border-slate-200 p-4">
            <legend className="px-1 text-sm font-semibold text-slate-800">Metas de horas por categoria</legend>
            <p className="px-1 text-sm text-slate-500">
              Valores padrão preenchidos automaticamente — ajuste conforme as regras do seu curso.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {CATEGORIES.map((category) => {
                const Icon = category.icon
                const fieldId = `meta-${category.key}`
                const errorId = `${fieldId}-erro`
                return (
                  <div key={category.key} className="flex flex-col gap-1.5">
                    <label htmlFor={fieldId} className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <Icon aria-hidden="true" className={category.text} size={16} />
                      {category.label}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        id={fieldId}
                        name={fieldId}
                        type="number"
                        min="0"
                        inputMode="numeric"
                        value={metas[category.key]}
                        onChange={(e) => updateMeta(category.key, e.target.value)}
                        aria-describedby={errors[category.key] ? errorId : undefined}
                        aria-invalid={Boolean(errors[category.key])}
                        className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 focus-visible:border-emerald-500"
                      />
                      <span className="text-sm text-slate-500">horas</span>
                    </div>
                    {errors[category.key] && (
                      <p id={errorId} className="text-sm text-rose-600">
                        {errors[category.key]}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </fieldset>

          {submitError && (
            <p role="alert" className="text-sm text-rose-600">
              {submitError}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full sm:w-auto sm:self-start"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Salvando…' : 'Começar a acompanhar'}
          </Button>
        </form>
      </div>
    </main>
  )
}
