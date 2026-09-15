import type { TrainStatus } from './train'

export type WagonDetail = {
  id: string
  status: TrainStatus
  monitoredBearings: number
  activeAlerts: number
  criticalAlerts: number
  bearingId: string
  temperature: string
  vibration: string
  lastImageAt?: string
  /** URL da última imagem enviada pela câmera do rolamento. */
  lastImageUrl?: string
}

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
  wagons: WagonDetail[]
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
    wagons: [
      { id: 'VAG-0001', status: 'active', monitoredBearings: 8, activeAlerts: 0, criticalAlerts: 0, bearingId: 'ROL-01-D', temperature: '42 °C', vibration: '2,1 mm/s', lastImageAt: 'Hoje, 14:32' },
      { id: 'VAG-0002', status: 'attention', monitoredBearings: 8, activeAlerts: 1, criticalAlerts: 0, bearingId: 'ROL-02-E', temperature: '68 °C', vibration: '5,8 mm/s', lastImageAt: 'Hoje, 14:30' },
      { id: 'VAG-0003', status: 'active', monitoredBearings: 8, activeAlerts: 0, criticalAlerts: 0, bearingId: 'ROL-03-D', temperature: '44 °C', vibration: '2,4 mm/s', lastImageAt: 'Hoje, 14:31' },
    ],
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
    wagons: [
      { id: 'VAG-0001', status: 'active', monitoredBearings: 8, activeAlerts: 0, criticalAlerts: 0, bearingId: 'ROL-01-D', temperature: '41 °C', vibration: '1,9 mm/s', lastImageAt: 'Hoje, 14:28' },
      { id: 'VAG-0002', status: 'offline', monitoredBearings: 8, activeAlerts: 1, criticalAlerts: 1, bearingId: 'ROL-02-E', temperature: 'Sem leitura', vibration: 'Sem leitura' },
      { id: 'VAG-0003', status: 'active', monitoredBearings: 8, activeAlerts: 0, criticalAlerts: 0, bearingId: 'ROL-03-D', temperature: '43 °C', vibration: '2,2 mm/s', lastImageAt: 'Hoje, 14:27' },
    ],
  },
}
