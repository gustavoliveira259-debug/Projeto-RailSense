import { useParams } from 'react-router-dom'

/** Lê o parâmetro `:id` da rota. Devolve null se não for um inteiro positivo. */
export function useIdParam(): number | null {
  const { id } = useParams<{ id: string }>()
  if (!id || !/^\d{1,15}$/.test(id)) return null
  const numero = Number(id)
  return numero > 0 ? numero : null
}
