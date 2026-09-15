import { useState } from 'react'
import Dashboard from './pages/Dashboard'
import TrainDetails from './pages/TrainDetails'
import type { Train } from './types/train'

/**
 * Telas disponíveis no fluxo atual do protótipo.
 *
 * O roteamento real poderá ser substituído por React Router ou por uma
 * camada de autorização quando o backend de autenticação estiver pronto.
 */
type AppScreen = 'trains' | 'train-details'

function App() {
  const [screen, setScreen] = useState<AppScreen>('trains')
  const [selectedTrain, setSelectedTrain] = useState<Train | null>(null)

  function handleTrainSelection(train: Train) {
    setSelectedTrain(train)
    setScreen('train-details')
  }

  function handleBackToTrains() {
    setSelectedTrain(null)
    setScreen('trains')
  }

  if (screen === 'train-details' && selectedTrain) {
    return <TrainDetails train={selectedTrain} onBack={handleBackToTrains} />
  }

  return <Dashboard onSelectTrain={handleTrainSelection} />
}

export default App
