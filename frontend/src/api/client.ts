/**
 * Funções de acesso à API do RailSense, uma por endpoint do backend.
 *
 * Autorização (SecurityConfig): /api/usuarios/** só ADMIN; o restante de /api/**
 * só ENGENHEIRO; /api/auth/** qualquer usuário logado.
 */
import { request } from '@/services/http'
import type {
  Alerta,
  AlertaDetalhe,
  AlterarSenhaRequest,
  Analise,
  AtualizarUsuarioRequest,
  CriarUsuarioRequest,
  DecisaoAlerta,
  DecisaoAlertaRequest,
  Eixo,
  EixoRequest,
  Imagem,
  OrdemManutencao,
  OrdemManutencaoRequest,
  Pagina,
  Papel,
  PatioLinha,
  PatioLinhaRequest,
  ResultadoUpload,
  StatusAlerta,
  StatusOrdem,
  Usuario,
  UsuarioSessao,
  Vagao,
  VagaoRequest,
} from './types'

/** Limite do backend: spring.data.web.pageable.max-page-size. */
export const TAMANHO_MAXIMO_PAGINA = 100

export type Paginacao = { page?: number; size?: number; sort?: string }

function qs(params: Record<string, string | number | boolean | undefined | null>) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value))
  }
  const text = search.toString()
  return text ? `?${text}` : ''
}

// ------------------------------------------------------------------ sessão
export const auth = {
  login: (email: string, password: string) =>
    request<UsuarioSessao>('/api/auth/login', { method: 'POST', json: { email, password } }),
  me: () => request<UsuarioSessao>('/api/auth/me'),
  alterarSenha: (dados: AlterarSenhaRequest) => request<void>('/api/auth/senha', { method: 'PATCH', json: dados }),
  /** Logout do Spring Security (fora de /api); responde 204. */
  logout: () => request<void>('/logout', { method: 'POST' }),
}

// --------------------------------------------------------------- cadastros
export const patiosLinhas = {
  listar: (p: Paginacao = {}) => request<Pagina<PatioLinha>>(`/api/patios-linhas${qs(p)}`),
  detalhar: (id: number) => request<PatioLinha>(`/api/patios-linhas/${id}`),
  criar: (dados: PatioLinhaRequest) => request<PatioLinha>('/api/patios-linhas', { method: 'POST', json: dados }),
  atualizar: (id: number, dados: PatioLinhaRequest) =>
    request<PatioLinha>(`/api/patios-linhas/${id}`, { method: 'PUT', json: dados }),
  alterarAtivo: (id: number, ativo: boolean) =>
    request<PatioLinha>(`/api/patios-linhas/${id}/ativo`, { method: 'PATCH', json: { ativo } }),
}

export const vagoes = {
  listar: (p: Paginacao & { patioLinhaId?: number } = {}) => request<Pagina<Vagao>>(`/api/vagoes${qs(p)}`),
  detalhar: (id: number) => request<Vagao>(`/api/vagoes/${id}`),
  criar: (dados: VagaoRequest) => request<Vagao>('/api/vagoes', { method: 'POST', json: dados }),
  atualizar: (id: number, dados: VagaoRequest) => request<Vagao>(`/api/vagoes/${id}`, { method: 'PUT', json: dados }),
  alterarAtivo: (id: number, ativo: boolean) =>
    request<Vagao>(`/api/vagoes/${id}/ativo`, { method: 'PATCH', json: { ativo } }),
}

export const eixos = {
  listar: (p: Paginacao & { vagaoId?: number } = {}) => request<Pagina<Eixo>>(`/api/eixos${qs(p)}`),
  detalhar: (id: number) => request<Eixo>(`/api/eixos/${id}`),
  imagens: (id: number, p: Paginacao = {}) => request<Pagina<Imagem>>(`/api/eixos/${id}/imagens${qs(p)}`),
  analises: (id: number, p: Paginacao = {}) => request<Pagina<Analise>>(`/api/eixos/${id}/analises${qs(p)}`),
  criar: (dados: EixoRequest) => request<Eixo>('/api/eixos', { method: 'POST', json: dados }),
  atualizar: (id: number, dados: EixoRequest) => request<Eixo>(`/api/eixos/${id}`, { method: 'PUT', json: dados }),
  alterarAtivo: (id: number, ativo: boolean) =>
    request<Eixo>(`/api/eixos/${id}/ativo`, { method: 'PATCH', json: { ativo } }),
}

// ----------------------------------------------------------------- imagens
export const imagens = {
  /** Envia a foto do rolamento; se o eixo tiver baseline ativa, o Gemini compara na hora. */
  enviar: (eixoId: number, arquivo: File) => {
    const form = new FormData()
    form.append('file', arquivo)
    form.append('eixoId', String(eixoId))
    return request<ResultadoUpload>('/api/imagens', { method: 'POST', body: form })
  },
  marcarComoBaseline: (imagemId: number) => request<void>(`/api/imagens/${imagemId}/baseline`, { method: 'PATCH' }),
}

// ----------------------------------------------------------------- alertas
export const alertas = {
  listar: (p: Paginacao & { status?: StatusAlerta; eixoId?: number } = {}) =>
    request<Pagina<Alerta>>(`/api/alertas${qs(p)}`),
  detalhar: (id: number) => request<AlertaDetalhe>(`/api/alertas/${id}`),
  decidir: (id: number, dados: DecisaoAlertaRequest) =>
    request<DecisaoAlerta>(`/api/alertas/${id}/decisao`, { method: 'POST', json: dados }),
}

// ------------------------------------------------------------------ ordens
export const ordens = {
  listar: (p: Paginacao & { status?: StatusOrdem } = {}) => request<Pagina<OrdemManutencao>>(`/api/ordens${qs(p)}`),
  criar: (dados: OrdemManutencaoRequest) =>
    request<OrdemManutencao>('/api/ordens', { method: 'POST', json: dados }),
  alterarStatus: (id: number, status: StatusOrdem) =>
    request<OrdemManutencao>(`/api/ordens/${id}/status`, { method: 'PATCH', json: { status } }),
}

// ---------------------------------------------------------- usuários (ADMIN)
export const usuarios = {
  listar: (p: Paginacao = {}) => request<Pagina<Usuario>>(`/api/usuarios${qs(p)}`),
  criar: (dados: CriarUsuarioRequest) => request<Usuario>('/api/usuarios', { method: 'POST', json: dados }),
  atualizar: (id: number, dados: AtualizarUsuarioRequest) =>
    request<Usuario>(`/api/usuarios/${id}`, { method: 'PUT', json: dados }),
  redefinirSenha: (id: number, password: string) =>
    request<void>(`/api/usuarios/${id}/senha`, { method: 'PATCH', json: { password } }),
  alterarPapel: (id: number, papel: Papel) =>
    request<Usuario>(`/api/usuarios/${id}/papel`, { method: 'PATCH', json: { papel } }),
  alterarAtivo: (id: number, ativo: boolean) =>
    request<Usuario>(`/api/usuarios/${id}/ativo`, { method: 'PATCH', json: { ativo } }),
}
