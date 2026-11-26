import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { NivelAlerta } from '@/api/types'
import { formatInteger } from '@/lib/format'
import { NIVEL } from '@/lib/labels'

/** Ordem fixa por gravidade; cores validadas para daltonismo (--chart-1..3). */
const FATIAS: { key: NivelAlerta; color: string }[] = [
  { key: 'BAIXO', color: 'var(--chart-1)' },
  { key: 'MEDIO', color: 'var(--chart-2)' },
  { key: 'CRITICO', color: 'var(--chart-3)' },
]

function DonutTooltip({ active, payload }: { active?: boolean; payload?: { payload: { key: NivelAlerta; value: number } }[] }) {
  const item = payload?.[0]?.payload
  if (!active || !item) return null
  return (
    <div className="rounded-lg border bg-popover/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      <span className="font-medium">{NIVEL[item.key].label}</span>: <span className="tabular">{item.value}</span>
    </div>
  )
}

/** Distribuição dos alertas por nível — parte de um todo com três fatias, rotuladas com %. */
export function SeverityDonut({ porNivel }: { porNivel: Record<NivelAlerta, number> }) {
  const dados = FATIAS.map((fatia) => ({ ...fatia, value: porNivel[fatia.key] }))
  const total = dados.reduce((soma, d) => soma + d.value, 0)

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <div className="relative size-40 shrink-0" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={total ? dados : [{ key: 'BAIXO', value: 1, color: 'var(--muted)' }]}
              dataKey="value"
              innerRadius="72%"
              outerRadius="100%"
              paddingAngle={total ? 3 : 0}
              cornerRadius={4}
              stroke="var(--chart-surface)"
              strokeWidth={2}
              startAngle={90}
              endAngle={-270}
              isAnimationActive={false}
            >
              {(total ? dados : [{ color: 'var(--muted)' }]).map((fatia, index) => (
                <Cell key={index} fill={fatia.color} />
              ))}
            </Pie>
            {total > 0 && <Tooltip content={<DonutTooltip />} />}
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="tabular text-2xl font-semibold">{formatInteger(total)}</span>
          <span className="text-[11px] text-muted-foreground">alertas</span>
        </div>
      </div>

      <ul className="w-full space-y-2.5 text-sm">
        {dados.map((fatia) => (
          <li key={fatia.key} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className="size-2.5 rounded-full" style={{ background: fatia.color }} aria-hidden="true" />
              {NIVEL[fatia.key].label}
            </span>
            <span className="tabular">
              <span className="font-medium">{fatia.value}</span>
              <span className="ml-2 inline-block w-10 text-right text-muted-foreground">
                {total ? Math.round((fatia.value / total) * 100) : 0}%
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
