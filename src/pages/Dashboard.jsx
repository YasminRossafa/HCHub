import { PlusCircle } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/Button'
import CategoryCard from '../components/CategoryCard'
import EmptyState from '../components/EmptyState'
import LoadingScreen from '../components/LoadingScreen'
import OverallProgressHero from '../components/OverallProgressHero'
import { CATEGORIES } from '../constants/categories'
import { useAuth } from '../contexts/AuthContext'
import { getCertificates } from '../services/storageService'
import { getCategoryProgress, getOverallProgress } from '../utils/progress'

export default function Dashboard() {
  const { studentProfile: aluno } = useAuth()
  // Certificates still live in localStorage; the student profile now comes from Firestore (see AuthContext).
  const [certificados] = useState(getCertificates)

  // RequireStudent already guarantees a profile is loaded before this route renders; this is a defensive fallback.
  if (!aluno) return <LoadingScreen />

  const overall = getOverallProgress(aluno, certificados)
  const hasCertificates = certificados.length > 0

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Olá, {aluno.nome}</h1>
          <p className="text-sm text-slate-500">
            {aluno.curso} · Ingresso em {aluno.anoIngresso}
          </p>
        </div>
        <Button as={Link} to="/registrar" variant="primary">
          <PlusCircle aria-hidden="true" size={20} />
          Registrar nova atividade
        </Button>
      </header>

      <div className="mt-6">
        <OverallProgressHero completed={overall.completed} goal={overall.goal} percent={overall.percent} />
      </div>

      <section aria-labelledby="categorias-heading" className="mt-8">
        <h2 id="categorias-heading" className="text-lg font-semibold text-slate-800">
          Progresso por categoria
        </h2>

        {hasCertificates ? (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((category) => (
              <CategoryCard
                key={category.key}
                category={category}
                progress={getCategoryProgress(category.key, aluno, certificados)}
              />
            ))}
          </ul>
        ) : (
          <div className="mt-4">
            <EmptyState />
          </div>
        )}
      </section>
    </main>
  )
}
