import { GraduationCap } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AccountLinkDialog from '../components/AccountLinkDialog'
import Button from '../components/Button'
import GoogleIcon from '../components/GoogleIcon'
import ThemeToggle from '../components/ThemeToggle'
import { getAuthErrorMessage, signInWithGoogle, signUpWithEmail } from '../firebase/authService'
import { useAccountLinking } from '../firebase/useAccountLinking'

const MIN_PASSWORD_LENGTH = 6

export default function Signup() {
  const navigate = useNavigate()
  const linking = useAccountLinking()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false)
  const busy = isSubmitting || isGoogleSubmitting

  function validate() {
    const nextErrors = {}
    if (!email.trim()) nextErrors.email = 'Informe seu e-mail.'

    if (!password) {
      nextErrors.password = 'Informe uma senha.'
    } else if (password.length < MIN_PASSWORD_LENGTH) {
      nextErrors.password = `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Confirme sua senha.'
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = 'As senhas não coincidem.'
    }

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
      await signUpWithEmail(email.trim(), password)
      navigate('/onboarding')
    } catch (err) {
      const trimmedEmail = email.trim()
      const offered =
        err?.code === 'auth/email-already-in-use' && (await linking.offerGoogleLink(trimmedEmail, password))
      if (!offered) setFormError(getAuthErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleGoogleSignUp() {
    setFormError(null)
    setSuccessMessage(null)
    setIsGoogleSubmitting(true)
    try {
      await signInWithGoogle()
      navigate('/onboarding')
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
    // Navigate through "/" (not "/onboarding") — this account already exists via the other method, so it may already have a profile.
    setTimeout(() => navigate('/'), 1200)
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
      <div className="flex justify-end">
        <ThemeToggle />
      </div>

      <div className="mt-4 rounded-3xl bg-white p-6 shadow-lg shadow-slate-900/5 ring-1 ring-slate-100 sm:p-10 dark:bg-slate-900 dark:shadow-none dark:ring-slate-800">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950">
            <GraduationCap aria-hidden="true" className="text-emerald-600 dark:text-emerald-400" size={26} />
          </span>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Criar conta no HCHub</h1>
        </div>

        <form className="mt-6 flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
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
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus-visible:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            {errors.email && (
              <p id="email-erro" className="text-sm text-rose-600 dark:text-rose-400">
                {errors.email}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-describedby={errors.password ? 'password-erro' : undefined}
              aria-invalid={Boolean(errors.password)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus-visible:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            {errors.password && (
              <p id="password-erro" className="text-sm text-rose-600 dark:text-rose-400">
                {errors.password}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Confirmar senha
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              aria-describedby={errors.confirmPassword ? 'confirmPassword-erro' : undefined}
              aria-invalid={Boolean(errors.confirmPassword)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus-visible:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            {errors.confirmPassword && (
              <p id="confirmPassword-erro" className="text-sm text-rose-600 dark:text-rose-400">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {formError && (
            <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">
              {formError}
            </p>
          )}

          {successMessage && (
            <p role="status" className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              {successMessage}
            </p>
          )}

          <Button type="submit" variant="primary" className="w-full" disabled={busy}>
            {isSubmitting ? 'Criando conta…' : 'Cadastrar'}
          </Button>
        </form>

        <div className="mt-6 flex items-center gap-3" role="separator">
          <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          <span className="text-sm text-slate-500 dark:text-slate-400">ou</span>
          <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        </div>

        <Button
          type="button"
          variant="secondary"
          className="mt-6 w-full"
          onClick={handleGoogleSignUp}
          disabled={busy}
        >
          <GoogleIcon />
          {isGoogleSubmitting ? 'Conectando…' : 'Cadastrar com Google'}
        </Button>

        <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Já tem conta?{' '}
          <Link
            to="/login"
            className="font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            Entrar
          </Link>
        </p>
      </div>

      <AccountLinkDialog linking={linking} onLinked={handleLinked} />
    </main>
  )
}
