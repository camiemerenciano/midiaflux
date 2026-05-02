'use client'

import { useState, useMemo } from 'react'
import { useClientesStore } from '@/lib/clientes/store'
import { Cliente, TipoCliente, StatusCliente } from '@/lib/clientes/types'
import { TIPO_CLIENTE_CONFIG, STATUS_CLIENTE_CONFIG } from '@/lib/clientes/constants'
import { USUARIOS } from '@/lib/crm/constants'
import { formatarMoeda, formatarData } from '@/lib/crm/score'
import { ClienteCard } from '@/components/clientes/ClienteCard'
import { ClienteModal } from '@/components/clientes/ClienteModal'
import { NovoClienteForm } from '@/components/clientes/NovoClienteForm'
import { Search, Plus, TrendingUp, AlertTriangle, Users, RefreshCw } from 'lucide-react'

const TODOS_TIPOS: (TipoCliente | 'todos')[] = ['todos', 'retainer', 'projeto', 'performance', 'consultoria']
const TODOS_STATUS: (StatusCliente | 'todos')[] = ['todos', 'ativo', 'em_risco', 'pausado', 'encerrado']

export default function ClientesPage() {
  const {
    clientes, contatos, contratos, entregas,
    updateStatus, updateCliente, addEntrega, addCliente, addContato, addContrato, getMRR,
    getContratosAtivos, getEntregasByCliente, getContatosByCliente,
  } = useClientesStore()

  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  const [showNovoCliente, setShowNovoCliente] = useState(false)
  const [busca, setBusca] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<TipoCliente | 'todos'>('todos')
  const [filtroStatus, setFiltroStatus] = useState<StatusCliente | 'todos'>('todos')
  const [filtroResponsavel, setFiltroResponsavel] = useState('')

  const clientesFiltrados = useMemo(() => {
    return clientes.filter((c) => {
      const matchBusca =
        !busca ||
        c.nome_empresa.toLowerCase().includes(busca.toLowerCase()) ||
        (c.cidade ?? '').toLowerCase().includes(busca.toLowerCase())
      const matchTipo = filtroTipo === 'todos' || c.tipo === filtroTipo
      const matchStatus = filtroStatus === 'todos' || c.status === filtroStatus
      const matchResp = !filtroResponsavel || c.responsavel_id === filtroResponsavel
      return matchBusca && matchTipo && matchStatus && matchResp
    })
  }, [clientes, busca, filtroTipo, filtroStatus, filtroResponsavel])

  // KPIs
  const mrr = getMRR()
  const clientesAtivos = clientes.filter((c) => c.status === 'ativo').length
  const clientesEmRisco = clientes.filter((c) => c.status === 'em_risco').length
  const renovacoesEm60d = contratos.filter((k) => {
    if (!k.data_fim || k.status !== 'ativo') return false
    const diff = new Date(k.data_fim).getTime() - Date.now()
    return diff > 0 && diff <= 60 * 24 * 60 * 60 * 1000
  }).length

  const churnRisk = contratos
    .filter((k) => {
      const c = clientes.find((cl) => cl.id === k.cliente_id)
      return c?.status === 'em_risco' && k.status === 'ativo'
    })
    .reduce((sum, k) => sum + (k.valor_mensal ?? 0), 0)

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Base de Clientes</h1>
            <p className="text-sm text-slate-500">{clientes.length} clientes · {clientesAtivos} ativos</p>
          </div>
          <button
            onClick={() => setShowNovoCliente(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm shadow-sm"
          >
            <Plus size={16} />
            Novo Cliente
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <KpiCard
            icon={<TrendingUp size={16} className="text-emerald-500" />}
            label="MRR total"
            value={formatarMoeda(mrr)}
            sub={`${clientesAtivos} contratos ativos`}
            cor="emerald"
          />
          <KpiCard
            icon={<Users size={16} className="text-blue-500" />}
            label="Clientes ativos"
            value={String(clientesAtivos)}
            sub={`de ${clientes.length} no total`}
            cor="blue"
          />
          <KpiCard
            icon={<AlertTriangle size={16} className="text-red-500" />}
            label="Em risco de churn"
            value={String(clientesEmRisco)}
            sub={churnRisk > 0 ? `${formatarMoeda(churnRisk)}/mês em risco` : 'Nenhum'}
            cor="red"
            alerta={clientesEmRisco > 0}
          />
          <KpiCard
            icon={<RefreshCw size={16} className="text-amber-500" />}
            label="Renovações em 60d"
            value={String(renovacoesEm60d)}
            sub="contratos a vencer"
            cor="amber"
            alerta={renovacoesEm60d > 0}
          />
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar empresa ou cidade..."
              className="pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>

          {/* Filtro tipo — tabs */}
          <div className="flex bg-slate-100 rounded-lg p-1 gap-0.5">
            {TODOS_TIPOS.map((tipo) => {
              const label = tipo === 'todos' ? 'Todos' : TIPO_CLIENTE_CONFIG[tipo].label
              return (
                <button
                  key={tipo}
                  onClick={() => setFiltroTipo(tipo)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    filtroTipo === tipo
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>

          {/* Filtro status */}
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value as typeof filtroStatus)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {TODOS_STATUS.map((s) => (
              <option key={s} value={s}>
                {s === 'todos' ? 'Todos os status' : STATUS_CLIENTE_CONFIG[s].label}
              </option>
            ))}
          </select>

          <select
            value={filtroResponsavel}
            onChange={(e) => setFiltroResponsavel(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos os AMs</option>
            {USUARIOS.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
          </select>

          {(busca || filtroTipo !== 'todos' || filtroStatus !== 'todos' || filtroResponsavel) && (
            <button
              onClick={() => { setBusca(''); setFiltroTipo('todos'); setFiltroStatus('todos'); setFiltroResponsavel('') }}
              className="text-xs text-slate-500 hover:text-slate-700 underline"
            >
              Limpar
            </button>
          )}

          <span className="text-xs text-slate-400 ml-auto">{clientesFiltrados.length} resultado{clientesFiltrados.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Grid de clientes */}
      <div className="flex-1 overflow-y-auto p-6">
        {clientesFiltrados.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-400 text-sm">Nenhum cliente encontrado com os filtros selecionados.</p>
          </div>
        ) : (
          <>
            {/* Clientes em risco primeiro (se existirem) */}
            {filtroStatus === 'todos' && clientesFiltrados.some((c) => c.status === 'em_risco') && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={14} className="text-red-500" />
                  <p className="text-xs font-bold text-red-600 uppercase tracking-wide">Atenção — Em risco de churn</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {clientesFiltrados
                    .filter((c) => c.status === 'em_risco')
                    .map((cliente) => (
                      <ClienteCard
                        key={cliente.id}
                        cliente={cliente}
                        contratos={contratos.filter((k) => k.cliente_id === cliente.id)}
                        onClick={() => setClienteSelecionado(cliente)}
                        onFotoChange={(id, foto) => updateCliente(id, { foto_capa: foto ?? undefined })}
                      />
                    ))}
                </div>
              </div>
            )}

            {/* Restante dos clientes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {clientesFiltrados
                .filter((c) => filtroStatus !== 'todos' || c.status !== 'em_risco')
                .sort((a, b) => {
                  // Ativos primeiro, depois por MRR desc
                  if (a.status === 'encerrado' && b.status !== 'encerrado') return 1
                  if (a.status !== 'encerrado' && b.status === 'encerrado') return -1
                  const mrrA = contratos.filter((k) => k.cliente_id === a.id).reduce((s, k) => s + (k.valor_mensal ?? 0), 0)
                  const mrrB = contratos.filter((k) => k.cliente_id === b.id).reduce((s, k) => s + (k.valor_mensal ?? 0), 0)
                  return mrrB - mrrA
                })
                .map((cliente) => (
                  <ClienteCard
                    key={cliente.id}
                    cliente={cliente}
                    contratos={contratos.filter((k) => k.cliente_id === cliente.id)}
                    onClick={() => setClienteSelecionado(cliente)}
                  />
                ))}
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {clienteSelecionado && (
        <ClienteModal
          cliente={clienteSelecionado}
          contatos={getContatosByCliente(clienteSelecionado.id)}
          contratos={contratos.filter((k) => k.cliente_id === clienteSelecionado.id)}
          entregas={getEntregasByCliente(clienteSelecionado.id)}
          onClose={() => setClienteSelecionado(null)}
          onUpdateStatus={(id, status, motivo) => {
            updateStatus(id, status, motivo)
            setClienteSelecionado((prev) => prev ? { ...prev, status } : null)
          }}
          onAddEntrega={addEntrega}
        />
      )}

      {/* Formulário novo cliente */}
      {showNovoCliente && (
        <NovoClienteForm
          onSave={(clienteData, contatoData, contratoData) => {
            const clienteId = addCliente(clienteData)
            addContato({ ...contatoData, cliente_id: clienteId })
            addContrato({ ...contratoData, cliente_id: clienteId })
            setShowNovoCliente(false)
          }}
          onCancel={() => setShowNovoCliente(false)}
        />
      )}
    </div>
  )
}

function KpiCard({
  icon, label, value, sub, cor, alerta = false,
}: {
  icon: React.ReactNode; label: string; value: string; sub: string; cor: string; alerta?: boolean
}) {
  const corMap: Record<string, string> = {
    emerald: 'bg-emerald-50 border-emerald-100',
    blue: 'bg-blue-50 border-blue-100',
    red: 'bg-red-50 border-red-100',
    amber: 'bg-amber-50 border-amber-100',
  }
  return (
    <div className={`rounded-xl border p-3 ${corMap[cor]} ${alerta ? 'ring-1 ring-red-200' : ''}`}>
      <div className="flex items-center gap-2 mb-1">{icon}<span className="text-xs text-slate-500">{label}</span></div>
      <p className="text-lg font-bold text-slate-800">{value}</p>
      <p className="text-xs text-slate-400">{sub}</p>
    </div>
  )
}
