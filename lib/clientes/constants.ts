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
  social_media:  'Social Media',
  trafego_pago:  'Tráfego Pago',
  producao_video:'Produção de Vídeo',
  fotografia:    'Fotografia',
  design:        'Design',
  branding:      'Branding & Identidade',
  conteudo:      'Produção de Conteúdo',
  consultoria:   'Mentoria & Consultoria',
  lancamentos:   'Lançamentos',
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
  { id: 's01', nome: 'Social Media',                                    categoria: 'social_media' },
  { id: 's02', nome: 'Cobertura',                                        categoria: 'producao_video' },
  { id: 's03', nome: 'Tráfego Pago',                                     categoria: 'trafego_pago' },
  { id: 's04', nome: 'Google Meu Negócio',                               categoria: 'trafego_pago' },
  { id: 's05', nome: 'Design',                                            categoria: 'design' },
  { id: 's06', nome: 'Mentoria & Consultoria',                           categoria: 'consultoria' },
  { id: 's07', nome: 'Branding / Identidade Visual',                     categoria: 'branding' },
  { id: 's08', nome: 'Lançamentos',                                       categoria: 'lancamentos' },
  { id: 's09', nome: 'Posicionamento de Marca',                          categoria: 'branding' },
  { id: 's10', nome: 'Produção de Conteúdo',                             categoria: 'conteudo' },
  { id: 's11', nome: 'Fotos Corporativas',                               categoria: 'fotografia' },
  { id: 's12', nome: 'Palestras',                                         categoria: 'consultoria' },
  { id: 's13', nome: 'Papelaria e Materiais Comerciais',                 categoria: 'design' },
  { id: 's14', nome: 'Videomaker (captação e edição de vídeo)',          categoria: 'producao_video' },
  { id: 's15', nome: 'Storymaker',                                        categoria: 'conteudo' },
  { id: 's16', nome: 'Captação e Edição de Vídeos (avulso/pacotes)',     categoria: 'producao_video' },
]
