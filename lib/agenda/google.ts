import { GCalEvent } from './types'

const SCOPE = 'https://www.googleapis.com/auth/calendar'
const API_BASE = 'https://www.googleapis.com/calendar/v3'

// Cores do Google Calendar → Tailwind
const COR_GCAL: Record<string, { bg: string; text: string; dot: string }> = {
  '1':  { bg: 'bg-blue-100',   text: 'text-blue-800',   dot: 'bg-blue-500' },
  '2':  { bg: 'bg-green-100',  text: 'text-green-800',  dot: 'bg-green-500' },
  '3':  { bg: 'bg-purple-100', text: 'text-purple-800', dot: 'bg-purple-500' },
  '4':  { bg: 'bg-red-100',    text: 'text-red-800',    dot: 'bg-red-500' },
  '5':  { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' },
  '6':  { bg: 'bg-orange-100', text: 'text-orange-800', dot: 'bg-orange-500' },
  '7':  { bg: 'bg-cyan-100',   text: 'text-cyan-800',   dot: 'bg-cyan-500' },
  '8':  { bg: 'bg-slate-100',  text: 'text-slate-800',  dot: 'bg-slate-500' },
  '9':  { bg: 'bg-blue-100',   text: 'text-blue-800',   dot: 'bg-blue-700' },
  '10': { bg: 'bg-green-100',  text: 'text-green-800',  dot: 'bg-green-700' },
  '11': { bg: 'bg-red-100',    text: 'text-red-800',    dot: 'bg-red-700' },
}
export const DEFAULT_COR = { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' }
export function corEvento(colorId?: string) {
  return colorId ? (COR_GCAL[colorId] ?? DEFAULT_COR) : DEFAULT_COR
}

// Carrega o script GIS dinamicamente
export function carregarGIS(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject('SSR')
    if (window.google?.accounts?.oauth2) return resolve()

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.onload = () => resolve()
    script.onerror = () => reject('Falha ao carregar Google Identity Services')
    document.head.appendChild(script)
  })
}

// Inicia o fluxo OAuth e retorna o access_token
export function solicitarToken(clientId: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    await carregarGIS()
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPE,
      callback: (resp) => {
        if (resp.error) return reject(resp.error)
        if (resp.access_token) return resolve(resp.access_token)
        reject('Token não recebido')
      },
    })
    client.requestAccessToken()
  })
}

// Busca eventos do calendário principal nos próximos N dias (padrão: 60)
export async function buscarEventos(
  accessToken: string,
  diasAtras = 7,
  diasAdiante = 60
): Promise<GCalEvent[]> {
  const timeMin = new Date(Date.now() - diasAtras * 86400000).toISOString()
  const timeMax = new Date(Date.now() + diasAdiante * 86400000).toISOString()

  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250',
  })

  const res = await fetch(`${API_BASE}/calendars/primary/events?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message ?? 'Erro ao buscar eventos')
  }

  const data = await res.json()
  return (data.items ?? []) as GCalEvent[]
}

// Cria um evento no Google Calendar
export async function criarEvento(
  accessToken: string,
  evento: {
    summary: string
    description?: string
    location?: string
    start: string   // ISO datetime
    end: string     // ISO datetime
    colorId?: string
  }
): Promise<GCalEvent> {
  const body = {
    summary: evento.summary,
    description: evento.description,
    location: evento.location,
    colorId: evento.colorId,
    start: { dateTime: evento.start, timeZone: 'America/Sao_Paulo' },
    end:   { dateTime: evento.end,   timeZone: 'America/Sao_Paulo' },
  }

  const res = await fetch(`${API_BASE}/calendars/primary/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message ?? 'Erro ao criar evento')
  }
  return res.json()
}

// Exclui um evento
export async function excluirEvento(accessToken: string, eventId: string): Promise<void> {
  await fetch(`${API_BASE}/calendars/primary/events/${eventId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

// Helpers de data
export function eventoData(ev: GCalEvent): Date {
  const s = ev.start.dateTime ?? ev.start.date ?? ''
  return new Date(s)
}

export function eventoHora(ev: GCalEvent): string {
  if (ev.start.date && !ev.start.dateTime) return 'Dia inteiro'
  const d = new Date(ev.start.dateTime!)
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function eventosDoDia(events: GCalEvent[], ano: number, mes: number, dia: number): GCalEvent[] {
  return events.filter(ev => {
    const d = eventoData(ev)
    return d.getFullYear() === ano && d.getMonth() === mes && d.getDate() === dia
  })
}
