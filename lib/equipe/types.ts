export interface MembroPerfil {
  usuario_id: string
  cargo: string
  especialidades: string[]
  responsabilidades: string[]
  horas_disponiveis_mes: number
  data_entrada: string
  observacoes?: string
}

export interface CarregamentoMembro {
  usuario_id: string
  nome: string
  iniciais: string
  cor: string
  cargo: string
  horas_disponiveis: number
  horas_alocadas: number     // estimativa das tarefas em aberto
  horas_realizadas: number   // já executadas este mês
  utilizacao_pct: number
  tarefas_ativas: number
  tarefas_atrasadas: number
  tarefas_concluidas: number
  sla_pct: number | null
  eficiencia_pct: number | null
}
