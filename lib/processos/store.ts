'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Documento, StatusDoc } from './types'

interface ProcessosStore {
  documentos: Documento[]
  addDocumento: (doc: Omit<Documento, 'id' | 'criado_em' | 'atualizado_em'>) => void
  updateDocumento: (id: string, data: Partial<Documento>) => void
  updateStatus: (id: string, status: StatusDoc) => void
  arquivar: (id: string) => void
}

function gid() { return crypto.randomUUID() }
function now() { return new Date().toISOString() }

export const useProcessosStore = create<ProcessosStore>()(
  persist(
    (set) => ({
      documentos: [],

      addDocumento: (data) =>
        set((s) => ({
          documentos: [
            { ...data, id: gid(), criado_em: now(), atualizado_em: now() },
            ...s.documentos,
          ],
        })),

      updateDocumento: (id, data) =>
        set((s) => ({
          documentos: s.documentos.map((d) =>
            d.id === id ? { ...d, ...data, atualizado_em: now() } : d
          ),
        })),

      updateStatus: (id, status) =>
        set((s) => ({
          documentos: s.documentos.map((d) =>
            d.id === id ? { ...d, status, atualizado_em: now() } : d
          ),
        })),

      arquivar: (id) =>
        set((s) => ({
          documentos: s.documentos.map((d) =>
            d.id === id ? { ...d, status: 'arquivado', atualizado_em: now() } : d
          ),
        })),
    }),
    { name: 'midiaflux-processos-v2', skipHydration: true }
  )
)
