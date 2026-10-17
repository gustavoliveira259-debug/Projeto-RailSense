/**
 * Único ponto de acesso à API.
 *
 * - A sessão fica no cookie HttpOnly RAILSENSE_SESSION, enviado pelo navegador.
 *   Nada de token ou senha em localStorage.
 * - Toda requisição que altera dados leva o token CSRF (cookie XSRF-TOKEN → cabeçalho X-XSRF-TOKEN).
 * - 401 avisa o AuthProvider, que volta para o login.
 */

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type Metodo = 'GET' | 'POST' | 'PATCH'

type Opcoes = {
  /** Não dispara o retorno ao login (ex.: checagem inicial da sessão e o próprio login). */
  ignorar401?: boolean
}

let aoExpirarSessao: (() => void) | null = null

export function definirAoExpirarSessao(callback: (() => void) | null) {
  aoExpirarSessao = callback
}

function lerCookieCsrf(): string | null {
  const cookie = document.cookie.split('; ').find((c) => c.startsWith('XSRF-TOKEN='))
  return cookie ? decodeURIComponent(cookie.slice('XSRF-TOKEN='.length)) : null
}

async function obterCsrf(renovar = false): Promise<string> {
  const atual = renovar ? null : lerCookieCsrf()
  if (atual) return atual
  const resposta = await fetch('/api/auth/csrf', { credentials: 'same-origin' })
  const token = lerCookieCsrf()
  if (!resposta.ok || !token) throw new ApiError(resposta.status, 'Não foi possível iniciar uma sessão segura.')
  return token
}

const MENSAGENS_PADRAO: Record<number, string> = {
  400: 'Dados inválidos.',
  401: 'Sua sessão expirou. Entre novamente.',
  403: 'Você não tem permissão para esta ação.',
  404: 'Registro não encontrado.',
  409: 'A operação conflita com o estado atual.',
  413: 'Arquivo grande demais.',
  429: 'Muitas tentativas. Aguarde alguns minutos.',
  502: 'Serviço externo indisponível. Tente novamente.',
}

async function lerErro(resposta: Response): Promise<ApiError> {
  let mensagem: string | undefined
  try {
    const corpo = (await resposta.json()) as { message?: unknown }
    if (typeof corpo.message === 'string' && corpo.message.trim()) mensagem = corpo.message
  } catch {
    // Corpo vazio ou não-JSON (ex.: página de erro do proxy).
  }
  return new ApiError(
    resposta.status,
    mensagem ?? MENSAGENS_PADRAO[resposta.status] ?? `Erro inesperado (HTTP ${resposta.status}).`,
  )
}

async function executar(metodo: Metodo, url: string, corpo: unknown, renovarCsrf: boolean): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  let body: BodyInit | undefined
  if (corpo instanceof FormData) {
    body = corpo // O navegador define o Content-Type com o boundary.
  } else if (corpo !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(corpo)
  }
  if (metodo !== 'GET') headers['X-XSRF-TOKEN'] = await obterCsrf(renovarCsrf)
  return fetch(url, { method: metodo, headers, body, credentials: 'same-origin' })
}

export async function requisitar<T>(metodo: Metodo, url: string, corpo?: unknown, opcoes: Opcoes = {}): Promise<T> {
  let resposta: Response
  try {
    resposta = await executar(metodo, url, corpo, false)
    // Token CSRF velho (ex.: cookie apagado no logout): renova uma vez e repete.
    if (resposta.status === 403 && metodo !== 'GET') {
      resposta = await executar(metodo, url, corpo, true)
    }
  } catch (e) {
    if (e instanceof ApiError) throw e
    throw new ApiError(0, 'Sem conexão com o servidor.')
  }

  if (resposta.status === 401 && !opcoes.ignorar401) aoExpirarSessao?.()
  if (!resposta.ok) throw await lerErro(resposta)
  if (resposta.status === 204) return undefined as T
  const texto = await resposta.text()
  return (texto ? JSON.parse(texto) : undefined) as T
}

export function mensagemDeErro(erro: unknown): string {
  if (erro instanceof Error && erro.message) return erro.message
  return 'Erro inesperado.'
}
