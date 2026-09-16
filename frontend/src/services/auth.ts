export type AuthenticatedUser = {
  id: number
  nome: string
  email: string
  papel: string
}

type ApiError = { message?: string }

function csrfToken(): string | undefined {
  return document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith('XSRF-TOKEN='))
    ?.split('=')[1]
}

async function ensureCsrfToken(): Promise<string> {
  let token = csrfToken()
  if (token) return decodeURIComponent(token)

  const response = await fetch('/api/auth/csrf', { credentials: 'include' })
  if (!response.ok) throw new Error('Não foi possível iniciar uma sessão segura.')

  token = csrfToken()
  if (!token) throw new Error('Token CSRF ausente.')
  return decodeURIComponent(token)
}

export async function login(email: string, password: string): Promise<AuthenticatedUser> {
  return submitCredentials('/api/auth/login', { email, password })
}

export async function register(nome: string, email: string, password: string): Promise<AuthenticatedUser> {
  return submitCredentials('/api/auth/register', { nome, email, password })
}

async function submitCredentials(url: string, body: Record<string, string>): Promise<AuthenticatedUser> {
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-XSRF-TOKEN': await ensureCsrfToken(),
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as ApiError
    throw new Error(error.message ?? 'Falha na autenticação.')
  }

  return response.json() as Promise<AuthenticatedUser>
}

export async function getCurrentUser(): Promise<AuthenticatedUser> {
  const response = await fetch('/api/auth/me', { credentials: 'include' })
  if (!response.ok) throw new Error('Sessão não autenticada.')
  return response.json() as Promise<AuthenticatedUser>
}
