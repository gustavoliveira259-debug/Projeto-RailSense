/**
 * Cliente HTTP do RailSense.
 *
 * A sessão fica em um cookie HttpOnly (RAILSENSE_SESSION) e as requisições que
 * alteram estado enviam o token CSRF lido do cookie XSRF-TOKEN, como exige o
 * CookieCsrfTokenRepository configurado no SecurityConfig do backend.
 */

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function readCsrfCookie(): string | undefined {
  return document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith('XSRF-TOKEN='))
    ?.split('=')[1]
}

export async function ensureCsrfToken(): Promise<string> {
  let token = readCsrfCookie()
  if (token) return decodeURIComponent(token)

  const response = await fetch('/api/auth/csrf', { credentials: 'include' })
  if (!response.ok) throw new ApiError(response.status, 'Não foi possível iniciar uma sessão segura.')

  token = readCsrfCookie()
  if (!token) throw new ApiError(500, 'Token CSRF ausente.')
  return decodeURIComponent(token)
}

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

/** Faz a requisição, anexa o CSRF quando necessário e converte erros em ApiError. */
export async function request<T>(url: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init
  const method = (rest.method ?? 'GET').toUpperCase()
  const finalHeaders = new Headers(headers)

  if (json !== undefined) finalHeaders.set('Content-Type', 'application/json')
  if (UNSAFE_METHODS.has(method)) finalHeaders.set('X-XSRF-TOKEN', await ensureCsrfToken())

  const response = await fetch(url, {
    ...rest,
    method,
    credentials: 'include',
    headers: finalHeaders,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { message?: string }
    throw new ApiError(response.status, body.message ?? 'Falha na comunicação com o servidor.')
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}
