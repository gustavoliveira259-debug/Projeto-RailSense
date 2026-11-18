import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Activity, AlertOctagon, ArrowRight, ClipboardList, Cog, SearchCheck } from 'lucide-react'
import { painel } from '@/api/client'
import type { NivelAlerta, StatusAlerta } from '@/api/types'
import { useUser } from '@/auth/useAuth'
import { AlertsByDayChart } from '@/components/charts/AlertsByDayChart'
import { SeverityDonut } from '@/components/charts/SeverityDonut'
import { EmptyState } from '@/components/EmptyState'
import { KpiCard } from '@/components/KpiCard'
import { PageHeader } from '@/components/PageHeader'
import { ErrorState } from '@/components/QueryStates'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { alertasDoResumo } from '@/lib/alertasPorDia'
import { formatInteger, formatRelative, formatScore } from '@/lib/format'
import { NIVEL, PRIORIDADE, STATUS_ALERTA } from '@/lib/labels'

const STATUS_ORDEM_EXIBICAO: StatusAlerta[] = ['EM_ANALISE', 'CONFIRMADO', 'FALSO_POSITIVO', 'FECHADO']
const BARRA_STATUS: Record<StatusAlerta, string> = {
  EM_ANALISE: 'bg-warning',
  CONFIRMADO: 'bg-critical',
  FALSO_POSITIVO: 'bg-muted-foreground/60',
  FECHADO: 'bg-success',
}

function saudacao() {
  const hora = new Date().getHours()
  return hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'
}

function ListaSkeleton({ linhas, altura = 'h-12' }: { linhas: number; altura?: string }) {
  return (
    <div className="space-y-2 px-4">
      {Array.from({ length: linhas }, (_, i) => (
        <Skeleton key={i} className={`${altura} w-full rounded-xl`} />
      ))}
    </div>
  )
}

