'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Membro {
  id: string
  nome: string
  iniciais: string
  cor: string
  cargo: string
  email: string
  whatsapp: string
}

export interface PerfilAgencia {
  nome: string
  logo?: string
  telefone: string
  email: string
  site: string
  instagram: string
  cidade: string
}

interface AgenciaStore {
  perfil: PerfilAgencia
  membros: Membro[]
  updatePerfil: (data: Partial<PerfilAgencia>) => void
  addMembro: (membro: Omit<Membro, 'id'>) => void
  updateMembro: (id: string, data: Partial<Membro>) => void
  removeMembro: (id: string) => void
}

const MEMBROS_INICIAIS: Membro[] = [
  { id: 'u1', nome: 'Camila',  iniciais: 'CA', cor: 'bg-blue-500',    cargo: 'Gestora',    email: '', whatsapp: '' },
  { id: 'u2', nome: 'Gabriel', iniciais: 'GA', cor: 'bg-violet-500',  cargo: 'Designer',   email: '', whatsapp: '' },
  { id: 'u3', nome: 'Geovana', iniciais: 'GE', cor: 'bg-emerald-500', cargo: 'Analista',   email: '', whatsapp: '' },
]

function gid() { return crypto.randomUUID() }

export const useAgenciaStore = create<AgenciaStore>()(
  persist(
    (set) => ({
      perfil: {
        nome: 'MídiaFlux',
        telefone: '',
        email: '',
        site: '',
        instagram: '',
        cidade: '',
      },
      membros: MEMBROS_INICIAIS,

      updatePerfil: (data) =>
        set((s) => ({ perfil: { ...s.perfil, ...data } })),

      addMembro: (data) =>
        set((s) => ({ membros: [...s.membros, { ...data, id: gid() }] })),

      updateMembro: (id, data) =>
        set((s) => ({
          membros: s.membros.map((m) => m.id === id ? { ...m, ...data } : m),
        })),

      removeMembro: (id) =>
        set((s) => ({ membros: s.membros.filter((m) => m.id !== id) })),
    }),
    { name: 'midiaflux-agencia-v1' }
  )
)
