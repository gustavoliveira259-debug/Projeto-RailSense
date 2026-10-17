import { Link } from 'react-router-dom'
import { trensApi } from '../api/endpoints'
import { Icon } from '../components/Icon'
import { AtualizacaoAutomatica, Cabecalho, Carregando, MensagemErro, Metrica, StatusBadge, Vazio } from '../components/ui'
import { useApi } from '../hooks/useApi'

const INTERVALO = 15_000

export default function Trens() {
  const { dados, erro, carregando, recarregar } = useApi('trens', trensApi.listar, INTERVALO)
  const trens = (dados ?? []).filter((t) => t.ativo)

  const total = (campo: 'totalRolamentos' | 'alertasAtivos' | 'alertasCriticos') =>
    trens.reduce((soma, t) => soma + t[campo], 0)
  const criticos = total('alertasCriticos')

  return (
    <>
      <Cabecalho
        sobretitulo="Centro de monitoramento"
        titulo="Trens"
        descricao="Selecione uma composição para ver seus vagões e rolamentos."
        acoes={<AtualizacaoAutomatica segundos={INTERVALO / 1000} erro={dados ? erro : undefined} />}
      />

      {carregando && <Carregando />}
      {erro && !dados && <MensagemErro erro={erro.message} aoTentarDeNovo={recarregar} />}

      {dados && (
        <>
          <section className="grade-metricas" aria-label="Resumo geral">
            <Metrica rotulo="Composições" valor={trens.length} />
            <Metrica rotulo="Rolamentos monitorados" valor={total('totalRolamentos')} />
            <Metrica rotulo="Alertas ativos" valor={total('alertasAtivos')} tom={total('alertasAtivos') ? 'atencao' : undefined} />
            <Metrica rotulo="Alertas críticos" valor={criticos} tom={criticos ? 'critico' : undefined} />
          </section>

          <section aria-labelledby="titulo-trens">
            <h2 id="titulo-trens" className="titulo-secao">
              Composições
            </h2>
            {trens.length === 0 ? (
              <Vazio>Nenhum trem ativo cadastrado. A equipe de TI cadastra trens em “Estrutura e sensores”.</Vazio>
            ) : (
              <ul className="grade-cartoes">
                {trens.map((trem) => (
                  <li key={trem.id}>
                    <Link to={`/trens/${trem.id}`} className={`cartao cartao-link borda-${trem.status.toLowerCase()}`}>
                      <div className="cartao-topo">
                        <span className="cartao-icone">
                          <Icon name="train" />
                        </span>
                        <StatusBadge status={trem.status} />
                      </div>
                      <h3>{trem.codigo}</h3>
                      {trem.nome && <p className="texto-suave">{trem.nome}</p>}
                      <dl className="cartao-numeros">
                        <div>
                          <dt>Vagões</dt>
                          <dd>{trem.totalVagoes}</dd>
                        </div>
                        <div>
                          <dt>Rolamentos</dt>
                          <dd>{trem.totalRolamentos}</dd>
                        </div>
                        <div>
                          <dt>Alertas</dt>
                          <dd>{trem.alertasAtivos}</dd>
                        </div>
                      </dl>
                      <span className="cartao-acao">
                        Acessar trem <span aria-hidden="true">→</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </>
  )
}
