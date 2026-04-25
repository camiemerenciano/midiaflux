'use client'

import { useState, useMemo } from 'react'
import { useOperacaoStore } from '@/lib/operacao/store'
import { useEquipeStore } from '@/lib/equipe/store'
import { calcularCarregamento, corUtilizacao } from '@/lib/equipe/calculos'
import { CarregamentoMembro } from '@/lib/equipe/types'
import { USUARIOS } from '@/lib/crm/constants'
import { MembroModal } from '@/components/equipe/MembroModal'
import { formatarMoeda } from '@/lib/crm/score'
import {
  Users, AlertTriangle, CheckCircle2, Clock,
  TrendingUp, Activity, BarChart3, ChevronRight,
} from 'lucide-react'

type Aba = 'visao_geral' | 'distribuicao' | 'performance'

export default function EquipePage() {
  const { tarefas } = useOperacaoStore()
  const { perfis, getPerfil } = useEquipeStore()
  const [membroSelecionado, setMembroSelecionado] = useState<CarregamentoMembro | null>(null)
  const [aba, setAba] = useState<Aba>('visao_geral')

  const carregamento = useMemo(() => calcularCarregamento(tarefas, perfis), [tarefas, perfis])

  const totalAtivas   = carregamento.reduce((s, m) => s + m.tarefas_ativas, 0)
  const totalAtrasadas = carregamento.reduce((s, m) => s + m.tarefas_atrasadas, 0)
  const membroSobrecarregado = carregamento.filter(m => m.utilizacao_pct > 85)
  const utilizacaoMedia = carregamento.length > 0
    ? Math.round(carregamento.reduce((s, m) => s + m.utilizacao_pct, 0) / carregamento.length)
    : 0

  return (
    <div className="flex flex-col h-screen bg-slate-50">

      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex-none">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Gestão do Time</h1>
            <p className="text-sm text-slate-500">{USUARIOS.length} membros · Capacidade total: {USUARIOS.length * 160}h/mês</p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <KpiCard icon={<Activity size={15} className="text-blue-500" />}
            label="Utilização média" valor={`${utilizacaoMedia}%`}
            sub="da capacidade do time"
            cor={utilizacaoMedia > 85 ? 'red' : utilizacaoMedia >= 60 ? 'blue' : 'amber'} />
          <KpiCard icon={<Clock size={15} className="text-violet-500" />}
            label="Tarefas ativas" valor={String(totalAtivas)}
            sub="em andamento agora" cor="violet" />
          <KpiCard icon={<AlertTriangle size={15} className={totalAtrasadas > 0 ? 'text-red-500' : 'text-emerald-500'} />}
            label="Atrasadas" valor={String(totalAtrasadas)}
            sub={totalAtrasadas === 0 ? 'Tudo no prazo ✓' : 'requer atenção'}
            cor={totalAtrasadas > 0 ? 'red' : 'emerald'}
            alerta={totalAtrasadas > 0} />
          <KpiCard icon={<AlertTriangle size={15} className={membroSobrecarregado.length > 0 ? 'text-amber-500' : 'text-emerald-500'} />}
            label="Em sobrecarga" valor={String(membroSobrecarregado.length)}
            sub={membroSobrecarregado.length > 0 ? membroSobrecarregado.map(m => m.nome).join(', ') : 'Ninguém sobrecarregado'}
            cor={membroSobrecarregado.length > 0 ? 'amber' : 'emerald'}
            alerta={membroSobrecarregado.length > 0} />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 -mb-4 -mx-6 px-6">
          {([
            ['visao_geral', 'Visão Geral'],
            ['distribuicao', 'Distribuição de Tarefas'],
            ['performance', 'Performance'],
          ] as [Aba, string][]).map(([a, l]) => (
            <button key={a} onClick={() => setAba(a)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${aba === a ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">

        {/* ── VISÃO GERAL ─────────────────────────────────────────────── */}
        {aba === 'visao_geral' && (
          <div className="space-y-4">
            {membroSobrecarregado.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                <AlertTriangle size={15} className="text-amber-600 mt-0.5 flex-none" />
                <p className="text-sm text-amber-800">
                  <strong>{membroSobrecarregado.map(m => m.nome).join(' e ')}</strong> {membroSobrecarregado.length === 1 ? 'está' : 'estão'} com carga acima de 85%. Redistribua tarefas para equilibrar o time.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {carregamento.map(membro => (
                <MembroCard key={membro.usuario_id} membro={membro}
                  tarefas={tarefas.filter(t => t.responsavel_id === membro.usuario_id)}
                  onClick={() => setMembroSelecionado(membro)} />
              ))}
            </div>

            {/* Comparativo de carga */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Carga comparativa — horas alocadas vs disponíveis</p>
              <div className="space-y-4">
                {carregamento.map(m => {
                  const cores = corUtilizacao(m.utilizacao_pct)
                  return (
                    <div key={m.usuario_id}>
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full ${m.cor} flex items-center justify-center text-white text-xs font-bold`}>{m.iniciais}</div>
                          <div>
                            <p className="font-medium text-slate-800">{m.nome}</p>
                            <p className="text-xs text-slate-400">{m.cargo}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${cores.texto}`}>{m.utilizacao_pct}%</p>
                          <p className="text-xs text-slate-400">{m.horas_alocadas}h / {m.horas_disponiveis}h</p>
                        </div>
                      </div>
                      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${cores.barra}`}
                          style={{ width: `${Math.min(m.utilizacao_pct, 100)}%` }} />
                      </div>
                      {m.utilizacao_pct > 85 && (
                        <p className="text-xs text-red-500 mt-1">⚠️ Sobrecarga — mover tarefas para liberar {m.horas_alocadas - Math.round(m.horas_disponiveis * 0.8)}h</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── DISTRIBUIÇÃO ─────────────────────────────────────────────── */}
        {aba === 'distribuicao' && (
          <div className="max-w-3xl space-y-6">

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
                <p className="text-sm font-bold text-slate-700">Como distribuir tarefas</p>
                <p className="text-xs text-slate-500 mt-0.5">Princípios para equilibrar carga e manter qualidade</p>
              </div>
              <div className="divide-y divide-slate-100">
                {[
                  {
                    titulo: '1. Verifique a carga antes de atribuir',
                    descricao: 'Antes de criar qualquer tarefa, olhe o percentual de utilização do time. Quem está abaixo de 65% tem folga. Quem está acima de 80% não deveria receber mais.',
                    icone: '📊',
                  },
                  {
                    titulo: '2. Distribua por especialidade, não por disponibilidade',
                    descricao: 'Atribuir uma tarefa de design para quem está vago mas não é designer cria retrabalho. Priorize a especialidade e depois verifique a carga.',
                    icone: '🎯',
                  },
                  {
                    titulo: '3. Limite de tarefas simultâneas por pessoa',
                    descricao: 'Ninguém entrega bem com mais de 5–6 tarefas ativas ao mesmo tempo. Se um membro já tem esse número, a nova tarefa vai para backlog ou redistribuição.',
                    icone: '⚡',
                  },
                  {
                    titulo: '4. Estimativa de horas antes de iniciar',
                    descricao: 'Sempre preencha as horas estimadas ao criar a tarefa. Sem estimativa, é impossível saber se o time tem capacidade antes de se comprometer com o cliente.',
                    icone: '⏱️',
                  },
                  {
                    titulo: '5. Revisão semanal de distribuição',
                    descricao: 'Segunda-feira: abrir este painel, ver quem está sobrecarregado, redistribuir tarefas que estão em backlog e ajustar prioridades da semana.',
                    icone: '📅',
                  },
                ].map(item => (
                  <div key={item.titulo} className="flex gap-4 px-5 py-4">
                    <span className="text-xl flex-none">{item.icone}</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-700 mb-1">{item.titulo}</p>
                      <p className="text-sm text-slate-500">{item.descricao}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
                <p className="text-sm font-bold text-slate-700">Como evitar sobrecarga</p>
                <p className="text-xs text-slate-500 mt-0.5">Sinais de alerta e ações preventivas</p>
              </div>
              <div className="divide-y divide-slate-100">
                {[
                  {
                    sinal: 'Utilização > 85%',
                    risco: 'Qualidade cai, burnout, prazo estourado',
                    acao: 'Mover tarefas de menor urgência para outro membro ou para a semana seguinte. Nunca adicionar novas tarefas.',
                    cor: 'red',
                  },
                  {
                    sinal: 'Mais de 5 tarefas ativas',
                    risco: 'Atenção dividida, erros e retrabalho',
                    acao: 'Priorizar as 3 mais urgentes e colocar as demais em backlog até que uma seja concluída.',
                    cor: 'amber',
                  },
                  {
                    sinal: '2+ tarefas atrasadas',
                    risco: 'Efeito cascata — cada atraso gera outro',
                    acao: 'Parar de aceitar novas tarefas até zerar o atraso. Comunicar ao cliente e negociar prazo.',
                    cor: 'red',
                  },
                  {
                    sinal: 'Eficiência consistentemente < 70%',
                    risco: 'Tarefas custando mais do que o contrato prevê',
                    acao: 'Revisar estimativas, simplificar escopo ou reajustar preço na renovação do contrato.',
                    cor: 'amber',
                  },
                  {
                    sinal: 'Utilização < 40%',
                    risco: 'Ociosidade — receita sem uso de capacidade',
                    acao: 'Verificar se há backlog represado, prospectar novos projetos ou investir em capacitação.',
                    cor: 'blue',
                  },
                ].map(item => (
                  <div key={item.sinal} className="flex gap-4 px-5 py-4">
                    <div className={`w-2 flex-none mt-1 rounded-full self-start h-2 ${item.cor === 'red' ? 'bg-red-400' : item.cor === 'amber' ? 'bg-amber-400' : 'bg-blue-400'}`} />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-slate-700">{item.sinal}</p>
                        <ChevronRight size={12} className="text-slate-300" />
                        <p className="text-xs text-slate-400">{item.risco}</p>
                      </div>
                      <p className="text-sm text-slate-500">→ {item.acao}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <p className="text-sm font-bold text-blue-800 mb-3">Regra de ouro da capacidade</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { faixa: '< 40%', label: 'Ocioso', desc: 'Buscar mais projetos ou realocar', cor: 'bg-slate-100 text-slate-600' },
                  { faixa: '65–80%', label: 'Ideal', desc: 'Zona saudável de produtividade', cor: 'bg-emerald-100 text-emerald-700' },
                  { faixa: '> 85%', label: 'Sobrecarga', desc: 'Redistribuir imediatamente', cor: 'bg-red-100 text-red-700' },
                ].map(f => (
                  <div key={f.faixa} className={`rounded-xl px-3 py-3 ${f.cor}`}>
                    <p className="text-lg font-bold">{f.faixa}</p>
                    <p className="text-xs font-semibold">{f.label}</p>
                    <p className="text-xs mt-1 opacity-80">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── PERFORMANCE ──────────────────────────────────────────────── */}
        {aba === 'performance' && (
          <div className="space-y-4 max-w-4xl">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Membro</th>
                    <th className="text-center text-xs font-semibold text-slate-500 px-3 py-3">Utilização</th>
                    <th className="text-center text-xs font-semibold text-slate-500 px-3 py-3">SLA Entrega</th>
                    <th className="text-center text-xs font-semibold text-slate-500 px-3 py-3">Eficiência</th>
                    <th className="text-center text-xs font-semibold text-slate-500 px-3 py-3">Concluídas</th>
                    <th className="text-center text-xs font-semibold text-slate-500 px-3 py-3">Atrasadas</th>
                    <th className="text-center text-xs font-semibold text-slate-500 px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {carregamento.map(m => {
                    const cores = corUtilizacao(m.utilizacao_pct)
                    const statusGeral = m.tarefas_atrasadas > 0 ? '🔴 Atenção'
                      : m.utilizacao_pct > 85 ? '🟡 Sobrecarga'
                      : m.sla_pct !== null && m.sla_pct >= 85 ? '🟢 Ótimo'
                      : '🔵 Normal'
                    return (
                      <tr key={m.usuario_id} className="hover:bg-slate-50 cursor-pointer"
                        onClick={() => setMembroSelecionado(m)}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-full ${m.cor} flex items-center justify-center text-white text-xs font-bold`}>{m.iniciais}</div>
                            <div>
                              <p className="font-semibold text-slate-800">{m.nome}</p>
                              <p className="text-xs text-slate-400">{m.cargo}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <p className={`font-bold ${cores.texto}`}>{m.utilizacao_pct}%</p>
                          <p className="text-xs text-slate-400">{m.horas_alocadas}h/{m.horas_disponiveis}h</p>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <p className={`font-bold ${m.sla_pct !== null ? (m.sla_pct >= 85 ? 'text-emerald-600' : m.sla_pct >= 70 ? 'text-amber-600' : 'text-red-600') : 'text-slate-300'}`}>
                            {m.sla_pct !== null ? `${m.sla_pct}%` : '—'}
                          </p>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <p className={`font-bold ${m.eficiencia_pct !== null ? (m.eficiencia_pct >= 90 ? 'text-emerald-600' : 'text-amber-600') : 'text-slate-300'}`}>
                            {m.eficiencia_pct !== null ? `${m.eficiencia_pct}%` : '—'}
                          </p>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <p className="font-bold text-slate-700">{m.tarefas_concluidas}</p>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <p className={`font-bold ${m.tarefas_atrasadas > 0 ? 'text-red-600' : 'text-slate-300'}`}>
                            {m.tarefas_atrasadas}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-xs">{statusGeral}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Como medir performance de forma justa</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  { metrica: 'SLA de entrega', formula: 'Tarefas no prazo ÷ Total concluídas', meta: '≥ 85%', obs: 'Depende de estimativas corretas. SLA baixo pode ser problema de prazo, não de pessoa.' },
                  { metrica: 'Eficiência', formula: 'Horas estimadas ÷ Horas realizadas', meta: '85–110%', obs: 'Acima de 100% = entregou mais rápido que o previsto. Abaixo = tarefa tomou mais tempo.' },
                  { metrica: 'Utilização', formula: 'Horas alocadas ÷ Horas disponíveis', meta: '65–80%', obs: 'Alta utilização não é sinônimo de alta performance. Acima de 85% é sinal de sobrecarga.' },
                  { metrica: 'Tarefas atrasadas', formula: 'Contagem de tarefas vencidas em aberto', meta: '0', obs: 'Principal indicador de problemas operacionais. Investigar causa raiz antes de cobrar.' },
                ].map(m => (
                  <div key={m.metrica} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <p className="font-semibold text-slate-700 mb-1">{m.metrica}</p>
                    <p className="text-xs text-slate-500 font-mono mb-1">{m.formula}</p>
                    <p className="text-xs text-blue-600 font-semibold">Meta: {m.meta}</p>
                    <p className="text-xs text-slate-400 mt-1">{m.obs}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal do membro */}
      {membroSelecionado && (
        <MembroModal
          membro={membroSelecionado}
          perfil={getPerfil(membroSelecionado.usuario_id)!}
          tarefas={tarefas}
          onClose={() => setMembroSelecionado(null)}
        />
      )}
    </div>
  )
}

function MembroCard({ membro, tarefas, onClick }: {
  membro: CarregamentoMembro
  tarefas: any[]
  onClick: () => void
}) {
  const cores = corUtilizacao(membro.utilizacao_pct)
  const tarefasAtrasadas = membro.tarefas_atrasadas > 0

  return (
    <div onClick={onClick}
      className="bg-white rounded-xl border border-slate-200 p-5 cursor-pointer hover:shadow-md transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl ${membro.cor} flex items-center justify-center text-white text-lg font-bold group-hover:scale-105 transition-transform`}>
            {membro.iniciais}
          </div>
          <div>
            <p className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{membro.nome}</p>
            <p className="text-xs text-slate-400">{membro.cargo}</p>
          </div>
        </div>
        {tarefasAtrasadas && (
          <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full font-medium">
            ⚠️ {membro.tarefas_atrasadas} atraso{membro.tarefas_atrasadas > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Barra de carga */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-400">Carga de trabalho</span>
          <span className={`font-bold ${cores.texto}`}>{membro.utilizacao_pct}%</span>
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${cores.barra}`}
            style={{ width: `${Math.min(membro.utilizacao_pct, 100)}%` }} />
        </div>
        <p className="text-xs text-slate-400 mt-1">{membro.horas_alocadas}h alocadas de {membro.horas_disponiveis}h disponíveis</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { label: 'Ativas', valor: membro.tarefas_ativas, cor: 'text-blue-600' },
          { label: 'Concluídas', valor: membro.tarefas_concluidas, cor: 'text-emerald-600' },
          { label: 'SLA', valor: membro.sla_pct !== null ? `${membro.sla_pct}%` : '—',
            cor: membro.sla_pct !== null ? (membro.sla_pct >= 85 ? 'text-emerald-600' : 'text-amber-600') : 'text-slate-300' },
        ].map(m => (
          <div key={m.label} className="text-center bg-slate-50 rounded-lg py-2">
            <p className={`text-base font-bold ${m.cor}`}>{m.valor}</p>
            <p className="text-xs text-slate-400">{m.label}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-400 text-center">Clique para ver detalhes →</p>
    </div>
  )
}

function KpiCard({ icon, label, valor, sub, cor, alerta = false }: {
  icon: React.ReactNode; label: string; valor: string; sub: string; cor: string; alerta?: boolean
}) {
  const corMap: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-100', red: 'bg-red-50 border-red-100',
    emerald: 'bg-emerald-50 border-emerald-100', amber: 'bg-amber-50 border-amber-100',
    violet: 'bg-violet-50 border-violet-100',
  }
  return (
    <div className={`rounded-xl border p-3 ${corMap[cor]} ${alerta ? 'ring-1 ring-red-200' : ''}`}>
      <div className="flex items-center gap-2 mb-1">{icon}<span className="text-xs text-slate-500">{label}</span></div>
      <p className="text-lg font-bold text-slate-800">{valor}</p>
      <p className="text-xs text-slate-400 mt-0.5 truncate">{sub}</p>
    </div>
  )
}
