'use client'

import { useState, useMemo } from 'react'
import { useFinanceiroStore } from '@/lib/financeiro/store'
import { Lancamento } from '@/lib/financeiro/types'
import {
  STATUS_LANCAMENTO_CONFIG,
  CATEGORIA_RECEITA_LABELS,
  CATEGORIA_CUSTO_LABELS,
  CATEGORIA_CUSTO_COR,
  competenciaLabel,
} from '@/lib/financeiro/constants'
import { formatarMoeda, formatarData } from '@/lib/crm/score'
import { useClientesStore } from '@/lib/clientes/store'
import { NovoLancamentoForm } from '@/components/financeiro/NovoLancamentoForm'
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  Plus, ChevronLeft, ChevronRight, DollarSign,
  Target, Clock, BarChart3,
} from 'lucide-react'

type Tab = 'visao_geral' | 'receitas' | 'custos' | 'forecast'

const COMPETENCIAS = ['2026-02', '2026-03', '2026-04', '2026-05', '2026-06']
const COMPETENCIA_ATUAL = '2026-04'

export default function FinanceiroPage() {
  const {
    lancamentos, getLancamentosByCompetencia,
    getResumoMensal, getResumoRange,
    getInadimplentes, getAlertasFinanceiros,
    marcarPago, marcarAtrasado, addLancamento,
  } = useFinanceiroStore()

  const { clientes } = useClientesStore()

  const [tab, setTab] = useState<Tab>('visao_geral')
  const [competencia, setCompetencia] = useState(COMPETENCIA_ATUAL)
  const [showNovoLancamento, setShowNovoLancamento] = useState(false)
  const [tipoNovo, setTipoNovo] = useState<'receita' | 'custo'>('receita')

  const resumo = useMemo(() => getResumoMensal(competencia), [competencia, lancamentos])
  const resumoAnterior = useMemo(() => {
    const idx = COMPETENCIAS.indexOf(competencia)
    return idx > 0 ? getResumoMensal(COMPETENCIAS[idx - 1]) : null
  }, [competencia, lancamentos])
  const resumoForecast = useMemo(() => getResumoRange(['2026-04', '2026-05', '2026-06']), [lancamentos])
  const inadimplentes = useMemo(() => getInadimplentes(), [lancamentos])
  const alertas = useMemo(() => getAlertasFinanceiros(), [lancamentos])

  const lancamentosMes = getLancamentosByCompetencia(competencia)
  const receitasMes = lancamentosMes.filter((l) => l.tipo === 'receita').sort((a, b) => {
    const o = { atrasado: 0, emitido: 1, previsto: 2, pago: 3, cancelado: 4 }
    return (o[a.status] ?? 5) - (o[b.status] ?? 5)
  })
  const custosMes = lancamentosMes.filter((l) => l.tipo === 'custo').sort((a, b) => b.valor - a.valor)

  // Custo por categoria
  const custosPorCategoria = custosMes.reduce((acc, l) => {
    acc[l.categoria] = (acc[l.categoria] ?? 0) + l.valor
    return acc
  }, {} as Record<string, number>)
  const totalCustoCateg = Object.values(custosPorCategoria).reduce((s, v) => s + v, 0)

  const metaAtingida = resumo.meta
    ? Math.round((resumo.receita_realizada / resumo.meta.meta_receita) * 100)
    : null

  function navCompetencia(dir: -1 | 1) {
    const idx = COMPETENCIAS.indexOf(competencia)
    const next = idx + dir
    if (next >= 0 && next < COMPETENCIAS.length) setCompetencia(COMPETENCIAS[next])
  }

  function deltaLabel(atual: number, anterior: number | null): React.ReactNode {
    if (!anterior || anterior === 0) return null
    const pct = Math.round(((atual - anterior) / anterior) * 100)
    const up = pct >= 0
    return (
      <span className={`text-xs font-medium flex items-center gap-0.5 ${up ? 'text-emerald-600' : 'text-red-600'}`}>
        {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
        {up ? '+' : ''}{pct}% vs mês ant.
      </span>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50">

      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Financeiro</h1>
            <p className="text-sm text-slate-500">Receitas, custos e previsão de faturamento</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setTipoNovo('custo'); setShowNovoLancamento(true) }}
              className="flex items-center gap-2 border border-red-200 text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 font-medium text-sm transition-colors">
              <Plus size={15} /> Custo
            </button>
            <button onClick={() => { setTipoNovo('receita'); setShowNovoLancamento(true) }}
              className="flex items-center gap-2 bg-emerald-600 text-white px-3 py-2 rounded-lg hover:bg-emerald-700 font-medium text-sm transition-colors shadow-sm">
              <Plus size={15} /> Receita
            </button>
          </div>
        </div>

        {/* Navegação de mês */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navCompetencia(-1)} disabled={COMPETENCIAS.indexOf(competencia) === 0}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <h2 className="text-base font-bold text-slate-700 min-w-[160px] text-center">
            {competenciaLabel(competencia)}
          </h2>
          <button onClick={() => navCompetencia(1)} disabled={COMPETENCIAS.indexOf(competencia) === COMPETENCIAS.length - 1}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 transition-colors">
            <ChevronRight size={16} />
          </button>
          {competencia !== COMPETENCIA_ATUAL && (
            <button onClick={() => setCompetencia(COMPETENCIA_ATUAL)}
              className="text-xs text-blue-600 hover:underline ml-1">Mês atual</button>
          )}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <KpiCard
            label="Receita realizada" valor={resumo.receita_realizada}
            sub={resumo.receita_prevista > 0 ? `+ ${formatarMoeda(resumo.receita_prevista)} previsto` : 'Nada previsto'}
            delta={deltaLabel(resumo.receita_realizada, resumoAnterior?.receita_realizada ?? null)}
            cor="emerald" icon={<TrendingUp size={15} className="text-emerald-500" />}
          />
          <KpiCard
            label="Custo total" valor={resumo.custo_total}
            sub={`${Math.round((resumo.custo_total / (resumo.receita_realizada || 1)) * 100)}% da receita`}
            delta={deltaLabel(resumo.custo_total, resumoAnterior?.custo_total ?? null)}
            cor="red" icon={<TrendingDown size={15} className="text-red-500" />}
          />
          <KpiCard
            label="Margem bruta" valor={resumo.margem_valor}
            sub={`${resumo.margem_pct}% de margem`}
            cor={resumo.margem_pct >= 35 ? 'blue' : 'amber'}
            icon={<BarChart3 size={15} className={resumo.margem_pct >= 35 ? 'text-blue-500' : 'text-amber-500'} />}
          />
          <KpiCard
            label="Inadimplência" valor={resumo.inadimplencia}
            sub={inadimplentes.length > 0 ? `${inadimplentes.length} pagamento${inadimplentes.length > 1 ? 's' : ''} em atraso` : 'Sem atrasos'}
            cor={resumo.inadimplencia > 0 ? 'red' : 'emerald'}
            icon={<AlertTriangle size={15} className={resumo.inadimplencia > 0 ? 'text-red-500' : 'text-emerald-500'} />}
            alerta={resumo.inadimplencia > 0}
          />
        </div>

        {/* Meta do mês */}
        {resumo.meta && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target size={14} className="text-blue-500" />
                <span className="text-xs font-semibold text-slate-600">Meta do mês: {formatarMoeda(resumo.meta.meta_receita)}</span>
              </div>
              <span className={`text-xs font-bold ${metaAtingida! >= 100 ? 'text-emerald-600' : metaAtingida! >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
                {metaAtingida}% atingido
              </span>
            </div>
            <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${metaAtingida! >= 100 ? 'bg-emerald-500' : metaAtingida! >= 70 ? 'bg-amber-400' : 'bg-red-400'}`}
                style={{ width: `${Math.min(metaAtingida!, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>Realizado: {formatarMoeda(resumo.receita_realizada)}</span>
              <span>Falta: {formatarMoeda(Math.max(0, resumo.meta.meta_receita - resumo.receita_realizada))}</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-slate-200 -mb-4 -mx-6 px-6">
          {([
            ['visao_geral', 'Visão Geral'],
            ['receitas', `Receitas (${receitasMes.length})`],
            ['custos', `Custos (${custosMes.length})`],
            ['forecast', 'Forecast'],
          ] as [Tab, string][]).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">

        {/* ─── TAB: VISÃO GERAL ───────────────────────────────────────── */}
        {tab === 'visao_geral' && (
          <div className="grid grid-cols-2 gap-6">

            {/* Alertas financeiros */}
            {alertas.length > 0 && (
              <div className="col-span-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Alertas financeiros</p>
                <div className="space-y-2">
                  {alertas.map((a) => (
                    <div key={a.id} className={`flex items-start gap-3 p-3 rounded-xl border ${
                      a.gravidade === 'critica' ? 'bg-red-50 border-red-200' :
                      a.gravidade === 'alta' ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <AlertTriangle size={15} className={a.gravidade === 'critica' ? 'text-red-600 mt-0.5 flex-none' : 'text-amber-600 mt-0.5 flex-none'} />
                      <div className="flex-1">
                        <p className={`text-sm font-bold ${a.gravidade === 'critica' ? 'text-red-700' : 'text-amber-700'}`}>{a.titulo}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{a.descricao}</p>
                      </div>
                      {a.valor !== undefined && (
                        <span className={`text-sm font-bold flex-none ${a.gravidade === 'critica' ? 'text-red-700' : 'text-amber-700'}`}>
                          {formatarMoeda(a.valor)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Receitas resumo */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Receitas por cliente</p>
              <div className="space-y-2">
                {receitasMes.map((l) => {
                  const cliente = clientes.find((c) => c.id === l.cliente_id)
                  const cfg = STATUS_LANCAMENTO_CONFIG[l.status]
                  return (
                    <div key={l.id} className="flex items-center gap-3 bg-white rounded-lg border border-slate-200 px-3 py-2.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{cliente?.nome_empresa ?? l.descricao}</p>
                        <p className="text-xs text-slate-400">Vence: {formatarData(l.data_vencimento)}</p>
                      </div>
                      <span className="text-sm font-bold text-slate-800">{formatarMoeda(l.valor)}</span>
                      <StatusBadge status={l.status} />
                      {l.status === 'emitido' && (
                        <button onClick={() => marcarPago(l.id)}
                          className="text-xs text-emerald-600 hover:text-emerald-700 font-medium whitespace-nowrap">
                          Marcar pago
                        </button>
                      )}
                      {l.status === 'atrasado' && (
                        <button onClick={() => marcarPago(l.id)}
                          className="text-xs text-emerald-600 hover:text-emerald-700 font-medium whitespace-nowrap">
                          Recebido
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Custos resumo */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Custos por categoria</p>
              <div className="space-y-2 mb-4">
                {Object.entries(custosPorCategoria)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, valor]) => {
                    const pct = Math.round((valor / totalCustoCateg) * 100)
                    const corBarra = CATEGORIA_CUSTO_COR[cat as keyof typeof CATEGORIA_CUSTO_COR] ?? 'bg-slate-400'
                    return (
                      <div key={cat}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-600">{CATEGORIA_CUSTO_LABELS[cat as keyof typeof CATEGORIA_CUSTO_LABELS] ?? cat}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">{pct}%</span>
                            <span className="font-semibold text-slate-700">{formatarMoeda(valor)}</span>
                          </div>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${corBarra}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex justify-between">
                <span className="text-sm text-slate-500">Total de custos</span>
                <span className="text-sm font-bold text-slate-800">{formatarMoeda(resumo.custo_total)}</span>
              </div>
            </div>

            {/* DRE resumido */}
            <div className="col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-bold text-slate-700">DRE Simplificado — {competenciaLabel(competencia)}</p>
              </div>
              <div className="divide-y divide-slate-100">
                <DRERow label="Receita bruta" valor={resumo.receita_realizada + resumo.receita_prevista} cor="emerald" negrito />
                <DRERow label="  Receita confirmada (pago)" valor={resumo.receita_realizada} />
                <DRERow label="  Receita pendente (emitido + previsto)" valor={resumo.receita_prevista} dimmed />
                <DRERow label="Custos operacionais" valor={-resumo.custo_total} cor="red" negrito />
                {Object.entries(custosPorCategoria).sort(([, a], [, b]) => b - a).map(([cat, valor]) => (
                  <DRERow key={cat}
                    label={`  ${CATEGORIA_CUSTO_LABELS[cat as keyof typeof CATEGORIA_CUSTO_LABELS]?.replace(/[^\w\s,]/g, '').trim() ?? cat}`}
                    valor={-valor} dimmed />
                ))}
                <DRERow label="Resultado (Margem Bruta)" valor={resumo.margem_valor}
                  cor={resumo.margem_pct >= 35 ? 'emerald' : 'red'} negrito destaque />
                <DRERow label={`Margem %`} valor={resumo.margem_pct} isPct cor={resumo.margem_pct >= 35 ? 'emerald' : 'red'} />
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB: RECEITAS ──────────────────────────────────────────── */}
        {tab === 'receitas' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-slate-700">
                Receitas de {competenciaLabel(competencia)}
                <span className="ml-2 text-slate-400 font-normal">· Total: {formatarMoeda(receitasMes.reduce((s, l) => s + l.valor, 0))}</span>
              </p>
              <button onClick={() => { setTipoNovo('receita'); setShowNovoLancamento(true) }}
                className="flex items-center gap-1 text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700">
                <Plus size={13} /> Registrar receita
              </button>
            </div>
            <TabelaLancamentos
              lancamentos={receitasMes}
              onMarcarPago={marcarPago}
              onMarcarAtrasado={marcarAtrasado}
              tipo="receita"
            />
          </div>
        )}

        {/* ─── TAB: CUSTOS ────────────────────────────────────────────── */}
        {tab === 'custos' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-slate-700">
                Custos de {competenciaLabel(competencia)}
                <span className="ml-2 text-slate-400 font-normal">· Total: {formatarMoeda(custosMes.reduce((s, l) => s + l.valor, 0))}</span>
              </p>
              <button onClick={() => { setTipoNovo('custo'); setShowNovoLancamento(true) }}
                className="flex items-center gap-1 text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700">
                <Plus size={13} /> Registrar custo
              </button>
            </div>
            <TabelaLancamentos
              lancamentos={custosMes}
              onMarcarPago={marcarPago}
              onMarcarAtrasado={marcarAtrasado}
              tipo="custo"
            />
          </div>
        )}

        {/* ─── TAB: FORECAST ──────────────────────────────────────────── */}
        {tab === 'forecast' && (
          <div className="space-y-6">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Previsão de receita — próximos 3 meses</p>
              <p className="text-xs text-slate-500 mb-4">Baseado em contratos vigentes. Clientes "Em risco" podem não renovar.</p>
              <div className="grid grid-cols-3 gap-4">
                {resumoForecast.map((r) => {
                  const metaPct = r.meta ? Math.round((r.receita_total / r.meta.meta_receita) * 100) : null
                  return (
                    <div key={r.competencia} className={`bg-white rounded-xl border p-4 ${r.competencia === COMPETENCIA_ATUAL ? 'border-blue-300 ring-1 ring-blue-200' : 'border-slate-200'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-bold text-slate-700">{competenciaLabel(r.competencia)}</p>
                        {r.competencia === COMPETENCIA_ATUAL && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Atual</span>}
                      </div>

                      <p className="text-2xl font-bold text-slate-800 mb-1">{formatarMoeda(r.receita_total)}</p>
                      <div className="space-y-1 mb-3">
                        <p className="text-xs text-slate-500">✅ Confirmado: {formatarMoeda(r.receita_realizada)}</p>
                        <p className="text-xs text-slate-400">📄 Previsto: {formatarMoeda(r.receita_prevista)}</p>
                      </div>

                      {r.meta && (
                        <>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-1">
                            <div
                              className={`h-full rounded-full ${metaPct! >= 100 ? 'bg-emerald-500' : metaPct! >= 70 ? 'bg-amber-400' : 'bg-red-400'}`}
                              style={{ width: `${Math.min(metaPct!, 100)}%` }}
                            />
                          </div>
                          <p className="text-xs text-slate-400">{metaPct}% da meta ({formatarMoeda(r.meta.meta_receita)})</p>
                        </>
                      )}

                      <div className="pt-3 border-t border-slate-100 mt-3">
                        <p className="text-xs text-slate-500">Custo estimado: {formatarMoeda(r.custo_total || 35360)}</p>
                        <p className={`text-xs font-semibold mt-0.5 ${r.margem_pct >= 35 ? 'text-emerald-600' : 'text-red-600'}`}>
                          Margem estimada: {r.margem_pct || Math.round(((r.receita_total - 35360) / r.receita_total) * 100)}%
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Como prever faturamento */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm font-bold text-blue-700 mb-3">Como a previsão é calculada</p>
              <div className="grid grid-cols-3 gap-4 text-xs text-blue-800">
                <div>
                  <p className="font-semibold mb-1">✅ Receita certa</p>
                  <p className="text-blue-600">Parcelas de contratos vigentes e assinados. Probabilidade: 95%+</p>
                </div>
                <div>
                  <p className="font-semibold mb-1">📊 Receita ponderada</p>
                  <p className="text-blue-600">Propostas em negociação × probabilidade de fechamento. Atualizado automaticamente do CRM.</p>
                </div>
                <div>
                  <p className="font-semibold mb-1">⚠️ Risco de churn</p>
                  <p className="text-blue-600">Clientes "Em risco" têm 40% de chance de não renovar. Impacta forecast dos próximos meses.</p>
                </div>
              </div>
            </div>

            {/* Como identificar problemas */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="text-sm font-bold text-slate-700 mb-3">Como identificar problemas financeiros</p>
              <div className="space-y-2">
                {[
                  { sinal: 'Margem < 35%', causa: 'Custos cresceram ou receita caiu', acao: 'Revisar folha de pagamento e ferramentas. Aumentar preço na próxima renovação.' },
                  { sinal: 'Inadimplência > 15 dias', causa: 'Cliente com problema de caixa ou insatisfação', acao: 'Ligar imediatamente. Oferecer parcelamento se necessário. Avaliar suspender serviços.' },
                  { sinal: 'MRR em queda 2 meses', causa: 'Churn ou downsell de clientes', acao: 'Identificar clientes perdidos. Revisar estratégia de retenção. Acelerar CRM.' },
                  { sinal: 'Meta abaixo de 70%', causa: 'Pipeline comercial insuficiente', acao: 'Revisar funil no CRM. Quantos leads qualificados existem? Propostas enviadas?' },
                  { sinal: 'Custo de mídia > receita do cliente', causa: 'Campanha ineficiente ou cliente underpriced', acao: 'Revisar precificação. Apresentar ROI ao cliente. Considerar reajuste.' },
                ].map(({ sinal, causa, acao }) => (
                  <div key={sinal} className="flex gap-3 p-3 bg-white rounded-lg border border-slate-100">
                    <AlertTriangle size={14} className="text-amber-500 mt-0.5 flex-none" />
                    <div>
                      <p className="text-xs font-bold text-slate-700">{sinal}</p>
                      <p className="text-xs text-slate-500">Causa: {causa}</p>
                      <p className="text-xs text-blue-600 mt-0.5">→ {acao}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {showNovoLancamento && (
        <NovoLancamentoForm
          tipoInicial={tipoNovo}
          competenciaInicial={competencia}
          onSave={(data) => { addLancamento(data); setShowNovoLancamento(false) }}
          onCancel={() => setShowNovoLancamento(false)}
        />
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TabelaLancamentos({
  lancamentos, onMarcarPago, onMarcarAtrasado, tipo,
}: {
  lancamentos: Lancamento[]
  onMarcarPago: (id: string) => void
  onMarcarAtrasado: (id: string) => void
  tipo: 'receita' | 'custo'
}) {
  const { clientes } = useClientesStore()

  if (lancamentos.length === 0)
    return <p className="text-sm text-slate-400 text-center py-12">Nenhum lançamento neste mês.</p>

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            <th className="text-left text-xs font-semibold text-slate-500 px-4 py-2.5">Descrição</th>
            <th className="text-left text-xs font-semibold text-slate-500 px-3 py-2.5">Categoria</th>
            {tipo === 'receita' && <th className="text-left text-xs font-semibold text-slate-500 px-3 py-2.5">NF</th>}
            <th className="text-left text-xs font-semibold text-slate-500 px-3 py-2.5">Vencimento</th>
            <th className="text-right text-xs font-semibold text-slate-500 px-3 py-2.5">Valor</th>
            <th className="text-center text-xs font-semibold text-slate-500 px-3 py-2.5">Status</th>
            <th className="text-right text-xs font-semibold text-slate-500 px-4 py-2.5">Ação</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {lancamentos.map((l) => {
            const cliente = clientes.find((c) => c.id === l.cliente_id)
            const cat = tipo === 'receita'
              ? CATEGORIA_RECEITA_LABELS[l.categoria as keyof typeof CATEGORIA_RECEITA_LABELS]
              : CATEGORIA_CUSTO_LABELS[l.categoria as keyof typeof CATEGORIA_CUSTO_LABELS]
            return (
              <tr key={l.id} className={`hover:bg-slate-50 transition-colors ${l.status === 'cancelado' ? 'opacity-40' : ''}`}>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-700 leading-tight">{l.descricao}</p>
                  {cliente && <p className="text-xs text-slate-400">{cliente.nome_empresa}</p>}
                  {l.observacoes && <p className="text-xs text-slate-400 italic mt-0.5">{l.observacoes}</p>}
                </td>
                <td className="px-3 py-3 text-xs text-slate-500">{cat?.replace(/[🔄📦🚀💡🎯📋👥🛠️📣🤝🏢🏛️📢]/g, '').trim() ?? l.categoria}</td>
                {tipo === 'receita' && <td className="px-3 py-3 text-xs text-slate-400">{l.nota_fiscal ?? '—'}</td>}
                <td className="px-3 py-3 text-xs text-slate-600">
                  {formatarData(l.data_vencimento)}
                  {l.data_pagamento && <p className="text-emerald-600">Pago: {formatarData(l.data_pagamento)}</p>}
                </td>
                <td className="px-3 py-3 text-right font-bold text-slate-800">{formatarMoeda(l.valor)}</td>
                <td className="px-3 py-3 text-center"><StatusBadge status={l.status} /></td>
                <td className="px-4 py-3 text-right">
                  {l.status === 'emitido' && tipo === 'receita' && (
                    <button onClick={() => onMarcarPago(l.id)}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">Marcar pago</button>
                  )}
                  {l.status === 'atrasado' && (
                    <button onClick={() => onMarcarPago(l.id)}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">Recebido</button>
                  )}
                  {l.status === 'previsto' && (
                    <button onClick={() => onMarcarPago(l.id)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium">Confirmar</button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-slate-200 bg-slate-50">
            <td colSpan={tipo === 'receita' ? 4 : 3} className="px-4 py-2.5 text-xs font-semibold text-slate-500">Total</td>
            <td className="px-3 py-2.5 text-right font-bold text-slate-800">
              {formatarMoeda(lancamentos.filter(l => l.status !== 'cancelado').reduce((s, l) => s + l.valor, 0))}
            </td>
            <td colSpan={2} />
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

function StatusBadge({ status }: { status: Lancamento['status'] }) {
  const cfg = STATUS_LANCAMENTO_CONFIG[status]
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.corBg} ${cfg.cor} ${cfg.corBorda}`}>
      {cfg.icone} {cfg.label}
    </span>
  )
}

function KpiCard({ label, valor, sub, cor, icon, delta, alerta = false }: {
  label: string; valor: number; sub: string; cor: string
  icon: React.ReactNode; delta?: React.ReactNode; alerta?: boolean
}) {
  const corMap: Record<string, string> = {
    emerald: 'bg-emerald-50 border-emerald-100',
    red: 'bg-red-50 border-red-100',
    blue: 'bg-blue-50 border-blue-100',
    amber: 'bg-amber-50 border-amber-100',
  }
  return (
    <div className={`rounded-xl border p-3 ${corMap[cor]} ${alerta ? 'ring-1 ring-red-300' : ''}`}>
      <div className="flex items-center gap-2 mb-1">{icon}<span className="text-xs text-slate-500">{label}</span></div>
      <p className="text-lg font-bold text-slate-800">{formatarMoeda(valor)}</p>
      <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
      {delta && <div className="mt-1">{delta}</div>}
    </div>
  )
}

function DRERow({ label, valor, cor, negrito, dimmed, destaque, isPct }: {
  label: string; valor: number; cor?: string; negrito?: boolean; dimmed?: boolean; destaque?: boolean; isPct?: boolean
}) {
  const valStr = isPct ? `${valor}%` : formatarMoeda(Math.abs(valor))
  const sinal = !isPct && valor < 0 ? '- ' : ''
  return (
    <div className={`flex items-center justify-between px-4 py-2 ${destaque ? 'bg-slate-50' : ''}`}>
      <span className={`text-sm ${dimmed ? 'text-slate-400' : negrito ? 'font-semibold text-slate-700' : 'text-slate-600'}`}>{label}</span>
      <span className={`text-sm ${negrito ? 'font-bold' : ''} ${
        cor === 'emerald' ? 'text-emerald-700' :
        cor === 'red' ? 'text-red-700' :
        dimmed ? 'text-slate-400' : 'text-slate-700'
      }`}>
        {sinal}{valStr}
      </span>
    </div>
  )
}
