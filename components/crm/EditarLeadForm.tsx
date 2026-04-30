'use client'

import { useState } from 'react'
import { Lead, FunnelStage, Cargo, Fonte, Segmento } from '@/lib/crm/types'
import { STAGE_CONFIG, CARGO_LABELS, FONTE_LABELS, SEGMENTO_LABELS, USUARIOS } from '@/lib/crm/constants'
import { calcularScorePerfil, calcularScoreTotal } from '@/lib/crm/score'
import { X } from 'lucide-react'

const STATUS_OPCOES: FunnelStage[] = [
  'identificado', 'abordado', 'em_conversa', 'qualificado',
  'proposta_enviada', 'negociando', 'fechado', 'sem_interesse', 'pausado',
]

interface Props {
  lead: Lead
  onSave: (data: Partial<Lead>) => void
  onCancel: () => void
}

export function EditarLeadForm({ lead, onSave, onCancel }: Props) {
  const [form, setForm] = useState({
    nome_empresa: lead.nome_empresa,
    instagram: lead.instagram ?? '',
    whatsapp: lead.whatsapp,
    cidade: lead.cidade ?? '',
    estado: lead.estado ?? '',
    segmento: lead.segmento as Segmento,
    fonte: lead.fonte as Fonte,
    fonte_detalhe: lead.fonte_detalhe ?? '',
    status: lead.status as FunnelStage,
    quantidade_followup: (lead as any).quantidade_followup ?? 0,
    observacoes: lead.observacoes ?? '',
    nome_contato: lead.nome_contato,
    cargo_contato: lead.cargo_contato as Cargo,
    email: lead.email,
    telefone: lead.telefone,
    responsavel_id: lead.responsavel_id,
    valor_estimado: lead.valor_estimado ? String(lead.valor_estimado) : '',
    data_fechamento_estimada: lead.data_fechamento_estimada ?? '',
    data_primeiro_contato: (lead as any).data_primeiro_contato ?? '',
    score_engajamento: lead.score_engajamento,
    score_timing: lead.score_timing,
  })

  function set(field: string, value: string | number) {
    setForm(f => ({ ...f, [field]: value }))
  }

  const valido = form.nome_empresa.trim() && form.whatsapp.trim()

  function handleSave() {
    if (!valido) return
    const score_perfil = calcularScorePerfil({
      cargo_contato: form.cargo_contato,
    })
    const score_total = calcularScoreTotal(score_perfil, form.score_engajamento, form.score_timing)
    onSave({
      nome_empresa: form.nome_empresa,
      instagram: form.instagram || undefined,
      whatsapp: form.whatsapp,
      cidade: form.cidade || undefined,
      estado: form.estado || undefined,
      segmento: form.segmento,
      fonte: form.fonte,
      fonte_detalhe: form.fonte_detalhe || undefined,
      status: form.status,
      observacoes: form.observacoes || undefined,
      nome_contato: form.nome_contato || form.nome_empresa,
      cargo_contato: form.cargo_contato,
      email: form.email,
      telefone: form.telefone,
      responsavel_id: form.responsavel_id,
      valor_estimado: form.valor_estimado ? parseFloat(form.valor_estimado) : undefined,
      data_fechamento_estimada: form.data_fechamento_estimada || undefined,
      probabilidade: STAGE_CONFIG[form.status].probabilidade,
      score_perfil,
      score_engajamento: form.score_engajamento,
      score_timing: form.score_timing,
      score_total,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden">

        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Editar Lead</h2>
            <p className="text-xs text-slate-400">{lead.nome_empresa}</p>
          </div>
          <button onClick={onCancel} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          <Field label="Nome *">
            <input value={form.nome_empresa} onChange={e => set('nome_empresa', e.target.value)}
              placeholder="Nome do lead ou empresa" className={inp} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Instagram">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">@</span>
                <input value={form.instagram}
                  onChange={e => set('instagram', e.target.value.replace('@', ''))}
                  placeholder="perfil" className={`${inp} pl-7`} />
              </div>
            </Field>
            <Field label="WhatsApp *">
              <input value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)}
                placeholder="(11) 99999-9999" className={inp} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Cidade">
              <input value={form.cidade} onChange={e => set('cidade', e.target.value)}
                placeholder="São Paulo" className={inp} />
            </Field>
            <Field label="Nicho">
              <select value={form.segmento} onChange={e => set('segmento', e.target.value)} className={inp}>
                {Object.entries(SEGMENTO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Origem">
              <select value={form.fonte} onChange={e => set('fonte', e.target.value)} className={inp}>
                {Object.entries(FONTE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={e => set('status', e.target.value as FunnelStage)} className={inp}>
                {STATUS_OPCOES.map(s => <option key={s} value={s}>{STAGE_CONFIG[s].label}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Responsável">
              <select value={form.responsavel_id} onChange={e => set('responsavel_id', e.target.value)} className={inp}>
                {USUARIOS.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
              </select>
            </Field>
            <Field label="Qtd. Follow Up">
              <input type="number" min={0} value={form.quantidade_followup}
                onChange={e => set('quantidade_followup', Math.max(0, parseInt(e.target.value) || 0))}
                className={inp} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Valor estimado (R$/mês)">
              <input type="number" value={form.valor_estimado}
                onChange={e => set('valor_estimado', e.target.value)}
                placeholder="Ex: 3000" className={inp} />
            </Field>
            <Field label="Data de fechamento">
              <input type="date" value={form.data_fechamento_estimada}
                onChange={e => set('data_fechamento_estimada', e.target.value)} className={inp} />
            </Field>
          </div>

          <Field label="Observações">
            <textarea value={form.observacoes} onChange={e => set('observacoes', e.target.value)}
              rows={3} placeholder="Contexto, dores identificadas..." className={`${inp} resize-none`} />
          </Field>

        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <button onClick={handleSave} disabled={!valido}
            className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-40">
            Salvar alterações
          </button>
          <button onClick={onCancel}
            className="px-6 py-2.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

const inp = 'w-full text-sm text-slate-900 border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-slate-500 mb-1 block">{label}</label>
      {children}
    </div>
  )
}
