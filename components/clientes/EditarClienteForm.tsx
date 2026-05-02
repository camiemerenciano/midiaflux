'use client'

import { useState, useRef } from 'react'
import { Cliente, TipoCliente, StatusCliente } from '@/lib/clientes/types'
import { TIPO_CLIENTE_CONFIG, STATUS_CLIENTE_CONFIG } from '@/lib/clientes/constants'
import { SEGMENTO_LABELS, PORTE_LABELS, USUARIOS } from '@/lib/crm/constants'
import { Segmento, Porte } from '@/lib/crm/types'
import { X, Camera, Trash2 } from 'lucide-react'
import { CropImageModal } from './CropImageModal'

interface Props {
  cliente: Cliente
  onSave: (data: Partial<Cliente>) => void
  onCancel: () => void
}

export function EditarClienteForm({ cliente, onSave, onCancel }: Props) {
  const [fotoCapa, setFotoCapa]       = useState<string | undefined>(cliente.foto_capa)
  const [srcParaCrop, setSrcParaCrop] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      // Abre o modal de crop com a imagem original
      setSrcParaCrop(ev.target?.result as string)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const [form, setForm] = useState({
    nome_empresa: cliente.nome_empresa,
    cnpj:         cliente.cnpj ?? '',
    segmento:     cliente.segmento as Segmento,
    porte:        cliente.porte   as Porte,
    site:         cliente.site    ?? '',
    cidade:       cliente.cidade  ?? '',
    estado:       cliente.estado  ?? '',
    tipo:         cliente.tipo    as TipoCliente,
    status:       cliente.status  as StatusCliente,
    responsavel_id: cliente.responsavel_id,
    data_inicio:  cliente.data_inicio,
    data_fim:     cliente.data_fim ?? '',
    nps:          cliente.nps !== undefined ? String(cliente.nps) : '',
    observacoes:  cliente.observacoes ?? '',
    motivo_risco: cliente.motivo_risco ?? '',
    motivo_pausa: cliente.motivo_pausa ?? '',
    motivo_encerramento: cliente.motivo_encerramento ?? '',
  })

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function handleSave() {
    if (!form.nome_empresa.trim()) return
    onSave({
      foto_capa:     fotoCapa,
      nome_empresa:  form.nome_empresa.trim(),
      cnpj:          form.cnpj  || undefined,
      segmento:      form.segmento,
      porte:         form.porte,
      site:          form.site   || undefined,
      cidade:        form.cidade || undefined,
      estado:        form.estado || undefined,
      tipo:          form.tipo,
      status:        form.status,
      responsavel_id: form.responsavel_id,
      data_inicio:   form.data_inicio,
      data_fim:      form.data_fim || undefined,
      nps:           form.nps !== '' ? Number(form.nps) : undefined,
      observacoes:   form.observacoes || undefined,
      motivo_risco:  form.status === 'em_risco'  ? form.motivo_risco  || undefined : undefined,
      motivo_pausa:  form.status === 'pausado'   ? form.motivo_pausa  || undefined : undefined,
      motivo_encerramento: form.status === 'encerrado' ? form.motivo_encerramento || undefined : undefined,
    })
  }

  const mostrarMotivo =
    form.status === 'em_risco' ||
    form.status === 'pausado'  ||
    form.status === 'encerrado'

  const motivoLabel: Record<string, string> = {
    em_risco:  'Motivo do risco',
    pausado:   'Motivo da pausa',
    encerrado: 'Motivo do encerramento',
  }
  const motivoField: Record<string, keyof typeof form> = {
    em_risco:  'motivo_risco',
    pausado:   'motivo_pausa',
    encerrado: 'motivo_encerramento',
  }

  return (
    <>
    {srcParaCrop && (
      <CropImageModal
        src={srcParaCrop}
        onConfirm={(base64) => { setFotoCapa(base64); setSrcParaCrop(null) }}
        onCancel={() => setSrcParaCrop(null)}
      />
    )}
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">

        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Editar Cliente</h2>
            <p className="text-xs text-slate-400">{cliente.nome_empresa}</p>
          </div>
          <button onClick={onCancel} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Foto de capa */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Foto de Capa</p>
            <div className="relative w-full h-32 rounded-xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 mb-3">
              {fotoCapa ? (
                <img src={fotoCapa} alt="Capa" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-slate-300 text-4xl font-black select-none">
                    {form.nome_empresa.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Camera size={14} />
                {fotoCapa ? 'Alterar foto' : 'Adicionar foto de capa'}
              </button>
              {fotoCapa && (
                <button
                  type="button"
                  onClick={() => setFotoCapa(undefined)}
                  className="flex items-center gap-2 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={14} />
                  Remover
                </button>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFoto} />
          </div>

          {/* Empresa */}
          <Section title="Empresa">
            <Field label="Nome da empresa *">
              <input value={form.nome_empresa} onChange={e => set('nome_empresa', e.target.value)}
                placeholder="Nome da empresa" className={inp} />
            </Field>
            <Row>
              <Field label="Segmento">
                <select value={form.segmento} onChange={e => set('segmento', e.target.value)} className={inp}>
                  {Object.entries(SEGMENTO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </Field>
              <Field label="Porte">
                <select value={form.porte} onChange={e => set('porte', e.target.value)} className={inp}>
                  {Object.entries(PORTE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </Field>
            </Row>
            <Row>
              <Field label="CNPJ">
                <input value={form.cnpj} onChange={e => set('cnpj', e.target.value)}
                  placeholder="00.000.000/0001-00" className={inp} />
              </Field>
              <Field label="Site">
                <input value={form.site} onChange={e => set('site', e.target.value)}
                  placeholder="empresa.com.br" className={inp} />
              </Field>
            </Row>
            <Row>
              <Field label="Cidade">
                <input value={form.cidade} onChange={e => set('cidade', e.target.value)}
                  placeholder="São Paulo" className={inp} />
              </Field>
              <Field label="Estado">
                <input value={form.estado} onChange={e => set('estado', e.target.value)}
                  placeholder="SP" maxLength={2} className={inp} />
              </Field>
            </Row>
          </Section>

          {/* Contrato */}
          <Section title="Contrato & Relacionamento">
            <Row>
              <Field label="Tipo de cliente">
                <select value={form.tipo} onChange={e => set('tipo', e.target.value)} className={inp}>
                  {Object.entries(TIPO_CLIENTE_CONFIG).map(([k, v]) =>
                    <option key={k} value={k}>{v.label} — {v.descricao}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select value={form.status} onChange={e => set('status', e.target.value)} className={inp}>
                  {Object.entries(STATUS_CLIENTE_CONFIG).map(([k, v]) =>
                    <option key={k} value={k}>{v.icone} {v.label}</option>)}
                </select>
              </Field>
            </Row>
            <Row>
              <Field label="Account Manager">
                <select value={form.responsavel_id} onChange={e => set('responsavel_id', e.target.value)} className={inp}>
                  {USUARIOS.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                </select>
              </Field>
              <Field label="NPS (0–10)">
                <input type="number" min={0} max={10} value={form.nps}
                  onChange={e => set('nps', e.target.value)}
                  placeholder="Ex: 9" className={inp} />
              </Field>
            </Row>
            <Row>
              <Field label="Início do contrato">
                <input type="date" value={form.data_inicio}
                  onChange={e => set('data_inicio', e.target.value)} className={inp} />
              </Field>
              <Field label="Término (opcional)">
                <input type="date" value={form.data_fim}
                  onChange={e => set('data_fim', e.target.value)} className={inp} />
              </Field>
            </Row>

            {mostrarMotivo && (
              <Field label={motivoLabel[form.status]}>
                <textarea
                  value={form[motivoField[form.status]] as string}
                  onChange={e => set(motivoField[form.status], e.target.value)}
                  rows={2} placeholder="Descreva o motivo..."
                  className={`${inp} resize-none`} />
              </Field>
            )}

            <Field label="Observações">
              <textarea value={form.observacoes} onChange={e => set('observacoes', e.target.value)}
                rows={3} placeholder="Notas internas sobre o cliente..."
                className={`${inp} resize-none`} />
            </Field>
          </Section>

        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <button onClick={handleSave} disabled={!form.nome_empresa.trim()}
            className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-40">
            Salvar alterações
          </button>
          <button onClick={onCancel}
            className="px-6 py-2.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    </div>
    </>
  )
}

const inp = 'w-full text-sm text-slate-900 border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'

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
