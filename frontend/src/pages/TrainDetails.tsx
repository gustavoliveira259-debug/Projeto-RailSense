import type { Train } from '../types/train'
import { demoTrainDetails, type TrainDetails as TrainDetailsData } from '../types/trainDetails'
import './TrainDetails.css'

type TrainDetailsProps = {
  train: Train
  onBack: () => void
}

function statusLabel(status: TrainDetailsData['status']) {
  if (status === 'attention') return 'Atenção'
  if (status === 'offline') return 'Offline'
  return 'Monitoramento ativo'
}

function StatusIcon() {
  return <span className="details-status-dot" aria-hidden="true" />
}

/**
 * Tela exibida depois que o usuário escolhe um trem.
 *
 * Nesta primeira versão, os números são demonstrativos. O componente já
 * recebe o trem selecionado por propriedade, o que facilita trocar os dados
 * locais por uma chamada ao serviço autenticado posteriormente.
 */
export default function TrainDetails({ train, onBack }: TrainDetailsProps) {
  const details = demoTrainDetails[train.id]

  if (!details) {
    return (
      <main className="details-page details-empty">
        <h1>Detalhes indisponíveis</h1>
        <p>Não foi possível localizar os dados deste trem.</p>
        <button type="button" onClick={onBack}>Voltar para os trens</button>
      </main>
    )
  }

  return (
    <main className="details-page">
      <header className="details-header">
        <button className="back-button" type="button" onClick={onBack}>
          <span aria-hidden="true">←</span>
          Voltar para os trens
        </button>
        <span className="details-online"><i /> Sistema online</span>
      </header>

      <section className="details-content">
        <div className="details-heading">
          <div>
            <p className="eyebrow">Composição selecionada</p>
            <h1>{details.trainName}</h1>
            <p className="details-route">{details.route}</p>
          </div>
          <div className="details-status-badge">
            <StatusIcon />
            {statusLabel(details.status)}
          </div>
        </div>

        <section className="details-metrics" aria-label="Resumo do trem">
          <article className="details-metric-card">
            <span>Vagões monitorados</span>
            <strong>{details.wagonCount}</strong>
            <small>Composição atual</small>
          </article>
          <article className="details-metric-card">
            <span>Rolamentos monitorados</span>
            <strong>{details.monitoredBearings}</strong>
            <small>Dados multimodais ativos</small>
          </article>
          <article className="details-metric-card warning-metric">
            <span>Alertas ativos</span>
            <strong>{details.activeAlerts}</strong>
            <small>{details.criticalAlerts} em nível crítico</small>
          </article>
          <article className="details-metric-card">
            <span>Última atualização</span>
            <strong className="metric-time">{details.lastUpdate}</strong>
            <small>Imagem mais recente: {details.lastImageAt}</small>
          </article>
        </section>

        <section className="details-panel">
          <div className="details-panel-heading">
            <div>
              <p className="eyebrow">Próxima etapa</p>
              <h2>Vagões da composição</h2>
              <p>Selecione um vagão para consultar seus rolamentos e sensores.</p>
            </div>
            <button className="primary-details-button" type="button">
              Ver vagões <span aria-hidden="true">→</span>
            </button>
          </div>

          <div className="wagon-preview-grid" aria-label="Resumo dos vagões">
            <div className="wagon-preview-card">
              <span className="wagon-number">VAG-0001</span>
              <span className="wagon-status normal-status"><i /> Normal</span>
              <small>8 rolamentos monitorados</small>
            </div>
            <div className="wagon-preview-card attention-wagon">
              <span className="wagon-number">VAG-0002</span>
              <span className="wagon-status attention-status"><i /> Atenção</span>
              <small>1 rolamento em análise</small>
            </div>
            <div className="wagon-preview-card">
              <span className="wagon-number">VAG-0003</span>
              <span className="wagon-status normal-status"><i /> Normal</span>
              <small>8 rolamentos monitorados</small>
            </div>
          </div>
        </section>

        <section className="details-alert-panel">
          <div>
            <p className="eyebrow">Acompanhamento preventivo</p>
            <h2>Existem {details.activeAlerts} alertas aguardando análise</h2>
            <p>Acesse os vagões para identificar o rolamento relacionado e consultar o histórico dos sensores.</p>
          </div>
          <span className="critical-counter">{details.criticalAlerts} críticos</span>
        </section>
      </section>
    </main>
  )
}

