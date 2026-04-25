import { StatusLancamento, CategoriaReceita, CategoriaCusto } from './types'

export const STATUS_LANCAMENTO_CONFIG: Record<
  StatusLancamento,
  { label: string; cor: string; corBg: string; corBorda: string; icone: string }
> = {
  previsto:  { label: 'Previsto',  cor: 'text-slate-600',   corBg: 'bg-slate-50',    corBorda: 'border-slate-200',   icone: '📅' },
  emitido:   { label: 'Emitido',   cor: 'text-blue-700',    corBg: 'bg-blue-50',     corBorda: 'border-blue-200',    icone: '📄' },
  pago:      { label: 'Pago',      cor: 'text-emerald-700', corBg: 'bg-emerald-50',  corBorda: 'border-emerald-200', icone: '✅' },
  atrasado:  { label: 'Atrasado',  cor: 'text-red-700',     corBg: 'bg-red-50',      corBorda: 'border-red-200',     icone: '⚠️' },
  cancelado: { label: 'Cancelado', cor: 'text-slate-400',   corBg: 'bg-slate-50',    corBorda: 'border-slate-100',   icone: '🚫' },
}

export const CATEGORIA_RECEITA_LABELS: Record<CategoriaReceita, string> = {
  mensalidade:  '🔄 Mensalidade (Retainer)',
  projeto:      '📦 Projeto',
  performance:  '🚀 Performance',
  consultoria:  '💡 Consultoria',
  bonus:        '🎯 Bônus / Upsell',
  outro:        '📋 Outro',
}

export const CATEGORIA_CUSTO_LABELS: Record<CategoriaCusto, string> = {
  pessoal:       '👥 Pessoal',
  pro_labore:    '💼 Pró-labore',
  ferramentas:   '🛠️ Ferramentas & SaaS',
  assinaturas:   '🔄 Assinaturas',
  midia:         '📣 Verba de Mídia',
  fornecedores:  '🤝 Fornecedores',
  infraestrutura:'🏢 Infraestrutura',
  impostos:      '🏛️ Impostos',
  marketing:     '📢 Marketing Próprio',
  curso:         '🎓 Curso & Capacitação',
  beleza:        '💅 Beleza',
  transporte:    '🚗 Transporte',
  alimentacao:   '🍽️ Alimentação',
  investimentos: '📈 Investimentos',
  outros:        '📋 Outros',
}

export const CATEGORIA_CUSTO_COR: Record<CategoriaCusto, string> = {
  pessoal:       'bg-blue-500',
  pro_labore:    'bg-blue-700',
  ferramentas:   'bg-violet-500',
  assinaturas:   'bg-violet-300',
  midia:         'bg-orange-500',
  fornecedores:  'bg-teal-500',
  infraestrutura:'bg-slate-500',
  impostos:      'bg-red-500',
  marketing:     'bg-pink-500',
  curso:         'bg-emerald-500',
  beleza:        'bg-rose-400',
  transporte:    'bg-amber-500',
  alimentacao:   'bg-yellow-500',
  investimentos: 'bg-green-600',
  outros:        'bg-gray-400',
}

// Alertas financeiros — thresholds
export const ALERTA_INADIMPLENCIA_DIAS = 15   // dias após vencimento = inadimplente
export const ALERTA_MARGEM_MINIMA_PCT  = 35   // abaixo disso = margem crítica
export const ALERTA_RENOVACAO_DIAS     = 60   // dias antes do vencimento do contrato

export const MESES_PT = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]

export function competenciaLabel(comp: string): string {
  const [y, m] = comp.split('-')
  return `${MESES_PT[parseInt(m) - 1]}/${y}`
}
