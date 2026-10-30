import type { Alerta } from '@/api/types'

export type AlertasDoDia = { dia: string; BAIXO: number; MEDIO: number; CRITICO: number }

/** Agrupa alertas por dia local nos últimos `dias` dias (inclui dias sem alerta). */
export function agruparPorDia(alertas: Alerta[], dias = 14): AlertasDoDia[] {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const linhas = Array.from({ length: dias }, (_, index) => {
    const dia = new Date(hoje)
    dia.setDate(hoje.getDate() - (dias - 1 - index))
    return { dia: dia.toISOString(), BAIXO: 0, MEDIO: 0, CRITICO: 0 }
  })
  const porDia = new Map(linhas.map((linha) => [linha.dia, linha]))
  for (const alerta of alertas) {
    const dia = new Date(alerta.criadoEm)
    dia.setHours(0, 0, 0, 0)
    const linha = porDia.get(dia.toISOString())
    if (linha) linha[alerta.nivel]++
  }
  return linhas
}

