import Dashboard from './pages/Dashboard'

/**
 * Componente raiz da aplicação.
 *
 * Nesta etapa, o Dashboard é exibido diretamente para facilitar a construção
 * visual da segunda tela. A autenticação real deverá decidir esta tela depois,
 * usando a sessão criada pelo backend, e não uma condição controlada pelo
 * usuário no navegador.
 */
function App() {
  return <Dashboard />
}

export default App