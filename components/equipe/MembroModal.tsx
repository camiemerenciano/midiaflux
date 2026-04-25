'use client'

import { useState } from 'react'
import { CarregamentoMembro } from '@/lib/equipe/types'
import { MembroPerfil } from '@/lib/equipe/types'
import { useEquipeStore } from '@/lib/equipe/store'
import { corUtilizacao } from '@/lib/equipe/calculos'
import { Tarefa } from '@/lib/operacao/types'
import { STATUS_TAREFA_CONFIG, TIPO_TAREFA_CONFIG } from '@/lib/operacao/constants'
import { formatarData } from '@/lib/crm/score'
import {
  X, Plus, Trash2, CheckCircle2, AlertTriangle,
  Clock, Edit3, Save, BarChart3,
} from 'lucide-react'

type Tab = 'perfil' | 'tarefas' | 'performance'

interface Props {
  membro: CarregamentoMembro
  perfil: MembroPerfil
  tarefas: Tarefa[]
  onClose: () => void
}

export function MembroModal({ membro, perfil, tarefas, onClose }: Props) {
  const { updatePerfil } = useEquipeStore()
  const [tab, setTab] = useState<Tab>('perfil')
  const [editando, setEditando] = useState(false)

  const [form, setForm] = useState({
    cargo: perfil.cargo,
    horas_disponiveis_mes: perfil.horas_disponiveis_mes,
    observacoes: perfil.observacoes ?? '',
    especialidades: [...perfil.especialidades],
    responsabilidades: [...perfil.responsabilidades],
    novaEspecialidade: '',
    novaResponsabilidade: '',
    data_entrada: perfil.data_entrada,
  })

  const cores = corUtilizacao(membro.utilizacao_pct)

  function salvar() {
    updatePerfil(membro.usuario_id, {
      cargo: form.cargo,
      horas_disponiveis_mes: form.horas_disponiveis_mes,
      observacoes: form.observacoes || undefined,
      especialidades: form.especialidades,
      responsabilidades: form.responsabilidades,
      data_entrada: form.data_entrada,
    })
    setEditando(false)
  }

  function addEspecialidade() {
    if (!form.novaEspecialidade.trim()) return
    setForm(f => ({ ...f, especialidades: [...f.especialidades, f.novaEspecialidade.trim()], novaEspecialidade: '' }))
  }
  function removeEspecialidade(i: number) {
    setForm(f => ({ ...f, especialidades: f.especialidades.filter((_, idx) => idx !== i) }))
  }
  function addResponsabilidade() {
    if (!form.novaResponsabilidade.trim()) return
    setForm(f => ({ ...f, responsabilidades: [...f.responsabilidades, f.novaResponsabilidade.trim()], novaResponsabilidade: '' }))
  }
  function removeResponsabilidade(i: number) {
    setForm(f => ({ ...f, responsabilidades: f.responsabilidades.filter((_, idx) => idx !== i) }))
  }

  const tarefasAtivas = tarefas.filter(t => !['concluido', 'backlog'].includes(t.status) && t.responsavel_id === membro.usuario_id)
  const tarefasAtrasadas = tarefasAtivas.filter(t => new Date(t.data_prevista) < new Date())
  const tarefasConcluidas = tarefas.filter(t => t.status === 'concluido' && t.responsavel_id === membro.usuario_id)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${membro.cor} flex items-center justify-center text-white text-lg font-bold flex-none`}>
              {membro.iniciais}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-slate-800">{membro.nome}</h2>
              {editando
                ? <input value={form.cargo} onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))} className={inp} />
                : <p className="text-sm text-slate-500">{membro.cargo}</p>
              }
            </div>
            <div className="flex gap-2 flex-none">
              {tab === 'perfil' && (
                editando
                  ? <button onClick={salvar} className="flex items-center gap-1.5 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 font-medium">
                      <Save size={13} /> Salvar
                    </button>
                  : <button onClick={() => setEditando(true)} className="flex items-center gap-1.5 text-xs border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-50">
                      <Edit3 size={13} /> Editar
                    </button>
              )}
              <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Barra de carga */}
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-500">Carga de trabalho atual</span>
              <span className={`font-bold ${cores.texto}`}>{membro.utilizacao_pct}% utilizado</span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${cores.barra}`}
                style={{ width: `${Math.min(membro.utilizacao_pct, 100)}%` }} />
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>{membro.horas_alocadas}h alocadas</span>
              <span>{membro.horas_disponiveis}h disponíveis/mês</span>
            </div>
          </div>

          {/* Mini KPIs */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            <MiniKpi label="Ativas" valor={String(membro.tarefas_ativas)} cor="blue" />
            <MiniKpi label="Atrasadas" valor={String(membro.tarefas_atrasadas)}
              cor={membro.tarefas_atrasadas > 0 ? 'red' : 'emerald'} />
            <MiniKpi label="SLA" valor={membro.sla_pct !== null ? `${membro.sla_pct}%` : '—'}
              cor={membro.sla_pct !== null ? (membro.sla_pct >= 85 ? 'emerald' : membro.sla_pct >= 70 ? 'amber' : 'red') : 'slate'} />
            <MiniKpi label="Eficiência" valor={membro.eficiencia_pct !== null ? `${membro.eficiencia_pct}%` : '—'}
              cor={membro.eficiencia_pct !== null ? (membro.eficiencia_pct >= 90 ? 'emerald' : 'amber') : 'slate'} />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-6">
          {([['perfil', 'Perfil'], ['tarefas', `Tarefas (${tarefasAtivas.length})`], ['performance', 'Performance']] as [Tab, string][]).map(([t, l]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              {l}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">

          {/* TAB: PERFIL */}
          {tab === 'perfil' && (
            <div className="space-y-5">
              {editando && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Horas disponíveis/mês</label>
                    <input type="number" value={form.horas_disponiveis_mes}
                      onChange={e => setForm(f => ({ ...f, horas_disponiveis_mes: parseInt(e.target.value) || 160 }))}
                      className={inp} />
                  </div>
                  <div>
                    <label className={lbl}>Data de entrada</label>
                    <input type="date" value={form.data_entrada}
                      onChange={e => setForm(f => ({ ...f, data_entrada: e.target.value }))}
                      className={inp} />
                  </div>
                </div>
              )}

              {/* Especialidades */}
              <div>
                <p className={sectionLabel}>Especialidades</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.especialidades.map((e, i) => (
                    <span key={i} className="flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2.5 py-1 rounded-full">
                      {e}
                      {editando && (
                        <button onClick={() => removeEspecialidade(i)} className="text-blue-400 hover:text-red-500">
                          <X size={11} />
                        </button>
                      )}
                    </span>
                  ))}
                  {editando && (
                    <div className="flex gap-1">
                      <input value={form.novaEspecialidade}
                        onChange={e => setForm(f => ({ ...f, novaEspecialidade: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && addEspecialidade()}
                        placeholder="Nova especialidade..."
                        className="text-xs border border-slate-200 rounded-full px-3 py-1 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-400 w-40" />
                      <button onClick={addEspecialidade}
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full hover:bg-blue-200">
                        <Plus size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Responsabilidades */}
              <div>
                <p className={sectionLabel}>Responsabilidades</p>
                <div className="space-y-1.5 mt-2">
                  {form.responsabilidades.map((r, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 flex-none" />
                      <p className="flex-1 text-sm text-slate-700">{r}</p>
                      {editando && (
                        <button onClick={() => removeResponsabilidade(i)} className="text-slate-300 hover:text-red-500 flex-none">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                  {editando && (
                    <div className="flex gap-2 mt-2">
                      <input value={form.novaResponsabilidade}
                        onChange={e => setForm(f => ({ ...f, novaResponsabilidade: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && addResponsabilidade()}
                        placeholder="Nova responsabilidade..."
                        className={`${inp} flex-1`} />
                      <button onClick={addResponsabilidade}
                        className="px-3 py-2 bg-slate-100 rounded-lg hover:bg-slate-200 text-slate-600">
                        <Plus size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {editando && (
                <div>
                  <label className={lbl}>Observações</label>
                  <textarea value={form.observacoes}
                    onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
                    rows={3} placeholder="Notas sobre o membro da equipe..."
                    className={`${inp} resize-none`} />
                </div>
              )}

              {!editando && perfil.observacoes && (
                <div>
                  <p className={sectionLabel}>Observações</p>
                  <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 border border-slate-100 mt-2">{perfil.observacoes}</p>
                </div>
              )}

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Horas disponíveis/mês</span>
                  <span className="font-semibold text-slate-700">{perfil.horas_disponiveis_mes}h</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Membro desde</span>
                  <span className="font-semibold text-slate-700">{formatarData(perfil.data_entrada)}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB: TAREFAS */}
          {tab === 'tarefas' && (
            <div className="space-y-4">
              {tarefasAtrasadas.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2.5 border-b border-red-100">
                    <AlertTriangle size={14} className="text-red-600" />
                    <p className="text-xs font-bold text-red-700">Tarefas atrasadas</p>
                  </div>
                  {tarefasAtrasadas.map(t => <TarefaRow key={t.id} tarefa={t} />)}
                </div>
              )}

              <div>
                <p className={sectionLabel}>Em andamento ({tarefasAtivas.filter(t => !tarefasAtrasadas.includes(t)).length})</p>
                <div className="space-y-1.5 mt-2">
                  {tarefasAtivas.filter(t => !tarefasAtrasadas.includes(t)).map(t => <TarefaRow key={t.id} tarefa={t} />)}
                  {tarefasAtivas.filter(t => !tarefasAtrasadas.includes(t)).length === 0 && (
                    <p className="text-sm text-slate-400 py-4 text-center">Nenhuma tarefa ativa no prazo.</p>
                  )}
                </div>
              </div>

              {tarefasConcluidas.length > 0 && (
                <div>
                  <p className={sectionLabel}>Concluídas ({tarefasConcluidas.length})</p>
                  <div className="space-y-1.5 mt-2 opacity-60">
                    {tarefasConcluidas.slice(0, 5).map(t => <TarefaRow key={t.id} tarefa={t} />)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: PERFORMANCE */}
          {tab === 'performance' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <PerfCard
                  label="SLA de entrega"
                  valor={membro.sla_pct}
                  unidade="%"
                  descricao="Tarefas entregues no prazo"
                  meta={85}
                  cor={membro.sla_pct !== null ? (membro.sla_pct >= 85 ? 'emerald' : membro.sla_pct >= 70 ? 'amber' : 'red') : 'slate'}
                />
                <PerfCard
                  label="Eficiência"
                  valor={membro.eficiencia_pct}
                  unidade="%"
                  descricao="Estimado vs tempo real (>100% = mais rápido)"
                  meta={90}
                  cor={membro.eficiencia_pct !== null ? (membro.eficiencia_pct >= 90 ? 'emerald' : membro.eficiencia_pct >= 75 ? 'amber' : 'red') : 'slate'}
                />
                <PerfCard
                  label="Utilização"
                  valor={membro.utilizacao_pct}
                  unidade="%"
                  descricao="Horas alocadas vs disponíveis"
                  meta={75}
                  cor={membro.utilizacao_pct > 85 ? 'red' : membro.utilizacao_pct >= 65 ? 'emerald' : 'amber'}
                  metaLabel="Ideal: 65–80%"
                />
                <PerfCard
                  label="Tarefas concluídas"
                  valor={membro.tarefas_concluidas}
                  descricao="Total de tarefas finalizadas"
                  cor="blue"
                />
              </div>

              {membro.tarefas_concluidas === 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center">
                  <BarChart3 size={28} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Performance calculada conforme tarefas forem concluídas no módulo de Projetos.</p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-xs font-bold text-blue-700 mb-2">Como medir performance de forma justa</p>
                <div className="space-y-1.5 text-xs text-blue-700">
                  <p>• <strong>SLA</strong> mede compromisso com prazos — depende de estimativas corretas</p>
                  <p>• <strong>Eficiência</strong> mede previsibilidade — acima de 100% significa que entregou mais rápido que o previsto</p>
                  <p>• <strong>Utilização</strong> acima de 85% é sinal de sobrecarga, não de alta performance</p>
                  <p>• Combine sempre com qualidade percebida pelo cliente (NPS e feedbacks)</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TarefaRow({ tarefa }: { tarefa: Tarefa }) {
  const cfg = STATUS_TAREFA_CONFIG[tarefa.status]
  const tipo = TIPO_TAREFA_CONFIG[tarefa.tipo]
  const atrasada = tarefa.status !== 'concluido' && new Date(tarefa.data_prevista) < new Date()
  return (
    <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-xs ${atrasada ? 'bg-red-50 border-red-100' : 'bg-white border-slate-100'}`}>
      <span>{tipo.icone}</span>
      <p className={`flex-1 font-medium truncate ${tarefa.status === 'concluido' ? 'line-through text-slate-400' : 'text-slate-700'}`}>{tarefa.nome}</p>
      {tarefa.estimativa_horas && <span className="text-slate-400">{tarefa.estimativa_horas}h</span>}
      <span className={`px-2 py-0.5 rounded-full border flex-none ${cfg.corBg} ${cfg.cor} ${cfg.corBorda}`}>{cfg.label}</span>
      <span className={atrasada ? 'text-red-500 font-medium' : 'text-slate-400'}>{formatarData(tarefa.data_prevista)}</span>
    </div>
  )
}

function MiniKpi({ label, valor, cor }: { label: string; valor: string; cor: string }) {
  const corMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700', red: 'bg-red-50 text-red-700',
    emerald: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-700',
    slate: 'bg-slate-50 text-slate-500',
  }
  return (
    <div className={`rounded-lg p-2 text-center ${corMap[cor]}`}>
      <p className="text-sm font-bold">{valor}</p>
      <p className="text-xs opacity-70">{label}</p>
    </div>
  )
}

function PerfCard({ label, valor, unidade, descricao, meta, cor, metaLabel }: {
  label: string; valor: number | null; unidade?: string; descricao: string
  meta?: number; cor: string; metaLabel?: string
}) {
  const corMap: Record<string, string> = {
    emerald: 'bg-emerald-50 border-emerald-100', red: 'bg-red-50 border-red-100',
    amber: 'bg-amber-50 border-amber-100', blue: 'bg-blue-50 border-blue-100',
    slate: 'bg-slate-50 border-slate-200',
  }
  const textoMap: Record<string, string> = {
    emerald: 'text-emerald-700', red: 'text-red-700', amber: 'text-amber-700',
    blue: 'text-blue-700', slate: 'text-slate-400',
  }
  return (
    <div className={`rounded-xl border p-4 ${corMap[cor]}`}>
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold mb-1 ${textoMap[cor]}`}>
        {valor !== null ? `${valor}${unidade ?? ''}` : '—'}
      </p>
      <p className="text-xs text-slate-400">{descricao}</p>
      {meta && valor !== null && (
        <div className="mt-2">
          <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${textoMap[cor].replace('text-', 'bg-').replace('-700', '-500')}`}
              style={{ width: `${Math.min((valor / (meta * 1.3)) * 100, 100)}%` }} />
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{metaLabel ?? `Meta: ${meta}${unidade ?? ''}`}</p>
        </div>
      )}
    </div>
  )
}

const inp = 'w-full text-sm text-slate-900 border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'
const lbl = 'text-xs text-slate-500 mb-1 block'
const sectionLabel = 'text-xs font-bold text-slate-400 uppercase tracking-widest'
