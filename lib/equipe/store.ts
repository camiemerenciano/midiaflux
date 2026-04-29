'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { MembroPerfil } from './types'
import { USUARIOS } from '@/lib/crm/constants'

const PERFIS_INICIAIS: MembroPerfil[] = [
  {
    usuario_id: 'u1',
    cargo: 'Gestora de Projetos',
    especialidades: ['Social Media', 'Tráfego Pago', 'Gestão de Clientes'],
    responsabilidades: [
      'Gerenciar projetos e prazos',
      'Atendimento e relacionamento com clientes',
      'Distribuição de tarefas no time',
      'Relatórios mensais de resultado',
    ],
    horas_disponiveis_mes: 160,
    data_entrada: new Date().toISOString().slice(0, 10),
  },
  {
    usuario_id: 'u2',
    cargo: 'Editor de Vídeo',
    especialidades: ['Design Gráfico', 'Produção de Vídeo', 'Branding'],
    responsabilidades: [
      'Criação de peças visuais e identidade visual',
      'Produção e edição de vídeos',
      'Storymaker e cobertura de eventos',
      'Papelaria e materiais comerciais',
    ],
    horas_disponiveis_mes: 160,
    data_entrada: new Date().toISOString().slice(0, 10),
  },
  {
    usuario_id: 'u3',
    cargo: 'CEO',
    especialidades: ['Produção de Conteúdo', 'Copywriting', 'SEO'],
    responsabilidades: [
      'Produção de conteúdo para redes sociais',
      'Copywriting para campanhas e anúncios',
      'Planejamento editorial mensal',
      'Análise de métricas e performance',
    ],
    horas_disponiveis_mes: 160,
    data_entrada: new Date().toISOString().slice(0, 10),
  },
]

interface EquipeStore {
  perfis: MembroPerfil[]
  updatePerfil: (usuario_id: string, data: Partial<MembroPerfil>) => void
  getPerfil: (usuario_id: string) => MembroPerfil | undefined
}

export const useEquipeStore = create<EquipeStore>()(
  persist(
    (set, get) => ({
      perfis: PERFIS_INICIAIS,

      updatePerfil: (usuario_id, data) =>
        set((s) => ({
          perfis: s.perfis.map((p) =>
            p.usuario_id === usuario_id ? { ...p, ...data } : p
          ),
        })),

      getPerfil: (usuario_id) =>
        get().perfis.find((p) => p.usuario_id === usuario_id),
    }),
    { name: 'midiaflux-equipe-v2', skipHydration: true }
  )
)
