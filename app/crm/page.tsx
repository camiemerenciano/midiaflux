'use client'

import { useState, useMemo } from 'react'
import { useCRMStore } from '@/lib/crm/store'
import { Lead, FunnelStage } from '@/lib/crm/types'
import { STAGE_CONFIG, USUARIOS } from '@/lib/crm/constants'
import { formatarMoeda } from '@/lib/crm/score'
import { KanbanBoard } from '@/components/crm/KanbanBoard'
import { LeadModal } from '@/components/crm/LeadModal'
import { NewLeadForm } from '@/components/crm/NewLeadForm'
import { Search, SlidersHorizontal, Plus, TrendingUp, Users, DollarSign, Target } from 'lucide-react'

export default function CRMPage() {
  const { leads, interacoes, followUps, addLead, moverLead, addInteracao, addFollowUp, concluirFollowUp } =
    useCRMStore()

  const [leadSelecionado, setLeadSelecionado] = useState<Lead | null>(null)
  const [showNewLead, setShowNewLead] = useState(false)
  const [initialStage, setInitialStage] = useState<FunnelStage>('lead_captado')
  const [busca, setBusca] = useState('')
  const [filtroResponsavel, setFiltroResponsavel] = useState('')

  const leadsFiltrados = useMemo(() => {
    return leads.filter((l) => {
      const matchBusca =
        !busca ||
        l.nome_empresa.toLowerCase().includes(busca.toLowerCase()) ||
        l.nome_contato.toLowerCase().includes(busca.toLowerCase())
      const matchResponsavel = !filtroResponsavel || l.responsavel_id === filtroResponsavel
      return matchBusca && matchResponsavel
    })
  }, [leads, busca, filtroResponsavel])

  // KPIs do topo
  const leadsAtivos = leads.filter(
    (l) => l.status !== 'fechado' && l.status !== 'perdido'
  ).length

  const receitaPrevista = leads
    .filter((l) => l.status !== 'perdido')
    .reduce((sum, l) => sum + (l.valor_estimado ?? 0) * (l.probabilidade / 100), 0)

  const receitaFechada = leads
    .filter((l) => l.status === 'fechado')
    .reduce((sum, l) => sum + (l.valor_estimado ?? 0), 0)

  const totalPropostas = leads.filter((l) => l.status === 'proposta_enviada').length
  const totalFechados = leads.filter((l) => l.status === 'fechado').length
  const taxaConversao =
    totalFechados + leads.filter((l) => l.status === 'perdido').length > 0
      ? Math.round((totalFechados / (totalFechados + leads.filter((l) => l.status === 'perdido').length)) * 100)
      : 0

  function handleAddLead(stage?: string) {
    setInitialStage((stage as FunnelStage) ?? 'lead_captado')
    setShowNewLead(true)
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">CRM Comercial</h1>
            <p className="text-sm text-slate-500">Funil de vendas · {leads.length} leads</p>
          </div>
          <button
            onClick={() => handleAddLead()}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm shadow-sm"
          >
            <Plus size={16} />
            Novo Lead
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <KpiCard
            icon={<Users size={16} className="text-blue-500" />}
            label="Leads ativos"
            value={String(leadsAtivos)}
            sub="no funil"
            cor="blue"
          />
          <KpiCard
            icon={<DollarSign size={16} className="text-emerald-500" />}
            label="Receita prevista"
            value={formatarMoeda(receitaPrevista)}
            sub="ponderada por probabilidade"
            cor="emerald"
          />
          <KpiCard
            icon={<TrendingUp size={16} className="text-violet-500" />}
            label="Receita fechada"
            value={formatarMoeda(receitaFechada)}
            sub={`${totalFechados} contrato${totalFechados !== 1 ? 's' : ''}`}
            cor="violet"
          />
          <KpiCard
            icon={<Target size={16} className="text-orange-500" />}
            label="Taxa de conversão"
            value={`${taxaConversao}%`}
            sub={`${totalPropostas} propostas abertas`}
            cor="orange"
          />
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar empresa ou contato..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-slate-400" />
            <select
              value={filtroResponsavel}
              onChange={(e) => setFiltroResponsavel(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os responsáveis</option>
              {USUARIOS.map((u) => (
                <option key={u.id} value={u.id}>{u.nome}</option>
              ))}
            </select>
          </div>
          {(busca || filtroResponsavel) && (
            <button
              onClick={() => { setBusca(''); setFiltroResponsavel('') }}
              className="text-xs text-slate-500 hover:text-slate-700 underline"
            >
              Limpar filtros
            </button>
          )}
          <span className="text-xs text-slate-400 ml-auto">
            {leadsFiltrados.length} de {leads.length} leads
          </span>
        </div>
      </div>

      {/* Kanban */}
      <div className="flex-1 overflow-hidden p-4">
        <KanbanBoard
          leads={leadsFiltrados}
          followUps={followUps}
          onLeadClick={setLeadSelecionado}
          onAddLead={handleAddLead}
        />
      </div>

      {/* Modal de lead */}
      {leadSelecionado && (
        <LeadModal
          lead={leadSelecionado}
          interacoes={interacoes}
          followUps={followUps}
          onClose={() => setLeadSelecionado(null)}
          onMover={(id, stage) => {
            moverLead(id, stage)
            setLeadSelecionado((prev) =>
              prev ? { ...prev, status: stage, probabilidade: STAGE_CONFIG[stage].probabilidade } : null
            )
          }}
          onAddInteracao={addInteracao}
          onAddFollowUp={addFollowUp}
          onConcluirFollowUp={concluirFollowUp}
        />
      )}

      {/* Formulário novo lead */}
      {showNewLead && (
        <NewLeadForm
          initialStage={initialStage}
          onSave={(lead) => {
            addLead(lead)
            setShowNewLead(false)
          }}
          onCancel={() => setShowNewLead(false)}
        />
      )}
    </div>
  )
}

function KpiCard({
  icon,
  label,
  value,
  sub,
  cor,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
  cor: string
}) {
  const corMap: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-100',
    emerald: 'bg-emerald-50 border-emerald-100',
    violet: 'bg-violet-50 border-violet-100',
    orange: 'bg-orange-50 border-orange-100',
  }
  return (
    <div className={`rounded-xl border p-3 ${corMap[cor]}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-slate-500">{label}</span>
      </div>
      <p className="text-lg font-bold text-slate-800">{value}</p>
      <p className="text-xs text-slate-400">{sub}</p>
    </div>
  )
}
