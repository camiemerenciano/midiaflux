'use client'

import { useState } from 'react'
import {
  Projeto, Tarefa, Comentario,
  StatusTarefa, StatusProjeto, TipoTarefa, TipoComentario,
} from '@/lib/operacao/types'
import {
  STATUS_PROJETO_CONFIG, STATUS_TAREFA_CONFIG, TIPO_TAREFA_CONFIG,
  FLUXO_PRODUCAO, PRIORIDADE_CONFIG, SLA_STATUS_TAREFA,
} from '@/lib/operacao/constants'
import { isTarefaAtrasada, diasAtraso } from '@/lib/operacao/store'
import { USUARIOS } from '@/lib/crm/constants'
import { formatarData, formatarDataHora } from '@/lib/crm/score'
import { mockClientes } from '@/lib/clientes/mock-data'
import {
  X, ChevronDown, ChevronRight, Plus, AlertTriangle, Clock,
  CheckCircle2, XCircle, MessageSquare, ChevronUp, Calendar,
  User, Zap,
} from 'lucide-react'

type Tab = 'tarefas' | 'fluxo' | 'atrasos'

interface Props {
  projeto: Projeto
  tarefas: Tarefa[]
  comentarios: Comentario[]
  onClose: () => void
  onMoverTarefa: (id: string, status: StatusTarefa) => void
  onAddTarefa: (data: Omit<Tarefa, 'id' | 'criado_em' | 'atualizado_em'>) => void
  onAddComentario: (data: Omit<Comentario, 'id' | 'criado_em'>) => void
  onUpdateStatusProjeto: (id: string, status: StatusProjeto) => void
}

