import { useEffect, useId, useMemo, useRef, useState, type PointerEvent } from 'react'
import type { PontoLeitura } from '../api/types'
import { formatarHora, formatarNumero } from '../lib/format'

type Props = {
  titulo: string
  pontos: PontoLeitura[]
  unidade: string
  /** Janela exibida no eixo X, terminando agora. */
  minutos: number
  /** Instante (ms) em que os pontos foram buscados: fim da janela. */
  agora: number
  casas?: number
  altura?: number
}

const MARGEM = { topo: 12, direita: 16, base: 28, esquerda: 52 }

/** Escala "bonita" para o eixo Y: 4–5 marcas em passos de 1, 2 ou 5 × 10^n. */
function marcasY(min: number, max: number): number[] {
  if (min === max) {
    const folga = Math.abs(min) * 0.1 || 1
    min -= folga
    max += folga
  }
  const bruto = (max - min) / 4
  const magnitude = 10 ** Math.floor(Math.log10(bruto))
  const passo = [1, 2, 5, 10].map((m) => m * magnitude).find((p) => p >= bruto) ?? bruto
  const inicio = Math.floor(min / passo) * passo
  const marcas: number[] = []
  for (let v = inicio; v <= max + passo * 0.5; v += passo) marcas.push(Number(v.toFixed(10)))
  return marcas
}

/** Gráfico de linha em SVG puro, com crosshair e tooltip do ponto sob o cursor. */
export function LineChart({ titulo, pontos, unidade, minutos, agora, casas = 1, altura = 220 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [largura, setLargura] = useState(600)
  const [hover, setHover] = useState<number | null>(null)
  const descId = useId()

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(([entrada]) => setLargura(Math.max(260, entrada.contentRect.width)))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const dados = useMemo(() => pontos.map((p) => ({ t: new Date(p.em).getTime(), v: p.valor })), [pontos])

  // A janela termina no momento da busca (ou no último ponto, se o relógio do servidor estiver adiantado).
  const fim = Math.max(dados.length ? dados[dados.length - 1].t : 0, agora)
  const inicio = fim - minutos * 60_000
  const valores = dados.map((d) => d.v)
  const ticksY = marcasY(valores.length ? Math.min(...valores) : 0, valores.length ? Math.max(...valores) : 1)
  const yMin = ticksY[0]
  const yMax = ticksY[ticksY.length - 1]

  const larguraPlot = largura - MARGEM.esquerda - MARGEM.direita
  const alturaPlot = altura - MARGEM.topo - MARGEM.base
  const x = (t: number) => MARGEM.esquerda + ((t - inicio) / (fim - inicio)) * larguraPlot
  const y = (v: number) => MARGEM.topo + (1 - (v - yMin) / (yMax - yMin || 1)) * alturaPlot

  const caminho = dados.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(d.t).toFixed(1)},${y(d.v).toFixed(1)}`).join('')
  const ticksX = Array.from({ length: 5 }, (_, i) => inicio + ((fim - inicio) * i) / 4)

  function aoMover(evento: PointerEvent<SVGRectElement>) {
    if (!dados.length) return
    const rect = evento.currentTarget.getBoundingClientRect()
    const tCursor = inicio + ((evento.clientX - rect.left) / rect.width) * (fim - inicio)
    // Busca binária do ponto mais próximo no tempo.
    let lo = 0
    let hi = dados.length - 1
    while (lo < hi) {
      const meio = (lo + hi) >> 1
      if (dados[meio].t < tCursor) lo = meio + 1
      else hi = meio
    }
    const anterior = Math.max(0, lo - 1)
    setHover(Math.abs(dados[anterior].t - tCursor) < Math.abs(dados[lo].t - tCursor) ? anterior : lo)
  }

  const pontoHover = hover !== null ? dados[hover] : undefined
  const ultimo = dados[dados.length - 1]

  return (
    <figure className="grafico">
      <figcaption className="grafico-titulo">
        <span>{titulo}</span>
        <span className="grafico-ultimo">
          {ultimo ? `${formatarNumero(ultimo.v, casas)} ${unidade}` : 'sem dados'}
        </span>
      </figcaption>
      <div ref={containerRef} className="grafico-area">
        {dados.length === 0 ? (
          <p className="grafico-vazio" style={{ height: altura }}>
            Nenhuma leitura nos últimos {minutos >= 60 ? `${minutos / 60} h` : `${minutos} min`}.
          </p>
        ) : (
          <svg width={largura} height={altura} role="img" aria-describedby={descId}>
            <g className="grafico-grade">
              {ticksY.map((v) => (
                <g key={v}>
                  <line x1={MARGEM.esquerda} x2={largura - MARGEM.direita} y1={y(v)} y2={y(v)} />
                  <text x={MARGEM.esquerda - 8} y={y(v)} dy="0.32em" textAnchor="end">
                    {formatarNumero(v, casas)}
                  </text>
                </g>
              ))}
              {ticksX.map((t, i) => (
                <text
                  key={t}
                  x={x(t)}
                  y={altura - 8}
                  textAnchor={i === 0 ? 'start' : i === ticksX.length - 1 ? 'end' : 'middle'}
                >
                  {formatarHora(t).slice(0, 5)}
                </text>
              ))}
            </g>
            <path className="grafico-linha" d={caminho} />
            {pontoHover && (
              <g className="grafico-hover">
                <line x1={x(pontoHover.t)} x2={x(pontoHover.t)} y1={MARGEM.topo} y2={MARGEM.topo + alturaPlot} />
                <circle cx={x(pontoHover.t)} cy={y(pontoHover.v)} r={4.5} />
              </g>
            )}
            <rect
              className="grafico-captura"
              x={MARGEM.esquerda}
              y={MARGEM.topo}
              width={larguraPlot}
              height={alturaPlot}
              onPointerMove={aoMover}
              onPointerLeave={() => setHover(null)}
            />
          </svg>
        )}
        {pontoHover && (
          <div
            className="grafico-tooltip"
            style={{
              left: Math.min(Math.max(x(pontoHover.t), 70), largura - 70),
              top: Math.max(y(pontoHover.v) - 12, 0),
            }}
          >
            <strong>
              {formatarNumero(pontoHover.v, casas)} {unidade}
            </strong>
            <span>{formatarHora(pontoHover.t)}</span>
          </div>
        )}
      </div>
      <p id={descId} className="sr-only">
        {dados.length
          ? `${titulo}: ${dados.length} pontos. Mínimo ${formatarNumero(Math.min(...valores), casas)}, máximo ${formatarNumero(Math.max(...valores), casas)}, último ${formatarNumero(ultimo!.v, casas)} ${unidade} às ${formatarHora(ultimo!.t)}.`
          : `${titulo}: sem leituras na janela.`}
      </p>
    </figure>
  )
}
