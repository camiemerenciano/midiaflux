'use client'

import { useState, useMemo } from 'react'
import { useProcessosStore } from '@/lib/processos/store'
import { Documento, CategoriaDoc, StatusDoc } from '@/lib/processos/types'
import { CATEGORIA_DOC_CONFIG, STATUS_DOC_CONFIG } from '@/lib/processos/constants'
import { USUARIOS } from '@/lib/crm/constants'
import { formatarData } from '@/lib/crm/score'
import { DocumentoModal } from '@/components/processos/DocumentoModal'
import { NovoDocumentoForm } from '@/components/processos/NovoDocumentoForm'
import {
  Search, Plus, Clock, CheckSquare, FileText, Tag,
} from 'lucide-react'

type FiltroCategoria = CategoriaDoc | 'todos'

const CATEGORIAS: FiltroCategoria[] = ['todos', 'sop', 'checklist', 'template', 'contrato', 'briefing']

export default function ProcessosPage() {
  const { documentos, addDocumento } = useProcessosStore()

  const [docSelecionado, setDocSelecionado] = useState<Documento | null>(null)
  const [showNovoDoc, setShowNovoDoc] = useState(false)
  const [filtroCategoria, setFiltroCategoria] = useState<FiltroCategoria>('todos')
  const [filtroStatus, setFiltroStatus] = useState<StatusDoc | 'todos'>('todos')
  const [busca, setBusca] = useState('')

  const docsVisiveis = useMemo(() => {
    return documentos.filter((d) => {
      if (d.status === 'arquivado' && filtroStatus !== 'arquivado') return false
      const matchCat = filtroCategoria === 'todos' || d.categoria === filtroCategoria
      const matchStatus = filtroStatus === 'todos' || d.status === filtroStatus
      const matchBusca = !busca ||
        d.titulo.toLowerCase().includes(busca.toLowerCase()) ||
        d.descricao.toLowerCase().includes(busca.toLowerCase()) ||
        d.tags.some(t => t.toLowerCase().includes(busca.toLowerCase()))
      return matchCat && matchStatus && matchBusca
    })
  }, [documentos, filtroCategoria, filtroStatus, busca])

  const contsPorCategoria = useMemo(() =>
    CATEGORIAS.reduce((acc, cat) => {
      acc[cat] = cat === 'todos'
        ? documentos.filter(d => d.status !== 'arquivado').length
        : documentos.filter(d => d.categoria === cat && d.status !== 'arquivado').length
      return acc
    }, {} as Record<FiltroCategoria, number>)
  , [documentos])

  const desatualizados = documentos.filter(d => d.status === 'desatualizado').length

  return (
    <div className="flex flex-col h-screen bg-slate-50">

      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex-none">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Processos & Documentos</h1>
            <p className="text-sm text-slate-500">{documentos.filter(d => d.status !== 'arquivado').length} documentos ativos · Padrões operacionais da agência</p>
          </div>
          <button
            onClick={() => setShowNovoDoc(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 font-semibold text-sm shadow-sm transition-colors">
            <Plus size={16} /> Novo Documento
          </button>
        </div>

        {desatualizados > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mb-4 flex items-center gap-2">
            <Clock size={14} className="text-amber-600" />
            <p className="text-sm text-amber-800">
              <strong>{desatualizados} documento{desatualizados > 1 ? 's' : ''}</strong> marcado{desatualizados > 1 ? 's' : ''} como desatualizado{desatualizados > 1 ? 's' : ''} — revise e atualize antes do próximo ciclo mensal.
            </p>
          </div>
        )}

        {/* Filtros de categoria */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <div className="flex bg-slate-100 rounded-xl p-1 gap-0.5">
            {CATEGORIAS.map((cat) => {
              const config = cat !== 'todos' ? CATEGORIA_DOC_CONFIG[cat] : null
              return (
                <button key={cat} onClick={() => setFiltroCategoria(cat)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    filtroCategoria === cat
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}>
                  {config?.icone && <span>{config.icone}</span>}
                  <span>{cat === 'todos' ? 'Todos' : config?.label}</span>
                  <span className={`text-xs rounded-full px-1.5 py-0.5 ${filtroCategoria === cat ? 'bg-slate-100 text-slate-600' : 'bg-slate-200 text-slate-500'}`}>
                    {contsPorCategoria[cat]}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Busca + status */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={busca} onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por título, descrição ou tag..."
              className="w-full pl-9 pr-3 py-2 text-sm text-slate-900 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value as typeof filtroStatus)}
            className="text-sm text-slate-900 border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="todos">Todos os status</option>
            {(Object.keys(STATUS_DOC_CONFIG) as StatusDoc[]).map(s => (
              <option key={s} value={s}>{STATUS_DOC_CONFIG[s].label}</option>
            ))}
          </select>
          {(busca || filtroStatus !== 'todos') && (
            <button onClick={() => { setBusca(''); setFiltroStatus('todos') }}
              className="text-xs text-slate-500 hover:text-slate-700 underline">Limpar</button>
          )}
          <span className="text-xs text-slate-400 ml-auto">{docsVisiveis.length} resultado{docsVisiveis.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Grid de documentos */}
      <div className="flex-1 overflow-y-auto p-6">
        {docsVisiveis.length === 0 ? (
          <div className="text-center py-16">
            <FileText size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Nenhum documento encontrado com os filtros selecionados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {docsVisiveis.map(doc => (
              <DocumentoCard key={doc.id} documento={doc} onClick={() => setDocSelecionado(doc)} />
            ))}
          </div>
        )}

        {/* Guia de uso */}
        {filtroCategoria === 'todos' && !busca && (
          <div className="mt-8 bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
              <p className="text-sm font-bold text-slate-700">Como usar esta área no dia a dia</p>
            </div>
            <div className="grid grid-cols-3 divide-x divide-slate-100">
              {[
                {
                  titulo: 'Antes de começar qualquer atividade',
                  descricao: 'Abra o Checklist correspondente (início de projeto, entrega, reunião). Execute item por item. Nunca de memória.',
                  icone: '✅',
                },
                {
                  titulo: 'Em caso de dúvida sobre como fazer',
                  descricao: 'Consulte o SOP relacionado. Se o processo não existe documentado, é hora de criar. Processos repetidos mais de 3x devem virar SOP.',
                  icone: '📋',
                },
                {
                  titulo: 'Ao falar com um cliente novo',
                  descricao: 'Use o Template de Briefing correspondente ao serviço. Nunca começe a produção sem briefing preenchido e aprovado.',
                  icone: '🎯',
                },
              ].map((item) => (
                <div key={item.titulo} className="px-5 py-4">
                  <span className="text-2xl">{item.icone}</span>
                  <p className="text-sm font-semibold text-slate-700 mt-2 mb-1">{item.titulo}</p>
                  <p className="text-xs text-slate-500">{item.descricao}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Como manter atualizado */}
        {filtroCategoria === 'todos' && !busca && (
          <div className="mt-4 bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
              <p className="text-sm font-bold text-slate-700">Como manter os documentos atualizados</p>
            </div>
            <div className="divide-y divide-slate-100">
              {[
                { frequencia: 'A cada projeto', acao: 'Ao notar que um processo mudou, atualize o SOP ou checklist correspondente. Não deixe para depois.' },
                { frequencia: 'Mensalmente', acao: 'Revise todos os documentos com status "Ativo". Se algo mudou na prática, atualize ou marque como desatualizado.' },
                { frequencia: 'A cada 3 meses', acao: 'Revisão completa da base. Arquive o que não é mais relevante. Crie novos documentos para processos que ficaram sem documentação.' },
                { frequencia: 'Após qualquer erro', acao: 'Quando um erro acontecer por falta de processo, crie o documento imediatamente. Documentar após o erro é a forma mais eficiente de aprender.' },
              ].map(({ frequencia, acao }) => (
                <div key={frequencia} className="flex gap-4 px-5 py-3">
                  <span className="text-xs font-bold text-blue-600 w-28 flex-none mt-0.5">{frequencia}</span>
                  <p className="text-sm text-slate-600">{acao}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {docSelecionado && (
        <DocumentoModal documento={docSelecionado} onClose={() => setDocSelecionado(null)} />
      )}

      {showNovoDoc && (
        <NovoDocumentoForm
          onSave={(doc) => { addDocumento(doc); setShowNovoDoc(false) }}
          onCancel={() => setShowNovoDoc(false)}
        />
      )}
    </div>
  )
}

function DocumentoCard({ documento, onClick }: { documento: Documento; onClick: () => void }) {
  const catConfig = CATEGORIA_DOC_CONFIG[documento.categoria]
  const statusConfig = STATUS_DOC_CONFIG[documento.status]
  const totalItens = documento.conteudo.flatMap((s) => s.itens ?? []).length
  const isChecklist = documento.categoria === 'checklist'
  const responsavel = USUARIOS.find(u => u.id === documento.responsavel_id)

  return (
    <div onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200 p-4 cursor-pointer hover:shadow-md transition-all group flex flex-col ${
        documento.status === 'desatualizado' ? 'border-l-4 border-l-amber-400' :
        documento.status === 'rascunho' ? 'border-l-4 border-l-slate-300' : ''
      }`}>

      {/* Topo */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className={`text-2xl`}>{catConfig.icone}</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusConfig.corBg} ${statusConfig.cor}`}>
          {statusConfig.label}
        </span>
      </div>

      {/* Título e descrição */}
      <p className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors mb-1.5 leading-tight">
        {documento.titulo}
      </p>
      <p className="text-xs text-slate-500 line-clamp-2 mb-3 flex-1">{documento.descricao}</p>

      {/* Tipo + contagem */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${catConfig.corBg} ${catConfig.cor} ${catConfig.corBorda}`}>
          {catConfig.label}
        </span>
        {isChecklist && totalItens > 0 && (
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <CheckSquare size={11} /> {totalItens} itens
          </span>
        )}
        {!isChecklist && documento.conteudo.length > 0 && (
          <span className="text-xs text-slate-400">{documento.conteudo.length} seções</span>
        )}
      </div>

      {/* Tags */}
      {documento.tags.length > 0 && (
        <div className="flex gap-1 flex-wrap mb-3">
          {documento.tags.slice(0, 3).map(t => (
            <span key={t} className="text-xs bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full">#{t}</span>
          ))}
        </div>
      )}

      {/* Rodapé */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-400">
        <span>v{documento.versao} · {formatarData(documento.atualizado_em)}</span>
        {responsavel && (
          <span className={`w-5 h-5 rounded-full ${responsavel.cor} text-white text-xs font-bold flex items-center justify-center`} title={responsavel.nome}>
            {responsavel.iniciais[0]}
          </span>
        )}
      </div>
    </div>
  )
}
