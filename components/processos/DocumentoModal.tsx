'use client'

import { useState } from 'react'
import { Documento, SecaoConteudo } from '@/lib/processos/types'
import { CATEGORIA_DOC_CONFIG, STATUS_DOC_CONFIG } from '@/lib/processos/constants'
import { useProcessosStore } from '@/lib/processos/store'
import { USUARIOS } from '@/lib/crm/constants'
import { formatarData } from '@/lib/crm/score'
import {
  X, ChevronDown, CheckSquare, Square, Copy, Check,
  RefreshCw, Archive, Edit3, Save,
} from 'lucide-react'

interface Props {
  documento: Documento
  onClose: () => void
}

export function DocumentoModal({ documento, onClose }: Props) {
  const { updateStatus, arquivar } = useProcessosStore()
  const [showMenu, setShowMenu] = useState(false)
  const [copiado, setCopiado] = useState(false)
  // State interativo para checklists
  const [checkState, setCheckState] = useState<Record<string, boolean>>({})

  const catConfig = CATEGORIA_DOC_CONFIG[documento.categoria]
  const statusConfig = STATUS_DOC_CONFIG[documento.status]
  const responsavel = USUARIOS.find((u) => u.id === documento.responsavel_id)

  const isChecklist = documento.categoria === 'checklist'
  const totalItens = documento.conteudo.flatMap((s) => s.itens ?? []).length
  const marcados = Object.values(checkState).filter(Boolean).length
  const progresso = totalItens > 0 ? Math.round((marcados / totalItens) * 100) : 0

  function toggleItem(secaoId: string, idx: number) {
    const key = `${secaoId}-${idx}`
    setCheckState((s) => ({ ...s, [key]: !s[key] }))
  }

  function resetChecklist() {
    setCheckState({})
  }

  async function copiarConteudo() {
    const texto = documento.conteudo
      .map((s) => {
        const linhas = []
        if (s.titulo) linhas.push(`## ${s.titulo}`)
        if (s.texto) linhas.push(s.texto)
        if (s.itens) s.itens.forEach((item) => linhas.push(`- ${item}`))
        return linhas.join('\n')
      })
      .join('\n\n')
    await navigator.clipboard.writeText(`# ${documento.titulo}\n\n${texto}`)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${catConfig.corBg} ${catConfig.cor} ${catConfig.corBorda}`}>
                  {catConfig.icone} {catConfig.label}
                </span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusConfig.corBg} ${statusConfig.cor}`}>
                  {statusConfig.label}
                </span>
                <span className="text-xs text-slate-400">v{documento.versao}</span>
              </div>
              <h2 className="text-xl font-bold text-slate-800 leading-tight">{documento.titulo}</h2>
              <p className="text-sm text-slate-500 mt-1">{documento.descricao}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                {responsavel && <span>por {responsavel.nome}</span>}
                <span>·</span>
                <span>Atualizado {formatarData(documento.atualizado_em)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-none">
              <button onClick={copiarConteudo}
                className="flex items-center gap-1.5 text-xs border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                {copiado ? <><Check size={13} className="text-emerald-600" /> Copiado</> : <><Copy size={13} /> Copiar</>}
              </button>
              {isChecklist && marcados > 0 && (
                <button onClick={resetChecklist}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                  <RefreshCw size={12} /> Reiniciar
                </button>
              )}
              <div className="relative">
                <button onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center gap-1 text-xs border border-slate-200 text-slate-500 px-2.5 py-1.5 rounded-lg hover:bg-slate-50">
                  <ChevronDown size={13} />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-10 w-44">
                    <button onClick={() => { updateStatus(documento.id, 'desatualizado'); setShowMenu(false) }}
                      className="w-full text-left px-3 py-2 text-xs text-amber-600 hover:bg-amber-50">
                      ⚠️ Marcar como desatualizado
                    </button>
                    <button onClick={() => { updateStatus(documento.id, 'ativo'); setShowMenu(false) }}
                      className="w-full text-left px-3 py-2 text-xs text-emerald-600 hover:bg-emerald-50">
                      ✅ Marcar como ativo
                    </button>
                    <button onClick={() => { arquivar(documento.id); onClose(); }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-500 hover:bg-slate-50">
                      <span className="flex items-center gap-1.5"><Archive size={12} /> Arquivar</span>
                    </button>
                  </div>
                )}
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Progresso do checklist */}
          {isChecklist && totalItens > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-500">{marcados} de {totalItens} itens concluídos</span>
                <span className={`font-bold ${progresso === 100 ? 'text-emerald-600' : 'text-slate-700'}`}>{progresso}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${progresso === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                  style={{ width: `${progresso}%` }} />
              </div>
              {progresso === 100 && (
                <p className="text-xs text-emerald-600 font-semibold mt-1.5 text-center">✅ Checklist completo!</p>
              )}
            </div>
          )}

          {/* Tags */}
          {documento.tags.length > 0 && (
            <div className="flex gap-1.5 mt-3 flex-wrap">
              {documento.tags.map((t) => (
                <span key={t} className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">#{t}</span>
              ))}
            </div>
          )}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {documento.conteudo.map((secao) => (
            <SecaoRender key={secao.id} secao={secao} checkState={checkState} onToggle={(idx) => toggleItem(secao.id, idx)} />
          ))}
        </div>
      </div>
    </div>
  )
}

