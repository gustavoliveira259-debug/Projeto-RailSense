import { useState, type FormEvent } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Copy, KeyRound, Loader2, MoreHorizontal, Pencil, Plus, RefreshCw, ShieldCheck, UserCheck, UserX, Users } from 'lucide-react'
import { usuarios } from '@/api/client'
import type { Papel, Usuario } from '@/api/types'
import { useUser } from '@/auth/useAuth'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'
import { Pagination } from '@/components/Pagination'
import { ErrorState, TableMessage, TableSkeleton } from '@/components/QueryStates'
import { StatusDot } from '@/components/StatusBadge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { mensagemDeErro } from '@/lib/errors'
import { formatDateTime, gerarSenhaTemporaria, initials, SENHA_MINIMA } from '@/lib/format'
import { PAPEL } from '@/lib/labels'

type Modal =
  | { tipo: 'criar' }
  | { tipo: 'editar'; usuario: Usuario }
  | { tipo: 'papel'; usuario: Usuario }
  | { tipo: 'senha'; usuario: Usuario }
  | { tipo: 'ativo'; usuario: Usuario }

/** Campo de senha temporária: gera, mostra e copia para entregar ao usuário. */
function SenhaTemporaria({ value, onChange }: { value: string; onChange: (senha: string) => void }) {
  return (
    <div className="space-y-2">
      <Label htmlFor="senha">Senha temporária</Label>
      <div className="flex gap-2">
        <Input
          id="senha"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          minLength={SENHA_MINIMA}
          className="font-mono"
          autoComplete="new-password"
          required
        />
        <Button type="button" variant="outline" size="icon" onClick={() => onChange(gerarSenhaTemporaria())} aria-label="Gerar outra senha">
          <RefreshCw />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Copiar senha"
          onClick={() =>
            navigator.clipboard
              .writeText(value)
              .then(() => toast.success('Senha copiada.'))
              .catch(() => toast.error('Não foi possível copiar. Selecione e copie manualmente.'))
          }
        >
          <Copy />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Mínimo de {SENHA_MINIMA} caracteres. Entregue por um canal seguro e peça para a pessoa trocá-la em “Minha conta”.
      </p>
    </div>
  )
}

