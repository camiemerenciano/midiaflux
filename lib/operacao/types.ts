export type StatusProjeto =
  | 'planejamento'
  | 'em_andamento'
  | 'aguardando_cliente'
  | 'em_revisao'
  | 'concluido'
  | 'pausado'
  | 'cancelado'

export type PrioridadeProjeto = 'baixa' | 'normal' | 'alta' | 'urgente'

export type TipoProjeto =
  | 'campanha'
  | 'retainer_mensal'
  | 'lancamento'
  | 'branding'
  | 'site'
  | 'producao_video'
  | 'consultoria'
  | 'outro'

export type StatusTarefa =
  | 'backlog'
  | 'em_andamento'
  | 'revisao_interna'
  | 'aguardando_cliente'
  | 'aprovado'
  | 'concluido'
  | 'bloqueado'

export type TipoTarefa =
  | 'briefing'
  | 'estrategia'
  | 'producao'
  | 'design'
  | 'copy'
  | 'revisao'
  | 'aprovacao'
  | 'configuracao'
  | 'relatorio'
  | 'publicacao'
  | 'reuniao'
  | 'outro'

export type TipoComentario =
  | 'comentario'
  | 'feedback_cliente'
  | 'aprovacao'
  | 'rejeicao'
  | 'sistema'

export interface Projeto {
  id: string
  cliente_id: string
  contrato_id?: string
  nome: string
  descricao?: string
  tipo: TipoProjeto
  status: StatusProjeto
  prioridade: PrioridadeProjeto
  responsavel_id: string
  equipe_ids: string[]
  data_inicio: string
  data_entrega_prevista: string
  data_entrega_real?: string
  progresso: number // 0-100, recalculated from tasks
  tags?: string[]
  criado_em: string
  atualizado_em: string
}

export interface Tarefa {
  id: string
  projeto_id: string
  nome: string
  descricao?: string
  tipo: TipoTarefa
  status: StatusTarefa
  responsavel_id: string
  revisores_ids?: string[]
  prioridade: PrioridadeProjeto
  data_prevista: string
  data_conclusao?: string
  estimativa_horas?: number
  horas_realizadas?: number
  ordem: number
  dependencia_ids?: string[]
  revisoes_usadas: number
  revisoes_max: number
  feedback_cliente?: string
  criado_em: string
  atualizado_em: string
}

export interface Comentario {
  id: string
  tarefa_id: string
  usuario_nome: string
  conteudo: string
  tipo: TipoComentario
  criado_em: string
}
