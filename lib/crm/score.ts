import { Lead, Cargo, Porte } from './types'

const SCORE_PERFIL_PORTE: Record<Porte, number> = {
  grande: 20,
  media: 15,
  pequena: 8,
  micro: 3,
}

const SCORE_PERFIL_CARGO: Record<Cargo, number> = {
  ceo_socio: 15,
  diretor: 12,
  gerente: 8,
  coordenador: 3,
  outro: 1,
}

export function calcularScorePerfil(lead: Partial<Lead>): number {
  let score = 0
  if (lead.porte) score += SCORE_PERFIL_PORTE[lead.porte] ?? 0
  if (lead.cargo_contato) score += SCORE_PERFIL_CARGO[lead.cargo_contato] ?? 0
  if (lead.site) score += 3
  if (lead.cnpj) score += 2
  return Math.min(score, 40)
}

export function calcularScoreTotal(perfil: number, engajamento: number, timing: number): number {
  return Math.min(perfil + engajamento + timing, 100)
}

export interface ScoreClassificacao {
  label: string
  emoji: string
  corTexto: string
  corBg: string
  corBorda: string
  corBarra: string
}

export function classificarScore(score: number): ScoreClassificacao {
  if (score >= 76)
    return {
      label: 'Urgente',
      emoji: '🔴',
      corTexto: 'text-red-700',
      corBg: 'bg-red-50',
      corBorda: 'border-red-200',
      corBarra: 'bg-red-500',
    }
  if (score >= 56)
    return {
      label: 'Quente',
      emoji: '🟠',
      corTexto: 'text-orange-700',
      corBg: 'bg-orange-50',
      corBorda: 'border-orange-200',
      corBarra: 'bg-orange-500',
    }
  if (score >= 31)
    return {
      label: 'Morno',
      emoji: '🟡',
      corTexto: 'text-yellow-700',
      corBg: 'bg-yellow-50',
      corBorda: 'border-yellow-200',
      corBarra: 'bg-yellow-400',
    }
  return {
    label: 'Frio',
    emoji: '🔵',
    corTexto: 'text-blue-700',
    corBg: 'bg-blue-50',
    corBorda: 'border-blue-200',
    corBarra: 'bg-blue-400',
  }
}

export function formatarMoeda(valor?: number): string {
  if (!valor) return '—'
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatarDataHora(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
