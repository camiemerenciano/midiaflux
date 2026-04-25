'use client'

import { useState } from 'react'
import { Cliente, ContatoCliente, Contrato, EntregaHistorico, StatusCliente } from '@/lib/clientes/types'
import {
  TIPO_CLIENTE_CONFIG,
  STATUS_CLIENTE_CONFIG,
  CATALOGO_SERVICOS,
  TIPO_ENTREGA_LABELS,
  CATEGORIA_SERVICO_LABELS,
} from '@/lib/clientes/constants'
import { CARGO_LABELS, SEGMENTO_LABELS, PORTE_LABELS, USUARIOS } from '@/lib/crm/constants'
import { formatarMoeda, formatarData, formatarDataHora } from '@/lib/crm/score'
import {
  X, Phone, Mail, Globe, MapPin, Building2, Star, Calendar,
  CheckCircle2, Clock, AlertCircle, XCircle, Plus, ChevronDown,
  TrendingUp, Package, Users,
} from 'lucide-react'

type Tab = 'perfil' | 'contratos' | 'entregas'

interface Props {
  cliente: Cliente
  contatos: ContatoCliente[]
  contratos: Contrato[]
  entregas: EntregaHistorico[]
  onClose: () => void
  onUpdateStatus: (id: string, status: StatusCliente, motivo?: string) => void
  onAddEntrega: (data: Omit<EntregaHistorico, 'id'>) => void
}

