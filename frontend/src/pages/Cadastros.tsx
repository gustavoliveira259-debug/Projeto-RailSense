import { useState, type FormEvent, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Database, Loader2, Pencil, Plus } from 'lucide-react'
import { eixos, patiosLinhas, TAMANHO_MAXIMO_PAGINA, vagoes } from '@/api/client'
import type { Eixo, PatioLinha, TipoPatioLinha, Vagao } from '@/api/types'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'
import { Pagination } from '@/components/Pagination'
import { ErrorState, TableMessage, TableSkeleton } from '@/components/QueryStates'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { mensagemDeErro } from '@/lib/errors'
import { TIPO_PATIO } from '@/lib/labels'

// ------------------------------------------------------------ peças comuns

function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  pending,
  onSubmit,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  pending: boolean
  onSubmit: () => void
  children: ReactNode
}) {
  function submit(event: FormEvent) {
    event.preventDefault()
    onSubmit()
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          {children}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Campo({ id, label, children, hint }: { id: string; label: string; children: ReactNode; hint?: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

/** Interruptor de ativo/inativo com rótulo acessível e feedback de erro. */
function AtivoSwitch({ ativo, nome, onChange }: { ativo: boolean; nome: string; onChange: (ativo: boolean) => Promise<unknown> }) {
  const [pending, setPending] = useState(false)
  return (
    <label className="flex items-center gap-2 text-sm">
      <Switch
        checked={ativo}
        disabled={pending}
        aria-label={`${ativo ? 'Desativar' : 'Ativar'} ${nome}`}
        onCheckedChange={async (checked) => {
          setPending(true)
          try {
            await onChange(checked)
            toast.success(`${nome} ${checked ? 'ativado' : 'desativado'}.`)
          } catch (error) {
            toast.error(mensagemDeErro(error))
          } finally {
            setPending(false)
          }
        }}
      />
      <span className={ativo ? '' : 'text-muted-foreground'}>{ativo ? 'Ativo' : 'Inativo'}</span>
    </label>
  )
}

function useSalvar<T>(mutationFn: (dados: T) => Promise<unknown>, chaves: string[][], sucesso: string, aoConcluir: () => void) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      toast.success(sucesso)
      chaves.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }))
      aoConcluir()
    },
    onError: (error) => toast.error(mensagemDeErro(error)),
  })
}

// ------------------------------------------------------------ pátios/linhas

