export type CategoriaDoc =
  | 'sop'
  | 'checklist'
  | 'template'
  | 'contrato'
  | 'briefing'

export type StatusDoc = 'ativo' | 'rascunho' | 'desatualizado' | 'arquivado'

export type TipoSecao =
  | 'intro'       // parágrafo de introdução
  | 'secao'       // título de seção com subtítulo opcional
  | 'passo'       // item numerado de processo
  | 'checklist'   // itens checkáveis
  | 'lista'       // lista de bullets
  | 'destaque'    // caixa de destaque (dica / alerta)
  | 'aviso'       // caixa de alerta vermelho

export interface SecaoConteudo {
  id: string
  tipo: TipoSecao
  titulo?: string
  texto?: string
  itens?: string[]
  corDestaque?: 'blue' | 'amber' | 'red' | 'emerald'
}

export interface Documento {
  id: string
  titulo: string
  categoria: CategoriaDoc
  descricao: string
  conteudo: SecaoConteudo[]
  tags: string[]
  responsavel_id: string
  status: StatusDoc
  versao: string
  criado_em: string
  atualizado_em: string
}