function SeletorPapel({ value, onChange }: { value: Papel; onChange: (papel: Papel) => void }) {
  return (
    <div className="space-y-2">
      <Label htmlFor="papel">Perfil de acesso</Label>
      <Select value={value} onValueChange={(v) => onChange(v as Papel)}>
        <SelectTrigger id="papel" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(PAPEL) as Papel[]).map((papel) => (
            <SelectItem key={papel} value={papel}>
              {PAPEL[papel].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">{PAPEL[value].descricao}</p>
    </div>
  )
}

export default function Usuarios() {
  const eu = useUser()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [modal, setModal] = useState<Modal | null>(null)
  const [form, setForm] = useState({ nome: '', email: '', papel: 'ENGENHEIRO' as Papel, senha: '' })

  const query = useQuery({
    queryKey: ['usuarios', { page }],
    queryFn: () => usuarios.listar({ page, size: 20 }),
    placeholderData: keepPreviousData,
  })

  const executar = useMutation({
    mutationFn: async (m: Modal) => {
      switch (m.tipo) {
        case 'criar':
          return usuarios.criar({ nome: form.nome.trim(), email: form.email.trim(), password: form.senha, papel: form.papel })
        case 'editar':
          return usuarios.atualizar(m.usuario.id, { nome: form.nome.trim(), email: form.email.trim() })
        case 'papel':
          return usuarios.alterarPapel(m.usuario.id, form.papel)
        case 'senha':
          return usuarios.redefinirSenha(m.usuario.id, form.senha)
        case 'ativo':
          return usuarios.alterarAtivo(m.usuario.id, !m.usuario.ativo)
      }
    },
    onSuccess: (_, m) => {
      const mensagens: Record<Modal['tipo'], string> = {
        criar: `Conta de ${form.nome.trim()} criada.`,
        editar: 'Dados atualizados.',
        papel: 'Perfil de acesso alterado. Vale a partir da próxima ação do usuário.',
        senha: 'Senha redefinida.',
        ativo: m.tipo === 'ativo' && m.usuario.ativo ? 'Conta desativada. A sessão dela foi encerrada.' : 'Conta reativada.',
      }
      toast.success(mensagens[m.tipo])
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      setModal(null)
    },
    onError: (error) => toast.error(mensagemDeErro(error)),
  })

  function abrir(m: Modal) {
    const u = 'usuario' in m ? m.usuario : null
    setForm({
      nome: u?.nome ?? '',
      email: u?.email ?? '',
      papel: u?.papel ?? 'ENGENHEIRO',
      senha: m.tipo === 'criar' || m.tipo === 'senha' ? gerarSenhaTemporaria() : '',
    })
    setModal(m)
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!modal) return
    if ((modal.tipo === 'criar' || modal.tipo === 'senha') && form.senha.length < SENHA_MINIMA) {
      toast.error(`A senha precisa de pelo menos ${SENHA_MINIMA} caracteres.`)
      return
    }
    executar.mutate(modal)
  }

  const titulos: Record<Modal['tipo'], string> = {
    criar: 'Nova conta',
    editar: 'Editar dados',
    papel: 'Alterar perfil de acesso',
    senha: 'Redefinir senha',
    ativo: modal?.tipo === 'ativo' && modal.usuario.ativo ? 'Desativar conta' : 'Reativar conta',
  }

  return (
    <>
      <PageHeader
        title="Usuários"
        description="Contas de acesso ao RailSense. Somente administradores criam contas — não há cadastro público."
        actions={
          <Button onClick={() => abrir({ tipo: 'criar' })}>
            <Plus /> Nova conta
          </Button>
        }
      />

      <Card className="gap-0 py-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4">Usuário</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="w-12 pr-4">
                <span className="sr-only">Ações</span>
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
                <EmptyState icon={Users} title="Nenhum usuário" />
              </TableMessage>
            ) : (
              query.data.content.map((usuario) => {
                const souEu = usuario.id === eu.id
                return (
                  <TableRow key={usuario.id} className={usuario.ativo ? '' : 'text-muted-foreground'}>
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback className="text-xs">{initials(usuario.nome)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 font-medium text-foreground">
                            {usuario.nome}
                            {souEu && <Badge variant="secondary">Você</Badge>}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">{usuario.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5">
                        {usuario.papel === 'ADMIN' && <ShieldCheck className="size-3.5 text-primary" aria-hidden="true" />}
                        {PAPEL[usuario.papel].label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-2">
                        <StatusDot tone={usuario.ativo ? 'success' : 'neutral'} />
                        {usuario.ativo ? 'Ativa' : 'Desativada'}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDateTime(usuario.criadoEm)}</TableCell>
                    <TableCell className="pr-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label={`Ações para ${usuario.nome}`}>
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem onSelect={() => abrir({ tipo: 'editar', usuario })}>
                            <Pencil /> Editar dados
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => abrir({ tipo: 'senha', usuario })}>
                            <KeyRound /> Redefinir senha
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled={souEu} onSelect={() => abrir({ tipo: 'papel', usuario })}>
                            <ShieldCheck /> Alterar perfil
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            disabled={souEu}
                            variant={usuario.ativo ? 'destructive' : 'default'}
                            onSelect={() => abrir({ tipo: 'ativo', usuario })}
                          >
                            {usuario.ativo ? <UserX /> : <UserCheck />}
                            {usuario.ativo ? 'Desativar conta' : 'Reativar conta'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
        <Pagination pagina={query.data} onChange={setPage} noun={['usuário', 'usuários']} />
      </Card>
      <p className="mt-3 text-xs text-muted-foreground">
        Por segurança, você não pode alterar o próprio perfil nem desativar a própria conta.
      </p>

      <Dialog open={!!modal} onOpenChange={(open) => !open && setModal(null)}>
        <DialogContent>
          {modal && (
            <form onSubmit={submit} className="space-y-4">
              <DialogHeader>
                <DialogTitle>{titulos[modal.tipo]}</DialogTitle>
                {'usuario' in modal && (
                  <DialogDescription>
                    {modal.usuario.nome} · {modal.usuario.email}
                  </DialogDescription>
                )}
              </DialogHeader>

              {(modal.tipo === 'criar' || modal.tipo === 'editar') && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome completo</Label>
                    <Input id="nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} minLength={2} required autoFocus />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail corporativo</Label>
                    <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                  </div>
                </>
              )}
              {(modal.tipo === 'criar' || modal.tipo === 'papel') && (
                <SeletorPapel value={form.papel} onChange={(papel) => setForm({ ...form, papel })} />
              )}
              {(modal.tipo === 'criar' || modal.tipo === 'senha') && (
                <SenhaTemporaria value={form.senha} onChange={(senha) => setForm({ ...form, senha })} />
              )}
              {modal.tipo === 'ativo' && (
                <p className="text-sm text-muted-foreground">
                  {modal.usuario.ativo
                    ? 'A pessoa perde o acesso imediatamente e a sessão aberta é encerrada. O histórico de decisões e ordens dela é mantido.'
                    : 'A pessoa volta a conseguir entrar com a senha atual.'}
                </p>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setModal(null)}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant={modal.tipo === 'ativo' && modal.usuario.ativo ? 'destructive' : 'default'}
                  disabled={executar.isPending}
                >
                  {executar.isPending && <Loader2 className="animate-spin" />}
                  {modal.tipo === 'criar' ? 'Criar conta' : modal.tipo === 'ativo' ? titulos.ativo : 'Salvar'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
