import { Link, Navigate } from 'react-router-dom'
import { rolamentosApi, vagoesApi } from '../api/endpoints'
import { Icon } from '../components/Icon'
import { AtualizacaoAutomatica, Cabecalho, Carregando, MensagemErro, Migalhas, StatusBadge, Vazio } from '../components/ui'
import { useApi } from '../hooks/useApi'
import { useIdParam } from '../hooks/useIdParam'
import { formatarDataHora, formatarLeitura, formatarRelativo } from '../lib/format'

export default function VagaoDetalhe() {
  const id = useIdParam()
  const vagao = useApi(id ? `vagao-${id}` : null, () => vagoesApi.buscar(id!), 15_000)
  const rolamentos = useApi(id ? `rolamentos-vagao-${id}` : null, () => rolamentosApi.listar(id!), 10_000)

  if (id === null) return <Navigate to="/trens" replace />

  const v = vagao.dados
  const ativos = (rolamentos.dados ?? []).filter((r) => r.ativo)

  return (
    <>
      <Migalhas
        itens={[
          { rotulo: 'Trens', para: '/trens' },
          ...(v?.tremId ? [{ rotulo: v.tremCodigo ?? 'Trem', para: `/trens/${v.tremId}` }] : []),
          { rotulo: v ? `Vagão ${v.numeroUk}` : 'Vagão' },
        ]}
      />
      <Cabecalho
        sobretitulo="Vagão"
        titulo={v ? v.numeroUk : 'Carregando...'}
        descricao={v ? [v.tipo, v.nomePatioLinha].filter(Boolean).join(' · ') || undefined : undefined}
        acoes={
          <>
            {v && <StatusBadge status={v.status} />}
            <AtualizacaoAutomatica segundos={10} erro={v ? vagao.erro ?? rolamentos.erro : undefined} />
          </>
        }
      />

      {vagao.erro && !v && <MensagemErro erro={vagao.erro.message} aoTentarDeNovo={vagao.recarregar} />}

      <section aria-labelledby="titulo-rolamentos">
        <h2 id="titulo-rolamentos" className="titulo-secao">
          Rolamentos
        </h2>
        {rolamentos.carregando && <Carregando />}
        {rolamentos.erro && !rolamentos.dados && (
          <MensagemErro erro={rolamentos.erro.message} aoTentarDeNovo={rolamentos.recarregar} />
        )}
        {rolamentos.dados &&
          (ativos.length === 0 ? (
            <Vazio>Este vagão ainda não tem rolamentos ativos.</Vazio>
          ) : (
            <ul className="grade-cartoes">
              {ativos.map((r) => (
                <li key={r.id}>
                  <Link to={`/rolamentos/${r.id}`} className={`cartao cartao-link borda-${r.status.toLowerCase()}`}>
                    <div className="cartao-topo">
                      <span className="cartao-icone">
                        <Icon name="bearing" />
                      </span>
                      <StatusBadge status={r.status} />
                    </div>
                    <h3>{r.identificadorUnico}</h3>
                    <p className="texto-suave">Posição {r.posicao}</p>
                    <dl className="cartao-numeros">
                      <div>
                        <dt>Vibração</dt>
                        <dd>{formatarLeitura(r.vibracao, 'VIBRACAO')}</dd>
                      </div>
                      <div>
                        <dt>Temperatura</dt>
                        <dd>{formatarLeitura(r.temperatura, 'TEMPERATURA')}</dd>
                      </div>
                      <div>
                        <dt>Alertas</dt>
                        <dd>{r.alertasAtivos}</dd>
                      </div>
                    </dl>
                    <span className="texto-suave texto-pequeno" title={formatarDataHora(r.ultimaLeituraEm)}>
                      Última leitura {formatarRelativo(r.ultimaLeituraEm)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ))}
      </section>
    </>
  )
}
