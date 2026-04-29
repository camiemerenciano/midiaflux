'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Cliente, ContatoCliente, Contrato, EntregaHistorico, StatusCliente, TipoCliente } from './types'

interface ClientesStore {
  clientes: Cliente[]
  contatos: ContatoCliente[]
  contratos: Contrato[]
  entregas: EntregaHistorico[]

  addCliente: (cliente: Omit<Cliente, 'id' | 'criado_em' | 'atualizado_em'>) => string
  updateCliente: (id: string, data: Partial<Cliente>) => void
  updateStatus: (id: string, status: StatusCliente, motivo?: string) => void

  addContato: (contato: Omit<ContatoCliente, 'id'>) => void
  updateContato: (id: string, data: Partial<ContatoCliente>) => void

  addContrato: (contrato: Omit<Contrato, 'id' | 'criado_em'>) => void
  updateContrato: (id: string, data: Partial<Contrato>) => void

  addEntrega: (entrega: Omit<EntregaHistorico, 'id'>) => void
  updateEntrega: (id: string, data: Partial<EntregaHistorico>) => void

  // Derived getters
  getMRR: () => number
  getClientesByTipo: (tipo: TipoCliente) => Cliente[]
  getContratosAtivos: (clienteId: string) => Contrato[]
  getEntregasByCliente: (clienteId: string) => EntregaHistorico[]
  getContatosByCliente: (clienteId: string) => ContatoCliente[]
}

function gid(): string {
  return crypto.randomUUID()
}

function now(): string {
  return new Date().toISOString()
}

export const useClientesStore = create<ClientesStore>()(
  persist(
    (set, get) => ({
      clientes: [],
      contatos: [],
      contratos: [],
      entregas: [],

      addCliente: (data) => {
        const id = gid()
        const cliente: Cliente = { ...data, id, criado_em: now(), atualizado_em: now() }
        set((s) => ({ clientes: [cliente, ...s.clientes] }))
        return id
      },

      updateCliente: (id, data) =>
        set((s) => ({
          clientes: s.clientes.map((c) =>
            c.id === id ? { ...c, ...data, atualizado_em: now() } : c
          ),
        })),

      updateStatus: (id, status, motivo) =>
        set((s) => ({
          clientes: s.clientes.map((c) => {
            if (c.id !== id) return c
            const extra: Partial<Cliente> = {}
            if (status === 'pausado' && motivo) extra.motivo_pausa = motivo
            if (status === 'em_risco' && motivo) extra.motivo_risco = motivo
            if (status === 'encerrado' && motivo) extra.motivo_encerramento = motivo
            return { ...c, status, ...extra, atualizado_em: now() }
          }),
        })),

      addContato: (data) =>
        set((s) => ({ contatos: [...s.contatos, { ...data, id: gid() }] })),

      updateContato: (id, data) =>
        set((s) => ({
          contatos: s.contatos.map((c) => (c.id === id ? { ...c, ...data } : c)),
        })),

      addContrato: (data) =>
        set((s) => ({
          contratos: [...s.contratos, { ...data, id: gid(), criado_em: now() }],
        })),

      updateContrato: (id, data) =>
        set((s) => ({
          contratos: s.contratos.map((c) => (c.id === id ? { ...c, ...data } : c)),
        })),

      addEntrega: (data) =>
        set((s) => ({ entregas: [{ ...data, id: gid() }, ...s.entregas] })),

      updateEntrega: (id, data) =>
        set((s) => ({
          entregas: s.entregas.map((e) => (e.id === id ? { ...e, ...data } : e)),
        })),

      getMRR: () => {
        const { clientes, contratos } = get()
        return contratos
          .filter((k) => {
            const cliente = clientes.find((c) => c.id === k.cliente_id)
            return k.status === 'ativo' && cliente?.status !== 'encerrado'
          })
          .reduce((sum, k) => sum + (k.valor_mensal ?? 0), 0)
      },

      getClientesByTipo: (tipo) => get().clientes.filter((c) => c.tipo === tipo),

      getContratosAtivos: (clienteId) =>
        get().contratos.filter((k) => k.cliente_id === clienteId && k.status === 'ativo'),

      getEntregasByCliente: (clienteId) =>
        get().entregas
          .filter((e) => e.cliente_id === clienteId)
          .sort((a, b) => new Date(b.data_entrega).getTime() - new Date(a.data_entrega).getTime()),

      getContatosByCliente: (clienteId) =>
        get().contatos.filter((c) => c.cliente_id === clienteId),
    }),
    { name: 'midiaflux-clientes-v2', skipHydration: true }
  )
)
