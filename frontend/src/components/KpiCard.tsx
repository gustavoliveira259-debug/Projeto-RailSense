import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { Tone } from '@/lib/labels'
import { cn } from '@/lib/utils'

const ICON_TONE: Record<Tone, string> = {
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  critical: 'bg-critical/10 text-critical',
  info: 'bg-info/10 text-info',
  neutral: 'bg-muted text-muted-foreground',
}

type KpiCardProps = {
  label: string
  value: ReactNode
  hint?: ReactNode
  icon: LucideIcon
  tone?: Tone
  loading?: boolean
  to?: string
}

/** Indicador numérico único — quando o dado é um número, não um gráfico. */
export function KpiCard({ label, value, hint, icon: Icon, tone = 'neutral', loading, to }: KpiCardProps) {
  const body = (
    <Card className={cn('h-full gap-2 px-5 pt-5 pb-4', to && 'transition-colors hover:bg-accent/40')}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className={cn('flex size-8 items-center justify-center rounded-full', ICON_TONE[tone])}>
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
      {loading ? (
        <Skeleton className="h-10 w-20" />
      ) : (
        <span className="tabular text-glow text-4xl font-semibold tracking-tight">{value}</span>
      )}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </Card>
  )
  return to ? (
    <Link to={to} className="rounded-2xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
      {body}
    </Link>
  ) : (
    body
  )
}
