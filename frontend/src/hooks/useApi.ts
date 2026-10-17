import { useCallback, useEffect, useRef, useState } from 'react'

/** `em`: instante (ms) da última resposta bem-sucedida; serve de "agora" estável para a tela. */
type Estado<T> = { chave: string | null; dados?: T; erro?: Error; em?: number }

/**
 * Busca dados e, se `intervaloMs` for informado, refaz a busca periodicamente.
 *
 * `chave` identifica a consulta: quando muda (ex.: outro id na URL), os dados antigos
 * somem e a busca recomeça. `null` não busca nada. Atualizações periódicas e `recarregar`
 * mantêm os dados atuais na tela até a resposta nova chegar. Com a aba oculta, a
 * atualização periódica espera a aba voltar.
 */
export function useApi<T>(chave: string | null, carregar: () => Promise<T>, intervaloMs?: number) {
  const [estado, setEstado] = useState<Estado<T>>({ chave: null })
  const [versao, setVersao] = useState(0)
  const carregarRef = useRef(carregar)

  useEffect(() => {
    carregarRef.current = carregar
  })

  useEffect(() => {
    if (chave === null) return
    let cancelado = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const agendar = () => {
      if (!cancelado && intervaloMs) timer = setTimeout(executar, intervaloMs)
    }
    function executar() {
      if (document.hidden && intervaloMs) {
        agendar()
        return
      }
      carregarRef.current().then(
        (dados) => {
          if (!cancelado) setEstado({ chave, dados, em: Date.now() })
        },
        (erro: unknown) => {
          if (cancelado) return
          const e = erro instanceof Error ? erro : new Error(String(erro))
          setEstado((anterior) =>
            anterior.chave === chave ? { ...anterior, erro: e } : { chave, erro: e },
          )
        },
      ).finally(agendar)
    }

    executar()
    return () => {
      cancelado = true
      clearTimeout(timer)
    }
  }, [chave, intervaloMs, versao])

  const recarregar = useCallback(() => setVersao((v) => v + 1), [])
  const atual = chave !== null && estado.chave === chave

  return {
    dados: atual ? estado.dados : undefined,
    erro: atual ? estado.erro : undefined,
    atualizadoEm: atual ? estado.em : undefined,
    carregando: chave !== null && !atual,
    recarregar,
  }
}
