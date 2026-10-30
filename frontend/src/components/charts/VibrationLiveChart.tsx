import { useId, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Activity, Unplug, WifiOff } from 'lucide-react'
import { eixos } from '@/api/client'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/QueryStates'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateTime, formatInteger } from '@/lib/format'
import { useSegundosDesde } from '@/lib/useSegundosDesde'
import { cn } from '@/lib/utils'

/** O ESP32 publica 1 leitura por segundo; buscar a cada 2 s mantém o gráfico andando sem sobrecarregar a API. */
const ATUALIZAR_A_CADA = 2_000
const JANELAS_MINUTOS = [5, 10, 30] as const
/** Sem leitura nova por mais que isto, o sensor é dado como fora do ar. */
const SEM_SINAL_APOS_SEGUNDOS = 15
/** Intervalo entre leituras acima do qual a linha é interrompida, em vez de ligar os pontos por cima da falta de dados. */
const LACUNA_MS = 5_000
/** Teto do eixo vertical: a vibração típica fica bem abaixo do fundo de escala do ADC (4.095) e sumiria achatada. */
const ESCALA_MAXIMA = 500

type Ponto = { t: number; valor: number }
/** valor null marca uma lacuna: o Recharts não desenha a linha através dela. */
type PontoSerie = { t: number; valor: number | null }

function comLacunas(pontos: Ponto[]): PontoSerie[] {
  const serie: PontoSerie[] = []
  pontos.forEach((ponto, i) => {
    const anterior = pontos[i - 1]
    if (anterior && ponto.t - anterior.t > LACUNA_MS) serie.push({ t: anterior.t + 1, valor: null })
    serie.push(ponto)
  })
  return serie
}

const hora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

function ChartTooltip({ active, payload, limiar }: { active?: boolean; payload?: { payload: PontoSerie }[]; limiar: number }) {
  const ponto = payload?.[0]?.payload
  if (!active || !ponto || ponto.valor === null) return null
  return (
    <div className="space-y-1 rounded-xl border bg-popover/95 px-3 py-2.5 text-xs shadow-xl backdrop-blur">
      <p className="text-muted-foreground">{hora.format(ponto.t)}</p>
      <p className="tabular text-lg font-semibold">{formatInteger(ponto.valor)}</p>
      {ponto.valor >= limiar && <p className="font-medium text-critical">Acima do limiar de captura</p>}
    </div>
  )
}

function Indicador({ rotulo, children, destaque }: { rotulo: string; children: ReactNode; destaque?: boolean }) {
  return (
    <div className="rounded-xl bg-muted/50 px-3 py-2">
      <p className="text-xs text-muted-foreground">{rotulo}</p>
      <p className={cn('tabular text-xl font-semibold', destaque && 'text-critical')}>{children}</p>
    </div>
  )
}

type VibrationLiveChartProps = {
  eixoId: number
  eixoIdentificador: string
}

/**
 * Vibração medida pelo ESP32 do eixo, quase em tempo real.
 * Fonte: GET /api/eixos/{id}/vibracao (leituras do MQTT gravadas pelo backend).
 */
