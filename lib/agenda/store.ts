'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { GCalEvent, AgendaConfig } from './types'

interface AgendaStore {
  // Configuração
  config: AgendaConfig | null
  setConfig: (config: AgendaConfig) => void
  clearConfig: () => void

  // Auth
  accessToken: string | null
  tokenExpiry: number | null  // timestamp ms
  setToken: (token: string, expiresInSeconds: number) => void
  clearToken: () => void
  isTokenValid: () => boolean

  // Eventos (cache local)
  events: GCalEvent[]
  lastSync: string | null
  setEvents: (events: GCalEvent[], syncTime: string) => void

  // Estado de UI
  isLoading: boolean
  error: string | null
  setLoading: (v: boolean) => void
  setError: (msg: string | null) => void
}

export const useAgendaStore = create<AgendaStore>()(
  persist(
    (set, get) => ({
      config: null,
      setConfig: (config) => set({ config }),
      clearConfig: () => set({ config: null, accessToken: null, tokenExpiry: null, events: [], lastSync: null }),

      accessToken: null,
      tokenExpiry: null,
      setToken: (token, expiresIn) =>
        set({ accessToken: token, tokenExpiry: Date.now() + expiresIn * 1000, error: null }),
      clearToken: () => set({ accessToken: null, tokenExpiry: null }),
      isTokenValid: () => {
        const { accessToken, tokenExpiry } = get()
        return !!accessToken && !!tokenExpiry && Date.now() < tokenExpiry - 60000
      },

      events: [],
      lastSync: null,
      setEvents: (events, syncTime) => set({ events, lastSync: syncTime }),

      isLoading: false,
      error: null,
      setLoading: (v) => set({ isLoading: v }),
      setError: (msg) => set({ error: msg, isLoading: false }),
    }),
    { name: 'midiaflux-agenda-v1' }
  )
)
