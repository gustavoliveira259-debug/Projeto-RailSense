import { requisitar } from './http'
import type {
  Alerta,
  AlertaDetalhe,
  Decisao,
  DecisaoTipo,
  Imagem,
  ImagemEnviada,
  Papel,
  Rolamento,
  Sensor,
  SerieLeituras,
  StatusAlerta,
  TipoSensor,
  Trem,
  Usuario,
  UsuarioSessao,
  Vagao,
} from './types'

const id = (valor: number) => encodeURIComponent(String(valor))

export const authApi = {
  me: () => requisitar<UsuarioSessao>('GET', '/api/auth/me', undefined, { ignorar401: true }),
  login: (email: string, password: string) =>
    requisitar<UsuarioSessao>('POST', '/api/auth/login', { email, password }, { ignorar401: true }),
  logout: () => requisitar<void>('POST', '/api/auth/logout', undefined, { ignorar401: true }),
  alterarSenha: (senhaAtual: string, novaSenha: string) =>
    requisitar<void>('POST', '/api/auth/senha', { senhaAtual, novaSenha }),
}

export const trensApi = {
  listar: () => requisitar<Trem[]>('GET', '/api/trens'),
  buscar: (tremId: number) => requisitar<Trem>('GET', `/api/trens/${id(tremId)}`),
  criar: (dados: { codigo: string; nome: string }) => requisitar<Trem>('POST', '/api/trens', dados),
  alterarAtivo: (tremId: number, ativo: boolean) =>
    requisitar<Trem>('PATCH', `/api/trens/${id(tremId)}/ativo`, { ativo }),
}

export const vagoesApi = {
  listar: (tremId?: number) =>
    requisitar<Vagao[]>('GET', tremId ? `/api/vagoes?tremId=${id(tremId)}` : '/api/vagoes'),
  buscar: (vagaoId: number) => requisitar<Vagao>('GET', `/api/vagoes/${id(vagaoId)}`),
  criar: (dados: { numeroUk: string; tipo: string; tremId: number }) =>
    requisitar<Vagao>('POST', '/api/vagoes', dados),
  alterarAtivo: (vagaoId: number, ativo: boolean) =>
    requisitar<Vagao>('PATCH', `/api/vagoes/${id(vagaoId)}/ativo`, { ativo }),
}

/** Rolamentos são os "eixos" do backend. */
export const rolamentosApi = {
  listar: (vagaoId?: number) =>
    requisitar<Rolamento[]>('GET', vagaoId ? `/api/eixos?vagaoId=${id(vagaoId)}` : '/api/eixos'),
  buscar: (rolamentoId: number) => requisitar<Rolamento>('GET', `/api/eixos/${id(rolamentoId)}`),
  criar: (dados: { vagaoId: number; posicao: number; identificadorUnico: string }) =>
    requisitar<Rolamento>('POST', '/api/eixos', dados),
  alterarAtivo: (rolamentoId: number, ativo: boolean) =>
    requisitar<Rolamento>('PATCH', `/api/eixos/${id(rolamentoId)}/ativo`, { ativo }),
  leituras: (rolamentoId: number, tipo: TipoSensor, minutos: number) =>
    requisitar<SerieLeituras>('GET', `/api/eixos/${id(rolamentoId)}/leituras?tipo=${tipo}&minutos=${minutos}`),
  imagens: (rolamentoId: number) => requisitar<Imagem[]>('GET', `/api/eixos/${id(rolamentoId)}/imagens`),
}

export const imagensApi = {
  enviar: (rolamentoId: number, arquivo: File) => {
    const form = new FormData()
    form.append('file', arquivo)
    form.append('eixoId', String(rolamentoId))
    return requisitar<ImagemEnviada>('POST', '/api/imagens', form)
  },
  definirReferencia: (imagemId: number) => requisitar<void>('PATCH', `/api/imagens/${id(imagemId)}/baseline`),
}

export const alertasApi = {
  listar: (filtro: { status?: StatusAlerta; rolamentoId?: number } = {}) => {
    const params = new URLSearchParams()
    if (filtro.status) params.set('status', filtro.status)
    if (filtro.rolamentoId) params.set('eixoId', String(filtro.rolamentoId))
    const query = params.toString()
    return requisitar<Alerta[]>('GET', query ? `/api/alertas?${query}` : '/api/alertas')
  },
  detalhe: (alertaId: number) => requisitar<AlertaDetalhe>('GET', `/api/alertas/${id(alertaId)}`),
  decidir: (alertaId: number, decisao: DecisaoTipo, motivo?: string) =>
    requisitar<Decisao>('POST', `/api/alertas/${id(alertaId)}/decisao`, { decisao, motivo: motivo || null }),
  fechar: (alertaId: number) => requisitar<Alerta>('POST', `/api/alertas/${id(alertaId)}/fechar`),
}

export const sensoresApi = {
  listar: () => requisitar<Sensor[]>('GET', '/api/sensores'),
  criar: (dados: { codigo: string; tipo: TipoSensor; eixoId: number }) =>
    requisitar<Sensor>('POST', '/api/sensores', dados),
  alterarAtivo: (sensorId: number, ativo: boolean) =>
    requisitar<Sensor>('PATCH', `/api/sensores/${id(sensorId)}/ativo`, { ativo }),
}

export const usuariosApi = {
  listar: () => requisitar<Usuario[]>('GET', '/api/usuarios'),
  criar: (dados: { nome: string; email: string; password: string; papel: Papel }) =>
    requisitar<Usuario>('POST', '/api/usuarios', dados),
  alterarPapel: (usuarioId: number, papel: Papel) =>
    requisitar<Usuario>('PATCH', `/api/usuarios/${id(usuarioId)}/papel`, { papel }),
  alterarAtivo: (usuarioId: number, ativo: boolean) =>
    requisitar<Usuario>('PATCH', `/api/usuarios/${id(usuarioId)}/ativo`, { ativo }),
  redefinirSenha: (usuarioId: number, password: string) =>
    requisitar<Usuario>('PATCH', `/api/usuarios/${id(usuarioId)}/senha`, { password }),
}
