import { useId, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { trensApi, vagoesApi } from '../api/endpoints'
import type { StatusMonitoramento } from '../api/types'
import { Icon } from '../components/Icon'
import {
  AtualizacaoAutomatica,
  Cabecalho,
  Carregando,
  MensagemErro,
  Metrica,
  Migalhas,
  StatusBadge,
  Vazio,
} from '../components/ui'
import { useApi } from '../hooks/useApi'
import { useIdParam } from '../hooks/useIdParam'
import { ROTULO_STATUS } from '../lib/format'

const INTERVALO = 15_000
const FILTROS_STATUS: (StatusMonitoramento | 'TODOS')[] = ['TODOS', 'CRITICO', 'ATENCAO', 'NORMAL', 'SEM_LEITURAS']

export default function TremDetalhe() {
  const id = useIdParam()
  const navigate = useNavigate()
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<StatusMonitoramento | 'TODOS'>('TODOS')
  const idBusca = useId()
  const idFiltro = useId()
  const idSelecao = useId()

  const trem = useApi(id ? `trem-${id}` : null, () => trensApi.buscar(id!), INTERVALO)
  const vagoes = useApi(id ? `vagoes-trem-${id}` : null, () => vagoesApi.listar(id!), INTERVALO)

  if (id === null) return <Navigate to="/trens" replace />

  const ativos = (vagoes.dados ?? []).filter((v) => v.ativo)
  const termo = busca.trim().toLowerCase()
  const visiveis = ativos.filter(
    (v) => (filtro === 'TODOS' || v.status === filtro) && (!termo || v.numeroUk.toLowerCase().includes(termo)),
  )

  const t = trem.dados
  return (
    <>
      <Migalhas itens={[{ rotulo: 'Trens', para: '/trens' }, { rotulo: t ? t.codigo : 'Trem' }]} />
      <Cabecalho
        sobretitulo="Trem"
        titulo={t ? t.codigo : 'Carregando...'}
        descricao={t?.nome ?? undefined}
        acoes={
          <>
            {t && <StatusBadge status={t.status} />}
            <AtualizacaoAutomatica segundos={INTERVALO / 1000} erro={t ? trem.erro ?? vagoes.erro : undefined} />
          </>
        }
      />

      {trem.erro && !t && <MensagemErro erro={trem.erro.message} aoTentarDeNovo={trem.recarregar} />}

      {t && (
        <section className="grade-metricas" aria-label="Métricas do trem">
          <Metrica rotulo="Vagões" valor={t.totalVagoes} />
          <Metrica rotulo="Rolamentos" valor={t.totalRolamentos} />
          <Metrica rotulo="Alertas ativos" valor={t.alertasAtivos} tom={t.alertasAtivos ? 'atencao' : undefined} />
          <Metrica rotulo="Alertas críticos" valor={t.alertasCriticos} tom={t.alertasCriticos ? 'critico' : undefined} />
        </section>
      )}

      <section aria-labelledby="titulo-vagoes">
        <h2 id="titulo-vagoes" className="titulo-secao">
          Vagões
        </h2>

        <div className="barra-filtros">
          <div className="campo campo-busca">
            <label htmlFor={idBusca}>Buscar pelo número</label>
            <div className="input-com-icone">
              <Icon name="search" />
              <input id={idBusca} type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Ex.: 1234" />
            </div>
          </div>
          <div className="campo">
            <label htmlFor={idFiltro}>Situação</label>
            <select id={idFiltro} value={filtro} onChange={(e) => setFiltro(e.target.value as typeof filtro)}>
              {FILTROS_STATUS.map((s) => (
                <option key={s} value={s}>
                  {s === 'TODOS' ? 'Todas' : ROTULO_STATUS[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="campo">
            <label htmlFor={idSelecao}>Ir direto para o vagão</label>
            <select
              id={idSelecao}
              value=""
              onChange={(e) => e.target.value && navigate(`/vagoes/${e.target.value}`)}
              disabled={ativos.length === 0}
            >
              <option value="">Selecione...</option>
              {ativos.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.numeroUk}
                </option>
              ))}
            </select>
          </div>
        </div>

        {vagoes.carregando && <Carregando />}
        {vagoes.erro && !vagoes.dados && <MensagemErro erro={vagoes.erro.message} aoTentarDeNovo={vagoes.recarregar} />}
        {vagoes.dados &&
          (visiveis.length === 0 ? (
            <Vazio>{ativos.length === 0 ? 'Este trem ainda não tem vagões ativos.' : 'Nenhum vagão corresponde ao filtro.'}</Vazio>
          ) : (
            <ul className="grade-cartoes">
              {visiveis.map((v) => (
                <li key={v.id}>
                  <Link to={`/vagoes/${v.id}`} className={`cartao cartao-link borda-${v.status.toLowerCase()}`}>
                    <div className="cartao-topo">
                      <span className="cartao-icone">
                        <Icon name="wagon" />
                      </span>
                      <StatusBadge status={v.status} />
                    </div>
                    <h3>Vagão {v.numeroUk}</h3>
                    {v.tipo && <p className="texto-suave">{v.tipo}</p>}
                    <dl className="cartao-numeros">
                      <div>
                        <dt>Rolamentos</dt>
                        <dd>{v.totalRolamentos}</dd>
                      </div>
                      <div>
                        <dt>Alertas</dt>
                        <dd>{v.alertasAtivos}</dd>
                      </div>
                      <div>
                        <dt>Críticos</dt>
                        <dd>{v.alertasCriticos}</dd>
                      </div>
                    </dl>
                    <span className="cartao-acao">
                      Ver rolamentos <span aria-hidden="true">→</span>
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
