import { useState } from 'react'
import type { FormEvent } from 'react'
import logo from '../assets/Logo.png'
import backgroundImage from '../assets/fundo-do-login.jpg'
import { register, type AuthenticatedUser } from '../services/auth'
import './Login.css'

type RegisterProps = {
  onAuthenticated: (user: AuthenticatedUser) => void
  onBackToLogin: () => void
}

export default function Register({ onAuthenticated, onBackToLogin }: RegisterProps) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!nome.trim() || !email.trim() || !password || !confirmation) {
      setError('Preencha todos os campos.')
      return
    }
    if (password.length < 12) {
      setError('A senha deve ter pelo menos 12 caracteres.')
      return
    }
    if (password !== confirmation) {
      setError('As senhas não coincidem.')
      return
    }

    try {
      setIsSubmitting(true)
      const user = await register(nome.trim(), email.trim(), password)
      setPassword('')
      setConfirmation('')
      onAuthenticated(user)
    } catch {
      setError('Não foi possível concluir o cadastro. Verifique os dados e tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <div className="background-decoration" aria-hidden="true" style={{ backgroundImage: `url(${backgroundImage})` }} />
      <section className="login-card" aria-labelledby="register-title">
        <img className="login-logo" src={logo} alt="Logo RailSense" />
        <h1 id="register-title">Criar conta</h1>
        <p className="login-subtitle">Seu perfil inicial será de engenheiro.</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="field-group">
            <label htmlFor="name">Nome completo</label>
            <div className="input-wrapper"><input id="name" name="name" autoComplete="name" value={nome} onChange={(event) => setNome(event.target.value)} required /></div>
          </div>
          <div className="field-group">
            <label htmlFor="register-email">E-mail</label>
            <div className="input-wrapper"><input id="register-email" name="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
          </div>
          <div className="field-group">
            <label htmlFor="register-password">Senha</label>
            <div className="input-wrapper"><input id="register-password" name="password" type="password" autoComplete="new-password" minLength={12} value={password} onChange={(event) => setPassword(event.target.value)} required /></div>
          </div>
          <div className="field-group">
            <label htmlFor="confirmation">Confirmar senha</label>
            <div className="input-wrapper"><input id="confirmation" name="confirmation" type="password" autoComplete="new-password" minLength={12} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required /></div>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="submit" className="submit-button" disabled={isSubmitting}>{isSubmitting ? 'Criando conta...' : 'Criar conta'}</button>
        </form>
        <p className="account-action">Já possui conta? <button type="button" onClick={onBackToLogin}>Entrar</button></p>
      </section>
    </main>
  )
}
