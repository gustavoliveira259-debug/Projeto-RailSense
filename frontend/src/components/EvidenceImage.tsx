import { useState } from 'react'
import { ImageOff, Maximize2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

type EvidenceImageProps = {
  src: string | null | undefined
  label: string
  caption?: string
  className?: string
}

/**
 * Foto de rolamento (Cloudinary) com ampliação em tela cheia.
 *
 * Em produção, o CSP precisa liberar o domínio das imagens (img-src
 * https://res.cloudinary.com) — ver frontend/nginx.conf.
 */
export function EvidenceImage({ src, label, caption, className }: EvidenceImageProps) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <figure className={cn('space-y-2', className)}>
        <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/40 text-muted-foreground">
          <ImageOff className="size-6" aria-hidden="true" />
          <span className="text-xs">{src ? 'Imagem indisponível' : 'Sem imagem'}</span>
        </div>
        <figcaption className="text-xs">
          <span className="font-medium text-foreground">{label}</span>
          {caption && <span className="block text-muted-foreground">{caption}</span>}
        </figcaption>
      </figure>
    )
  }

  return (
    <figure className={cn('space-y-2', className)}>
      <Dialog>
        <DialogTrigger asChild>
          <button
            type="button"
            className="group relative block aspect-[4/3] w-full overflow-hidden rounded-lg border bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            aria-label={`Ampliar: ${label}`}
          >
            <img
              src={src}
              alt={label}
              loading="lazy"
              onError={() => setFailed(true)}
              className="size-full object-cover transition-transform group-hover:scale-[1.02]"
            />
            <span className="absolute right-2 bottom-2 flex size-7 items-center justify-center rounded-md bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              <Maximize2 className="size-3.5" aria-hidden="true" />
            </span>
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-4xl">
          <DialogTitle>{label}</DialogTitle>
          {caption && <DialogDescription>{caption}</DialogDescription>}
          <img src={src} alt={label} className="max-h-[75vh] w-full rounded-md object-contain" />
        </DialogContent>
      </Dialog>
      <figcaption className="text-xs">
        <span className="font-medium text-foreground">{label}</span>
        {caption && <span className="block text-muted-foreground">{caption}</span>}
      </figcaption>
    </figure>
  )
}
