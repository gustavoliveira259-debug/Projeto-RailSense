import type { PainelResumo } from '@/api/types'

export type AlertasDoDia = { dia: string; BAIXO: number; MEDIO: number; CRITICO: number }

/**
 * Converte os dias do resumo ("AAAA-MM-DD", já no fuso do navegador) para o formato dos gráficos.
 * O dia vira meia-noite local: new Date("AAAA-MM-DD") seria meia-noite UTC e mostraria o dia anterior no Brasil.
 */
export function alertasDoResumo(dias: PainelResumo['alertasPorDia']): AlertasDoDia[] {
  return dias.map(({ dia, baixo, medio, critico }) => {
    const [ano, mes, diaDoMes] = dia.split('-').map(Number)
    return { dia: new Date(ano, mes - 1, diaDoMes).toISOString(), BAIXO: baixo, MEDIO: medio, CRITICO: critico }
  })
}
