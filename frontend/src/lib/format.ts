/** Formatação pt-BR centralizada: datas, horários relativos e números. */

const dateTime = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
const dateOnly = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' })
const relative = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })
const integer = new Intl.NumberFormat('pt-BR')

const valid = (iso: string | null | undefined): iso is string => !!iso && !Number.isNaN(new Date(iso).getTime())

export const formatDateTime = (iso: string | null | undefined) => (valid(iso) ? dateTime.format(new Date(iso)) : '—')
export const formatDay = (iso: string) => dateOnly.format(new Date(iso))
export const formatInteger = (value: number) => integer.format(value)

/** Score de diferença do Gemini (0–1) como percentual inteiro: 0,734 → "73%". */
export const formatScore = (value: number | null | undefined) =>
  value === null || value === undefined || !Number.isFinite(value) ? '—' : `${Math.round(value * 100)}%`

/** "há 5 minutos", "ontem", "há 3 dias". */
export function formatRelative(iso: string | null | undefined, now = Date.now()) {
  if (!valid(iso)) return '—'
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000)
  const abs = Math.abs(seconds)
  if (abs < 60) return 'agora mesmo'
  if (abs < 3600) return relative.format(Math.round(seconds / 60), 'minute')
  if (abs < 86400) return relative.format(Math.round(seconds / 3600), 'hour')
  return relative.format(Math.round(seconds / 86400), 'day')
}

/** Iniciais para avatar: "Ana Ribeiro" → "AR". */
export function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '?') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

export const SENHA_MINIMA = 12

/** Senha temporária forte para o ADMIN entregar ao usuário (sem caracteres ambíguos). */
export function gerarSenhaTemporaria(tamanho = 16) {
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*?'
  const limite = 256 - (256 % alfabeto.length) // descarta bytes que enviesariam o sorteio
  const saida: string[] = []
  while (saida.length < tamanho) {
    for (const byte of crypto.getRandomValues(new Uint8Array(tamanho * 2))) {
      if (byte < limite && saida.length < tamanho) saida.push(alfabeto[byte % alfabeto.length])
    }
  }
  return saida.join('')
}
