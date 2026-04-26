import { FunnelStage, Cargo, Fonte, Segmento, Porte } from './types'

export const STAGE_CONFIG: Record<
  FunnelStage,
  { label: string; cor: string; corBg: string; corBorda: string; probabilidade: number; slaHoras: number | null }
> = {
  lead_captado: {
    label: 'Lead Captado',
    cor: 'text-slate-600',
    corBg: 'bg-slate-100',
    corBorda: 'border-slate-300',
    probabilidade: 5,
    slaHoras: 24,
  },
  lead_qualificado: {
    label: 'Qualificado',
    cor: 'text-blue-600',
    corBg: 'bg-blue-50',
    corBorda: 'border-blue-300',
    probabilidade: 15,
    slaHoras: 48,
  },
  abordagem_enviada: {
    label: 'Abordagem Enviada',
    cor: 'text-indigo-600',
    corBg: 'bg-indigo-50',
    corBorda: 'border-indigo-300',
    probabilidade: 20,
    slaHoras: 72,
  },
  conversa_iniciada: {
    label: 'Conversa Iniciada',
    cor: 'text-violet-600',
    corBg: 'bg-violet-50',
    corBorda: 'border-violet-300',
    probabilidade: 35,
    slaHoras: 24,
  },
  sem_retorno: {
    label: 'Sem Retorno',
    cor: 'text-slate-500',
    corBg: 'bg-slate-100',
    corBorda: 'border-slate-300',
    probabilidade: 10,
    slaHoras: 48,
  },
  follow_up: {
    label: 'Follow Up',
    cor: 'text-yellow-600',
    corBg: 'bg-yellow-50',
    corBorda: 'border-yellow-300',
    probabilidade: 25,
    slaHoras: 24,
  },
  reuniao_marcada: {
    label: 'Reunião Marcada',
    cor: 'text-amber-600',
    corBg: 'bg-amber-50',
    corBorda: 'border-amber-300',
    probabilidade: 55,
    slaHoras: null,
  },
  proposta_enviada: {
    label: 'Proposta Enviada',
    cor: 'text-orange-600',
    corBg: 'bg-orange-50',
    corBorda: 'border-orange-300',
    probabilidade: 70,
    slaHoras: 72,
  },
  fechado: {
    label: 'Fechado',
    cor: 'text-emerald-600',
    corBg: 'bg-emerald-50',
    corBorda: 'border-emerald-400',
    probabilidade: 100,
    slaHoras: null,
  },
  perdido: {
    label: 'Perdido',
    cor: 'text-red-600',
    corBg: 'bg-red-50',
    corBorda: 'border-red-300',
    probabilidade: 0,
    slaHoras: null,
  },
}

export const STAGE_ORDER: FunnelStage[] = [
  'lead_captado',
  'lead_qualificado',
  'abordagem_enviada',
  'conversa_iniciada',
  'sem_retorno',
  'follow_up',
  'reuniao_marcada',
  'proposta_enviada',
  'fechado',
  'perdido',
]

export const CARGO_LABELS: Record<Cargo, string> = {
  ceo_socio: 'CEO / Sócio',
  diretor: 'Diretor',
  gerente: 'Gerente',
  coordenador: 'Coordenador',
  outro: 'Outro',
}

export const FONTE_LABELS: Record<Fonte, string> = {
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  google: 'Google',
  indicacao: 'Indicação',
  evento: 'Evento',
  whatsapp: 'WhatsApp',
  site: 'Site',
  outro: 'Outro',
}

export const SEGMENTO_LABELS: Record<Segmento, string> = {
  ecommerce: 'E-commerce',
  saas: 'SaaS',
  varejo: 'Varejo',
  educacao: 'Educação',
  saude: 'Saúde',
  imoveis: 'Imóveis',
  industria: 'Indústria',
  servicos: 'Serviços',
  estetica: 'Estética',
  beleza: 'Beleza',
  moda: 'Moda',
  outro: 'Outro',
}

export const PORTE_LABELS: Record<Porte, string> = {
  micro: 'Micro (até 9 func.)',
  pequena: 'Pequena (10–49)',
  media: 'Média (50–249)',
  grande: 'Grande (250+)',
}

export const TIPO_INTERACAO_LABELS = {
  whatsapp_enviado: '📱 WhatsApp enviado',
  whatsapp_recebido: '📱 WhatsApp recebido',
  email_enviado: '📧 E-mail enviado',
  email_recebido: '📧 E-mail recebido',
  ligacao_realizada: '📞 Ligação realizada',
  ligacao_recebida: '📞 Ligação recebida',
  reuniao_realizada: '🤝 Reunião realizada',
  proposta_enviada: '📄 Proposta enviada',
  nota_interna: '📝 Nota interna',
  mudanca_estagio: '🔄 Mudança de estágio',
}

export const USUARIOS = [
  { id: 'u1', nome: 'Camila',  iniciais: 'CA', cor: 'bg-blue-500' },
  { id: 'u2', nome: 'Gabriel', iniciais: 'GA', cor: 'bg-violet-500' },
  { id: 'u3', nome: 'Geovana', iniciais: 'GE', cor: 'bg-emerald-500' },
]
