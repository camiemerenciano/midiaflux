import { StatusProjeto, StatusTarefa, TipoProjeto, TipoTarefa, PrioridadeProjeto } from './types'

export const STATUS_PROJETO_CONFIG: Record<
  StatusProjeto,
  { label: string; cor: string; corBg: string; corBorda: string; icone: string }
> = {
  planejamento:      { label: 'Planejamento',       cor: 'text-slate-600',   corBg: 'bg-slate-100',   corBorda: 'border-slate-300',   icone: '📋' },
  em_andamento:      { label: 'Em andamento',        cor: 'text-blue-700',    corBg: 'bg-blue-50',     corBorda: 'border-blue-300',    icone: '▶️' },
  aguardando_cliente:{ label: 'Aguardando cliente',  cor: 'text-amber-700',   corBg: 'bg-amber-50',    corBorda: 'border-amber-300',   icone: '⏳' },
  em_revisao:        { label: 'Em revisão',          cor: 'text-violet-700',  corBg: 'bg-violet-50',   corBorda: 'border-violet-300',  icone: '🔍' },
  concluido:         { label: 'Concluído',           cor: 'text-emerald-700', corBg: 'bg-emerald-50',  corBorda: 'border-emerald-300', icone: '✅' },
  pausado:           { label: 'Pausado',             cor: 'text-orange-700',  corBg: 'bg-orange-50',   corBorda: 'border-orange-300',  icone: '⏸️' },
  cancelado:         { label: 'Cancelado',           cor: 'text-red-700',     corBg: 'bg-red-50',      corBorda: 'border-red-300',     icone: '🚫' },
}

export const STATUS_TAREFA_CONFIG: Record<
  StatusTarefa,
  { label: string; cor: string; corBg: string; corBorda: string; corBarra: string; ordem: number }
> = {
  backlog:           { label: 'Backlog',             cor: 'text-slate-500',   corBg: 'bg-slate-50',    corBorda: 'border-slate-200',   corBarra: 'bg-slate-300',   ordem: 0 },
  em_andamento:      { label: 'Em andamento',        cor: 'text-blue-700',    corBg: 'bg-blue-50',     corBorda: 'border-blue-200',    corBarra: 'bg-blue-500',    ordem: 1 },
  revisao_interna:   { label: 'Revisão interna',     cor: 'text-violet-700',  corBg: 'bg-violet-50',   corBorda: 'border-violet-200',  corBarra: 'bg-violet-500',  ordem: 2 },
  aguardando_cliente:{ label: 'Aguardando cliente',  cor: 'text-amber-700',   corBg: 'bg-amber-50',    corBorda: 'border-amber-200',   corBarra: 'bg-amber-400',   ordem: 3 },
  aprovado:          { label: 'Aprovado',            cor: 'text-emerald-700', corBg: 'bg-emerald-50',  corBorda: 'border-emerald-200', corBarra: 'bg-emerald-400', ordem: 4 },
  concluido:         { label: 'Concluído',           cor: 'text-emerald-800', corBg: 'bg-emerald-100', corBorda: 'border-emerald-300', corBarra: 'bg-emerald-600', ordem: 5 },
  bloqueado:         { label: 'Bloqueado',           cor: 'text-red-700',     corBg: 'bg-red-50',      corBorda: 'border-red-200',     corBarra: 'bg-red-500',     ordem: -1 },
}

// Fluxo oficial de produção — cada etapa é uma fase da tarefa
export const FLUXO_PRODUCAO: StatusTarefa[] = [
  'backlog',
  'em_andamento',
  'revisao_interna',
  'aguardando_cliente',
  'aprovado',
  'concluido',
]

export const PRIORIDADE_CONFIG: Record<PrioridadeProjeto, { label: string; cor: string; corBg: string }> = {
  baixa:   { label: 'Baixa',   cor: 'text-slate-500',   corBg: 'bg-slate-100' },
  normal:  { label: 'Normal',  cor: 'text-blue-600',    corBg: 'bg-blue-50' },
  alta:    { label: 'Alta',    cor: 'text-orange-600',  corBg: 'bg-orange-50' },
  urgente: { label: 'Urgente', cor: 'text-red-600',     corBg: 'bg-red-50' },
}

export const TIPO_PROJETO_LABELS: Record<TipoProjeto, string> = {
  campanha:       'Campanha',
  retainer_mensal:'Retainer Mensal',
  lancamento:     'Lançamento',
  branding:       'Branding',
  site:           'Site / E-commerce',
  producao_video: 'Produção de Vídeo',
  consultoria:    'Consultoria',
  outro:          'Outro',
}

export const TIPO_TAREFA_CONFIG: Record<TipoTarefa, { label: string; icone: string }> = {
  briefing:      { label: 'Briefing',         icone: '📋' },
  estrategia:    { label: 'Estratégia',       icone: '🎯' },
  producao:      { label: 'Produção',         icone: '⚙️' },
  design:        { label: 'Design',           icone: '🎨' },
  copy:          { label: 'Copywriting',      icone: '✍️' },
  revisao:       { label: 'Revisão',          icone: '🔍' },
  aprovacao:     { label: 'Aprovação',        icone: '✅' },
  configuracao:  { label: 'Configuração',     icone: '⚙️' },
  relatorio:     { label: 'Relatório',        icone: '📊' },
  publicacao:    { label: 'Publicação',       icone: '🚀' },
  reuniao:       { label: 'Reunião',          icone: '🤝' },
  outro:         { label: 'Outro',            icone: '📦' },
}

// SLA padrão por status (dias máximos sem movimentação)
export const SLA_STATUS_TAREFA: Partial<Record<StatusTarefa, number>> = {
  em_andamento:       5,
  revisao_interna:    2,
  aguardando_cliente: 5,
  aprovado:           1,
}
