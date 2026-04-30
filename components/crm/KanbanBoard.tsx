'use client'

import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Lead, FollowUp, FunnelStage } from '@/lib/crm/types'
import { STAGE_CONFIG, STAGE_ORDER } from '@/lib/crm/constants'
import { CARGO_LABELS, USUARIOS } from '@/lib/crm/constants'
import { formatarMoeda } from '@/lib/crm/score'
import { ScoreBadge } from './ScoreBadge'
import { LeadCard } from './LeadCard'
import { Plus } from 'lucide-react'

interface Props {
  leads: Lead[]
  followUps: FollowUp[]
  onLeadClick: (lead: Lead) => void
  onAddLead: (stage?: string) => void
  onMoverLead: (leadId: string, stage: FunnelStage) => void
  onEditLead: (lead: Lead) => void
}

export function KanbanBoard({ leads, followUps, onLeadClick, onAddLead, onMoverLead, onEditLead }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overStage, setOverStage] = useState<FunnelStage | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }, // 8px de movimento antes de ativar drag
    })
  )

  const activeLead = activeId ? leads.find(l => l.id === activeId) : null

  function getProximoFollowUp(leadId: string): FollowUp | undefined {
    return followUps
      .filter((f) => f.lead_id === leadId && f.status === 'pendente')
      .sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime())[0]
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragOver(event: DragOverEvent) {
    const overId = event.over?.id as FunnelStage | null
    setOverStage(overId && STAGE_CONFIG[overId] ? overId : null)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    setOverStage(null)

    if (!over) return

    const leadId = active.id as string
    const targetStage = over.id as FunnelStage

    if (!STAGE_CONFIG[targetStage]) return

    const lead = leads.find(l => l.id === leadId)
    if (!lead || lead.status === targetStage) return

    onMoverLead(leadId, targetStage)
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-4 h-full">
        {STAGE_ORDER.map((stage) => (
          <KanbanColumn
            key={stage}
            stage={stage}
            leads={leads.filter(l => l.status === stage)}
            followUps={followUps}
            isOver={overStage === stage}
            isDragging={!!activeId}
            activeLeadId={activeId}
            getProximoFollowUp={getProximoFollowUp}
            onLeadClick={onLeadClick}
            onEditLead={onEditLead}
            onAddLead={onAddLead}
          />
        ))}
      </div>

      <DragOverlay>
        {activeLead && (
          <DragOverlayCard lead={activeLead} />
        )}
      </DragOverlay>
    </DndContext>
  )
}

// ─── Coluna droppable ────────────────────────────────────────────────────────

function KanbanColumn({
  stage, leads, followUps, isOver, isDragging, activeLeadId,
  getProximoFollowUp, onLeadClick, onEditLead, onAddLead,
}: {
  stage: FunnelStage
  leads: Lead[]
  followUps: FollowUp[]
  isOver: boolean
  isDragging: boolean
  activeLeadId: string | null
  getProximoFollowUp: (id: string) => FollowUp | undefined
  onLeadClick: (lead: Lead) => void
  onEditLead: (lead: Lead) => void
  onAddLead: (stage?: string) => void
}) {
  const { setNodeRef } = useDroppable({ id: stage })
  const config = STAGE_CONFIG[stage]
  const totalValor = leads.reduce((sum, l) => sum + (l.valor_estimado ?? 0), 0)
  const temAtrasado = leads.some(l => {
    const fu = getProximoFollowUp(l.id)
    return fu && new Date(fu.data_hora) < new Date()
  })

  return (
    <div className="flex-none w-64 flex flex-col">
      {/* Header */}
      <div className={`rounded-t-lg px-3 py-2.5 border-t-2 ${config.corBorda} bg-white border-x border-slate-200`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold uppercase tracking-wide ${config.cor}`}>
              {config.label}
            </span>
            {temAtrasado && <span title="Follow-up atrasado">⚠️</span>}
          </div>
          <span className="bg-slate-100 text-slate-600 text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
            {leads.length}
          </span>
        </div>
        {totalValor > 0 && (
          <p className="text-xs text-slate-400 mt-0.5">{formatarMoeda(totalValor)}</p>
        )}
      </div>

      {/* Cards droppable */}
      <div
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto border border-t-0 border-slate-200 rounded-b-lg p-2 space-y-2 min-h-[400px] transition-colors ${
          isOver
            ? `${config.corBg} border-2 ${config.corBorda}`
            : 'bg-slate-50'
        }`}
      >
        {leads.map((lead) => (
          <DraggableLeadCard
            key={lead.id}
            lead={lead}
            proximoFollowUp={getProximoFollowUp(lead.id)}
            isBeingDragged={activeLeadId === lead.id}
            onClick={() => onLeadClick(lead)}
            onEdit={(e) => { e.stopPropagation(); onEditLead(lead) }}
          />
        ))}

        {/* Zona de soltar vazia */}
        {isDragging && leads.length === 0 && (
          <div className={`flex items-center justify-center h-20 rounded-lg border-2 border-dashed text-xs font-medium ${config.corBorda} ${config.cor} opacity-60`}>
            Soltar aqui
          </div>
        )}

        {stage !== 'fechado' && stage !== 'sem_interesse' && stage !== 'pausado' && (
          <button
            onClick={() => onAddLead(stage)}
            className="w-full flex items-center justify-center gap-1 py-2 text-xs text-slate-400 hover:text-slate-600 hover:bg-white rounded-md border border-dashed border-slate-200 hover:border-slate-300 transition-all"
          >
            <Plus size={13} />
            Adicionar lead
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Card draggable ──────────────────────────────────────────────────────────

function DraggableLeadCard({
  lead, proximoFollowUp, isBeingDragged, onClick, onEdit,
}: {
  lead: Lead
  proximoFollowUp?: FollowUp
  isBeingDragged: boolean
  onClick: () => void
  onEdit: (e: React.MouseEvent) => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
  })

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`touch-none ${isDragging ? 'opacity-30' : ''}`}
    >
      <LeadCard
        lead={lead}
        proximoFollowUp={proximoFollowUp}
        onClick={onClick}
        onEdit={onEdit}
      />
    </div>
  )
}

// ─── Overlay enquanto arrasta ────────────────────────────────────────────────

function DragOverlayCard({ lead }: { lead: Lead }) {
  const responsavel = USUARIOS.find(u => u.id === lead.responsavel_id)
  return (
    <div className="bg-white rounded-lg border-2 border-blue-400 shadow-2xl p-3 w-64 rotate-2 opacity-95">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="font-semibold text-slate-800 text-sm truncate">{lead.nome_empresa}</p>
          <p className="text-xs text-slate-500 truncate">
            {lead.nome_contato} · {CARGO_LABELS[lead.cargo_contato]}
          </p>
        </div>
        <ScoreBadge score={lead.score_total} />
      </div>
      {lead.valor_estimado && (
        <p className="text-sm font-medium text-emerald-600">
          {formatarMoeda(lead.valor_estimado)}<span className="text-slate-400 font-normal">/mês</span>
        </p>
      )}
      {responsavel && (
        <div className="flex justify-end mt-2">
          <span className={`w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center ${responsavel.cor}`}>
            {responsavel.iniciais}
          </span>
        </div>
      )}
    </div>
  )
}
