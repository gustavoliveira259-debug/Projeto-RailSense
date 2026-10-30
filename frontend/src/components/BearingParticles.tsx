import { useEffect, useRef } from 'react'

type Particula = { x: number; y: number; z: number; cor: number; tamanho: number }

/** Paleta das partículas: ciano, violeta e âmbar, como nos halos da interface. */
const CORES = ['46,230,214', '155,123,255', '245,181,68', '76,184,240']

/**
 * Rolamento desenhado com partículas: pista externa, pista interna e esferas
 * entre elas, girando em 3D. Puramente decorativo (aria-hidden).
 * Respeita prefers-reduced-motion (desenha um quadro estático) e pausa fora da tela.
 */
export function BearingParticles({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    // Geometria em unidades normalizadas (raio externo = 1).
    const particulas: Particula[] = []
    const anel = (raio: number, tubo: number, quantidade: number, cor: number) => {
      for (let i = 0; i < quantidade; i++) {
        const u = Math.random() * Math.PI * 2
        const v = Math.random() * Math.PI * 2
        const r = raio + tubo * Math.cos(v)
        particulas.push({ x: r * Math.cos(u), y: tubo * Math.sin(v), z: r * Math.sin(u), cor, tamanho: 0.6 + Math.random() * 1.2 })
      }
    }
    anel(1, 0.16, 2600, 0) // pista externa
    anel(0.52, 0.1, 1200, 1) // pista interna
    // Esferas entre as pistas.
    const ESFERAS = 11
    for (let e = 0; e < ESFERAS; e++) {
      const angulo = (e / ESFERAS) * Math.PI * 2
      const cx = 0.76 * Math.cos(angulo)
      const cz = 0.76 * Math.sin(angulo)
      for (let i = 0; i < 160; i++) {
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)
        const raio = 0.1
        particulas.push({
          x: cx + raio * Math.sin(phi) * Math.cos(theta),
          y: raio * Math.cos(phi),
          z: cz + raio * Math.sin(phi) * Math.sin(theta),
          cor: e % 3 === 0 ? 2 : 3,
          tamanho: 0.7 + Math.random(),
        })
      }
    }
    // Poeira solta ao redor, para dar profundidade.
    for (let i = 0; i < 260; i++) {
      const u = Math.random() * Math.PI * 2
      const r = 1.25 + Math.random() * 0.6
      particulas.push({ x: r * Math.cos(u), y: (Math.random() - 0.5) * 0.9, z: r * Math.sin(u), cor: i % 4, tamanho: 0.5 + Math.random() * 0.8 })
    }

    let largura = 0
    let altura = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const redimensionar = () => {
      const rect = canvas.getBoundingClientRect()
      largura = rect.width
      altura = rect.height
      canvas.width = Math.round(largura * dpr)
      canvas.height = Math.round(altura * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    redimensionar()

    const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const inclinacao = 1.05 // rad: deixa o anel visto em perspectiva
    const cosI = Math.cos(inclinacao)
    const sinI = Math.sin(inclinacao)

    const desenhar = (t: number) => {
      ctx.clearRect(0, 0, largura, altura)
      const escala = Math.min(largura, altura) * 0.36
      const cx = largura / 2
      const cy = altura / 2
      const giro = t * 0.00018
      const cosG = Math.cos(giro)
      const sinG = Math.sin(giro)
      ctx.globalCompositeOperation = 'lighter'
      for (const p of particulas) {
        // Gira em torno do eixo do rolamento e inclina para a câmera.
        const x1 = p.x * cosG - p.z * sinG
        const z1 = p.x * sinG + p.z * cosG
        const y2 = p.y * cosI - z1 * sinI
        const z2 = p.y * sinI + z1 * cosI
        const perspectiva = 2.6 / (2.6 + z2)
        const px = cx + x1 * escala * perspectiva
        const py = cy + y2 * escala * perspectiva
        const profundidade = Math.max(0.15, Math.min(1, 0.65 - z2 * 0.45))
        ctx.fillStyle = `rgba(${CORES[p.cor]},${profundidade})`
        const s = p.tamanho * perspectiva
        ctx.fillRect(px, py, s, s)
      }
      ctx.globalCompositeOperation = 'source-over'
    }

    let quadro = 0
    let visivel = true
    const loop = (t: number) => {
      if (visivel) desenhar(t)
      quadro = requestAnimationFrame(loop)
    }
    if (reduzido) desenhar(0)
    else quadro = requestAnimationFrame(loop)

    const observer = new ResizeObserver(() => {
      redimensionar()
      if (reduzido) desenhar(0)
    })
    observer.observe(canvas)
    const onVisibility = () => {
      visivel = document.visibilityState === 'visible'
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelAnimationFrame(quadro)
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />
}
