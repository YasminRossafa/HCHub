import { CheckCircle2, Search, SearchX, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import CertificateListItem from '../components/CertificateListItem'
import ChipRadio from '../components/ChipRadio'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import { CATEGORIES } from '../constants/categories'
import { deleteCertificate, getCertificates } from '../services/storageService'

const STATUS_OPTIONS = [
  { value: 'todos', label: 'Todos' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'validado', label: 'Validado' },
  { value: 'rejeitado', label: 'Rejeitado' },
]

export default function History() {
  const location = useLocation()
  const [certificados, setCertificados] = useState(getCertificates)
  const [flash, setFlash] = useState(location.state?.flash ?? null)
  const [search, setSearch] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas')
  const [statusFiltro, setStatusFiltro] = useState('todos')
  const [pendingDelete, setPendingDelete] = useState(null)

  useEffect(() => {
    if (!flash) return undefined
    const timer = setTimeout(() => setFlash(null), 4000)
    return () => clearTimeout(timer)
  }, [flash])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return certificados.filter((cert) => {
      if (term && !cert.titulo.toLowerCase().includes(term)) return false
      if (categoriaFiltro !== 'todas' && cert.categoria !== categoriaFiltro) return false
      if (statusFiltro !== 'todos' && cert.status !== statusFiltro) return false
      return true
    })
  }, [certificados, search, categoriaFiltro, statusFiltro])

  function clearFilters() {
    setSearch('')
    setCategoriaFiltro('todas')
    setStatusFiltro('todos')
  }

  function handleConfirmDelete() {
    if (!pendingDelete) return
    deleteCertificate(pendingDelete.id)
    setCertificados(getCertificates())
    setPendingDelete(null)
  }

  const hasAnyCertificates = certificados.length > 0
  const hasFiltersApplied = search.trim() !== '' || categoriaFiltro !== 'todas' || statusFiltro !== 'todos'

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {flash && (
        <div
          role="status"
          aria-live="polite"
          className="mb-6 flex items-center justify-between gap-3 rounded-2xl bg-emerald-50 px-4 py-3 text-emerald-800"
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            <CheckCircle2 aria-hidden="true" size={18} />
            {flash}
          </span>
          <button
            type="button"
            onClick={() => setFlash(null)}
            aria-label="Fechar aviso"
            className="shrink-0 rounded-full p-1 hover:bg-emerald-100"
          >
            <X aria-hidden="true" size={16} />
          </button>
        </div>
      )}

      <header>
        <h1 className="text-2xl font-bold text-slate-900">Histórico de atividades</h1>
        <p className="text-sm text-slate-500">Acompanhe todos os certificados registrados.</p>
      </header>

      {hasAnyCertificates && (
        <div className="mt-6 flex flex-col gap-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:p-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="busca" className="text-sm font-medium text-slate-700">
              Buscar por título
            </label>
            <div className="relative">
              <Search
                aria-hidden="true"
                size={18}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
              />
              <input
                id="busca"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ex.: Semana de informática"
                className="w-full rounded-xl border border-slate-300 py-2.5 pr-4 pl-10 text-slate-900 focus-visible:border-emerald-500"
              />
            </div>
          </div>

          <fieldset>
            <legend className="text-sm font-medium text-slate-700">Categoria</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              <ChipRadio
                name="categoria-filtro"
                value="todas"
                label="Todas"
                checked={categoriaFiltro === 'todas'}
                onChange={setCategoriaFiltro}
              />
              {CATEGORIES.map((category) => (
                <ChipRadio
                  key={category.key}
                  name="categoria-filtro"
                  value={category.key}
                  label={category.label}
                  icon={category.icon}
                  checked={categoriaFiltro === category.key}
                  onChange={setCategoriaFiltro}
                />
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-slate-700">Status</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((option) => (
                <ChipRadio
                  key={option.value}
                  name="status-filtro"
                  value={option.value}
                  label={option.label}
                  checked={statusFiltro === option.value}
                  onChange={setStatusFiltro}
                />
              ))}
            </div>
          </fieldset>
        </div>
      )}

      <div className="mt-6">
        {!hasAnyCertificates ? (
          <EmptyState />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="Nenhum resultado encontrado"
            description="Tente ajustar sua busca ou os filtros selecionados."
            actionLabel="Limpar filtros"
            onAction={clearFilters}
          />
        ) : (
          <>
            <p className="mb-3 text-sm text-slate-500">
              {filtered.length} de {certificados.length} certificado{certificados.length === 1 ? '' : 's'}
              {hasFiltersApplied ? ' (filtrado)' : ''}
            </p>
            <ul className="flex flex-col gap-3">
              {filtered.map((cert) => (
                <CertificateListItem
                  key={cert.id}
                  certificate={cert}
                  onDeleteRequest={() => setPendingDelete(cert)}
                />
              ))}
            </ul>
          </>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Excluir certificado?"
        description={
          pendingDelete
            ? `Tem certeza de que deseja excluir "${pendingDelete.titulo}"? Essa ação não pode ser desfeita.`
            : ''
        }
        confirmLabel="Excluir"
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </main>
  )
}
