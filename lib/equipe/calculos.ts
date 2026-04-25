import { Tarefa } from '@/lib/operacao/types'
import { USUARIOS } from '@/lib/crm/constants'
import { MembroPerfil, CarregamentoMembro } from './types'

function isTarefaAtrasada(tarefa: Tarefa): boolean {
  if (tarefa.status === 'concluido' || tarefa.status === 'backlog') return false
  return new Date(tarefa.data_prevista) < new Date()
}

export function calcularCarregamento(
  tarefas: Tarefa[],
  perfis: MembroPerfil[]
): CarregamentoMembro[] {
  return USUARIOS.map((usuario) => {
    const perfil = perfis.find((p) => p.usuario_id === usuario.id)
    const horasDisponiveis = perfil?.horas_disponiveis_mes ?? 160

    const tarefasDoMembro = tarefas.filter((t) => t.responsavel_id === usuario.id)

    const ativas = tarefasDoMembro.filter(
      (t) => !['concluido', 'backlog'].includes(t.status)
    )
    const atrasadas = ativas.filter(isTarefaAtrasada)
    const concluidas = tarefasDoMembro.filter((t) => t.status === 'concluido')

    // Horas alocadas: estimativa restante das tarefas ativas
    const horasAlocadas = ativas.reduce((s, t) => {
      const restante = (t.estimativa_horas ?? 0) - (t.horas_realizadas ?? 0)
      return s + Math.max(0, restante)
    }, 0)

    // Horas realizadas: total do que já foi feito
    const horasRealizadas = tarefasDoMembro.reduce(
      (s, t) => s + (t.horas_realizadas ?? 0),
      0
    )

    const utilizacao = horasDisponiveis > 0
      ? Math.round((horasAlocadas / horasDisponiveis) * 100)
      : 0

    // SLA: concluídas no prazo / total concluídas
    const concluidasNoPrazo = concluidas.filter(
      (t) => t.data_conclusao && new Date(t.data_conclusao) <= new Date(t.data_prevista)
    )
    const sla = concluidas.length > 0
      ? Math.round((concluidasNoPrazo.length / concluidas.length) * 100)
      : null

    // Eficiência: estimadas / realizadas
    const comHoras = concluidas.filter(
      (t) => t.estimativa_horas && t.horas_realizadas && t.horas_realizadas > 0
    )
    const eficiencia = comHoras.length > 0
      ? Math.round(
          comHoras.reduce((s, t) => s + t.estimativa_horas! / t.horas_realizadas!, 0) /
            comHoras.length * 100
        )
      : null

    return {
      usuario_id: usuario.id,
      nome: usuario.nome,
      iniciais: usuario.iniciais,
      cor: usuario.cor,
      cargo: perfil?.cargo ?? '—',
      horas_disponiveis: horasDisponiveis,
      horas_alocadas: horasAlocadas,
      horas_realizadas: horasRealizadas,
      utilizacao_pct: utilizacao,
      tarefas_ativas: ativas.length,
      tarefas_atrasadas: atrasadas.length,
      tarefas_concluidas: concluidas.length,
      sla_pct: sla,
      eficiencia_pct: eficiencia,
    }
  })
}

export function corUtilizacao(pct: number): { texto: string; barra: string; bg: string } {
  if (pct > 85) return { texto: 'text-red-700',    barra: 'bg-red-500',    bg: 'bg-red-50' }
  if (pct > 65) return { texto: 'text-emerald-700', barra: 'bg-emerald-500', bg: 'bg-emerald-50' }
  if (pct > 40) return { texto: 'text-amber-700',  barra: 'bg-amber-400',  bg: 'bg-amber-50' }
  return           { texto: 'text-slate-500',   barra: 'bg-slate-300',  bg: 'bg-slate-50' }
}
