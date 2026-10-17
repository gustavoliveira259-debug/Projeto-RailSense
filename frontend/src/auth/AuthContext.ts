import { createContext } from 'react'
import type { UsuarioSessao } from '../api/types'

export type AuthValue = {
  usuario: UsuarioSessao | null
  /** true enquanto a sessão existente ainda está sendo verificada no carregamento. */
  verificando: boolean
  entrar: (email: string, senha: string) => Promise<UsuarioSessao>
  sair: () => Promise<void>
}

export const AuthContext = createContext<AuthValue | null>(null)
