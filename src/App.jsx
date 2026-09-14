import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import CertificateForm from './pages/CertificateForm'
import Dashboard from './pages/Dashboard'
import History from './pages/History'
import Onboarding from './pages/Onboarding'
import { hasStudent } from './services/storageService'

function IndexRedirect() {
  return <Navigate to={hasStudent() ? '/dashboard' : '/onboarding'} replace />
}

function RequireStudent({ children }) {
  return hasStudent() ? children : <Navigate to="/onboarding" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<IndexRedirect />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route
        element={
          <RequireStudent>
            <AppLayout />
          </RequireStudent>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/registrar" element={<CertificateForm />} />
        <Route path="/registrar/:id" element={<CertificateForm />} />
        <Route path="/historico" element={<History />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