export function VibrationLiveChart({ eixoId, eixoIdentificador }: VibrationLiveChartProps) {
  const gradienteId = useId().replace(/:/g, '')
  const [minutos, setMinutos] = useState<number>(10)
  const query = useQuery({
    queryKey: ['eixo', eixoId, 'vibracao', minutos],
    queryFn: () => eixos.vibracao(eixoId, minutos),
    refetchInterval: ATUALIZAR_A_CADA,
    // Ao trocar a janela, mantém o gráfico anterior até chegar o novo.
    placeholderData: keepPreviousData,
  })
  const dados = query.data
  const pontos: Ponto[] = useMemo(
    () => dados?.leituras.map((l) => ({ t: new Date(l.lidoEm).getTime(), valor: l.valor })) ?? [],
    [dados],
  )
  const serie = useMemo(() => comLacunas(pontos), [pontos])
  const ultima = pontos.at(-1)
  const segundos = useSegundosDesde(ultima?.t)
  const semSinal = segundos !== null && segundos > SEM_SINAL_APOS_SEGUNDOS
  const limiar = dados?.limiar ?? 0
  const pico = pontos.reduce((maior, p) => Math.max(maior, p.valor), 0)
  const acimaDoLimiar = pontos.filter((p) => p.valor >= limiar).length
  const temSensor = !!dados?.sensorDispositivo

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="size-4 text-glow" aria-hidden="true" /> Vibração em tempo real
        </CardTitle>
        <CardDescription>
          {temSensor ? (
            <>
              Sensor <span className="font-mono">{dados.sensorDispositivo}</span> no eixo{' '}
              <span className="font-mono">{eixoIdentificador}</span> · leitura bruta do ESP32 (0 a{' '}
              {formatInteger(dados.valorMaximo)})
            </>
          ) : (
            <>
              Leituras do sensor do eixo <span className="font-mono">{eixoIdentificador}</span>
            </>
          )}
        </CardDescription>
        {temSensor && ultima && (
          <CardAction>
            <span
              className={cn(
                'flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium ring-1',
                semSinal ? 'bg-warning/10 text-warning ring-warning/25' : 'bg-success/10 text-success ring-success/25',
              )}
              role="status"
              aria-live="off"
            >
              {semSinal ? (
                <WifiOff className="size-3.5" aria-hidden="true" />
              ) : (
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
                  <span className="relative inline-flex size-2 rounded-full bg-success" />
                </span>
              )}
              {semSinal ? 'Sem sinal' : 'Ao vivo'}
              <span className="tabular font-normal text-muted-foreground">· há {segundos} s</span>
            </span>
          </CardAction>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {query.isPending ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : query.isError ? (
          <ErrorState error={query.error} onRetry={() => query.refetch()} />
        ) : !temSensor ? (
          <EmptyState
            icon={Unplug}
            title="Nenhum sensor vinculado a este eixo"
            description='Informe o ID do ESP32 (o campo "device" que ele publica) no cadastro do eixo para ver a vibração aqui.'
            action={
              <Button variant="outline" size="sm" asChild>
                <Link to="/cadastros?aba=eixos">Abrir cadastro de eixos</Link>
              </Button>
            }
          />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="grid flex-1 grid-cols-3 gap-3 text-sm">
                <Indicador rotulo="Agora" destaque={!!ultima && ultima.valor >= limiar}>
                  {ultima ? formatInteger(ultima.valor) : '—'}
                </Indicador>
                <Indicador rotulo={`Pico em ${minutos} min`} destaque={pico >= limiar}>
                  {pontos.length ? formatInteger(pico) : '—'}
                </Indicador>
                <Indicador rotulo="Acima do limiar" destaque={acimaDoLimiar > 0}>
                  {formatInteger(acimaDoLimiar)}
                </Indicador>
              </div>
              <div role="group" aria-label="Janela de tempo" className="flex gap-1 rounded-full bg-muted/60 p-1">
                {JANELAS_MINUTOS.map((janela) => (
                  <Button
                    key={janela}
                    size="sm"
                    variant={janela === minutos ? 'secondary' : 'ghost'}
                    className="h-7 rounded-full px-3 text-xs"
                    aria-pressed={janela === minutos}
                    onClick={() => setMinutos(janela)}
                  >
                    {janela} min
                  </Button>
                ))}
              </div>
            </div>

            {pontos.length === 0 ? (
              <EmptyState
                icon={WifiOff}
                title={`Nenhuma leitura de ${dados.sensorDispositivo} nos últimos ${minutos} min`}
                description="Confira se o ESP32 está ligado e conectado ao broker MQTT. O gráfico começa a andar assim que chegar a primeira leitura."
              />
            ) : (
              <div className="h-64 w-full" aria-hidden="true">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={serie} margin={{ top: 16, right: 12, bottom: 0, left: -8 }}>
                    <defs>
                      <linearGradient id={`vib-${gradienteId}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--glow)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="var(--glow)" stopOpacity={0} />
                      </linearGradient>
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
                      minTickGap={48}
                    />
                    <YAxis
                      domain={[0, ESCALA_MAXIMA]}
                      ticks={[0, 100, 200, 300, 400, 500]}
                      // Leituras acima da escala ficam cortadas no topo (o pico real aparece no indicador acima).
                      allowDataOverflow
                      tickFormatter={(v: number) => formatInteger(v)}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                      width={52}
                    />
                    <ReferenceLine
                      y={limiar}
                      stroke="var(--critical)"
                      strokeDasharray="4 4"
                      strokeOpacity={0.7}
                    />
                    <Tooltip
                      content={<ChartTooltip limiar={limiar} />}
                      cursor={{ stroke: 'var(--muted-foreground)', strokeOpacity: 0.4, strokeDasharray: '3 3' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="valor"
                      stroke="var(--glow)"
                      strokeWidth={2}
                      fill={`url(#vib-${gradienteId})`}
                      dot={false}
                      activeDot={{ r: 5, fill: 'var(--glow)', stroke: 'var(--chart-surface)', strokeWidth: 2 }}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {limiar <= ESCALA_MAXIMA ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-4 border-t-2 border-dashed border-critical/70" aria-hidden="true" />
                  Limiar de captura ({formatInteger(limiar)}): acima dele o ESP32 pede uma foto à câmera
                </span>
              ) : (
                <span>
                  Escala até {formatInteger(ESCALA_MAXIMA)}: valores maiores aparecem cortados no topo · limiar de captura{' '}
                  {formatInteger(limiar)}
                </span>
              )}
              <span>Falhas na linha = intervalos sem leitura</span>
              <span className="ml-auto">Atualiza a cada {ATUALIZAR_A_CADA / 1000} s</span>
            </div>

            {/* Resumo e últimas leituras para leitores de tela (a série completa tem centenas de pontos). */}
            {ultima && (
              <table className="sr-only">
                <caption>
                  Vibração do eixo {eixoIdentificador}: última leitura {ultima.valor}, pico {pico} e {acimaDoLimiar} leituras
                  acima do limiar {limiar} nos últimos {minutos} minutos. Últimas 10 leituras:
                </caption>
                <thead>
                  <tr>
                    <th>Horário</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {pontos.slice(-10).map((p) => (
                    <tr key={p.t}>
                      <td>{formatDateTime(new Date(p.t).toISOString())}</td>
                      <td>{p.valor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
