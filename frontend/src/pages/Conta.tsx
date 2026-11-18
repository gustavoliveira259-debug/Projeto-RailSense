import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { auth } from '@/api/client'
import { useUser } from '@/auth/useAuth'
import { PageHeader } from '@/components/PageHeader'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { mensagemDeErro } from '@/lib/errors'
import { initials, SENHA_MINIMA } from '@/lib/format'
import { PAPEL } from '@/lib/labels'

export default function Conta() {
  const user = useUser()
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [erro, setErro] = useState('')

  const alterar = useMutation({
    mutationFn: () => auth.alterarSenha({ senhaAtual, novaSenha }),
    onSuccess: () => {
      toast.success('Senha alterada.')
      setSenhaAtual('')
      setNovaSenha('')
      setConfirmacao('')
    },
    onError: (error) => setErro(mensagemDeErro(error)),
  })

  function submit(event: FormEvent) {
    event.preventDefault()
    setErro('')
    if (novaSenha.length < SENHA_MINIMA) return setErro(`A nova senha precisa de pelo menos ${SENHA_MINIMA} caracteres.`)
    if (novaSenha !== confirmacao) return setErro('A confirmação não confere com a nova senha.')
    if (novaSenha === senhaAtual) return setErro('A nova senha deve ser diferente da atual.')
    alterar.mutate()
  }

  return (
    <>
      <PageHeader title="Minha conta" description="Seus dados de acesso. Para mudar nome ou e-mail, fale com o administrador." />
      <div className="grid max-w-4xl gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <Card>
          <CardContent className="flex items-center gap-4">
            <Avatar className="size-14">
              <AvatarFallback className="bg-primary text-lg font-semibold text-primary-foreground">
                {initials(user.nome)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-medium">{user.nome}</p>
              <p className="truncate text-sm text-muted-foreground">{user.email}</p>
              <p className="mt-1 text-xs text-muted-foreground">{PAPEL[user.papel].label} · {PAPEL[user.papel].descricao}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alterar senha</CardTitle>
            <CardDescription>Troque a senha temporária recebida no primeiro acesso.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="senha-atual">Senha atual</Label>
                <Input id="senha-atual" type="password" autoComplete="current-password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nova-senha">Nova senha</Label>
                <Input id="nova-senha" type="password" autoComplete="new-password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} minLength={SENHA_MINIMA} required />
                <p className="text-xs text-muted-foreground">Mínimo de {SENHA_MINIMA} caracteres. Prefira uma frase longa.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmacao">Confirmar nova senha</Label>
                <Input id="confirmacao" type="password" autoComplete="new-password" value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} required />
              </div>
              {erro && (
                <p role="alert" className="text-sm text-destructive">
                  {erro}
                </p>
              )}
              <Button type="submit" disabled={alterar.isPending || !senhaAtual || !novaSenha || !confirmacao}>
                {alterar.isPending && <Loader2 className="animate-spin" />}
                Alterar senha
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
