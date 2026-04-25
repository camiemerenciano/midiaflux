'use client'

import { Lead, FollowUp } from '@/lib/crm/types'
import { STAGE_CONFIG, STAGE_ORDER } from '@/lib/crm/constants'
import { formatarMoeda } from '@/lib/crm/score'
import { LeadCard } from './LeadCard'
import { Plus } from 'lucide-react'

interface Props {
  leads: Lead[]
  followUps: FollowUp[]
  onLeadClick: (lead: Lead) => void
  onAddLead: (stage?: string) => void
}

export function KanbanBoard({ leads, followUps, onLeadClick, onAddLead }: Props) {
  function getProximoFollowUp(leadId: string): FollowUp | undefined {
    return followUps
      .filter((f) => f.lead_id === leadId && f.status === 'pendente')
      .sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime())[0]
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 h-full">
      {STAGE_ORDER.map((stage) => {
        const config = STAGE_CONFIG[stage]
        const stageLeads = leads.filter((l) => l.status === stage)
        const totalValor = stageLeads.reduce((sum, l) => sum + (l.valor_estimado ?? 0), 0)
        const temAtrasado = stageLeads.some((l) => {
          const fu = getProximoFollowUp(l.id)
          return fu && new Date(fu.data_hora) < new Date()
        })

        return (
          <div key={stage} className="flex-none w-64 flex flex-col">
            {/* Column header */}
            <div className={`rounded-t-lg px-3 py-2.5 border-t-2 ${config.corBorda} bg-white border-x border-slate-200`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold uppercase tracking-wide ${config.cor}`}>
                    {config.label}
                  </span>
                  {temAtrasado && <span title="Follow-up atrasado">⚠️</span>}
                </div>
                <span className="bg-slate-100 text-slate-600 text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                  {stageLeads.length}
                </span>
              </div>
              {totalValor > 0 && (
                <p className="text-xs text-slate-400 mt-0.5">{formatarMoeda(totalValor)}</p>
              )}
            </div>

            {/* Cards */}
            <div className="flex-1 overflow-y-auto bg-slate-50 border border-t-0 border-slate-200 rounded-b-lg p-2 space-y-2 min-h-[400px]">
              {stageLeads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  proximoFollowUp={getProximoFollowUp(lead.id)}
                  onClick={() => onLeadClick(lead)}
                />
              ))}

              {stage !== 'fechado' && stage !== 'perdido' && (
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
      })}
    </div>
  )
}
