import { useId, useState, type FormEvent } from 'react'
import { usuariosApi } from '../../api/endpoints'
import type { Papel, Usuario } from '../../api/types'
import { useAuth } from '../../auth/useAuth'
import { Aviso, Badge, Cabecalho, Carregando, MensagemErro, Vazio } from '../../components/ui'
import { useAction } from '../../hooks/useAction'
import { useApi } from '../../hooks/useApi'
import { ROTULO_PAPEL, SENHA_MINIMA, formatarDataHora, gerarSenha } from '../../lib/format'

const PAPEIS: Papel[] = ['ENGENHEIRO', 'GERENTE', 'ADMIN']

export default function Usuarios() {
  const { usuario: eu } = useAuth()
  const { dados, erro, carregando, recarregar } = useApi('usuarios', usuariosApi.listar)

  return (
    <>
      <Cabecalho
        sobretitulo="Visão da TI"
        titulo="Usuários"
        descricao="Só a TI cria contas. Entregue a senha inicial ao usuário por um canal seguro; ele pode trocá-la em “Minha conta”."
      />

      <NovoUsuario aoCriar={recarregar} />

      <section className="painel" aria-labelledby="titulo-lista-usuarios">
        <h2 id="titulo-lista-usuarios">Contas</h2>
        {carregando && <Carregando />}
        {erro && !dados && <MensagemErro erro={erro.message} aoTentarDeNovo={recarregar} />}
        {dados &&
          (dados.length === 0 ? (
            <Vazio>Nenhum usuário.</Vazio>
          ) : (
            <div className="tabela-rolagem">
              <table className="tabela">
                <thead>
                  <tr>
                    <th scope="col">Nome</th>
                    <th scope="col">E-mail</th>
                    <th scope="col">Perfil</th>
                    <th scope="col">Situação</th>
                    <th scope="col">Criado em</th>
                    <th scope="col">
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dados.map((u) => (
                    <LinhaUsuario key={u.id} usuario={u} ehVoce={u.id === eu?.id} aoAlterar={recarregar} />
                  ))}
                </tbody>
              </table>
            </div>
          ))}
      </section>
    </>
  )
}

function CampoSenha({ id, valor, aoMudar, rotulo }: { id: string; valor: string; aoMudar: (v: string) => void; rotulo: string }) {
  const [copiado, setCopiado] = useState(false)
  return (
    <div className="campo">
      <label htmlFor={id}>{rotulo}</label>
      <div className="input-com-botoes">
        <input
          id={id}
          type="text"
          autoComplete="new-password"
          spellCheck={false}
          value={valor}
          minLength={SENHA_MINIMA}
          maxLength={256}
          onChange={(e) => {
            setCopiado(false)
            aoMudar(e.target.value)
          }}
          aria-describedby={`${id}-ajuda`}
        />
        <button
          type="button"
          className="botao botao-secundario"
          onClick={() => {
            setCopiado(false)
            aoMudar(gerarSenha())
          }}
        >
          Gerar
        </button>
        <button
          type="button"
          className="botao botao-fantasma"
          disabled={!valor}
          onClick={() => navigator.clipboard?.writeText(valor).then(() => setCopiado(true), () => setCopiado(false))}
        >
          {copiado ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      <span id={`${id}-ajuda`} className="campo-ajuda">
        Mínimo de {SENHA_MINIMA} caracteres.
      </span>
    </div>
  )
}

function NovoUsuario({ aoCriar }: { aoCriar: () => void }) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [papel, setPapel] = useState<Papel>('ENGENHEIRO')
  const [senha, setSenha] = useState('')
  const [erroForm, setErroForm] = useState('')
  const [criado, setCriado] = useState<string | null>(null)
  const ids = { nome: useId(), email: useId(), papel: useId(), senha: useId() }
  const criacao = useAction(usuariosApi.criar)

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setCriado(null)
    if (nome.trim().length < 2) return setErroForm('Informe o nome.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setErroForm('Informe um e-mail válido.')
    if (senha.length < SENHA_MINIMA) return setErroForm(`A senha deve ter pelo menos ${SENHA_MINIMA} caracteres.`)
    setErroForm('')
    const novo = await criacao.executar({ nome: nome.trim(), email: email.trim(), password: senha, papel })
    if (novo) {
      setCriado(`Conta de ${novo.nome} (${novo.email}) criada.`)
      setNome('')
      setEmail('')
      setSenha('')
      setPapel('ENGENHEIRO')
      aoCriar()
    }
  }

  return (
    <section className="painel" aria-labelledby="titulo-novo-usuario">
      <h2 id="titulo-novo-usuario">Criar conta</h2>
      <form className="formulario formulario-grade" onSubmit={enviar} noValidate>
        <div className="campo">
          <label htmlFor={ids.nome}>Nome</label>
          <input id={ids.nome} value={nome} maxLength={255} onChange={(e) => setNome(e.target.value)} autoComplete="off" />
        </div>
        <div className="campo">
          <label htmlFor={ids.email}>E-mail</label>
          <input id={ids.email} type="email" value={email} maxLength={255} onChange={(e) => setEmail(e.target.value)} autoComplete="off" />
        </div>
        <div className="campo">
          <label htmlFor={ids.papel}>Perfil</label>
          <select id={ids.papel} value={papel} onChange={(e) => setPapel(e.target.value as Papel)}>
            {PAPEIS.map((p) => (
              <option key={p} value={p}>
                {ROTULO_PAPEL[p]}
              </option>
            ))}
          </select>
        </div>
        <CampoSenha id={ids.senha} rotulo="Senha inicial" valor={senha} aoMudar={setSenha} />
        <div className="formulario-rodape">
          {erroForm && <MensagemErro erro={erroForm} />}
          {criacao.erro && <MensagemErro erro={criacao.erro} />}
          {criado && <Aviso tom="sucesso">{criado}</Aviso>}
          <button type="submit" className="botao botao-primario" disabled={criacao.pendente}>
            {criacao.pendente ? 'Criando...' : 'Criar conta'}
          </button>
        </div>
      </form>
    </section>
  )
}

