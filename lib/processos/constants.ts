import { CategoriaDoc, StatusDoc } from './types'

export const CATEGORIA_DOC_CONFIG: Record<CategoriaDoc, {
  label: string; icone: string; cor: string; corBg: string; corBorda: string; descricao: string
}> = {
  sop:      { label: 'SOP',      icone: '📋', cor: 'text-blue-700',    corBg: 'bg-blue-50',    corBorda: 'border-blue-200',    descricao: 'Processos padrão' },
  checklist:{ label: 'Checklist',icone: '✅', cor: 'text-emerald-700', corBg: 'bg-emerald-50', corBorda: 'border-emerald-200', descricao: 'Listas de verificação' },
  template: { label: 'Template', icone: '📄', cor: 'text-violet-700',  corBg: 'bg-violet-50',  corBorda: 'border-violet-200',  descricao: 'Modelos prontos' },
  contrato: { label: 'Contrato', icone: '📝', cor: 'text-amber-700',   corBg: 'bg-amber-50',   corBorda: 'border-amber-200',   descricao: 'Contratos e propostas' },
  briefing: { label: 'Briefing', icone: '🎯', cor: 'text-rose-700',    corBg: 'bg-rose-50',    corBorda: 'border-rose-200',    descricao: 'Formulários de briefing' },
}

export const STATUS_DOC_CONFIG: Record<StatusDoc, { label: string; cor: string; corBg: string }> = {
  ativo:        { label: 'Ativo',        cor: 'text-emerald-700', corBg: 'bg-emerald-100' },
  rascunho:     { label: 'Rascunho',     cor: 'text-slate-600',   corBg: 'bg-slate-100' },
  desatualizado:{ label: 'Desatualizado',cor: 'text-amber-700',   corBg: 'bg-amber-100' },
  arquivado:    { label: 'Arquivado',    cor: 'text-slate-400',   corBg: 'bg-slate-100' },
}
