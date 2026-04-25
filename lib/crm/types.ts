export type FunnelStage =
  | 'lead_captado'
  | 'lead_qualificado'
  | 'abordagem_enviada'
  | 'conversa_iniciada'
  | 'reuniao_marcada'
  | 'proposta_enviada'
  | 'fechado'
  | 'perdido'

export type Porte = 'micro' | 'pequena' | 'media' | 'grande'
export type Cargo = 'ceo_socio' | 'diretor' | 'gerente' | 'coordenador' | 'outro'
export type Fonte =
  | 'instagram'
  | 'linkedin'
  | 'google'
  | 'indicacao'
  | 'evento'
  | 'whatsapp'
  | 'site'
  | 'outro'
export type Segmento =
  | 'ecommerce'
  | 'saas'
  | 'varejo'
  | 'educacao'
  | 'saude'
  | 'imoveis'
  | 'industria'
  | 'servicos'
  | 'estetica'
  | 'beleza'
  | 'moda'
  | 'outro'
export type Sentimento = 'positivo' | 'neutro' | 'negativo'
export type TipoInteracao =
  | 'whatsapp_enviado'
  | 'whatsapp_recebido'
  | 'email_enviado'
  | 'email_recebido'
  | 'ligacao_realizada'
  | 'ligacao_recebida'
  | 'reuniao_realizada'
  | 'proposta_enviada'
  | 'nota_interna'
  | 'mudanca_estagio'
export type TipoFollowUp = 'ligar' | 'whatsapp' | 'email' | 'reuniao' | 'outro'
export type PrioridadeFollowUp = 'urgente' | 'alta' | 'normal' | 'baixa'
export type StatusFollowUp = 'pendente' | 'concluido' | 'atrasado' | 'cancelado'

export interface Lead {
  id: string
  nome_empresa: string
  nome_contato: string
  cargo_contato: Cargo
  email: string
  telefone: string
  whatsapp: string
  cnpj?: string
  site?: string
  segmento: Segmento
  porte: Porte
  cidade?: string
  estado?: string
  fonte: Fonte
  fonte_detalhe?: string
  responsavel_id: string
  status: FunnelStage
  valor_estimado?: number
  data_fechamento_estimada?: string
  probabilidade: number
  motivo_perda?: string
  observacoes?: string
  score_perfil: number
  score_engajamento: number
  score_timing: number
  score_total: number
  criado_em: string
  atualizado_em: string
}

export interface Interacao {
  id: string
  lead_id: string
  usuario_nome: string
  tipo: TipoInteracao
  conteudo: string
  duracao_minutos?: number
  sentimento: Sentimento
  proximo_passo?: string
  criado_em: string
}

export interface FollowUp {
  id: string
  lead_id: string
  tipo: TipoFollowUp
  data_hora: string
  prioridade: PrioridadeFollowUp
  descricao: string
  status: StatusFollowUp
  criado_em: string
}

export interface Usuario {
  id: string
  nome: string
  iniciais: string
  cor: string
}
