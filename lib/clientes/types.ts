import { Segmento, Porte, Cargo } from '@/lib/crm/types'

export type TipoCliente = 'retainer' | 'projeto' | 'performance' | 'consultoria'

export type StatusCliente = 'ativo' | 'pausado' | 'em_risco' | 'encerrado'

export type CategoriaServico =
  | 'social_media'
  | 'trafego_pago'
  | 'producao_video'
  | 'fotografia'
  | 'design'
  | 'branding'
  | 'conteudo'
  | 'consultoria'
  | 'lancamentos'

export type TipoEntrega =
  | 'relatorio_mensal'
  | 'campanha'
  | 'criativo'
  | 'copy'
  | 'planejamento'
  | 'apresentacao'
  | 'video'
  | 'identidade_visual'
  | 'outro'

export type StatusEntrega = 'entregue' | 'em_revisao' | 'aprovado' | 'rejeitado'

export interface Servico {
  id: string
  nome: string
  categoria: CategoriaServico
  descricao?: string
}

export interface ContatoCliente {
  id: string
  cliente_id: string
  nome: string
  cargo: Cargo
  email: string
  whatsapp?: string
  telefone?: string
  principal: boolean
}

export interface Contrato {
  id: string
  cliente_id: string
  descricao: string
  servico_ids: string[]
  tipo: TipoCliente
  // Retainer: valor mensal recorrente | Projeto: valor total | Performance: base + variável
  valor_mensal?: number
  valor_total?: number
  valor_base?: number
  data_inicio: string
  data_fim?: string
  duracao_meses?: number
  revisoes_incluidas: number
  status: 'ativo' | 'pausado' | 'encerrado'
  observacoes?: string
  criado_em: string
}

export interface EntregaHistorico {
  id: string
  cliente_id: string
  contrato_id?: string
  titulo: string
  descricao?: string
  tipo: TipoEntrega
  competencia: string // "2026-04" — mês de referência
  data_entrega: string
  status: StatusEntrega
  feedback?: string
  responsavel_nome: string
  revisoes_usadas: number
  revisoes_max: number
}

export interface Cliente {
  id: string
  lead_id?: string
  nome_empresa: string
  cnpj?: string
  segmento: Segmento
  porte: Porte
  site?: string
  cidade?: string
  estado?: string
  tipo: TipoCliente
  status: StatusCliente
  motivo_pausa?: string
  motivo_risco?: string
  motivo_encerramento?: string
  responsavel_id: string
  data_inicio: string
  data_fim?: string
  nps?: number
  observacoes?: string
  criado_em: string
  atualizado_em: string
}
