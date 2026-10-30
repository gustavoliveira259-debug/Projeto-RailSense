import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Activity, AlertOctagon, ArrowRight, ClipboardList, Cog, SearchCheck } from 'lucide-react'
import { alertas, eixos, ordens, TAMANHO_MAXIMO_PAGINA, vagoes } from '@/api/client'
import type { StatusAlerta } from '@/api/types'
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
import { agruparPorDia } from '@/lib/alertasPorDia'
import { formatInteger, formatRelative, formatScore } from '@/lib/format'
import { NIVEL, PRIORIDADE, STATUS_ALERTA } from '@/lib/labels'

const PESO_NIVEL = { CRITICO: 2, MEDIO: 1, BAIXO: 0 } as const
const PESO_PRIORIDADE = { URGENTE: 3, ALTA: 2, MEDIA: 1, BAIXA: 0 } as const
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
  // Atualiza sozinho a cada minuto: o painel costuma ficar aberto numa tela da sala de controle.
  const refetchInterval = 60_000

  const pendentes = useQuery({
    queryKey: ['alertas', { status: 'EM_ANALISE', size: TAMANHO_MAXIMO_PAGINA }],
    queryFn: () => alertas.listar({ status: 'EM_ANALISE', size: TAMANHO_MAXIMO_PAGINA }),
    refetchInterval,
  })
  const recentes = useQuery({
    queryKey: ['alertas', { size: TAMANHO_MAXIMO_PAGINA }],
    queryFn: () => alertas.listar({ size: TAMANHO_MAXIMO_PAGINA }),
    refetchInterval,
  })
  const abertas = useQuery({
    queryKey: ['ordens', { status: 'ABERTA', size: TAMANHO_MAXIMO_PAGINA }],
    queryFn: () => ordens.listar({ status: 'ABERTA', size: TAMANHO_MAXIMO_PAGINA }),
    refetchInterval,
  })
  const emAndamento = useQuery({
    queryKey: ['ordens', { status: 'EM_ANDAMENTO', size: TAMANHO_MAXIMO_PAGINA }],
    queryFn: () => ordens.listar({ status: 'EM_ANDAMENTO', size: TAMANHO_MAXIMO_PAGINA }),
    refetchInterval,
  })
  const totalVagoes = useQuery({ queryKey: ['vagoes', 'total'], queryFn: () => vagoes.listar({ size: 1 }) })
  const totalEixos = useQuery({ queryKey: ['eixos', 'total'], queryFn: () => eixos.listar({ size: 1 }) })

  const fila = useMemo(
    () =>
      [...(pendentes.data?.content ?? [])].sort(
        (a, b) => PESO_NIVEL[b.nivel] - PESO_NIVEL[a.nivel] || a.criadoEm.localeCompare(b.criadoEm),
      ),
    [pendentes.data],
  )
  const criticosPendentes = fila.filter((a) => a.nivel === 'CRITICO').length
  const ordensPendentes = useMemo(
    () =>
      [...(abertas.data?.content ?? []), ...(emAndamento.data?.content ?? [])].sort(
        (a, b) => PESO_PRIORIDADE[b.prioridade] - PESO_PRIORIDADE[a.prioridade] || a.criadoEm.localeCompare(b.criadoEm),
      ),
    [abertas.data, emAndamento.data],
  )
  const amostra = useMemo(() => recentes.data?.content ?? [], [recentes.data])
  const porDia = useMemo(() => agruparPorDia(amostra), [amostra])
  // Janela medida a partir do momento da busca (estável entre renderizações).
  const buscadoEm = recentes.dataUpdatedAt
  const ultimos14Dias = useMemo(
    () => amostra.filter((a) => buscadoEm - new Date(a.criadoEm).getTime() < 14 * 86_400_000),
    [amostra, buscadoEm],
  )
  const totalPorDia = porDia.map((d) => d.BAIXO + d.MEDIO + d.CRITICO)
  const alertas14d = totalPorDia.reduce((soma, n) => soma + n, 0)
  // Se a página veio cheia, os 14 dias podem estar incompletos — avisa em vez de esconder.
  const amostraLimitada = (recentes.data?.totalElements ?? 0) > TAMANHO_MAXIMO_PAGINA

  return (
    <>
      <PageHeader
        title={`${saudacao()}, ${user.nome.split(' ')[0]}`}
        description="Visão geral do monitoramento de rolamentos em tempo real."
      />

      <section aria-label="Indicadores" className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Aguardando decisão"
          value={formatInteger(pendentes.data?.totalElements ?? 0)}
          hint={criticosPendentes > 0 ? `${criticosPendentes} em nível crítico` : 'Nenhum crítico pendente'}
          icon={SearchCheck}
          tone={criticosPendentes > 0 ? 'critical' : 'warning'}
          loading={pendentes.isPending}
          to="/alertas"
        />
        <KpiCard
          label="Alertas · 14 dias"
          value={formatInteger(alertas14d)}
          hint="Capturas que divergiram da referência"
          icon={Activity}
          tone="info"
          loading={recentes.isPending}
          to="/alertas?status=TODOS"
        />
        <KpiCard
          label="Ordens pendentes"
          value={formatInteger((abertas.data?.totalElements ?? 0) + (emAndamento.data?.totalElements ?? 0))}
          hint={`${formatInteger(emAndamento.data?.totalElements ?? 0)} em andamento`}
          icon={ClipboardList}
          tone="info"
          loading={abertas.isPending || emAndamento.isPending}
          to="/ordens"
        />
        <KpiCard
          label="Eixos monitorados"
          value={formatInteger(totalEixos.data?.totalElements ?? 0)}
          hint={`em ${formatInteger(totalVagoes.data?.totalElements ?? 0)} vagões cadastrados`}
          icon={Cog}
          loading={totalEixos.isPending || totalVagoes.isPending}
          to="/frota"
        />
      </section>

      <div className="mb-4 grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Alertas ao longo do tempo</CardTitle>
            <CardDescription>
              Últimos 14 dias · passe o mouse para ver por nível
              {amostraLimitada && ' · considera os 100 alertas mais recentes'}
            </CardDescription>
            <CardAction>
              <span className="tabular text-glow text-3xl font-semibold">{formatInteger(alertas14d)}</span>
            </CardAction>
          </CardHeader>
          <CardContent>
            {recentes.isPending ? (
              <Skeleton className="h-80 w-full rounded-xl xl:h-[23rem]" />
            ) : recentes.isError ? (
              <ErrorState error={recentes.error} onRetry={() => recentes.refetch()} />
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
            {pendentes.isPending ? (
              <ListaSkeleton linhas={5} />
            ) : pendentes.isError ? (
              <ErrorState error={pendentes.error} onRetry={() => pendentes.refetch()} />
            ) : fila.length === 0 ? (
              <EmptyState
                icon={SearchCheck}
                title="Nenhum alerta aguardando decisão"
                description="Novos alertas aparecem aqui assim que uma captura divergir da referência."
              />
            ) : (
              <ul className="space-y-1">
                {fila.slice(0, 6).map((alerta) => (
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
                  Ver todos os alertas <ArrowRight />
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
            {recentes.isPending ? (
              <Skeleton className="h-40 w-full rounded-xl" />
            ) : (
              <SeverityDonut alertas={ultimos14Dias} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Situação dos alertas</CardTitle>
            <CardDescription>Como os alertas recentes foram tratados</CardDescription>
          </CardHeader>
          <CardContent>
            {recentes.isPending ? (
              <Skeleton className="h-40 w-full rounded-xl" />
            ) : (
              <ul className="space-y-4">
                {STATUS_ORDEM_EXIBICAO.map((status) => {
                  const quantidade = amostra.filter((a) => a.status === status).length
                  const pct = amostra.length ? Math.round((quantidade / amostra.length) * 100) : 0
                  const Icon = STATUS_ALERTA[status].icon
                  return (
                    <li key={status} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Icon className="size-4" aria-hidden="true" />
                          {STATUS_ALERTA[status].label}
                        </span>
                        <span className="tabular font-medium">{pct}%</span>
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
            {abertas.isPending || emAndamento.isPending ? (
              <ListaSkeleton linhas={4} altura="h-11" />
            ) : abertas.isError || emAndamento.isError ? (
              <ErrorState error={abertas.error ?? emAndamento.error} />
            ) : ordensPendentes.length === 0 ? (
              <EmptyState icon={AlertOctagon} title="Nenhuma ordem pendente" />
            ) : (
              <ul className="space-y-1">
                {ordensPendentes.slice(0, 4).map((ordem) => (
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
