'use client'

import { useState } from 'react'
import { Lead, Interacao, FollowUp, FunnelStage, TipoInteracao, Sentimento } from '@/lib/crm/types'
import {
  STAGE_CONFIG,
  STAGE_ORDER,
  CARGO_LABELS,
  FONTE_LABELS,
  SEGMENTO_LABELS,
  PORTE_LABELS,
  TIPO_INTERACAO_LABELS,
  USUARIOS,
} from '@/lib/crm/constants'
import { classificarScore, formatarMoeda, formatarData, formatarDataHora } from '@/lib/crm/score'
import { ScoreBadge } from './ScoreBadge'
import {
  X,
  ChevronRight,
  Phone,
  MessageSquare,
  Mail,
  Globe,
  MapPin,
  Building2,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
} from 'lucide-react'

type Tab = 'dados' | 'interacoes' | 'followups'

interface Props {
  lead: Lead
  interacoes: Interacao[]
  followUps: FollowUp[]
  onClose: () => void
  onMover: (leadId: string, stage: FunnelStage) => void
  onAddInteracao: (data: Omit<Interacao, 'id' | 'criado_em'>) => void
  onAddFollowUp: (data: Omit<FollowUp, 'id' | 'criado_em'>) => void
  onConcluirFollowUp: (id: string) => void
  onRemover: (id: string) => void
}