export function ProjetoModal({
  projeto, tarefas, comentarios,
  onClose, onMoverTarefa, onAddTarefa, onAddComentario, onUpdateStatusProjeto,
}: Props) {
  const [tab, setTab] = useState<Tab>('tarefas')
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [showAddTarefa, setShowAddTarefa] = useState(false)
  const [tarefaAberta, setTarefaAberta] = useState<string | null>(null)

  const statusConfig = STATUS_PROJETO_CONFIG[projeto.status]
  const cliente = mockClientes.find((c) => c.id === projeto.cliente_id)
  const responsavel = USUARIOS.find((u) => u.id === projeto.responsavel_id)
  const equipe = USUARIOS.filter((u) => projeto.equipe_ids.includes(u.id))

  const tarefasAtrasadas = tarefas.filter(isTarefaAtrasada)
  const tarefasAguardando = tarefas.filter((t) => t.status === 'aguardando_cliente')
  const tarefasBloqueadas = tarefas.filter((t) => t.status === 'bloqueado')
  const tarefasConcluidas = tarefas.filter((t) => t.status === 'concluido')

  const diasParaEntrega = Math.ceil(
    (new Date(projeto.data_entrega_prevista).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  // Group tasks by status for "fluxo" view
  const tarefasPorStatus = FLUXO_PRODUCAO.reduce((acc, s) => {
    acc[s] = tarefas.filter((t) => t.status === s)
    return acc
  }, {} as Record<StatusTarefa, Tarefa[]>)
  const bloqueadas = tarefas.filter((t) => t.status === 'bloqueado')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-400 mb-0.5">{cliente?.nome_empresa}</p>
              <h2 className="text-xl font-bold text-slate-800 leading-tight">{projeto.nome}</h2>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusConfig.corBg} ${statusConfig.cor} ${statusConfig.corBorda}`}>
                  {statusConfig.icone} {statusConfig.label}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORIDADE_CONFIG[projeto.prioridade].corBg} ${PRIORIDADE_CONFIG[projeto.prioridade].cor}`}>
                  {PRIORIDADE_CONFIG[projeto.prioridade].label}
                </span>
                {diasParaEntrega < 0 && projeto.status !== 'concluido' && (
                  <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                    ⚠️ {Math.abs(diasParaEntrega)}d de atraso
                  </span>
                )}
                {diasParaEntrega >= 0 && diasParaEntrega <= 3 && projeto.status !== 'concluido' && (
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    ⏰ Entrega em {diasParaEntrega}d
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-none">
              <div className="relative">
                <button
                  onClick={() => setShowStatusMenu(!showStatusMenu)}
                  className="flex items-center gap-1 text-xs border border-slate-200 px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Status <ChevronDown size={12} />
                </button>
                {showStatusMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-10 w-52">
                    {(Object.keys(STATUS_PROJETO_CONFIG) as StatusProjeto[]).map((s) => {
                      const cfg = STATUS_PROJETO_CONFIG[s]
                      return (
                        <button key={s} disabled={s === projeto.status}
                          onClick={() => { onUpdateStatusProjeto(projeto.id, s); setShowStatusMenu(false) }}
                          className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 ${s === projeto.status ? 'opacity-40 cursor-default' : cfg.cor}`}
                        >
                          {cfg.icone} {cfg.label}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Progresso + equipe */}
          <div className="flex items-center gap-4 mt-4">
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500">Progresso geral</span>
                <span className="font-semibold text-slate-700">{projeto.progresso}% · {tarefasConcluidas.length}/{tarefas.length} tarefas</span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${projeto.progresso === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                  style={{ width: `${projeto.progresso}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 flex-none">
              <span className="flex items-center gap-1"><Calendar size={12} />{formatarData(projeto.data_entrega_prevista)}</span>
              <div className="flex -space-x-1">
                {equipe.map((u) => (
                  <span key={u.id} title={u.nome}
                    className={`w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center border-2 border-white ${u.cor}`}>
                    {u.iniciais[0]}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Alert strip */}
          {(tarefasAtrasadas.length > 0 || tarefasBloqueadas.length > 0 || tarefasAguardando.length > 0) && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {tarefasAtrasadas.length > 0 && (
                <AlertChip cor="red" icon={<AlertTriangle size={11} />} label={`${tarefasAtrasadas.length} tarefa${tarefasAtrasadas.length > 1 ? 's' : ''} atrasada${tarefasAtrasadas.length > 1 ? 's' : ''}`} />
              )}
              {tarefasBloqueadas.length > 0 && (
                <AlertChip cor="red" icon={<XCircle size={11} />} label={`${tarefasBloqueadas.length} bloqueada${tarefasBloqueadas.length > 1 ? 's' : ''}`} />
              )}
              {tarefasAguardando.length > 0 && (
                <AlertChip cor="amber" icon={<Clock size={11} />} label={`${tarefasAguardando.length} aguardando cliente`} />
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-6">
          {([
            ['tarefas', `Tarefas (${tarefas.length})`],
            ['fluxo', 'Fluxo de Produção'],
            ['atrasos', `Alertas (${tarefasAtrasadas.length + tarefasBloqueadas.length})`],
          ] as [Tab, string][]).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* TAB: TAREFAS */}
          {tab === 'tarefas' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-slate-700">Lista de tarefas</p>
                <button
                  onClick={() => setShowAddTarefa(true)}
                  className="flex items-center gap-1 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700"
                >
                  <Plus size={13} /> Nova tarefa
                </button>
              </div>

              {showAddTarefa && (
                <AddTarefaForm
                  projetoId={projeto.id}
                  ordem={tarefas.length + 1}
                  onSave={(data) => { onAddTarefa(data); setShowAddTarefa(false) }}
                  onCancel={() => setShowAddTarefa(false)}
                />
              )}

              <div className="space-y-2">
                {tarefas.map((tarefa) => (
                  <TarefaRow
                    key={tarefa.id}
                    tarefa={tarefa}
                    comentarios={comentarios.filter((c) => c.tarefa_id === tarefa.id)}
                    aberta={tarefaAberta === tarefa.id}
                    onToggle={() => setTarefaAberta(tarefaAberta === tarefa.id ? null : tarefa.id)}
                    onMover={onMoverTarefa}
                    onAddComentario={onAddComentario}
                  />
                ))}
              </div>
            </div>
          )}

          {/* TAB: FLUXO DE PRODUÇÃO */}
          {tab === 'fluxo' && (
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm font-semibold text-slate-700 mb-1">Fluxo oficial de produção</p>
                <p className="text-xs text-slate-500">Cada tarefa percorre este caminho até ser aprovada e concluída.</p>
              </div>

              {/* Pipeline visual */}
              <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2">
                {FLUXO_PRODUCAO.map((status, idx) => {
                  const cfg = STATUS_TAREFA_CONFIG[status]
                  const count = tarefasPorStatus[status]?.length ?? 0
                  return (
                    <div key={status} className="flex items-center gap-1 flex-none">
                      <div className={`rounded-lg px-3 py-2 text-center min-w-[110px] border ${cfg.corBg} ${cfg.corBorda}`}>
                        <p className={`text-xs font-bold ${cfg.cor}`}>{cfg.label}</p>
                        <p className={`text-lg font-bold mt-0.5 ${cfg.cor}`}>{count}</p>
                        <p className="text-xs text-slate-400">tarefa{count !== 1 ? 's' : ''}</p>
                      </div>
                      {idx < FLUXO_PRODUCAO.length - 1 && <ChevronRight size={16} className="text-slate-300 flex-none" />}
                    </div>
                  )
                })}
                {bloqueadas.length > 0 && (
                  <>
                    <div className="w-px h-8 bg-slate-200 mx-1 flex-none" />
                    <div className="rounded-lg px-3 py-2 text-center min-w-[100px] border bg-red-50 border-red-200 flex-none">
                      <p className="text-xs font-bold text-red-700">Bloqueado</p>
                      <p className="text-lg font-bold mt-0.5 text-red-700">{bloqueadas.length}</p>
                    </div>
                  </>
                )}
              </div>

              {/* SLA guide */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">SLA por etapa (máximo sem movimentação)</p>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(SLA_STATUS_TAREFA) as [StatusTarefa, number][]).map(([status, dias]) => {
                    const cfg = STATUS_TAREFA_CONFIG[status]
                    const tarefasNessaEtapa = tarefas.filter((t) => t.status === status)
                    const tarefasViolaramSLA = tarefasNessaEtapa.filter((t) =>
                      diasAtraso(t.atualizado_em) > dias
                    )
                    return (
                      <div key={status} className={`flex items-center justify-between p-2 rounded-lg border ${cfg.corBg} ${cfg.corBorda}`}>
                        <div>
                          <p className={`text-xs font-semibold ${cfg.cor}`}>{cfg.label}</p>
                          <p className="text-xs text-slate-400">Máx. {dias} dia{dias > 1 ? 's' : ''}</p>
                        </div>
                        {tarefasViolaramSLA.length > 0 && (
                          <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                            ⚠️ {tarefasViolaramSLA.length} violação
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Por etapa detalhado */}
              {FLUXO_PRODUCAO.filter((s) => (tarefasPorStatus[s]?.length ?? 0) > 0).map((status) => {
                const cfg = STATUS_TAREFA_CONFIG[status]
                return (
                  <div key={status} className="mb-4">
                    <p className={`text-xs font-bold uppercase tracking-wide mb-2 ${cfg.cor}`}>{cfg.label}</p>
                    <div className="space-y-1">
                      {tarefasPorStatus[status].map((t) => {
                        const atrasada = isTarefaAtrasada(t)
                        return (
                          <div key={t.id} className={`flex items-center gap-2 p-2 rounded-lg border text-xs ${atrasada ? 'bg-red-50 border-red-200' : cfg.corBg + ' ' + cfg.corBorda}`}>
                            <span>{TIPO_TAREFA_CONFIG[t.tipo].icone}</span>
                            <span className="flex-1 font-medium text-slate-700">{t.nome}</span>
                            {atrasada && <span className="text-red-600 font-bold">⚠️ {diasAtraso(t.data_prevista)}d atraso</span>}
                            {t.feedback_cliente && <span className="text-amber-600" title={t.feedback_cliente}>💬 feedback</span>}
                            <span className="text-slate-400">{formatarData(t.data_prevista)}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* TAB: ALERTAS */}
          {tab === 'atrasos' && (
            <div className="p-6 space-y-4">
              {tarefasAtrasadas.length === 0 && tarefasBloqueadas.length === 0 && tarefasAguardando.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Nenhum alerta. Projeto saudável!</p>
                </div>
              ) : (
                <>
                  {tarefasBloqueadas.length > 0 && (
                    <AlertSection
                      titulo="Tarefas bloqueadas — ação imediata"
                      cor="red"
                      icone={<XCircle size={14} />}
                      tarefas={tarefasBloqueadas}
                      descricao="Esperando decisão ou ação do cliente."
                    />
                  )}
                  {tarefasAtrasadas.length > 0 && (
                    <AlertSection
                      titulo="Tarefas atrasadas"
                      cor="red"
                      icone={<AlertTriangle size={14} />}
                      tarefas={tarefasAtrasadas}
                      showDiasAtraso
                    />
                  )}
                  {tarefasAguardando.length > 0 && (
                    <AlertSection
                      titulo="Aguardando aprovação do cliente"
                      cor="amber"
                      icone={<Clock size={14} />}
                      tarefas={tarefasAguardando}
                      descricao="Tarefas enviadas ao cliente que ainda não foram aprovadas."
                    />
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function TarefaRow({
  tarefa, comentarios, aberta, onToggle, onMover, onAddComentario,
}: {
  tarefa: Tarefa
  comentarios: Comentario[]
  aberta: boolean
  onToggle: () => void
  onMover: (id: string, status: StatusTarefa) => void
  onAddComentario: (data: Omit<Comentario, 'id' | 'criado_em'>) => void
}) {
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [showCommentForm, setShowCommentForm] = useState(false)
  const [comentarioTexto, setComentarioTexto] = useState('')

  const cfg = STATUS_TAREFA_CONFIG[tarefa.status]
  const tipoCfg = TIPO_TAREFA_CONFIG[tarefa.tipo]
  const responsavel = USUARIOS.find((u) => u.id === tarefa.responsavel_id)
  const atrasada = isTarefaAtrasada(tarefa)
  const atraso = atrasada ? diasAtraso(tarefa.data_prevista) : 0

  return (
    <div className={`border rounded-lg overflow-hidden ${atrasada ? 'border-red-200' : tarefa.status === 'bloqueado' ? 'border-red-300' : 'border-slate-200'}`}>
      {/* Row principal */}
      <div
        className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors ${
          tarefa.status === 'concluido' ? 'bg-slate-50' : atrasada ? 'bg-red-50/30' : ''
        }`}
        onClick={onToggle}
      >
        {/* Status icon */}
        <div className="flex-none">
          {tarefa.status === 'concluido' ? <CheckCircle2 size={16} className="text-emerald-500" /> :
           tarefa.status === 'bloqueado' ? <XCircle size={16} className="text-red-500" /> :
           tarefa.status === 'aguardando_cliente' ? <Clock size={16} className="text-amber-500" /> :
           <div className={`w-4 h-4 rounded-full border-2 ${cfg.corBorda}`} />}
        </div>

        <span className="text-sm flex-none">{tipoCfg.icone}</span>

        <p className={`flex-1 text-sm font-medium ${tarefa.status === 'concluido' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
          {tarefa.nome}
        </p>

        {atrasada && (
          <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200 flex-none">
            ⚠️ {atraso}d
          </span>
        )}

        {/* Status badge + menu */}
        <div className="relative flex-none" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border font-medium ${cfg.corBg} ${cfg.cor} ${cfg.corBorda}`}
          >
            {cfg.label} <ChevronDown size={10} />
          </button>
          {showStatusMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-20 w-44">
              {(Object.keys(STATUS_TAREFA_CONFIG) as StatusTarefa[]).map((s) => {
                const c = STATUS_TAREFA_CONFIG[s]
                return (
                  <button key={s} disabled={s === tarefa.status}
                    onClick={() => { onMover(tarefa.id, s); setShowStatusMenu(false) }}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 ${s === tarefa.status ? 'opacity-40 cursor-default' : c.cor}`}
                  >
                    {c.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <span className="text-xs text-slate-400 flex-none">{formatarData(tarefa.data_prevista)}</span>
        {responsavel && (
          <span title={responsavel.nome} className={`w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center flex-none ${responsavel.cor}`}>
            {responsavel.iniciais[0]}
          </span>
        )}
        {aberta ? <ChevronUp size={14} className="text-slate-400 flex-none" /> : <ChevronDown size={14} className="text-slate-400 flex-none" />}
      </div>

      {/* Detalhe expandido */}
      {aberta && (
        <div className="border-t border-slate-100 bg-white px-4 py-3 space-y-3">
          {tarefa.descricao && (
            <p className="text-sm text-slate-600">{tarefa.descricao}</p>
          )}

          <div className="grid grid-cols-4 gap-3 text-xs">
            {tarefa.estimativa_horas && (
              <InfoMini label="Estimativa" value={`${tarefa.estimativa_horas}h`} />
            )}
            {tarefa.horas_realizadas !== undefined && tarefa.horas_realizadas > 0 && (
              <InfoMini label="Realizado" value={`${tarefa.horas_realizadas}h`} />
            )}
            <InfoMini label="Revisões" value={`${tarefa.revisoes_usadas}/${tarefa.revisoes_max}`} destaque={tarefa.revisoes_usadas >= tarefa.revisoes_max} />
            {tarefa.data_conclusao && <InfoMini label="Concluído" value={formatarData(tarefa.data_conclusao)} />}
          </div>

          {/* Feedback do cliente */}
          {tarefa.feedback_cliente && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs font-bold text-amber-700 mb-1">💬 Feedback do cliente</p>
              <p className="text-sm text-amber-800">{tarefa.feedback_cliente}</p>
            </div>
          )}

          {/* Comentários */}
          {comentarios.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500">Histórico</p>
              {comentarios.map((c) => (
                <div key={c.id} className={`text-xs p-2 rounded-lg border ${
                  c.tipo === 'feedback_cliente' ? 'bg-amber-50 border-amber-100' :
                  c.tipo === 'aprovacao' ? 'bg-emerald-50 border-emerald-100' :
                  c.tipo === 'rejeicao' ? 'bg-red-50 border-red-100' :
                  c.tipo === 'sistema' ? 'bg-slate-50 border-slate-100 text-slate-400 italic' :
                  'bg-white border-slate-100'
                }`}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-semibold text-slate-600">{c.usuario_nome}</span>
                    <span className="text-slate-400">{formatarDataHora(c.criado_em)}</span>
                  </div>
                  <p className="text-slate-700">{c.conteudo}</p>
                </div>
              ))}
            </div>
          )}

          {/* Adicionar comentário */}
          {!showCommentForm ? (
            <button
              onClick={() => setShowCommentForm(true)}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              <MessageSquare size={12} /> Adicionar comentário
            </button>
          ) : (
            <div className="space-y-2">
              <textarea
                value={comentarioTexto}
                onChange={(e) => setComentarioTexto(e.target.value)}
                rows={2}
                placeholder="Descreva o que foi feito, o feedback recebido ou a próxima ação..."
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (!comentarioTexto.trim()) return
                    onAddComentario({ tarefa_id: tarefa.id, usuario_nome: 'Você', conteudo: comentarioTexto, tipo: 'comentario' })
                    setComentarioTexto('')
                    setShowCommentForm(false)
                  }}
                  className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 font-medium"
                >
                  Salvar
                </button>
                <button onClick={() => setShowCommentForm(false)} className="text-xs text-slate-500 px-3 py-1.5 rounded-lg hover:bg-slate-100">
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AlertSection({
  titulo, cor, icone, tarefas, descricao, showDiasAtraso = false,
}: {
  titulo: string; cor: 'red' | 'amber'; icone: React.ReactNode
  tarefas: Tarefa[]; descricao?: string; showDiasAtraso?: boolean
}) {
  const corMap = {
    red: { border: 'border-red-200', bg: 'bg-red-50', titulo: 'text-red-700', item: 'border-red-100 bg-red-50/50' },
    amber: { border: 'border-amber-200', bg: 'bg-amber-50', titulo: 'text-amber-700', item: 'border-amber-100 bg-amber-50/50' },
  }
  const c = corMap[cor]
  return (
    <div className={`border ${c.border} rounded-xl overflow-hidden`}>
      <div className={`flex items-center gap-2 px-4 py-3 ${c.bg}`}>
        <span className={c.titulo}>{icone}</span>
        <p className={`text-sm font-bold ${c.titulo}`}>{titulo}</p>
        <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full border ${c.border} ${c.titulo}`}>{tarefas.length}</span>
      </div>
      {descricao && <p className="text-xs text-slate-500 px-4 py-2 border-b border-slate-100">{descricao}</p>}
      <div className="divide-y divide-slate-100">
        {tarefas.map((t) => {
          const responsavel = USUARIOS.find((u) => u.id === t.responsavel_id)
          return (
            <div key={t.id} className="flex items-start gap-3 px-4 py-3">
              <span className="text-sm flex-none mt-0.5">{TIPO_TAREFA_CONFIG[t.tipo].icone}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800">{t.nome}</p>
                {t.feedback_cliente && <p className="text-xs text-slate-500 mt-0.5 italic">"{t.feedback_cliente}"</p>}
                <p className="text-xs text-slate-400 mt-1">Prazo: {formatarData(t.data_prevista)}</p>
              </div>
              {showDiasAtraso && (
                <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-200 flex-none">
                  {diasAtraso(t.data_prevista)}d
                </span>
              )}
              {responsavel && (
                <span title={responsavel.nome} className={`w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center flex-none ${responsavel.cor}`}>
                  {responsavel.iniciais[0]}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AddTarefaForm({
  projetoId, ordem, onSave, onCancel,
}: {
  projetoId: string; ordem: number
  onSave: (data: Omit<Tarefa, 'id' | 'criado_em' | 'atualizado_em'>) => void
  onCancel: () => void
}) {
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState<TipoTarefa>('producao')
  const [responsavel_id, setResponsavelId] = useState(USUARIOS[0].id)
  const [data_prevista, setDataPrevista] = useState('')
  const [estimativa_horas, setEstimativaHoras] = useState('')
  const [descricao, setDescricao] = useState('')
  const [revisoes_max, setRevisoesMax] = useState(2)

  function handleSave() {
    if (!nome || !data_prevista) return
    onSave({
      projeto_id: projetoId, nome, tipo, status: 'backlog',
      responsavel_id, prioridade: 'normal',
      data_prevista, descricao: descricao || undefined,
      estimativa_horas: estimativa_horas ? parseFloat(estimativa_horas) : undefined,
      horas_realizadas: 0, ordem,
      revisoes_usadas: 0, revisoes_max,
    })
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 space-y-3">
      <p className="text-xs font-semibold text-blue-700">Nova tarefa</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Tipo</label>
          <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoTarefa)} className={inputCls}>
            {Object.entries(TIPO_TAREFA_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.icone} {v.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Responsável</label>
          <select value={responsavel_id} onChange={(e) => setResponsavelId(e.target.value)} className={inputCls}>
            {USUARIOS.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs text-slate-500 mb-1 block">Nome da tarefa *</label>
        <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Design das artes do feed" className={inputCls} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Prazo *</label>
          <input type="date" value={data_prevista} onChange={(e) => setDataPrevista(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Estimativa (h)</label>
          <input type="number" value={estimativa_horas} onChange={(e) => setEstimativaHoras(e.target.value)} placeholder="Ex: 4" className={inputCls} />
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Revisões</label>
          <input type="number" min={0} max={5} value={revisoes_max} onChange={(e) => setRevisoesMax(parseInt(e.target.value))} className={inputCls} />
        </div>
      </div>
      <div>
        <label className="text-xs text-slate-500 mb-1 block">Descrição</label>
        <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2} placeholder="Detalhes, referências, critérios de aceitação..." className={`${inputCls} resize-none`} />
      </div>
      <div className="flex gap-2">
        <button onClick={handleSave} className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 font-medium">Criar tarefa</button>
        <button onClick={onCancel} className="text-sm text-slate-500 px-4 py-1.5 rounded-lg hover:bg-slate-100">Cancelar</button>
      </div>
    </div>
  )
}

function AlertChip({ cor, icon, label }: { cor: 'red' | 'amber'; icon: React.ReactNode; label: string }) {
  const c = cor === 'red' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-700'
  return (
    <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border ${c}`}>
      {icon} {label}
    </span>
  )
}

function InfoMini({ label, value, destaque = false }: { label: string; value: string; destaque?: boolean }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`text-sm font-semibold ${destaque ? 'text-red-600' : 'text-slate-700'}`}>{value}</p>
    </div>
  )
}

const inputCls = 'w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'
