import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import TrainDetails from './pages/TrainDetails'
import { demoTrains } from './data/trains'
import { getCurrentUser, logout, type AuthenticatedUser } from './services/auth'

type AuthScreensProps = {
  user: AuthenticatedUser | null
  onAuthenticated: (user: AuthenticatedUser) => void
}

/** Tela de login: redireciona para o dashboard se já houver sessão ativa. */
function LoginRoute({ user, onAuthenticated }: AuthScreensProps) {
  const navigate = useNavigate()
  if (user) return <Navigate to="/dashboard" replace />
  return <Login onAuthenticated={onAuthenticated} onRegister={() => navigate('/register')} />
}

/** Tela de registro: redireciona para o dashboard se já houver sessão ativa. */
function RegisterRoute({ user, onAuthenticated }: AuthScreensProps) {
  const navigate = useNavigate()
  if (user) return <Navigate to="/dashboard" replace />
  return <Register onAuthenticated={onAuthenticated} onBackToLogin={() => navigate('/login')} />
}

/** Busca o trem pelo id da URL e entrega para a tela de detalhes. */
function TrainDetailsRoute() {
  const { trainId } = useParams<{ trainId: string }>()
  const navigate = useNavigate()
  const train = demoTrains.find((candidate) => candidate.id === trainId)

  if (!train) {
    return <Navigate to="/dashboard" replace />
  }

  return <TrainDetails train={train} onBack={() => navigate('/dashboard')} />
}

function App() {
  const [user, setUser] = useState<AuthenticatedUser | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setCheckingSession(false))
  }, [])

  /**
   * Encerra a sessão do usuário.
   *
   * O estado local é limpo mesmo que a chamada ao backend falhe, garantindo
   * que a interface sempre volte para a tela de login.
   */
  async function handleLogout() {
    await logout()
    setUser(null)
    navigate('/login', { replace: true })
  }

  if (checkingSession) {
    return null
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginRoute user={user} onAuthenticated={setUser} />} />
      <Route path="/register" element={<RegisterRoute user={user} onAuthenticated={setUser} />} />
      <Route
        path="/dashboard"
        element={user ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/trains/:trainId"
        element={user ? <TrainDetailsRoute /> : <Navigate to="/login" replace />}
      />
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
  )
}

export default App