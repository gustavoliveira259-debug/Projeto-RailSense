import { Link, useParams } from 'react-router-dom'
import { useQueries, useQuery } from '@tanstack/react-query'
import { ChevronRight, Cog } from 'lucide-react'
import { alertas, eixos, TAMANHO_MAXIMO_PAGINA, vagoes } from '@/api/client'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'
import { ErrorState } from '@/components/QueryStates'
import { StatusBadge, StatusDot } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { NIVEL } from '@/lib/labels'

export default function VagaoDetalhe() {
  const id = Number(useParams().id)
  const vagao = useQuery({ queryKey: ['vagao', id], queryFn: () => vagoes.detalhar(id) })
  const listaEixos = useQuery({
    queryKey: ['eixos', { vagaoId: id }],
    queryFn: () => eixos.listar({ vagaoId: id, size: TAMANHO_MAXIMO_PAGINA, sort: 'posicao' }),
  })
  // Alertas pendentes de cada eixo: a API filtra por eixo, não por vagão.
  const pendentes = useQueries({
    queries: (listaEixos.data?.content ?? []).map((eixo) => ({
      queryKey: ['alertas', { status: 'EM_ANALISE', eixoId: eixo.id, size: TAMANHO_MAXIMO_PAGINA }],
      queryFn: () => alertas.listar({ status: 'EM_ANALISE', eixoId: eixo.id, size: TAMANHO_MAXIMO_PAGINA }),
    })),
  })

  const crumbs = [{ label: 'Frota', to: '/frota' }, { label: vagao.data?.numeroUk ?? `Vagão ${id}` }]

  if (vagao.isError) {
    return (
      <>
        <PageHeader title="Vagão" crumbs={crumbs} />
        <Card>
          <ErrorState error={vagao.error} onRetry={() => vagao.refetch()} />
        </Card>
      </>
    )
  }

  return (
    <>
      <PageHeader
        crumbs={crumbs}
        title={vagao.data?.numeroUk ?? <Skeleton className="h-8 w-48" />}
        description={
          vagao.data && (
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>{vagao.data.tipo || 'Tipo não informado'}</span>
              <span aria-hidden="true">·</span>
              <span>{vagao.data.nomePatioLinha}</span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1.5">
                <StatusDot tone={vagao.data.ativo ? 'success' : 'neutral'} />
                {vagao.data.ativo ? 'Ativo' : 'Inativo'}
              </span>
            </span>
          )
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Eixos e rolamentos</CardTitle>
          <CardDescription>Cada eixo tem uma câmera e uma imagem de referência própria.</CardDescription>
        </CardHeader>
        <CardContent>
          {listaEixos.isPending ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-28" />
              ))}
            </div>
          ) : listaEixos.isError ? (
            <ErrorState error={listaEixos.error} onRetry={() => listaEixos.refetch()} />
          ) : listaEixos.data.content.length === 0 ? (
            <EmptyState
              icon={Cog}
              title="Nenhum eixo cadastrado neste vagão"
              action={
                <Button size="sm" asChild>
                  <Link to="/cadastros?aba=eixos">Cadastrar eixo</Link>
                </Button>
              }
            />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {listaEixos.data.content.map((eixo, index) => {
                const abertos = pendentes[index]?.data?.content ?? []
                const pior = abertos.find((a) => a.nivel === 'CRITICO') ?? abertos.find((a) => a.nivel === 'MEDIO') ?? abertos[0]
                return (
                  <li key={eixo.id}>
                    <Link
                      to={`/frota/eixos/${eixo.id}`}
                      className="group flex h-full flex-col gap-3 rounded-lg border p-4 transition-colors hover:border-primary/40 hover:bg-accent/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Posição {eixo.posicao}</p>
                          <p className="font-mono text-sm font-medium">{eixo.identificadorUnico}</p>
                        </div>
                        <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                      </div>
                      <div className="mt-auto flex flex-wrap items-center gap-2 text-xs">
                        {!eixo.ativo ? (
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <StatusDot tone="neutral" /> Desativado
                          </span>
                        ) : pendentes[index]?.isPending ? (
                          <Skeleton className="h-6 w-28" />
                        ) : pior ? (
                          <>
                            <StatusBadge spec={NIVEL[pior.nivel]} />
                            <span className="text-muted-foreground">
                              {abertos.length} {abertos.length === 1 ? 'alerta pendente' : 'alertas pendentes'}
                            </span>
                          </>
                        ) : (
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <StatusDot tone="success" /> Sem alertas pendentes
                          </span>
                        )}
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  )
}
