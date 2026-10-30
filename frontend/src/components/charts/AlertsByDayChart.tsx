import { useId } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { NivelAlerta } from '@/api/types'
import type { AlertasDoDia } from '@/lib/alertasPorDia'
import { formatDay } from '@/lib/format'
import { NIVEL } from '@/lib/labels'

const NIVEIS: { key: NivelAlerta; color: string }[] = [
  { key: 'CRITICO', color: 'var(--chart-3)' },
  { key: 'MEDIO', color: 'var(--chart-2)' },
  { key: 'BAIXO', color: 'var(--chart-1)' },
]

type Ponto = AlertasDoDia & { total: number }

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: Ponto }[] }) {
  const ponto = payload?.[0]?.payload
  if (!active || !ponto) return null
  return (
    <div className="min-w-44 rounded-xl border bg-popover/95 px-3 py-2.5 text-xs text-popover-foreground shadow-xl backdrop-blur">
      <p className="mb-1 text-muted-foreground">{formatDay(ponto.dia)}</p>
      <p className="tabular mb-2 text-lg font-semibold">
        {ponto.total} {ponto.total === 1 ? 'alerta' : 'alertas'}
      </p>
      {NIVEIS.map((nivel) => (
        <div key={nivel.key} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-2 text-muted-foreground">
            <span className="size-2 rounded-full" style={{ background: nivel.color }} aria-hidden="true" />
            {NIVEL[nivel.key].label}
          </span>
          <span className="tabular font-medium">{ponto[nivel.key]}</span>
        </div>
      ))}
    </div>
  )
}

/** Total de alertas por dia; o detalhamento por nível aparece ao passar o mouse. */
export function AlertsByDayChart({ data }: { data: AlertasDoDia[] }) {
  const id = useId().replace(/:/g, '')
  const pontos: Ponto[] = data.map((d) => ({ ...d, total: d.BAIXO + d.MEDIO + d.CRITICO }))

  return (
    <>
      <div className="h-80 w-full xl:h-[23rem]" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={pontos} margin={{ top: 12, right: 8, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id={`area-${id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--glow)" stopOpacity={0.32} />
                <stop offset="100%" stopColor="var(--glow)" stopOpacity={0} />
              </linearGradient>
              <filter id={`glow-${id}`} x="-10%" y="-40%" width="120%" height="180%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
            <XAxis
              dataKey="dia"
              tickFormatter={formatDay}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              interval="preserveStartEnd"
              minTickGap={16}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ stroke: 'var(--muted-foreground)', strokeOpacity: 0.4, strokeDasharray: '3 3' }}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="var(--glow)"
              strokeWidth={2.5}
              fill={`url(#area-${id})`}
              filter={`url(#glow-${id})`}
              dot={{ r: 3.5, fill: 'var(--chart-surface)', stroke: 'var(--glow)', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: 'var(--glow)', stroke: 'var(--chart-surface)', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Mesma informação em tabela para leitores de tela. */}
      <table className="sr-only">
        <caption>Alertas por dia e nível</caption>
        <thead>
          <tr>
            <th>Dia</th>
            <th>Total</th>
            {NIVEIS.map((nivel) => (
              <th key={nivel.key}>{NIVEL[nivel.key].label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pontos.map((ponto) => (
            <tr key={ponto.dia}>
              <td>{formatDay(ponto.dia)}</td>
              <td>{ponto.total}</td>
              {NIVEIS.map((nivel) => (
                <td key={nivel.key}>{ponto[nivel.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
