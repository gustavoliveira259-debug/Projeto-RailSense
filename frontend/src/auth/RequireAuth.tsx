import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import type { Papel } from '../api/types'
import { Carregando } from '../components/ui'
import { inicioDoPerfil, useAuth } from './useAuth'

type Props = {
  children: ReactNode
  /** Perfis aceitos; ausente = qualquer usuário logado. */
  papeis?: Papel[]
}

/**
 * Bloqueio de rotas no navegador. É só conforto de navegação:
 * a proteção de verdade é feita pelo backend em cada endpoint.
 */
export function RequireAuth({ children, papeis }: Props) {
  const { usuario, verificando } = useAuth()
  const location = useLocation()

  if (verificando) return <Carregando texto="Verificando sessão..." telaCheia />
  if (!usuario) return <Navigate to="/login" replace state={{ de: location.pathname + location.search }} />
  if (papeis && !papeis.includes(usuario.papel)) return <Navigate to={inicioDoPerfil(usuario.papel)} replace />
  return children
}
