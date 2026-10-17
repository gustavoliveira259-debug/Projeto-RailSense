import { useId, useRef, useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { alertasApi, imagensApi, rolamentosApi } from '../api/endpoints'
import type { Classificacao, Imagem, ImagemEnviada } from '../api/types'
import { podeOperar, useAuth } from '../auth/useAuth'
import { AlertaList } from '../components/AlertaList'
import { LineChart } from '../components/LineChart'
import {
  AtualizacaoAutomatica,
  Aviso,
  Badge,
  Cabecalho,
  Carregando,
  MensagemErro,
  Metrica,
  Migalhas,
  StatusBadge,
  Vazio,
} from '../components/ui'
import { useAction } from '../hooks/useAction'
import { useApi } from '../hooks/useApi'
import { useIdParam } from '../hooks/useIdParam'
import {
  ROTULO_CLASSIFICACAO,
  UNIDADE,
  formatarDataHora,
  formatarLeitura,
  formatarPercentual,
  formatarRelativo,
} from '../lib/format'

const JANELAS = [
  { minutos: 15, rotulo: '15 min' },
  { minutos: 60, rotulo: '1 h' },
  { minutos: 360, rotulo: '6 h' },
]
const TIPOS_ACEITOS = ['image/jpeg', 'image/png', 'image/webp']
const TAMANHO_MAXIMO = 10 * 1024 * 1024

const TOM_CLASSIFICACAO: Record<Classificacao, 'normal' | 'atencao' | 'critico'> = {
  NORMAL: 'normal',
  SUSPEITO: 'atencao',
  VAZAMENTO: 'critico',
}

export default function RolamentoDetalhe() {
  const id = useIdParam()
  const { usuario } = useAuth()
  const operador = podeOperar(usuario?.papel)
  const [janela, setJanela] = useState(60)

  const rolamento = useApi(id ? `rolamento-${id}` : null, () => rolamentosApi.buscar(id!), 10_000)
  const vibracao = useApi(id ? `vib-${id}-${janela}` : null, () => rolamentosApi.leituras(id!, 'VIBRACAO', janela), 10_000)
  const temperatura = useApi(id ? `temp-${id}-${janela}` : null, () => rolamentosApi.leituras(id!, 'TEMPERATURA', janela), 10_000)
  const imagens = useApi(id ? `imagens-${id}` : null, () => rolamentosApi.imagens(id!), 20_000)
  const alertas = useApi(id ? `alertas-rolamento-${id}` : null, () => alertasApi.listar({ rolamentoId: id! }), 15_000)

  if (id === null) return <Navigate to="/trens" replace />

  const r = rolamento.dados
  const recarregarTudo = () => {
    rolamento.recarregar()
    imagens.recarregar()
    alertas.recarregar()
  }

  return (
    <>
      <Migalhas
        itens={[
          { rotulo: 'Trens', para: '/trens' },
          ...(r?.tremId ? [{ rotulo: r.tremCodigo ?? 'Trem', para: `/trens/${r.tremId}` }] : []),
          ...(r?.vagaoId ? [{ rotulo: `Vagão ${r.numeroUk}`, para: `/vagoes/${r.vagaoId}` }] : []),
          { rotulo: r ? r.identificadorUnico : 'Rolamento' },
        ]}
      />
      <Cabecalho
        sobretitulo="Rolamento"
        titulo={r ? r.identificadorUnico : 'Carregando...'}
        descricao={r ? `Posição ${r.posicao}${r.ativo ? '' : ' · desativado'}` : undefined}
        acoes={
          <>
            {r && <StatusBadge status={r.status} />}
            <AtualizacaoAutomatica segundos={10} erro={r ? rolamento.erro ?? vibracao.erro ?? temperatura.erro : undefined} />
          </>
        }
      />

      {rolamento.erro && !r && <MensagemErro erro={rolamento.erro.message} aoTentarDeNovo={rolamento.recarregar} />}

      {r && (
        <section className="grade-metricas" aria-label="Leituras atuais">
          <Metrica rotulo="Vibração" valor={formatarLeitura(r.vibracao, 'VIBRACAO')} detalhe="leitura bruta do sensor" />
          <Metrica rotulo="Temperatura" valor={formatarLeitura(r.temperatura, 'TEMPERATURA')} />
          <Metrica
            rotulo="Alertas ativos"
            valor={r.alertasAtivos}
            tom={r.alertasCriticos ? 'critico' : r.alertasAtivos ? 'atencao' : undefined}
          />
          <Metrica rotulo="Última leitura" valor={formatarRelativo(r.ultimaLeituraEm)} detalhe={formatarDataHora(r.ultimaLeituraEm)} />
        </section>
      )}

      <section aria-labelledby="titulo-sensores" className="painel">
        <div className="painel-cabecalho">
          <h2 id="titulo-sensores">Sensores</h2>
          <div className="segmentado" role="group" aria-label="Janela de tempo">
            {JANELAS.map((j) => (
              <button
                key={j.minutos}
                type="button"
                className={janela === j.minutos ? 'ativo' : ''}
                aria-pressed={janela === j.minutos}
                onClick={() => setJanela(j.minutos)}
              >
                {j.rotulo}
              </button>
            ))}
          </div>
        </div>
        <div className="grade-graficos">
          {vibracao.dados ? (
            <LineChart
              titulo="Vibração"
              pontos={vibracao.dados.pontos}
              unidade={UNIDADE.VIBRACAO}
              minutos={janela}
              agora={vibracao.atualizadoEm ?? 0}
              casas={0}
            />
          ) : vibracao.erro ? (
            <MensagemErro erro={vibracao.erro.message} aoTentarDeNovo={vibracao.recarregar} />
          ) : (
            <Carregando />
          )}
          {temperatura.dados ? (
            <LineChart
              titulo="Temperatura"
              pontos={temperatura.dados.pontos}
              unidade={UNIDADE.TEMPERATURA}
              minutos={janela}
              agora={temperatura.atualizadoEm ?? 0}
            />
          ) : temperatura.erro ? (
            <MensagemErro erro={temperatura.erro.message} aoTentarDeNovo={temperatura.recarregar} />
          ) : (
            <Carregando />
          )}
        </div>
      </section>

      <section aria-labelledby="titulo-fotos" className="painel">
        <div className="painel-cabecalho">
          <h2 id="titulo-fotos">Inspeção visual</h2>
          <AtualizacaoAutomatica segundos={20} erro={imagens.dados ? imagens.erro : undefined} />
        </div>
        {imagens.erro && !imagens.dados && <MensagemErro erro={imagens.erro.message} aoTentarDeNovo={imagens.recarregar} />}
        {imagens.carregando && <Carregando />}
        {imagens.dados && (
          <>
            <UltimaFoto imagens={imagens.dados} />
            {operador && r?.ativo && <EnviarFoto rolamentoId={id} aoEnviar={recarregarTudo} />}
            <Galeria imagens={imagens.dados} podeDefinirReferencia={operador} aoAlterar={imagens.recarregar} />
          </>
        )}
      </section>

      <section aria-labelledby="titulo-alertas" className="painel">
        <div className="painel-cabecalho">
          <h2 id="titulo-alertas">Histórico de alertas</h2>
        </div>
        {alertas.erro && !alertas.dados && <MensagemErro erro={alertas.erro.message} aoTentarDeNovo={alertas.recarregar} />}
        {alertas.carregando && <Carregando />}
        {alertas.dados && (
          <AlertaList
            alertas={alertas.dados}
            podeDecidir={operador}
            aoAlterar={recarregarTudo}
            ocultarLocal
            vazio="Nenhum alerta para este rolamento."
          />
        )}
      </section>
    </>
  )
}

function ResultadoIa({ classificacao, score, regioes }: {
  classificacao: Classificacao | null
  score: number | null
  regioes: string[]
}) {
  if (!classificacao) return <p className="texto-suave">Sem comparação: não havia foto de referência quando esta foi enviada.</p>
  return (
    <div className="resultado-ia">
      <p>
        <Badge tom={TOM_CLASSIFICACAO[classificacao]}>{ROTULO_CLASSIFICACAO[classificacao]}</Badge>{' '}
        <span>Diferença em relação à referência: <strong>{formatarPercentual(score)}</strong></span>
      </p>
      {regioes.length > 0 && (
        <ul className="lista-simples">
          {regioes.map((regiao) => (
            <li key={regiao}>{regiao}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

function UltimaFoto({ imagens }: { imagens: Imagem[] }) {
  const ultima = imagens[0]
  const referencia = imagens.find((i) => i.baselineAtiva)
  if (!ultima) return <Vazio>Nenhuma foto enviada para este rolamento.</Vazio>
  return (
    <div className="ultima-foto">
      <a href={ultima.urlArquivo} target="_blank" rel="noopener noreferrer" className="foto-grande">
        <img src={ultima.urlArquivo} alt={`Última foto, de ${formatarDataHora(ultima.timestampCaptura)}`} />
      </a>
      <div>
        <h3>Última foto</h3>
        <p className="texto-suave">{formatarDataHora(ultima.timestampCaptura)}</p>
        {ultima.baselineAtiva ? (
          <p>Esta foto é a referência atual do rolamento.</p>
        ) : (
          <ResultadoIa classificacao={ultima.classificacao} score={ultima.scoreDiferenca} regioes={ultima.regioesAnomalia} />
        )}
        {!referencia && (
          <Aviso>Defina uma foto como referência (baseline) para que as próximas sejam analisadas pela IA.</Aviso>
        )}
      </div>
    </div>
  )
}

function EnviarFoto({ rolamentoId, aoEnviar }: { rolamentoId: number; aoEnviar: () => void }) {
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [erroArquivo, setErroArquivo] = useState('')
  const [resultado, setResultado] = useState<ImagemEnviada | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const idInput = useId()
  const envio = useAction((f: File) => imagensApi.enviar(rolamentoId, f))

  function escolher(f: File | undefined) {
    setResultado(null)
    envio.limparErro()
    if (!f) {
      setArquivo(null)
      return
    }
    if (!TIPOS_ACEITOS.includes(f.type)) {
      setErroArquivo('Envie uma foto JPEG, PNG ou WebP.')
      setArquivo(null)
    } else if (f.size > TAMANHO_MAXIMO) {
      setErroArquivo('A foto deve ter no máximo 10 MB.')
      setArquivo(null)
    } else {
      setErroArquivo('')
      setArquivo(f)
    }
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    if (!arquivo) {
      setErroArquivo('Escolha uma foto.')
      return
    }
    const resposta = await envio.executar(arquivo)
    if (resposta) {
      setResultado(resposta)
      setArquivo(null)
      if (inputRef.current) inputRef.current.value = ''
      aoEnviar()
    }
  }

  return (
    <form className="enviar-foto" onSubmit={enviar} noValidate>
      <div className="campo">
        <label htmlFor={idInput}>Enviar foto para análise</label>
        <input
          ref={inputRef}
          id={idInput}
          type="file"
          accept={TIPOS_ACEITOS.join(',')}
          onChange={(e) => escolher(e.target.files?.[0])}
          aria-invalid={Boolean(erroArquivo)}
          aria-describedby={`${idInput}-ajuda`}
        />
        <span id={`${idInput}-ajuda`} className={erroArquivo ? 'campo-erro' : 'campo-ajuda'}>
          {erroArquivo || 'JPEG, PNG ou WebP, até 10 MB. A análise pela IA pode levar alguns segundos.'}
        </span>
      </div>
      <button type="submit" className="botao botao-primario" disabled={envio.pendente || !arquivo}>
        {envio.pendente ? 'Enviando e analisando...' : 'Enviar foto'}
      </button>
      {envio.erro && <MensagemErro erro={envio.erro} />}
      {resultado && (
        <Aviso tom={resultado.alertaId ? 'erro' : 'sucesso'}>
          {resultado.classificacao ? (
            <>
              Foto analisada: <strong>{ROTULO_CLASSIFICACAO[resultado.classificacao]}</strong>, diferença de{' '}
              {formatarPercentual(resultado.scoreDiferenca)}.
              {resultado.alertaId && <> Foi gerado o alerta #{resultado.alertaId}.</>}
            </>
          ) : (
            'Foto enviada. Ela não foi analisada porque o rolamento ainda não tem foto de referência.'
          )}
        </Aviso>
      )}
    </form>
  )
}

function Galeria({ imagens, podeDefinirReferencia, aoAlterar }: {
  imagens: Imagem[]
  podeDefinirReferencia: boolean
  aoAlterar: () => void
}) {
  const referencia = useAction((imagemId: number) => imagensApi.definirReferencia(imagemId).then(() => true))

  if (imagens.length === 0) return null

  async function definir(imagemId: number) {
    if (await referencia.executar(imagemId)) aoAlterar()
  }

  return (
    <div>
      <h3 className="titulo-galeria">Galeria ({imagens.length})</h3>
      {referencia.erro && <MensagemErro erro={referencia.erro} />}
      <ul className="galeria">
        {imagens.map((img) => (
          <li key={img.id} className={img.baselineAtiva ? 'galeria-referencia' : ''}>
            <a href={img.urlArquivo} target="_blank" rel="noopener noreferrer">
              <img src={img.urlArquivo} alt={`Foto de ${formatarDataHora(img.timestampCaptura)}`} loading="lazy" />
            </a>
            <div className="galeria-legenda">
              <span className="texto-pequeno">{formatarDataHora(img.timestampCaptura)}</span>
              {img.baselineAtiva ? (
                <Badge tom="info">Referência atual</Badge>
              ) : img.classificacao ? (
                <Badge tom={TOM_CLASSIFICACAO[img.classificacao]}>
                  {ROTULO_CLASSIFICACAO[img.classificacao]} · {formatarPercentual(img.scoreDiferenca)}
                </Badge>
              ) : null}
              {img.alertaId && (
                <Link className="texto-pequeno" to="/alertas">
                  Alerta #{img.alertaId}
                </Link>
              )}
              {podeDefinirReferencia && !img.baselineAtiva && (
                <button
                  type="button"
                  className="botao botao-fantasma botao-pequeno"
                  disabled={referencia.pendente}
                  onClick={() => definir(img.id)}
                >
                  Definir como referência
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
