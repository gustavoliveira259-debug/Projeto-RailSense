import type { TrainStatus } from './train'

/**
 * Resumo operacional exibido depois que um trem é selecionado.
 *
 * Estes dados são demonstrativos e deverão ser substituídos por uma resposta
 * autenticada do backend quando a integração estiver pronta.
 */
export type TrainDetails = {
  trainId: string
  trainName: string
  route: string
  status: TrainStatus
  wagonCount: number
  monitoredBearings: number
  activeAlerts: number
  criticalAlerts: number
  lastUpdate: string
  lastImageAt: string
}

/** Retorna os dados demonstrativos de cada trem disponível. */
export const demoTrainDetails: Record<string, TrainDetails> = {
  'train-1': {
    trainId: 'train-1',
    trainName: 'Trem 1',
    route: 'Pátio A → Terminal de Descarga',
    status: 'active',
    wagonCount: 48,
    monitoredBearings: 384,
    activeAlerts: 8,
    criticalAlerts: 2,
    lastUpdate: 'Hoje, 14:35',
    lastImageAt: 'Hoje, 14:32',
  },
  'train-2': {
    trainId: 'train-2',
    trainName: 'Trem 2',
    route: 'Pátio B → Terminal de Descarga',
    status: 'active',
    wagonCount: 52,
    monitoredBearings: 416,
    activeAlerts: 4,
    criticalAlerts: 0,
    lastUpdate: 'Hoje, 14:31',
    lastImageAt: 'Hoje, 14:28',
  },
}

