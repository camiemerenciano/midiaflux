import { Lancamento, MetaMensal } from './types'

// ─── METAS MENSAIS ────────────────────────────────────────────────────────────
export const mockMetas: MetaMensal[] = [
  { competencia: '2026-02', meta_receita: 40000, meta_margem: 45 },
  { competencia: '2026-03', meta_receita: 42000, meta_margem: 45 },
  { competencia: '2026-04', meta_receita: 48000, meta_margem: 45 },
  { competencia: '2026-05', meta_receita: 50000, meta_margem: 45 },
  { competencia: '2026-06', meta_receita: 52000, meta_margem: 48 },
]

// ─── LANÇAMENTOS ─────────────────────────────────────────────────────────────
export const mockLancamentos: Lancamento[] = [

  // ══════════════ MARÇO 2026 (histórico fechado) ══════════════

  // Receitas março
  { id: 'l-m01', tipo: 'receita', cliente_id: 'c1', contrato_id: 'k1',
    descricao: 'Mensalidade Studio K — Março/2026', categoria: 'mensalidade',
    valor: 4800, competencia: '2026-03', data_vencimento: '2026-03-05',
    data_pagamento: '2026-03-04', status: 'pago', nota_fiscal: 'NF-00234',
    recorrente: true, criado_em: '2026-03-01T09:00:00Z' },

  { id: 'l-m02', tipo: 'receita', cliente_id: 'c2', contrato_id: 'k2',
    descricao: 'Mensalidade Grupo Santos — Março/2026', categoria: 'mensalidade',
    valor: 12000, competencia: '2026-03', data_vencimento: '2026-03-05',
    data_pagamento: '2026-03-07', status: 'pago', nota_fiscal: 'NF-00235',
    recorrente: true, criado_em: '2026-03-01T09:00:00Z' },

  { id: 'l-m03', tipo: 'receita', cliente_id: 'c3', contrato_id: 'k3',
    descricao: 'Mensalidade Clínica NovaSaúde — Março/2026', categoria: 'mensalidade',
    valor: 7200, competencia: '2026-03', data_vencimento: '2026-03-10',
    data_pagamento: '2026-03-12', status: 'pago', nota_fiscal: 'NF-00236',
    recorrente: true, criado_em: '2026-03-01T09:00:00Z' },

  { id: 'l-m04', tipo: 'receita', cliente_id: 'c5', contrato_id: 'k5',
    descricao: 'Performance Marketing Kredix — Março/2026', categoria: 'performance',
    valor: 14200, competencia: '2026-03', data_vencimento: '2026-03-05',
    data_pagamento: '2026-03-05', status: 'pago', nota_fiscal: 'NF-00237',
    recorrente: true, criado_em: '2026-03-01T09:00:00Z' },

  // Custos março
  { id: 'l-m10', tipo: 'custo', descricao: 'Folha de pagamento — Março/2026',
    categoria: 'pessoal', valor: 22000, competencia: '2026-03',
    data_vencimento: '2026-03-05', data_pagamento: '2026-03-05', status: 'pago',
    recorrente: true, criado_em: '2026-03-01T09:00:00Z' },

  { id: 'l-m11', tipo: 'custo', descricao: 'Ferramentas SaaS — Figma, Semrush, Meta Business, Google Workspace',
    categoria: 'ferramentas', valor: 1840, competencia: '2026-03',
    data_vencimento: '2026-03-01', data_pagamento: '2026-03-01', status: 'pago',
    recorrente: true, criado_em: '2026-03-01T09:00:00Z' },

  { id: 'l-m12', tipo: 'custo', descricao: 'Verba de mídia — Grupo Santos (repassada)',
    categoria: 'midia', valor: 8500, competencia: '2026-03',
    data_vencimento: '2026-03-08', data_pagamento: '2026-03-08', status: 'pago',
    recorrente: false, criado_em: '2026-03-05T09:00:00Z' },

  { id: 'l-m13', tipo: 'custo', descricao: 'Freelancer — Edição de vídeo (Studio K)',
    categoria: 'fornecedores', valor: 1500, competencia: '2026-03',
    data_vencimento: '2026-03-20', data_pagamento: '2026-03-21', status: 'pago',
    recorrente: false, criado_em: '2026-03-15T09:00:00Z' },

  { id: 'l-m14', tipo: 'custo', descricao: 'Aluguel escritório + internet',
    categoria: 'infraestrutura', valor: 2800, competencia: '2026-03',
    data_vencimento: '2026-03-05', data_pagamento: '2026-03-05', status: 'pago',
    recorrente: true, criado_em: '2026-03-01T09:00:00Z' },

  { id: 'l-m15', tipo: 'custo', descricao: 'Simples Nacional — Março/2026',
    categoria: 'impostos', valor: 3120, competencia: '2026-03',
    data_vencimento: '2026-03-20', data_pagamento: '2026-03-18', status: 'pago',
    recorrente: true, criado_em: '2026-03-01T09:00:00Z' },

  // ══════════════ ABRIL 2026 (mês atual) ══════════════

  // Receitas abril — mix de status
  { id: 'l-a01', tipo: 'receita', cliente_id: 'c1', contrato_id: 'k1',
    descricao: 'Mensalidade Studio K — Abril/2026', categoria: 'mensalidade',
    valor: 4800, competencia: '2026-04', data_vencimento: '2026-04-05',
    data_pagamento: '2026-04-04', status: 'pago', nota_fiscal: 'NF-00241',
    recorrente: true, criado_em: '2026-04-01T09:00:00Z' },

  { id: 'l-a02', tipo: 'receita', cliente_id: 'c2', contrato_id: 'k2',
    descricao: 'Mensalidade Grupo Santos — Abril/2026', categoria: 'mensalidade',
    valor: 12000, competencia: '2026-04', data_vencimento: '2026-04-05',
    data_pagamento: '2026-04-08', status: 'pago', nota_fiscal: 'NF-00242',
    recorrente: true, criado_em: '2026-04-01T09:00:00Z' },

  { id: 'l-a03', tipo: 'receita', cliente_id: 'c3', contrato_id: 'k3',
    descricao: 'Mensalidade Clínica NovaSaúde — Abril/2026', categoria: 'mensalidade',
    valor: 7200, competencia: '2026-04', data_vencimento: '2026-04-10',
    status: 'atrasado', nota_fiscal: 'NF-00243',
    observacoes: 'Cliente solicitou prazo até 30/04. Diretor financeiro em contato.',
    recorrente: true, criado_em: '2026-04-01T09:00:00Z' },

  { id: 'l-a04', tipo: 'receita', cliente_id: 'c4', contrato_id: 'k4',
    descricao: 'E-Bike Shop — Parcela 2/4 (Redesign)', categoria: 'projeto',
    valor: 4500, competencia: '2026-04', data_vencimento: '2026-04-27',
    status: 'emitido', nota_fiscal: 'NF-00244',
    recorrente: false, criado_em: '2026-04-01T09:00:00Z' },

  { id: 'l-a05', tipo: 'receita', cliente_id: 'c5', contrato_id: 'k5',
    descricao: 'Performance Marketing Kredix — Abril/2026', categoria: 'performance',
    valor: 14200, competencia: '2026-04', data_vencimento: '2026-04-05',
    data_pagamento: '2026-04-05', status: 'pago', nota_fiscal: 'NF-00245',
    recorrente: true, criado_em: '2026-04-01T09:00:00Z' },

  // Custos abril
  { id: 'l-a10', tipo: 'custo', descricao: 'Folha de pagamento — Abril/2026',
    categoria: 'pessoal', valor: 22000, competencia: '2026-04',
    data_vencimento: '2026-04-05', data_pagamento: '2026-04-05', status: 'pago',
    recorrente: true, criado_em: '2026-04-01T09:00:00Z' },

  { id: 'l-a11', tipo: 'custo', descricao: 'Ferramentas SaaS — Figma, Semrush, Meta Business Suite, Google Workspace, RD Station',
    categoria: 'ferramentas', valor: 2140, competencia: '2026-04',
    data_vencimento: '2026-04-01', data_pagamento: '2026-04-01', status: 'pago',
    recorrente: true, criado_em: '2026-04-01T09:00:00Z' },

  { id: 'l-a12', tipo: 'custo', descricao: 'Verba de mídia — Grupo Santos (Google Ads)',
    categoria: 'midia', valor: 9200, competencia: '2026-04',
    data_vencimento: '2026-04-08', data_pagamento: '2026-04-08', status: 'pago',
    recorrente: false, criado_em: '2026-04-05T09:00:00Z' },

  { id: 'l-a13', tipo: 'custo', descricao: 'Verba de mídia — Kredix (Meta + Google)',
    categoria: 'midia', valor: 6800, competencia: '2026-04',
    data_vencimento: '2026-04-08', data_pagamento: '2026-04-08', status: 'pago',
    recorrente: false, criado_em: '2026-04-05T09:00:00Z' },

  { id: 'l-a14', tipo: 'custo', descricao: 'Aluguel escritório + internet',
    categoria: 'infraestrutura', valor: 2800, competencia: '2026-04',
    data_vencimento: '2026-04-05', data_pagamento: '2026-04-05', status: 'pago',
    recorrente: true, criado_em: '2026-04-01T09:00:00Z' },

  { id: 'l-a15', tipo: 'custo', descricao: 'Simples Nacional — Abril/2026',
    categoria: 'impostos', valor: 3420, competencia: '2026-04',
    data_vencimento: '2026-04-20', status: 'previsto',
    recorrente: true, criado_em: '2026-04-01T09:00:00Z' },

  { id: 'l-a16', tipo: 'custo', descricao: 'Freelancer Motion Graphics — Kampanha Kredix',
    categoria: 'fornecedores', valor: 2200, competencia: '2026-04',
    data_vencimento: '2026-04-28', status: 'previsto',
    recorrente: false, criado_em: '2026-04-20T09:00:00Z' },

  // ══════════════ MAIO 2026 (previsto) ══════════════

  { id: 'l-j01', tipo: 'receita', cliente_id: 'c1', contrato_id: 'k1',
    descricao: 'Mensalidade Studio K — Maio/2026', categoria: 'mensalidade',
    valor: 4800, competencia: '2026-05', data_vencimento: '2026-05-05',
    status: 'previsto', recorrente: true, criado_em: '2026-04-01T09:00:00Z' },

  { id: 'l-j02', tipo: 'receita', cliente_id: 'c2', contrato_id: 'k2',
    descricao: 'Mensalidade Grupo Santos — Maio/2026', categoria: 'mensalidade',
    valor: 12000, competencia: '2026-05', data_vencimento: '2026-05-05',
    status: 'previsto', recorrente: true, criado_em: '2026-04-01T09:00:00Z' },

  { id: 'l-j03', tipo: 'receita', cliente_id: 'c3', contrato_id: 'k3',
    descricao: 'Mensalidade Clínica NovaSaúde — Maio/2026', categoria: 'mensalidade',
    valor: 7200, competencia: '2026-05', data_vencimento: '2026-05-10',
    status: 'previsto', recorrente: true, criado_em: '2026-04-01T09:00:00Z' },

  { id: 'l-j04', tipo: 'receita', cliente_id: 'c4', contrato_id: 'k4',
    descricao: 'E-Bike Shop — Parcela 3/4', categoria: 'projeto',
    valor: 4500, competencia: '2026-05', data_vencimento: '2026-05-27',
    status: 'previsto', recorrente: false, criado_em: '2026-04-01T09:00:00Z' },

  { id: 'l-j05', tipo: 'receita', cliente_id: 'c5', contrato_id: 'k5',
    descricao: 'Performance Marketing Kredix — Maio/2026', categoria: 'performance',
    valor: 14200, competencia: '2026-05', data_vencimento: '2026-05-05',
    status: 'previsto', recorrente: true, criado_em: '2026-04-01T09:00:00Z' },

  // ══════════════ JUNHO 2026 (previsto) ══════════════

  { id: 'l-jn01', tipo: 'receita', cliente_id: 'c1', contrato_id: 'k1',
    descricao: 'Mensalidade Studio K — Junho/2026', categoria: 'mensalidade',
    valor: 4800, competencia: '2026-06', data_vencimento: '2026-06-05',
    status: 'previsto', recorrente: true, criado_em: '2026-04-01T09:00:00Z' },

  { id: 'l-jn02', tipo: 'receita', cliente_id: 'c2', contrato_id: 'k2',
    descricao: 'Mensalidade Grupo Santos — Junho/2026', categoria: 'mensalidade',
    valor: 12000, competencia: '2026-06', data_vencimento: '2026-06-05',
    status: 'previsto', recorrente: true, criado_em: '2026-04-01T09:00:00Z' },

  { id: 'l-jn03', tipo: 'receita', cliente_id: 'c3', contrato_id: 'k3',
    descricao: 'Mensalidade Clínica NovaSaúde — Junho/2026', categoria: 'mensalidade',
    valor: 7200, competencia: '2026-06', data_vencimento: '2026-06-10',
    status: 'previsto', recorrente: true, criado_em: '2026-04-01T09:00:00Z' },

  { id: 'l-jn04', tipo: 'receita', cliente_id: 'c4', contrato_id: 'k4',
    descricao: 'E-Bike Shop — Parcela 4/4 (final)', categoria: 'projeto',
    valor: 4500, competencia: '2026-06', data_vencimento: '2026-06-27',
    status: 'previsto', recorrente: false, criado_em: '2026-04-01T09:00:00Z' },

  { id: 'l-jn05', tipo: 'receita', cliente_id: 'c5', contrato_id: 'k5',
    descricao: 'Performance Marketing Kredix — Junho/2026', categoria: 'performance',
    valor: 14200, competencia: '2026-06', data_vencimento: '2026-06-05',
    status: 'previsto', recorrente: true, criado_em: '2026-04-01T09:00:00Z' },
]
