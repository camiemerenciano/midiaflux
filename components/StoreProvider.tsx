'use client'

import { useEffect } from 'react'
import { useCRMStore } from '@/lib/crm/store'
import { useFinanceiroStore } from '@/lib/financeiro/store'
import { useClientesStore } from '@/lib/clientes/store'
import { useAgenciaStore } from '@/lib/agencia/store'
import { useOperacaoStore } from '@/lib/operacao/store'
import { useProcessosStore } from '@/lib/processos/store'
import { useEquipeStore } from '@/lib/equipe/store'

export function StoreProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    useCRMStore.persist.rehydrate()
    useFinanceiroStore.persist.rehydrate()
    useClientesStore.persist.rehydrate()
    useAgenciaStore.persist.rehydrate()
    useOperacaoStore.persist.rehydrate()
    useProcessosStore.persist.rehydrate()
    useEquipeStore.persist.rehydrate()
  }, [])

  return <>{children}</>
}
