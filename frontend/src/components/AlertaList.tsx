import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { alertasApi } from '../api/endpoints'
import type { Alerta, AlertaDetalhe, NivelAlerta, StatusAlerta } from '../api/types'
import { useAction } from '../hooks/useAction'
import { useApi } from '../hooks/useApi'
import {
  ROTULO_CLASSIFICACAO,
  ROTULO_NIVEL,
  ROTULO_STATUS_ALERTA,
  formatarDataHora,
  formatarPercentual,
  formatarRelativo,
} from '../lib/format'
import { Badge, Carregando, MensagemErro, Vazio } from './ui'

const TOM_NIVEL: Record<NivelAlerta, 'info' | 'atencao' | 'critico'> = {
  BAIXO: 'info',
  MEDIO: 'atencao',
  CRITICO: 'critico',
}

const TOM_STATUS: Record<StatusAlerta, 'neutro' | 'info' | 'atencao' | 'normal'> = {
  NOVO: 'atencao',
  EM_ANALISE: 'atencao',
  CONFIRMADO: 'info',
  FALSO_POSITIVO: 'neutro',
  FECHADO: 'normal',
}

type Props = {
  alertas: Alerta[]
  /** Mostra os botões de decisão (engenheiro e gerente). */
  podeDecidir: boolean
  /** Chamado depois de uma decisão, para a tela recarregar os dados. */
  aoAlterar: () => void
  /** Esconde a coluna do rolamento quando a lista já é de um rolamento só. */
  ocultarLocal?: boolean
  vazio?: string
}

export function AlertaList({ alertas, podeDecidir, aoAlterar, ocultarLocal, vazio = 'Nenhum alerta.' }: Props) {
  if (alertas.length === 0) return <Vazio>{vazio}</Vazio>
  return (
    <ul className="lista-alertas">
      {alertas.map((alerta) => (
        <AlertaItem
          key={alerta.id}
          alerta={alerta}
          podeDecidir={podeDecidir}
          aoAlterar={aoAlterar}
          ocultarLocal={ocultarLocal}
        />
      ))}
    </ul>
  )
}

