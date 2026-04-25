'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Lancamento, MetaMensal, StatusLancamento, ResumoMensal } from './types'
import { mockLancamentos, mockMetas } from './mock-data'
import { ALERTA_INADIMPLENCIA_DIAS } from './constants'

function gid() { return crypto.randomUUID() }
function now() { return new Date().toISOString() }

function calcularDiasAtraso(dataVencimento: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(dataVencimento).getTime()) / 86400000))
}

interface FinanceiroStore {
  lancamentos: Lancamento[]
  metas: MetaMensal[]

  addLancamento: (data: Omit<Lancamento, 'id' | 'criado_em'>) => void
  updateLancamento: (id: string, data: Partial<Lancamento>) => void
  marcarPago: (id: string, dataPagamento?: string) => void
  marcarAtrasado: (id: string) => void

  getLancamentosByCompetencia: (comp: string) => Lancamento[]
  getResumoMensal: (comp: string) => ResumoMensal
  getResumoRange: (comps: string[]) => ResumoMensal[]
  getInadimplentes: () => Array<Lancamento & { diasAtraso: number }>
  getAlertasFinanceiros: () => AlertaFinanceiro[]
  getMRR: () => number
}

export interface AlertaFinanceiro {
  id: string
  tipo: 'inadimplencia' | 'margem_baixa' | 'meta_abaixo' | 'renovacao_proxima' | 'custo_alto'
  titulo: string
  descricao: string
  valor?: number
  gravidade: 'critica' | 'alta' | 'media'
}

export const useFinanceiroStore = create<FinanceiroStore>()(
  persist(
    (set, get) => ({
      lancamentos: mockLancamentos,
      metas: mockMetas,

      addLancamento: (data) =>
        set((s) => ({
          lancamentos: [{ ...data, id: gid(), criado_em: now() }, ...s.lancamentos],
        })),

      updateLancamento: (id, data) =>
        set((s) => ({
          lancamentos: s.lancamentos.map((l) => l.id === id ? { ...l, ...data } : l),
        })),

      marcarPago: (id, dataPagamento) =>
        set((s) => ({
          lancamentos: s.lancamentos.map((l) =>
            l.id === id
              ? { ...l, status: 'pago' as StatusLancamento, data_pagamento: dataPagamento ?? now().slice(0, 10) }
              : l
          ),
        })),

      marcarAtrasado: (id) =>
        set((s) => ({
          lancamentos: s.lancamentos.map((l) => l.id === id ? { ...l, status: 'atrasado' as StatusLancamento } : l),
        })),

      getLancamentosByCompetencia: (comp) =>
        get().lancamentos.filter((l) => l.competencia === comp),

      getResumoMensal: (comp): ResumoMensal => {
        const items = get().lancamentos.filter((l) => l.competencia === comp)
        const receitas = items.filter((l) => l.tipo === 'receita')
        const custos   = items.filter((l) => l.tipo === 'custo')

        const receita_realizada = receitas
          .filter((l) => l.status === 'pago')
          .reduce((s, l) => s + l.valor, 0)

        const receita_prevista = receitas
          .filter((l) => ['emitido', 'previsto'].includes(l.status))
          .reduce((s, l) => s + l.valor, 0)

        const receita_total = receita_realizada + receita_prevista

        const custo_total = custos
          .filter((l) => l.status !== 'cancelado')
          .reduce((s, l) => s + l.valor, 0)

        const inadimplencia = receitas
          .filter((l) => l.status === 'atrasado')
          .reduce((s, l) => s + l.valor, 0)

        const margem_valor = receita_realizada - custo_total
        const margem_pct = receita_realizada > 0
          ? Math.round((margem_valor / receita_realizada) * 100)
          : 0

        const meta = get().metas.find((m) => m.competencia === comp)

        return { competencia: comp, receita_realizada, receita_prevista, receita_total, custo_total, margem_valor, margem_pct, inadimplencia, meta }
      },

      getResumoRange: (comps) => comps.map((c) => get().getResumoMensal(c)),

      getInadimplentes: () =>
        get().lancamentos
          .filter((l) => l.tipo === 'receita' && l.status === 'atrasado')
          .map((l) => ({ ...l, diasAtraso: calcularDiasAtraso(l.data_vencimento) }))
          .sort((a, b) => b.diasAtraso - a.diasAtraso),

      getMRR: () => {
        const comp = new Date().toISOString().slice(0, 7)
        return get().lancamentos
          .filter((l) => l.tipo === 'receita' && l.competencia === comp && l.recorrente && l.status !== 'cancelado')
          .reduce((s, l) => s + l.valor, 0)
      },

      getAlertasFinanceiros: (): AlertaFinanceiro[] => {
        const alertas: AlertaFinanceiro[] = []
        const comp = new Date().toISOString().slice(0, 7)
        const resumo = get().getResumoMensal(comp)
        const inadimplentes = get().getInadimplentes()

        // Inadimplência
        inadimplentes.forEach((l) => {
          alertas.push({
            id: `inad-${l.id}`,
            tipo: 'inadimplencia',
            titulo: 'Pagamento em atraso',
            descricao: `${l.descricao} — ${l.diasAtraso} dias em atraso`,
            valor: l.valor,
            gravidade: l.diasAtraso > 30 ? 'critica' : 'alta',
          })
        })

        // Margem baixa
        if (resumo.margem_pct < 35 && resumo.receita_realizada > 0) {
          alertas.push({
            id: 'margem-baixa',
            tipo: 'margem_baixa',
            titulo: 'Margem abaixo do mínimo',
            descricao: `Margem atual ${resumo.margem_pct}% — abaixo do alvo de 35%`,
            valor: resumo.margem_valor,
            gravidade: resumo.margem_pct < 20 ? 'critica' : 'alta',
          })
        }

        // Meta abaixo
        if (resumo.meta && resumo.receita_realizada < resumo.meta.meta_receita * 0.7) {
          const pct = Math.round((resumo.receita_realizada / resumo.meta.meta_receita) * 100)
          alertas.push({
            id: 'meta-abaixo',
            tipo: 'meta_abaixo',
            titulo: 'Receita abaixo da meta',
            descricao: `${pct}% da meta atingida (R$ ${resumo.receita_realizada.toLocaleString('pt-BR')} de R$ ${resumo.meta.meta_receita.toLocaleString('pt-BR')})`,
            valor: resumo.meta.meta_receita - resumo.receita_realizada,
            gravidade: pct < 50 ? 'critica' : 'alta',
          })
        }

        return alertas.sort((a, b) => {
          const o = { critica: 0, alta: 1, media: 2 }
          return o[a.gravidade] - o[b.gravidade]
        })
      },
    }),
    { name: 'midiaflux-financeiro' }
  )
)