export function LeadModal({
  lead,
  interacoes,
  followUps,
  onClose,
  onMover,
  onAddInteracao,
  onAddFollowUp,
  onConcluirFollowUp,
  onRemover,
}: Props) {
  const [tab, setTab] = useState<Tab>('dados')
  const [showMoverMenu, setShowMoverMenu] = useState(false)
  const [showAddInteracao, setShowAddInteracao] = useState(false)
  const [showAddFollowUp, setShowAddFollowUp] = useState(false)
  const [confirmandoRemocao, setConfirmandoRemocao] = useState(false)

  const leadInteracoes = interacoes
    .filter((i) => i.lead_id === lead.id)
    .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime())

  const leadFollowUps = followUps
    .filter((f) => f.lead_id === lead.id)
    .sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime())

  const responsavel = USUARIOS.find((u) => u.id === lead.responsavel_id)
  const stageConfig = STAGE_CONFIG[lead.status]
  const scoreClass = classificarScore(lead.score_total)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-bold text-slate-800 truncate">{lead.nome_empresa}</h2>
              <ScoreBadge score={lead.score_total} showLabel />
            </div>
            <p className="text-sm text-slate-500">
              {lead.nome_contato} · {CARGO_LABELS[lead.cargo_contato]}
            </p>
          </div>
          <div className="ml-4 flex items-center gap-2 flex-none">
            {confirmandoRemocao ? (
              <>
                <span className="text-xs text-red-600 font-medium">Excluir lead?</span>
                <button
                  onClick={() => { onRemover(lead.id); onClose() }}
                  className="text-xs bg-red-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-red-700 font-medium"
                >
                  Sim
                </button>
                <button
                  onClick={() => setConfirmandoRemocao(false)}
                  className="text-xs border border-slate-200 text-slate-500 px-2.5 py-1.5 rounded-lg hover:bg-slate-50"
                >
                  Não
                </button>
              </>
            ) : (
              <button
                onClick={() => setConfirmandoRemocao(true)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Excluir lead"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Stage bar + mover */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto">
            {STAGE_ORDER.filter(s => s !== 'sem_interesse' && s !== 'pausado').map((stage, idx) => {
              const progressStages = STAGE_ORDER.filter(s => s !== 'sem_interesse' && s !== 'pausado') as FunnelStage[]
              const current = progressStages.indexOf(lead.status as typeof progressStages[number])
              const thisIdx = idx
              const isDone = thisIdx < current
              const isCurrent = stage === lead.status
              const cfg = STAGE_CONFIG[stage]
              return (
                <div key={stage} className="flex items-center gap-1 flex-none">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      isCurrent
                        ? `${cfg.corBg} ${cfg.cor} border ${cfg.corBorda}`
                        : isDone
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'text-slate-400'
                    }`}
                  >
                    {isCurrent ? '● ' : isDone ? '✓ ' : ''}{cfg.label}
                  </span>
                  {idx < progressStages.length - 1 && (
                    <ChevronRight size={12} className="text-slate-300 flex-none" />
                  )}
                </div>
              )
            })}
          </div>

          <div className="relative flex-none">
            <button
              onClick={() => setShowMoverMenu(!showMoverMenu)}
              className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Mover estágio
            </button>
            {showMoverMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-10 w-48">
                {STAGE_ORDER.map((stage) => {
                  const cfg = STAGE_CONFIG[stage]
                  return (
                    <button
                      key={stage}
                      disabled={stage === lead.status}
                      onClick={() => {
                        onMover(lead.id, stage)
                        setShowMoverMenu(false)
                      }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 transition-colors ${
                        stage === lead.status ? 'opacity-40 cursor-default' : cfg.cor
                      }`}
                    >
                      {stage === lead.status ? '● ' : ''}{cfg.label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-6">
          {(['dados', 'interacoes', 'followups'] as Tab[]).map((t) => {
            const labels: Record<Tab, string> = {
              dados: 'Dados',
              interacoes: `Interações (${leadInteracoes.length})`,
              followups: `Follow-ups (${leadFollowUps.filter(f => f.status === 'pendente').length})`,
            }
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  tab === t
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {labels[t]}
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">

          {/* TAB: DADOS */}
          {tab === 'dados' && (
            <div className="p-6 space-y-6">
              {/* Score breakdown */}
              <div className={`rounded-xl p-4 border ${scoreClass.corBg} ${scoreClass.corBorda}`}>
                <p className={`text-sm font-semibold mb-3 ${scoreClass.corTexto}`}>
                  {scoreClass.emoji} Score {lead.score_total}/100 — {scoreClass.label}
                </p>
                <div className="space-y-2">
                  {[
                    { label: 'Perfil', valor: lead.score_perfil, max: 40 },
                    { label: 'Engajamento', valor: lead.score_engajamento, max: 40 },
                    { label: 'Timing', valor: lead.score_timing, max: 20 },
                  ].map(({ label, valor, max }) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600">{label}</span>
                        <span className="font-medium text-slate-700">{valor}/{max}</span>
                      </div>
                      <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${scoreClass.corBarra}`}
                          style={{ width: `${(valor / max) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4">
                <InfoItem icon={<Building2 size={14} />} label="Segmento" value={SEGMENTO_LABELS[lead.segmento]} />
                <InfoItem icon={<Building2 size={14} />} label="Porte" value={PORTE_LABELS[lead.porte]} />
                <InfoItem icon={<Phone size={14} />} label="WhatsApp" value={lead.whatsapp} />
                <InfoItem icon={<Mail size={14} />} label="E-mail" value={lead.email} />
                {lead.site && <InfoItem icon={<Globe size={14} />} label="Site" value={lead.site} />}
                {lead.cidade && (
                  <InfoItem icon={<MapPin size={14} />} label="Cidade" value={`${lead.cidade} — ${lead.estado}`} />
                )}
                <InfoItem icon={<TrendingUp size={14} />} label="Fonte" value={FONTE_LABELS[lead.fonte] + (lead.fonte_detalhe ? ` · ${lead.fonte_detalhe}` : '')} />
                {responsavel && (
                  <InfoItem
                    icon={
                      <span className={`w-4 h-4 rounded-full text-white text-xs flex items-center justify-center ${responsavel.cor}`}>
                        {responsavel.iniciais[0]}
                      </span>
                    }
                    label="Responsável"
                    value={responsavel.nome}
                  />
                )}
              </div>

              {/* Financeiro */}
              {(lead.valor_estimado || lead.data_fechamento_estimada) && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2">Oportunidade</p>
                  <div className="flex items-center gap-6">
                    {lead.valor_estimado && (
                      <div>
                        <p className="text-xs text-emerald-600">Valor estimado</p>
                        <p className="text-lg font-bold text-emerald-700">{formatarMoeda(lead.valor_estimado)}<span className="text-sm font-normal">/mês</span></p>
                      </div>
                    )}
                    {lead.data_fechamento_estimada && (
                      <div>
                        <p className="text-xs text-emerald-600">Fechamento previsto</p>
                        <p className="font-semibold text-emerald-700">{formatarData(lead.data_fechamento_estimada)}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-emerald-600">Probabilidade</p>
                      <p className="font-semibold text-emerald-700">{lead.probabilidade}%</p>
                    </div>
                  </div>
                </div>
              )}

              {lead.observacoes && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Observações</p>
                  <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 border border-slate-200">{lead.observacoes}</p>
                </div>
              )}

              {lead.motivo_perda && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-red-600 mb-1">Motivo da perda</p>
                  <p className="text-sm text-red-700">{lead.motivo_perda}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB: INTERAÇÕES */}
          {tab === 'interacoes' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-slate-700">Histórico de interações</p>
                <button
                  onClick={() => setShowAddInteracao(true)}
                  className="flex items-center gap-1 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus size={13} /> Registrar
                </button>
              </div>

              {showAddInteracao && (
                <AddInteracaoForm
                  leadId={lead.id}
                  onSave={(data) => {
                    onAddInteracao(data)
                    setShowAddInteracao(false)
                  }}
                  onCancel={() => setShowAddInteracao(false)}
                />
              )}

              <div className="space-y-3">
                {leadInteracoes.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-8">Nenhuma interação registrada ainda.</p>
                )}
                {leadInteracoes.map((interacao) => (
                  <div key={interacao.id} className="flex gap-3">
                    <div className="flex-none mt-0.5">
                      <div className={`w-2 h-2 rounded-full mt-1.5 ${
                        interacao.sentimento === 'positivo' ? 'bg-emerald-400' :
                        interacao.sentimento === 'negativo' ? 'bg-red-400' : 'bg-slate-300'
                      }`} />
                    </div>
                    <div className="flex-1 bg-slate-50 rounded-lg p-3 border border-slate-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-slate-600">
                          {TIPO_INTERACAO_LABELS[interacao.tipo]}
                        </span>
                        <span className="text-xs text-slate-400">{formatarDataHora(interacao.criado_em)}</span>
                      </div>
                      <p className="text-sm text-slate-700">{interacao.conteudo}</p>
                      {interacao.proximo_passo && (
                        <p className="text-xs text-blue-600 mt-2 bg-blue-50 rounded px-2 py-1">
                          → {interacao.proximo_passo}
                        </p>
                      )}
                      {interacao.duracao_minutos && (
                        <p className="text-xs text-slate-400 mt-1">Duração: {interacao.duracao_minutos} min</p>
                      )}
                      <p className="text-xs text-slate-400 mt-1">por {interacao.usuario_nome}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: FOLLOW-UPS */}
          {tab === 'followups' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-slate-700">Agenda de follow-ups</p>
                <button
                  onClick={() => setShowAddFollowUp(true)}
                  className="flex items-center gap-1 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus size={13} /> Agendar
                </button>
              </div>

              {showAddFollowUp && (
                <AddFollowUpForm
                  leadId={lead.id}
                  onSave={(data) => {
                    onAddFollowUp(data)
                    setShowAddFollowUp(false)
                  }}
                  onCancel={() => setShowAddFollowUp(false)}
                />
              )}

              <div className="space-y-2">
                {leadFollowUps.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-8">Nenhum follow-up agendado.</p>
                )}
                {leadFollowUps.map((fu) => {
                  const atrasado = fu.status === 'pendente' && new Date(fu.data_hora) < new Date()
                  const concluido = fu.status === 'concluido'
                  return (
                    <div
                      key={fu.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border ${
                        concluido
                          ? 'border-slate-100 bg-slate-50 opacity-60'
                          : atrasado
                          ? 'border-red-200 bg-red-50'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex-none pt-0.5">
                        {concluido ? (
                          <CheckCircle2 size={16} className="text-emerald-500" />
                        ) : atrasado ? (
                          <AlertCircle size={16} className="text-red-500" />
                        ) : (
                          <Clock size={16} className="text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-xs font-semibold uppercase ${
                            fu.prioridade === 'urgente' ? 'text-red-600' :
                            fu.prioridade === 'alta' ? 'text-orange-600' :
                            'text-slate-500'
                          }`}>
                            {fu.prioridade}
                          </span>
                          <span className="text-xs text-slate-400">·</span>
                          <span className="text-xs text-slate-500">{fu.tipo}</span>
                        </div>
                        <p className="text-sm text-slate-700">{fu.descricao}</p>
                        <p className={`text-xs mt-1 ${atrasado ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
                          {atrasado ? '⚠️ ' : ''}{formatarDataHora(fu.data_hora)}
                        </p>
                      </div>
                      {!concluido && (
                        <button
                          onClick={() => onConcluirFollowUp(fu.id)}
                          className="flex-none text-xs text-emerald-600 hover:text-emerald-700 font-medium px-2 py-1 rounded hover:bg-emerald-50 transition-colors"
                        >
                          Concluir
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400 mb-0.5 flex items-center gap-1">
        {icon} {label}
      </p>
      <p className="text-sm text-slate-700 font-medium">{value}</p>
    </div>
  )
}

function AddInteracaoForm({
  leadId,
  onSave,
  onCancel,
}: {
  leadId: string
  onSave: (data: Omit<Interacao, 'id' | 'criado_em'>) => void
  onCancel: () => void
}) {
  const [tipo, setTipo] = useState<TipoInteracao>('nota_interna')
  const [conteudo, setConteudo] = useState('')
  const [sentimento, setSentimento] = useState<Sentimento>('neutro')
  const [proximoPasso, setProximoPasso] = useState('')
  const [duracao, setDuracao] = useState('')

  function handleSave() {
    if (!conteudo.trim()) return
    onSave({
      lead_id: leadId,
      usuario_nome: 'Você',
      tipo,
      conteudo,
      sentimento,
      proximo_passo: proximoPasso || undefined,
      duracao_minutos: duracao ? parseInt(duracao) : undefined,
    })
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 space-y-3">
      <p className="text-xs font-semibold text-blue-700">Nova interação</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Tipo</label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoInteracao)}
            className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white"
          >
            {Object.entries(TIPO_INTERACAO_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Sentimento</label>
          <select
            value={sentimento}
            onChange={(e) => setSentimento(e.target.value as Sentimento)}
            className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white"
          >
            <option value="positivo">😊 Positivo</option>
            <option value="neutro">😐 Neutro</option>
            <option value="negativo">😟 Negativo</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs text-slate-500 mb-1 block">Resumo da interação *</label>
        <textarea
          value={conteudo}
          onChange={(e) => setConteudo(e.target.value)}
          rows={3}
          placeholder="O que foi discutido, decidido ou observado?"
          className="w-full text-sm text-slate-900 border border-slate-200 rounded-lg px-3 py-2 bg-white resize-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Próximo passo</label>
          <input
            value={proximoPasso}
            onChange={(e) => setProximoPasso(e.target.value)}
            placeholder="O que foi combinado?"
            className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Duração (min)</label>
          <input
            type="number"
            value={duracao}
            onChange={(e) => setDuracao(e.target.value)}
            placeholder="Ex: 30"
            className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white"
          />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSave}
          className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Salvar
        </button>
        <button
          onClick={onCancel}
          className="text-sm text-slate-500 px-4 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

function AddFollowUpForm({
  leadId,
  onSave,
  onCancel,
}: {
  leadId: string
  onSave: (data: Omit<FollowUp, 'id' | 'criado_em'>) => void
  onCancel: () => void
}) {
  const [tipo, setTipo] = useState<'ligar' | 'whatsapp' | 'email' | 'reuniao' | 'outro'>('ligar')
  const [descricao, setDescricao] = useState('')
  const [dataHora, setDataHora] = useState('')
  const [prioridade, setPrioridade] = useState<'urgente' | 'alta' | 'normal' | 'baixa'>('normal')

  function handleSave() {
    if (!descricao.trim() || !dataHora) return
    onSave({
      lead_id: leadId,
      tipo,
      descricao,
      data_hora: new Date(dataHora).toISOString(),
      prioridade,
      status: 'pendente',
    })
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 space-y-3">
      <p className="text-xs font-semibold text-amber-700">Novo follow-up</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Tipo de ação</label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as typeof tipo)}
            className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white"
          >
            <option value="ligar">📞 Ligar</option>
            <option value="whatsapp">📱 WhatsApp</option>
            <option value="email">📧 E-mail</option>
            <option value="reuniao">🤝 Reunião</option>
            <option value="outro">💬 Outro</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Prioridade</label>
          <select
            value={prioridade}
            onChange={(e) => setPrioridade(e.target.value as typeof prioridade)}
            className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white"
          >
            <option value="urgente">🔴 Urgente</option>
            <option value="alta">🟠 Alta</option>
            <option value="normal">🟡 Normal</option>
            <option value="baixa">🔵 Baixa</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs text-slate-500 mb-1 block">O que fazer *</label>
        <input
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Descreva a ação e o objetivo da abordagem"
          className="w-full text-sm text-slate-900 border border-slate-200 rounded-lg px-3 py-2 bg-white"
        />
      </div>
      <div>
        <label className="text-xs text-slate-500 mb-1 block">Quando *</label>
        <input
          type="datetime-local"
          value={dataHora}
          onChange={(e) => setDataHora(e.target.value)}
          className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white"
        />
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSave}
          className="text-sm bg-amber-600 text-white px-4 py-1.5 rounded-lg hover:bg-amber-700 transition-colors font-medium"
        >
          Agendar
        </button>
        <button
          onClick={onCancel}
          className="text-sm text-slate-500 px-4 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
