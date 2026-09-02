import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Obtém o elemento root criado pelo Vite no arquivo index.html.
const rootElement = document.getElementById('root')

// Interrompe a inicialização com uma mensagem clara se o HTML estiver
// incompleto. Isso evita um erro silencioso durante o desenvolvimento.
if (!rootElement) {
  throw new Error('Elemento #root não foi encontrado no index.html.')
}

// StrictMode ajuda a identificar problemas comuns durante o desenvolvimento.
// Ele não substitui as validações e proteções que serão implementadas no backend.
createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

