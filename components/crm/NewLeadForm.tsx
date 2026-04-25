'use client'

import { useState } from 'react'
import { Lead, Cargo, Fonte, Segmento, Porte, FunnelStage } from '@/lib/crm/types'
import { CARGO_LABELS, FONTE_LABELS, SEGMENTO_LABELS, PORTE_LABELS, STAGE_CONFIG, STAGE_ORDER, USUARIOS } from '@/lib/crm/constants'
import { calcularScorePerfil } from '@/lib/crm/score'
import { X } from 'lucide-react'

interface Props {
  initialStage?: FunnelStage
  onSave: (lead: Omit<Lead, 'id' | 'criado_em' | 'atualizado_em'>) => void
  onCancel: () => void
}

export function NewLeadForm({ initialStage = 'lead_captado', onSave, onCancel }: Props) {
  const [form, setForm] = useState({
    nome_empresa: '',
    nome_contato: '',
    cargo_contato: 'gerente' as Cargo,
    email: '',
    telefone: '',
    whatsapp: '',
    cnpj: '',
    site: '',
    segmento: 'servicos' as Segmento,
    porte: 'pequena' as Porte,
    cidade: '',
    estado: '',
    fonte: 'instagram' as Fonte,
    fonte_detalhe: '',
    responsavel_id: USUARIOS[0].id,
    status: initialStage,
    valor_estimado: '',
    data_fechamento_estimada: '',
    observacoes: '',
    score_engajamento: 0,
    score_timing: 5,
  })

  function set(field: string, value: string | number) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handleSave() {
    if (!form.nome_empresa || !form.nome_contato || !form.whatsapp) return
    const score_perfil = calcularScorePerfil({
      porte: form.porte,
      cargo_contato: form.cargo_contato,
      site: form.site || undefined,
      cnpj: form.cnpj || undefined,
    })
    onSave({
      ...form,
      cnpj: form.cnpj || undefined,
      site: form.site || undefined,
      cidade: form.cidade || undefined,
      estado: form.estado || undefined,
      fonte_detalhe: form.fonte_detalhe || undefined,
      valor_estimado: form.valor_estimado ? parseFloat(form.valor_estimado) : undefined,
      data_fechamento_estimada: form.data_fechamento_estimada || undefined,
      observacoes: form.observacoes || undefined,
      score_perfil,
      score_engajamento: form.score_engajamento,
      score_timing: form.score_timing,
      score_total: 0,
      probabilidade: STAGE_CONFIG[form.status].probabilidade,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Novo Lead</h2>
          <button onClick={onCancel} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Empresa */}
          <Section title="Empresa">
            <Field label="Nome da empresa *">
              <input value={form.nome_empresa} onChange={(e) => set('nome_empresa', e.target.value)} placeholder="Ex: TechSoluções Ltda" className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Segmento *">
                <select value={form.segmento} onChange={(e) => set('segmento', e.target.value)} className={inputCls}>
                  {Object.entries(SEGMENTO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </Field>
              <Field label="Porte *">
                <select value={form.porte} onChange={(e) => set('porte', e.target.value)} className={inputCls}>
                  {Object.entries(PORTE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="CNPJ"><input value={form.cnpj} onChange={(e) => set('cnpj', e.target.value)} placeholder="00.000.000/0001-00" className={inputCls} /></Field>
              <Field label="Site"><input value={form.site} onChange={(e) => set('site', e.target.value)} placeholder="empresa.com.br" className={inputCls} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Cidade"><input value={form.cidade} onChange={(e) => set('cidade', e.target.value)} placeholder="São Paulo" className={inputCls} /></Field>
              <Field label="Estado"><input value={form.estado} onChange={(e) => set('estado', e.target.value)} placeholder="SP" maxLength={2} className={inputCls} /></Field>
            </div>
          </Section>

          {/* Contato */}
          <Section title="Contato">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nome do contato *"><input value={form.nome_contato} onChange={(e) => set('nome_contato', e.target.value)} placeholder="João Silva" className={inputCls} /></Field>
              <Field label="Cargo *">
                <select value={form.cargo_contato} onChange={(e) => set('cargo_contato', e.target.value)} className={inputCls}>
                  {Object.entries(CARGO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="WhatsApp *"><input value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} placeholder="(11) 99999-9999" className={inputCls} /></Field>
              <Field label="Telefone"><input value={form.telefone} onChange={(e) => set('telefone', e.target.value)} placeholder="(11) 3333-4444" className={inputCls} /></Field>
            </div>
            <Field label="E-mail"><input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="joao@empresa.com.br" className={inputCls} /></Field>
          </Section>

          {/* Comercial */}
          <Section title="Informações comerciais">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Fonte *">
                <select value={form.fonte} onChange={(e) => set('fonte', e.target.value)} className={inputCls}>
                  {Object.entries(FONTE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </Field>
              <Field label="Detalhe da fonte"><input value={form.fonte_detalhe} onChange={(e) => set('fonte_detalhe', e.target.value)} placeholder="Ex: Indicado por..." className={inputCls} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Responsável *">
                <select value={form.responsavel_id} onChange={(e) => set('responsavel_id', e.target.value)} className={inputCls}>
                  {USUARIOS.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
                </select>
              </Field>
              <Field label="Estágio inicial">
                <select value={form.status} onChange={(e) => set('status', e.target.value)} className={inputCls}>
                  {STAGE_ORDER.filter(s => s !== 'fechado' && s !== 'perdido').map((s) => (
                    <option key={s} value={s}>{STAGE_CONFIG[s].label}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Valor estimado (R$/mês)"><input type="number" value={form.valor_estimado} onChange={(e) => set('valor_estimado', e.target.value)} placeholder="Ex: 8000" className={inputCls} /></Field>
              <Field label="Fechamento previsto"><input type="date" value={form.data_fechamento_estimada} onChange={(e) => set('data_fechamento_estimada', e.target.value)} className={inputCls} /></Field>
            </div>
            <Field label="Observações">
              <textarea value={form.observacoes} onChange={(e) => set('observacoes', e.target.value)} rows={3} placeholder="Contexto, dores identificadas, informações relevantes..." className={`${inputCls} resize-none`} />
            </Field>
          </Section>

          {/* Score inicial */}
          <Section title="Score inicial">
            <div className="grid grid-cols-2 gap-3">
              <Field label={`Engajamento: ${form.score_engajamento}/40`}>
                <input type="range" min={0} max={40} value={form.score_engajamento} onChange={(e) => set('score_engajamento', parseInt(e.target.value))} className="w-full accent-blue-600" />
              </Field>
              <Field label={`Timing: ${form.score_timing}/20`}>
                <input type="range" min={0} max={20} value={form.score_timing} onChange={(e) => set('score_timing', parseInt(e.target.value))} className="w-full accent-blue-600" />
              </Field>
            </div>
            <p className="text-xs text-slate-400">O score de perfil é calculado automaticamente com base no cargo e porte.</p>
          </Section>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <button
            onClick={handleSave}
            disabled={!form.nome_empresa || !form.nome_contato || !form.whatsapp}
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{title}</p>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-slate-500 mb-1 block">{label}</label>
      {children}
    </div>
  )
}
