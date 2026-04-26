export type TipoLancamento = 'receita' | 'custo'

export type StatusLancamento =
  | 'previsto'     // agendado mas NF não emitida
  | 'emitido'      // NF emitida, aguardando pagamento
  | 'pago'         // confirmado na conta
  | 'atrasado'     // venceu sem pagamento
  | 'cancelado'

export type CategoriaReceita =
  | 'mensalidade'
  | 'projeto'
  | 'performance'
  | 'consultoria'
  | 'bonus'
  | 'outro'

export type CategoriaCusto =
  | 'pessoal'
  | 'pro_labore'
  | 'ferramentas'
  | 'assinaturas'
  | 'midia'
  | 'fornecedores'
  | 'infraestrutura'
  | 'impostos'
  | 'marketing'
  | 'curso'
  | 'beleza'
  | 'transporte'
  | 'alimentacao'
  | 'investimentos'
  | 'outros'

export type OrigemLancamento = 'empresa' | 'pessoal'

export interface Lancamento {
  id: string
  tipo: TipoLancamento
  origem?: OrigemLancamento
  descricao: string
  cliente_id?: string   // só para receitas
  contrato_id?: string
  categoria: CategoriaReceita | CategoriaCusto
  valor: number
  competencia: string   // 'YYYY-MM'
  data_vencimento: string
  data_pagamento?: string
  status: StatusLancamento
  nota_fiscal?: string
  observacoes?: string
  recorrente: boolean   // se true, foi gerado de contrato
  criado_em: string
}

export interface MetaMensal {
  competencia: string   // 'YYYY-MM'
  meta_receita: number
  meta_margem: number   // % alvo
}

export interface ResumoMensal {
  competencia: string
  receita_realizada: number
  receita_prevista: number
  receita_total: number   // realizada + emitida + prevista
  custo_total: number
  margem_valor: number
  margem_pct: number
  inadimplencia: number
  meta?: MetaMensal
}