function LinhaUsuario({ usuario, ehVoce, aoAlterar }: { usuario: Usuario; ehVoce: boolean; aoAlterar: () => void }) {
  const [redefinindo, setRedefinindo] = useState(false)
  const [senha, setSenha] = useState('')
  const [erroSenha, setErroSenha] = useState('')
  const [senhaOk, setSenhaOk] = useState(false)
  const idSenha = useId()
  const idPapel = useId()
  const acao = useAction(async (tipo: 'papel' | 'ativo' | 'senha', valor: string | boolean) => {
    if (tipo === 'papel') await usuariosApi.alterarPapel(usuario.id, valor as Papel)
    else if (tipo === 'ativo') await usuariosApi.alterarAtivo(usuario.id, valor as boolean)
    else await usuariosApi.redefinirSenha(usuario.id, valor as string)
    return true
  })

  async function alterar(tipo: 'papel' | 'ativo', valor: string | boolean) {
    if (await acao.executar(tipo, valor)) aoAlterar()
  }

  async function redefinir(evento: FormEvent) {
    evento.preventDefault()
    setSenhaOk(false)
    if (senha.length < SENHA_MINIMA) return setErroSenha(`A senha deve ter pelo menos ${SENHA_MINIMA} caracteres.`)
    setErroSenha('')
    if (await acao.executar('senha', senha)) {
      setSenhaOk(true)
      setSenha('')
    }
  }

  return (
    <>
      <tr className={usuario.ativo ? '' : 'linha-inativa'}>
        <th scope="row">
          {usuario.nome}
          {ehVoce && <span className="texto-suave"> (você)</span>}
        </th>
        <td>{usuario.email}</td>
        <td>
          <label htmlFor={idPapel} className="sr-only">
            Perfil de {usuario.nome}
          </label>
          <select
            id={idPapel}
            value={usuario.papel}
            disabled={ehVoce || acao.pendente}
            title={ehVoce ? 'Você não pode alterar o próprio perfil.' : undefined}
            onChange={(e) => alterar('papel', e.target.value)}
          >
            {PAPEIS.map((p) => (
              <option key={p} value={p}>
                {ROTULO_PAPEL[p]}
              </option>
            ))}
          </select>
        </td>
        <td>{usuario.ativo ? <Badge tom="normal">Ativo</Badge> : <Badge>Desativado</Badge>}</td>
        <td>{formatarDataHora(usuario.criadoEm)}</td>
        <td>
          <div className="linha-botoes linha-botoes-fim">
            <button
              type="button"
              className="botao botao-fantasma botao-pequeno"
              disabled={ehVoce || acao.pendente}
              aria-expanded={redefinindo}
              onClick={() => {
                setRedefinindo((v) => !v)
                setSenhaOk(false)
              }}
            >
              Redefinir senha
            </button>
            <button
              type="button"
              className={`botao botao-pequeno ${usuario.ativo ? 'botao-perigo-contorno' : 'botao-secundario'}`}
              disabled={ehVoce || acao.pendente}
              title={ehVoce ? 'Você não pode desativar a própria conta.' : undefined}
              onClick={() => alterar('ativo', !usuario.ativo)}
            >
              {usuario.ativo ? 'Desativar' : 'Reativar'}
            </button>
          </div>
        </td>
      </tr>
      {(redefinindo || acao.erro) && (
        <tr className="linha-extra">
          <td colSpan={6}>
            {acao.erro && <MensagemErro erro={acao.erro} />}
            {redefinindo && (
              <form className="formulario formulario-linha" onSubmit={redefinir} noValidate>
                <CampoSenha id={idSenha} rotulo={`Nova senha de ${usuario.nome}`} valor={senha} aoMudar={setSenha} />
                <button type="submit" className="botao botao-primario" disabled={acao.pendente}>
                  Salvar senha
                </button>
                {erroSenha && <MensagemErro erro={erroSenha} />}
                {senhaOk && <Aviso tom="sucesso">Senha redefinida. Entregue-a ao usuário por um canal seguro.</Aviso>}
              </form>
            )}
          </td>
        </tr>
      )}
    </>
  )
}
