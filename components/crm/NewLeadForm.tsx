'use client'

import { useState } from 'react'
import { Lead, Cargo, Fonte, Segmento, Porte, FunnelStage } from '@/lib/crm/types'
import { FONTE_LABELS, SEGMENTO_LABELS, STAGE_CONFIG, USUARIOS } from '@/lib/crm/constants'
import { calcularScorePerfil } from '@/lib/crm/score'
import { X } from 'lucide-react'

interface Props {
  initialStage?: FunnelStage
  onSave: (lead: Omit<Lead, 'id' | 'criado_em' | 'atualizado_em'>) => void
  onCancel: () => void
}

const STATUS_OPCOES: FunnelStage[] = [
  'lead_captado',
  'lead_qualificado',
  'abordagem_enviada',
  'conversa_iniciada',
  'sem_retorno',
  'follow_up',
  'reuniao_marcada',
  'proposta_enviada',
  'fechado',
  'perdido',
]

export function NewLeadForm({ initialStage = 'lead_captado', onSave, onCancel }: Props) {
  const hoje = new Date().toISOString().slice(0, 10)

  const [form, setForm] = useState({
    nome_empresa: '',
    instagram: '',
    whatsapp: '',
    cidade: '',
    segmento: 'servicos' as Segmento,
    fonte: 'instagram' as Fonte,
    data_primeiro_contato: hoje,
    status: initialStage,
    quantidade_followup: 0,
    observacoes: '',
    // campos complementares com defaults
    nome_contato: '',
    cargo_contato: 'outro' as Cargo,
    email: '',
    telefone: '',
    porte: 'pequena' as Porte,
    estado: '',
    responsavel_id: USUARIOS[0].id,
    fonte_detalhe: '',
    valor_estimado: '',
    data_fechamento_estimada: '',
    score_engajamento: 0,
    score_timing: 5,
  })

  function set(field: string, value: string | number) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  const obrigatoriosFaltando =
    !form.nome_empresa ||
    !form.instagram ||
    !form.whatsapp ||
    !form.cidade ||
    !form.data_primeiro_contato

  function handleSave() {
    if (obrigatoriosFaltando) return
    const score_perfil = calcularScorePerfil({
      porte: form.porte,
      cargo_contato: form.cargo_contato,
      site: undefined,
      cnpj: undefined,
    })
    onSave({
      ...form,
      nome_contato: form.nome_contato || form.nome_empresa,
      instagram: form.instagram || undefined,
      cidade: form.cidade || undefined,
      estado: form.estado || undefined,
      fonte_detalhe: form.fonte_detalhe || undefined,
      valor_estimado: form.valor_estimado ? parseFloat(form.valor_estimado) : undefined,
      data_fechamento_estimada: form.data_fechamento_estimada || undefined,
      observacoes: form.observacoes || undefined,
      data_primeiro_contato: form.data_primeiro_contato || undefined,
      quantidade_followup: form.quantidade_followup,
      score_perfil,
      score_engajamento: form.score_engajamento,
      score_timing: form.score_timing,
      score_total: 0,
      probabilidade: STAGE_CONFIG[form.status].probabilidade,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Novo Lead</h2>
          <button onClick={onCancel} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* Nome */}
          <Field label="Nome *">
            <input
              value={form.nome_empresa}
              onChange={(e) => set('nome_empresa', e.target.value)}
              placeholder="Nome do lead ou empresa"
              className={inputCls}
            />
          </Field>

          {/* Instagram + WhatsApp */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Instagram *">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">@</span>
                <input
                  value={form.instagram}
                  onChange={(e) => set('instagram', e.target.value.replace('@', ''))}
                  placeholder="perfil"
                  className={`${inputCls} pl-7`}
                />
              </div>
            </Field>
            <Field label="WhatsApp *">
              <input
                value={form.whatsapp}
                onChange={(e) => set('whatsapp', e.target.value)}
                placeholder="(11) 99999-9999"
                className={inputCls}
              />
            </Field>
          </div>

          {/* Cidade + Nicho */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cidade *">
              <input
                value={form.cidade}
                onChange={(e) => set('cidade', e.target.value)}
                placeholder="São Paulo"
                className={inputCls}
              />
            </Field>
            <Field label="Nicho *">
              <select value={form.segmento} onChange={(e) => set('segmento', e.target.value)} className={inputCls}>
                {Object.entries(SEGMENTO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
          </div>

          {/* Origem + Data primeiro contato */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Origem do Lead *">
              <select value={form.fonte} onChange={(e) => set('fonte', e.target.value)} className={inputCls}>
                {Object.entries(FONTE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <Field label="Data do 1º Contato *">
              <input
                type="date"
                value={form.data_primeiro_contato}
                onChange={(e) => set('data_primeiro_contato', e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

          {/* Status + Qtd Follow Up */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Status *">
              <select value={form.status} onChange={(e) => set('status', e.target.value)} className={inputCls}>
                {STATUS_OPCOES.map((s) => (
                  <option key={s} value={s}>{STAGE_CONFIG[s].label}</option>
                ))}
              </select>
            </Field>
            <Field label="Qtd. de Follow Up">
              <input
                type="number"
                min={0}
                value={form.quantidade_followup}
                onChange={(e) => set('quantidade_followup', Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="0"
                className={inputCls}
              />
            </Field>
          </div>

          {/* Observações */}
          <Field label="Observações">
            <textarea
              value={form.observacoes}
              onChange={(e) => set('observacoes', e.target.value)}
              rows={3}
              placeholder="Contexto, dores identificadas, informações relevantes..."
              className={`${inputCls} resize-none`}
            />
          </Field>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <button
            onClick={handleSave}
            disabled={obrigatoriosFaltando}
            className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Criar lead
          </button>
          <button onClick={onCancel} className="px-6 py-2.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

const inputCls = 'w-full text-sm text-slate-900 border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-slate-500 mb-1 block">{label}</label>
      {children}
    </div>
  )
}
