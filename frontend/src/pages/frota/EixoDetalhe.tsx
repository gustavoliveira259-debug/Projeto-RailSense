import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Bell, Camera, ImagePlus, Images, Loader2, ScanSearch, Star, Upload } from 'lucide-react'
import { alertas, eixos, imagens } from '@/api/client'
import type { ResultadoUpload } from '@/api/types'
import { EmptyState } from '@/components/EmptyState'
import { EvidenceImage } from '@/components/EvidenceImage'
import { VibrationLiveChart } from '@/components/charts/VibrationLiveChart'
import { PageHeader } from '@/components/PageHeader'
import { Pagination } from '@/components/Pagination'
import { ErrorState, TableMessage, TableSkeleton } from '@/components/QueryStates'
import { StatusBadge, StatusDot } from '@/components/StatusBadge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { mensagemDeErro } from '@/lib/errors'
import { formatDateTime, formatRelative, formatScore } from '@/lib/format'
import { CLASSIFICACAO, NIVEL, STATUS_ALERTA } from '@/lib/labels'
import { cn } from '@/lib/utils'

/** Espelha ImageFileValidator e spring.servlet.multipart.max-file-size (10MB). */
const TIPOS_ACEITOS = ['image/jpeg', 'image/png', 'image/webp']
const TAMANHO_MAXIMO = 10 * 1024 * 1024

function ResultadoEnvio({ resultado }: { resultado: ResultadoUpload }) {
  if (!resultado.analiseId) {
    return (
      <Alert>
        <Star />
        <AlertTitle>Imagem salva, mas não analisada</AlertTitle>
        <AlertDescription>
          Este eixo ainda não tem imagem de referência. Marque uma captura de um rolamento em bom estado como referência
          na aba Capturas; as próximas imagens serão comparadas com ela.
        </AlertDescription>
      </Alert>
    )
  }
  return (
    <Alert variant={resultado.alertaId ? 'destructive' : 'default'}>
      <ScanSearch />
      <AlertTitle className="flex flex-wrap items-center gap-2">
        Análise concluída
        {resultado.classificacao && <StatusBadge spec={CLASSIFICACAO[resultado.classificacao]} />}
        <span className="tabular text-xs font-normal text-muted-foreground">
          score {formatScore(resultado.scoreDiferenca)}
        </span>
      </AlertTitle>
      <AlertDescription>
        {resultado.alertaId ? (
          <span>
            A captura divergiu da referência e gerou um alerta.{' '}
            <Link to={`/alertas/${resultado.alertaId}`} className="font-medium underline">
              Abrir alerta #{resultado.alertaId}
            </Link>
          </span>
        ) : (
          'Nenhuma divergência relevante em relação à referência. Nenhum alerta foi gerado.'
        )}
      </AlertDescription>
    </Alert>
  )
}

