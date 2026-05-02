'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface Props {
  dataInicial?: string // YYYY-MM-DD
  onSave: (evento: {
    summary: string
    description?: string
    location?: string
    start: string
    end: string
    colorId?: string
  }) => void
  onCancel: () => void
}

const CORES = [
  { id: '1', label: 'Azul',     cls: 'bg-blue-500' },
  { id: '2', label: 'Verde',    cls: 'bg-green-500' },
  { id: '3', label: 'Roxo',     cls: 'bg-purple-500' },
  { id: '4', label: 'Vermelho', cls: 'bg-red-500' },
  { id: '5', label: 'Amarelo',  cls: 'bg-yellow-500' },
  { id: '6', label: 'Laranja',  cls: 'bg-orange-500' },
]

export function NovoEventoForm({ dataInicial, onSave, onCancel }: Props) {
  const hoje = dataInicial ?? new Date().toISOString().slice(0, 10)
  const horaAtual = new Date().toTimeString().slice(0, 5)

  const [summary,     setSummary]     = useState('')
  const [description, setDescription] = useState('')
  const [location,    setLocation]    = useState('')
  const [data,        setData]        = useState(hoje)
  const [horaInicio,  setHoraInicio]  = useState(horaAtual)
  const [horaFim,     setHoraFim]     = useState(() => {
    const [h, m] = horaAtual.split(':').map(Number)
    const fimH = (h + 1) % 24
    return `${String(fimH).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  })
  const [colorId, setColorId] = useState('1')

  function handleSave() {
    if (!summary.trim()) return
    onSave({
      summary: summary.trim(),
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      start: `${data}T${horaInicio}:00`,
      end:   `${data}T${horaFim}:00`,
      colorId,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">

        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Novo Evento</h2>
          <button onClick={onCancel} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className={lbl}>Título *</label>
            <input value={summary} onChange={e => setSummary(e.target.value)}
              placeholder="Ex: Reunião com cliente, Entrega de projeto..."
              className={inp} autoFocus />
          </div>

          <div>
            <label className={lbl}>Data</label>
            <input type="date" value={data} onChange={e => setData(e.target.value)} className={inp} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Início</label>
              <input type="time" value={horaInicio} onChange={e => setHoraInicio(e.target.value)} className={inp} />
            </div>
            <div>
              <label className={lbl}>Fim</label>
              <input type="time" value={horaFim} onChange={e => setHoraFim(e.target.value)} className={inp} />
            </div>
          </div>

          <div>
            <label className={lbl}>Local</label>
            <input value={location} onChange={e => setLocation(e.target.value)}
              placeholder="Ex: Google Meet, Escritório, Endereço..." className={inp} />
          </div>

          <div>
            <label className={lbl}>Descrição</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              rows={2} placeholder="Notas, pauta, link da reunião..." className={`${inp} resize-none`} />
          </div>

          <div>
            <label className={lbl}>Cor</label>
            <div className="flex gap-2 mt-1">
              {CORES.map(c => (
                <button key={c.id} onClick={() => setColorId(c.id)} title={c.label}
                  className={`w-7 h-7 rounded-full transition-transform ${c.cls} ${colorId === c.id ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''}`} />
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <button onClick={handleSave} disabled={!summary.trim()}
            className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-40">
            Criar evento
          </button>
          <button onClick={onCancel}
            className="px-5 py-2.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

const inp = 'w-full text-sm text-slate-900 border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'
const lbl = 'text-xs text-slate-500 mb-1 block'