export function ClienteModal({
  cliente, contatos, contratos, entregas,
  onClose, onUpdateStatus, onAddEntrega,
}: Props) {
  const [tab, setTab] = useState<Tab>('perfil')
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [showAddEntrega, setShowAddEntrega] = useState(false)

  const tipoConfig = TIPO_CLIENTE_CONFIG[cliente.tipo]
  const statusConfig = STATUS_CLIENTE_CONFIG[cliente.status]
  const responsavel = USUARIOS.find((u) => u.id === cliente.responsavel_id)
  const contatoPrincipal = contatos.find((c) => c.principal)
  const contratosAtivos = contratos.filter((k) => k.status === 'ativo')

  const mrr = contratosAtivos.reduce((s, k) => s + (k.valor_mensal ?? 0), 0)
  const totalAno = mrr * 12 || contratosAtivos.reduce((s, k) => s + (k.valor_total ?? 0), 0)

  const mesesAtivo = Math.floor(
    (new Date().getTime() - new Date(cliente.data_inicio).getTime()) / (1000 * 60 * 60 * 24 * 30)
  )
  const ltv = mrr * mesesAtivo

  const totalServicos = contratosAtivos.flatMap((k) => k.servico_ids).filter((v, i, a) => a.indexOf(v) === i)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="text-xl font-bold text-slate-800">{cliente.nome_empresa}</h2>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${tipoConfig.corBg} ${tipoConfig.cor} ${tipoConfig.corBorda}`}>
                  {tipoConfig.label}
                </span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusConfig.corBg} ${statusConfig.cor} ${statusConfig.corBorda}`}>
                  {statusConfig.icone} {statusConfig.label}
                </span>
              </div>
              <p className="text-sm text-slate-500">
                {SEGMENTO_LABELS[cliente.segmento]} · {PORTE_LABELS[cliente.porte]} · Cliente há {mesesAtivo} meses
              </p>
            </div>
            <div className="flex items-center gap-2 flex-none">
              <div className="relative">
                <button
                  onClick={() => setShowStatusMenu(!showStatusMenu)}
                  className="flex items-center gap-1 text-xs border border-slate-200 px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Alterar status <ChevronDown size={12} />
                </button>
                {showStatusMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-10 w-40">
                    {(Object.keys(STATUS_CLIENTE_CONFIG) as StatusCliente[]).map((s) => {
                      const cfg = STATUS_CLIENTE_CONFIG[s]
                      return (
                        <button
                          key={s}
                          disabled={s === cliente.status}
                          onClick={() => {
                            onUpdateStatus(cliente.id, s)
                            setShowStatusMenu(false)
                          }}
                          className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 transition-colors ${s === cliente.status ? 'opacity-40 cursor-default' : cfg.cor}`}
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

          {/* KPIs rápidos */}
          <div className="grid grid-cols-4 gap-3 mt-4">
            <MiniKpi label="MRR" value={mrr > 0 ? formatarMoeda(mrr) : '—'} icon={<TrendingUp size={13} className="text-emerald-500" />} />
            <MiniKpi label="LTV acumulado" value={ltv > 0 ? formatarMoeda(ltv) : '—'} icon={<Star size={13} className="text-amber-500" />} />
            <MiniKpi label="Serviços ativos" value={String(totalServicos.length)} icon={<Package size={13} className="text-blue-500" />} />
            <MiniKpi label="NPS" value={cliente.nps !== undefined ? `${cliente.nps}/10` : '—'} icon={<Star size={13} className="text-violet-500" />} />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-6">
          {([
            ['perfil', `Perfil & Contatos`],
            ['contratos', `Contratos (${contratos.length})`],
            ['entregas', `Entregas (${entregas.length})`],
          ] as [Tab, string][]).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* TAB: PERFIL */}
          {tab === 'perfil' && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {cliente.cnpj && <InfoRow icon={<Building2 size={14} />} label="CNPJ" value={cliente.cnpj} />}
                {cliente.site && <InfoRow icon={<Globe size={14} />} label="Site" value={cliente.site} />}
                {cliente.cidade && <InfoRow icon={<MapPin size={14} />} label="Localização" value={`${cliente.cidade} — ${cliente.estado}`} />}
                <InfoRow icon={<Calendar size={14} />} label="Início do contrato" value={formatarData(cliente.data_inicio)} />
                {cliente.data_fim && <InfoRow icon={<Calendar size={14} />} label="Término previsto" value={formatarData(cliente.data_fim)} />}
                {responsavel && (
                  <InfoRow
                    icon={<span className={`w-4 h-4 rounded-full text-white text-xs flex items-center justify-center ${responsavel.cor}`}>{responsavel.iniciais[0]}</span>}
                    label="Account Manager"
                    value={responsavel.nome}
                  />
                )}
              </div>

              {cliente.observacoes && (
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Observações</p>
                  <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 border border-slate-100">{cliente.observacoes}</p>
                </div>
              )}

              {(cliente.motivo_risco || cliente.motivo_pausa || cliente.motivo_encerramento) && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs font-bold text-red-600 mb-1 uppercase tracking-wide">
                    {cliente.status === 'em_risco' ? 'Motivo do risco' : cliente.status === 'pausado' ? 'Motivo da pausa' : 'Motivo do encerramento'}
                  </p>
                  <p className="text-sm text-red-700">{cliente.motivo_risco ?? cliente.motivo_pausa ?? cliente.motivo_encerramento}</p>
                </div>
              )}

              {/* Contatos */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Contatos</p>
                  <span className="flex items-center gap-1 text-xs text-slate-400"><Users size={12} /> {contatos.length} contato{contatos.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="space-y-2">
                  {contatos.map((ct) => (
                    <div key={ct.id} className={`flex items-start gap-3 p-3 rounded-lg border ${ct.principal ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-100'}`}>
                      <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center text-xs font-bold text-slate-600 flex-none">
                        {ct.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-800">{ct.nome}</p>
                          {ct.principal && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">Principal</span>}
                        </div>
                        <p className="text-xs text-slate-500">{CARGO_LABELS[ct.cargo]}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <a href={`mailto:${ct.email}`} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                            <Mail size={11} /> {ct.email}
                          </a>
                          {ct.whatsapp && (
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                              <Phone size={11} /> {ct.whatsapp}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Conexões com outros módulos */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Conexões do sistema</p>
                <div className="grid grid-cols-2 gap-2">
                  <ConexaoCard modulo="Operacional" descricao="Projetos e tarefas" cor="blue" ativo={cliente.status === 'ativo'} />
                  <ConexaoCard modulo="Financeiro" descricao="Faturamento e NFs" cor="emerald" ativo={cliente.status !== 'encerrado'} />
                </div>
              </div>
            </div>
          )}

          {/* TAB: CONTRATOS */}
          {tab === 'contratos' && (
            <div className="p-6 space-y-4">
              {contratos.map((k) => {
                const servicos = CATALOGO_SERVICOS.filter((s) => k.servico_ids.includes(s.id))
                const kConfig = STATUS_CLIENTE_CONFIG[k.status === 'ativo' ? 'ativo' : k.status === 'encerrado' ? 'encerrado' : 'pausado']
                return (
                  <div key={k.id} className={`rounded-xl border p-4 ${k.status === 'encerrado' ? 'opacity-60' : ''}`}>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <p className="font-semibold text-slate-800">{k.descricao}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {TIPO_CLIENTE_CONFIG[k.tipo].label} · {formatarData(k.data_inicio)}
                          {k.data_fim ? ` → ${formatarData(k.data_fim)}` : ' · Sem data de término'}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border flex-none ${kConfig.corBg} ${kConfig.cor} ${kConfig.corBorda}`}>
                        {kConfig.label}
                      </span>
                    </div>

                    {/* Valor */}
                    <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 mb-3">
                      {k.valor_mensal && (
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-bold text-emerald-700">{formatarMoeda(k.valor_mensal)}</span>
                          <span className="text-sm text-emerald-600">/mês</span>
                          {k.valor_base && <span className="text-xs text-slate-400 ml-2">(Base: {formatarMoeda(k.valor_base)} + variável)</span>}
                        </div>
                      )}
                      {k.valor_total && !k.valor_mensal && (
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-bold text-emerald-700">{formatarMoeda(k.valor_total)}</span>
                          <span className="text-sm text-emerald-600">total do projeto</span>
                        </div>
                      )}
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-emerald-600">{k.revisoes_incluidas} revisão{k.revisoes_incluidas !== 1 ? 'ões' : ''} incluída{k.revisoes_incluidas !== 1 ? 's' : ''}</span>
                        {k.duracao_meses && <span className="text-xs text-emerald-600">{k.duracao_meses} meses de duração</span>}
                      </div>
                    </div>

                    {/* Serviços */}
                    <div>
                      <p className="text-xs font-semibold text-slate-400 mb-2">Serviços incluídos</p>
                      <div className="flex flex-wrap gap-1.5">
                        {servicos.map((s) => (
                          <span key={s.id} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full border border-slate-200">
                            {CATEGORIA_SERVICO_LABELS[s.categoria]} · {s.nome.split('(')[0].trim()}
                          </span>
                        ))}
                      </div>
                    </div>

                    {k.observacoes && (
                      <p className="text-xs text-slate-500 bg-slate-50 rounded px-3 py-2 mt-3 border border-slate-100">
                        {k.observacoes}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* TAB: ENTREGAS */}
          {tab === 'entregas' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-slate-700">Histórico de entregas</p>
                <button
                  onClick={() => setShowAddEntrega(true)}
                  className="flex items-center gap-1 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus size={13} /> Registrar entrega
                </button>
              </div>

              {showAddEntrega && (
                <AddEntregaForm
                  clienteId={cliente.id}
                  contratos={contratos}
                  onSave={(data) => { onAddEntrega(data); setShowAddEntrega(false) }}
                  onCancel={() => setShowAddEntrega(false)}
                />
              )}

              {/* Resumo de status */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[
                  { status: 'aprovado', label: 'Aprovados', cor: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { status: 'em_revisao', label: 'Em revisão', cor: 'text-amber-600', bg: 'bg-amber-50' },
                  { status: 'entregue', label: 'Aguardando', cor: 'text-blue-600', bg: 'bg-blue-50' },
                  { status: 'rejeitado', label: 'Rejeitados', cor: 'text-red-600', bg: 'bg-red-50' },
                ].map(({ status, label, cor, bg }) => (
                  <div key={status} className={`${bg} rounded-lg p-2 text-center`}>
                    <p className={`text-lg font-bold ${cor}`}>
                      {entregas.filter((e) => e.status === status).length}
                    </p>
                    <p className="text-xs text-slate-500">{label}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                {entregas.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-8">Nenhuma entrega registrada ainda.</p>
                )}
                {entregas.map((e) => (
                  <EntregaItem key={e.id} entrega={e} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function EntregaItem({ entrega }: { entrega: EntregaHistorico }) {
  const STATUS_ICON = {
    aprovado: <CheckCircle2 size={15} className="text-emerald-500" />,
    em_revisao: <Clock size={15} className="text-amber-500" />,
    entregue: <Clock size={15} className="text-blue-500" />,
    rejeitado: <XCircle size={15} className="text-red-500" />,
  }
  const STATUS_COR = {
    aprovado: 'text-emerald-700 bg-emerald-50 border-emerald-100',
    em_revisao: 'text-amber-700 bg-amber-50 border-amber-100',
    entregue: 'text-blue-700 bg-blue-50 border-blue-100',
    rejeitado: 'text-red-700 bg-red-50 border-red-100',
  }

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="flex items-start gap-3 p-3">
        <div className="flex-none mt-0.5">{STATUS_ICON[entrega.status]}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-sm font-semibold text-slate-800">{entrega.titulo}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full border flex-none ${STATUS_COR[entrega.status]}`}>
              {entrega.status === 'aprovado' ? 'Aprovado' : entrega.status === 'em_revisao' ? 'Em revisão' : entrega.status === 'entregue' ? 'Aguardando' : 'Rejeitado'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-1">
            {TIPO_ENTREGA_LABELS[entrega.tipo]} · {entrega.competencia} · por {entrega.responsavel_nome}
          </p>
          {entrega.descricao && <p className="text-xs text-slate-600">{entrega.descricao}</p>}
          {entrega.feedback && (
            <div className="mt-2 bg-slate-50 border border-slate-100 rounded px-2 py-1.5">
              <p className="text-xs text-slate-500 italic">"{entrega.feedback}"</p>
            </div>
          )}
        </div>
      </div>
      {/* Revisões */}
      <div className="px-3 pb-2 flex items-center gap-2">
        <div className="flex gap-1">
          {Array.from({ length: entrega.revisoes_max }).map((_, i) => (
            <div key={i} className={`w-3 h-1 rounded-full ${i < entrega.revisoes_usadas ? 'bg-orange-400' : 'bg-slate-200'}`} />
          ))}
        </div>
        <p className="text-xs text-slate-400">
          {entrega.revisoes_usadas}/{entrega.revisoes_max} revisões usadas
          {entrega.revisoes_usadas >= entrega.revisoes_max && ' ⚠️ Limite atingido'}
        </p>
        <p className="text-xs text-slate-400 ml-auto">{formatarDataHora(entrega.data_entrega)}</p>
      </div>
    </div>
  )
}

function MiniKpi({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
      <div className="flex items-center gap-1 mb-0.5">{icon}<p className="text-xs text-slate-400">{label}</p></div>
      <p className="text-sm font-bold text-slate-700">{value}</p>
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400 mb-0.5 flex items-center gap-1">{icon} {label}</p>
      <p className="text-sm font-medium text-slate-700">{value}</p>
    </div>
  )
}

function ConexaoCard({ modulo, descricao, cor, ativo }: { modulo: string; descricao: string; cor: string; ativo: boolean }) {
  const corMap: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-100 text-blue-700',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
  }
  return (
    <div className={`rounded-lg border p-3 ${corMap[cor]} ${!ativo ? 'opacity-40' : ''}`}>
      <p className="text-xs font-bold">{modulo}</p>
      <p className="text-xs opacity-70">{descricao}</p>
      <p className="text-xs mt-1 font-medium">{ativo ? '● Conectado' : '○ Inativo'}</p>
    </div>
  )
}

function AddEntregaForm({
  clienteId, contratos, onSave, onCancel,
}: {
  clienteId: string
  contratos: Contrato[]
  onSave: (data: Omit<EntregaHistorico, 'id'>) => void
  onCancel: () => void
}) {
  const [titulo, setTitulo] = useState('')
  const [tipo, setTipo] = useState<EntregaHistorico['tipo']>('relatorio_mensal')
  const [descricao, setDescricao] = useState('')
  const [competencia, setCompetencia] = useState(new Date().toISOString().slice(0, 7))
  const [revisoes_max, setRevisoesMax] = useState(2)
  const [contrato_id, setContratoId] = useState(contratos[0]?.id ?? '')

  function handleSave() {
    if (!titulo) return
    onSave({
      cliente_id: clienteId,
      contrato_id: contrato_id || undefined,
      titulo, tipo, descricao: descricao || undefined,
      competencia, data_entrega: new Date().toISOString(),
      status: 'entregue', revisoes_usadas: 0, revisoes_max,
      responsavel_nome: 'Você',
    })
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 space-y-3">
      <p className="text-xs font-semibold text-blue-700">Registrar nova entrega</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Tipo</label>
          <select value={tipo} onChange={(e) => setTipo(e.target.value as typeof tipo)} className={inputCls}>
            {Object.entries(TIPO_ENTREGA_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Competência</label>
          <input type="month" value={competencia} onChange={(e) => setCompetencia(e.target.value)} className={inputCls} />
        </div>
      </div>
      <div>
        <label className="text-xs text-slate-500 mb-1 block">Título *</label>
        <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Relatório de Performance — Abril/2026" className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Contrato</label>
          <select value={contrato_id} onChange={(e) => setContratoId(e.target.value)} className={inputCls}>
            {contratos.map((k) => <option key={k.id} value={k.id}>{k.descricao}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Revisões incluídas</label>
          <input type="number" min={0} max={5} value={revisoes_max} onChange={(e) => setRevisoesMax(parseInt(e.target.value))} className={inputCls} />
        </div>
      </div>
      <div>
        <label className="text-xs text-slate-500 mb-1 block">Descrição</label>
        <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2} placeholder="O que foi entregue?" className={`${inputCls} resize-none`} />
      </div>
      <div className="flex gap-2">
        <button onClick={handleSave} className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 font-medium">Salvar</button>
        <button onClick={onCancel} className="text-sm text-slate-500 px-4 py-1.5 rounded-lg hover:bg-slate-100">Cancelar</button>
      </div>
    </div>
  )
}

const inputCls = 'w-full text-sm text-slate-900 border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'
