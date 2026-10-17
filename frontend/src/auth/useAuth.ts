import { useContext } from 'react'
import type { Papel } from '../api/types'
import { AuthContext } from './AuthContext'

export function useAuth() {
  const valor = useContext(AuthContext)
  if (!valor) throw new Error('useAuth precisa estar dentro de <AuthProvider>.')
  return valor
}

/** Página inicial de cada perfil: a TI cai na gestão de usuários; os demais, nos trens. */
export function inicioDoPerfil(papel: Papel): string {
  return papel === 'ADMIN' ? '/ti/usuarios' : '/trens'
}

/** Engenheiro e gerente agem sobre o monitoramento (fotos, baseline, alertas). */
export function podeOperar(papel: Papel | undefined): boolean {
  return papel === 'ENGENHEIRO' || papel === 'GERENTE'
}
