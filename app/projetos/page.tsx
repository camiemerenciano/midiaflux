'use client'

import { useState, useMemo } from 'react'
import { useOperacaoStore } from '@/lib/operacao/store'
import { Projeto, StatusProjeto, Tarefa } from '@/lib/operacao/types'
import { STATUS_PROJETO_CONFIG, TIPO_PROJETO_LABELS } from '@/lib/operacao/constants'
import { isTarefaAtrasada } from '@/lib/operacao/store'
import { USUARIOS } from '@/lib/crm/constants'
import { formatarDataHora } from '@/lib/crm/score'
import { ProjetoCard } from '@/components/operacao/ProjetoCard'
import { ProjetoModal } from '@/components/operacao/ProjetoModal'
import { NovoProjetoForm } from '@/components/operacao/NovoProjetoForm'
import { useClientesStore } from '@/lib/clientes/store'
import {
  Search, Plus, AlertTriangle, Clock, CheckCircle2,
  FolderKanban, Zap, Activity,
} from 'lucide-react'

const STATUS_FILTRO: (StatusProjeto | 'todos')[] = ['todos', 'em_andamento', 'aguardando_cliente', 'planejamento', 'concluido', 'pausado']

export default function ProjetosPage() {
  const {
    projetos, tarefas, comentarios,
    addProjeto, moverTarefa, addTarefa, addComentario,
    updateStatusProjeto, getTarefasByProjeto,
    getTarefasAtrasadas, getProjetosAguardandoCliente,
  } = useOperacaoStore()

  const { clientes } = useClientesStore()

  const [projetoSelecionado, setProjetoSelecionado] = useState<Projeto | null>(null)
  const [showNovoProjeto, setShowNovoProjeto] = useState(false)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<StatusProjeto | 'todos'>('todos')
  const [filtroResponsavel, setFiltroResponsavel] = useState('')

  const projetosFiltrados = useMemo(() => {
    return projetos.filter((p) => {
      const cliente = clientes.find((c) => c.id === p.cliente_id)
      const matchBusca =
        !busca ||
        p.nome.toLowerCase().includes(busca.toLowerCase()) ||
        (cliente?.nome_empresa ?? '').toLowerCase().includes(busca.toLowerCase())
      const matchStatus = filtroStatus === 'todos' || p.status === filtroStatus
      const matchResp = !filtroResponsavel || p.responsavel_id === filtroResponsavel
      return matchBusca && matchStatus && matchResp
    })
  }, [projetos, busca, filtroStatus, filtroResponsavel])

  // KPIs globais
  const ativos = projetos.filter((p) => p.status === 'em_andamento').length
  const tarefasAtrasadas = getTarefasAtrasadas()
  const aguardandoCliente = getProjetosAguardandoCliente().length
  const concluidos = projetos.filter((p) => p.status === 'concluido').length

  // Horas da semana
  const horasEstimadas = tarefas.filter((t) => t.status !== 'concluido')
    .reduce((s, t) => s + (t.estimativa_horas ?? 0), 0)

  return (
    <div className="flex flex-col h-screen bg-slate-50">

      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Operação & Produção</h1>
            <p className="text-sm text-slate-500">{projetos.length} projetos · {ativos} em andamento</p>
          </div>
          <button
            onClick={() => setShowNovoProjeto(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm shadow-sm"
          >
            <Plus size={16} /> Novo Projeto
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <KpiCard icon={<Activity size={16} className="text-blue-500" />}
            label="Em andamento" value={String(ativos)} sub={`de ${projetos.length} projetos`} cor="blue" />
          <KpiCard icon={<AlertTriangle size={16} className="text-red-500" />}
            label="Tarefas atrasadas" value={String(tarefasAtrasadas.length)}
            sub={tarefasAtrasadas.length > 0 ? `Mais grave: ${tarefasAtrasadas[0]?.diasAtraso}d` : 'Tudo em dia'}
            cor="red" alerta={tarefasAtrasadas.length > 0} />
          <KpiCard icon={<Clock size={16} className="text-amber-500" />}
            label="Aguardando cliente" value={String(aguardandoCliente)}
            sub="projetos bloqueados" cor="amber" alerta={aguardandoCliente > 0} />
          <KpiCard icon={<CheckCircle2 size={16} className="text-emerald-500" />}
            label="Concluídos" value={String(concluidos)} sub="este mês" cor="emerald" />
        </div>

        {/* Alertas globais — tarefas atrasadas cross-project */}
        {tarefasAtrasadas.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={14} className="text-red-600" />
              <p className="text-xs font-bold text-red-700">Tarefas atrasadas em todos os projetos</p>
            </div>
            <div className="space-y-1">
              {tarefasAtrasadas.slice(0, 4).map((t) => (
                <div key={t.id} className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-red-600 w-10 flex-none">{t.diasAtraso}d</span>
                  <span className="text-slate-600 flex-1 truncate">{t.nome}</span>
                  <span className="text-slate-400 flex-none">{t.projeto?.nome}</span>
                </div>
              ))}
              {tarefasAtrasadas.length > 4 && (
                <p className="text-xs text-red-500 mt-1">+{tarefasAtrasadas.length - 4} mais...</p>
              )}
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar projeto ou cliente..."
              className="pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>

          <div className="flex bg-slate-100 rounded-lg p-1 gap-0.5">
            {STATUS_FILTRO.map((s) => {
              const label = s === 'todos' ? 'Todos' : STATUS_PROJETO_CONFIG[s].label
              return (
                <button key={s} onClick={() => setFiltroStatus(s)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${filtroStatus === s ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {label}
                </button>
              )
            })}
          </div>

          <select value={filtroResponsavel} onChange={(e) => setFiltroResponsavel(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Todos os responsáveis</option>
            {USUARIOS.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
          </select>

          {(busca || filtroStatus !== 'todos' || filtroResponsavel) && (
            <button onClick={() => { setBusca(''); setFiltroStatus('todos'); setFiltroResponsavel('') }}
              className="text-xs text-slate-500 hover:text-slate-700 underline">
              Limpar
            </button>
          )}
          <span className="text-xs text-slate-400 ml-auto">{projetosFiltrados.length} projeto{projetosFiltrados.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Grade de projetos */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Urgentes/atrasados primeiro */}
        {filtroStatus === 'todos' && projetosFiltrados.some((p) => p.status === 'aguardando_cliente') && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={14} className="text-amber-500" />
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">Aguardando cliente — sem ação da equipe</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projetosFiltrados.filter((p) => p.status === 'aguardando_cliente').map((projeto) => (
                <ProjetoCard key={projeto.id} projeto={projeto}
                  tarefas={getTarefasByProjeto(projeto.id)}
                  onClick={() => setProjetoSelecionado(projeto)} />
              ))}
            </div>
          </div>
        )}

        {/* Demais projetos ordenados por urgência */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projetosFiltrados
            .filter((p) => filtroStatus !== 'todos' || p.status !== 'aguardando_cliente')
            .sort((a, b) => {
              // Urgente > Alta > Normal, depois por % progresso
              const prio = { urgente: 0, alta: 1, normal: 2, baixa: 3 }
              if (a.status === 'concluido' && b.status !== 'concluido') return 1
              if (a.status !== 'concluido' && b.status === 'concluido') return -1
              return (prio[a.prioridade] ?? 2) - (prio[b.prioridade] ?? 2)
            })
            .map((projeto) => (
              <ProjetoCard key={projeto.id} projeto={projeto}
                tarefas={getTarefasByProjeto(projeto.id)}
                onClick={() => setProjetoSelecionado(projeto)} />
            ))}
        </div>
      </div>

      {/* Modal */}
      {projetoSelecionado && (
        <ProjetoModal
          projeto={projetoSelecionado}
          tarefas={getTarefasByProjeto(projetoSelecionado.id)}
          comentarios={comentarios.filter((c) =>
            getTarefasByProjeto(projetoSelecionado.id).some((t) => t.id === c.tarefa_id)
          )}
          onClose={() => setProjetoSelecionado(null)}
          onMoverTarefa={(id, status) => {
            moverTarefa(id, status)
            // Reflect progress in local selected project
            setProjetoSelecionado((prev) =>
              prev ? { ...prev, progresso: projetos.find((p) => p.id === prev.id)?.progresso ?? prev.progresso } : null
            )
          }}
          onAddTarefa={addTarefa}
          onAddComentario={addComentario}
          onUpdateStatusProjeto={(id, status) => {
            updateStatusProjeto(id, status)
            setProjetoSelecionado((prev) => prev ? { ...prev, status } : null)
          }}
        />
      )}

      {/* Formulário novo projeto */}
      {showNovoProjeto && (
        <NovoProjetoForm
          onSave={(projetoData) => {
            addProjeto(projetoData)
            setShowNovoProjeto(false)
          }}
          onCancel={() => setShowNovoProjeto(false)}
        />
      )}
    </div>
  )
}

function KpiCard({ icon, label, value, sub, cor, alerta = false }: {
  icon: React.ReactNode; label: string; value: string; sub: string; cor: string; alerta?: boolean
}) {
  const corMap: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-100', red: 'bg-red-50 border-red-100',
    amber: 'bg-amber-50 border-amber-100', emerald: 'bg-emerald-50 border-emerald-100',
  }
  return (
    <div className={`rounded-xl border p-3 ${corMap[cor]} ${alerta ? 'ring-1 ring-red-200' : ''}`}>
      <div className="flex items-center gap-2 mb-1">{icon}<span className="text-xs text-slate-500">{label}</span></div>
      <p className="text-lg font-bold text-slate-800">{value}</p>
      <p className="text-xs text-slate-400">{sub}</p>
    </div>
  )
}
