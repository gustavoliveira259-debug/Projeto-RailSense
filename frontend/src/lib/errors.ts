import { ApiError } from '@/services/http'

/**
 * Mensagem para o usuário a partir de um erro da API.
 *
 * O GlobalExceptionHandler do backend já devolve mensagens em português
 * (ex.: "Transição inválida", "Já existe um usuário com esse e-mail"); erros
 * de rede viram uma orientação genérica.
 */
export function mensagemDeErro(error: unknown, fallback = 'Não foi possível concluir a operação.') {
  if (error instanceof ApiError) {
    if (error.status === 403) return 'Seu perfil não tem permissão para esta ação.'
    if (error.status >= 500 && error.status !== 502) return 'Erro interno no servidor. Tente novamente em instantes.'
    return error.message || fallback
  }
  if (error instanceof TypeError) return 'Sem conexão com o servidor. Verifique sua rede.'
  return fallback
}
