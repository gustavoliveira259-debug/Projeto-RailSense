import { useMemo, useState } from 'react'
import type { Train, TrainStatus } from '../types/train'
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

function CameraIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="camera-icon">
      <path d="M4 7h3l1.4-2h7.2L17 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  )
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
  const [wagonFilter, setWagonFilter] = useState<TrainStatus | 'all'>('all')
  const [selectedWagonId, setSelectedWagonId] = useState<string | null>(null)

  if (!details) {
    return (
      <main className="details-page details-empty">
        <h1>Detalhes indisponíveis</h1>
        <p>Não foi possível localizar os dados deste trem.</p>
        <button type="button" onClick={onBack}>Voltar para os trens</button>
      </main>
    )
  }

  const visibleWagons = useMemo(
    () => details.wagons.filter((wagon) => wagonFilter === 'all' || wagon.status === wagonFilter),
    [details.wagons, wagonFilter],
  )
  const selectedWagon = details.wagons.find((wagon) => wagon.id === selectedWagonId) ?? visibleWagons[0] ?? details.wagons[0]

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

        <section className="details-panel" aria-labelledby="wagons-title">
          <div className="details-panel-heading">
            <div>
              <h2 id="wagons-title">Vagões da composição</h2>
              <p>Escolha um vagão para consultar seus rolamentos, sensores e a última foto recebida.</p>
            </div>
            <div className="wagon-select-controls">
              <label className="wagon-filter">
                Filtrar por status
                <select value={wagonFilter} onChange={(event) => setWagonFilter(event.target.value as TrainStatus | 'all')}>
                  <option value="all">Todos os vagões</option>
                  <option value="active">Normal</option>
                  <option value="attention">Atenção</option>
                  <option value="offline">Offline</option>
                </select>
              </label>
              <label className="wagon-filter">
                Selecionar vagão
                <select value={selectedWagon.id} onChange={(event) => setSelectedWagonId(event.target.value)}>
                  {visibleWagons.map((wagon) => (
                    <option key={wagon.id} value={wagon.id}>
                      {wagon.id} — {statusLabel(wagon.status)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <p className="wagon-selection-summary">
            {visibleWagons.length === 1
              ? '1 vagão disponível para seleção.'
              : `${visibleWagons.length} vagões disponíveis para seleção.`}
          </p>
        </section>

        <section className="wagon-details-panel" aria-labelledby="wagon-details-title">
          <div className="wagon-details-heading">
            <div>
              <p className="eyebrow">Vagão selecionado</p>
              <h2 id="wagon-details-title">{selectedWagon.id}</h2>
              <span className={`wagon-status ${selectedWagon.status === 'active' ? 'normal-status' : selectedWagon.status === 'attention' ? 'attention-status' : 'offline-status'}`}><i /> {statusLabel(selectedWagon.status)}</span>
            </div>
            <span>{selectedWagon.monitoredBearings} rolamentos monitorados</span>
          </div>

          <div className="wagon-inspection-grid">
            <div className="bearing-readings">
              <span>Rolamento em foco</span><strong>{selectedWagon.bearingId}</strong>
              <div><span>Temperatura</span><strong>{selectedWagon.temperature}</strong></div>
              <div><span>Vibração</span><strong>{selectedWagon.vibration}</strong></div>
              <div><span>Alertas ativos</span><strong>{selectedWagon.activeAlerts}</strong></div>
            </div>
            <div className="bearing-photo">
              {selectedWagon.lastImageUrl ? (
                <img src={selectedWagon.lastImageUrl} alt={`Última foto do rolamento ${selectedWagon.bearingId}`} />
              ) : (
                <div className="photo-unavailable"><CameraIcon /><span>Nenhuma foto recebida</span></div>
              )}
              <div className="bearing-photo-caption"><strong>Última foto do rolamento</strong><span>{selectedWagon.lastImageAt ?? 'Aguardando envio da câmera'}</span></div>
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

