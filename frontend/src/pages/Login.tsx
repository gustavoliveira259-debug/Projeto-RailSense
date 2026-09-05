import { useState } from 'react'
import type { FormEvent } from 'react'
import logo from '../assets/Logo.png'
import backgroundImage from '../assets/fundo-do-login.jpg'
import './Login.css'

/**
 * Ícone de envelope usado no campo de e-mail.
 *
 * O SVG é mantido no componente para evitar a instalação de uma biblioteca
 * adicional apenas para dois ícones da tela de entrada.
 */
function MailIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="input-icon">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  )
}

/** Ícone de cadeado usado no campo de senha. */
function LockIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="input-icon">
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

/** Ícone do botão que mostra ou oculta a senha. */
function EyeIcon({ visible }: { visible: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="eye-icon">
      {visible ? (
        <>
          <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
          <circle cx="12" cy="12" r="2.5" />
        </>
      ) : (
        <>
          <path d="m3 3 18 18" />
          <path d="M10.6 6.2A10.8 10.8 0 0 1 12 6c6.5 0 10 6 10 6a18 18 0 0 1-3.1 3.7M6.2 6.8C3.4 8.4 2 12 2 12s3.5 6 10 6c1.4 0 2.7-.3 3.8-.8" />
        </>
      )}
    </svg>
  )
}

export default function Login() {
  // Os valores ficam somente no estado temporário do formulário.
  // Não salve senha, token ou sessão no localStorage.
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  /**
   * Processa o envio do formulário.
   *
   * Nesta etapa o backend ainda não está conectado. Por isso, a função
   * apenas valida os campos e exibe uma mensagem temporária. A senha não é
   * armazenada nem enviada para um serviço fictício.
   */
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    // A validação no frontend melhora a experiência, mas não substitui
    // a validação definitiva que deverá existir no backend.
    if (!email.trim() || !password) {
      setError('Informe seu e-mail e sua senha.')
      return
    }

    setIsSubmitting(true)

    // Simulação temporária enquanto o endpoint de login não existe.
    window.setTimeout(() => {
      setIsSubmitting(false)
      setError('A autenticação será conectada ao backend na próxima etapa.')
    }, 600)
  }

  return (
    <main className="login-page">
      {/*
        A imagem é apenas decorativa.
        aria-hidden evita que leitores de tela tentem interpretá-la como
        informação essencial para o processo de autenticação.
      */}
      <div
        className="background-decoration"
        aria-hidden="true"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />

      <section className="login-card" aria-labelledby="login-title">
        {/* Logo importada como asset local do projeto. */}
        <img className="login-logo" src={logo} alt="Logo RailSense" />

        <h1 id="login-title">Sistema de Monitoramento de Rolamentos</h1>
        <p className="login-subtitle">
          Monitoramento de vazamentos por visão computacional
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="field-group">
            <label htmlFor="email">E-mail</label>
            <div className="input-wrapper">
              <MailIcon />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                placeholder="engenheiro@ferrovia.com.br"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
          </div>

          <div className="field-group">
            <label htmlFor="password">Senha</label>
            <div className="input-wrapper">
              <LockIcon />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                onClick={() => setShowPassword((current) => !current)}
              >
                <EyeIcon visible={showPassword} />
              </button>
            </div>
          </div>

          <div className="form-options">
            <label className="remember-option">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              <span>Lembrar-me</span>
            </label>

            {/* O fluxo real de recuperação será conectado posteriormente. */}
            <button type="button" className="forgot-password">
              Esqueci minha senha
            </button>
          </div>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="submit-button" disabled={isSubmitting}>
            {isSubmitting ? 'Verificando...' : 'Entrar'}
          </button>
        </form>

        <p className="security-note">
          Acesso restrito a usuários autorizados.
        </p>
      </section>
    </main>
  )
}

