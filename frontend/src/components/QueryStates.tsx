import { CloudOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { TableCell, TableRow } from '@/components/ui/table'
import { mensagemDeErro } from '@/lib/errors'
import { EmptyState } from './EmptyState'

/** Erro ao carregar dados, com opção de tentar de novo. */
export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <EmptyState
      icon={CloudOff}
      title="Não foi possível carregar os dados"
      description={mensagemDeErro(error)}
      action={
        onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Tentar novamente
          </Button>
        )
      }
    />
  )
}

/** Linhas-esqueleto enquanto uma tabela carrega, mantendo a altura estável. */
export function TableSkeleton({ columns, rows = 6 }: { columns: number; rows?: number }) {
  return Array.from({ length: rows }, (_, row) => (
    <TableRow key={row} className="hover:bg-transparent">
      {Array.from({ length: columns }, (_, column) => (
        <TableCell key={column}>
          <Skeleton className="h-4 w-full max-w-32" />
        </TableCell>
      ))}
    </TableRow>
  ))
}

/** Linha única ocupando a tabela inteira, para vazio ou erro. */
export function TableMessage({ columns, children }: { columns: number; children: React.ReactNode }) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={columns} className="p-0 whitespace-normal">
        {children}
      </TableCell>
    </TableRow>
  )
}
