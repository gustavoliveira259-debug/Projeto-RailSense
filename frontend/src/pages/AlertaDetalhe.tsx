import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CheckCircle2, ClipboardPlus, FileSearch, History, Loader2, ScanSearch, XCircle } from 'lucide-react'
import { alertas, eixos, ordens } from '@/api/client'
import type { AlertaDetalhe as AlertaDetalheType, DecisaoTipo, Prioridade } from '@/api/types'
import { BearingLiveChart } from '@/components/charts/BearingLiveChart'
import { VibrationLiveChart } from '@/components/charts/VibrationLiveChart'
import { EmptyState } from '@/components/EmptyState'
import { EvidenceImage } from '@/components/EvidenceImage'
import { PageHeader } from '@/components/PageHeader'
import { ErrorState } from '@/components/QueryStates'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { mensagemDeErro } from '@/lib/errors'
import { formatDateTime, formatRelative, formatScore } from '@/lib/format'
import { CLASSIFICACAO, NIVEL, PRIORIDADE, PRIORIDADE_PADRAO, STATUS_ALERTA, TIPO_EVIDENCIA } from '@/lib/labels'

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  )
}

function PainelDecisao({ alerta }: { alerta: AlertaDetalheType }) {
  const queryClient = useQueryClient()
  const [motivo, setMotivo] = useState('')
  const decidir = useMutation({
    mutationFn: (decisao: DecisaoTipo) => alertas.decidir(alerta.id, { decisao, motivo: motivo.trim() || undefined }),
    onSuccess: (_, decisao) => {
      toast.success(decisao === 'CONFIRMADO' ? 'Vazamento confirmado.' : 'Alerta marcado como falso positivo.')
      queryClient.invalidateQueries({ queryKey: ['alertas'] })
      queryClient.invalidateQueries({ queryKey: ['alerta', alerta.id] })
    },
    onError: (error) => toast.error(mensagemDeErro(error)),
  })

  return (
    <Card className="border-warning/40 ring-warning/30">
      <CardHeader>
        <CardTitle>Decisão do engenheiro</CardTitle>
        <CardDescription>
          Compare a captura atual com a referência e registre sua conclusão. A decisão fica registrada com seu nome e
          não pode ser desfeita.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="motivo">Justificativa (opcional)</Label>
          <Textarea
            id="motivo"
            value={motivo}
            onChange={(event) => setMotivo(event.target.value)}
            maxLength={2000}
            rows={3}
            placeholder="Ex.: acúmulo de graxa visível na vedação externa do rolamento."
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            variant="destructive"
            className="h-9 bg-critical text-white hover:bg-critical/90 dark:bg-critical dark:text-black"
            disabled={decidir.isPending}
            onClick={() => decidir.mutate('CONFIRMADO')}
          >
            {decidir.isPending && decidir.variables === 'CONFIRMADO' ? (
              <Loader2 className="animate-spin" />
            ) : (
              <CheckCircle2 />
            )}
            Confirmar vazamento
          </Button>
          <Button
            variant="outline"
            className="h-9"
            disabled={decidir.isPending}
            onClick={() => decidir.mutate('FALSO_POSITIVO')}
          >
            {decidir.isPending && decidir.variables === 'FALSO_POSITIVO' ? (
              <Loader2 className="animate-spin" />
            ) : (
              <XCircle />
            )}
            Falso positivo
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function AbrirOrdem({ alerta }: { alerta: AlertaDetalheType }) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [titulo, setTitulo] = useState(`Substituir vedação do rolamento — ${alerta.eixoIdentificador}`)
  const [prioridade, setPrioridade] = useState<Prioridade>(PRIORIDADE_PADRAO[alerta.nivel])
  const criar = useMutation({
    mutationFn: () => ordens.criar({ alertaId: alerta.id, titulo: titulo.trim(), prioridade }),
    onSuccess: (ordem) => {
      toast.success(`Ordem de manutenção #${ordem.id} aberta.`)
      queryClient.invalidateQueries({ queryKey: ['ordens'] })
      setOpen(false)
    },
    onError: (error) => toast.error(mensagemDeErro(error)),
  })

  function submit(event: FormEvent) {
    event.preventDefault()
    if (titulo.trim()) criar.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <ClipboardPlus /> Abrir ordem de manutenção
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Nova ordem de manutenção</DialogTitle>
            <DialogDescription>
              Vinculada ao alerta #{alerta.id} no eixo {alerta.eixoIdentificador}. Cada alerta aceita uma ordem ativa.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="titulo">Título</Label>
            <Input id="titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={255} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prioridade">Prioridade</Label>
            <Select value={prioridade} onValueChange={(value) => setPrioridade(value as Prioridade)}>
              <SelectTrigger id="prioridade" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(PRIORIDADE) as Prioridade[]).map((p) => (
                  <SelectItem key={p} value={p}>
                    {PRIORIDADE[p].label}
                    {p === PRIORIDADE_PADRAO[alerta.nivel] && ' (sugerida pelo nível)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={criar.isPending || !titulo.trim()}>
              {criar.isPending && <Loader2 className="animate-spin" />}
              Abrir ordem
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function AlertaDetalhe() {
  const id = Number(useParams().id)
  const query = useQuery({
    queryKey: ['alerta', id],
    queryFn: () => alertas.detalhar(id),
    enabled: Number.isFinite(id),
  })
  const eixo = useQuery({
    queryKey: ['eixo', query.data?.eixoId],
    queryFn: () => eixos.detalhar(query.data!.eixoId),
    enabled: !!query.data,
  })

  const crumbs = [{ label: 'Alertas', to: '/alertas' }, { label: `#${id}` }]

  if (query.isPending) {
    return (
      <>
        <PageHeader title={<Skeleton className="h-8 w-48" />} crumbs={crumbs} />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </>
    )
  }
  if (query.isError) {
    return (
      <>
        <PageHeader title={`Alerta #${id}`} crumbs={crumbs} />
        <Card>
          <ErrorState error={query.error} onRetry={() => query.refetch()} />
        </Card>
      </>
    )
  }

  const alerta = query.data
  const ordemEvidencias = ['BASELINE', 'ATUAL', 'HEATMAP'] as const
  const evidencias = [...alerta.evidencias].sort((a, b) => ordemEvidencias.indexOf(a.tipo) - ordemEvidencias.indexOf(b.tipo))

  return (
    <>
      <PageHeader
        crumbs={crumbs}
        title={
          <span className="flex flex-wrap items-center gap-3">
            Alerta #{alerta.id}
            <StatusBadge spec={NIVEL[alerta.nivel]} />
            <StatusBadge spec={STATUS_ALERTA[alerta.status]} />
          </span>
        }
        description={`Gerado ${formatRelative(alerta.criadoEm)} · ${formatDateTime(alerta.criadoEm)}`}
        actions={alerta.status === 'CONFIRMADO' && <AbrirOrdem alerta={alerta} />}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Evidências</CardTitle>
              <CardDescription>
                Imagens congeladas no momento do alerta. Clique para ampliar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {evidencias.length === 0 ? (
                <EmptyState icon={FileSearch} title="Nenhuma evidência registrada para este alerta" />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {evidencias.map((evidencia) => (
                    <EvidenceImage
                      key={`${evidencia.tipo}-${evidencia.imagemId}`}
                      src={evidencia.urlArquivo}
                      label={TIPO_EVIDENCIA[evidencia.tipo]}
                      caption={`Imagem #${evidencia.imagemId}`}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <VibrationLiveChart eixoId={alerta.eixoId} eixoIdentificador={alerta.eixoIdentificador} />

          <BearingLiveChart eixoId={alerta.eixoId} eixoIdentificador={alerta.eixoIdentificador} alertaEm={alerta.criadoEm} />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScanSearch className="size-4 text-muted-foreground" /> Regiões de anomalia
              </CardTitle>
              <CardDescription>Descrição devolvida pelo modelo de visão computacional.</CardDescription>
            </CardHeader>
            <CardContent>
              {alerta.regioesAnomalia.length === 0 ? (
                <p className="text-sm text-muted-foreground">O modelo não descreveu regiões específicas.</p>
              ) : (
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  {alerta.regioesAnomalia.map((regiao, index) => (
                    <li key={index}>{regiao}</li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {alerta.status === 'EM_ANALISE' && <PainelDecisao alerta={alerta} />}

          <Card>
            <CardHeader>
              <CardTitle>Detalhes da análise</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="divide-y">
                <Campo label="Classificação">
                  {alerta.classificacao ? <StatusBadge spec={CLASSIFICACAO[alerta.classificacao]} /> : '—'}
                </Campo>
                <Campo label="Score de diferença">
                  <span className="tabular">{formatScore(alerta.score)}</span>
                </Campo>
                <Campo label="Eixo">
                  <Link to={`/frota/eixos/${alerta.eixoId}`} className="font-mono text-xs text-primary hover:underline">
                    {alerta.eixoIdentificador}
                  </Link>
                </Campo>
                <Campo label="Vagão">
                  {eixo.data ? (
                    <Link to={`/frota/vagoes/${eixo.data.vagaoId}`} className="text-primary hover:underline">
                      {eixo.data.numeroUk}
                    </Link>
                  ) : (
                    <Skeleton className="h-4 w-24" />
                  )}
                </Campo>
                <Campo label="Pátio / linha">{eixo.data?.nomePatioLinha ?? <Skeleton className="h-4 w-24" />}</Campo>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="size-4 text-muted-foreground" /> Histórico de decisões
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alerta.decisoes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma decisão registrada ainda.</p>
              ) : (
                <ol className="space-y-4 border-l pl-4">
                  {alerta.decisoes.map((decisao) => (
                    <li key={decisao.id} className="relative">
                      <span className="absolute top-1.5 -left-[21px] size-2.5 rounded-full border-2 border-card bg-primary" />
                      <p className="text-sm">
                        <span className="font-medium">{decisao.usuarioNome}</span>{' '}
                        {decisao.decisao === 'CONFIRMADO' ? 'confirmou o vazamento' : 'marcou como falso positivo'}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(decisao.criadoEm)}</p>
                      {decisao.motivo && (
                        <p className="mt-1.5 rounded-md bg-muted/60 px-3 py-2 text-sm">{decisao.motivo}</p>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
