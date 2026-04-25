'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Projeto, Tarefa, Comentario, StatusTarefa, StatusProjeto } from './types'
import { mockProjetos, mockTarefas, mockComentarios } from './mock-data'

function recalcularProgresso(tarefas: Tarefa[]): number {
  if (tarefas.length === 0) return 0
  const concluidas = tarefas.filter((t) => t.status === 'concluido').length
  return Math.round((concluidas / tarefas.length) * 100)
}

function isTarefaAtrasada(tarefa: Tarefa): boolean {
  if (tarefa.status === 'concluido' || tarefa.status === 'backlog') return false
  return new Date(tarefa.data_prevista) < new Date()
}

function diasAtraso(data: string): number {
  const diff = new Date().getTime() - new Date(data).getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

interface OperacaoStore {
  projetos: Projeto[]
  tarefas: Tarefa[]
  comentarios: Comentario[]

  addProjeto: (projeto: Omit<Projeto, 'id' | 'criado_em' | 'atualizado_em'>) => string
  updateProjeto: (id: string, data: Partial<Projeto>) => void
  updateStatusProjeto: (id: string, status: StatusProjeto) => void

  addTarefa: (tarefa: Omit<Tarefa, 'id' | 'criado_em' | 'atualizado_em'>) => void
  updateTarefa: (id: string, data: Partial<Tarefa>) => void
  moverTarefa: (id: string, status: StatusTarefa) => void

  addComentario: (comentario: Omit<Comentario, 'id' | 'criado_em'>) => void

  // Selectors
  getTarefasByProjeto: (projetoId: string) => Tarefa[]
  getComentariosByTarefa: (tarefaId: string) => Comentario[]
  getTarefasAtrasadas: () => Array<Tarefa & { projeto: Projeto; diasAtraso: number }>
  getProjetosAguardandoCliente: () => Projeto[]
}

function gid() { return crypto.randomUUID() }
function now() { return new Date().toISOString() }

export const useOperacaoStore = create<OperacaoStore>()(
  persist(
    (set, get) => ({
      projetos: mockProjetos,
      tarefas: mockTarefas,
      comentarios: mockComentarios,

      addProjeto: (data) => {
        const id = gid()
        set((s) => ({
          projetos: [{ ...data, id, criado_em: now(), atualizado_em: now() }, ...s.projetos],
        }))
        return id
      },

      updateProjeto: (id, data) =>
        set((s) => ({
          projetos: s.projetos.map((p) => p.id === id ? { ...p, ...data, atualizado_em: now() } : p),
        })),

      updateStatusProjeto: (id, status) =>
        set((s) => ({
          projetos: s.projetos.map((p) =>
            p.id === id
              ? { ...p, status, atualizado_em: now(), ...(status === 'concluido' ? { data_entrega_real: now() } : {}) }
              : p
          ),
        })),

      addTarefa: (data) =>
        set((s) => {
          const newTarefa: Tarefa = { ...data, id: gid(), criado_em: now(), atualizado_em: now() }
          const tarefasDoProjeto = [...s.tarefas.filter((t) => t.projeto_id === data.projeto_id), newTarefa]
          const progresso = recalcularProgresso(tarefasDoProjeto)
          return {
            tarefas: [newTarefa, ...s.tarefas],
            projetos: s.projetos.map((p) => p.id === data.projeto_id ? { ...p, progresso } : p),
          }
        }),

      updateTarefa: (id, data) =>
        set((s) => {
          const tarefas = s.tarefas.map((t) => t.id === id ? { ...t, ...data, atualizado_em: now() } : t)
          const projetoId = s.tarefas.find((t) => t.id === id)?.projeto_id
          const progresso = projetoId ? recalcularProgresso(tarefas.filter((t) => t.projeto_id === projetoId)) : undefined
          return {
            tarefas,
            projetos: progresso !== undefined
              ? s.projetos.map((p) => p.id === projetoId ? { ...p, progresso } : p)
              : s.projetos,
          }
        }),

      moverTarefa: (id, status) => {
        const extra: Partial<Tarefa> = {}
        if (status === 'concluido') extra.data_conclusao = now()
        get().updateTarefa(id, { status, ...extra })

        // Add system comment
        const tarefa = get().tarefas.find((t) => t.id === id)
        if (tarefa) {
          set((s) => ({
            comentarios: [
              {
                id: gid(),
                tarefa_id: id,
                usuario_nome: 'Sistema',
                conteudo: `Status alterado para "${status}"`,
                tipo: 'sistema' as const,
                criado_em: now(),
              },
              ...s.comentarios,
            ],
          }))
        }
      },

      addComentario: (data) =>
        set((s) => ({
          comentarios: [{ ...data, id: gid(), criado_em: now() }, ...s.comentarios],
        })),

      getTarefasByProjeto: (projetoId) =>
        get().tarefas.filter((t) => t.projeto_id === projetoId).sort((a, b) => a.ordem - b.ordem),

      getComentariosByTarefa: (tarefaId) =>
        get().comentarios.filter((c) => c.tarefa_id === tarefaId).sort((a, b) =>
          new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime()
        ),

      getTarefasAtrasadas: () => {
        const { tarefas, projetos } = get()
        return tarefas
          .filter(isTarefaAtrasada)
          .map((t) => ({
            ...t,
            projeto: projetos.find((p) => p.id === t.projeto_id)!,
            diasAtraso: diasAtraso(t.data_prevista),
          }))
          .filter((t) => t.projeto)
          .sort((a, b) => b.diasAtraso - a.diasAtraso)
      },

      getProjetosAguardandoCliente: () =>
        get().projetos.filter((p) => p.status === 'aguardando_cliente'),
    }),
    { name: 'midiaflux-operacao' }
  )
)

export { isTarefaAtrasada, diasAtraso }
