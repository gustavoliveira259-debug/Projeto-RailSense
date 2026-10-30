import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from 'lucide-react'
import { LogoMark } from '@/components/LogoMark'
import { auth } from '@/api/client'
import { homeDoPapel, useAuth } from '@/auth/useAuth'
import { BearingParticles } from '@/components/BearingParticles'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ApiError } from '@/services/http'

export default function Login() {
  const { user, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  // Os valores ficam só no estado do formulário. Nunca grave senha ou sessão no localStorage.
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (user) return <Navigate to={homeDoPapel(user.papel)} replace />

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!email.trim() || !password) {
      setError('Informe seu e-mail e sua senha.')
      return
    }

    try {
      setSubmitting(true)
      const sessao = await auth.login(email.trim(), password)
      setPassword('')
      signIn(sessao)
      const from = (location.state as { from?: string } | null)?.from
      navigate(from && from !== '/login' ? from : homeDoPapel(sessao.papel), { replace: true })
    } catch (err) {
      // Mensagem genérica de propósito: não revela se o e-mail existe.
      setError(
        err instanceof ApiError && err.status === 429
          ? 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
          : err instanceof ApiError
            ? 'E-mail ou senha inválidos.'
            : 'Sem conexão com o servidor. Verifique sua rede.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    // A tela de entrada é sempre escura, independentemente do tema escolhido no sistema.
    <main className="dark relative min-h-svh overflow-hidden bg-[#03050a] text-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(40rem_30rem_at_75%_45%,rgb(139_108_246/0.18),transparent_70%),radial-gradient(30rem_24rem_at_85%_70%,rgb(46_230_214/0.10),transparent_70%)]"
      />
      <BearingParticles className="pointer-events-none absolute top-1/2 right-[-20%] h-[90vh] w-[90vh] -translate-y-1/2 opacity-40 lg:right-[-4%] lg:h-[min(92vh,880px)] lg:w-[min(58vw,880px)] lg:opacity-100" />

      <header className="relative z-10 flex items-center justify-between px-6 py-6 sm:px-10 lg:px-16">
        <div className="flex items-center gap-2.5">
          <LogoMark />
          <span className="text-lg font-semibold tracking-tight">RailSense</span>
        </div>
        <span className="hidden items-center gap-2 text-xs tracking-wider text-muted-foreground uppercase sm:flex">
          <ShieldCheck className="size-4 text-glow" aria-hidden="true" /> Acesso restrito
        </span>
      </header>

      <section className="relative z-10 flex min-h-[calc(100svh-5rem)] flex-col justify-center px-6 pb-12 sm:px-10 lg:px-16">
        <div className="max-w-xl space-y-6">
          <h1 className="text-5xl leading-[1.02] font-medium tracking-[-0.035em] sm:text-6xl lg:text-7xl">
            Monitore cada rolamento.
          </h1>
          <p className="text-xs font-semibold tracking-[0.18em] text-warning uppercase">
            Detecção de vazamento por visão computacional
          </p>
          <p className="max-w-md text-base text-muted-foreground">
            Cada captura é comparada com a referência do eixo. Desvios viram alertas classificados por gravidade, decididos
            por engenheiros e convertidos em ordens de manutenção.
          </p>

          <form
            onSubmit={handleSubmit}
            noValidate
            className="max-w-md space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-2xl backdrop-blur-xl"
          >
            <div className="space-y-2">
              <Label htmlFor="email">E-mail corporativo</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  placeholder="nome@empresa.com.br"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-11 rounded-xl pl-10"
                  aria-invalid={!!error || undefined}
                  autoFocus
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-11 rounded-xl pr-11 pl-10"
                  aria-invalid={!!error || undefined}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" role="alert">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="h-11 w-full text-sm tracking-wide" disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin" /> : null}
              {submitting ? 'Verificando…' : 'ENTRAR NO SISTEMA'}
              {!submitting && <ArrowRight />}
            </Button>

            <p className="text-xs text-muted-foreground">
              Não tem acesso ou esqueceu a senha? Fale com o administrador do sistema — as contas são criadas somente pela
              equipe responsável.
            </p>
          </form>
        </div>
      </section>
    </main>
  )
}
