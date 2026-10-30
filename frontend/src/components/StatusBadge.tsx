import type { LabelSpec, Tone } from '@/lib/labels'
import { cn } from '@/lib/utils'

const TONE_CLASS: Record<Tone, string> = {
  success: 'bg-success/10 text-success ring-success/25',
  warning: 'bg-warning/10 text-warning ring-warning/30',
  critical: 'bg-critical/10 text-critical ring-critical/30',
  info: 'bg-info/10 text-info ring-info/25',
  neutral: 'bg-muted text-muted-foreground ring-border',
}

type StatusBadgeProps = {
  spec: LabelSpec
  className?: string
}

/** Selo de status com ícone + texto; a cor reforça, mas nunca é a única pista. */
export function StatusBadge({ spec, className }: StatusBadgeProps) {
  const Icon = spec.icon
  return (
    <span
      className={cn(
        'inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset',
        TONE_CLASS[spec.tone],
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {spec.label}
    </span>
  )
}

/** Ponto de status compacto para listas densas — sempre com texto ao lado. */
export function StatusDot({ tone, className }: { tone: Tone; className?: string }) {
  const color: Record<Tone, string> = {
    success: 'bg-success',
    warning: 'bg-warning',
    critical: 'bg-critical',
    info: 'bg-info',
    neutral: 'bg-muted-foreground/50',
  }
  return <span aria-hidden="true" className={cn('inline-block size-2 shrink-0 rounded-full', color[tone], className)} />
}