function AlertaItem({ alerta, podeDecidir, aoAlterar, ocultarLocal }: {
  alerta: Alerta
  podeDecidir: boolean
  aoAlterar: () => void
  ocultarLocal?: boolean
}) {
  const [detalheAberto, setDetalheAberto] = useState(false)
  const [pedindoMotivo, setPedindoMotivo] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [erroMotivo, setErroMotivo] = useState('')
  const acao = useAction(async (tipo: 'confirmar' | 'falso' | 'fechar', texto?: string) => {
    if (tipo === 'fechar') await alertasApi.fechar(alerta.id)
    else await alertasApi.decidir(alerta.id, tipo === 'confirmar' ? 'CONFIRMADO' : 'FALSO_POSITIVO', texto)
    return true
  })

  const pendente = alerta.status === 'NOVO' || alerta.status === 'EM_ANALISE'

  async function decidir(tipo: 'confirmar' | 'fechar') {
    if (await acao.executar(tipo)) aoAlterar()
  }

  async function enviarFalsoPositivo(evento: FormEvent) {
    evento.preventDefault()
    if (!motivo.trim()) {
      setErroMotivo('Informe o motivo.')
      return
    }
    setErroMotivo('')
    if (await acao.executar('falso', motivo.trim())) {
      setPedindoMotivo(false)
      setMotivo('')
      aoAlterar()
    }
  }

  return (
    <li className={`alerta alerta-${alerta.nivel.toLowerCase()}`}>
      <div className="alerta-linha">
        <div className="alerta-tags">
          <Badge tom={TOM_NIVEL[alerta.nivel]}>{ROTULO_NIVEL[alerta.nivel]}</Badge>
          <Badge tom={TOM_STATUS[alerta.status]}>{ROTULO_STATUS_ALERTA[alerta.status]}</Badge>
        </div>
        <div className="alerta-info">
          <strong>Alerta #{alerta.id}</strong>
          {!ocultarLocal && (
            <span>
              Rolamento <Link to={`/rolamentos/${alerta.eixoId}`}>{alerta.eixoIdentificador}</Link>
              {alerta.vagaoId && (
                <>
                  {' · '}Vagão <Link to={`/vagoes/${alerta.vagaoId}`}>{alerta.numeroUk}</Link>
                </>
              )}
              {alerta.tremId && (
                <>
                  {' · '}Trem <Link to={`/trens/${alerta.tremId}`}>{alerta.tremCodigo}</Link>
                </>
              )}
            </span>
          )}
          <span className="texto-suave">
            Diferença {formatarPercentual(alerta.score)} ·{' '}
            <time dateTime={alerta.criadoEm} title={formatarDataHora(alerta.criadoEm)}>
              {formatarRelativo(alerta.criadoEm)}
            </time>
          </span>
        </div>
        <div className="alerta-acoes">
          <button
            type="button"
            className="botao botao-fantasma botao-pequeno"
            aria-expanded={detalheAberto}
            onClick={() => setDetalheAberto((v) => !v)}
          >
            {detalheAberto ? 'Ocultar detalhes' : 'Detalhes'}
          </button>
          {podeDecidir && pendente && (
            <>
              <button
                type="button"
                className="botao botao-perigo botao-pequeno"
                disabled={acao.pendente}
                onClick={() => decidir('confirmar')}
              >
                Confirmar vazamento
              </button>
              <button
                type="button"
                className="botao botao-secundario botao-pequeno"
                disabled={acao.pendente}
                aria-expanded={pedindoMotivo}
                onClick={() => setPedindoMotivo((v) => !v)}
              >
                Falso positivo
              </button>
            </>
          )}
          {podeDecidir && alerta.status === 'CONFIRMADO' && (
            <button
              type="button"
              className="botao botao-secundario botao-pequeno"
              disabled={acao.pendente}
              onClick={() => decidir('fechar')}
            >
              Fechar alerta
            </button>
          )}
        </div>
      </div>

      {pedindoMotivo && (
        <form className="alerta-motivo" onSubmit={enviarFalsoPositivo} noValidate>
          <label htmlFor={`motivo-${alerta.id}`}>Motivo do falso positivo (obrigatório)</label>
          <textarea
            id={`motivo-${alerta.id}`}
            value={motivo}
            maxLength={2000}
            rows={2}
            onChange={(e) => setMotivo(e.target.value)}
            aria-invalid={Boolean(erroMotivo)}
            aria-describedby={erroMotivo ? `motivo-erro-${alerta.id}` : undefined}
            placeholder="Ex.: reflexo da iluminação, mancha antiga já registrada..."
          />
          {erroMotivo && (
            <span id={`motivo-erro-${alerta.id}`} className="campo-erro">
              {erroMotivo}
            </span>
          )}
          <div className="linha-botoes">
            <button type="submit" className="botao botao-primario botao-pequeno" disabled={acao.pendente}>
              Marcar como falso positivo
            </button>
            <button type="button" className="botao botao-fantasma botao-pequeno" onClick={() => setPedindoMotivo(false)}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {acao.erro && <MensagemErro erro={acao.erro} />}
      {detalheAberto && <AlertaDetalhes alertaId={alerta.id} />}
    </li>
  )
}

function AlertaDetalhes({ alertaId }: { alertaId: number }) {
  const { dados, erro, recarregar } = useApi<AlertaDetalhe>(`alerta-${alertaId}`, () => alertasApi.detalhe(alertaId))

  if (erro && !dados) return <MensagemErro erro={erro.message} aoTentarDeNovo={recarregar} />
  if (!dados) return <Carregando texto="Carregando detalhes..." />

  const baseline = dados.evidencias.find((e) => e.tipo === 'BASELINE')
  const atual = dados.evidencias.find((e) => e.tipo === 'ATUAL')

  return (
    <div className="alerta-detalhe">
      <dl className="lista-definicao">
        <div>
          <dt>Classificação da IA</dt>
          <dd>{dados.classificacao ? ROTULO_CLASSIFICACAO[dados.classificacao] : '—'}</dd>
        </div>
        <div>
          <dt>Criado em</dt>
          <dd>{formatarDataHora(dados.criadoEm)}</dd>
        </div>
      </dl>
      {dados.regioesAnomalia.length > 0 && (
        <div>
          <h4>Regiões observadas</h4>
          <ul className="lista-simples">
            {dados.regioesAnomalia.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      )}
      {(baseline || atual) && (
        <div className="evidencias">
          {[
            { rotulo: 'Referência (baseline)', ev: baseline },
            { rotulo: 'Foto que gerou o alerta', ev: atual },
          ].map(({ rotulo, ev }) =>
            ev ? (
              <figure key={rotulo}>
                <a href={ev.urlArquivo} target="_blank" rel="noopener noreferrer">
                  <img src={ev.urlArquivo} alt={rotulo} loading="lazy" />
                </a>
                <figcaption>{rotulo}</figcaption>
              </figure>
            ) : null,
          )}
        </div>
      )}
      {dados.decisoes.length > 0 && (
        <div>
          <h4>Decisões</h4>
          <ul className="lista-simples">
            {dados.decisoes.map((d) => (
              <li key={d.id}>
                <strong>{d.decisao === 'CONFIRMADO' ? 'Vazamento confirmado' : 'Falso positivo'}</strong> por{' '}
                {d.usuarioNome} em {formatarDataHora(d.criadoEm)}
                {d.motivo && <> — “{d.motivo}”</>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
