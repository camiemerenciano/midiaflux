import { Lead, FunnelStage } from '@/lib/crm/types'
import { Interacao } from '@/lib/crm/types'
import { Cliente, Contrato } from '@/lib/clientes/types'
import { Tarefa, Projeto } from '@/lib/operacao/types'
import { Lancamento } from '@/lib/financeiro/types'

// ─── Benchmarks ────────────────────────────────────────────────────────────────

export type Classificacao = 'critico' | 'atencao' | 'bom' | 'excelente' | 'sem_dados'

export function classificar(valor: number | null, faixas: [number, number, number]): Classificacao {
  if (valor === null) return 'sem_dados'
  const [atencao, bom, excelente] = faixas
  if (valor < atencao) return 'critico'
  if (valor < bom) return 'atencao'
  if (valor < excelente) return 'bom'
  return 'excelente'
}

export const COR_CLASSIFICACAO: Record<Classificacao, { texto: string; bg: string; borda: string; barra: string }> = {
  critico:   { texto: 'text-red-700',     bg: 'bg-red-50',     borda: 'border-red-200',     barra: 'bg-red-500' },
  atencao:   { texto: 'text-amber-700',   bg: 'bg-amber-50',   borda: 'border-amber-200',   barra: 'bg-amber-400' },
  bom:       { texto: 'text-blue-700',    bg: 'bg-blue-50',    borda: 'border-blue-200',    barra: 'bg-blue-500' },
  excelente: { texto: 'text-emerald-700', bg: 'bg-emerald-50', borda: 'border-emerald-200', barra: 'bg-emerald-500' },
  sem_dados: { texto: 'text-slate-500',   bg: 'bg-slate-50',   borda: 'border-slate-200',   barra: 'bg-slate-300' },
}

export const EMOJI_CLASSIFICACAO: Record<Classificacao, string> = {
  critico: '🔴', atencao: '🟡', bom: '🔵', excelente: '🟢', sem_dados: '⚪',
}

// ─── 1. Taxa de Conversão ──────────────────────────────────────────────────────

const ESTAGIOS_QUALIFICADO: FunnelStage[] = [
  'qualificado', 'proposta_enviada', 'negociando', 'fechado',
]
const ESTAGIOS_PROPOSTA: FunnelStage[] = ['proposta_enviada', 'negociando', 'fechado']

export interface KPIConversao {
  totalLeads: number
  qualificados: number
  propostas: number
  fechados: number
  perdidos: number
  taxaLQ: number | null    // Lead → Qualificado
  taxaQP: number | null    // Qualificado → Proposta
  taxaPF: number | null    // Proposta → Fechamento
  taxaTotal: number | null // Lead → Cliente
  classTotal: Classificacao
  classLQ: Classificacao
  classQP: Classificacao
  classPF: Classificacao
}

export function calcularConversao(leads: Lead[]): KPIConversao {
  const total    = leads.length
  const qualif   = leads.filter(l => ESTAGIOS_QUALIFICADO.includes(l.status)).length
  const propostas = leads.filter(l => ESTAGIOS_PROPOSTA.includes(l.status)).length
  const fechados  = leads.filter(l => l.status === 'fechado').length
  const perdidos  = leads.filter(l => l.status === 'sem_interesse').length

  const pct = (n: number, d: number) => d > 0 ? Math.round((n / d) * 100) : null

  const taxaLQ    = pct(qualif, total)
  const taxaQP    = pct(propostas, qualif)
  const taxaPF    = pct(fechados, fechados + perdidos)
  const taxaTotal = pct(fechados, total)

  return {
    totalLeads: total, qualificados: qualif, propostas, fechados, perdidos,
    taxaLQ, taxaQP, taxaPF, taxaTotal,
    classTotal: classificar(taxaTotal, [8, 15, 25]),
    classLQ:    classificar(taxaLQ,    [30, 40, 60]),
    classQP:    classificar(taxaQP,    [50, 65, 80]),
    classPF:    classificar(taxaPF,    [20, 30, 50]),
  }
}

