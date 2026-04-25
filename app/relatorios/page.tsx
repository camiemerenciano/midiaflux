'use client'

import { useMemo, useState } from 'react'
import { useCRMStore } from '@/lib/crm/store'
import { useClientesStore } from '@/lib/clientes/store'
import { useOperacaoStore } from '@/lib/operacao/store'
import { useFinanceiroStore } from '@/lib/financeiro/store'
import {
  calcularConversao, calcularCAC, calcularLTV,
  calcularRetencao, calcularProdutividade,
  COR_CLASSIFICACAO, EMOJI_CLASSIFICACAO, Classificacao,
  KPIConversao, KPICAC, KPILTV, KPIRetencao, KPIProdutividade,
} from '@/lib/kpis'
import { formatarMoeda } from '@/lib/crm/score'
import {
  TrendingUp, DollarSign, Users, RefreshCw,
  Activity, ChevronRight, Info, AlertTriangle,
} from 'lucide-react'

type Secao = 'conversao' | 'cac' | 'ltv' | 'retencao' | 'produtividade'

const SECOES: { id: Secao; label: string; icon: React.ReactNode }[] = [
  { id: 'conversao',    label: 'Conversão',      icon: <TrendingUp size={15} /> },
  { id: 'cac',         label: 'CAC',             icon: <DollarSign size={15} /> },
  { id: 'ltv',         label: 'LTV',             icon: <TrendingUp size={15} /> },
  { id: 'retencao',    label: 'Retenção',        icon: <Users size={15} /> },
  { id: 'produtividade', label: 'Produtividade', icon: <Activity size={15} /> },
]

