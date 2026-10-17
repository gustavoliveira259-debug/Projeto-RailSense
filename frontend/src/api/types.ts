/** Tipos das respostas da API (espelham os DTOs do backend). Datas chegam como ISO-8601. */

export type Papel = 'ENGENHEIRO' | 'GERENTE' | 'ADMIN'

export type UsuarioSessao = {
  id: number
  nome: string
  email: string
  papel: Papel
}

export type Usuario = UsuarioSessao & {
  ativo: boolean
  criadoEm: string
}

export type StatusMonitoramento = 'SEM_LEITURAS' | 'NORMAL' | 'ATENCAO' | 'CRITICO'

export type Trem = {
  id: number
  codigo: string
  nome: string | null
  ativo: boolean
  totalVagoes: number
  totalRolamentos: number
  alertasAtivos: number
  alertasCriticos: number
  status: StatusMonitoramento
}

export type Vagao = {
  id: number
  numeroUk: string
  tipo: string | null
  tremId: number | null
  tremCodigo: string | null
  patioLinhaId: number | null
  nomePatioLinha: string | null
  ativo: boolean
  totalRolamentos: number
  alertasAtivos: number
  alertasCriticos: number
  status: StatusMonitoramento
}

/** No backend é o "eixo" monitorado. */
export type Rolamento = {
  id: number
  posicao: number
  identificadorUnico: string
  vagaoId: number | null
  numeroUk: string | null
  tremId: number | null
  tremCodigo: string | null
  nomePatioLinha: string | null
  ativo: boolean
  status: StatusMonitoramento
  alertasAtivos: number
  alertasCriticos: number
  vibracao: number | null
  temperatura: number | null
  ultimaLeituraEm: string | null
}

export type TipoSensor = 'VIBRACAO' | 'TEMPERATURA'

export type Sensor = {
  id: number
  codigo: string
  tipo: TipoSensor
  eixoId: number
  eixoIdentificador: string
  numeroUk: string | null
  tremCodigo: string | null
  ativo: boolean
  ultimoValor: number | null
  ultimaLeituraEm: string | null
}

export type PontoLeitura = { em: string; valor: number }

export type SerieLeituras = {
  tipo: TipoSensor
  minutos: number
  pontos: PontoLeitura[]
}

export type Classificacao = 'NORMAL' | 'SUSPEITO' | 'VAZAMENTO'

export type Imagem = {
  id: number
  urlArquivo: string
  timestampCaptura: string | null
  ehBaseline: boolean
  baselineAtiva: boolean
  classificacao: Classificacao | null
  scoreDiferenca: number | null
  regioesAnomalia: string[]
  alertaId: number | null
}

export type ImagemEnviada = {
  imagemId: number
  urlArquivo: string
  analiseId: number | null
  classificacao: Classificacao | null
  scoreDiferenca: number | null
  alertaId: number | null
}

export type NivelAlerta = 'BAIXO' | 'MEDIO' | 'CRITICO'
export type StatusAlerta = 'NOVO' | 'EM_ANALISE' | 'CONFIRMADO' | 'FALSO_POSITIVO' | 'FECHADO'
export type DecisaoTipo = 'CONFIRMADO' | 'FALSO_POSITIVO'

export type Alerta = {
  id: number
  nivel: NivelAlerta
  status: StatusAlerta
  score: number | null
  eixoId: number
  eixoIdentificador: string
  vagaoId: number | null
  numeroUk: string | null
  tremId: number | null
  tremCodigo: string | null
  criadoEm: string
}

export type Decisao = {
  id: number
  alertaId: number
  decisao: DecisaoTipo
  motivo: string | null
  usuarioId: number
  usuarioNome: string
  criadoEm: string
}

export type AlertaDetalhe = {
  id: number
  nivel: NivelAlerta
  status: StatusAlerta
  score: number | null
  eixoId: number
  eixoIdentificador: string
  criadoEm: string
  classificacao: Classificacao | null
  regioesAnomalia: string[]
  evidencias: { tipo: 'BASELINE' | 'ATUAL' | 'HEATMAP'; imagemId: number; urlArquivo: string }[]
  decisoes: Decisao[]
}
