import { ArrowLeft, GraduationCap } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AccountLinkDialog from '../components/AccountLinkDialog'
import Button from '../components/Button'
import GoogleIcon from '../components/GoogleIcon'
import { getAuthErrorMessage, requestPasswordReset, signInWithEmail, signInWithGoogle } from '../firebase/authService'
import { useAccountLinking } from '../firebase/useAccountLinking'

const PASSWORD_MISMATCH_CODES = ['auth/wrong-password', 'auth/user-not-found', 'auth/invalid-credential']
const GENERIC_RESET_MESSAGE = 'Se esse e-mail estiver cadastrado, você receberá um link para redefinir sua senha.'

export default function Login() {
  const navigate = useNavigate()
  const linking = useAccountLinking()
  const [view, setView] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false)
  const busy = isSubmitting || isGoogleSubmitting

  const [resetEmail, setResetEmail] = useState('')
  const [resetErrors, setResetErrors] = useState({})
  const [resetStatus, setResetStatus] = useState(null)
  const [isResetSubmitting, setIsResetSubmitting] = useState(false)

  function handleForgotPassword() {
    setResetEmail(email.trim())
    setResetErrors({})
    setResetStatus(null)
    setView('reset')
  }

  function handleBackToLogin() {
    setResetStatus(null)
    setResetErrors({})
    setView('login')
  }

  async function handleResetSubmit(event) {
    event.preventDefault()
    const trimmedEmail = resetEmail.trim()
    if (!trimmedEmail) {
      setResetErrors({ email: 'Informe seu e-mail.' })
      return
    }

    setResetErrors({})
    setResetStatus(null)
    setIsResetSubmitting(true)
    try {
      await requestPasswordReset(trimmedEmail)
      setResetStatus({ type: 'success', message: GENERIC_RESET_MESSAGE })
    } catch (err) {
      setResetStatus({ type: 'error', message: getAuthErrorMessage(err) })
    } finally {
      setIsResetSubmitting(false)
    }
  }

  function validate() {
    const nextErrors = {}
    if (!email.trim()) nextErrors.email = 'Informe seu e-mail.'
    if (!password) nextErrors.password = 'Informe sua senha.'
    return nextErrors
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setFormError(null)
    setSuccessMessage(null)
    setIsSubmitting(true)
    try {
      await signInWithEmail(email.trim(), password)
      navigate('/')
    } catch (err) {
      const trimmedEmail = email.trim()
      const offered =
        PASSWORD_MISMATCH_CODES.includes(err?.code) && (await linking.offerGoogleLink(trimmedEmail, password))
      if (!offered) setFormError(getAuthErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleGoogleSignIn() {
    setFormError(null)
    setSuccessMessage(null)
    setIsGoogleSubmitting(true)
    try {
      await signInWithGoogle()
      navigate('/')
    } catch (err) {
      const offered = await linking.offerPasswordLink(err)
      if (!offered) setFormError(getAuthErrorMessage(err))
    } finally {
      setIsGoogleSubmitting(false)
    }
  }

  function handleLinked(result) {
    setFormError(null)
    setSuccessMessage(
      result.linked
        ? 'Conta vinculada com sucesso! Agora você pode entrar com e-mail ou Google.'
        : 'Login realizado, mas não foi possível vincular o outro método agora. Tente novamente mais tarde.',
    )
    setTimeout(() => navigate('/'), 1200)
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-3xl bg-white p-6 shadow-lg shadow-slate-900/5 ring-1 ring-slate-100 sm:p-10">
        {view === 'login' ? (
          <>
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50">
                <GraduationCap aria-hidden="true" className="text-emerald-600" size={26} />
              </span>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Entrar no HCHub</h1>
                <p className="text-sm text-slate-500">Acesse sua conta para acompanhar suas horas complementares.</p>
              </div>
            </div>

            <form className="mt-8 flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-sm font-medium text-slate-700">
                  E-mail
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-describedby={errors.email ? 'email-erro' : undefined}
                  aria-invalid={Boolean(errors.email)}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 focus-visible:border-emerald-500"
                />
                {errors.email && (
                  <p id="email-erro" className="text-sm text-rose-600">
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <label htmlFor="password" className="text-sm font-medium text-slate-700">
                    Senha
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    Esqueci minha senha
                  </button>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-describedby={errors.password ? 'password-erro' : undefined}
                  aria-invalid={Boolean(errors.password)}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 focus-visible:border-emerald-500"
                />
                {errors.password && (
                  <p id="password-erro" className="text-sm text-rose-600">
                    {errors.password}
                  </p>
                )}
              </div>

              {formError && (
                <p role="alert" className="text-sm text-rose-600">
                  {formError}
                </p>
              )}

              {successMessage && (
                <p role="status" className="text-sm font-medium text-emerald-700">
                  {successMessage}
                </p>
              )}

              <Button type="submit" variant="primary" className="w-full" disabled={busy}>
                {isSubmitting ? 'Entrando…' : 'Entrar'}
              </Button>
            </form>

            <div className="mt-6 flex items-center gap-3" role="separator">
              <span className="h-px flex-1 bg-slate-200" />
              <span className="text-sm text-slate-500">ou</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <Button
              type="button"
              variant="secondary"
              className="mt-6 w-full"
              onClick={handleGoogleSignIn}
              disabled={busy}
            >
              <GoogleIcon />
              {isGoogleSubmitting ? 'Conectando…' : 'Entrar com Google'}
            </Button>

            <p className="mt-8 text-center text-sm text-slate-500">
              Ainda não tem conta?{' '}
              <Link to="/cadastro" className="font-semibold text-emerald-700 hover:text-emerald-800">
                Cadastre-se
              </Link>
            </p>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={handleBackToLogin}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft aria-hidden="true" size={16} />
              Voltar para login
            </button>

            <h1 className="mt-4 text-2xl font-bold text-slate-900">Redefinir senha</h1>
            <p className="mt-1 text-sm text-slate-500">
              Informe seu e-mail cadastrado e enviaremos um link para você criar uma nova senha.
            </p>

            <form className="mt-6 flex flex-col gap-5" onSubmit={handleResetSubmit} noValidate>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="reset-email" className="text-sm font-medium text-slate-700">
                  E-mail
                </label>
                <input
                  id="reset-email"
                  name="reset-email"
                  type="email"
                  autoComplete="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  aria-describedby={resetErrors.email ? 'reset-email-erro' : undefined}
                  aria-invalid={Boolean(resetErrors.email)}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 focus-visible:border-emerald-500"
                />
                {resetErrors.email && (
                  <p id="reset-email-erro" className="text-sm text-rose-600">
                    {resetErrors.email}
                  </p>
                )}
              </div>

              {resetStatus?.type === 'error' && (
                <p role="alert" className="text-sm text-rose-600">
                  {resetStatus.message}
                </p>
              )}

              {resetStatus?.type === 'success' && (
                <p role="status" className="text-sm font-medium text-emerald-700">
                  {resetStatus.message}
                </p>
              )}

              <Button type="submit" variant="primary" className="w-full" disabled={isResetSubmitting}>
                {isResetSubmitting ? 'Enviando…' : 'Enviar link de redefinição'}
              </Button>
            </form>
          </>
        )}
      </div>

      <AccountLinkDialog linking={linking} onLinked={handleLinked} />
    </main>
  )
}