// ─── 2. CAC ───────────────────────────────────────────────────────────────────

export interface KPICAC {
  cac: number | null
  custoComercial: number
  novosClientes: number
  relacaoLTVCAC: number | null
  classCac: Classificacao
  competencia: string
}

export function calcularCAC(lancamentos: Lancamento[], novosClientesUltimos30d: number, ltvMedio: number | null): KPICAC {
  const comp = new Date().toISOString().slice(0, 7)
  const custoComercial = lancamentos
    .filter(l =>
      l.competencia === comp &&
      l.tipo === 'custo' &&
      ['pessoal', 'ferramentas', 'marketing'].includes(l.categoria)
    )
    .reduce((s, l) => s + l.valor, 0)

  const cac = novosClientesUltimos30d > 0 ? Math.round(custoComercial / novosClientesUltimos30d) : null
  const relacaoLTVCAC = cac && ltvMedio && cac > 0 ? Math.round((ltvMedio / cac) * 10) / 10 : null

  // CAC bom depende do ticket — classifica pela relação LTV:CAC
  const classCac = classificar(relacaoLTVCAC, [1, 3, 5])

  return { cac, custoComercial, novosClientes: novosClientesUltimos30d, relacaoLTVCAC, classCac, competencia: comp }
}

// ─── 3. LTV ───────────────────────────────────────────────────────────────────

export interface KPILTV {
  ltv: number | null
  ticketMedio: number | null
  tenuraMedio: number | null       // meses médios de contrato
  margemEstimada: number           // % margem bruta usada no cálculo
  clientesAtivos: number
  clientesEncerrados: number
  classLTV: Classificacao
}

export function calcularLTV(clientes: Cliente[], contratos: Contrato[], margemPct: number = 40): KPILTV {
  const ativos = clientes.filter(c => c.status === 'ativo')
  const encerrados = clientes.filter(c => c.status === 'encerrado' && c.data_fim)

  // Ticket médio dos contratos ativos
  const contratosAtivos = contratos.filter(k => k.status === 'ativo' && k.valor_mensal)
  const ticketMedio = contratosAtivos.length > 0
    ? Math.round(contratosAtivos.reduce((s, k) => s + (k.valor_mensal ?? 0), 0) / contratosAtivos.length)
    : null

  // Tenure médio dos clientes encerrados
  const tenuraMedio = encerrados.length > 0
    ? Math.round(
        encerrados.reduce((s, c) => {
          const meses = Math.floor(
            (new Date(c.data_fim!).getTime() - new Date(c.data_inicio).getTime()) / (1000 * 60 * 60 * 24 * 30)
          )
          return s + meses
        }, 0) / encerrados.length
      )
    : null

  // LTV = ticket × tenure × margem
  const ltv = ticketMedio && tenuraMedio
    ? Math.round(ticketMedio * tenuraMedio * (margemPct / 100))
    : null

  // Sem histórico de encerrados, estima com tenure médio de mercado (14 meses)
  const ltvEstimado = !ltv && ticketMedio
    ? Math.round(ticketMedio * 14 * (margemPct / 100))
    : ltv

  return {
    ltv: ltvEstimado,
    ticketMedio,
    tenuraMedio,
    margemEstimada: margemPct,
    clientesAtivos: ativos.length,
    clientesEncerrados: encerrados.length,
    classLTV: ltvEstimado ? (ltvEstimado > 50000 ? 'excelente' : ltvEstimado > 25000 ? 'bom' : ltvEstimado > 10000 ? 'atencao' : 'critico') : 'sem_dados',
  }
}

// ─── 4. Retenção ──────────────────────────────────────────────────────────────

export interface KPIRetencao {
  retencao: number | null       // % de clientes retidos
  churnRate: number | null      // % de churn total histórico
  npsMedia: number | null
  totalClientes: number
  clientesAtivos: number
  clientesEncerrados: number
  clientesEmRisco: number
  classRetencao: Classificacao
  classNPS: Classificacao
}