function EnviarImagem({ eixoId, ativo }: { eixoId: number; ativo: boolean }) {
  const queryClient = useQueryClient()
  const input = useRef<HTMLInputElement>(null)
  const [arrastando, setArrastando] = useState(false)
  const enviar = useMutation({
    mutationFn: (arquivo: File) => imagens.enviar(eixoId, arquivo),
    onSuccess: (resultado) => {
      queryClient.invalidateQueries({ queryKey: ['eixo', eixoId] })
      if (resultado.alertaId) queryClient.invalidateQueries({ queryKey: ['alertas'] })
    },
    onError: (error) => toast.error(mensagemDeErro(error, 'Falha ao enviar a imagem.')),
  })

  function escolher(arquivo: File | undefined) {
    if (!arquivo) return
    if (!TIPOS_ACEITOS.includes(arquivo.type)) {
      toast.error('Formato não suportado. Envie JPEG, PNG ou WebP.')
      return
    }
    if (arquivo.size > TAMANHO_MAXIMO) {
      toast.error('A imagem passa de 10 MB.')
      return
    }
    enviar.mutate(arquivo)
  }

  function onDrop(event: DragEvent) {
    event.preventDefault()
    setArrastando(false)
    escolher(event.dataTransfer.files[0])
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImagePlus className="size-4 text-muted-foreground" /> Enviar captura
        </CardTitle>
        <CardDescription>Envio manual de foto do rolamento. A comparação com a referência leva alguns segundos.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!ativo ? (
          <p className="rounded-md bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
            Eixo desativado: não recebe novas imagens. Reative-o em Cadastros.
          </p>
        ) : (
          <button
            type="button"
            onClick={() => input.current?.click()}
            onDragOver={(event) => {
              event.preventDefault()
              setArrastando(true)
            }}
            onDragLeave={() => setArrastando(false)}
            onDrop={onDrop}
            disabled={enviar.isPending}
            className={cn(
              'flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors',
              'focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-wait',
              arrastando ? 'border-primary bg-accent' : 'hover:border-primary/50 hover:bg-accent/40',
            )}
          >
            {enviar.isPending ? (
              <>
                <Loader2 className="size-6 animate-spin text-primary" />
                <span className="text-sm font-medium">Enviando e analisando…</span>
                <span className="text-xs text-muted-foreground">Upload para o Cloudinary e comparação pelo Gemini</span>
              </>
            ) : (
              <>
                <Upload className="size-6 text-muted-foreground" />
                <span className="text-sm font-medium">Arraste a imagem ou clique para escolher</span>
                <span className="text-xs text-muted-foreground">JPEG, PNG ou WebP · até 10 MB</span>
              </>
            )}
          </button>
        )}
        <input
          ref={input}
          type="file"
          accept={TIPOS_ACEITOS.join(',')}
          className="hidden"
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            escolher(event.target.files?.[0])
            event.target.value = ''
          }}
        />
        {enviar.data && <ResultadoEnvio resultado={enviar.data} />}
      </CardContent>
    </Card>
  )
}

function Capturas({ eixoId }: { eixoId: number }) {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const query = useQuery({
    queryKey: ['eixo', eixoId, 'imagens', page],
    queryFn: () => eixos.imagens(eixoId, { page, size: 12 }),
    placeholderData: keepPreviousData,
  })
  const marcar = useMutation({
    mutationFn: (imagemId: number) => imagens.marcarComoBaseline(imagemId),
    onSuccess: () => {
      toast.success('Nova imagem de referência definida.')
      queryClient.invalidateQueries({ queryKey: ['eixo', eixoId] })
    },
    onError: (error) => toast.error(mensagemDeErro(error)),
  })

  if (query.isPending) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="aspect-[4/3]" />
        ))}
      </div>
    )
  }
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />
  if (query.data.content.length === 0) {
    return <EmptyState icon={Images} title="Nenhuma captura recebida" description="Envie a primeira imagem acima." />
  }

  return (
    <div className="space-y-2">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {query.data.content.map((imagem) => (
          <div key={imagem.id} className="space-y-2">
            <EvidenceImage
              src={imagem.urlArquivo}
              label={imagem.baselineAtiva ? `Referência atual · #${imagem.id}` : `Captura #${imagem.id}`}
              caption={formatDateTime(imagem.timestampCaptura)}
            />
            {imagem.baselineAtiva ? (
              <span className="flex h-7 items-center gap-1.5 text-xs font-medium text-primary">
                <Star className="size-3.5 fill-current" /> Em uso como referência
              </span>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                disabled={marcar.isPending}
                onClick={() => marcar.mutate(imagem.id)}
              >
                {marcar.isPending && marcar.variables === imagem.id ? <Loader2 className="animate-spin" /> : <Star />}
                Definir como referência
              </Button>
            )}
          </div>
        ))}
      </div>
      <Pagination pagina={query.data} onChange={setPage} noun={['captura', 'capturas']} />
    </div>
  )
}

