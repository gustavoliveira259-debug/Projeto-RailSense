import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { BellOff } from 'lucide-react'
import { alertas } from '@/api/client'
import type { StatusAlerta } from '@/api/types'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'
import { Pagination } from '@/components/Pagination'
import { ErrorState, TableMessage, TableSkeleton } from '@/components/QueryStates'
import { StatusBadge } from '@/components/StatusBadge'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDateTime, formatRelative, formatScore } from '@/lib/format'
import { NIVEL, STATUS_ALERTA } from '@/lib/labels'

const FILTROS: { value: StatusAlerta | 'TODOS'; label: string }[] = [
  { value: 'EM_ANALISE', label: 'Aguardando decisão' },
  { value: 'CONFIRMADO', label: 'Confirmados' },
  { value: 'FALSO_POSITIVO', label: 'Falsos positivos' },
  { value: 'FECHADO', label: 'Fechados' },
  { value: 'TODOS', label: 'Todos' },
]

const COLUNAS = 6

export default function Alertas() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const filtro = (params.get('status') as StatusAlerta | 'TODOS' | null) ?? 'EM_ANALISE'
  const status = filtro === 'TODOS' ? undefined : filtro
  const page = Number(params.get('pagina') ?? 0)

  const query = useQuery({
    queryKey: ['alertas', { status, page }],
    queryFn: () => alertas.listar({ status, page, size: 20 }),
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  })

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
        title="Alertas"
        description="Divergências entre a captura do rolamento e a imagem de referência, classificadas pelo Gemini."
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
              <TableHead className="w-24 pl-4">Alerta</TableHead>
              <TableHead>Nível</TableHead>
              <TableHead>Eixo</TableHead>
              <TableHead className="text-right">Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="pr-4">Gerado</TableHead>
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
                  icon={BellOff}
                  title="Nenhum alerta neste filtro"
                  description={
                    filtro === 'EM_ANALISE' ? 'Todos os alertas já foram decididos. Bom trabalho!' : undefined
                  }
                />
              </TableMessage>
            ) : (
              query.data.content.map((alerta) => (
                <TableRow
                  key={alerta.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/alertas/${alerta.id}`)}
                >
                  <TableCell className="pl-4 font-medium">
                    <Link
                      to={`/alertas/${alerta.id}`}
                      className="tabular hover:underline"
                      onClick={(event) => event.stopPropagation()}
                    >
                      #{alerta.id}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <StatusBadge spec={NIVEL[alerta.nivel]} />
                  </TableCell>
                  <TableCell className="font-mono text-xs">{alerta.eixoIdentificador}</TableCell>
                  <TableCell className="tabular text-right">{formatScore(alerta.score)}</TableCell>
                  <TableCell>
                    <StatusBadge spec={STATUS_ALERTA[alerta.status]} />
                  </TableCell>
                  <TableCell className="pr-4 text-muted-foreground" title={formatDateTime(alerta.criadoEm)}>
                    {formatRelative(alerta.criadoEm)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <Pagination pagina={query.data} onChange={(pagina) => atualizar({ pagina })} noun={['alerta', 'alertas']} />
      </Card>
    </>
  )
}
