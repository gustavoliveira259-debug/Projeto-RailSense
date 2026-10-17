import type {
  Classificacao,
  NivelAlerta,
  Papel,
  StatusAlerta,
  StatusMonitoramento,
  TipoSensor,
} from '../api/types'

const dataHora = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'medium' })
const hora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

export function formatarDataHora(iso: string | null | undefined): string {
  if (!iso) return '—'
  const data = new Date(iso)
  return Number.isNaN(data.getTime()) ? '—' : dataHora.format(data)
}

export function formatarHora(iso: string | number | Date): string {
  return hora.format(new Date(iso))
}

/** "há 5 s", "há 3 min", "há 2 h", "há 4 dias". */
export function formatarRelativo(iso: string | null | undefined, agora = Date.now()): string {
  if (!iso) return 'nunca'
  const segundos = Math.max(0, Math.round((agora - new Date(iso).getTime()) / 1000))
  if (Number.isNaN(segundos)) return '—'
  if (segundos < 60) return `há ${segundos} s`
  const minutos = Math.floor(segundos / 60)
  if (minutos < 60) return `há ${minutos} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `há ${horas} h`
  const dias = Math.floor(horas / 24)
  return `há ${dias} ${dias === 1 ? 'dia' : 'dias'}`
}

export function formatarNumero(valor: number | null | undefined, casas = 1): string {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) return '—'
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: casas })
}

/** Score de 0 a 1 → "42%". */
export function formatarPercentual(score: number | null | undefined): string {
  if (score === null || score === undefined || !Number.isFinite(score)) return '—'
  return `${Math.round(score * 100)}%`
}

/** O firmware atual envia o valor bruto do ADC, sem unidade física. */
export const UNIDADE: Record<TipoSensor, string> = { VIBRACAO: 'un.', TEMPERATURA: '°C' }

export const ROTULO_SENSOR: Record<TipoSensor, string> = { VIBRACAO: 'Vibração', TEMPERATURA: 'Temperatura' }

export function formatarLeitura(valor: number | null | undefined, tipo: TipoSensor): string {
  if (valor === null || valor === undefined) return '—'
  return `${formatarNumero(valor, tipo === 'VIBRACAO' ? 0 : 1)} ${UNIDADE[tipo]}`
}

export const ROTULO_STATUS: Record<StatusMonitoramento, string> = {
  NORMAL: 'Normal',
  ATENCAO: 'Atenção',
  CRITICO: 'Crítico',
  SEM_LEITURAS: 'Sem leituras',
}

export const ROTULO_STATUS_ALERTA: Record<StatusAlerta, string> = {
  NOVO: 'Novo',
  EM_ANALISE: 'Em análise',
  CONFIRMADO: 'Confirmado',
  FALSO_POSITIVO: 'Falso positivo',
  FECHADO: 'Fechado',
}

export const ROTULO_NIVEL: Record<NivelAlerta, string> = { BAIXO: 'Baixo', MEDIO: 'Médio', CRITICO: 'Crítico' }

export const ROTULO_CLASSIFICACAO: Record<Classificacao, string> = {
  NORMAL: 'Normal',
  SUSPEITO: 'Suspeito',
  VAZAMENTO: 'Vazamento',
}

export const ROTULO_PAPEL: Record<Papel, string> = { ENGENHEIRO: 'Engenheiro', GERENTE: 'Gerente', ADMIN: 'TI (administrador)' }

/** Alertas que ainda pedem atenção: aguardando decisão ou confirmados e não fechados. */
export const STATUS_ALERTA_ATIVOS: StatusAlerta[] = ['NOVO', 'EM_ANALISE', 'CONFIRMADO']

export const SENHA_MINIMA = 12

/** Senha aleatória para a TI entregar ao usuário (sem caracteres ambíguos como 0/O, 1/l). */
export function gerarSenha(tamanho = 16): string {
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*?'
  const limite = 256 - (256 % alfabeto.length) // descarta bytes que enviesariam o sorteio
  const resultado: string[] = []
  while (resultado.length < tamanho) {
    for (const byte of crypto.getRandomValues(new Uint8Array(tamanho * 2))) {
      if (byte < limite && resultado.length < tamanho) resultado.push(alfabeto[byte % alfabeto.length])
    }
  }
  return resultado.join('')
}
