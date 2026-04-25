import { TipoCliente, StatusCliente, CategoriaServico, TipoEntrega, Servico } from './types'

export const TIPO_CLIENTE_CONFIG: Record<
  TipoCliente,
  { label: string; cor: string; corBg: string; corBorda: string; descricao: string }
> = {
  retainer: {
    label: 'Retainer',
    cor: 'text-blue-700',
    corBg: 'bg-blue-50',
    corBorda: 'border-blue-200',
    descricao: 'Contrato mensal recorrente',
  },
  projeto: {
    label: 'Projeto',
    cor: 'text-violet-700',
    corBg: 'bg-violet-50',
    corBorda: 'border-violet-200',
    descricao: 'Projeto com início e fim definidos',
  },
  performance: {
    label: 'Performance',
    cor: 'text-orange-700',
    corBg: 'bg-orange-50',
    corBorda: 'border-orange-200',
    descricao: 'Base + variável por resultado',
  },
  consultoria: {
    label: 'Consultoria',
    cor: 'text-teal-700',
    corBg: 'bg-teal-50',
    corBorda: 'border-teal-200',
    descricao: 'Horas de consultoria estratégica',
  },
}

export const STATUS_CLIENTE_CONFIG: Record<
  StatusCliente,
  { label: string; cor: string; corBg: string; corBorda: string; icone: string }
> = {
  ativo: {
    label: 'Ativo',
    cor: 'text-emerald-700',
    corBg: 'bg-emerald-50',
    corBorda: 'border-emerald-200',
    icone: '✅',
  },
  pausado: {
    label: 'Pausado',
    cor: 'text-amber-700',
    corBg: 'bg-amber-50',
    corBorda: 'border-amber-200',
    icone: '⏸️',
  },
  em_risco: {
    label: 'Em risco',
    cor: 'text-red-700',
    corBg: 'bg-red-50',
    corBorda: 'border-red-200',
    icone: '⚠️',
  },
  encerrado: {
    label: 'Encerrado',
    cor: 'text-slate-500',
    corBg: 'bg-slate-50',
    corBorda: 'border-slate-200',
    icone: '🔴',
  },
}

export const CATEGORIA_SERVICO_LABELS: Record<CategoriaServico, string> = {
  trafego_pago: 'Tráfego Pago',
  conteudo: 'Produção de Conteúdo',
  branding: 'Branding',
  seo: 'SEO',
  email_marketing: 'E-mail Marketing',
  social_media: 'Social Media',
  crm_automacao: 'CRM / Automação',
  consultoria: 'Consultoria',
  producao_video: 'Produção de Vídeo',
  design: 'Design Gráfico',
}

export const TIPO_ENTREGA_LABELS: Record<TipoEntrega, string> = {
  relatorio_mensal: '📊 Relatório Mensal',
  campanha: '📣 Campanha',
  criativo: '🎨 Criativo',
  copy: '✍️ Copy',
  planejamento: '🗓️ Planejamento',
  apresentacao: '📽️ Apresentação',
  video: '🎬 Vídeo',
  identidade_visual: '🖌️ Identidade Visual',
  outro: '📦 Outro',
}

export const CATALOGO_SERVICOS: Servico[] = [
  { id: 's1', nome: 'Gestão de Tráfego Pago (Google + Meta)', categoria: 'trafego_pago' },
  { id: 's2', nome: 'Gestão de Tráfego Pago (Meta Ads)', categoria: 'trafego_pago' },
  { id: 's3', nome: 'Produção de Conteúdo (Blog + LinkedIn)', categoria: 'conteudo' },
  { id: 's4', nome: 'Social Media Management', categoria: 'social_media' },
  { id: 's5', nome: 'SEO On-Page + Off-Page', categoria: 'seo' },
  { id: 's6', nome: 'E-mail Marketing (fluxos + disparos)', categoria: 'email_marketing' },
  { id: 's7', nome: 'Branding / Identidade Visual', categoria: 'branding' },
  { id: 's8', nome: 'CRM e Automação de Marketing', categoria: 'crm_automacao' },
  { id: 's9', nome: 'Consultoria Estratégica Mensal', categoria: 'consultoria' },
  { id: 's10', nome: 'Produção de Vídeo (Reels + YouTube)', categoria: 'producao_video' },
  { id: 's11', nome: 'Design Gráfico (peças avulsas)', categoria: 'design' },
  { id: 's12', nome: 'Gestão de Tráfego Pago (Google Ads)', categoria: 'trafego_pago' },
]
