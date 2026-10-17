import { useId, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react'
import { rolamentosApi, sensoresApi, trensApi, vagoesApi } from '../../api/endpoints'
import type { Rolamento, Sensor, TipoSensor, Trem, Vagao } from '../../api/types'
import { Aviso, Badge, Cabecalho, Carregando, MensagemErro, Vazio } from '../../components/ui'
import { useAction } from '../../hooks/useAction'
import { useApi } from '../../hooks/useApi'
import { ROTULO_SENSOR, formatarDataHora, formatarLeitura, formatarRelativo } from '../../lib/format'

type Aba = 'trens' | 'vagoes' | 'rolamentos' | 'sensores'

const ABAS: { id: Aba; rotulo: string }[] = [
  { id: 'trens', rotulo: 'Trens' },
  { id: 'vagoes', rotulo: 'Vagões' },
  { id: 'rolamentos', rotulo: 'Rolamentos' },
  { id: 'sensores', rotulo: 'Sensores' },
]

/** Sensor que publicou nos últimos 2 minutos está "enviando dados". */
const SENSOR_ONLINE_MS = 2 * 60_000

export default function Estrutura() {
  const [aba, setAba] = useState<Aba>('trens')
  const refs = useRef<Record<Aba, HTMLButtonElement | null>>({ trens: null, vagoes: null, rolamentos: null, sensores: null })

  // Setas do teclado navegam entre as abas (padrão WAI-ARIA de tabs).
  function aoTeclar(evento: KeyboardEvent<HTMLDivElement>) {
    const indice = ABAS.findIndex((a) => a.id === aba)
    let proximo: number | null = null
    if (evento.key === 'ArrowRight') proximo = (indice + 1) % ABAS.length
    if (evento.key === 'ArrowLeft') proximo = (indice - 1 + ABAS.length) % ABAS.length
    if (evento.key === 'Home') proximo = 0
    if (evento.key === 'End') proximo = ABAS.length - 1
    if (proximo === null) return
    evento.preventDefault()
    setAba(ABAS[proximo].id)
    refs.current[ABAS[proximo].id]?.focus()
  }

  return (
    <>
      <Cabecalho
        sobretitulo="Visão da TI"
        titulo="Estrutura e sensores"
        descricao="Cadastre a estrutura monitorada: trem → vagão → rolamento → sensor. Nada é apagado; desativar preserva o histórico."
      />

      <div className="abas" role="tablist" aria-label="Cadastros" onKeyDown={aoTeclar}>
        {ABAS.map((a) => (
          <button
            key={a.id}
            ref={(el) => {
              refs.current[a.id] = el
            }}
            id={`aba-${a.id}`}
            type="button"
            role="tab"
            aria-selected={aba === a.id}
            aria-controls={`painel-${a.id}`}
            tabIndex={aba === a.id ? 0 : -1}
            className={aba === a.id ? 'ativo' : ''}
            onClick={() => setAba(a.id)}
          >
            {a.rotulo}
          </button>
        ))}
      </div>

      <div id={`painel-${aba}`} role="tabpanel" aria-labelledby={`aba-${aba}`} tabIndex={0} className="painel-aba">
        {aba === 'trens' && <AbaTrens />}
        {aba === 'vagoes' && <AbaVagoes />}
        {aba === 'rolamentos' && <AbaRolamentos />}
        {aba === 'sensores' && <AbaSensores />}
      </div>
    </>
  )
}

function SituacaoBotao({ ativo, aoAlternar, pendente }: { ativo: boolean; aoAlternar: () => void; pendente: boolean }) {
  return (
    <button
      type="button"
      className={`botao botao-pequeno ${ativo ? 'botao-perigo-contorno' : 'botao-secundario'}`}
      disabled={pendente}
      onClick={aoAlternar}
    >
      {ativo ? 'Desativar' : 'Ativar'}
    </button>
  )
}

function Situacao({ ativo }: { ativo: boolean }) {
  return ativo ? <Badge tom="normal">Ativo</Badge> : <Badge>Desativado</Badge>
}

/** Formulário de cadastro com validação local, mensagens e estado de envio. */
function FormCadastro({ titulo, children, aoEnviar, pendente, erro, sucesso }: {
  titulo: string
  children: ReactNode
  aoEnviar: () => void
  pendente: boolean
  erro: string | null
  sucesso: string | null
}) {
  function enviar(evento: FormEvent) {
    evento.preventDefault()
    aoEnviar()
  }
  return (
    <section className="painel">
      <h2>{titulo}</h2>
      <form className="formulario formulario-grade" onSubmit={enviar} noValidate>
        {children}
        <div className="formulario-rodape">
          {erro && <MensagemErro erro={erro} />}
          {sucesso && <Aviso tom="sucesso">{sucesso}</Aviso>}
          <button type="submit" className="botao botao-primario" disabled={pendente}>
            {pendente ? 'Salvando...' : 'Cadastrar'}
          </button>
        </div>
      </form>
    </section>
  )
}

function useCadastro<A extends unknown[]>(criar: (...args: A) => Promise<unknown>, aoCriar: () => void) {
  const [erroLocal, setErroLocal] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)
  const acao = useAction(criar)
  return {
    pendente: acao.pendente,
    erro: erroLocal ?? acao.erro,
    sucesso,
    falhar: (mensagem: string) => {
      setSucesso(null)
      setErroLocal(mensagem)
    },
    async enviar(mensagemSucesso: string, ...args: A) {
      setErroLocal(null)
      setSucesso(null)
      const ok = await acao.executar(...args)
      if (ok !== undefined) {
        setSucesso(mensagemSucesso)
        aoCriar()
        return true
      }
      return false
    },
  }
}

