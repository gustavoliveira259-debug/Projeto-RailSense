import { useId } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Radio, ScanSearch } from 'lucide-react'
import { eixos } from '@/api/client'
import type { Analise, Classificacao } from '@/api/types'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/QueryStates'
import { StatusBadge } from '@/components/StatusBadge'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateTime, formatScore } from '@/lib/format'
import { CLASSIFICACAO } from '@/lib/labels'
import { useSegundosDesde } from '@/lib/useSegundosDesde'

/** Intervalo de atualização: cada captura nova do eixo vira um ponto no gráfico. */
const ATUALIZAR_A_CADA = 10_000
/** Últimas análises exibidas. */
const JANELA = 40
/** app.alertas.limiar-nivel-alto do backend: a partir daqui o nível do alerta sobe um degrau. */
const LIMIAR_NIVEL_ALTO = 0.6

const COR_CLASSIFICACAO: Record<Classificacao, string> = {
  NORMAL: 'var(--success)',
  SUSPEITO: 'var(--warning)',
  VAZAMENTO: 'var(--critical)',
}

type Ponto = { t: number; score: number; analise: Analise }

const hora = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

function PontoClassificado(props: { cx?: number; cy?: number; payload?: Ponto; destaque?: boolean }) {
  const { cx, cy, payload, destaque } = props
  if (cx === undefined || cy === undefined || !payload) return null
  return (
    <circle
      cx={cx}
      cy={cy}
      r={destaque ? 6 : 4}
      fill={COR_CLASSIFICACAO[payload.analise.classificacao]}
      stroke="var(--chart-surface)"
      strokeWidth={2}
    />
  )
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: Ponto }[] }) {
  const ponto = payload?.[0]?.payload
  if (!active || !ponto) return null
  return (
    <div className="min-w-48 space-y-1.5 rounded-xl border bg-popover/95 px-3 py-2.5 text-xs shadow-xl backdrop-blur">
      <p className="text-muted-foreground">{formatDateTime(ponto.analise.criadoEm)}</p>
      <div className="flex items-center justify-between gap-3">
        <span className="tabular text-lg font-semibold">{formatScore(ponto.score)}</span>
        <StatusBadge spec={CLASSIFICACAO[ponto.analise.classificacao]} />
      </div>
      {ponto.analise.regioesAnomalia.length > 0 && (
        <p className="max-w-60 text-muted-foreground">{ponto.analise.regioesAnomalia[0]}</p>
      )}
    </div>
  )
}

type BearingLiveChartProps = {
  eixoId: number
  eixoIdentificador: string
  /** Momento do alerta aberto, marcado no gráfico. */
  alertaEm?: string
}

/**
 * Score de diferença de cada captura do rolamento ao longo do tempo, atualizado
 * automaticamente. Fonte: GET /api/eixos/{id}/analises (comparações com a referência).
 */
