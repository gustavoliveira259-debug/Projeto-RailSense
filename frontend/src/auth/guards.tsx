import { Navigate, Outlet, useLocation } from 'react-router-dom'
import type { Papel } from '@/api/types'
import { homeDoPapel, useAuth } from './useAuth'

/** Bloqueia rotas para quem não tem sessão, lembrando a página pedida. */
export function RequireAuth() {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  return <Outlet />
}

/**
 * Restringe a rota a determinados papéis e manda os demais para a própria tela inicial.
 * É só conveniência de interface: quem garante o acesso é o SecurityConfig do backend.
 */
export function RequireRole({ roles }: { roles: Papel[] }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (!roles.includes(user.papel)) return <Navigate to={homeDoPapel(user.papel)} replace />
  return <Outlet />
}
