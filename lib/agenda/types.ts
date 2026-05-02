export interface GCalEvent {
  id: string
  summary: string
  description?: string
  location?: string
  start: { dateTime?: string; date?: string; timeZone?: string }
  end:   { dateTime?: string; date?: string }
  colorId?: string
  attendees?: { email: string; displayName?: string; responseStatus?: string }[]
  htmlLink?: string
  status?: 'confirmed' | 'tentative' | 'cancelled'
  recurringEventId?: string
}

export interface AgendaConfig {
  clientId: string
}

// google.accounts.oauth2 typings mínimos para TypeScript
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string
            scope: string
            callback: (response: { access_token?: string; error?: string }) => void
          }) => { requestAccessToken: () => void }
        }
      }
    }
  }
}