function Analises({ eixoId }: { eixoId: number }) {
  const [page, setPage] = useState(0)
  const query = useQuery({
    queryKey: ['eixo', eixoId, 'analises', page],
    queryFn: () => eixos.analises(eixoId, { page, size: 15 }),
    placeholderData: keepPreviousData,
  })
  return (
    <Card className="gap-0 py-0">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-4">Análise</TableHead>
            <TableHead>Classificação</TableHead>
            <TableHead className="text-right">Score</TableHead>
            <TableHead>Regiões apontadas</TableHead>
            <TableHead className="pr-4">Data</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {query.isPending ? (
            <TableSkeleton columns={5} rows={4} />
          ) : query.isError ? (
            <TableMessage columns={5}>
              <ErrorState error={query.error} onRetry={() => query.refetch()} />
            </TableMessage>
          ) : query.data.content.length === 0 ? (
            <TableMessage columns={5}>
              <EmptyState icon={ScanSearch} title="Nenhuma comparação feita" description="As análises começam quando o eixo tem uma referência." />
            </TableMessage>
          ) : (
            query.data.content.map((analise) => (
              <TableRow key={analise.id}>
                <TableCell className="tabular pl-4">#{analise.id}</TableCell>
                <TableCell>
                  <StatusBadge spec={CLASSIFICACAO[analise.classificacao]} />
                </TableCell>
                <TableCell className="tabular text-right">{formatScore(analise.scoreDiferenca)}</TableCell>
                <TableCell className="max-w-96 truncate text-muted-foreground" title={analise.regioesAnomalia.join('; ')}>
                  {analise.regioesAnomalia.join('; ') || '—'}
                </TableCell>
                <TableCell className="pr-4 text-muted-foreground">{formatDateTime(analise.criadoEm)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <Pagination pagina={query.data} onChange={setPage} noun={['análise', 'análises']} />
    </Card>
  )
}

function AlertasDoEixo({ eixoId }: { eixoId: number }) {
  const [page, setPage] = useState(0)
  const query = useQuery({
    queryKey: ['alertas', { eixoId, page }],
    queryFn: () => alertas.listar({ eixoId, page, size: 15 }),
    placeholderData: keepPreviousData,
  })
  return (
    <Card className="gap-0 py-0">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-4">Alerta</TableHead>
            <TableHead>Nível</TableHead>
            <TableHead className="text-right">Score</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="pr-4">Gerado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {query.isPending ? (
            <TableSkeleton columns={5} rows={4} />
          ) : query.isError ? (
            <TableMessage columns={5}>
              <ErrorState error={query.error} onRetry={() => query.refetch()} />
            </TableMessage>
          ) : query.data.content.length === 0 ? (
            <TableMessage columns={5}>
              <EmptyState icon={Bell} title="Nenhum alerta para este eixo" />
            </TableMessage>
          ) : (
            query.data.content.map((alerta) => (
              <TableRow key={alerta.id}>
                <TableCell className="pl-4">
                  <Link to={`/alertas/${alerta.id}`} className="tabular font-medium text-primary hover:underline">
                    #{alerta.id}
                  </Link>
                </TableCell>
                <TableCell>
                  <StatusBadge spec={NIVEL[alerta.nivel]} />
                </TableCell>
                <TableCell className="tabular text-right">{formatScore(alerta.score)}</TableCell>
                <TableCell>
                  <StatusBadge spec={STATUS_ALERTA[alerta.status]} />
                </TableCell>
                <TableCell className="pr-4 text-muted-foreground">{formatRelative(alerta.criadoEm)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <Pagination pagina={query.data} onChange={setPage} noun={['alerta', 'alertas']} />
    </Card>
  )
}

export default function EixoDetalhe() {
  const id = Number(useParams().id)
  const eixo = useQuery({ queryKey: ['eixo', id], queryFn: () => eixos.detalhar(id) })
  // Ordenar por baselineAtiva traz a referência ativa primeiro, mesmo que seja antiga.
  const referencia = useQuery({
    queryKey: ['eixo', id, 'referencia'],
    queryFn: () => eixos.imagens(id, { size: 1, sort: 'baselineAtiva,desc' }),
    select: (pagina) => pagina.content.find((imagem) => imagem.baselineAtiva) ?? null,
  })
  const ultima = useQuery({
    queryKey: ['eixo', id, 'ultima'],
    queryFn: () => eixos.imagens(id, { size: 1 }),
    select: (pagina) => pagina.content[0] ?? null,
  })

  const crumbs = [
    { label: 'Frota', to: '/frota' },
    ...(eixo.data ? [{ label: eixo.data.numeroUk, to: `/frota/vagoes/${eixo.data.vagaoId}` }] : []),
    { label: eixo.data?.identificadorUnico ?? `Eixo ${id}` },
  ]

  if (eixo.isError) {
    return (
      <>
        <PageHeader title="Eixo" crumbs={crumbs} />
        <Card>
          <ErrorState error={eixo.error} onRetry={() => eixo.refetch()} />
        </Card>
      </>
    )
  }

  return (
    <>
      <PageHeader
        crumbs={crumbs}
        title={
          eixo.data ? <span className="font-mono">{eixo.data.identificadorUnico}</span> : <Skeleton className="h-8 w-56" />
        }
        description={
          eixo.data && (
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>Posição {eixo.data.posicao}</span>
              <span aria-hidden="true">·</span>
              <Link to={`/frota/vagoes/${eixo.data.vagaoId}`} className="hover:underline">
                Vagão {eixo.data.numeroUk}
              </Link>
              <span aria-hidden="true">·</span>
              <span>{eixo.data.nomePatioLinha}</span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1.5">
                <StatusDot tone={eixo.data.ativo ? 'success' : 'neutral'} />
                {eixo.data.ativo ? 'Ativo' : 'Desativado'}
              </span>
            </span>
          )
        }
      />

      <div className="mb-4 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="size-4 text-muted-foreground" /> Referência (baseline)
            </CardTitle>
            <CardDescription>Rolamento em bom estado usado como comparação.</CardDescription>
          </CardHeader>
          <CardContent>
            {referencia.isPending ? (
              <Skeleton className="aspect-[4/3]" />
            ) : (
              <EvidenceImage
                src={referencia.data?.urlArquivo}
                label={referencia.data ? `Imagem #${referencia.data.id}` : 'Sem referência definida'}
                caption={referencia.data ? formatDateTime(referencia.data.timestampCaptura) : 'Defina uma na aba Capturas.'}
              />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="size-4 text-muted-foreground" /> Última captura
            </CardTitle>
            <CardDescription>Imagem mais recente recebida da câmera.</CardDescription>
          </CardHeader>
          <CardContent>
            {ultima.isPending ? (
              <Skeleton className="aspect-[4/3]" />
            ) : (
              <EvidenceImage
                src={ultima.data?.urlArquivo}
                label={ultima.data ? `Imagem #${ultima.data.id}` : 'Nenhuma captura'}
                caption={ultima.data ? formatRelative(ultima.data.timestampCaptura) : undefined}
              />
            )}
          </CardContent>
        </Card>
        {eixo.data ? <EnviarImagem eixoId={id} ativo={eixo.data.ativo} /> : <Skeleton className="h-full min-h-64" />}
      </div>

      {eixo.data && (
        <div className="mb-4">
          <VibrationLiveChart eixoId={id} eixoIdentificador={eixo.data.identificadorUnico} />
        </div>
      )}

      <Tabs defaultValue="capturas">
        <TabsList className="mb-3">
          <TabsTrigger value="capturas">Capturas</TabsTrigger>
          <TabsTrigger value="analises">Análises</TabsTrigger>
          <TabsTrigger value="alertas">Alertas</TabsTrigger>
        </TabsList>
        <TabsContent value="capturas">
          <Capturas eixoId={id} />
        </TabsContent>
        <TabsContent value="analises">
          <Analises eixoId={id} />
        </TabsContent>
        <TabsContent value="alertas">
          <AlertasDoEixo eixoId={id} />
        </TabsContent>
      </Tabs>
    </>
  )
}
