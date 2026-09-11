import { useState } from 'react'
import type { Train, TrainStatus } from '../types/train'
import { demoTrains } from '../data/trains'
import logo from '../assets/Logo.png'
import './Dashboard.css'

type DashboardProps = {
  /** Callback executado quando o usuário escolhe um trem. */
  onSelectTrain?: (train: Train) => void
}

/** Ícone genérico para os itens da navegação lateral. */
function NavigationIcon({ name }: { name: 'home' | 'train' | 'alert' | 'history' | 'settings' }) {
  const paths = {
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9" /><path d="M9 20v-6h6v6" /></>,
    train: <><rect x="5" y="3" width="14" height="15" rx="3" /><path d="M8 18 6 21M16 18l2 3M7 8h10M8 13h.01M16 13h.01" /><path d="M9 21h6" /></>,
    alert: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    history: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.41 1.41-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V20h-2v-.09a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-1.41-1.41.06-.06A1.7 1.7 0 0 0 9.4 15a1.7 1.7 0 0 0-1.56-1.03H7v-2h.84A1.7 1.7 0 0 0 9.4 10a1.7 1.7 0 0 0-.34-1.88L9 8.06l1.41-1.41.06.06A1.7 1.7 0 0 0 12.35 7.05 1.7 1.7 0 0 0 13.38 5.5V5h2v.5a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 1.41 1.41-.06.06A1.7 1.7 0 0 0 19.4 10a1.7 1.7 0 0 0 1.56 1.03H21v2h-.04A1.7 1.7 0 0 0 19.4 15Z" /></>,
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="navigation-icon">
      {paths[name]}
    </svg>
  )
}

/** Ícone de trem usado nos cartões de seleção. */
function TrainIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 64 64" className="train-icon">
      <rect x="16" y="8" width="32" height="38" rx="8" />
      <path d="M22 46 17 55M42 46l5 9M22 22h20M23 32h.01M41 32h.01M24 55h16" />
      <path d="M27 14h10v8H27z" />
      <path d="M22 46h20" />
    </svg>
  )
}

function statusLabel(status: TrainStatus) {
  if (status === 'attention') return 'Atenção'
  if (status === 'offline') return 'Offline'
  return 'Monitoramento ativo'
}

export default function Dashboard({ onSelectTrain }: DashboardProps) {
  const [selectedTrainId, setSelectedTrainId] = useState<string | null>(null)

  function handleSelectTrain(train: Train) {
    setSelectedTrainId(train.id)
    onSelectTrain?.(train)
  }

  return (
    <main className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <img src={logo} alt="Logo RailSense" />
          <span>RailSense</span>
        </div>

        <nav className="dashboard-navigation" aria-label="Navegação principal">
          <button className="nav-item nav-item-active" type="button">
            <NavigationIcon name="home" />
            <span>Início</span>
          </button>
          <button className="nav-item" type="button">
            <NavigationIcon name="train" />
            <span>Trens</span>
          </button>
          <button className="nav-item" type="button">
            <NavigationIcon name="alert" />
            <span>Alertas</span>
          </button>
          <button className="nav-item" type="button">
            <NavigationIcon name="history" />
            <span>Histórico</span>
          </button>
          <button className="nav-item" type="button">
            <NavigationIcon name="settings" />
            <span>Configurações</span>
          </button>
        </nav>

        <div className="sidebar-user">
          <div className="user-avatar" aria-hidden="true">G</div>
          <div>
            <strong>Gustavo Oliveira</strong>
            <span>Engenheiro</span>
          </div>
        </div>
      </aside>

      <section className="dashboard-content">
        <header className="dashboard-topbar">
          <span className="topbar-status"><i /> Sistema online</span>
          <button className="profile-button" type="button" aria-label="Abrir perfil de Gustavo Oliveira">
            <span className="profile-avatar">G</span>
            <span>Gustavo Oliveira</span>
            <span aria-hidden="true">⌄</span>
          </button>
        </header>

        <div className="dashboard-main">
          <p className="eyebrow">Centro de monitoramento</p>
          <h1>Bem-vindo ao RailSense</h1>
          <p className="dashboard-subtitle">
            Selecione um trem para acessar seus vagões, rolamentos e sensores.
          </p>

          <section className="train-section" aria-labelledby="train-section-title">
            <div className="section-heading">
              <div>
                <h2 id="train-section-title">Trens monitorados</h2>
                <p>Escolha uma composição para continuar.</p>
              </div>
              <span className="train-count">{demoTrains.length} composições</span>
            </div>

            <div className="train-grid">
              {demoTrains.map((train) => (
                <article
                  className={`train-card ${selectedTrainId === train.id ? 'train-card-selected' : ''}`}
                  key={train.id}
                >
                  <div className="train-card-icon"><TrainIcon /></div>
                  <h3>{train.name}</h3>
                  <p>{train.description}</p>
                  <div className="train-meta">
                    <span className={`status status-${train.status}`}>
                      <i /> {statusLabel(train.status)}
                    </span>
                    <span>{train.wagonCount} vagões</span>
                  </div>
                  <span className="train-updated">{train.lastUpdate}</span>
                  <button
                    className="access-train-button"
                    type="button"
                    onClick={() => handleSelectTrain(train)}
                  >
                    Acessar trem <span aria-hidden="true">→</span>
                  </button>
                </article>
              ))}
            </div>
          </section>

          {selectedTrainId && (
            <p className="selection-feedback" role="status">
              Trem selecionado. A tela de vagões será implementada na próxima etapa.
            </p>
          )}
        </div>
      </section>
    </main>
  )
}

