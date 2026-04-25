'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Lead, Interacao, FollowUp, FunnelStage } from './types'
import { STAGE_CONFIG } from './constants'
import { calcularScoreTotal } from './score'

interface CRMStore {
  leads: Lead[]
  interacoes: Interacao[]
  followUps: FollowUp[]

  addLead: (lead: Omit<Lead, 'id' | 'criado_em' | 'atualizado_em'>) => void
  updateLead: (id: string, data: Partial<Lead>) => void
  moverLead: (id: string, stage: FunnelStage) => void
  addInteracao: (interacao: Omit<Interacao, 'id' | 'criado_em'>) => void
  addFollowUp: (followUp: Omit<FollowUp, 'id' | 'criado_em'>) => void
  concluirFollowUp: (id: string) => void
}

function gerarId(): string {
  return crypto.randomUUID()
}

function agora(): string {
  return new Date().toISOString()
}

export const useCRMStore = create<CRMStore>()(
  persist(
    (set) => ({
      leads: [],
      interacoes: [],
      followUps: [],

      addLead: (leadData) => {
        const score_total = calcularScoreTotal(
          leadData.score_perfil,
          leadData.score_engajamento,
          leadData.score_timing
        )
        const lead: Lead = {
          ...leadData,
          score_total,
          id: gerarId(),
          criado_em: agora(),
          atualizado_em: agora(),
        }
        set((s) => ({ leads: [lead, ...s.leads] }))
      },

      updateLead: (id, data) => {
        set((s) => ({
          leads: s.leads.map((l) => {
            if (l.id !== id) return l
            const updated = { ...l, ...data, atualizado_em: agora() }
            updated.score_total = calcularScoreTotal(
              updated.score_perfil,
              updated.score_engajamento,
              updated.score_timing
            )
            return updated
          }),
        }))
      },

      moverLead: (id, stage) => {
        set((s) => ({
          leads: s.leads.map((l) =>
            l.id === id
              ? {
                  ...l,
                  status: stage,
                  probabilidade: STAGE_CONFIG[stage].probabilidade,
                  atualizado_em: agora(),
                }
              : l
          ),
          interacoes: [
            {
              id: gerarId(),
              lead_id: id,
              usuario_nome: 'Sistema',
              tipo: 'mudanca_estagio',
              conteudo: `Lead movido para "${STAGE_CONFIG[stage].label}"`,
              sentimento: 'neutro',
              criado_em: agora(),
            },
            ...s.interacoes,
          ],
        }))
      },

      addInteracao: (data) => {
        const interacao: Interacao = { ...data, id: gerarId(), criado_em: agora() }
        set((s) => ({ interacoes: [interacao, ...s.interacoes] }))
      },

      addFollowUp: (data) => {
        const followUp: FollowUp = { ...data, id: gerarId(), criado_em: agora() }
        set((s) => ({ followUps: [followUp, ...s.followUps] }))
      },

      concluirFollowUp: (id) => {
        set((s) => ({
          followUps: s.followUps.map((f) =>
            f.id === id ? { ...f, status: 'concluido' } : f
          ),
        }))
      },
    }),
    { name: 'midiaflux-crm-v2' }
  )
)
