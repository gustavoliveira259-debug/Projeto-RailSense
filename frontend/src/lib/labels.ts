/**
 * Rótulos e tons visuais dos enums do backend.
 *
 * O tom define a cor, mas toda exibição de status leva também ícone + texto
 * (StatusBadge), para que a informação nunca dependa só da cor.
 */
import {
  AlertOctagon,
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock,
  Info,
  Loader,
  type LucideIcon,
  SearchCheck,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import type {
  Classificacao,
  NivelAlerta,
  Papel,
  Prioridade,
  StatusAlerta,
  StatusOrdem,
  TipoEvidencia,
  TipoPatioLinha,
} from '@/api/types'

export type Tone = 'success' | 'warning' | 'critical' | 'info' | 'neutral'
export type LabelSpec = { label: string; tone: Tone; icon: LucideIcon }

export const NIVEL: Record<NivelAlerta, LabelSpec> = {
  BAIXO: { label: 'Baixo', tone: 'info', icon: Info },
  MEDIO: { label: 'Médio', tone: 'warning', icon: AlertTriangle },
  CRITICO: { label: 'Crítico', tone: 'critical', icon: AlertOctagon },
}

export const STATUS_ALERTA: Record<StatusAlerta, LabelSpec> = {
  EM_ANALISE: { label: 'Aguardando decisão', tone: 'warning', icon: SearchCheck },
  CONFIRMADO: { label: 'Confirmado', tone: 'critical', icon: AlertTriangle },
  FALSO_POSITIVO: { label: 'Falso positivo', tone: 'neutral', icon: XCircle },
  FECHADO: { label: 'Fechado', tone: 'success', icon: CheckCircle2 },
}

export const CLASSIFICACAO: Record<Classificacao, LabelSpec> = {
  NORMAL: { label: 'Normal', tone: 'success', icon: ShieldCheck },
  SUSPEITO: { label: 'Suspeito', tone: 'warning', icon: AlertTriangle },
  VAZAMENTO: { label: 'Vazamento', tone: 'critical', icon: AlertOctagon },
}

export const PRIORIDADE: Record<Prioridade, LabelSpec> = {
  BAIXA: { label: 'Baixa', tone: 'neutral', icon: Info },
  MEDIA: { label: 'Média', tone: 'info', icon: Info },
  ALTA: { label: 'Alta', tone: 'warning', icon: AlertTriangle },
  URGENTE: { label: 'Urgente', tone: 'critical', icon: AlertOctagon },
}

export const STATUS_ORDEM: Record<StatusOrdem, LabelSpec> = {
  ABERTA: { label: 'Aberta', tone: 'info', icon: Clock },
  EM_ANDAMENTO: { label: 'Em andamento', tone: 'warning', icon: Loader },
  CONCLUIDA: { label: 'Concluída', tone: 'success', icon: CheckCircle2 },
  CANCELADA: { label: 'Cancelada', tone: 'neutral', icon: Ban },
}

/** Espelha OrdemManutencaoService.TRANSICOES; CONCLUIDA e CANCELADA são finais. */
export const TRANSICOES_ORDEM: Record<StatusOrdem, StatusOrdem[]> = {
  ABERTA: ['EM_ANDAMENTO', 'CANCELADA'],
  EM_ANDAMENTO: ['CONCLUIDA', 'CANCELADA'],
  CONCLUIDA: [],
  CANCELADA: [],
}

/** Verbo do botão que leva a ordem para cada status. */
export const ACAO_ORDEM: Record<StatusOrdem, string> = {
  ABERTA: 'Reabrir',
  EM_ANDAMENTO: 'Iniciar execução',
  CONCLUIDA: 'Concluir',
  CANCELADA: 'Cancelar ordem',
}

/** Espelha OrdemManutencaoService.prioridadePadrao. */
export const PRIORIDADE_PADRAO: Record<NivelAlerta, Prioridade> = {
  CRITICO: 'URGENTE',
  MEDIO: 'ALTA',
  BAIXO: 'MEDIA',
}

export const PAPEL: Record<Papel, { label: string; descricao: string }> = {
  ENGENHEIRO: { label: 'Engenheiro', descricao: 'Opera o monitoramento: alertas, ordens, imagens e cadastros.' },
  ADMIN: { label: 'Administrador', descricao: 'Gerencia contas de usuário. Não acessa o monitoramento.' },
}

export const TIPO_PATIO: Record<TipoPatioLinha, string> = {
  PATIO: 'Pátio',
  LINHA: 'Linha',
}

export const TIPO_EVIDENCIA: Record<TipoEvidencia, string> = {
  BASELINE: 'Referência (baseline)',
  ATUAL: 'Captura atual',
  HEATMAP: 'Mapa de calor',
}
