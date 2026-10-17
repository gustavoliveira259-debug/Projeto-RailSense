import { useSearchParams } from 'react-router-dom'
import { alertasApi } from '../api/endpoints'
import type { Alerta, StatusAlerta } from '../api/types'
import { podeOperar, useAuth } from '../auth/useAuth'
import { AlertaList } from '../components/AlertaList'
import { AtualizacaoAutomatica, Cabecalho, Carregando, MensagemErro } from '../components/ui'
import { useApi } from '../hooks/useApi'
import { STATUS_ALERTA_ATIVOS } from '../lib/format'

const INTERVALO = 15_000

type Filtro = 'ativos' | 'novos' | 'confirmados' | 'falsos' | 'fechados' | 'todos'

const FILTROS: { valor: Filtro; rotulo: string; aceita: (s: StatusAlerta) => boolean }[] = [
  { valor: 'ativos', rotulo: 'Ativos', aceita: (s) => STATUS_ALERTA_ATIVOS.includes(s) },
  { valor: 'novos', rotulo: 'Novos', aceita: (s) => s === 'NOVO' || s === 'EM_ANALISE' },
  { valor: 'confirmados', rotulo: 'Confirmados', aceita: (s) => s === 'CONFIRMADO' },
  { valor: 'falsos', rotulo: 'Falso positivo', aceita: (s) => s === 'FALSO_POSITIVO' },
  { valor: 'fechados', rotulo: 'Fechados', aceita: (s) => s === 'FECHADO' },
  { valor: 'todos', rotulo: 'Todos', aceita: () => true },
]

export default function Alertas() {
  const { usuario } = useAuth()
  const [params, setParams] = useSearchParams()
  const filtro = FILTROS.find((f) => f.valor === params.get('situacao')) ?? FILTROS[0]
  const { dados, erro, carregando, recarregar } = useApi<Alerta[]>('alertas', () => alertasApi.listar(), INTERVALO)

  const contagem = (f: (typeof FILTROS)[number]) => (dados ?? []).filter((a) => f.aceita(a.status)).length
  const visiveis = (dados ?? []).filter((a) => filtro.aceita(a.status))

  return (
    <>
      <Cabecalho
        sobretitulo="Monitoramento"
        titulo="Alertas"
        descricao="Alertas gerados pela análise das fotos dos rolamentos."
        acoes={<AtualizacaoAutomatica segundos={INTERVALO / 1000} erro={dados ? erro : undefined} />}
      />

      <div className="segmentado segmentado-filtros" role="group" aria-label="Filtrar por situação">
        {FILTROS.map((f) => (
          <button
            key={f.valor}
            type="button"
            className={f.valor === filtro.valor ? 'ativo' : ''}
            aria-pressed={f.valor === filtro.valor}
            onClick={() => setParams(f.valor === 'ativos' ? {} : { situacao: f.valor }, { replace: true })}
          >
            {f.rotulo}
            {dados && <span className="contador">{contagem(f)}</span>}
          </button>
        ))}
      </div>

      {carregando && <Carregando />}
      {erro && !dados && <MensagemErro erro={erro.message} aoTentarDeNovo={recarregar} />}
      {dados && (
        <AlertaList
          alertas={visiveis}
          podeDecidir={podeOperar(usuario?.papel)}
          aoAlterar={recarregar}
          vazio={`Nenhum alerta em “${filtro.rotulo.toLowerCase()}”.`}
        />
      )}
    </>
  )
}
