import { useState, type FormEvent } from 'react'
import { authApi } from '../api/endpoints'
import { useAuth } from '../auth/useAuth'
import { Aviso, Cabecalho, MensagemErro } from '../components/ui'
import { useAction } from '../hooks/useAction'
import { ROTULO_PAPEL, SENHA_MINIMA } from '../lib/format'

export default function Conta() {
  const { usuario } = useAuth()
  const [atual, setAtual] = useState('')
  const [nova, setNova] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [erroForm, setErroForm] = useState('')
  const [sucesso, setSucesso] = useState(false)
  const troca = useAction((senhaAtual: string, novaSenha: string) => authApi.alterarSenha(senhaAtual, novaSenha).then(() => true))

  if (!usuario) return null

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setSucesso(false)
    if (!atual) return setErroForm('Informe a senha atual.')
    if (nova.length < SENHA_MINIMA) return setErroForm(`A nova senha deve ter pelo menos ${SENHA_MINIMA} caracteres.`)
    if (nova !== confirmacao) return setErroForm('A confirmação não confere com a nova senha.')
    setErroForm('')
    if (await troca.executar(atual, nova)) {
      setAtual('')
      setNova('')
      setConfirmacao('')
      setSucesso(true)
    }
  }

  return (
    <>
      <Cabecalho sobretitulo="Conta" titulo="Minha conta" />

      <section className="painel painel-estreito" aria-labelledby="titulo-dados">
        <h2 id="titulo-dados">Dados</h2>
        <dl className="lista-definicao">
          <div>
            <dt>Nome</dt>
            <dd>{usuario.nome}</dd>
          </div>
          <div>
            <dt>E-mail</dt>
            <dd>{usuario.email}</dd>
          </div>
          <div>
            <dt>Perfil</dt>
            <dd>{ROTULO_PAPEL[usuario.papel]}</dd>
          </div>
        </dl>
        <p className="texto-suave texto-pequeno">Para mudar nome, e-mail ou perfil, procure a equipe de TI.</p>
      </section>

      <section className="painel painel-estreito" aria-labelledby="titulo-senha">
        <h2 id="titulo-senha">Trocar senha</h2>
        <form className="formulario" onSubmit={enviar} noValidate>
          <div className="campo">
            <label htmlFor="senha-atual">Senha atual</label>
            <input id="senha-atual" type="password" autoComplete="current-password" value={atual} onChange={(e) => setAtual(e.target.value)} />
          </div>
          <div className="campo">
            <label htmlFor="senha-nova">Nova senha</label>
            <input
              id="senha-nova"
              type="password"
              autoComplete="new-password"
              value={nova}
              minLength={SENHA_MINIMA}
              maxLength={256}
              onChange={(e) => setNova(e.target.value)}
              aria-describedby="senha-nova-ajuda"
            />
            <span id="senha-nova-ajuda" className="campo-ajuda">
              Mínimo de {SENHA_MINIMA} caracteres.
            </span>
          </div>
          <div className="campo">
            <label htmlFor="senha-confirmacao">Confirmar nova senha</label>
            <input
              id="senha-confirmacao"
              type="password"
              autoComplete="new-password"
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
            />
          </div>
          {erroForm && <MensagemErro erro={erroForm} />}
          {troca.erro && <MensagemErro erro={troca.erro} />}
          {sucesso && <Aviso tom="sucesso">Senha alterada.</Aviso>}
          <div>
            <button type="submit" className="botao botao-primario" disabled={troca.pendente}>
              {troca.pendente ? 'Salvando...' : 'Trocar senha'}
            </button>
          </div>
        </form>
      </section>
    </>
  )
}
