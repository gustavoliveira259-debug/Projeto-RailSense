import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Pagina } from '@/api/types'
import { formatInteger } from '@/lib/format'

type PaginationProps = {
  pagina: Pagina<unknown> | undefined
  onChange: (page: number) => void
  noun?: [singular: string, plural: string]
}

/** Rodapé de tabela paginada: "21–40 de 132 alertas" + anterior/próxima. */
export function Pagination({ pagina, onChange, noun = ['registro', 'registros'] }: PaginationProps) {
  if (!pagina || pagina.totalElements === 0) return null
  const inicio = pagina.page * pagina.size + 1
  const fim = Math.min(inicio + pagina.content.length - 1, pagina.totalElements)
  const total = pagina.totalElements

  return (
    <div className="flex items-center justify-between gap-3 border-t px-4 py-3 text-sm text-muted-foreground">
      <span className="tabular">
        {formatInteger(inicio)}–{formatInteger(fim)} de {formatInteger(total)} {total === 1 ? noun[0] : noun[1]}
      </span>
      {pagina.totalPages > 1 && (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled={pagina.page === 0}
            onClick={() => onChange(pagina.page - 1)}
            aria-label="Página anterior"
          >
            <ChevronLeft /> Anterior
          </Button>
          <span className="tabular px-2 text-xs">
            {pagina.page + 1} / {pagina.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagina.page + 1 >= pagina.totalPages}
            onClick={() => onChange(pagina.page + 1)}
            aria-label="Próxima página"
          >
            Próxima <ChevronRight />
          </Button>
        </div>
      )}
    </div>
  )
}