export default function RelatoriosPage() {
  const { leads } = useCRMStore()
  const { clientes, contratos } = useClientesStore()
  const { tarefas } = useOperacaoStore()
  const { lancamentos, getResumoMensal } = useFinanceiroStore()

  const [secao, setSecao] = useState<Secao>('conversao')

  const comp = new Date().toISOString().slice(0, 7)
  const resumoMes = useMemo(() => getResumoMensal(comp), [lancamentos])

  // Novos clientes nos últimos 30 dias
  const novosClientes = useMemo(() =>
    leads.filter(l => l.status === 'fechado' &&
      new Date(l.atualizado_em) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length
  , [leads])

  const kpiConversao    = useMemo(() => calcularConversao(leads), [leads])
  const kpiLTV          = useMemo(() => calcularLTV(clientes, contratos, resumoMes.margem_pct || 40), [clientes, contratos, resumoMes])
  const kpiCAC          = useMemo(() => calcularCAC(lancamentos, novosClientes, kpiLTV.ltv), [lancamentos, novosClientes, kpiLTV])
  const kpiRetencao     = useMemo(() => calcularRetencao(clientes), [clientes])
  const kpiProdutividade = useMemo(() => calcularProdutividade(tarefas, lancamentos), [tarefas, lancamentos])

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex-none">
        <h1 className="text-xl font-bold text-slate-800">KPIs & Indicadores</h1>
        <p className="text-sm text-slate-500 mt-0.5">Métricas que guiam decisões — calculadas em tempo real a partir dos dados do sistema</p>

        {/* Tabs */}
        <div className="flex gap-1 mt-4 bg-slate-100 p-1 rounded-xl w-fit">
          {SECOES.map(s => (
            <button key={s.id} onClick={() => setSecao(s.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                secao === s.id
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}>
              {s.icon} {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">

        {secao === 'conversao' && <SecaoConversao kpi={kpiConversao} />}
        {secao === 'cac'       && <SecaoCAC       kpi={kpiCAC} ltv={kpiLTV.ltv} />}
        {secao === 'ltv'       && <SecaoLTV       kpi={kpiLTV} cac={kpiCAC.cac} />}
        {secao === 'retencao'  && <SecaoRetencao  kpi={kpiRetencao} clientes={clientes} />}
        {secao === 'produtividade' && <SecaoProdutividade kpi={kpiProdutividade} />}

      </div>
    </div>
  )
}

// ─── Componentes de seção ─────────────────────────────────────────────────────

function SecaoConversao({ kpi }: { kpi: KPIConversao }) {
  const semDados = kpi.totalLeads === 0

  const metricas = [
    {
      label: 'Lead → Qualificado',
      valor: kpi.taxaLQ,
      classe: kpi.classLQ,
      descricao: 'Qualidade dos leads que entram',
      faixas: ['< 30%', '30–40%', '40–60%', '> 60%'],
      formula: 'Qualificados / Total de leads',
      detalhe: `${kpi.qualificados} qualificados de ${kpi.totalLeads} leads`,
    },
    {
      label: 'Qualificado → Proposta',
      valor: kpi.taxaQP,
      classe: kpi.classQP,
      descricao: 'Eficiência da abordagem comercial',
      faixas: ['< 50%', '50–65%', '65–80%', '> 80%'],
      formula: 'Propostas enviadas / Qualificados',
      detalhe: `${kpi.propostas} propostas de ${kpi.qualificados} qualificados`,
    },
    {
      label: 'Proposta → Fechamento',
      valor: kpi.taxaPF,
      classe: kpi.classPF,
      descricao: 'Força da proposta e negociação',
      faixas: ['< 20%', '20–30%', '30–50%', '> 50%'],
      formula: 'Fechados / (Fechados + Perdidos)',
      detalhe: `${kpi.fechados} fechados, ${kpi.perdidos} perdidos`,
    },
    {
      label: 'Taxa Total (lead → cliente)',
      valor: kpi.taxaTotal,
      classe: kpi.classTotal,
      descricao: 'Eficiência geral do funil comercial',
      faixas: ['< 8%', '8–15%', '15–25%', '> 25%'],
      formula: 'Clientes fechados / Total de leads',
      detalhe: `${kpi.fechados} fechados de ${kpi.totalLeads} leads`,
      destaque: true,
    },
  ]

  return (
    <div className="space-y-6 max-w-4xl">
      <KPIHeader
        titulo="Taxa de Conversão"
        subtitulo="Mede a eficiência do processo comercial em cada etapa do funil"
        semDados={semDados}
        fontes={['CRM → Leads por estágio']}
      />

      {semDados ? (
        <EstadoVazio
          mensagem="Cadastre leads no CRM para calcular a taxa de conversão."
          formula="Fechados ÷ Total de leads × 100"
          benchmark="Referência saudável: 10–20% total (lead → cliente)"
        />
      ) : (
        <>
          {/* Funil visual */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Funil — volume por etapa</p>
            <div className="space-y-2">
              {[
                { label: 'Leads captados',  n: kpi.totalLeads,    cor: 'bg-slate-200' },
                { label: 'Qualificados',    n: kpi.qualificados,  cor: 'bg-blue-300' },
                { label: 'Propostas',       n: kpi.propostas,     cor: 'bg-violet-400' },
                { label: 'Fechados',        n: kpi.fechados,      cor: 'bg-emerald-500' },
              ].map(({ label, n, cor }) => {
                const pct = kpi.totalLeads > 0 ? Math.round((n / kpi.totalLeads) * 100) : 0
                return (
                  <div key={label} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-36 flex-none">{label}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
                      <div className={`${cor} h-full rounded-full transition-all flex items-center px-2`}
                        style={{ width: `${Math.max(pct, 4)}%` }}>
                        <span className="text-xs font-bold text-white">{n}</span>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-slate-500 w-12 text-right">{pct}%</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Cards por etapa */}
          <div className="grid grid-cols-2 gap-4">
            {metricas.map(m => (
              <KPICard key={m.label} {...m} unidade="%" />
            ))}
          </div>

          {/* Diagnóstico */}
          <Diagnostico items={[
            kpi.classLQ === 'critico' && 'Taxa L→Q abaixo de 30%: os leads que chegam não têm perfil. Revisar o canal de captação ou adicionar qualificação no formulário de entrada.',
            kpi.classQP === 'critico' && 'Taxa Q→P abaixo de 50%: consultor não está convertendo qualificados em oportunidades. Revisar script de abordagem e treinamento.',
            kpi.classPF === 'critico' && 'Taxa P→F abaixo de 20%: proposta fraca ou precificação desalinhada. Adicionar cases de sucesso, âncora de valor e urgência.',
            kpi.classTotal === 'excelente' && 'Taxa total acima de 25%: funil comercial saudável. Foque em aumentar o volume de leads no topo.',
          ].filter(Boolean) as string[]} />
        </>
      )}
    </div>
  )
}

function SecaoCAC({ kpi, ltv }: { kpi: KPICAC; ltv: number | null }) {
  const semDados = kpi.novosClientes === 0

  return (
    <div className="space-y-6 max-w-4xl">
      <KPIHeader
        titulo="CAC — Custo de Aquisição de Cliente"
        subtitulo="Quanto a agência gasta para conquistar cada cliente novo. Avalie sempre em relação ao LTV."
        semDados={semDados}
        fontes={['Financeiro → Custos de pessoal, ferramentas e marketing', 'CRM → Leads fechados nos últimos 30 dias']}
      />

      {/* Cards principais */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-400 mb-1">Custo comercial do mês</p>
          <p className="text-2xl font-bold text-slate-800">{formatarMoeda(kpi.custoComercial)}</p>
          <p className="text-xs text-slate-400 mt-1">Pessoal + ferramentas + marketing próprio</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-400 mb-1">Novos clientes (30d)</p>
          <p className="text-2xl font-bold text-slate-800">{kpi.novosClientes}</p>
          <p className="text-xs text-slate-400 mt-1">Leads com status "Fechado"</p>
        </div>
        <div className={`rounded-xl border p-4 ${kpi.cac ? COR_CLASSIFICACAO[kpi.classCac].bg + ' ' + COR_CLASSIFICACAO[kpi.classCac].borda : 'bg-slate-50 border-slate-200'}`}>
          <p className="text-xs text-slate-400 mb-1">CAC atual</p>
          <p className={`text-2xl font-bold ${kpi.cac ? COR_CLASSIFICACAO[kpi.classCac].texto : 'text-slate-400'}`}>
            {kpi.cac ? formatarMoeda(kpi.cac) : '—'}
          </p>
          <p className="text-xs text-slate-400 mt-1">Custo comercial ÷ novos clientes</p>
        </div>
      </div>

      {/* Relação LTV:CAC */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Relação LTV : CAC — o indicador mais importante</p>
        <div className="flex items-center gap-6 mb-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-slate-800">{ltv ? formatarMoeda(ltv) : '—'}</p>
            <p className="text-xs text-slate-400">LTV estimado</p>
          </div>
          <div className="text-4xl text-slate-300">÷</div>
          <div className="text-center">
            <p className="text-3xl font-bold text-slate-800">{kpi.cac ? formatarMoeda(kpi.cac) : '—'}</p>
            <p className="text-xs text-slate-400">CAC atual</p>
          </div>
          <div className="text-4xl text-slate-300">=</div>
          <div className={`text-center px-4 py-2 rounded-xl ${kpi.relacaoLTVCAC ? COR_CLASSIFICACAO[kpi.classCac].bg : 'bg-slate-50'}`}>
            <p className={`text-3xl font-bold ${kpi.relacaoLTVCAC ? COR_CLASSIFICACAO[kpi.classCac].texto : 'text-slate-400'}`}>
              {kpi.relacaoLTVCAC ? `${kpi.relacaoLTVCAC}×` : '—'}
            </p>
            <p className="text-xs text-slate-400">LTV:CAC</p>
          </div>
        </div>
        <BenchmarkBar valor={kpi.relacaoLTVCAC} faixas={[
          { label: 'Crítico < 1×',   ate: 1 },
          { label: 'Atenção 1–3×',   ate: 3 },
          { label: 'Bom 3–5×',       ate: 5 },
          { label: 'Excelente > 5×', ate: 10 },
        ]} max={10} />
      </div>

      {semDados && (
        <EstadoVazio
          mensagem="Feche o primeiro cliente no CRM para calcular o CAC."
          formula="Custo comercial do mês ÷ Novos clientes no mês"
          benchmark="Referência: LTV deve ser pelo menos 3× o CAC"
        />
      )}

      <Diagnostico items={[
        kpi.relacaoLTVCAC !== null && kpi.relacaoLTVCAC < 1 && 'LTV < CAC: cada cliente novo gera prejuízo. Ação urgente: aumentar preço ou reduzir custo de aquisição.',
        kpi.relacaoLTVCAC !== null && kpi.relacaoLTVCAC >= 1 && kpi.relacaoLTVCAC < 3 && 'LTV:CAC entre 1–3×: margem de segurança pequena. Focar em upsells e aumentar retenção.',
        kpi.relacaoLTVCAC !== null && kpi.relacaoLTVCAC >= 5 && 'Excelente relação LTV:CAC. Considere investir mais em aquisição — cada cliente é altamente lucrativo.',
        kpi.custoComercial > 0 && kpi.novosClientes === 0 && 'Custo comercial sem nenhum fechamento este mês. Revisar qualidade do pipeline e urgência das propostas abertas.',
      ].filter(Boolean) as string[]} />
    </div>
  )
}

function SecaoLTV({ kpi, cac }: { kpi: KPILTV; cac: number | null }) {
  const semDados = kpi.clientesAtivos === 0

  return (
    <div className="space-y-6 max-w-4xl">
      <KPIHeader
        titulo="LTV — Lifetime Value"
        subtitulo="Receita total que um cliente gera ao longo de toda a relação. Justifica (ou não) o investimento em aquisição."
        semDados={semDados}
        fontes={['Clientes → Ticket médio dos contratos ativos', 'Clientes → Duração dos contratos encerrados']}
      />

      {semDados ? (
        <EstadoVazio
          mensagem="Cadastre clientes e contratos para calcular o LTV."
          formula="Ticket médio × Duração média × Margem bruta"
          benchmark="Referência: LTV > 3× CAC é saudável"
        />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`col-span-2 rounded-xl border p-5 ${COR_CLASSIFICACAO[kpi.classLTV].bg} ${COR_CLASSIFICACAO[kpi.classLTV].borda}`}>
              <p className="text-xs font-semibold text-slate-500 mb-1">LTV estimado</p>
              <p className={`text-4xl font-bold ${COR_CLASSIFICACAO[kpi.classLTV].texto}`}>
                {kpi.ltv ? formatarMoeda(kpi.ltv) : '—'}
              </p>
              {kpi.clientesEncerrados === 0 && (
                <p className="text-xs text-slate-400 mt-2">
                  * Estimado com tenure de 14 meses (padrão de mercado). Melhora com histórico de clientes encerrados.
                </p>
              )}
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-xs text-slate-400 mb-1">Ticket médio</p>
              <p className="text-2xl font-bold text-slate-800">{kpi.ticketMedio ? formatarMoeda(kpi.ticketMedio) : '—'}</p>
              <p className="text-xs text-slate-400 mt-1">/mês por contrato ativo</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-xs text-slate-400 mb-1">Duração média</p>
              <p className="text-2xl font-bold text-slate-800">
                {kpi.tenuraMedio ? `${kpi.tenuraMedio}m` : '14m*'}
              </p>
              <p className="text-xs text-slate-400 mt-1">{kpi.clientesEncerrados > 0 ? `base: ${kpi.clientesEncerrados} encerrados` : 'estimativa de mercado'}</p>
            </div>
          </div>

          {/* Fórmula visual */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Como este LTV foi calculado</p>
            <div className="flex items-center gap-3 text-center flex-wrap">
              {[
                { label: 'Ticket médio', valor: kpi.ticketMedio ? formatarMoeda(kpi.ticketMedio) : '—' },
                { label: '×', valor: null },
                { label: 'Duração média', valor: kpi.tenuraMedio ? `${kpi.tenuraMedio} meses` : '14 meses*' },
                { label: '×', valor: null },
                { label: 'Margem bruta', valor: `${kpi.margemEstimada}%` },
                { label: '=', valor: null },
                { label: 'LTV', valor: kpi.ltv ? formatarMoeda(kpi.ltv) : '—', destaque: true },
              ].map((item, i) =>
                item.valor === null ? (
                  <span key={i} className="text-2xl text-slate-300">{item.label}</span>
                ) : (
                  <div key={i} className={`px-4 py-3 rounded-xl ${item.destaque ? 'bg-blue-50 border-2 border-blue-200' : 'bg-slate-50 border border-slate-200'}`}>
                    <p className={`font-bold ${item.destaque ? 'text-xl text-blue-700' : 'text-lg text-slate-700'}`}>{item.valor}</p>
                    <p className="text-xs text-slate-400">{item.label}</p>
                  </div>
                )
              )}
            </div>
          </div>

          {/* LTV:CAC */}
          {cac && kpi.ltv && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
              <div>
                <p className="text-xs text-slate-400">Relação LTV:CAC</p>
                <p className="text-2xl font-bold text-slate-800">{Math.round((kpi.ltv / cac) * 10) / 10}×</p>
              </div>
              <div className="flex-1">
                <BenchmarkBar valor={Math.round((kpi.ltv / cac) * 10) / 10} faixas={[
                  { label: '< 1× Crítico', ate: 1 },
                  { label: '1–3× Atenção', ate: 3 },
                  { label: '3–5× Bom', ate: 5 },
                  { label: '> 5× Excelente', ate: 10 },
                ]} max={10} />
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-xs font-bold text-blue-700 mb-2">Como aumentar o LTV</p>
            <div className="grid grid-cols-3 gap-3 text-xs text-blue-800">
              <div><p className="font-semibold mb-1">Expandir contratos</p><p className="text-blue-600">Oferecer novos serviços a clientes existentes. Upsell sem CAC adicional.</p></div>
              <div><p className="font-semibold mb-1">Aumentar retenção</p><p className="text-blue-600">Cada mês a mais = ticket × margem de custo quase zero.</p></div>
              <div><p className="font-semibold mb-1">Revisão de preço</p><p className="text-blue-600">Reajuste anual de 10–15% nos contratos de renovação.</p></div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function SecaoRetencao({ kpi, clientes }: { kpi: KPIRetencao; clientes: { nome_empresa: string; status: string; nps?: number; data_inicio: string }[] }) {
  const semDados = kpi.totalClientes === 0

  return (
    <div className="space-y-6 max-w-4xl">
      <KPIHeader
        titulo="Retenção de Clientes"
        subtitulo="Capacidade de manter clientes ativos. Para recorrência, reter é mais barato e valioso do que adquirir."
        semDados={semDados}
        fontes={['Clientes → Status e histórico', 'Clientes → NPS registrado']}
      />

      {semDados ? (
        <EstadoVazio
          mensagem="Cadastre clientes para calcular retenção e churn."
          formula="(Clientes início - Clientes perdidos) ÷ Clientes início × 100"
          benchmark="Retenção > 80% anual é saudável para agências"
        />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <KPICard
              label="Retenção histórica"
              valor={kpi.retencao}
              classe={kpi.classRetencao}
              descricao="Clientes que permanecem ativos"
              faixas={['< 40%', '40–70%', '70–85%', '> 85%']}
              formula="(1 - Churn) × 100"
              detalhe={`${kpi.clientesAtivos} ativos de ${kpi.totalClientes} total`}
              unidade="%"
              destaque
            />
            <KPICard
              label="Churn acumulado"
              valor={kpi.churnRate}
              classe={kpi.churnRate !== null ? (kpi.churnRate > 60 ? 'critico' : kpi.churnRate > 30 ? 'atencao' : kpi.churnRate > 15 ? 'bom' : 'excelente') : 'sem_dados'}
              descricao="Clientes encerrados sobre total"
              faixas={['> 60%', '30–60%', '15–30%', '< 15%']}
              formula="Encerrados ÷ Total × 100"
              detalhe={`${kpi.clientesEncerrados} encerrados`}
              unidade="%"
              inverso
            />
            <KPICard
              label="NPS médio"
              valor={kpi.npsMedia}
              classe={kpi.classNPS}
              descricao="Satisfação dos clientes ativos"
              faixas={['< 6', '6–7', '7–9', '> 9']}
              formula="Média dos NPS registrados"
              detalhe={`${clientes.filter(c => (c as any).nps !== undefined).length} clientes com NPS`}
              unidade="/10"
            />
          </div>

          {/* Clientes em risco */}
          {kpi.clientesEmRisco > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={14} className="text-red-600" />
                <p className="text-sm font-bold text-red-700">{kpi.clientesEmRisco} cliente{kpi.clientesEmRisco > 1 ? 's' : ''} em risco de churn</p>
              </div>
              <p className="text-xs text-red-600">Cada cliente em risco representa MRR potencialmente perdido. Acionar plano de resgate imediatamente — reunião de alinhamento, revisão de entregáveis e proposta de renovação antecipada.</p>
            </div>
          )}

          {/* NPS por cliente */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">NPS por cliente</p>
            </div>
            <div className="divide-y divide-slate-100">
              {clientes.filter(c => c.status !== 'encerrado').map((c: any) => {
                const nps: number | undefined = c.nps
                const corNPS = nps === undefined ? 'text-slate-300' : nps >= 9 ? 'text-emerald-600' : nps >= 7 ? 'text-amber-600' : 'text-red-600'
                const classNPS = nps === undefined ? '' : nps >= 9 ? '🟢 Promotor' : nps >= 7 ? '🟡 Passivo' : '🔴 Detrator'
                return (
                  <div key={c.nome_empresa} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-700">{c.nome_empresa}</p>
                      <p className="text-xs text-slate-400">Cliente desde {new Date(c.data_inicio).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}</p>
                    </div>
                    <span className="text-xs text-slate-400">{classNPS}</span>
                    <span className={`text-lg font-bold ${corNPS} w-10 text-right`}>
                      {nps !== undefined ? `${nps}` : '—'}
                    </span>
                    {nps !== undefined && (
                      <div className="w-20">
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${nps >= 9 ? 'bg-emerald-500' : nps >= 7 ? 'bg-amber-400' : 'bg-red-400'}`}
                            style={{ width: `${(nps / 10) * 100}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
              {clientes.filter(c => c.status !== 'encerrado').length === 0 && (
                <p className="text-sm text-slate-400 text-center py-6">Nenhum cliente ativo ainda.</p>
              )}
            </div>
          </div>

          <Diagnostico items={[
            kpi.npsMedia !== null && kpi.npsMedia < 7 && 'NPS médio abaixo de 7: clientes insatisfeitos. Reunião de alinhamento urgente com os detratores antes que cancelem.',
            kpi.churnRate !== null && kpi.churnRate > 30 && 'Churn acima de 30%: modelo de retenção precisa de revisão. Investigar: entrega está no prazo? Resultado está sendo comunicado?',
            kpi.clientesEmRisco > 0 && `${kpi.clientesEmRisco} cliente${kpi.clientesEmRisco > 1 ? 's marcados' : ' marcado'} como "Em risco" — prioridade máxima de atenção esta semana.`,
            kpi.retencao !== null && kpi.retencao > 85 && 'Retenção acima de 85%: excelente. Ative o plano de indicação — cliente satisfeito é o melhor vendedor com menor CAC.',
          ].filter(Boolean) as string[]} />
        </>
      )}
    </div>
  )
}

function SecaoProdutividade({ kpi }: { kpi: KPIProdutividade }) {
  const semDados = kpi.tarefasConcluidas === 0

  return (
    <div className="space-y-6 max-w-4xl">
      <KPIHeader
        titulo="Produtividade do Time"
        subtitulo="Mede a eficiência operacional — quanto trabalho de valor é entregue em relação ao tempo e custo disponíveis."
        semDados={semDados}
        fontes={['Projetos → Tarefas com horas estimadas/realizadas e status', 'Financeiro → Receita confirmada do mês']}
      />

      {semDados ? (
        <EstadoVazio
          mensagem="Registre horas nas tarefas do módulo de Projetos para calcular a produtividade."
          formula="Horas realizadas em tarefas ÷ Horas disponíveis da equipe"
          benchmark="Utilização faturável ideal: 65–80% do tempo disponível"
        />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              label="SLA de entrega"
              valor={kpi.sla}
              classe={kpi.classSLA}
              descricao="Tarefas entregues no prazo"
              faixas={['< 70%', '70–80%', '80–90%', '> 90%']}
              formula="Tarefas no prazo ÷ Concluídas"
              detalhe={`${kpi.tarefasConcluidas} tarefas concluídas`}
              unidade="%"
              destaque
            />
            <KPICard
              label="Eficiência"
              valor={kpi.eficiencia}
              classe={kpi.classEficiencia}
              descricao="Estimativa vs tempo real"
              faixas={['< 70%', '70–85%', '85–100%', '> 100%']}
              formula="Horas estimadas ÷ Realizadas"
              detalhe="100% = estimativa perfeita"
              unidade="%"
            />
            <KPICard
              label="Utilização"
              valor={kpi.utilizacao}
              classe={kpi.classUtilizacao}
              descricao="Horas produtivas / disponíveis"
              faixas={['< 55%', '55–65%', '65–80%', '80–85%']}
              formula={`${kpi.horasRealizadas}h realizadas`}
              detalhe="Acima de 85% = sobrecarga"
              unidade="%"
            />
            <KPICard
              label="Receita/colaborador"
              valor={kpi.receitaColaborador}
              classe={
                kpi.receitaColaborador === null ? 'sem_dados' :
                kpi.receitaColaborador > 25000 ? 'excelente' :
                kpi.receitaColaborador > 15000 ? 'bom' :
                kpi.receitaColaborador > 8000 ? 'atencao' : 'critico'
              }
              descricao="MRR ÷ número de pessoas"
              faixas={['< R$8k', 'R$8–15k', 'R$15–25k', '> R$25k']}
              formula="Receita do mês ÷ 3 pessoas"
              detalhe="Referência: R$15–25k/pessoa"
              isMoeda
            />
          </div>

          {/* Benchmark de utilização */}
          {kpi.utilizacao !== null && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Utilização faturável da equipe</p>
              <BenchmarkBar valor={kpi.utilizacao} faixas={[
                { label: 'Crítico < 55%',       ate: 55 },
                { label: 'Atenção 55–65%',       ate: 65 },
                { label: 'Ideal 65–80%',         ate: 80 },
                { label: 'Sobrecarga > 85%',     ate: 100 },
              ]} max={100} />
              <div className="flex justify-between text-xs text-slate-400 mt-2">
                <span>0%</span>
                <span className="text-amber-600 font-medium">55%</span>
                <span className="text-blue-600 font-medium">65%</span>
                <span className="text-emerald-600 font-medium">80%</span>
                <span className="text-red-600 font-medium">85%+</span>
                <span>100%</span>
              </div>
            </div>
          )}

          <Diagnostico items={[
            kpi.classSLA === 'critico' && 'SLA abaixo de 70%: 3 em cada 10 entregas estão atrasadas. Revisar processo de estimativa de prazo e capacidade da equipe.',
            kpi.classEficiencia === 'critico' && 'Eficiência abaixo de 70%: tarefas levam 40%+ a mais do que estimado. Investigar escopo não definido ou subestimativa crônica.',
            kpi.classUtilizacao === 'atencao' && kpi.utilizacao !== null && kpi.utilizacao > 85 && 'Utilização acima de 85%: equipe em sobrecarga. Risco de qualidade cair e burnout aparecer. Avaliar nova contratação ou repriorização.',
            kpi.classUtilizacao === 'critico' && 'Utilização abaixo de 55%: equipe ociosa. Verificar se há tarefas sem atribuição ou se o volume de projetos diminuiu.',
          ].filter(Boolean) as string[]} />
        </>
      )}
    </div>
  )
}

// ─── Componentes auxiliares ──────────────────────────────────────────────────

function KPIHeader({ titulo, subtitulo, semDados, fontes }: {
  titulo: string; subtitulo: string; semDados: boolean; fontes: string[]
}) {
  return (
    <div>
      <h2 className="text-lg font-bold text-slate-800 mb-1">{titulo}</h2>
      <p className="text-sm text-slate-500">{subtitulo}</p>
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <span className="text-xs text-slate-400">Fontes:</span>
        {fontes.map(f => (
          <span key={f} className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200">{f}</span>
        ))}
        {semDados && (
          <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full border border-amber-200 ml-2">
            ⚠️ Dados insuficientes
          </span>
        )}
      </div>
    </div>
  )
}

function KPICard({ label, valor, classe, descricao, faixas, formula, detalhe, unidade, isMoeda, destaque, inverso }: {
  label: string; valor: number | null; classe: Classificacao
  descricao: string; faixas: string[]; formula: string; detalhe?: string
  unidade?: string; isMoeda?: boolean; destaque?: boolean; inverso?: boolean
}) {
  const c = COR_CLASSIFICACAO[classe]
  const displayValor = valor === null ? '—'
    : isMoeda ? formatarMoeda(valor)
    : `${valor}${unidade ?? ''}`

  return (
    <div className={`rounded-xl border p-4 ${destaque ? `${c.bg} ${c.borda}` : 'bg-white border-slate-200'}`}>
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs text-slate-400 leading-tight">{label}</p>
        <span className="text-sm">{EMOJI_CLASSIFICACAO[classe]}</span>
      </div>
      <p className={`text-2xl font-bold mb-1 ${valor !== null ? c.texto : 'text-slate-300'}`}>{displayValor}</p>
      <p className="text-xs text-slate-400 mb-2">{descricao}</p>
      {/* Faixas */}
      <div className="flex gap-0.5 mb-2">
        {['Crítico', 'Atenção', 'Bom', 'Excelente'].map((f, i) => {
          const cores = ['bg-red-400', 'bg-amber-400', 'bg-blue-400', 'bg-emerald-400']
          return <div key={i} className={`flex-1 h-1 rounded-full ${cores[inverso ? 3 - i : i]}`} />
        })}
      </div>
      <div className="flex justify-between text-xs text-slate-300">
        {faixas.map(f => <span key={f}>{f}</span>)}
      </div>
      {detalhe && <p className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-100">{detalhe}</p>}
      <p className="text-xs text-slate-300 mt-1 italic">{formula}</p>
    </div>
  )
}

function BenchmarkBar({ valor, faixas, max }: {
  valor: number | null
  faixas: { label: string; ate: number }[]
  max: number
}) {
  const pct = valor !== null ? Math.min((valor / max) * 100, 100) : null
  const corBarra = valor === null ? 'bg-slate-300'
    : valor < faixas[1].ate ? 'bg-red-500'
    : valor < faixas[2].ate ? 'bg-amber-400'
    : valor < faixas[3]?.ate ? 'bg-blue-500'
    : 'bg-emerald-500'

  return (
    <div>
      <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden">
        {faixas.map((f, i) => {
          const cores = ['bg-red-100', 'bg-amber-100', 'bg-blue-100', 'bg-emerald-100']
          const prev = faixas[i - 1]?.ate ?? 0
          const w = ((f.ate - prev) / max) * 100
          const l = (prev / max) * 100
          return <div key={i} className={`absolute h-full ${cores[i]}`} style={{ left: `${l}%`, width: `${w}%` }} />
        })}
        {pct !== null && (
          <div className={`absolute top-0 h-full ${corBarra} transition-all`} style={{ width: `${pct}%`, opacity: 0.8 }} />
        )}
      </div>
      {pct !== null && (
        <div className="relative mt-1" style={{ marginLeft: `${Math.min(pct, 95)}%` }}>
          <div className={`absolute -translate-x-1/2 text-xs font-bold ${corBarra.replace('bg-', 'text-')}`}>
            ▲ {valor}
          </div>
        </div>
      )}
    </div>
  )
}

function EstadoVazio({ mensagem, formula, benchmark }: { mensagem: string; formula: string; benchmark: string }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center">
      <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-3">
        <Info size={20} className="text-slate-400" />
      </div>
      <p className="text-sm font-semibold text-slate-600 mb-1">{mensagem}</p>
      <div className="inline-block bg-white border border-slate-200 rounded-lg px-4 py-2 mt-3 mb-2">
        <p className="text-xs text-slate-400">Fórmula</p>
        <p className="text-sm font-mono text-slate-700">{formula}</p>
      </div>
      <p className="text-xs text-slate-400">{benchmark}</p>
    </div>
  )
}

function Diagnostico({ items }: { items: string[] }) {
  if (items.length === 0) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Diagnóstico & Ações recomendadas</p>
      </div>
      <div className="divide-y divide-slate-100">
        {items.map((item, i) => (
          <div key={i} className="flex gap-3 px-4 py-3">
            <ChevronRight size={14} className="text-blue-500 mt-0.5 flex-none" />
            <p className="text-sm text-slate-600">{item}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
