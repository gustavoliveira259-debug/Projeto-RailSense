/**
 * Situações possíveis de um trem na tela de seleção.
 *
 * Estes valores são usados somente pela interface nesta primeira versão.
 * A situação definitiva deverá vir de uma API autenticada.
 */
export type TrainStatus = 'active' | 'attention' | 'offline'

/**
 * Modelo visual de um trem.
 *
 * Os dados de demonstração não representam uma composição real.
 */
export type Train = {
  id: string
  name: string
  description: string
  status: TrainStatus
  wagonCount: number
  lastUpdate: string
}
