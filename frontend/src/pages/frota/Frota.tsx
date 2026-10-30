import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { TrainFront } from 'lucide-react'
import { patiosLinhas, TAMANHO_MAXIMO_PAGINA, vagoes } from '@/api/client'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'
import { Pagination } from '@/components/Pagination'
import { ErrorState, TableMessage, TableSkeleton } from '@/components/QueryStates'
import { StatusDot } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TIPO_PATIO } from '@/lib/labels'

const COLUNAS = 4

export default function Frota() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const patioLinhaId = params.get('patio') ? Number(params.get('patio')) : undefined
  const page = Number(params.get('pagina') ?? 0)

  const patios = useQuery({
    queryKey: ['patios-linhas', 'todos'],
    queryFn: () => patiosLinhas.listar({ size: TAMANHO_MAXIMO_PAGINA }),
  })
  const query = useQuery({
    queryKey: ['vagoes', { patioLinhaId, page }],
    queryFn: () => vagoes.listar({ patioLinhaId, page, size: 20 }),
    placeholderData: keepPreviousData,
  })

  function atualizar(next: { patio?: string; pagina?: number }) {
    const search = new URLSearchParams(params)
    if (next.patio !== undefined) {
      if (next.patio === 'todos') search.delete('patio')
      else search.set('patio', next.patio)
      search.delete('pagina')
    }
    if (next.pagina !== undefined) search.set('pagina', String(next.pagina))
    setParams(search, { replace: true })
  }

  return (
    <>
      <PageHeader
        title="Frota"
        description="Vagões monitorados e seus eixos. Selecione um vagão para ver os rolamentos e o histórico de capturas."
        actions={
          <Button variant="outline" asChild>
            <Link to="/cadastros">Gerenciar cadastros</Link>
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label htmlFor="filtro-patio" className="text-sm text-muted-foreground">
          Pátio / linha
        </label>
        <Select value={patioLinhaId ? String(patioLinhaId) : 'todos'} onValueChange={(value) => atualizar({ patio: value })}>
          <SelectTrigger id="filtro-patio" className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os pátios e linhas</SelectItem>
            {patios.data?.content.map((patio) => (
              <SelectItem key={patio.id} value={String(patio.id)}>
                {TIPO_PATIO[patio.tipo]} · {patio.nome}
                {!patio.ativo && ' (inativo)'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="gap-0 py-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4">Vagão</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Pátio / linha</TableHead>
              <TableHead className="pr-4">Situação</TableHead>
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
                  icon={TrainFront}
                  title="Nenhum vagão encontrado"
                  description="Cadastre pátios, vagões e eixos em Cadastros para começar o monitoramento."
                  action={
                    <Button size="sm" asChild>
                      <Link to="/cadastros?aba=vagoes">Cadastrar vagão</Link>
                    </Button>
                  }
                />
              </TableMessage>
            ) : (
              query.data.content.map((vagao) => (
                <TableRow key={vagao.id} className="cursor-pointer" onClick={() => navigate(`/frota/vagoes/${vagao.id}`)}>
                  <TableCell className="pl-4">
                    <Link
                      to={`/frota/vagoes/${vagao.id}`}
                      onClick={(event) => event.stopPropagation()}
                      className="font-medium hover:underline"
                    >
                      {vagao.numeroUk}
                    </Link>
                  </TableCell>
                  <TableCell>{vagao.tipo || <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell>{vagao.nomePatioLinha}</TableCell>
                  <TableCell className="pr-4">
                    <span className="flex items-center gap-2">
                      <StatusDot tone={vagao.ativo ? 'success' : 'neutral'} />
                      {vagao.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <Pagination pagina={query.data} onChange={(pagina) => atualizar({ pagina })} noun={['vagão', 'vagões']} />
      </Card>
    </>
  )
}