function SecaoRender({ secao, checkState, onToggle }: {
  secao: SecaoConteudo
  checkState: Record<string, boolean>
  onToggle: (idx: number) => void
}) {
  if (secao.tipo === 'intro') {
    return <p className="text-sm text-slate-600 leading-relaxed">{secao.texto}</p>
  }

  if (secao.tipo === 'secao') {
    return (
      <div className="pt-2">
        <h3 className="text-sm font-bold text-slate-800 mb-1">{secao.titulo}</h3>
        {secao.texto && <p className="text-xs text-slate-500">{secao.texto}</p>}
      </div>
    )
  }

  if (secao.tipo === 'passo') {
    return (
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
        <p className="text-sm font-bold text-slate-800 mb-2">{secao.titulo}</p>
        {secao.itens && (
          <ul className="space-y-1.5">
            {secao.itens.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="text-blue-400 mt-0.5 flex-none">→</span>
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  if (secao.tipo === 'checklist') {
    return (
      <div>
        {secao.titulo && <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{secao.titulo}</p>}
        <div className="space-y-1.5">
          {secao.itens?.map((item, i) => {
            const key = `${secao.id}-${i}`
            const marcado = checkState[key] ?? false
            return (
              <button key={i} onClick={() => onToggle(i)}
                className={`w-full flex items-start gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-all ${
                  marcado ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}>
                {marcado
                  ? <CheckSquare size={16} className="text-emerald-600 mt-0.5 flex-none" />
                  : <Square size={16} className="text-slate-300 mt-0.5 flex-none" />
                }
                <span className={`text-sm ${marcado ? 'line-through text-slate-400' : 'text-slate-700'}`}>{item}</span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  if (secao.tipo === 'lista') {
    return (
      <div>
        {secao.titulo && <p className="text-sm font-bold text-slate-700 mb-2">{secao.titulo}</p>}
        <ul className="space-y-1.5">
          {secao.itens?.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 flex-none" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  if (secao.tipo === 'destaque') {
    const cores = {
      blue:    'bg-blue-50 border-blue-200 text-blue-800',
      amber:   'bg-amber-50 border-amber-200 text-amber-800',
      red:     'bg-red-50 border-red-200 text-red-800',
      emerald: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    }
    const cor = cores[secao.corDestaque ?? 'blue']
    return (
      <div className={`rounded-xl border p-4 ${cor}`}>
        {secao.titulo && <p className="text-xs font-bold mb-1 uppercase tracking-wide">{secao.titulo}</p>}
        <p className="text-sm leading-relaxed">{secao.texto}</p>
      </div>
    )
  }

  if (secao.tipo === 'aviso') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        {secao.titulo && <p className="text-xs font-bold text-red-700 mb-1 uppercase tracking-wide">⚠️ {secao.titulo}</p>}
        <p className="text-sm text-red-700">{secao.texto}</p>
      </div>
    )
  }

  return null
}
