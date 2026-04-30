'use client'

import { useMemo } from 'react'
import { useCRMStore } from '@/lib/crm/store'
import { useClientesStore } from '@/lib/clientes/store'
import { useOperacaoStore, isTarefaAtrasada } from '@/lib/operacao/store'
import { useFinanceiroStore } from '@/lib/financeiro/store'
import { STATUS_LANCAMENTO_CONFIG, competenciaLabel } from '@/lib/financeiro/constants'
import { STATUS_PROJETO_CONFIG } from '@/lib/operacao/constants'
import { STATUS_CLIENTE_CONFIG } from '@/lib/clientes/constants'
import { formatarMoeda } from '@/lib/crm/score'
import Link from 'next/link'
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  Users, Building2, FolderKanban, DollarSign,
  Clock, Target, Activity, Zap, ChevronRight,
  Star, RefreshCw,
} from 'lucide-react'

const COMPETENCIA_ATUAL = '2026-04'

export default function DashboardPage() {
  // ── Dados de cada módulo ──────────────────────────────────────────────────
  const { leads, followUps } = useCRMStore()
  const { clientes, contratos, getContatosByCliente } = useClientesStore()
  const { projetos, tarefas, getTarefasAtrasadas, getProjetosAguardandoCliente } = useOperacaoStore()
  const { lancamentos, getResumoMensal, getResumoRange, getInadimplentes, getAlertasFinanceiros } = useFinanceiroStore()

  // ── Cálculos financeiros ─────────────────────────────────────────────────
  const resumo = useMemo(() => getResumoMensal(COMPETENCIA_ATUAL), [lancamentos])
  const resumoAnterior = useMemo(() => getResumoMensal('2026-03'), [lancamentos])
  const resumoForecast = useMemo(() => getResumoRange(['2026-04', '2026-05', '2026-06']), [lancamentos])
  const inadimplentes = useMemo(() => getInadimplentes(), [lancamentos])
  const alertasFinanceiros = useMemo(() => getAlertasFinanceiros(), [lancamentos])
  const lancamentosMes = useMemo(() => lancamentos.filter(l => l.competencia === COMPETENCIA_ATUAL), [lancamentos])

  // ── Cálculos CRM ─────────────────────────────────────────────────────────
  const leadsAtivos = leads.filter(l => !['fechado', 'sem_interesse'].includes(l.status))
  const leadsQualificados = leads.filter(l => ['qualificado', 'proposta_enviada', 'negociando', 'em_conversa'].includes(l.status))
  const propostas = leads.filter(l => l.status === 'proposta_enviada')
  const fechados = leads.filter(l => l.status === 'fechado')
  const perdidos = leads.filter(l => l.status === 'sem_interesse')
  const taxaConversao = fechados.length + perdidos.length > 0
    ? Math.round((fechados.length / (fechados.length + perdidos.length)) * 100) : 0
  const receitaPipeline = leadsQualificados.reduce((s, l) => s + (l.valor_estimado ?? 0) * (l.probabilidade / 100), 0)
  const followUpsHoje = followUps.filter(f => f.status === 'pendente' && new Date(f.data_hora).toDateString() === new Date().toDateString())
  const followUpsAtrasados = followUps.filter(f => f.status === 'pendente' && new Date(f.data_hora) < new Date())

  // ── Cálculos clientes ────────────────────────────────────────────────────
  const clientesAtivos = clientes.filter(c => c.status === 'ativo')
  const clientesEmRisco = clientes.filter(c => c.status === 'em_risco')
  const mrr = contratos.filter(k => {
    const c = clientes.find(cl => cl.id === k.cliente_id)
    return k.status === 'ativo' && c?.status !== 'encerrado'
  }).reduce((s, k) => s + (k.valor_mensal ?? 0), 0)
  const npsMedia = clientes.filter(c => c.nps !== undefined)
  const npsMediaVal = npsMedia.length > 0
    ? Math.round(npsMedia.reduce((s, c) => s + c.nps!, 0) / npsMedia.length * 10) / 10 : null
  const renovacoesEm60d = contratos.filter(k => {
    if (!k.data_fim || k.status !== 'ativo') return false
    const diff = new Date(k.data_fim).getTime() - Date.now()
    return diff > 0 && diff <= 60 * 24 * 60 * 60 * 1000
  }).length
  const churnRiskMRR = contratos.filter(k => {
    const c = clientes.find(cl => cl.id === k.cliente_id)
    return c?.status === 'em_risco' && k.status === 'ativo'
  }).reduce((s, k) => s + (k.valor_mensal ?? 0), 0)

  // ── Cálculos operação ────────────────────────────────────────────────────
  const projetosAtivos = projetos.filter(p => p.status === 'em_andamento')
  const tarefasAtrasadas = getTarefasAtrasadas()
  const projetosAguardando = getProjetosAguardandoCliente()
  const horasPendentes = tarefas.filter(t => t.status !== 'concluido' && t.status !== 'backlog')
    .reduce((s, t) => s + (t.estimativa_horas ?? 0) - (t.horas_realizadas ?? 0), 0)

  // ── Alertas cruzados (cross-module intelligence) ─────────────────────────
  const alertasCruzados = useMemo(() => {
    const lista: { id: string; gravidade: 'critica' | 'alta' | 'media'; titulo: string; descricao: string; modulo: string; href: string }[] = []

    // Cliente com NF atrasada E status em_risco
    clientesEmRisco.forEach(cliente => {
      const nfAtrasada = lancamentosMes.find(l => l.cliente_id === cliente.id && l.status === 'atrasado')
      if (nfAtrasada) {
        lista.push({
          id: `duplo-${cliente.id}`,
          gravidade: 'critica',
          titulo: `${cliente.nome_empresa} — duplo risco`,
          descricao: `NF de ${formatarMoeda(nfAtrasada.valor)} atrasada + cliente classificado como "Em risco" de churn`,
          modulo: 'Financeiro + Clientes',
          href: '/clientes',
        })
      }
    })

    // Projetos urgentes com tarefas muito atrasadas
    tarefasAtrasadas.filter(t => t.diasAtraso >= 5).forEach(t => {
      lista.push({
        id: `tarefa-atrasada-${t.id}`,
        gravidade: t.diasAtraso >= 10 ? 'critica' : 'alta',
        titulo: `Tarefa ${t.diasAtraso}d atrasada — ${t.projeto?.nome}`,
        descricao: `"${t.nome}" ultrapassou o prazo. Risco de impactar entrega ao cliente.`,
        modulo: 'Operação',
        href: '/projetos',
      })
    })

    // Projetos aguardando cliente com tarefas dependentes bloqueadas
    projetosAguardando.forEach(p => {
      const bloqueadas = tarefas.filter(t => t.projeto_id === p.id && t.status === 'bloqueado')
      if (bloqueadas.length > 0) {
        lista.push({
          id: `bloqueado-${p.id}`,
          gravidade: 'alta',
          titulo: `${bloqueadas.length} tarefa(s) bloqueada(s) — ${p.nome}`,
          descricao: `Aguardando aprovação do cliente para desbloquear a produção.`,
          modulo: 'Operação',
          href: '/projetos',
        })
      }
    })

    // Follow-ups atrasados no CRM
    if (followUpsAtrasados.length >= 3) {
      lista.push({
        id: 'followups-atrasados',
        gravidade: 'media',
        titulo: `${followUpsAtrasados.length} follow-ups em atraso no CRM`,
        descricao: 'Leads sem contato podem esfriar. Revise a agenda comercial.',
        modulo: 'CRM',
        href: '/crm',
      })
    }

    return lista.sort((a, b) => {
      const o = { critica: 0, alta: 1, media: 2 }
      return o[a.gravidade] - o[b.gravidade]
    })
  }, [clientesEmRisco, lancamentosMes, tarefasAtrasadas, projetosAguardando, followUpsAtrasados])

  // ── Saúde por cliente (cross-module matrix) ───────────────────────────────
  const saudeClientes = useMemo(() => {
    return clientesAtivos.map(cliente => {
      const contratosCliente = contratos.filter(k => k.cliente_id === cliente.id && k.status === 'ativo')
      const mrrCliente = contratosCliente.reduce((s, k) => s + (k.valor_mensal ?? 0), 0)
      const lancamentosCliente = lancamentosMes.filter(l => l.cliente_id === cliente.id && l.tipo === 'receita')
      const projetosCliente = projetos.filter(p => p.cliente_id === cliente.id && p.status !== 'concluido' && p.status !== 'cancelado')
      const tarefasAtrasadasCliente = tarefasAtrasadas.filter(t => projetosCliente.some(p => p.id === t.projeto_id))

      const statusPagamento: 'pago' | 'emitido' | 'atrasado' | 'previsto' =
        lancamentosCliente.some(l => l.status === 'atrasado') ? 'atrasado' :
        lancamentosCliente.some(l => l.status === 'emitido') ? 'emitido' :
        lancamentosCliente.every(l => l.status === 'pago') ? 'pago' : 'previsto'

      const statusProjeto: 'atrasado' | 'aguardando' | 'ok' | 'sem_projeto' =
        tarefasAtrasadasCliente.length > 0 ? 'atrasado' :
        projetosCliente.some(p => p.status === 'aguardando_cliente') ? 'aguardando' :
        projetosCliente.length === 0 ? 'sem_projeto' : 'ok'

      const risco = statusPagamento === 'atrasado' || statusProjeto === 'atrasado' || cliente.status === 'em_risco'
        ? 'alto' : statusProjeto === 'aguardando' ? 'medio' : 'baixo'

      return { cliente, mrrCliente, statusPagamento, statusProjeto, tarefasAtrasadas: tarefasAtrasadasCliente.length, risco }
    }).sort((a, b) => {
const o: Record<"alto" | "medio" | "baixo", number> = {
  alto: 0,
  medio: 1,
  baixo: 2,
}

return o[a.risco as "alto" | "medio" | "baixo"] - o[b.risco as "alto" | "medio" | "baixo"]
    })
  }, [clientesAtivos, contratos, lancamentosMes, projetos, tarefasAtrasadas])

  const deltaMRR = resumoAnterior.receita_realizada > 0
    ? Math.round(((resumo.receita_realizada - resumoAnterior.receita_realizada) / resumoAnterior.receita_realizada) * 100) : null

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-y-auto">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex-none">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Dashboard Executivo</h1>
            <p className="text-sm text-slate-500">{competenciaLabel(COMPETENCIA_ATUAL)} · Atualizado em tempo real</p>
          </div>
          <div className="flex items-center gap-2">
            {alertasCruzados.filter(a => a.gravidade === 'critica').length > 0 && (
              <span className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-700 text-xs font-bold px-3 py-1.5 rounded-full animate-pulse">
                <AlertTriangle size={12} />
                {alertasCruzados.filter(a => a.gravidade === 'critica').length} alertas críticos
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-6">

        {/* ── LINHA 1: KPIs financeiros ───────────────────────────── */}
        <section>
          <SectionHeader label="Financeiro" href="/financeiro" icon={<DollarSign size={14} />} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard
              label="MRR" valor={formatarMoeda(mrr)} cor="emerald"
              sub={`${clientesAtivos.length} contratos ativos`}
              icon={<TrendingUp size={15} className="text-emerald-500" />}
              delta={deltaMRR !== null ? { valor: deltaMRR, positivo: deltaMRR >= 0 } : undefined}
            />
            <KpiCard
              label="Receita do mês" valor={formatarMoeda(resumo.receita_realizada)} cor="blue"
              sub={resumo.receita_prevista > 0 ? `+ ${formatarMoeda(resumo.receita_prevista)} previsto` : 'Nada pendente'}
              icon={<DollarSign size={15} className="text-blue-500" />}
            />
            <KpiCard
              label="Margem bruta" valor={`${resumo.margem_pct}%`} isTexto
              cor={resumo.margem_pct >= 35 ? 'blue' : 'red'}
              sub={`${formatarMoeda(resumo.margem_valor)} de resultado`}
              icon={<Activity size={15} className={resumo.margem_pct >= 35 ? 'text-blue-500' : 'text-red-500'} />}
              alerta={resumo.margem_pct < 35}
            />
            <KpiCard
              label="Inadimplência" valor={formatarMoeda(resumo.inadimplencia)} cor={resumo.inadimplencia > 0 ? 'red' : 'emerald'}
              sub={inadimplentes.length > 0 ? `${inadimplentes.length} pag. em atraso` : 'Tudo em dia ✓'}
              icon={<AlertTriangle size={15} className={resumo.inadimplencia > 0 ? 'text-red-500' : 'text-emerald-500'} />}
              alerta={resumo.inadimplencia > 0}
            />
          </div>

          {/* Barra de meta */}
          {resumo.meta && (
            <div className="mt-3 bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-4">
              <div className="flex items-center gap-2 flex-none">
                <Target size={14} className="text-blue-500" />
                <span className="text-xs font-semibold text-slate-600">Meta do mês: {formatarMoeda(resumo.meta.meta_receita)}</span>
              </div>
              <div className="flex-1">
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      resumo.receita_realizada >= resumo.meta.meta_receita ? 'bg-emerald-500' :
                      resumo.receita_realizada >= resumo.meta.meta_receita * 0.7 ? 'bg-amber-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${Math.min((resumo.receita_realizada / resumo.meta.meta_receita) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <span className={`text-sm font-bold flex-none ${
                resumo.receita_realizada >= resumo.meta.meta_receita ? 'text-emerald-600' :
                resumo.receita_realizada >= resumo.meta.meta_receita * 0.7 ? 'text-amber-600' : 'text-red-600'
              }`}>
                {Math.round((resumo.receita_realizada / resumo.meta.meta_receita) * 100)}% atingido
              </span>
            </div>
          )}
        </section>

        {/* ── LINHA 2: Comercial + Clientes ──────────────────────── */}
        <div className="grid grid-cols-2 gap-6">
          <section>
            <SectionHeader label="CRM Comercial" href="/crm" icon={<Users size={14} />} />
            <div className="grid grid-cols-2 gap-3 mb-3">
              <KpiCard label="Leads ativos" valor={String(leadsAtivos.length)} isTexto cor="slate"
                sub={`${leadsQualificados.length} qualificados`}
                icon={<Users size={15} className="text-slate-500" />} />
              <KpiCard label="Propostas" valor={String(propostas.length)} isTexto cor="violet"
                sub={`${formatarMoeda(receitaPipeline)} ponderado`}
                icon={<TrendingUp size={15} className="text-violet-500" />} />
              <KpiCard label="Conversão (90d)" valor={`${taxaConversao}%`} isTexto
                cor={taxaConversao >= 20 ? 'emerald' : taxaConversao >= 10 ? 'amber' : 'red'}
                sub={`${fechados.length} fechados`}
                icon={<Target size={15} className={taxaConversao >= 20 ? 'text-emerald-500' : 'text-amber-500'} />} />
              <KpiCard label="Follow-ups hoje" valor={String(followUpsHoje.length)} isTexto
                cor={followUpsAtrasados.length > 0 ? 'red' : 'blue'}
                sub={followUpsAtrasados.length > 0 ? `⚠️ ${followUpsAtrasados.length} atrasados` : 'Em dia'}
                icon={<Clock size={15} className={followUpsAtrasados.length > 0 ? 'text-red-500' : 'text-blue-500'} />}
                alerta={followUpsAtrasados.length > 0} />
            </div>
          </section>

          <section>
            <SectionHeader label="Base de Clientes" href="/clientes" icon={<Building2 size={14} />} />
            <div className="grid grid-cols-2 gap-3 mb-3">
              <KpiCard label="Ativos" valor={String(clientesAtivos.length)} isTexto cor="emerald"
                sub={`de ${clientes.length} no total`}
                icon={<Building2 size={15} className="text-emerald-500" />} />
              <KpiCard label="Em risco (churn)" valor={String(clientesEmRisco.length)} isTexto
                cor={clientesEmRisco.length > 0 ? 'red' : 'emerald'}
                sub={churnRiskMRR > 0 ? `${formatarMoeda(churnRiskMRR)}/mês em risco` : 'Nenhum'}
                icon={<AlertTriangle size={15} className={clientesEmRisco.length > 0 ? 'text-red-500' : 'text-emerald-500'} />}
                alerta={clientesEmRisco.length > 0} />
              <KpiCard label="NPS médio" valor={npsMediaVal !== null ? `${npsMediaVal}/10` : '—'} isTexto
                cor={npsMediaVal !== null ? (npsMediaVal >= 8 ? 'emerald' : npsMediaVal >= 6 ? 'amber' : 'red') : 'slate'}
                sub="satisfação dos clientes"
                icon={<Star size={15} className={npsMediaVal !== null && npsMediaVal >= 8 ? 'text-emerald-500' : 'text-amber-500'} />} />
              <KpiCard label="Renovações 60d" valor={String(renovacoesEm60d)} isTexto
                cor={renovacoesEm60d > 0 ? 'amber' : 'emerald'}
                sub="contratos a vencer"
                icon={<RefreshCw size={15} className={renovacoesEm60d > 0 ? 'text-amber-500' : 'text-emerald-500'} />}
                alerta={renovacoesEm60d > 0} />
            </div>
          </section>
        </div>

        {/* ── LINHA 3: Operação ───────────────────────────────────── */}
        <section>
          <SectionHeader label="Operação & Produção" href="/projetos" icon={<FolderKanban size={14} />} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard label="Projetos ativos" valor={String(projetosAtivos.length)} isTexto cor="blue"
              sub={`de ${projetos.length} no total`}
              icon={<FolderKanban size={15} className="text-blue-500" />} />
            <KpiCard label="Tarefas atrasadas" valor={String(tarefasAtrasadas.length)} isTexto
              cor={tarefasAtrasadas.length > 0 ? 'red' : 'emerald'}
              sub={tarefasAtrasadas.length > 0 ? `Maior atraso: ${tarefasAtrasadas[0]?.diasAtraso}d` : 'Tudo em dia ✓'}
              icon={<AlertTriangle size={15} className={tarefasAtrasadas.length > 0 ? 'text-red-500' : 'text-emerald-500'} />}
              alerta={tarefasAtrasadas.length > 0} />
            <KpiCard label="Aguardando cliente" valor={String(projetosAguardando.length)} isTexto
              cor={projetosAguardando.length > 0 ? 'amber' : 'emerald'}
              sub="projetos pausados aguardando"
              icon={<Clock size={15} className={projetosAguardando.length > 0 ? 'text-amber-500' : 'text-emerald-500'} />}
              alerta={projetosAguardando.length > 0} />
            <KpiCard label="Horas em produção" valor={`${Math.round(horasPendentes)}h`} isTexto cor="violet"
              sub="estimativa restante"
              icon={<Activity size={15} className="text-violet-500" />} />
          </div>
        </section>

        {/* ── ALERTAS CRUZADOS ────────────────────────────────────── */}
        {alertasCruzados.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Zap size={14} className="text-red-500" />
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Alertas cruzados — requer ação imediata</p>
            </div>
            <div className="space-y-2">
              {alertasCruzados.map(a => (
                <Link key={a.id} href={a.href}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all hover:shadow-sm ${
                    a.gravidade === 'critica' ? 'bg-red-50 border-red-200 hover:border-red-300' :
                    a.gravidade === 'alta' ? 'bg-amber-50 border-amber-200 hover:border-amber-300' :
                    'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}>
                  <AlertTriangle size={15} className={`mt-0.5 flex-none ${
                    a.gravidade === 'critica' ? 'text-red-600' :
                    a.gravidade === 'alta' ? 'text-amber-600' : 'text-slate-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className={`text-sm font-bold ${
                        a.gravidade === 'critica' ? 'text-red-800' :
                        a.gravidade === 'alta' ? 'text-amber-800' : 'text-slate-700'
                      }`}>{a.titulo}</p>
                      <span className="text-xs text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded-full">{a.modulo}</span>
                    </div>
                    <p className="text-xs text-slate-500">{a.descricao}</p>
                  </div>
                  <ChevronRight size={14} className="text-slate-400 mt-0.5 flex-none" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── SAÚDE POR CLIENTE ────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-slate-500" />
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Saúde por cliente — visão integrada</p>
            </div>
            <Link href="/clientes" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              Ver todos <ChevronRight size={12} />
            </Link>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left text-xs font-semibold text-slate-500 px-4 py-2.5">Cliente</th>
                  <th className="text-right text-xs font-semibold text-slate-500 px-3 py-2.5">MRR</th>
                  <th className="text-center text-xs font-semibold text-slate-500 px-3 py-2.5">Financeiro</th>
                  <th className="text-center text-xs font-semibold text-slate-500 px-3 py-2.5">Operação</th>
                  <th className="text-center text-xs font-semibold text-slate-500 px-3 py-2.5">NPS</th>
                  <th className="text-center text-xs font-semibold text-slate-500 px-4 py-2.5">Risco</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {saudeClientes.map(({ cliente, mrrCliente, statusPagamento, statusProjeto, tarefasAtrasadas: ta, risco }) => {
                  const statusClienteCfg = STATUS_CLIENTE_CONFIG[cliente.status]
                  return (
                    <tr key={cliente.id} className={`hover:bg-slate-50 transition-colors ${risco === 'alto' ? 'bg-red-50/30' : ''}`}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800">{cliente.nome_empresa}</p>
                        <p className="text-xs text-slate-400">{statusClienteCfg.icone} {statusClienteCfg.label}</p>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <p className="font-bold text-slate-700">{mrrCliente > 0 ? formatarMoeda(mrrCliente) : '—'}</p>
                        <p className="text-xs text-slate-400">/mês</p>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <StatusPill tipo={statusPagamento} />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <ProjetoPill tipo={statusProjeto} atraso={ta} />
                      </td>
                      <td className="px-3 py-3 text-center">
                        {cliente.nps !== undefined ? (
                          <span className={`text-sm font-bold ${cliente.nps >= 9 ? 'text-emerald-600' : cliente.nps >= 7 ? 'text-amber-600' : 'text-red-600'}`}>
                            {cliente.nps}/10
                          </span>
                        ) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                          risco === 'alto' ? 'bg-red-100 text-red-700' :
                          risco === 'medio' ? 'bg-amber-100 text-amber-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {risco === 'alto' ? '🔴 Alto' : risco === 'medio' ? '🟡 Médio' : '🟢 Baixo'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── FORECAST 3 MESES ────────────────────────────────────── */}
        <section>
          <SectionHeader label="Forecast de receita" href="/financeiro" icon={<TrendingUp size={14} />} />
          <div className="grid grid-cols-3 gap-4">
            {resumoForecast.map((r, idx) => {
              const isCurrent = r.competencia === COMPETENCIA_ATUAL
              const metaPct = r.meta ? Math.round((r.receita_total / r.meta.meta_receita) * 100) : null
              const barPct = r.meta ? Math.min((r.receita_total / r.meta.meta_receita) * 100, 100) : 60
              return (
                <div key={r.competencia}
                  className={`bg-white rounded-xl border p-4 ${isCurrent ? 'border-blue-300 ring-1 ring-blue-100' : 'border-slate-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-slate-700">{competenciaLabel(r.competencia)}</p>
                    {isCurrent && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Atual</span>}
                    {idx > 0 && <span className="text-xs text-slate-400">Previsto</span>}
                  </div>
                  <p className="text-2xl font-bold text-slate-800 mb-1">{formatarMoeda(r.receita_total)}</p>
                  <div className="space-y-0.5 mb-3 text-xs">
                    <p className="text-emerald-600">✅ {formatarMoeda(r.receita_realizada)} confirmado</p>
                    <p className="text-slate-400">📄 {formatarMoeda(r.receita_prevista)} previsto</p>
                  </div>
                  {r.meta && (
                    <>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-1">
                        <div
                          className={`h-full rounded-full ${metaPct! >= 100 ? 'bg-emerald-500' : metaPct! >= 70 ? 'bg-amber-400' : 'bg-red-400'}`}
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>{metaPct}% da meta</span>
                        <span>{formatarMoeda(r.meta.meta_receita)}</span>
                      </div>
                    </>
                  )}
                  <div className="pt-2 mt-2 border-t border-slate-100">
                    <p className={`text-xs font-semibold ${(r.margem_pct || 35) >= 35 ? 'text-emerald-600' : 'text-red-600'}`}>
                      Margem estimada: {r.margem_pct || 35}%
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ label, href, icon }: { label: string; href: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <span className="text-slate-400">{icon}</span>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</p>
      </div>
      <Link href={href} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
        Ver detalhes <ChevronRight size={12} />
      </Link>
    </div>
  )
}

function KpiCard({ label, valor, sub, cor, icon, delta, alerta = false, isTexto = false }: {
  label: string
  valor: string | number
  sub: string
  cor: string
  icon: React.ReactNode
  delta?: { valor: number; positivo: boolean }
  alerta?: boolean
  isTexto?: boolean
}) {
  const corMap: Record<string, string> = {
    emerald: 'bg-emerald-50 border-emerald-100',
    blue:    'bg-blue-50 border-blue-100',
    red:     'bg-red-50 border-red-100',
    amber:   'bg-amber-50 border-amber-100',
    violet:  'bg-violet-50 border-violet-100',
    slate:   'bg-slate-50 border-slate-100',
  }
  const displayValor = isTexto ? valor : (typeof valor === 'number' ? formatarMoeda(valor) : valor)
  return (
    <div className={`rounded-xl border p-3 ${corMap[cor] ?? 'bg-slate-50 border-slate-100'} ${alerta ? 'ring-1 ring-red-300' : ''}`}>
      <div className="flex items-center gap-2 mb-1">{icon}<span className="text-xs text-slate-500">{label}</span></div>
      <p className="text-lg font-bold text-slate-800 leading-tight">{displayValor}</p>
      <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
      {delta && (
        <span className={`text-xs font-medium flex items-center gap-0.5 mt-1 ${delta.positivo ? 'text-emerald-600' : 'text-red-600'}`}>
          {delta.positivo ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {delta.positivo ? '+' : ''}{delta.valor}% vs mês ant.
        </span>
      )}
    </div>
  )
}

function StatusPill({ tipo }: { tipo: 'pago' | 'emitido' | 'atrasado' | 'previsto' }) {
  const cfg = {
    pago:     { label: '✅ Pago',     cls: 'bg-emerald-100 text-emerald-700' },
    emitido:  { label: '📄 Emitido',  cls: 'bg-blue-100 text-blue-700' },
    atrasado: { label: '⚠️ Atrasado', cls: 'bg-red-100 text-red-700 font-bold' },
    previsto: { label: '📅 Previsto', cls: 'bg-slate-100 text-slate-600' },
  }[tipo]
  return <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.cls}`}>{cfg.label}</span>
}

function ProjetoPill({ tipo, atraso }: { tipo: 'atrasado' | 'aguardando' | 'ok' | 'sem_projeto'; atraso: number }) {
  const cfg = {
    atrasado:    { label: `⚠️ ${atraso}t atrasada${atraso > 1 ? 's' : ''}`, cls: 'bg-red-100 text-red-700 font-bold' },
    aguardando:  { label: '⏳ Aguardando',  cls: 'bg-amber-100 text-amber-700' },
    ok:          { label: '✅ Em dia',      cls: 'bg-emerald-100 text-emerald-700' },
    sem_projeto: { label: '— Sem projeto',  cls: 'bg-slate-100 text-slate-400' },
  }[tipo]
  return <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.cls}`}>{cfg.label}</span>
}
