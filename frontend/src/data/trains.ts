import type { Train } from '../types/train'

/**
 * Dados temporários usados para montar a interface.
 */
export const demoTrains: Train[] = [
  {
    id: 'train-1',
    name: 'Trem 1',
    description: 'Monitoramento da composição e dos rolamentos.',
    status: 'active',
    wagonCount: 48,
    lastUpdate: 'Atualizado há 2 minutos',
  },
  {
    id: 'train-2',
    name: 'Trem 2',
    description: 'Monitoramento da composição e dos rolamentos.',
    status: 'active',
    wagonCount: 52,
    lastUpdate: 'Atualizado há 5 minutos',
  },
]

