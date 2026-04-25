'use client'

import { useState } from 'react'
import { Lancamento, TipoLancamento, CategoriaReceita, CategoriaCusto } from '@/lib/financeiro/types'
import { CATEGORIA_RECEITA_LABELS, CATEGORIA_CUSTO_LABELS } from '@/lib/financeiro/constants'
import { useClientesStore } from '@/lib/clientes/store'
import { X } from 'lucide-react'

interface Props {
  tipoInicial?: TipoLancamento
  competenciaInicial?: string
  onSave: (data: Omit<Lancamento, 'id' | 'criado_em'>) => void
  onCancel: () => void
}

export function NovoLancamentoForm({ tipoInicial = 'receita', competenciaInicial, onSave, onCancel }: Props) {
  const { clientes } = useClientesStore()
  const hoje = new Date().toISOString().slice(0, 10)
  const comp = competenciaInicial ?? new Date().toISOString().slice(0, 7)

  const [tipo, setTipo] = useState<TipoLancamento>(tipoInicial)
  const [descricao, setDescricao] = useState('')
  const [cliente_id, setClienteId] = useState('')
  const [categoria, setCategoria] = useState<string>(tipo === 'receita' ? 'mensalidade' : 'pessoal')
  const [valor, setValor] = useState('')
  const [competencia, setCompetencia] = useState(comp)
  const [data_vencimento, setDataVencimento] = useState(hoje)
  const [nota_fiscal, setNotaFiscal] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [recorrente, setRecorrente] = useState(false)
  const [marcarPago, setMarcarPago] = useState(false)

  const categoriasDisponiveis = tipo === 'receita'
    ? CATEGORIA_RECEITA_LABELS
    : CATEGORIA_CUSTO_LABELS

  function handleSave() {
    if (!descricao || !valor || !data_vencimento) return
    onSave({
      tipo,
      descricao,
      cliente_id: tipo === 'receita' ? cliente_id || undefined : undefined,
      categoria: categoria as CategoriaReceita | CategoriaCusto,
      valor: parseFloat(valor.replace(',', '.')),
      competencia,
      data_vencimento,
      data_pagamento: marcarPago ? hoje : undefined,
      status: marcarPago ? 'pago' : 'previsto',
      nota_fiscal: nota_fiscal || undefined,
      observacoes: observacoes || undefined,
      recorrente,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Novo lançamento</h2>
          <button onClick={onCancel} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Tipo */}
          <div className="flex rounded-xl overflow-hidden border border-slate-200">
            <button onClick={() => { setTipo('receita'); setCategoria('mensalidade') }}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${tipo === 'receita' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
              ↑ Receita
            </button>
            <button onClick={() => { setTipo('custo'); setCategoria('pessoal') }}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${tipo === 'custo' ? 'bg-red-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
              ↓ Custo
            </button>
          </div>

          <Field label="Descrição *">
            <input value={descricao} onChange={(e) => setDescricao(e.target.value)}
              placeholder={tipo === 'receita' ? 'Ex: Mensalidade Studio K — Maio/2026' : 'Ex: Folha de pagamento — Maio/2026'}
              className={inputCls} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Categoria *">
              <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className={inputCls}>
                {Object.entries(categoriasDisponiveis).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            {tipo === 'receita' && (
              <Field label="Cliente">
                <select value={cliente_id} onChange={(e) => setClienteId(e.target.value)} className={inputCls}>
                  <option value="">Sem cliente específico</option>
                  {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome_empresa}</option>)}
                </select>
              </Field>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Valor (R$) *">
              <input type="number" value={valor} onChange={(e) => setValor(e.target.value)}
                placeholder="0,00" className={inputCls} />
            </Field>
            <Field label="Competência">
              <input type="month" value={competencia} onChange={(e) => setCompetencia(e.target.value)} className={inputCls} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Data de vencimento *">
              <input type="date" value={data_vencimento} onChange={(e) => setDataVencimento(e.target.value)} className={inputCls} />
            </Field>
            {tipo === 'receita' && (
              <Field label="Número da NF">
                <input value={nota_fiscal} onChange={(e) => setNotaFiscal(e.target.value)}
                  placeholder="NF-00250" className={inputCls} />
              </Field>
            )}
          </div>

          <Field label="Observações">
            <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)}
              rows={2} placeholder="Informações adicionais..." className={`${inputCls} resize-none`} />
          </Field>

          {/* Opções */}
          <div className="flex gap-4 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={recorrente} onChange={(e) => setRecorrente(e.target.checked)}
                className="w-4 h-4 accent-blue-600 rounded" />
              <span className="text-sm text-slate-600">Recorrente (contrato)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={marcarPago} onChange={(e) => setMarcarPago(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded" />
              <span className="text-sm text-slate-600">Já foi pago/recebido</span>
            </label>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <button onClick={handleSave}
            disabled={!descricao || !valor || !data_vencimento}
            className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-40 ${
              tipo === 'receita' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'
            }`}>
            Registrar {tipo === 'receita' ? 'receita' : 'custo'}
          </button>
          <button onClick={onCancel} className="px-5 py-2.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 text-sm">
            Cancelar
          </button>
        </div>
      </div>
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

const inputCls = 'w-full text-sm text-slate-900 border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'
