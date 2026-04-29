'use client'

import { Lead, FollowUp } from '@/lib/crm/types'
import { CARGO_LABELS, USUARIOS } from '@/lib/crm/constants'
import { formatarMoeda, formatarDataHora } from '@/lib/crm/score'
import { ScoreBadge } from './ScoreBadge'
import { Clock, Phone, MessageSquare, Mail, Calendar } from 'lucide-react'

const FOLLOWUP_ICON = {
  ligar: Phone,
  whatsapp: MessageSquare,
  email: Mail,
  reuniao: Calendar,
  outro: Clock,
}

interface Props {
  lead: Lead
  proximoFollowUp?: FollowUp
  onClick: () => void
}

export function LeadCard({ lead, proximoFollowUp, onClick }: Props) {
  const responsavel = USUARIOS.find((u) => u.id === lead.responsavel_id)
  const FollowIcon = proximoFollowUp ? FOLLOWUP_ICON[proximoFollowUp.tipo] : null

  const followUpAtrasado =
    proximoFollowUp &&
    proximoFollowUp.status === 'pendente' &&
    new Date(proximoFollowUp.data_hora) < new Date()

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm hover:shadow-md hover:border-slate-300 cursor-pointer transition-all group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="font-semibold text-slate-800 text-sm truncate group-hover:text-blue-600 transition-colors">
            {lead.nome_empresa}
          </p>
          <p className="text-xs text-slate-500 truncate">
            {lead.nome_contato} · {CARGO_LABELS[lead.cargo_contato]}
          </p>
        </div>
        <ScoreBadge score={lead.score_total} />
      </div>

      {lead.valor_estimado && (
        <p className="text-sm font-medium text-emerald-600 mb-2">
          {formatarMoeda(lead.valor_estimado)}<span className="text-slate-400 font-normal">/mês</span>
        </p>
      )}

      {proximoFollowUp && FollowIcon && (
        <div
          className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs mt-2 ${
            followUpAtrasado
              ? 'bg-red-50 text-red-600 border border-red-200'
              : 'bg-slate-50 text-slate-500 border border-slate-100'
          }`}
        >
          <FollowIcon size={11} />
          <span className="truncate">{proximoFollowUp.descricao}</span>
        </div>
      )}

      {proximoFollowUp && (
        <p className={`text-xs mt-1 ${followUpAtrasado ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
          {followUpAtrasado ? '⚠️ Atrasado · ' : ''}
          {formatarDataHora(proximoFollowUp.data_hora)}
        </p>
      )}

      {lead.instagram && (
        <a
          href={`https://instagram.com/${lead.instagram.replace('@', '')}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="flex items-center gap-1 text-xs text-pink-500 hover:text-pink-600 mt-2 transition-colors"
        >
          <span className="font-bold text-xs leading-none">@</span>
          <span className="truncate">{lead.instagram.replace('@', '')}</span>
        </a>
      )}

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
        <span className="text-xs text-slate-400">{lead.cidade ?? lead.estado}</span>
        {responsavel && (
          <span
            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold ${responsavel.cor}`}
            title={responsavel.nome}
          >
            {responsavel.iniciais}
          </span>
        )}
      </div>
    </div>
  )
}
