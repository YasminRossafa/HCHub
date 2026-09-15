import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import LoadingScreen from './components/LoadingScreen'
import { useAuth } from './contexts/AuthContext'
import CertificateForm from './pages/CertificateForm'
import Dashboard from './pages/Dashboard'
import History from './pages/History'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import ProfessorPanel from './pages/ProfessorPanel'
import Report from './pages/Report'
import Settings from './pages/Settings'
import Signup from './pages/Signup'

/** Login/Signup: bounce a signed-in user back into the app rather than showing the auth form again. */
function RedirectIfAuthed({ children }) {
  const { user, authLoading } = useAuth()
  if (authLoading) return <LoadingScreen />
  if (user) return <Navigate to="/" replace />
  return children
}

/** Onboarding: requires a session, but bounces a student who already has a profile straight to the dashboard. */
function RequireOnboarding({ children }) {
  const { user, authLoading, studentProfile, profileLoading } = useAuth()
  if (authLoading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (profileLoading) return <LoadingScreen />
  if (studentProfile) return <Navigate to="/dashboard" replace />
  return children
}

/** Dashboard/Registration/History/Report/"/": requires both a session and a completed Firestore student profile. */
function RequireStudent({ children }) {
  const { user, authLoading, studentProfile, profileLoading } = useAuth()
  if (authLoading || profileLoading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (!studentProfile) return <Navigate to="/onboarding" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <RequireStudent>
            <Navigate to="/dashboard" replace />
          </RequireStudent>
        }
      />
      <Route
        path="/login"
        element={
          <RedirectIfAuthed>
            <Login />
          </RedirectIfAuthed>
        }
      />
      <Route
        path="/cadastro"
        element={
          <RedirectIfAuthed>
            <Signup />
          </RedirectIfAuthed>
        }
      />
      <Route
        path="/onboarding"
        element={
          <RequireOnboarding>
            <Onboarding />
          </RequireOnboarding>
        }
      />
      {/* Public, unauthenticated: the share token in the URL is the whole credential (see ProfessorPanel). */}
      <Route path="/professor/:token" element={<ProfessorPanel />} />
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
        <Route path="/relatorio" element={<Report />} />
        <Route path="/configuracoes" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
