import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { auth } from '@/api/client'
import type { UsuarioSessao } from '@/api/types'
import { ApiError } from '@/services/http'
import { AuthContext, type AuthContextValue } from './useAuth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UsuarioSessao | null>(null)
  const [checking, setChecking] = useState(true)
  const queryClient = useQueryClient()

  // Restaura a sessão a partir do cookie HttpOnly ao abrir/recarregar a página.
  useEffect(() => {
    auth
      .me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setChecking(false))
  }, [])

  // Sessão expirada ou conta desativada pelo ADMIN: o backend passa a responder 401
  // (ver SessaoAtualizadaFilter). Volta para o login em vez de mostrar erros soltos.
  useEffect(() => {
    const expirou = (error: unknown) => error instanceof ApiError && error.status === 401
    const sair = () => {
      queryClient.clear()
      setUser((atual) => {
        if (atual) toast.warning('Sua sessão expirou. Entre novamente.')
        return null
      })
    }
    const unsubQueries = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'updated' && event.action.type === 'error' && expirou(event.action.error)) sair()
    })
    const unsubMutations = queryClient.getMutationCache().subscribe((event) => {
      if (event.type === 'updated' && event.action.type === 'error' && expirou(event.action.error)) sair()
    })
    return () => {
      unsubQueries()
      unsubMutations()
    }
  }, [queryClient])

  const signOut = useCallback(async () => {
    // Falha de rede no logout não deve prender o usuário numa tela autenticada.
    await auth.logout().catch(() => undefined)
    // Remove dados em cache para que o próximo usuário não veja o que o anterior viu.
    queryClient.clear()
    setUser(null)
  }, [queryClient])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      checking,
      signIn: setUser,
      signOut,
      hasRole: (...papeis) => !!user && papeis.includes(user.papel),
    }),
    [user, checking, signOut],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