export function BearingLiveChart({ eixoId, eixoIdentificador, alertaEm }: BearingLiveChartProps) {
  const filtroId = useId().replace(/:/g, '')
  const query = useQuery({
    queryKey: ['eixo', eixoId, 'analises', 'ao-vivo'],
    queryFn: () => eixos.analises(eixoId, { size: JANELA }),
    refetchInterval: ATUALIZAR_A_CADA,
  })
  const segundos = useSegundosDesde(query.dataUpdatedAt)

  const pontos: Ponto[] = (query.data?.content ?? [])
    .filter((a) => a.scoreDiferenca !== null)
    .map((analise) => ({ t: new Date(analise.criadoEm).getTime(), score: analise.scoreDiferenca!, analise }))
    .sort((a, b) => a.t - b.t)
  const ultima = pontos.at(-1)
  const momentoAlerta = alertaEm ? new Date(alertaEm).getTime() : undefined
  // A análise que gerou o alerta é gravada na mesma transação, segundos antes dele.
  // Se ela já saiu da janela exibida, não marca nada em vez de apontar o ponto errado.
  const pontoDoAlerta = momentoAlerta
    ? pontos.find((p) => Math.abs(p.t - momentoAlerta) <= 120_000)
    : undefined

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Radio className="size-4 text-glow" aria-hidden="true" /> Análises de imagem ao vivo
        </CardTitle>
        <CardDescription>
          Score de diferença de cada captura de <span className="font-mono">{eixoIdentificador}</span> em relação à
          referência.
        </CardDescription>
        <CardAction>
          <span
            className="flex items-center gap-2 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success ring-1 ring-success/25"
            role="status"
            aria-live="off"
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-success" />
            </span>
            Ao vivo
            {segundos !== null && <span className="tabular font-normal text-muted-foreground">· há {segundos} s</span>}
          </span>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-4">
        {query.isPending ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : query.isError ? (
          <ErrorState error={query.error} onRetry={() => query.refetch()} />
        ) : pontos.length === 0 ? (
          <EmptyState
            icon={ScanSearch}
            title="Nenhuma análise para este rolamento ainda"
            description="Os pontos aparecem aqui assim que novas capturas forem comparadas com a referência."
          />
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-xl bg-muted/50 px-3 py-2">
                <p className="text-xs text-muted-foreground">Última captura</p>
                <p className="tabular text-glow text-xl font-semibold">{formatScore(ultima!.score)}</p>
              </div>
              <div className="rounded-xl bg-muted/50 px-3 py-2">
                <p className="text-xs text-muted-foreground">Classificação</p>
                <div className="mt-1">
                  <StatusBadge spec={CLASSIFICACAO[ultima!.analise.classificacao]} />
                </div>
              </div>
              <div className="rounded-xl bg-muted/50 px-3 py-2">
                <p className="text-xs text-muted-foreground">Análises no gráfico</p>
                <p className="tabular text-xl font-semibold">{pontos.length}</p>
              </div>
            </div>

            <div className="h-64 w-full" aria-hidden="true">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={pontos} margin={{ top: 16, right: 12, bottom: 0, left: -12 }}>
                  <defs>
                    <filter id={`glow-${filtroId}`} x="-10%" y="-40%" width="120%" height="180%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
                  <XAxis
                    dataKey="t"
                    type="number"
                    scale="time"
                    domain={['dataMin', 'dataMax']}
                    tickFormatter={(t: number) => hora.format(t)}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                    minTickGap={40}
                  />
                  <YAxis
                    domain={[0, 1]}
                    ticks={[0, 0.25, 0.5, 0.75, 1]}
                    tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                  />
                  <ReferenceLine
                    y={LIMIAR_NIVEL_ALTO}
                    stroke="var(--critical)"
                    strokeDasharray="4 4"
                    strokeOpacity={0.7}
                    label={{ value: 'limiar 60%', position: 'insideTopRight', fill: 'var(--critical)', fontSize: 11 }}
                  />
                  {pontoDoAlerta && (
                    <ReferenceLine
                      x={pontoDoAlerta.t}
                      stroke="var(--violet)"
                      strokeOpacity={0.8}
                      label={{ value: 'este alerta', position: 'insideTopLeft', fill: 'var(--violet)', fontSize: 11 }}
                    />
                  )}
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ stroke: 'var(--muted-foreground)', strokeOpacity: 0.4, strokeDasharray: '3 3' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="var(--glow)"
                    strokeWidth={2.5}
                    filter={`url(#glow-${filtroId})`}
                    isAnimationActive={false}
                    dot={(props) => (
                      <PontoClassificado
                        key={`${props.payload?.t}`}
                        {...props}
                        destaque={props.payload?.t === pontoDoAlerta?.t}
                      />
                    )}
                    activeDot={{ r: 7, fill: 'var(--glow)', stroke: 'var(--chart-surface)', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {(Object.keys(COR_CLASSIFICACAO) as Classificacao[]).map((c) => (
                <span key={c} className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full" style={{ background: COR_CLASSIFICACAO[c] }} aria-hidden="true" />
                  {CLASSIFICACAO[c].label}
                </span>
              ))}
              <span className="ml-auto">Atualiza a cada {ATUALIZAR_A_CADA / 1000} s</span>
            </div>

            {/* Mesma série em tabela para leitores de tela. */}
            <table className="sr-only">
              <caption>Score de diferença por captura do rolamento {eixoIdentificador}</caption>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Score</th>
                  <th>Classificação</th>
                </tr>
              </thead>
              <tbody>
                {pontos.map((p) => (
                  <tr key={p.analise.id}>
                    <td>{formatDateTime(p.analise.criadoEm)}</td>
                    <td>{formatScore(p.score)}</td>
                    <td>{CLASSIFICACAO[p.analise.classificacao].label}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </CardContent>
    </Card>
  )
}
