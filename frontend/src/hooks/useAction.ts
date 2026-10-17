import { useCallback, useEffect, useRef, useState } from 'react'
import { mensagemDeErro } from '../api/http'

/**
 * Executa uma ação (POST/PATCH) controlando "em andamento" e a mensagem de erro.
 * `executar` nunca lança: em caso de erro devolve undefined e preenche `erro`.
 */
export function useAction<A extends unknown[], R>(acao: (...args: A) => Promise<R>) {
  const [pendente, setPendente] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const acaoRef = useRef(acao)

  useEffect(() => {
    acaoRef.current = acao
  })

  const executar = useCallback(async (...args: A): Promise<R | undefined> => {
    setPendente(true)
    setErro(null)
    try {
      return await acaoRef.current(...args)
    } catch (e) {
      setErro(mensagemDeErro(e))
      return undefined
    } finally {
      setPendente(false)
    }
  }, [])

  const limparErro = useCallback(() => setErro(null), [])

  return { executar, pendente, erro, limparErro }
}
