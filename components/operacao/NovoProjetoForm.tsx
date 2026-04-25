'use client'

import { useState } from 'react'
import { Projeto, TipoProjeto, PrioridadeProjeto } from '@/lib/operacao/types'
import { TIPO_PROJETO_LABELS, PRIORIDADE_CONFIG } from '@/lib/operacao/constants'
import { USUARIOS } from '@/lib/crm/constants'
import { useClientesStore } from '@/lib/clientes/store'
import { X } from 'lucide-react'

interface Props {
  onSave: (projeto: Omit<Projeto, 'id' | 'criado_em' | 'atualizado_em'>) => void
  onCancel: () => void
}

export function NovoProjetoForm({ onSave, onCancel }: Props) {
  const { clientes } = useClientesStore()
  const hoje = new Date().toISOString().slice(0, 10)

  const [form, setForm] = useState({
    cliente_id: '',
    nome: '',
    descricao: '',
    tipo: 'campanha' as TipoProjeto,
    prioridade: 'normal' as PrioridadeProjeto,
    responsavel_id: USUARIOS[0].id,
    equipe_ids: [USUARIOS[0].id],
    data_inicio: hoje,
    data_entrega_prevista: '',
    tags: '',
  })

  function set(field: string, value: string | string[]) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function toggleMembro(id: string) {
    setForm(f => ({
      ...f,
      equipe_ids: f.equipe_ids.includes(id)
        ? f.equipe_ids.filter(e => e !== id)
        : [...f.equipe_ids, id],
    }))
  }

  function handleSave() {
    if (!form.nome || !form.cliente_id || !form.data_entrega_prevista) return
    onSave({
      cliente_id: form.cliente_id,
      nome: form.nome,
      descricao: form.descricao || undefined,
      tipo: form.tipo,
      status: 'planejamento',
      prioridade: form.prioridade,
      responsavel_id: form.responsavel_id,
      equipe_ids: form.equipe_ids.length > 0 ? form.equipe_ids : [form.responsavel_id],
      data_inicio: form.data_inicio,
      data_entrega_prevista: form.data_entrega_prevista,
      progresso: 0,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    })
  }

  const valido = form.nome.trim() && form.cliente_id && form.data_entrega_prevista

  const clientesAtivos = clientes.filter(c => c.status === 'ativo' || c.status === 'em_risco')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">

        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Novo Projeto</h2>
          <button onClick={onCancel} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          <div>
            <label className={lbl}>Cliente *</label>
            <select value={form.cliente_id} onChange={e => set('cliente_id', e.target.value)} className={inp}>
              <option value="">Selecione um cliente</option>
              {clientesAtivos.map(c => <option key={c.id} value={c.id}>{c.nome_empresa}</option>)}
            </select>
          </div>

          <div>
            <label className={lbl}>Nome do projeto *</label>
            <input value={form.nome} onChange={e => set('nome', e.target.value)}
              placeholder="Ex: Campanha Lançamento Q2 — Cliente X" className={inp} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Tipo *</label>
              <select value={form.tipo} onChange={e => set('tipo', e.target.value)} className={inp}>
                {Object.entries(TIPO_PROJETO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Prioridade *</label>
              <select value={form.prioridade} onChange={e => set('prioridade', e.target.value)} className={inp}>
                {Object.entries(PRIORIDADE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Data de início *</label>
              <input type="date" value={form.data_inicio} onChange={e => set('data_inicio', e.target.value)} className={inp} />
            </div>
            <div>
              <label className={lbl}>Entrega prevista *</label>
              <input type="date" value={form.data_entrega_prevista} onChange={e => set('data_entrega_prevista', e.target.value)} className={inp} />
            </div>
          </div>

          <div>
            <label className={lbl}>Gestor responsável *</label>
            <select value={form.responsavel_id} onChange={e => set('responsavel_id', e.target.value)} className={inp}>
              {USUARIOS.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
            </select>
          </div>

          <div>
            <label className={lbl}>Equipe</label>
            <div className="flex gap-2 mt-1">
              {USUARIOS.map(u => (
                <button key={u.id} type="button"
                  onClick={() => toggleMembro(u.id)}
                  className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    form.equipe_ids.includes(u.id)
                      ? `${u.cor} text-white border-transparent`
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}>
                  {u.nome.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={lbl}>Descrição</label>
            <textarea value={form.descricao} onChange={e => set('descricao', e.target.value)}
              rows={3} placeholder="Objetivo, escopo e contexto do projeto..."
              className={`${inp} resize-none`} />
          </div>

          <div>
            <label className={lbl}>Tags (separadas por vírgula)</label>
            <input value={form.tags} onChange={e => set('tags', e.target.value)}
              placeholder="Ex: tráfego-pago, b2b, google-ads" className={inp} />
          </div>

        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <button onClick={handleSave} disabled={!valido}
            className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            Criar projeto
          </button>
          <button onClick={onCancel} className="px-6 py-2.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

const inp = 'w-full text-sm text-slate-900 border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'
const lbl = 'text-xs text-slate-500 mb-1 block'
