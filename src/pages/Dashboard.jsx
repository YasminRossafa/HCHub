import { PlusCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/Button'
import CategoryCard from '../components/CategoryCard'
import EmptyState from '../components/EmptyState'
import LoadingScreen from '../components/LoadingScreen'
import LoadingState from '../components/LoadingState'
import OverallProgressHero from '../components/OverallProgressHero'
import { useAuth } from '../contexts/AuthContext'
import { getCertificates } from '../firebase/certificateService'
import { getCategoryCardSpanClassName, getCategoryGridClassName } from '../utils/categoryGrid'
import { getActiveCategories, getCategoryProgress, getOverallProgress } from '../utils/progress'

export default function Dashboard() {
  const { studentProfile: aluno, user } = useAuth()
  const [certificados, setCertificados] = useState([])
  const [certificatesLoading, setCertificatesLoading] = useState(true)

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

  // RequireStudent already guarantees a profile is loaded before this route renders; this is a defensive fallback.
  if (!aluno) return <LoadingScreen />

  const overall = getOverallProgress(aluno, certificados)
  const activeCategories = getActiveCategories(aluno)
  const hasCertificates = certificados.length > 0

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Olá, {aluno.nome}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {aluno.curso} · Ingresso em {aluno.anoIngresso}
          </p>
        </div>
        <Button as={Link} to="/registrar" variant="primary">
          <PlusCircle aria-hidden="true" size={20} />
          Registrar nova atividade
        </Button>
      </header>

      {certificatesLoading ? (
        <div className="mt-6">
          <LoadingState label="Carregando seu progresso…" />
        </div>
      ) : (
        <>
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

            {hasCertificates ? (
              <ul className={`mt-4 grid gap-4 ${getCategoryGridClassName(activeCategories.length)}`}>
                {activeCategories.map((category, index) => (
                  <CategoryCard
                    key={category.key}
                    category={category}
                    progress={getCategoryProgress(category.key, aluno, certificados)}
                    className={getCategoryCardSpanClassName(activeCategories.length, index)}
                  />
                ))}
              </ul>
            ) : (
              <div className="mt-4">
                <EmptyState />
              </div>
            )}
          </section>
        </>
      )}
    </main>
  )
}
