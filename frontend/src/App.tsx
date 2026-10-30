import { lazy, Suspense } from 'react'
import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { Loader2, MapPinOff } from 'lucide-react'
import { homeDoPapel, useAuth } from '@/auth/useAuth'
import { RequireAuth, RequireRole } from '@/auth/guards'
import { EmptyState } from '@/components/EmptyState'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import Login from '@/pages/Login'

// Telas carregadas sob demanda: o login abre rápido e cada perfil baixa só o que usa.
const Painel = lazy(() => import('@/pages/Painel'))
const Alertas = lazy(() => import('@/pages/Alertas'))
const AlertaDetalhe = lazy(() => import('@/pages/AlertaDetalhe'))
const Ordens = lazy(() => import('@/pages/Ordens'))
const Frota = lazy(() => import('@/pages/frota/Frota'))
const VagaoDetalhe = lazy(() => import('@/pages/frota/VagaoDetalhe'))
const EixoDetalhe = lazy(() => import('@/pages/frota/EixoDetalhe'))
const Cadastros = lazy(() => import('@/pages/Cadastros'))
const Usuarios = lazy(() => import('@/pages/Usuarios'))
const Conta = lazy(() => import('@/pages/Conta'))

function Carregando() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground" role="status">
      <Loader2 className="size-5 animate-spin" aria-hidden="true" />
      <span className="sr-only">Carregando…</span>
    </div>
  )
}

function NaoEncontrada() {
  const { user } = useAuth()
  return (
    <EmptyState
      icon={MapPinOff}
      title="Página não encontrada"
      description="O endereço pode estar errado ou o registro não existe mais."
      action={
        <Button asChild>
          <Link to={user ? homeDoPapel(user.papel) : '/login'}>Voltar ao início</Link>
        </Button>
      }
    />
  )
}

function Inicio() {
  const { user } = useAuth()
  return <Navigate to={user ? homeDoPapel(user.papel) : '/login'} replace />
}

export default function App() {
  const { checking } = useAuth()

  // Evita piscar a tela de login enquanto a sessão (cookie) é verificada.
  if (checking) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Carregando />
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<RequireAuth />}>
        <Route
          element={<AppShell />}
        >
          <Route
            element={
              <Suspense fallback={<Carregando />}>
                <RequireRole roles={['ENGENHEIRO']} />
              </Suspense>
            }
          >
            <Route path="/painel" element={<Painel />} />
            <Route path="/alertas" element={<Alertas />} />
            <Route path="/alertas/:id" element={<AlertaDetalhe />} />
            <Route path="/ordens" element={<Ordens />} />
            <Route path="/frota" element={<Frota />} />
            <Route path="/frota/vagoes/:id" element={<VagaoDetalhe />} />
            <Route path="/frota/eixos/:id" element={<EixoDetalhe />} />
            <Route path="/cadastros" element={<Cadastros />} />
          </Route>

          <Route
            element={
              <Suspense fallback={<Carregando />}>
                <RequireRole roles={['ADMIN']} />
              </Suspense>
            }
          >
            <Route path="/usuarios" element={<Usuarios />} />
          </Route>

          <Route
            path="/conta"
            element={
              <Suspense fallback={<Carregando />}>
                <Conta />
              </Suspense>
            }
          />
          <Route path="*" element={<NaoEncontrada />} />
        </Route>
      </Route>

      <Route path="/" element={<Inicio />} />
    </Routes>
  )
}
