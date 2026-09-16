import { useEffect, useState } from 'react'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import TrainDetails from './pages/TrainDetails'
import type { Train } from './types/train'
import { getCurrentUser, type AuthenticatedUser } from './services/auth'

/**
 * Telas disponíveis no fluxo atual do protótipo.
 *
 * O roteamento real poderá ser substituído por React Router ou por uma
 * camada de autorização quando o backend de autenticação estiver pronto.
 */
type AppScreen = 'trains' | 'train-details'
type UnauthenticatedScreen = 'login' | 'register'

function App() {
  const [user, setUser] = useState<AuthenticatedUser | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [unauthenticatedScreen, setUnauthenticatedScreen] = useState<UnauthenticatedScreen>('login')
  const [screen, setScreen] = useState<AppScreen>('trains')
  const [selectedTrain, setSelectedTrain] = useState<Train | null>(null)

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setCheckingSession(false))
  }, [])

  function handleTrainSelection(train: Train) {
    setSelectedTrain(train)
    setScreen('train-details')
  }

  function handleBackToTrains() {
    setSelectedTrain(null)
    setScreen('trains')
  }

  if (checkingSession) {
    return null
  }

  if (!user) {
    return unauthenticatedScreen === 'register'
      ? <Register onAuthenticated={setUser} onBackToLogin={() => setUnauthenticatedScreen('login')} />
      : <Login onAuthenticated={setUser} onRegister={() => setUnauthenticatedScreen('register')} />
  }

  if (screen === 'train-details' && selectedTrain) {
    return <TrainDetails train={selectedTrain} onBack={handleBackToTrains} />
  }

  return <Dashboard onSelectTrain={handleTrainSelection} />
}

export default App
