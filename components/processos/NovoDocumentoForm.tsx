'use client'

import { useState } from 'react'
import { Documento, CategoriaDoc, StatusDoc, TipoSecao } from '@/lib/processos/types'
import { CATEGORIA_DOC_CONFIG } from '@/lib/processos/constants'
import { USUARIOS } from '@/lib/crm/constants'
import { X, Plus, Trash2 } from 'lucide-react'

interface Props {
  onSave: (doc: Omit<Documento, 'id' | 'criado_em' | 'atualizado_em'>) => void
  onCancel: () => void
}

interface SecaoForm {
  id: string
  tipo: TipoSecao
  titulo: string
  texto: string
  itens: string
}

const TIPO_SECAO_LABELS: Record<TipoSecao, string> = {
  intro:     'Introdução (parágrafo)',
  secao:     'Título de seção',
  passo:     'Passo numerado (com sub-itens)',
  checklist: 'Checklist interativo',
  lista:     'Lista de bullets',
  destaque:  'Caixa de destaque',
  aviso:     'Caixa de aviso',
}

export function NovoDocumentoForm({ onSave, onCancel }: Props) {
  const [titulo, setTitulo] = useState('')
  const [categoria, setCategoria] = useState<CategoriaDoc>('sop')
  const [descricao, setDescricao] = useState('')
  const [tags, setTags] = useState('')
  const [responsavel_id, setResponsavelId] = useState(USUARIOS[0].id)
  const [versao, setVersao] = useState('1.0')
  const [secoes, setSecoes] = useState<SecaoForm[]>([
    { id: crypto.randomUUID(), tipo: 'intro', titulo: '', texto: '', itens: '' },
  ])

  function addSecao() {
    setSecoes(s => [...s, { id: crypto.randomUUID(), tipo: 'lista', titulo: '', texto: '', itens: '' }])
  }

  function removeSecao(id: string) {
    setSecoes(s => s.filter(sec => sec.id !== id))
  }

  function updateSecao(id: string, field: keyof SecaoForm, value: string) {
    setSecoes(s => s.map(sec => sec.id === id ? { ...sec, [field]: value } : sec))
  }

  function handleSave() {
    if (!titulo.trim()) return
    onSave({
      titulo: titulo.trim(),
      categoria,
      descricao: descricao.trim(),
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      responsavel_id,
      status: 'ativo',
      versao,
      conteudo: secoes
        .filter(s => s.texto.trim() || s.itens.trim() || s.titulo.trim())
        .map(s => ({
          id: s.id,
          tipo: s.tipo,
          titulo: s.titulo.trim() || undefined,
          texto: s.texto.trim() || undefined,
          itens: s.itens.trim()
            ? s.itens.split('\n').map(l => l.replace(/^[-•]\s*/, '').trim()).filter(Boolean)
            : undefined,
          corDestaque: s.tipo === 'destaque' ? 'blue' : undefined,
        })),
    })
  }

  const valido = titulo.trim().length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">

        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Novo Documento</h2>
          <button onClick={onCancel} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Metadados */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Informações gerais</p>

            <div>
              <label className={lbl}>Título *</label>
              <input value={titulo} onChange={e => setTitulo(e.target.value)}
                placeholder="Ex: SOP de Publicação de Conteúdo" className={inp} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Categoria *</label>
                <select value={categoria} onChange={e => setCategoria(e.target.value as CategoriaDoc)} className={inp}>
                  {(Object.keys(CATEGORIA_DOC_CONFIG) as CategoriaDoc[]).map(cat => (
                    <option key={cat} value={cat}>
                      {CATEGORIA_DOC_CONFIG[cat].icone} {CATEGORIA_DOC_CONFIG[cat].label} — {CATEGORIA_DOC_CONFIG[cat].descricao}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={lbl}>Responsável</label>
                <select value={responsavel_id} onChange={e => setResponsavelId(e.target.value)} className={inp}>
                  {USUARIOS.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className={lbl}>Descrição</label>
              <textarea value={descricao} onChange={e => setDescricao(e.target.value)}
                rows={2} placeholder="Para que serve este documento e quando usar"
                className={`${inp} resize-none`} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Tags (separadas por vírgula)</label>
                <input value={tags} onChange={e => setTags(e.target.value)}
                  placeholder="Ex: onboarding, cliente, setup" className={inp} />
              </div>
              <div>
                <label className={lbl}>Versão</label>
                <input value={versao} onChange={e => setVersao(e.target.value)}
                  placeholder="1.0" className={inp} />
              </div>
            </div>
          </div>

          {/* Seções de conteúdo */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Conteúdo</p>
              <button onClick={addSecao}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                <Plus size={13} /> Adicionar seção
              </button>
            </div>

            {secoes.map((secao, idx) => (
              <div key={secao.id} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-500">Seção {idx + 1}</p>
                  {secoes.length > 1 && (
                    <button onClick={() => removeSecao(secao.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Tipo de seção</label>
                    <select value={secao.tipo} onChange={e => updateSecao(secao.id, 'tipo', e.target.value)} className={inp}>
                      {(Object.keys(TIPO_SECAO_LABELS) as TipoSecao[]).map(t => (
                        <option key={t} value={t}>{TIPO_SECAO_LABELS[t]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>Título da seção (opcional)</label>
                    <input value={secao.titulo} onChange={e => updateSecao(secao.id, 'titulo', e.target.value)}
                      placeholder="Ex: Fase 1 — Preparação" className={inp} />
                  </div>
                </div>

                {['intro', 'secao', 'destaque', 'aviso'].includes(secao.tipo) && (
                  <div>
                    <label className={lbl}>Texto</label>
                    <textarea value={secao.texto} onChange={e => updateSecao(secao.id, 'texto', e.target.value)}
                      rows={3} placeholder="Escreva o conteúdo desta seção..."
                      className={`${inp} resize-none`} />
                  </div>
                )}

                {['passo', 'checklist', 'lista'].includes(secao.tipo) && (
                  <div>
                    <label className={lbl}>
                      Itens (um por linha{secao.tipo === 'checklist' ? ' — serão checkáveis' : ''})
                    </label>
                    <textarea value={secao.itens} onChange={e => updateSecao(secao.id, 'itens', e.target.value)}
                      rows={4} placeholder={'Item 1\nItem 2\nItem 3'}
                      className={`${inp} resize-none font-mono text-xs`} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <button onClick={handleSave} disabled={!valido}
            className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            Criar documento
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
const lbl = 'text-xs text-slate-500 mb-1 block'
