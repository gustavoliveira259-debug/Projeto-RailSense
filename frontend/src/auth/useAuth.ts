import { createContext, use } from 'react'
import type { Papel, UsuarioSessao } from '@/api/types'

export type AuthContextValue = {
  user: UsuarioSessao | null
  checking: boolean
  signIn: (user: UsuarioSessao) => void
  signOut: () => Promise<void>
  hasRole: (...papeis: Papel[]) => boolean
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const context = use(AuthContext)
  if (!context) throw new Error('useAuth precisa estar dentro de <AuthProvider>.')
  return context
}

/** Usuário autenticado garantido — use apenas em telas protegidas por RequireAuth. */
export function useUser(): UsuarioSessao {
  const { user } = useAuth()
  if (!user) throw new Error('useUser chamado fora de uma rota autenticada.')
  return user
}

/** Tela inicial de cada papel: o ADMIN só gerencia contas; o ENGENHEIRO opera o monitoramento. */
export const homeDoPapel = (papel: Papel) => (papel === 'ADMIN' ? '/usuarios' : '/painel')
