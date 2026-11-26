import { useEffect, useState } from 'react'

/** Segundos desde `instante` (ms), atualizado a cada segundo: "há 4 s". null se ainda não houve instante. */
export function useSegundosDesde(instante: number | null | undefined) {
  const [agora, setAgora] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setAgora(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  return instante ? Math.max(0, Math.round((agora - instante) / 1000)) : null
}