export default function Painel() {
  const user = useUser()
  // Um único resumo calculado no banco, sobre todos os registros.
  // Atualiza sozinho a cada minuto: o painel costuma ficar aberto numa tela da sala de controle.
  const resumo = useQuery({ queryKey: ['painel', 'resumo'], queryFn: painel.resumo, refetchInterval: 60_000 })
  const dados = resumo.data
  const carregando = resumo.isPending

  const porDia = useMemo(() => alertasDoResumo(dados?.alertasPorDia ?? []), [dados])
  const porNivel14d = useMemo(
    () =>
      porDia.reduce<Record<NivelAlerta, number>>(
        (soma, d) => ({ BAIXO: soma.BAIXO + d.BAIXO, MEDIO: soma.MEDIO + d.MEDIO, CRITICO: soma.CRITICO + d.CRITICO }),
        { BAIXO: 0, MEDIO: 0, CRITICO: 0 },
      ),
    [porDia],
  )
  const alertas14d = porNivel14d.BAIXO + porNivel14d.MEDIO + porNivel14d.CRITICO
  const aguardando = dados?.alertasPorStatus.EM_ANALISE ?? 0
  const criticosPendentes = dados?.aguardandoPorNivel.CRITICO ?? 0
  const emAndamento = dados?.ordensPorStatus.EM_ANDAMENTO ?? 0
  const ordensPendentes = (dados?.ordensPorStatus.ABERTA ?? 0) + emAndamento
  const totalAlertas = dados ? Object.values(dados.alertasPorStatus).reduce((soma, n) => soma + n, 0) : 0
  const fila = dados?.filaDecisao ?? []
  const ordensPrioritarias = dados?.ordensPrioritarias ?? []

  return (
    <>
      <PageHeader
        title={`${saudacao()}, ${user.nome.split(' ')[0]}`}
        description="Visão geral do monitoramento de rolamentos em tempo real."
      />

      {resumo.isError && (
        <div className="mb-4">
          <ErrorState error={resumo.error} onRetry={() => resumo.refetch()} />
        </div>
      )}

      <section aria-label="Indicadores" className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Aguardando decisão"
          value={formatInteger(aguardando)}
          hint={criticosPendentes > 0 ? `${formatInteger(criticosPendentes)} em nível crítico` : 'Nenhum crítico pendente'}
          icon={SearchCheck}
          tone={criticosPendentes > 0 ? 'critical' : 'warning'}
          loading={carregando}
          to="/alertas"
        />
        <KpiCard
          label="Alertas · 14 dias"
          value={formatInteger(alertas14d)}
          hint="Capturas que divergiram da referência"
          icon={Activity}
          tone="info"
          loading={carregando}
          to="/alertas?status=TODOS"
        />
        <KpiCard
          label="Ordens pendentes"
          value={formatInteger(ordensPendentes)}
          hint={`${formatInteger(emAndamento)} em andamento`}
          icon={ClipboardList}
          tone="info"
          loading={carregando}
          to="/ordens"
        />
        <KpiCard
          label="Eixos monitorados"
          value={formatInteger(dados?.eixosAtivos ?? 0)}
          hint={`em ${formatInteger(dados?.vagoesAtivos ?? 0)} vagões ativos`}
          icon={Cog}
          loading={carregando}
          to="/frota"
        />
      </section>

      <div className="mb-4 grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Alertas ao longo do tempo</CardTitle>
            <CardDescription>Últimos 14 dias · passe o mouse para ver por nível</CardDescription>
            <CardAction>
              <span className="tabular text-glow text-3xl font-semibold">{formatInteger(alertas14d)}</span>
            </CardAction>
          </CardHeader>
          <CardContent>
            {carregando || !dados ? (
              <Skeleton className="h-80 w-full rounded-xl xl:h-[23rem]" />
            ) : (
              <AlertsByDayChart data={porDia} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fila de decisão</CardTitle>
            <CardDescription>Mais graves e mais antigos primeiro</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col px-2">
            {carregando || !dados ? (
              <ListaSkeleton linhas={5} />
            ) : fila.length === 0 ? (
              <EmptyState
                icon={SearchCheck}
                title="Nenhum alerta aguardando decisão"
                description="Novos alertas aparecem aqui assim que uma captura divergir da referência."
              />
            ) : (
              <ul className="space-y-1">
                {fila.map((alerta) => (
                  <li key={alerta.id}>
                    <Link
                      to={`/alertas/${alerta.id}`}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                    >
                      <StatusBadge spec={NIVEL[alerta.nivel]} className="w-[5.5rem] justify-center" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-mono text-[13px]">{alerta.eixoIdentificador}</span>
                        <span className="block text-xs text-muted-foreground">
                          #{alerta.id} · {formatRelative(alerta.criadoEm)}
                        </span>
                      </span>
                      <span className="tabular text-glow text-sm font-medium" title="Score de diferença">
                        {formatScore(alerta.score)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {fila.length > 0 && (
              <Button variant="outline" className="mx-2 mt-auto" asChild>
                <Link to="/alertas">
                  Ver todos os {formatInteger(aguardando)} alertas <ArrowRight />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por nível</CardTitle>
            <CardDescription>Alertas dos últimos 14 dias</CardDescription>
          </CardHeader>
          <CardContent>
            {carregando || !dados ? (
              <Skeleton className="h-40 w-full rounded-xl" />
            ) : (
              <SeverityDonut porNivel={porNivel14d} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Situação dos alertas</CardTitle>
            <CardDescription>
              Como os {formatInteger(totalAlertas)} alertas registrados foram tratados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {carregando || !dados ? (
              <Skeleton className="h-40 w-full rounded-xl" />
            ) : (
              <ul className="space-y-4">
                {STATUS_ORDEM_EXIBICAO.map((status) => {
                  const quantidade = dados.alertasPorStatus[status]
                  const pct = totalAlertas ? Math.round((quantidade / totalAlertas) * 100) : 0
                  const Icon = STATUS_ALERTA[status].icon
                  return (
                    <li key={status} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Icon className="size-4" aria-hidden="true" />
                          {STATUS_ALERTA[status].label}
                        </span>
                        <span className="tabular font-medium">
                          {pct}% <span className="font-normal text-muted-foreground">· {formatInteger(quantidade)}</span>
                        </span>
                      </div>
                      <div
                        className="h-1.5 overflow-hidden rounded-full bg-muted"
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={STATUS_ALERTA[status].label}
                      >
                        <div className={`h-full rounded-full ${BARRA_STATUS[status]}`} style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 xl:col-span-1">
          <CardHeader>
            <CardTitle>Ordens prioritárias</CardTitle>
            <CardDescription>Pendentes, por prioridade</CardDescription>
            <CardAction>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/ordens">
                  Ver todas <ArrowRight />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="px-2">
            {carregando || !dados ? (
              <ListaSkeleton linhas={4} altura="h-11" />
            ) : ordensPrioritarias.length === 0 ? (
              <EmptyState icon={AlertOctagon} title="Nenhuma ordem pendente" />
            ) : (
              <ul className="space-y-1">
                {ordensPrioritarias.map((ordem) => (
                  <li key={ordem.id} className="flex items-center gap-3 rounded-xl px-3 py-2">
                    <StatusBadge spec={PRIORIDADE[ordem.prioridade]} className="w-[5.5rem] justify-center" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-mono text-[13px]">{ordem.eixoIdentificador}</span>
                      <span className="block text-xs text-muted-foreground">
                        OS #{ordem.id} · {formatRelative(ordem.criadoEm)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
