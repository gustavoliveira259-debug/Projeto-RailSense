import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth } from './auth/RequireAuth'
import { inicioDoPerfil, useAuth } from './auth/useAuth'
import { AppShell } from './components/AppShell'
import { Carregando } from './components/ui'
import Alertas from './pages/Alertas'
import Conta from './pages/Conta'
import Login from './pages/Login'
import RolamentoDetalhe from './pages/RolamentoDetalhe'
import TremDetalhe from './pages/TremDetalhe'
import Trens from './pages/Trens'
import VagaoDetalhe from './pages/VagaoDetalhe'
import Estrutura from './pages/ti/Estrutura'
import Usuarios from './pages/ti/Usuarios'

/** "/" e rotas desconhecidas: TI vai para usuários, os demais para trens. */
function Inicio() {
  const { usuario, verificando } = useAuth()
  if (verificando) return <Carregando telaCheia />
  return <Navigate to={usuario ? inicioDoPerfil(usuario.papel) : '/login'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route path="/trens" element={<Trens />} />
        <Route path="/trens/:id" element={<TremDetalhe />} />
        <Route path="/vagoes/:id" element={<VagaoDetalhe />} />
        <Route path="/rolamentos/:id" element={<RolamentoDetalhe />} />
        <Route path="/alertas" element={<Alertas />} />
        <Route path="/conta" element={<Conta />} />
        <Route
          path="/ti/usuarios"
          element={
            <RequireAuth papeis={['ADMIN']}>
              <Usuarios />
            </RequireAuth>
          }
        />
        <Route
          path="/ti/estrutura"
          element={
            <RequireAuth papeis={['ADMIN']}>
              <Estrutura />
            </RequireAuth>
          }
        />
      </Route>
      <Route path="*" element={<Inicio />} />
    </Routes>
  )
}