function AbaPatios() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [editando, setEditando] = useState<PatioLinha | 'novo' | null>(null)
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState<TipoPatioLinha>('PATIO')

  const query = useQuery({
    queryKey: ['patios-linhas', { page }],
    queryFn: () => patiosLinhas.listar({ page, size: 20 }),
    placeholderData: keepPreviousData,
  })
  const salvar = useSalvar(
    () => (editando === 'novo' ? patiosLinhas.criar({ nome: nome.trim(), tipo }) : patiosLinhas.atualizar(editando!.id, { nome: nome.trim(), tipo })),
    [['patios-linhas'], ['vagoes']],
    editando === 'novo' ? 'Pátio/linha cadastrado.' : 'Pátio/linha atualizado.',
    () => setEditando(null),
  )

  function abrir(alvo: PatioLinha | 'novo') {
    setEditando(alvo)
    setNome(alvo === 'novo' ? '' : alvo.nome)
    setTipo(alvo === 'novo' ? 'PATIO' : alvo.tipo)
  }

  return (
    <>
      <div className="mb-3 flex justify-end">
        <Button onClick={() => abrir('novo')}>
          <Plus /> Novo pátio ou linha
        </Button>
      </div>
      <Card className="gap-0 py-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4">Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead className="w-12 pr-4">
                <span className="sr-only">Editar</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isPending ? (
              <TableSkeleton columns={4} />
            ) : query.isError ? (
              <TableMessage columns={4}>
                <ErrorState error={query.error} onRetry={() => query.refetch()} />
              </TableMessage>
            ) : query.data.content.length === 0 ? (
              <TableMessage columns={4}>
                <EmptyState icon={Database} title="Nenhum pátio ou linha cadastrado" description="Comece por aqui: todo vagão pertence a um pátio ou linha." />
              </TableMessage>
            ) : (
              query.data.content.map((patio) => (
                <TableRow key={patio.id}>
                  <TableCell className="pl-4 font-medium">{patio.nome}</TableCell>
                  <TableCell>{TIPO_PATIO[patio.tipo]}</TableCell>
                  <TableCell>
                    <AtivoSwitch
                      ativo={patio.ativo}
                      nome={patio.nome}
                      onChange={async (ativo) => {
                        await patiosLinhas.alterarAtivo(patio.id, ativo)
                        await queryClient.invalidateQueries({ queryKey: ['patios-linhas'] })
                      }}
                    />
                  </TableCell>
                  <TableCell className="pr-4">
                    <Button variant="ghost" size="icon-sm" onClick={() => abrir(patio)} aria-label={`Editar ${patio.nome}`}>
                      <Pencil />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <Pagination pagina={query.data} onChange={setPage} noun={['pátio/linha', 'pátios/linhas']} />
      </Card>

      <FormDialog
        open={!!editando}
        onOpenChange={(open) => !open && setEditando(null)}
        title={editando === 'novo' ? 'Novo pátio ou linha' : 'Editar pátio ou linha'}
        pending={salvar.isPending}
        onSubmit={() => nome.trim() && salvar.mutate(undefined)}
      >
        <Campo id="patio-nome" label="Nome">
          <Input id="patio-nome" value={nome} onChange={(e) => setNome(e.target.value)} required autoFocus />
        </Campo>
        <Campo id="patio-tipo" label="Tipo">
          <Select value={tipo} onValueChange={(value) => setTipo(value as TipoPatioLinha)}>
            <SelectTrigger id="patio-tipo" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PATIO">Pátio</SelectItem>
              <SelectItem value="LINHA">Linha</SelectItem>
            </SelectContent>
          </Select>
        </Campo>
      </FormDialog>
    </>
  )
}

// ------------------------------------------------------------------- vagões

function AbaVagoes() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [editando, setEditando] = useState<Vagao | 'novo' | null>(null)
  const [form, setForm] = useState({ numeroUk: '', tipo: '', patioLinhaId: '' })

  const patios = useQuery({
    queryKey: ['patios-linhas', 'todos'],
    queryFn: () => patiosLinhas.listar({ size: TAMANHO_MAXIMO_PAGINA }),
  })
  const query = useQuery({
    queryKey: ['vagoes', { page }],
    queryFn: () => vagoes.listar({ page, size: 20 }),
    placeholderData: keepPreviousData,
  })
  const salvar = useSalvar(
    () => {
      const dados = { numeroUk: form.numeroUk.trim(), tipo: form.tipo.trim() || undefined, patioLinhaId: Number(form.patioLinhaId) }
      return editando === 'novo' ? vagoes.criar(dados) : vagoes.atualizar(editando!.id, dados)
    },
    [['vagoes'], ['vagao'], ['eixos']],
    editando === 'novo' ? 'Vagão cadastrado.' : 'Vagão atualizado.',
    () => setEditando(null),
  )

  function abrir(alvo: Vagao | 'novo') {
    setEditando(alvo)
    setForm(
      alvo === 'novo'
        ? { numeroUk: '', tipo: '', patioLinhaId: '' }
        : { numeroUk: alvo.numeroUk, tipo: alvo.tipo ?? '', patioLinhaId: String(alvo.patioLinhaId) },
    )
  }

  const valido = form.numeroUk.trim() && form.patioLinhaId

  return (
    <>
      <div className="mb-3 flex justify-end">
        <Button onClick={() => abrir('novo')} disabled={patios.data?.content.length === 0}>
          <Plus /> Novo vagão
        </Button>
      </div>
      <Card className="gap-0 py-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4">Número</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Pátio / linha</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead className="w-12 pr-4">
                <span className="sr-only">Editar</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isPending ? (
              <TableSkeleton columns={5} />
            ) : query.isError ? (
              <TableMessage columns={5}>
                <ErrorState error={query.error} onRetry={() => query.refetch()} />
              </TableMessage>
            ) : query.data.content.length === 0 ? (
              <TableMessage columns={5}>
                <EmptyState icon={Database} title="Nenhum vagão cadastrado" />
              </TableMessage>
            ) : (
              query.data.content.map((vagao) => (
                <TableRow key={vagao.id}>
                  <TableCell className="pl-4 font-medium">{vagao.numeroUk}</TableCell>
                  <TableCell>{vagao.tipo || '—'}</TableCell>
                  <TableCell>{vagao.nomePatioLinha}</TableCell>
                  <TableCell>
                    <AtivoSwitch
                      ativo={vagao.ativo}
                      nome={`Vagão ${vagao.numeroUk}`}
                      onChange={async (ativo) => {
                        await vagoes.alterarAtivo(vagao.id, ativo)
                        await queryClient.invalidateQueries({ queryKey: ['vagoes'] })
                      }}
                    />
                  </TableCell>
                  <TableCell className="pr-4">
                    <Button variant="ghost" size="icon-sm" onClick={() => abrir(vagao)} aria-label={`Editar vagão ${vagao.numeroUk}`}>
                      <Pencil />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <Pagination pagina={query.data} onChange={setPage} noun={['vagão', 'vagões']} />
      </Card>

      <FormDialog
        open={!!editando}
        onOpenChange={(open) => !open && setEditando(null)}
        title={editando === 'novo' ? 'Novo vagão' : 'Editar vagão'}
        pending={salvar.isPending}
        onSubmit={() => valido && salvar.mutate(undefined)}
      >
        <Campo id="vagao-numero" label="Número do vagão" hint="Identificação única, ex.: GDT 123456-7.">
          <Input id="vagao-numero" value={form.numeroUk} onChange={(e) => setForm({ ...form, numeroUk: e.target.value })} required autoFocus />
        </Campo>
        <Campo id="vagao-tipo" label="Tipo (opcional)">
          <Input id="vagao-tipo" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} placeholder="Gôndola, Hopper, Tanque…" />
        </Campo>
        <Campo id="vagao-patio" label="Pátio / linha">
          <Select value={form.patioLinhaId} onValueChange={(value) => setForm({ ...form, patioLinhaId: value })}>
            <SelectTrigger id="vagao-patio" className="w-full">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {patios.data?.content.map((patio) => (
                <SelectItem key={patio.id} value={String(patio.id)}>
                  {TIPO_PATIO[patio.tipo]} · {patio.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Campo>
      </FormDialog>
    </>
  )
}

// -------------------------------------------------------------------- eixos

function AbaEixos() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [filtroVagao, setFiltroVagao] = useState('todos')
  const [editando, setEditando] = useState<Eixo | 'novo' | null>(null)
  const [form, setForm] = useState({ vagaoId: '', posicao: '', identificadorUnico: '', sensorDispositivo: '' })

  const listaVagoes = useQuery({
    queryKey: ['vagoes', 'todos'],
    queryFn: () => vagoes.listar({ size: TAMANHO_MAXIMO_PAGINA }),
  })
  const vagaoId = filtroVagao === 'todos' ? undefined : Number(filtroVagao)
  const query = useQuery({
    queryKey: ['eixos', { vagaoId, page }],
    queryFn: () => eixos.listar({ vagaoId, page, size: 20 }),
    placeholderData: keepPreviousData,
  })
  const salvar = useSalvar(
    () => {
      const dados = {
        vagaoId: Number(form.vagaoId),
        posicao: Number(form.posicao),
        identificadorUnico: form.identificadorUnico.trim(),
        sensorDispositivo: form.sensorDispositivo.trim(),
      }
      return editando === 'novo' ? eixos.criar(dados) : eixos.atualizar(editando!.id, dados)
    },
    [['eixos'], ['eixo']],
    editando === 'novo' ? 'Eixo cadastrado.' : 'Eixo atualizado.',
    () => setEditando(null),
  )

  function abrir(alvo: Eixo | 'novo') {
    setEditando(alvo)
    setForm(
      alvo === 'novo'
        ? { vagaoId: vagaoId ? String(vagaoId) : '', posicao: '', identificadorUnico: '', sensorDispositivo: '' }
        : {
            vagaoId: String(alvo.vagaoId),
            posicao: String(alvo.posicao),
            identificadorUnico: alvo.identificadorUnico,
            sensorDispositivo: alvo.sensorDispositivo ?? '',
          },
    )
  }

  // Mesmo formato aceito pelo backend (EixoRequest.sensorDispositivo).
  const sensorValido = /^[A-Za-z0-9._-]{0,64}$/.test(form.sensorDispositivo.trim())
  const valido =
    form.vagaoId && form.identificadorUnico.trim() && Number.isInteger(Number(form.posicao)) && form.posicao !== '' && sensorValido

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Select value={filtroVagao} onValueChange={(value) => { setFiltroVagao(value); setPage(0) }}>
          <SelectTrigger className="w-64" aria-label="Filtrar por vagão">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os vagões</SelectItem>
            {listaVagoes.data?.content.map((vagao) => (
              <SelectItem key={vagao.id} value={String(vagao.id)}>
                {vagao.numeroUk}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => abrir('novo')} disabled={listaVagoes.data?.content.length === 0}>
          <Plus /> Novo eixo
        </Button>
      </div>
      <Card className="gap-0 py-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4">Identificador</TableHead>
              <TableHead>Vagão</TableHead>
              <TableHead className="text-right">Posição</TableHead>
              <TableHead>Sensor</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead className="w-12 pr-4">
                <span className="sr-only">Editar</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isPending ? (
              <TableSkeleton columns={6} />
            ) : query.isError ? (
              <TableMessage columns={6}>
                <ErrorState error={query.error} onRetry={() => query.refetch()} />
              </TableMessage>
            ) : query.data.content.length === 0 ? (
              <TableMessage columns={6}>
                <EmptyState icon={Database} title="Nenhum eixo cadastrado" />
              </TableMessage>
            ) : (
              query.data.content.map((eixo) => (
                <TableRow key={eixo.id}>
                  <TableCell className="pl-4 font-mono text-xs font-medium">{eixo.identificadorUnico}</TableCell>
                  <TableCell>{eixo.numeroUk}</TableCell>
                  <TableCell className="tabular text-right">{eixo.posicao}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{eixo.sensorDispositivo ?? '—'}</TableCell>
                  <TableCell>
                    <AtivoSwitch
                      ativo={eixo.ativo}
                      nome={`Eixo ${eixo.identificadorUnico}`}
                      onChange={async (ativo) => {
                        await eixos.alterarAtivo(eixo.id, ativo)
                        await queryClient.invalidateQueries({ queryKey: ['eixos'] })
                        await queryClient.invalidateQueries({ queryKey: ['eixo', eixo.id] })
                      }}
                    />
                  </TableCell>
                  <TableCell className="pr-4">
                    <Button variant="ghost" size="icon-sm" onClick={() => abrir(eixo)} aria-label={`Editar eixo ${eixo.identificadorUnico}`}>
                      <Pencil />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <Pagination pagina={query.data} onChange={setPage} noun={['eixo', 'eixos']} />
      </Card>

      <FormDialog
        open={!!editando}
        onOpenChange={(open) => !open && setEditando(null)}
        title={editando === 'novo' ? 'Novo eixo' : 'Editar eixo'}
        description="Eixo desativado deixa de aceitar novas imagens."
        pending={salvar.isPending}
        onSubmit={() => valido && salvar.mutate(undefined)}
      >
        <Campo id="eixo-vagao" label="Vagão">
          <Select value={form.vagaoId} onValueChange={(value) => setForm({ ...form, vagaoId: value })}>
            <SelectTrigger id="eixo-vagao" className="w-full">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {listaVagoes.data?.content.map((vagao) => (
                <SelectItem key={vagao.id} value={String(vagao.id)}>
                  {vagao.numeroUk}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Campo>
        <div className="grid grid-cols-[100px_1fr] gap-3">
          <Campo id="eixo-posicao" label="Posição">
            <Input id="eixo-posicao" type="number" min={1} step={1} value={form.posicao} onChange={(e) => setForm({ ...form, posicao: e.target.value })} required />
          </Campo>
          <Campo id="eixo-id" label="Identificador único">
            <Input id="eixo-id" value={form.identificadorUnico} onChange={(e) => setForm({ ...form, identificadorUnico: e.target.value })} placeholder="Ex.: GDT1234567-E1" required />
          </Campo>
        </div>
        <Campo
          id="eixo-sensor"
          label="Sensor de vibração (opcional)"
          hint={
            sensorValido
              ? 'ID do ESP32 neste eixo, igual ao campo "device" que ele publica no MQTT. Deixe vazio se não houver sensor.'
              : 'Use só letras, números, ponto, hífen ou sublinhado.'
          }
        >
          <Input
            id="eixo-sensor"
            value={form.sensorDispositivo}
            onChange={(e) => setForm({ ...form, sensorDispositivo: e.target.value })}
            placeholder="Ex.: esp32-01"
            maxLength={64}
            aria-invalid={!sensorValido}
            className="font-mono"
          />
        </Campo>
      </FormDialog>
    </>
  )
}

const ABAS = ['patios', 'vagoes', 'eixos'] as const

export default function Cadastros() {
  const [params, setParams] = useSearchParams()
  const aba = ABAS.includes(params.get('aba') as (typeof ABAS)[number]) ? params.get('aba')! : 'patios'

  return (
    <>
      <PageHeader
        title="Cadastros"
        description="Estrutura monitorada: pátios e linhas, vagões e eixos. Registros são desativados, nunca excluídos, para preservar o histórico."
      />
      <Tabs value={aba} onValueChange={(value) => setParams({ aba: value }, { replace: true })}>
        <TabsList className="mb-4">
          <TabsTrigger value="patios">Pátios e linhas</TabsTrigger>
          <TabsTrigger value="vagoes">Vagões</TabsTrigger>
          <TabsTrigger value="eixos">Eixos</TabsTrigger>
        </TabsList>
        <TabsContent value="patios">
          <AbaPatios />
        </TabsContent>
        <TabsContent value="vagoes">
          <AbaVagoes />
        </TabsContent>
        <TabsContent value="eixos">
          <AbaEixos />
        </TabsContent>
      </Tabs>
    </>
  )
}
