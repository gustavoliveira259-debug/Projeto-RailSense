import { useId } from 'react'
import { cn } from '@/lib/utils'

/**
 * Marca do RailSense em vetor: pistas de um rolamento com esferas, em gradiente
 * ciano → violeta. Redesenho do assets/Logo.png sem o fundo branco, para funcionar
 * sobre superfícies escuras.
 */
export function LogoMark({ className }: { className?: string }) {
  const id = useId().replace(/:/g, '')
  const esferas = Array.from({ length: 8 }, (_, i) => {
    const angulo = (i / 8) * Math.PI * 2 - Math.PI / 2
    return { cx: 24 + 15.5 * Math.cos(angulo), cy: 24 + 15.5 * Math.sin(angulo) }
  })
  return (
    <svg viewBox="0 0 48 48" className={cn('size-8', className)} aria-hidden="true" fill="none">
      <defs>
        <linearGradient id={`g-${id}`} x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2ee6d6" />
          <stop offset="1" stopColor="#9b7bff" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="21" stroke={`url(#g-${id})`} strokeWidth="3" />
      <circle cx="24" cy="24" r="10" stroke={`url(#g-${id})`} strokeWidth="3" />
      {esferas.map((esfera, i) => (
        <circle key={i} {...esfera} r="2.6" stroke={`url(#g-${id})`} strokeWidth="1.8" />
      ))}
      <path d="M18.5 22a6 6 0 0 1 4-4.4" stroke={`url(#g-${id})`} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
