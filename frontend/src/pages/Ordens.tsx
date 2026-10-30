import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ClipboardList, Loader2, MoreHorizontal } from 'lucide-react'
import { ordens } from '@/api/client'
import type { OrdemManutencao, StatusOrdem } from '@/api/types'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'
import { Pagination } from '@/components/Pagination'
import { ErrorState, TableMessage, TableSkeleton } from '@/components/QueryStates'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { mensagemDeErro } from '@/lib/errors'
import { formatDateTime, formatRelative } from '@/lib/format'
import { ACAO_ORDEM, PRIORIDADE, STATUS_ORDEM, TRANSICOES_ORDEM } from '@/lib/labels'

const FILTROS: { value: StatusOrdem | 'TODAS'; label: string }[] = [
  { value: 'ABERTA', label: 'Abertas' },
  { value: 'EM_ANDAMENTO', label: 'Em andamento' },
  { value: 'CONCLUIDA', label: 'Concluídas' },
  { value: 'CANCELADA', label: 'Canceladas' },
  { value: 'TODAS', label: 'Todas' },
]

const COLUNAS = 7

/** Transições finais pedem confirmação: não há como voltar atrás no backend. */
const IRREVERSIVEL: Partial<Record<StatusOrdem, string>> = {
  CONCLUIDA: 'Concluir a ordem também fecha o alerta vinculado. Esta ação não pode ser desfeita.',
  CANCELADA: 'A ordem cancelada não pode ser reaberta. O alerta vinculado poderá receber uma nova ordem.',
}

export default function Ordens() {
  const queryClient = useQueryClient()
  const [params, setParams] = useSearchParams()
  const filtro = (params.get('status') as StatusOrdem | 'TODAS' | null) ?? 'ABERTA'
  const status = filtro === 'TODAS' ? undefined : filtro
  const page = Number(params.get('pagina') ?? 0)
  const [confirmar, setConfirmar] = useState<{ ordem: OrdemManutencao; para: StatusOrdem } | null>(null)

  const query = useQuery({
    queryKey: ['ordens', { status, page }],
    queryFn: () => ordens.listar({ status, page, size: 20 }),
    placeholderData: keepPreviousData,
  })

  const alterar = useMutation({
    mutationFn: ({ ordem, para }: { ordem: OrdemManutencao; para: StatusOrdem }) => ordens.alterarStatus(ordem.id, para),
    onSuccess: (ordem) => {
      toast.success(`OS #${ordem.id}: ${STATUS_ORDEM[ordem.status].label.toLowerCase()}.`)
      queryClient.invalidateQueries({ queryKey: ['ordens'] })
      // Concluir fecha o alerta no backend.
      if (ordem.status === 'CONCLUIDA') queryClient.invalidateQueries({ queryKey: ['alertas'] })
      setConfirmar(null)
    },
    onError: (error) => toast.error(mensagemDeErro(error)),
  })

  function pedir(ordem: OrdemManutencao, para: StatusOrdem) {
    if (IRREVERSIVEL[para]) setConfirmar({ ordem, para })
    else alterar.mutate({ ordem, para })
  }

  function atualizar(next: { status?: string; pagina?: number }) {
    const search = new URLSearchParams(params)
    if (next.status !== undefined) {
      search.set('status', next.status)
      search.delete('pagina')
    }
    if (next.pagina !== undefined) search.set('pagina', String(next.pagina))
    setParams(search, { replace: true })
  }

  return (
    <>
      <PageHeader
        title="Ordens de manutenção"
        description="Abertas a partir de alertas confirmados. Fluxo: aberta → em andamento → concluída."
      />

      <Tabs value={filtro} onValueChange={(value) => atualizar({ status: value })} className="mb-4">
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList>
            {FILTROS.map((f) => (
              <TabsTrigger key={f.value} value={f.value}>
                {f.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>

      <Card className="gap-0 py-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4">Ordem</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Eixo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Aberta por</TableHead>
              <TableHead>Abertura</TableHead>
              <TableHead className="w-12 pr-4">
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isPending ? (
              <TableSkeleton columns={COLUNAS} />
            ) : query.isError ? (
              <TableMessage columns={COLUNAS}>
                <ErrorState error={query.error} onRetry={() => query.refetch()} />
              </TableMessage>
            ) : query.data.content.length === 0 ? (
              <TableMessage columns={COLUNAS}>
                <EmptyState
                  icon={ClipboardList}
                  title="Nenhuma ordem neste filtro"
                  description="Ordens são abertas na tela de um alerta confirmado."
                />
              </TableMessage>
            ) : (
              query.data.content.map((ordem) => {
                const proximos = TRANSICOES_ORDEM[ordem.status]
                return (
                  <TableRow key={ordem.id}>
                    <TableCell className="max-w-80 pl-4 whitespace-normal">
                      <span className="block font-medium">{ordem.titulo}</span>
                      <span className="text-xs text-muted-foreground">
                        OS #{ordem.id} ·{' '}
                        <Link to={`/alertas/${ordem.alertaId}`} className="text-primary hover:underline">
                          alerta #{ordem.alertaId}
                        </Link>
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge spec={PRIORIDADE[ordem.prioridade]} />
                    </TableCell>
                    <TableCell>
                      <Link to={`/frota/eixos/${ordem.eixoId}`} className="font-mono text-xs hover:underline">
                        {ordem.eixoIdentificador}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <StatusBadge spec={STATUS_ORDEM[ordem.status]} />
                    </TableCell>
                    <TableCell>{ordem.criadoPorNome}</TableCell>
                    <TableCell className="text-muted-foreground" title={formatDateTime(ordem.criadoEm)}>
                      {formatRelative(ordem.criadoEm)}
                    </TableCell>
                    <TableCell className="pr-4">
                      {proximos.length > 0 && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm" aria-label={`Ações da OS #${ordem.id}`}>
                              {alterar.isPending && alterar.variables?.ordem.id === ordem.id ? (
                                <Loader2 className="animate-spin" />
                              ) : (
                                <MoreHorizontal />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Alterar status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {proximos.map((para) => {
                              const Icon = STATUS_ORDEM[para].icon
                              return (
                                <DropdownMenuItem
                                  key={para}
                                  onSelect={() => pedir(ordem, para)}
                                  variant={para === 'CANCELADA' ? 'destructive' : 'default'}
                                >
                                  <Icon /> {ACAO_ORDEM[para]}
                                </DropdownMenuItem>
                              )
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
        <Pagination pagina={query.data} onChange={(pagina) => atualizar({ pagina })} noun={['ordem', 'ordens']} />
      </Card>

      <Dialog open={!!confirmar} onOpenChange={(open) => !open && setConfirmar(null)}>
        <DialogContent>
          {confirmar && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {ACAO_ORDEM[confirmar.para]} #{confirmar.ordem.id}?
                </DialogTitle>
                <DialogDescription>{IRREVERSIVEL[confirmar.para]}</DialogDescription>
              </DialogHeader>
              <p className="rounded-md bg-muted/60 px-3 py-2 text-sm">{confirmar.ordem.titulo}</p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmar(null)}>
                  Voltar
                </Button>
                <Button
                  variant={confirmar.para === 'CANCELADA' ? 'destructive' : 'default'}
                  disabled={alterar.isPending}
                  onClick={() => alterar.mutate(confirmar)}
                >
                  {alterar.isPending && <Loader2 className="animate-spin" />}
                  {ACAO_ORDEM[confirmar.para]}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
