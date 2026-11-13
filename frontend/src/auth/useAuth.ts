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

/** True para o GESTOR, único papel que altera cadastros e referência, decide alertas e cancela ordens. */
export function useGestor() {
  return useAuth().hasRole('GESTOR')
}

/** Tela inicial de cada papel: o ADMIN só gerencia contas; GESTOR e ENGENHEIRO vão ao monitoramento. */
export const homeDoPapel = (papel: Papel) => (papel === 'ADMIN' ? '/usuarios' : '/painel')