export function calcularRetencao(clientes: Cliente[]): KPIRetencao {
  const ativos     = clientes.filter(c => c.status === 'ativo' || c.status === 'em_risco').length
  const encerrados = clientes.filter(c => c.status === 'encerrado').length
  const emRisco    = clientes.filter(c => c.status === 'em_risco').length
  const total      = ativos + encerrados

  const churnRate = total > 0 ? Math.round((encerrados / total) * 100) : null
  const retencao  = churnRate !== null ? 100 - churnRate : null

  const comNPS    = clientes.filter(c => c.nps !== undefined)
  const npsMedia  = comNPS.length > 0
    ? Math.round(comNPS.reduce((s, c) => s + c.nps!, 0) / comNPS.length * 10) / 10
    : null

  return {
    retencao, churnRate, npsMedia,
    totalClientes: total, clientesAtivos: ativos,
    clientesEncerrados: encerrados, clientesEmRisco: emRisco,
    classRetencao: classificar(retencao, [40, 70, 85]),
    classNPS: classificar(npsMedia, [6, 7, 9]),
  }
}

// ─── 5. Produtividade ─────────────────────────────────────────────────────────

export interface KPIProdutividade {
  sla: number | null            // % tarefas entregues no prazo
  eficiencia: number | null     // horas estimadas / realizadas × 100
  utilizacao: number | null     // horas em tarefas / horas disponíveis
  receitaColaborador: number | null
  horasRealizadas: number
  tarefasConcluidas: number
  classSLA: Classificacao
  classEficiencia: Classificacao
  classUtilizacao: Classificacao
}

const COLABORADORES = 3        // número fixo de colaboradores
const HORAS_MES_PESSOA = 160   // horas disponíveis por pessoa por mês

export function calcularProdutividade(tarefas: Tarefa[], lancamentos: Lancamento[]): KPIProdutividade {
  const concluidas = tarefas.filter(t => t.status === 'concluido')

  // SLA: tarefas concluídas dentro do prazo
  const noPrazo = concluidas.filter(t =>
    t.data_conclusao && new Date(t.data_conclusao) <= new Date(t.data_prevista)
  )
  const sla = concluidas.length > 0 ? Math.round((noPrazo.length / concluidas.length) * 100) : null

  // Eficiência de estimativa
  const comHoras = concluidas.filter(t => t.estimativa_horas && t.horas_realizadas && t.horas_realizadas > 0)
  const eficiencia = comHoras.length > 0
    ? Math.round(
        comHoras.reduce((s, t) => s + t.estimativa_horas! / t.horas_realizadas!, 0) / comHoras.length * 100
      )
    : null

  // Utilização (horas realizadas em tarefas ativas / disponíveis)
  const horasRealizadas = tarefas
    .filter(t => t.status !== 'backlog')
    .reduce((s, t) => s + (t.horas_realizadas ?? 0), 0)
  const horasDisponiveis = COLABORADORES * HORAS_MES_PESSOA
  const utilizacao = horasRealizadas > 0 ? Math.round((horasRealizadas / horasDisponiveis) * 100) : null

  // Receita por colaborador
  const comp = new Date().toISOString().slice(0, 7)
  const receitaMes = lancamentos
    .filter(l => l.competencia === comp && l.tipo === 'receita' && l.status === 'pago')
    .reduce((s, l) => s + l.valor, 0)
  const receitaColaborador = receitaMes > 0 ? Math.round(receitaMes / COLABORADORES) : null

  return {
    sla, eficiencia, utilizacao, receitaColaborador,
    horasRealizadas, tarefasConcluidas: concluidas.length,
    classSLA:        classificar(sla,        [70, 80, 90]),
    classEficiencia: classificar(eficiencia, [70, 85, 100]),
    classUtilizacao: utilizacao !== null
      ? (utilizacao > 85 ? 'atencao' : utilizacao >= 65 ? 'bom' : utilizacao >= 55 ? 'atencao' : 'critico')
      : 'sem_dados',
  }
}
