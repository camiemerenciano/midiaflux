'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAgendaStore } from '@/lib/agenda/store'
import {
  solicitarToken, buscarEventos, criarEvento, excluirEvento,
  eventosDoDia, eventoHora, corEvento,
} from '@/lib/agenda/google'
import { GCalEvent } from '@/lib/agenda/types'
import { NovoEventoForm } from '@/components/agenda/NovoEventoForm'
import {
  ChevronLeft, ChevronRight, Plus, RefreshCw,
  X, ExternalLink, MapPin, Calendar, Unlink, Settings,
} from 'lucide-react'

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

export default function AgendaPage() {
  const {
    config, setConfig, clearConfig,
    accessToken, tokenExpiry, setToken, clearToken, isTokenValid,
    events, lastSync, setEvents,
    isLoading, error, setLoading, setError,
  } = useAgendaStore()

  const hoje = new Date()
  const [mesAtual, setMesAtual] = useState(hoje.getMonth())
  const [anoAtual, setAnoAtual] = useState(hoje.getFullYear())
  const [diaSelecionado, setDiaSelecionado] = useState<number | null>(hoje.getDate())
  const [eventoSelecionado, setEventoSelecionado] = useState<GCalEvent | null>(null)
  const [showNovoEvento, setShowNovoEvento] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [inputClientId, setInputClientId] = useState(config?.clientId ?? '')

  // Sincronizar eventos quando o token é válido
  const sincronizar = useCallback(async () => {
    if (!accessToken || !isTokenValid()) return
    setLoading(true)
    try {
      const evs = await buscarEventos(accessToken)
      setEvents(evs, new Date().toISOString())
    } catch (e: any) {
      setError(e.message ?? 'Erro ao sincronizar')
      if (e.message?.includes('401') || e.message?.includes('Invalid Credentials')) {
        clearToken()
      }
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    if (isTokenValid() && events.length === 0) {
      sincronizar()
    }
  }, [])

  async function conectar() {
    if (!config?.clientId) { setShowConfig(true); return }
    setLoading(true)
    setError(null)
    try {
      const token = await solicitarToken(config.clientId)
      setToken(token, 3600)
      const evs = await buscarEventos(token)
      setEvents(evs, new Date().toISOString())
    } catch (e: any) {
      setError(typeof e === 'string' ? e : (e.message ?? 'Erro na autenticação'))
    } finally {
      setLoading(false)
    }
  }

  async function handleCriarEvento(dados: Parameters<typeof criarEvento>[1]) {
    if (!accessToken) return
    setLoading(true)
    try {
      const novo = await criarEvento(accessToken, dados)
      setEvents([...events, novo], new Date().toISOString())
      setShowNovoEvento(false)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleExcluirEvento(id: string) {
    if (!accessToken) return
    try {
      await excluirEvento(accessToken, id)
      setEvents(events.filter(e => e.id !== id), new Date().toISOString())
      setEventoSelecionado(null)
    } catch (e: any) {
      setError(e.message)
    }
  }

  // ── Calendário ────────────────────────────────────────────────────────────
  const primeiroDia = new Date(anoAtual, mesAtual, 1).getDay()
  const ultimoDia   = new Date(anoAtual, mesAtual + 1, 0).getDate()
  const ultimoMesAnterior = new Date(anoAtual, mesAtual, 0).getDate()

  function navMes(dir: -1 | 1) {
    const d = new Date(anoAtual, mesAtual + dir, 1)
    setMesAtual(d.getMonth())
    setAnoAtual(d.getFullYear())
    setDiaSelecionado(null)
  }

  const eventosDiaSelecionado = diaSelecionado
    ? eventosDoDia(events, anoAtual, mesAtual, diaSelecionado)
    : []

  const isConnected = isTokenValid()
  const dataNovoEvento = diaSelecionado
    ? `${anoAtual}-${String(mesAtual + 1).padStart(2,'0')}-${String(diaSelecionado).padStart(2,'0')}`
    : undefined

  return (
    <div className="flex flex-col h-screen bg-slate-50">

      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex-none">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Agenda</h1>
            <p className="text-sm text-slate-500">
              {isConnected
                ? `Google Calendar conectado · ${events.length} eventos`
                : 'Conecte ao Google Calendar para sincronizar'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isConnected && (
              <>
                <button onClick={sincronizar} disabled={isLoading}
                  className="flex items-center gap-1.5 text-sm border border-slate-200 text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50">
                  <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                  Sincronizar
                </button>
                <button onClick={() => setShowNovoEvento(true)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold text-sm shadow-sm transition-colors">
                  <Plus size={16} /> Novo Evento
                </button>
                <button onClick={() => { clearToken(); clearConfig() }}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Desconectar">
                  <Unlink size={16} />
                </button>
              </>
            )}
            {!isConnected && (
              <>
                <button onClick={() => setShowConfig(true)}
                  className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors" title="Configurar Client ID">
                  <Settings size={16} />
                </button>
                <button onClick={conectar} disabled={isLoading}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold text-sm shadow-sm transition-colors disabled:opacity-60">
                  {isLoading ? <RefreshCw size={15} className="animate-spin" /> : <Calendar size={15} />}
                  Conectar Google Agenda
                </button>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-4 py-2 flex items-center justify-between">
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Corpo */}
      <div className="flex-1 flex overflow-hidden">

        {/* Calendário */}
        <div className="flex-1 p-5 overflow-y-auto">

          {/* Não conectado */}
          {!isConnected && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                <Calendar size={28} className="text-blue-500" />
              </div>
              <h2 className="text-lg font-bold text-slate-700 mb-2">Conecte ao Google Agenda</h2>
              <p className="text-sm text-slate-500 mb-6">
                Sincronize eventos, crie compromissos e gerencie sua agenda sem sair do MídiaFlux.
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left w-full mb-5 space-y-2">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Como configurar</p>
                <ol className="text-xs text-slate-500 space-y-1.5 list-decimal list-inside">
                  <li>Acesse <strong>console.cloud.google.com</strong></li>
                  <li>Crie um projeto ou selecione um existente</li>
                  <li>Ative a <strong>Google Calendar API</strong></li>
                  <li>Em "Credenciais" → crie um <strong>OAuth 2.0 Client ID</strong> do tipo "Aplicativo da Web"</li>
                  <li>Adicione <strong>http://localhost:3000</strong> em "Origens JavaScript autorizadas"</li>
                  <li>Copie o <strong>Client ID</strong> e clique em "Configurar"</li>
                </ol>
              </div>
              <div className="flex gap-2 w-full">
                <button onClick={() => setShowConfig(true)}
                  className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors">
                  Configurar Client ID
                </button>
                <button onClick={conectar} disabled={!config?.clientId}
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 text-sm font-semibold disabled:opacity-40 transition-colors">
                  Conectar
                </button>
              </div>
            </div>
          )}

          {/* Calendário mês */}
          {(isConnected || events.length > 0) && (
            <>
              {/* Navegação mês */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <button onClick={() => navMes(-1)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                    <ChevronLeft size={18} />
                  </button>
                  <h2 className="text-lg font-bold text-slate-800 min-w-[180px] text-center">
                    {MESES[mesAtual]} {anoAtual}
                  </h2>
                  <button onClick={() => navMes(1)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                    <ChevronRight size={18} />
                  </button>
                </div>
                <button
                  onClick={() => {
                    setMesAtual(hoje.getMonth())
                    setAnoAtual(hoje.getFullYear())
                    setDiaSelecionado(hoje.getDate())
                  }}
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  Hoje
                </button>
              </div>

              {/* Grid de dias */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {/* Cabeçalho dias da semana */}
                <div className="grid grid-cols-7 border-b border-slate-100">
                  {DIAS_SEMANA.map(d => (
                    <div key={d} className="py-2 text-center text-xs font-semibold text-slate-400">{d}</div>
                  ))}
                </div>

                {/* Células */}
                <div className="grid grid-cols-7">
                  {/* Dias do mês anterior */}
                  {Array.from({ length: primeiroDia }).map((_, i) => (
                    <div key={`prev-${i}`} className="min-h-[90px] p-2 border-b border-r border-slate-50">
                      <span className="text-xs text-slate-300">
                        {ultimoMesAnterior - primeiroDia + i + 1}
                      </span>
                    </div>
                  ))}

                  {/* Dias do mês atual */}
                  {Array.from({ length: ultimoDia }).map((_, i) => {
                    const dia = i + 1
                    const isHoje = dia === hoje.getDate() && mesAtual === hoje.getMonth() && anoAtual === hoje.getFullYear()
                    const isSel = dia === diaSelecionado
                    const evsDia = eventosDoDia(events, anoAtual, mesAtual, dia)

                    return (
                      <div
                        key={dia}
                        onClick={() => setDiaSelecionado(isSel ? null : dia)}
                        className={`min-h-[90px] p-2 border-b border-r border-slate-100 cursor-pointer transition-colors ${
                          isSel ? 'bg-blue-50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full ${
                            isHoje ? 'bg-blue-600 text-white' : isSel ? 'text-blue-600' : 'text-slate-700'
                          }`}>
                            {dia}
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          {evsDia.slice(0, 3).map(ev => {
                            const cor = corEvento(ev.colorId)
                            return (
                              <div key={ev.id}
                                onClick={e => { e.stopPropagation(); setEventoSelecionado(ev); setDiaSelecionado(dia) }}
                                className={`text-xs px-1.5 py-0.5 rounded truncate cursor-pointer ${cor.bg} ${cor.text} hover:opacity-80 transition-opacity`}
                              >
                                {eventoHora(ev) !== 'Dia inteiro' && (
                                  <span className="opacity-70 mr-1">{eventoHora(ev)}</span>
                                )}
                                {ev.summary}
                              </div>
                            )
                          })}
                          {evsDia.length > 3 && (
                            <p className="text-xs text-slate-400 pl-1">+{evsDia.length - 3} mais</p>
                          )}
                        </div>
                      </div>
                    )
                  })}

                  {/* Dias do próximo mês */}
                  {Array.from({ length: (7 - (primeiroDia + ultimoDia) % 7) % 7 }).map((_, i) => (
                    <div key={`next-${i}`} className="min-h-[90px] p-2 border-b border-r border-slate-50">
                      <span className="text-xs text-slate-300">{i + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Painel lateral — eventos do dia selecionado */}
        {diaSelecionado && isConnected && (
          <div className="w-72 flex-none bg-white border-l border-slate-200 flex flex-col">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <p className="text-sm font-bold text-slate-700">
                {diaSelecionado} de {MESES[mesAtual]}
              </p>
              <button onClick={() => { setShowNovoEvento(true) }}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                <Plus size={13} /> Evento
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {eventosDiaSelecionado.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-xs text-slate-400">Nenhum evento neste dia</p>
                  <button onClick={() => setShowNovoEvento(true)}
                    className="mt-3 text-xs text-blue-600 hover:underline">
                    + Criar evento
                  </button>
                </div>
              )}

              {eventosDiaSelecionado.map(ev => {
                const cor = corEvento(ev.colorId)
                return (
                  <div key={ev.id}
                    onClick={() => setEventoSelecionado(ev)}
                    className={`rounded-lg p-3 cursor-pointer border transition-all hover:shadow-sm ${cor.bg} border-transparent`}>
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-semibold ${cor.text} leading-tight`}>{ev.summary}</p>
                      <div className={`w-2 h-2 rounded-full flex-none mt-1 ${cor.dot}`} />
                    </div>
                    <p className={`text-xs mt-1 ${cor.text} opacity-70`}>{eventoHora(ev)}</p>
                    {ev.location && (
                      <p className={`text-xs mt-1 ${cor.text} opacity-60 flex items-center gap-1 truncate`}>
                        <MapPin size={10} /> {ev.location}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal detalhe do evento */}
      {eventoSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            {(() => {
              const cor = corEvento(eventoSelecionado.colorId)
              return (
                <>
                  <div className={`px-5 py-4 ${cor.bg}`}>
                    <div className="flex items-start justify-between gap-3">
                      <h2 className={`text-lg font-bold ${cor.text} leading-tight`}>
                        {eventoSelecionado.summary}
                      </h2>
                      <button onClick={() => setEventoSelecionado(null)}
                        className="p-1 rounded text-slate-400 hover:text-slate-600 flex-none">
                        <X size={18} />
                      </button>
                    </div>
                    <p className={`text-sm ${cor.text} opacity-80 mt-1`}>{eventoHora(eventoSelecionado)}</p>
                  </div>

                  <div className="p-5 space-y-3">
                    {eventoSelecionado.location && (
                      <div className="flex items-start gap-2 text-sm text-slate-600">
                        <MapPin size={15} className="mt-0.5 flex-none text-slate-400" />
                        <span>{eventoSelecionado.location}</span>
                      </div>
                    )}
                    {eventoSelecionado.description && (
                      <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600 border border-slate-100">
                        {eventoSelecionado.description}
                      </div>
                    )}
                    {eventoSelecionado.attendees && eventoSelecionado.attendees.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Participantes</p>
                        {eventoSelecionado.attendees.map(a => (
                          <p key={a.email} className="text-xs text-slate-600">{a.displayName ?? a.email}</p>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="px-5 pb-4 flex gap-2 pt-1 border-t border-slate-100">
                    {eventoSelecionado.htmlLink && (
                      <a href={eventoSelecionado.htmlLink} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
                        <ExternalLink size={12} /> Abrir no Google
                      </a>
                    )}
                    <button onClick={() => handleExcluirEvento(eventoSelecionado.id)}
                      className="ml-auto text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors">
                      Excluir evento
                    </button>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}

      {/* Modal configuração Client ID */}
      {showConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Configurar Google Calendar</h2>
              <button onClick={() => setShowConfig(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-800 space-y-1">
                <p className="font-bold">Como obter seu Client ID:</p>
                <ol className="space-y-1 list-decimal list-inside">
                  <li>Acesse <strong>console.cloud.google.com</strong></li>
                  <li>Crie/selecione um projeto</li>
                  <li>Ative a <strong>Google Calendar API</strong></li>
                  <li>Crie credenciais OAuth 2.0 (Aplicativo da Web)</li>
                  <li>Adicione <code className="bg-blue-100 px-1 rounded">http://localhost:3000</code> nas origens autorizadas</li>
                </ol>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Google OAuth Client ID</label>
                <input
                  value={inputClientId}
                  onChange={e => setInputClientId(e.target.value)}
                  placeholder="000000000000-xxxxxxxxxxxxxxxx.apps.googleusercontent.com"
                  className="w-full text-sm text-slate-900 border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>
            <div className="px-6 pb-5 flex gap-3">
              <button
                onClick={() => { setConfig({ clientId: inputClientId.trim() }); setShowConfig(false) }}
                disabled={!inputClientId.trim()}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-40 transition-colors"
              >
                Salvar e conectar
              </button>
              <button onClick={() => setShowConfig(false)}
                className="px-5 py-2.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal novo evento */}
      {showNovoEvento && (
        <NovoEventoForm
          dataInicial={dataNovoEvento}
          onSave={handleCriarEvento}
          onCancel={() => setShowNovoEvento(false)}
        />
      )}
    </div>
  )
}
