import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { StatusMonitoramento } from '../api/types'
import { ROTULO_STATUS } from '../lib/format'
import { Icon, type IconName } from './Icon'

const ICONE_STATUS: Record<StatusMonitoramento, IconName> = {
  NORMAL: 'check',
  ATENCAO: 'warning',
  CRITICO: 'warning',
  SEM_LEITURAS: 'dot',
}

/** Cor + ícone + texto: o status nunca depende só da cor. */
export function StatusBadge({ status }: { status: StatusMonitoramento }) {
  return (
    <span className={`status-badge status-${status.toLowerCase()}`}>
      <Icon name={ICONE_STATUS[status]} className="status-badge-icon" />
      {ROTULO_STATUS[status]}
    </span>
  )
}

export function Badge({ tom = 'neutro', children }: { tom?: 'neutro' | 'info' | 'normal' | 'atencao' | 'critico'; children: ReactNode }) {
  return <span className={`badge badge-${tom}`}>{children}</span>
}

export function Metrica({ rotulo, valor, detalhe, tom }: {
  rotulo: string
  valor: ReactNode
  detalhe?: ReactNode
  tom?: 'atencao' | 'critico'
}) {
  return (
    <div className={`metrica ${tom ? `metrica-${tom}` : ''}`}>
      <span className="metrica-rotulo">{rotulo}</span>
      <strong className="metrica-valor">{valor}</strong>
      {detalhe && <span className="metrica-detalhe">{detalhe}</span>}
    </div>
  )
}

export function Carregando({ texto = 'Carregando...', telaCheia = false }: { texto?: string; telaCheia?: boolean }) {
  return (
    <div className={telaCheia ? 'carregando carregando-tela' : 'carregando'} role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      {texto}
    </div>
  )
}

export function MensagemErro({ erro, aoTentarDeNovo }: { erro: string; aoTentarDeNovo?: () => void }) {
  return (
    <div className="mensagem-erro" role="alert">
      <Icon name="warning" />
      <span>{erro}</span>
      {aoTentarDeNovo && (
        <button type="button" className="botao botao-secundario botao-pequeno" onClick={aoTentarDeNovo}>
          Tentar de novo
        </button>
      )}
    </div>
  )
}

export function Vazio({ children }: { children: ReactNode }) {
  return <p className="vazio">{children}</p>
}

export type Migalha = { rotulo: string; para?: string }

export function Migalhas({ itens }: { itens: Migalha[] }) {
  return (
    <nav aria-label="Você está em" className="migalhas">
      <ol>
        {itens.map((item, i) => (
          <li key={`${item.rotulo}-${i}`}>
            {item.para && i < itens.length - 1 ? (
              <Link to={item.para}>{item.rotulo}</Link>
            ) : (
              <span aria-current={i === itens.length - 1 ? 'page' : undefined}>{item.rotulo}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export function Cabecalho({ titulo, sobretitulo, descricao, acoes }: {
  titulo: ReactNode
  sobretitulo?: string
  descricao?: ReactNode
  acoes?: ReactNode
}) {
  return (
    <header className="cabecalho">
      <div>
        {sobretitulo && <p className="sobretitulo">{sobretitulo}</p>}
        <h1>{titulo}</h1>
        {descricao && <p className="cabecalho-descricao">{descricao}</p>}
      </div>
      {acoes && <div className="cabecalho-acoes">{acoes}</div>}
    </header>
  )
}

/** Indica que a tela se atualiza sozinha; mostra o erro da última atualização, se houver. */
export function AtualizacaoAutomatica({ segundos, erro }: { segundos: number; erro?: Error }) {
  return (
    <p className={`atualizacao ${erro ? 'atualizacao-erro' : ''}`} aria-live="polite">
      <Icon name="refresh" />
      {erro ? `Falha ao atualizar: ${erro.message}` : `Atualiza a cada ${segundos} s`}
    </p>
  )
}

export function Aviso({ tom = 'info', children }: { tom?: 'info' | 'sucesso' | 'erro'; children: ReactNode }) {
  return (
    <div className={`aviso aviso-${tom}`} role={tom === 'erro' ? 'alert' : 'status'}>
      {children}
    </div>
  )
}
