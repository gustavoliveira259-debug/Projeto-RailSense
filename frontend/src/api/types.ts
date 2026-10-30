/**
 * Tipos da API do RailSense.
 *
 * Espelham os records em backend/.../dto (request e response) e os enums do
 * pacote enums. Datas chegam como string ISO-8601 (Instant serializado pelo Jackson).
 * Ao mudar um DTO no backend, atualize o tipo correspondente aqui.
 */

export type Papel = 'ENGENHEIRO' | 'ADMIN'
export type TipoPatioLinha = 'PATIO' | 'LINHA'
export type Classificacao = 'NORMAL' | 'SUSPEITO' | 'VAZAMENTO'
export type NivelAlerta = 'BAIXO' | 'MEDIO' | 'CRITICO'
export type StatusAlerta = 'EM_ANALISE' | 'CONFIRMADO' | 'FALSO_POSITIVO' | 'FECHADO'
export type DecisaoTipo = 'CONFIRMADO' | 'FALSO_POSITIVO'
export type Prioridade = 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE'
export type StatusOrdem = 'ABERTA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA'
export type TipoEvidencia = 'BASELINE' | 'ATUAL' | 'HEATMAP'

/** PageResponse<T> */
export type Pagina<T> = {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

/** AuthenticatedUserResponse */
export type UsuarioSessao = {
  id: number
  nome: string
  email: string
  papel: Papel
}

/** UsuarioResponse */
export type Usuario = UsuarioSessao & {
  ativo: boolean
  criadoEm: string
}

/** PatioLinhaResponse */
export type PatioLinha = {
  id: number
  nome: string
  tipo: TipoPatioLinha
  ativo: boolean
}

/** VagaoResponse */
export type Vagao = {
  id: number
  numeroUk: string
  tipo: string | null
  patioLinhaId: number
  nomePatioLinha: string
  ativo: boolean
}

/** EixoResponse */
export type Eixo = {
  id: number
  posicao: number
  identificadorUnico: string
  vagaoId: number
  numeroUk: string
  nomePatioLinha: string
  ativo: boolean
  /** Campo "device" do ESP32 que mede a vibração deste eixo; null se não houver sensor. */
  sensorDispositivo: string | null
}

/** ImagemResponse */
export type Imagem = {
  id: number
  urlArquivo: string
  timestampCaptura: string | null
  ehBaseline: boolean
  baselineAtiva: boolean
}

/** AnaliseResponse */
export type Analise = {
  id: number
  imagemAtualId: number
  urlImagemAtual: string
  imagemBaselineId: number
  classificacao: Classificacao
  scoreDiferenca: number | null
  regioesAnomalia: string[]
  criadoEm: string
}

/** AlertaResponse */
export type Alerta = {
  id: number
  nivel: NivelAlerta
  status: StatusAlerta
  score: number | null
  eixoId: number
  eixoIdentificador: string
  criadoEm: string
}

/** EvidenciaResponse */
export type Evidencia = {
  tipo: TipoEvidencia
  imagemId: number
  urlArquivo: string
}

/** DecisaoAlertaResponse */
export type DecisaoAlerta = {
  id: number
  alertaId: number
  decisao: DecisaoTipo
  motivo: string | null
  usuarioId: number
  usuarioNome: string
  criadoEm: string
}

/** AlertaDetalheResponse */
export type AlertaDetalhe = Alerta & {
  classificacao: Classificacao | null
  regioesAnomalia: string[]
  evidencias: Evidencia[]
  decisoes: DecisaoAlerta[]
}

/** OrdemManutencaoResponse */
export type OrdemManutencao = {
  id: number
  alertaId: number
  eixoId: number
  eixoIdentificador: string
  titulo: string
  prioridade: Prioridade
  status: StatusOrdem
  criadoPorId: number
  criadoPorNome: string
  criadoEm: string
}

/** ImageUploadResponse — resultado imediato da análise do Gemini. */
export type ResultadoUpload = {
  imagemId: number
  urlArquivo: string
  analiseId: number | null
  classificacao: Classificacao | null
  scoreDiferenca: number | null
  alertaId: number | null
}

/** VibracaoResponse — leituras recentes do sensor do eixo, em ordem cronológica. */
export type Vibracao = {
  eixoId: number
  sensorDispositivo: string | null
  /** Acima deste valor o ESP32 pede uma foto (limiar_captura do firmware). */
  limiar: number
  /** Fundo de escala do ADC (4095). */
  valorMaximo: number
  leituras: { valor: number; lidoEm: string }[]
}

/** PainelResumoResponse — contagens sobre todos os registros, calculadas no banco. */
export type PainelResumo = {
  geradoEm: string
  alertasPorStatus: Record<StatusAlerta, number>
  aguardandoPorNivel: Record<NivelAlerta, number>
  ordensPorStatus: Record<StatusOrdem, number>
  eixosAtivos: number
  vagoesAtivos: number
  /** Um item por dia (`dia` = "AAAA-MM-DD" no fuso pedido), do mais antigo para hoje. */
  alertasPorDia: { dia: string; baixo: number; medio: number; critico: number }[]
  filaDecisao: Alerta[]
  ordensPrioritarias: OrdemManutencao[]
}

// ------------------------------------------------------------ requisições

export type PatioLinhaRequest = { nome: string; tipo: TipoPatioLinha }
export type VagaoRequest = { numeroUk: string; tipo?: string; patioLinhaId: number }
export type EixoRequest = { vagaoId: number; posicao: number; identificadorUnico: string; sensorDispositivo?: string }
export type DecisaoAlertaRequest = { decisao: DecisaoTipo; motivo?: string }
export type OrdemManutencaoRequest = { alertaId: number; titulo: string; prioridade?: Prioridade }
export type CriarUsuarioRequest = { nome: string; email: string; password: string; papel: Papel }
export type AtualizarUsuarioRequest = { nome: string; email: string }
export type AlterarSenhaRequest = { senhaAtual: string; novaSenha: string }
