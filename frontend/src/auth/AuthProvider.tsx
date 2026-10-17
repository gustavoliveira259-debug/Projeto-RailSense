import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authApi } from '../api/endpoints'
import { definirAoExpirarSessao } from '../api/http'
import type { UsuarioSessao } from '../api/types'
import { AuthContext, type AuthValue } from './AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioSessao | null>(null)
  const [verificando, setVerificando] = useState(true)

  useEffect(() => {
    // Qualquer 401 da API (sessão expirada, conta desativada) volta para o login.
    definirAoExpirarSessao(() => setUsuario(null))
    authApi
      .me()
      .then(setUsuario)
      .catch(() => setUsuario(null))
      .finally(() => setVerificando(false))
    return () => definirAoExpirarSessao(null)
  }, [])

  const entrar = useCallback(async (email: string, senha: string) => {
    const logado = await authApi.login(email, senha)
    setUsuario(logado)
    return logado
  }, [])

  const sair = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // Sessão já expirada ou sem rede: o estado local é limpo mesmo assim.
    }
    setUsuario(null)
  }, [])

  const valor = useMemo<AuthValue>(
    () => ({ usuario, verificando, entrar, sair }),
    [usuario, verificando, entrar, sair],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}