function TabelaComAlternancia<T extends { id: number; ativo: boolean }>({ itens, colunas, linha, alternar, vazio }: {
  itens: T[]
  colunas: string[]
  linha: (item: T) => ReactNode
  alternar: (item: T) => Promise<unknown>
  vazio: string
}) {
  const acao = useAction(alternar)
  if (itens.length === 0) return <Vazio>{vazio}</Vazio>
  return (
    <>
      {acao.erro && <MensagemErro erro={acao.erro} />}
      <div className="tabela-rolagem">
        <table className="tabela">
          <thead>
            <tr>
              {colunas.map((c) => (
                <th key={c} scope="col">
                  {c}
                </th>
              ))}
              <th scope="col">Situação</th>
              <th scope="col">
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {itens.map((item) => (
              <tr key={item.id} className={item.ativo ? '' : 'linha-inativa'}>
                {linha(item)}
                <td>
                  <Situacao ativo={item.ativo} />
                </td>
                <td>
                  <SituacaoBotao ativo={item.ativo} pendente={acao.pendente} aoAlternar={() => acao.executar(item)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function Lista<T>({ titulo, consulta, children }: {
  titulo: string
  consulta: { dados?: T; erro?: Error; carregando: boolean; recarregar: () => void }
  children: (dados: T) => ReactNode
}) {
  return (
    <section className="painel">
      <h2>{titulo}</h2>
      {consulta.carregando && <Carregando />}
      {consulta.erro && !consulta.dados && <MensagemErro erro={consulta.erro.message} aoTentarDeNovo={consulta.recarregar} />}
      {consulta.dados !== undefined && children(consulta.dados)}
    </section>
  )
}

function AbaTrens() {
  const trens = useApi<Trem[]>('ti-trens', trensApi.listar, 15_000)
  const [codigo, setCodigo] = useState('')
  const [nome, setNome] = useState('')
  const ids = { codigo: useId(), nome: useId() }
  const cadastro = useCadastro(trensApi.criar, trens.recarregar)

  async function enviar() {
    if (!codigo.trim()) return cadastro.falhar('Informe o código do trem.')
    if (await cadastro.enviar(`Trem ${codigo.trim()} cadastrado.`, { codigo: codigo.trim(), nome: nome.trim() })) {
      setCodigo('')
      setNome('')
    }
  }

  return (
    <>
      <FormCadastro titulo="Novo trem" aoEnviar={enviar} {...cadastro}>
        <div className="campo">
          <label htmlFor={ids.codigo}>Código / prefixo</label>
          <input id={ids.codigo} value={codigo} maxLength={50} onChange={(e) => setCodigo(e.target.value)} placeholder="Ex.: TR-001" />
        </div>
        <div className="campo">
          <label htmlFor={ids.nome}>Nome (opcional)</label>
          <input id={ids.nome} value={nome} maxLength={255} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Composição minério norte" />
        </div>
      </FormCadastro>
      <Lista titulo="Trens cadastrados" consulta={trens}>
        {(dados) => (
          <TabelaComAlternancia
            itens={dados}
            colunas={['Código', 'Nome', 'Vagões', 'Rolamentos']}
            vazio="Nenhum trem cadastrado."
            alternar={async (t) => {
              await trensApi.alterarAtivo(t.id, !t.ativo)
              trens.recarregar()
            }}
            linha={(t) => (
              <>
                <th scope="row">{t.codigo}</th>
                <td>{t.nome ?? '—'}</td>
                <td>{t.totalVagoes}</td>
                <td>{t.totalRolamentos}</td>
              </>
            )}
          />
        )}
      </Lista>
    </>
  )
}

function AbaVagoes() {
  const vagoes = useApi<Vagao[]>('ti-vagoes', () => vagoesApi.listar(), 15_000)
  const trens = useApi<Trem[]>('ti-trens-opcoes', trensApi.listar)
  const [numero, setNumero] = useState('')
  const [tipo, setTipo] = useState('')
  const [tremId, setTremId] = useState('')
  const ids = { numero: useId(), tipo: useId(), trem: useId() }
  const cadastro = useCadastro(vagoesApi.criar, vagoes.recarregar)
  const trensAtivos = (trens.dados ?? []).filter((t) => t.ativo)

  async function enviar() {
    if (!numero.trim()) return cadastro.falhar('Informe o número do vagão.')
    if (!tremId) return cadastro.falhar('Escolha o trem.')
    if (await cadastro.enviar(`Vagão ${numero.trim()} cadastrado.`, { numeroUk: numero.trim(), tipo: tipo.trim(), tremId: Number(tremId) })) {
      setNumero('')
      setTipo('')
    }
  }

  return (
    <>
      <FormCadastro titulo="Novo vagão" aoEnviar={enviar} {...cadastro}>
        <div className="campo">
          <label htmlFor={ids.trem}>Trem</label>
          <select id={ids.trem} value={tremId} onChange={(e) => setTremId(e.target.value)}>
            <option value="">Selecione...</option>
            {trensAtivos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.codigo}
                {t.nome ? ` — ${t.nome}` : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="campo">
          <label htmlFor={ids.numero}>Número do vagão</label>
          <input id={ids.numero} value={numero} maxLength={50} onChange={(e) => setNumero(e.target.value)} placeholder="Ex.: 1234-5" />
        </div>
        <div className="campo">
          <label htmlFor={ids.tipo}>Tipo (opcional)</label>
          <input id={ids.tipo} value={tipo} maxLength={100} onChange={(e) => setTipo(e.target.value)} placeholder="Ex.: Gôndola" />
        </div>
      </FormCadastro>
      <Lista titulo="Vagões cadastrados" consulta={vagoes}>
        {(dados) => (
          <TabelaComAlternancia
            itens={dados}
            colunas={['Número', 'Trem', 'Tipo', 'Rolamentos']}
            vazio="Nenhum vagão cadastrado."
            alternar={async (v) => {
              await vagoesApi.alterarAtivo(v.id, !v.ativo)
              vagoes.recarregar()
            }}
            linha={(v) => (
              <>
                <th scope="row">{v.numeroUk}</th>
                <td>{v.tremCodigo ?? '—'}</td>
                <td>{v.tipo ?? '—'}</td>
                <td>{v.totalRolamentos}</td>
              </>
            )}
          />
        )}
      </Lista>
    </>
  )
}

function AbaRolamentos() {
  const rolamentos = useApi<Rolamento[]>('ti-rolamentos', () => rolamentosApi.listar(), 15_000)
  const vagoes = useApi<Vagao[]>('ti-vagoes-opcoes', () => vagoesApi.listar())
  const [vagaoId, setVagaoId] = useState('')
  const [posicao, setPosicao] = useState('')
  const [identificador, setIdentificador] = useState('')
  const ids = { vagao: useId(), posicao: useId(), identificador: useId() }
  const cadastro = useCadastro(rolamentosApi.criar, rolamentos.recarregar)
  const vagoesAtivos = (vagoes.dados ?? []).filter((v) => v.ativo)

  async function enviar() {
    const pos = Number(posicao)
    if (!vagaoId) return cadastro.falhar('Escolha o vagão.')
    if (!Number.isInteger(pos) || pos < 1) return cadastro.falhar('A posição deve ser um número inteiro a partir de 1.')
    if (!identificador.trim()) return cadastro.falhar('Informe o identificador do rolamento.')
    const ok = await cadastro.enviar(`Rolamento ${identificador.trim()} cadastrado.`, {
      vagaoId: Number(vagaoId),
      posicao: pos,
      identificadorUnico: identificador.trim(),
    })
    if (ok) {
      setPosicao('')
      setIdentificador('')
    }
  }

  return (
    <>
      <FormCadastro titulo="Novo rolamento" aoEnviar={enviar} {...cadastro}>
        <div className="campo">
          <label htmlFor={ids.vagao}>Vagão</label>
          <select id={ids.vagao} value={vagaoId} onChange={(e) => setVagaoId(e.target.value)}>
            <option value="">Selecione...</option>
            {vagoesAtivos.map((v) => (
              <option key={v.id} value={v.id}>
                {v.numeroUk}
                {v.tremCodigo ? ` (${v.tremCodigo})` : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="campo">
          <label htmlFor={ids.posicao}>Posição no vagão</label>
          <input id={ids.posicao} type="number" min={1} step={1} inputMode="numeric" value={posicao} onChange={(e) => setPosicao(e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor={ids.identificador}>Identificador único</label>
          <input id={ids.identificador} value={identificador} maxLength={100} onChange={(e) => setIdentificador(e.target.value)} placeholder="Ex.: 1234-5-E1" />
        </div>
      </FormCadastro>
      <Lista titulo="Rolamentos cadastrados" consulta={rolamentos}>
        {(dados) => (
          <TabelaComAlternancia
            itens={dados}
            colunas={['Identificador', 'Vagão', 'Trem', 'Posição']}
            vazio="Nenhum rolamento cadastrado."
            alternar={async (r) => {
              await rolamentosApi.alterarAtivo(r.id, !r.ativo)
              rolamentos.recarregar()
            }}
            linha={(r) => (
              <>
                <th scope="row">{r.identificadorUnico}</th>
                <td>{r.numeroUk ?? '—'}</td>
                <td>{r.tremCodigo ?? '—'}</td>
                <td>{r.posicao}</td>
              </>
            )}
          />
        )}
      </Lista>
    </>
  )
}

function AbaSensores() {
  const sensores = useApi<Sensor[]>('ti-sensores', sensoresApi.listar, 10_000)
  const rolamentos = useApi<Rolamento[]>('ti-rolamentos-opcoes', () => rolamentosApi.listar())
  const [codigo, setCodigo] = useState('')
  const [tipo, setTipo] = useState<TipoSensor>('VIBRACAO')
  const [eixoId, setEixoId] = useState('')
  const ids = { codigo: useId(), tipo: useId(), eixo: useId() }
  const cadastro = useCadastro(sensoresApi.criar, sensores.recarregar)
  const rolamentosAtivos = (rolamentos.dados ?? []).filter((r) => r.ativo)
  // "Agora" = instante da última atualização da lista, estável entre renders.
  const agora = sensores.atualizadoEm ?? 0

  async function enviar() {
    if (!codigo.trim()) return cadastro.falhar('Informe o código do dispositivo.')
    if (!eixoId) return cadastro.falhar('Escolha o rolamento.')
    if (await cadastro.enviar(`Sensor ${codigo.trim()} cadastrado.`, { codigo: codigo.trim(), tipo, eixoId: Number(eixoId) })) {
      setCodigo('')
    }
  }

  return (
    <>
      <Aviso>
        <strong>Como o dispositivo envia dados:</strong> publica no broker MQTT, no tópico{' '}
        <code>railsense/sensor/vibracao</code> ou <code>railsense/sensor/temperatura</code>, a mensagem{' '}
        <code>{'{"device":"<código>","valor":<número>}'}</code>. O código abaixo deve ser igual ao campo{' '}
        <code>device</code>. Um mesmo dispositivo pode ter um sensor de cada tipo.
      </Aviso>
      <FormCadastro titulo="Novo sensor" aoEnviar={enviar} {...cadastro}>
        <div className="campo">
          <label htmlFor={ids.codigo}>Código do dispositivo</label>
          <input id={ids.codigo} value={codigo} maxLength={100} onChange={(e) => setCodigo(e.target.value)} placeholder="Ex.: esp32-01" spellCheck={false} />
        </div>
        <div className="campo">
          <label htmlFor={ids.tipo}>Tipo</label>
          <select id={ids.tipo} value={tipo} onChange={(e) => setTipo(e.target.value as TipoSensor)}>
            <option value="VIBRACAO">{ROTULO_SENSOR.VIBRACAO}</option>
            <option value="TEMPERATURA">{ROTULO_SENSOR.TEMPERATURA}</option>
          </select>
        </div>
        <div className="campo">
          <label htmlFor={ids.eixo}>Rolamento</label>
          <select id={ids.eixo} value={eixoId} onChange={(e) => setEixoId(e.target.value)}>
            <option value="">Selecione...</option>
            {rolamentosAtivos.map((r) => (
              <option key={r.id} value={r.id}>
                {r.identificadorUnico}
                {r.numeroUk ? ` — vagão ${r.numeroUk}` : ''}
              </option>
            ))}
          </select>
        </div>
      </FormCadastro>
      <Lista titulo="Sensores cadastrados" consulta={sensores}>
        {(dados) => (
          <TabelaComAlternancia
            itens={dados}
            colunas={['Código', 'Tipo', 'Rolamento', 'Último valor', 'Última leitura']}
            vazio="Nenhum sensor cadastrado."
            alternar={async (s) => {
              await sensoresApi.alterarAtivo(s.id, !s.ativo)
              sensores.recarregar()
            }}
            linha={(s) => {
              const online = s.ultimaLeituraEm && agora - new Date(s.ultimaLeituraEm).getTime() < SENSOR_ONLINE_MS
              return (
                <>
                  <th scope="row">
                    <code>{s.codigo}</code>
                  </th>
                  <td>{ROTULO_SENSOR[s.tipo]}</td>
                  <td>
                    {s.eixoIdentificador}
                    {s.numeroUk && <span className="texto-suave"> · {s.numeroUk}</span>}
                  </td>
                  <td>{formatarLeitura(s.ultimoValor, s.tipo)}</td>
                  <td title={formatarDataHora(s.ultimaLeituraEm)}>
                    {online ? <Badge tom="normal">Enviando</Badge> : <Badge>{s.ultimaLeituraEm ? 'Parado' : 'Sem dados'}</Badge>}{' '}
                    <span className="texto-pequeno texto-suave">{formatarRelativo(s.ultimaLeituraEm, agora)}</span>
                  </td>
                </>
              )
            }}
          />
        )}
      </Lista>
    </>
  )
}
