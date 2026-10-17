import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './auth/AuthProvider.tsx'

// Obtém o elemento root criado pelo Vite no arquivo index.html.
const rootElement = document.getElementById('root')

// Interrompe a inicialização com uma mensagem clara se o HTML estiver incompleto.
if (!rootElement) {
  throw new Error('Elemento #root não foi encontrado no index.html.')
}

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
