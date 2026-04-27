'use client'

import { Projeto, Tarefa } from '@/lib/operacao/types'
import { STATUS_PROJETO_CONFIG, PRIORIDADE_CONFIG, TIPO_PROJETO_LABELS } from '@/lib/operacao/constants'
import { isTarefaAtrasada } from '@/lib/operacao/store'
import { USUARIOS } from '@/lib/crm/constants'
import { formatarData } from '@/lib/crm/score'
import { useClientesStore } from '@/lib/clientes/store'
import { Calendar, AlertTriangle, Clock, CheckCircle2, Trash2 } from 'lucide-react'

interface Props {
  projeto: Projeto
  tarefas: Tarefa[]
  onClick: () => void
  onRemove?: () => void
}

export function ProjetoCard({ projeto, tarefas, onClick, onRemove }: Props) {
  const { clientes } = useClientesStore()
  const statusConfig = STATUS_PROJETO_CONFIG[projeto.status]
  const prioConfig = PRIORIDADE_CONFIG[projeto.prioridade]
  const responsavel = USUARIOS.find((u) => u.id === projeto.responsavel_id)
  const equipe = USUARIOS.filter((u) => projeto.equipe_ids.includes(u.id))
  const cliente = clientes.find((c) => c.id === projeto.cliente_id)

  const tarefasConcluidas = tarefas.filter((t) => t.status === 'concluido').length
  const tarefasAtrasadas = tarefas.filter(isTarefaAtrasada).length
  const tarefasAguardando = tarefas.filter((t) => t.status === 'aguardando_cliente').length
  const tarefasBloqueadas = tarefas.filter((t) => t.status === 'bloqueado').length

  const diasParaEntrega = Math.ceil(
    (new Date(projeto.data_entrega_prevista).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
  const projetoAtrasado =
    diasParaEntrega < 0 && projeto.status !== 'concluido' && projeto.status !== 'cancelado'
  const projetoEmRisco =
    diasParaEntrega >= 0 && diasParaEntrega <= 3 && projeto.progresso < 80 && projeto.status !== 'concluido'

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200 p-4 cursor-pointer hover:shadow-md transition-all group overflow-hidden relative ${
        projetoAtrasado ? 'border-l-4 border-l-red-400' :
        projetoEmRisco ? 'border-l-4 border-l-amber-400' :
        projeto.prioridade === 'urgente' ? 'border-l-4 border-l-red-500' :
        'border-l-4 border-l-transparent'
      }`}
    >
      {/* Prioridade tag */}
      {(projeto.prioridade === 'urgente' || projeto.prioridade === 'alta') && (
        <div className={`absolute top-0 right-0 text-xs font-bold px-2 py-0.5 rounded-bl-lg ${prioConfig.corBg} ${prioConfig.cor}`}>
          {prioConfig.label}
        </div>
      )}

      {/* Botão remover */}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (confirm(`Remover o projeto "${projeto.nome}"? Esta ação também remove todas as tarefas associadas.`)) {
              onRemove()
            }
          }}
          className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600"
          title="Remover projeto"
        >
          <Trash2 size={13} />
        </button>
      )}

      {/* Header */}
      <div className="mb-3">
        <p className="text-xs text-slate-400 mb-0.5">{cliente?.nome_empresa ?? '—'}</p>
        <p className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors leading-tight pr-12">
          {projeto.nome}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusConfig.corBg} ${statusConfig.cor} ${statusConfig.corBorda}`}>
            {statusConfig.icone} {statusConfig.label}
          </span>
          <span className="text-xs text-slate-400">{TIPO_PROJETO_LABELS[projeto.tipo]}</span>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-500">Progresso</span>
          <span className={`font-semibold ${projeto.progresso === 100 ? 'text-emerald-600' : projetoAtrasado ? 'text-red-600' : 'text-slate-700'}`}>
            {projeto.progresso}%
          </span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              projeto.progresso === 100 ? 'bg-emerald-500' :
              projetoAtrasado ? 'bg-red-400' :
              projetoEmRisco ? 'bg-amber-400' : 'bg-blue-500'
            }`}
            style={{ width: `${projeto.progresso}%` }}
          />
        </div>
      </div>

      {/* Métricas de tarefas */}
      <div className="grid grid-cols-4 gap-1 mb-3">
        <TarefaStat icon={<CheckCircle2 size={11} />} value={tarefasConcluidas} total={tarefas.length} cor="emerald" label="ok" />
        <TarefaStat icon={<AlertTriangle size={11} />} value={tarefasAtrasadas} cor="red" label="atraso" />
        <TarefaStat icon={<Clock size={11} />} value={tarefasAguardando} cor="amber" label="cliente" />
        <TarefaStat icon={<AlertTriangle size={11} />} value={tarefasBloqueadas} cor="red" label="bloq." />
      </div>

      {/* Alertas */}
      {projetoAtrasado && (
        <div className="flex items-center gap-1.5 bg-red-50 border border-red-100 rounded-lg px-2 py-1.5 mb-2">
          <AlertTriangle size={12} className="text-red-500 flex-none" />
          <p className="text-xs text-red-700 font-medium">Projeto atrasado — {Math.abs(diasParaEntrega)}d de atraso</p>
        </div>
      )}
      {projetoEmRisco && !projetoAtrasado && (
        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1.5 mb-2">
          <AlertTriangle size={12} className="text-amber-500 flex-none" />
          <p className="text-xs text-amber-700">Entrega em {diasParaEntrega}d com apenas {projeto.progresso}%</p>
        </div>
      )}

      {/* Rodapé */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <Calendar size={11} />
          <span className={projetoAtrasado ? 'text-red-500 font-medium' : ''}>
            {formatarData(projeto.data_entrega_prevista)}
          </span>
        </div>
        <div className="flex -space-x-1">
          {equipe.slice(0, 3).map((u) => (
            <span
              key={u.id}
              title={u.nome}
              className={`w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center border-2 border-white ${u.cor}`}
            >
              {u.iniciais[0]}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function TarefaStat({
  icon, value, total, cor, label,
}: {
  icon: React.ReactNode; value: number; total?: number; cor: string; label: string
}) {
  const corMap: Record<string, string> = {
    emerald: value === total && total! > 0 ? 'text-emerald-600 bg-emerald-50' : 'text-slate-500 bg-slate-50',
    red: value > 0 ? 'text-red-600 bg-red-50' : 'text-slate-300 bg-slate-50',
    amber: value > 0 ? 'text-amber-600 bg-amber-50' : 'text-slate-300 bg-slate-50',
  }
  return (
    <div className={`rounded text-center py-1 ${corMap[cor]}`}>
      <div className="flex items-center justify-center gap-0.5">
        {icon}
        <span className="text-xs font-bold">{value}{total !== undefined ? `/${total}` : ''}</span>
      </div>
      <p className="text-xs opacity-70">{label}</p>
    </div>
  )
}
