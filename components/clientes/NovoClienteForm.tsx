'use client'

import { useState } from 'react'
import { Cliente, ContatoCliente, Contrato, TipoCliente } from '@/lib/clientes/types'
import { TIPO_CLIENTE_CONFIG, CATALOGO_SERVICOS } from '@/lib/clientes/constants'
import { SEGMENTO_LABELS, PORTE_LABELS, CARGO_LABELS, USUARIOS } from '@/lib/crm/constants'
import { Segmento, Porte, Cargo } from '@/lib/crm/types'
import { X } from 'lucide-react'

interface Props {
  onSave: (
    cliente: Omit<Cliente, 'id' | 'criado_em' | 'atualizado_em'>,
    contato: Omit<ContatoCliente, 'id' | 'cliente_id'>,
    contrato: Omit<Contrato, 'id' | 'criado_em' | 'cliente_id'>
  ) => void
  onCancel: () => void
}

export function NovoClienteForm({ onSave, onCancel }: Props) {
  const hoje = new Date().toISOString().slice(0, 10)

  const [empresa, setEmpresa] = useState({
    nome_empresa: '', cnpj: '', site: '', cidade: '', estado: '',
    segmento: 'servicos' as Segmento,
    porte: 'pequena' as Porte,
    tipo: 'retainer' as TipoCliente,
    responsavel_id: USUARIOS[0].id,
    data_inicio: hoje,
    observacoes: '',
  })

  const [contato, setContato] = useState({
    nome: '', cargo: 'gerente' as Cargo, email: '', whatsapp: '', telefone: '',
  })

  const [contrato, setContrato] = useState({
    descricao: '',
    valor_mensal: '',
    valor_total: '',
    data_fim: '',
    duracao_meses: '',
    revisoes_incluidas: '2',
    servico_ids: [] as string[],
  })

  function setEmp(field: string, value: string) {
    setEmpresa(e => ({ ...e, [field]: value }))
  }
  function setCon(field: string, value: string) {
    setContato(c => ({ ...c, [field]: value }))
  }
  function setKon(field: string, value: string) {
    setContrato(k => ({ ...k, [field]: value }))
  }
  function toggleServico(id: string) {
    setContrato(k => ({
      ...k,
      servico_ids: k.servico_ids.includes(id)
        ? k.servico_ids.filter(s => s !== id)
        : [...k.servico_ids, id],
    }))
  }

  const ehRetainerOuPerformance = empresa.tipo === 'retainer' || empresa.tipo === 'performance'

  function handleSave() {
    if (!empresa.nome_empresa || !contato.nome || !contato.whatsapp) return

    onSave(
      {
        nome_empresa: empresa.nome_empresa,
        cnpj: empresa.cnpj || undefined,
        site: empresa.site || undefined,
        cidade: empresa.cidade || undefined,
        estado: empresa.estado || undefined,
        segmento: empresa.segmento,
        porte: empresa.porte,
        tipo: empresa.tipo,
        status: 'ativo',
        responsavel_id: empresa.responsavel_id,
        data_inicio: empresa.data_inicio,
        observacoes: empresa.observacoes || undefined,
      },
      {
        nome: contato.nome,
        cargo: contato.cargo,
        email: contato.email,
        whatsapp: contato.whatsapp,
        telefone: contato.telefone || undefined,
        principal: true,
      },
      {
        descricao: contrato.descricao || `Contrato ${empresa.nome_empresa}`,
        servico_ids: contrato.servico_ids,
        tipo: empresa.tipo,
        valor_mensal: ehRetainerOuPerformance && contrato.valor_mensal
          ? parseFloat(contrato.valor_mensal) : undefined,
        valor_total: !ehRetainerOuPerformance && contrato.valor_total
          ? parseFloat(contrato.valor_total) : undefined,
        data_inicio: empresa.data_inicio,
        data_fim: contrato.data_fim || undefined,
        duracao_meses: contrato.duracao_meses ? parseInt(contrato.duracao_meses) : undefined,
        revisoes_incluidas: parseInt(contrato.revisoes_incluidas) || 2,
        status: 'ativo',
      }
    )
  }

  const valido = empresa.nome_empresa.trim() && contato.nome.trim() && contato.whatsapp.trim()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">

        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Novo Cliente</h2>
          <button onClick={onCancel} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Empresa */}
          <Section title="Empresa">
            <Field label="Nome da empresa *">
              <input value={empresa.nome_empresa} onChange={e => setEmp('nome_empresa', e.target.value)}
                placeholder="Ex: TechSoluções Ltda" className={inp} />
            </Field>
            <Row>
              <Field label="Segmento *">
                <select value={empresa.segmento} onChange={e => setEmp('segmento', e.target.value)} className={inp}>
                  {Object.entries(SEGMENTO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </Field>
              <Field label="Porte *">
                <select value={empresa.porte} onChange={e => setEmp('porte', e.target.value)} className={inp}>
                  {Object.entries(PORTE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </Field>
            </Row>
            <Row>
              <Field label="CNPJ"><input value={empresa.cnpj} onChange={e => setEmp('cnpj', e.target.value)} placeholder="00.000.000/0001-00" className={inp} /></Field>
              <Field label="Site"><input value={empresa.site} onChange={e => setEmp('site', e.target.value)} placeholder="empresa.com.br" className={inp} /></Field>
            </Row>
            <Row>
              <Field label="Cidade"><input value={empresa.cidade} onChange={e => setEmp('cidade', e.target.value)} placeholder="São Paulo" className={inp} /></Field>
              <Field label="Estado"><input value={empresa.estado} onChange={e => setEmp('estado', e.target.value)} placeholder="SP" maxLength={2} className={inp} /></Field>
            </Row>
          </Section>

          {/* Contato principal */}
          <Section title="Contato principal">
            <Row>
              <Field label="Nome *"><input value={contato.nome} onChange={e => setCon('nome', e.target.value)} placeholder="João Silva" className={inp} /></Field>
              <Field label="Cargo *">
                <select value={contato.cargo} onChange={e => setCon('cargo', e.target.value)} className={inp}>
                  {Object.entries(CARGO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </Field>
            </Row>
            <Row>
              <Field label="WhatsApp *"><input value={contato.whatsapp} onChange={e => setCon('whatsapp', e.target.value)} placeholder="(11) 99999-9999" className={inp} /></Field>
              <Field label="E-mail"><input type="email" value={contato.email} onChange={e => setCon('email', e.target.value)} placeholder="joao@empresa.com.br" className={inp} /></Field>
            </Row>
          </Section>

          {/* Contrato */}
          <Section title="Contrato">
            <Row>
              <Field label="Tipo de cliente *">
                <select value={empresa.tipo} onChange={e => setEmp('tipo', e.target.value)} className={inp}>
                  {Object.entries(TIPO_CLIENTE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label} — {v.descricao}</option>)}
                </select>
              </Field>
              <Field label="Account Manager *">
                <select value={empresa.responsavel_id} onChange={e => setEmp('responsavel_id', e.target.value)} className={inp}>
                  {USUARIOS.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                </select>
              </Field>
            </Row>
            <Field label="Descrição do contrato">
              <input value={contrato.descricao} onChange={e => setKon('descricao', e.target.value)}
                placeholder="Ex: Gestão de Tráfego + Social Media" className={inp} />
            </Field>
            <Row>
              <Field label="Início *">
                <input type="date" value={empresa.data_inicio} onChange={e => setEmp('data_inicio', e.target.value)} className={inp} />
              </Field>
              <Field label="Término (opcional)">
                <input type="date" value={contrato.data_fim} onChange={e => setKon('data_fim', e.target.value)} className={inp} />
              </Field>
            </Row>
            <Row>
              <Field label={ehRetainerOuPerformance ? 'Valor mensal (R$) *' : 'Valor total do projeto (R$) *'}>
                <input type="number" placeholder="0,00"
                  value={ehRetainerOuPerformance ? contrato.valor_mensal : contrato.valor_total}
                  onChange={e => setKon(ehRetainerOuPerformance ? 'valor_mensal' : 'valor_total', e.target.value)}
                  className={inp} />
              </Field>
              <Field label="Revisões incluídas">
                <input type="number" min={0} max={10} value={contrato.revisoes_incluidas}
                  onChange={e => setKon('revisoes_incluidas', e.target.value)} className={inp} />
              </Field>
            </Row>

            {/* Serviços */}
            <Field label="Serviços contratados">
              <div className="grid grid-cols-2 gap-1.5 mt-1">
                {CATALOGO_SERVICOS.map(s => (
                  <label key={s.id} className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg border cursor-pointer transition-colors ${
                    contrato.servico_ids.includes(s.id)
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}>
                    <input type="checkbox" className="w-3 h-3 accent-blue-600"
                      checked={contrato.servico_ids.includes(s.id)}
                      onChange={() => toggleServico(s.id)} />
                    {s.nome.split('(')[0].trim()}
                  </label>
                ))}
              </div>
            </Field>
          </Section>

        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <button onClick={handleSave} disabled={!valido}
            className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            Criar cliente
          </button>
          <button onClick={onCancel} className="px-6 py-2.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

const inp = 'w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{title}</p>
      <div className="space-y-3">{children}</div>
    </div>
  )
}
function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-xs text-slate-500 mb-1 block">{label}</label>{children}</div>
}
