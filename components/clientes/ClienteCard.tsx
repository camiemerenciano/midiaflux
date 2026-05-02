'use client'

import { useRef } from 'react'
import { Cliente, Contrato } from '@/lib/clientes/types'
import { TIPO_CLIENTE_CONFIG, STATUS_CLIENTE_CONFIG } from '@/lib/clientes/constants'
import { SEGMENTO_LABELS, USUARIOS } from '@/lib/crm/constants'
import { formatarMoeda, formatarData } from '@/lib/crm/score'
import { Star, Calendar, AlertTriangle, Camera, Pencil, X } from 'lucide-react'

interface Props {
  cliente: Cliente
  contratos: Contrato[]
  onClick: () => void
  onFotoChange?: (clienteId: string, base64: string | null) => void
  onEdit?: (e: React.MouseEvent) => void
}

export function ClienteCard({ cliente, contratos, onClick, onFotoChange, onEdit }: Props) {
  const tipoConfig    = TIPO_CLIENTE_CONFIG[cliente.tipo]
  const statusConfig  = STATUS_CLIENTE_CONFIG[cliente.status]
  const responsavel   = USUARIOS.find((u) => u.id === cliente.responsavel_id)
  const contratoAtivo = contratos.find((k) => k.status === 'ativo')
  const totalServicos = contratos.flatMap((k) => k.servico_ids).filter((v, i, a) => a.indexOf(v) === i).length

  const valorExibido = contratoAtivo?.valor_mensal ?? contratoAtivo?.valor_total
  const labelValor   = contratoAtivo?.valor_mensal ? '/mês' : ' total'
  const mesesAtivo   = Math.floor(
    (Date.now() - new Date(cliente.data_inicio).getTime()) / (1000 * 60 * 60 * 24 * 30)
  )
  const renovacaoProxima =
    contratoAtivo?.data_fim &&
    new Date(contratoAtivo.data_fim) <= new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)

  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !onFotoChange) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const maxW = 800
        const scale = img.width > maxW ? maxW / img.width : 1
        const canvas = document.createElement('canvas')
        canvas.width  = Math.round(img.width  * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
        onFotoChange(cliente.id, canvas.toDataURL('image/jpeg', 0.82))
      }
      img.src = ev.target?.result as string
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const bordaEsquerda =
    cliente.status === 'em_risco'  ? 'border-l-red-400'   :
    cliente.status === 'pausado'   ? 'border-l-amber-400' :
    cliente.status === 'encerrado' ? 'border-l-slate-300' :
    'border-l-emerald-400'

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border-l-4 border border-slate-200 cursor-pointer hover:shadow-md transition-all overflow-hidden ${bordaEsquerda}`}
    >

      {/* ── Foto de capa ──────────────────────────────────────────────── */}
      <div className="relative w-full h-28 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
        {cliente.foto_capa ? (
          <img
            src={cliente.foto_capa}
            alt={`Capa de ${cliente.nome_empresa}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-slate-300 text-4xl font-black select-none">
              {cliente.nome_empresa.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Botão câmera — sempre visível (sutil), fica nítido no hover */}
        {onFotoChange && (
          <button
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
            title={cliente.foto_capa ? 'Alterar foto' : 'Adicionar foto de capa'}
            className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-black/40 hover:bg-black/70 text-white text-xs px-2.5 py-1.5 rounded-full transition-all backdrop-blur-sm"
          >
            <Camera size={12} />
            {cliente.foto_capa ? 'Alterar' : 'Adicionar foto'}
          </button>
        )}

        {/* Remover foto */}
        {onFotoChange && cliente.foto_capa && (
          <button
            onClick={(e) => { e.stopPropagation(); onFotoChange(cliente.id, null) }}
            title="Remover foto"
            className="absolute top-2 right-2 bg-black/40 hover:bg-red-600 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center transition-all backdrop-blur-sm"
          >
            <X size={12} />
          </button>
        )}

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>

      {/* ── Conteúdo ─────────────────────────────────────────────────── */}
      <div className="p-4">

        {/* Topo */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <p className="font-bold text-slate-800 truncate hover:text-blue-600 transition-colors">
              {cliente.nome_empresa}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{SEGMENTO_LABELS[cliente.segmento]}</p>
          </div>
          <div className="flex flex-col items-end gap-1 flex-none">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusConfig.corBg} ${statusConfig.cor} ${statusConfig.corBorda}`}>
              {statusConfig.icone} {statusConfig.label}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${tipoConfig.corBg} ${tipoConfig.cor} ${tipoConfig.corBorda}`}>
              {tipoConfig.label}
            </span>
          </div>
        </div>

        {/* Valor */}
        {valorExibido && (
          <div className="mb-3">
            <span className="text-xl font-bold text-slate-800">{formatarMoeda(valorExibido)}</span>
            <span className="text-sm text-slate-400">{labelValor}</span>
            {contratoAtivo?.valor_base && (
              <p className="text-xs text-slate-400 mt-0.5">Base: {formatarMoeda(contratoAtivo.valor_base)} + variável</p>
            )}
          </div>
        )}

        {/* Métricas */}
        <div className="grid grid-cols-3 gap-2 mb-3 py-2 border-y border-slate-100">
          <Metric label="Desde"    value={formatarData(cliente.data_inicio)} />
          <Metric label="Duração"  value={`${mesesAtivo}m`} />
          <Metric label="Serviços" value={String(totalServicos)} />
        </div>

        {/* NPS */}
        {cliente.nps !== undefined && (
          <div className="flex items-center gap-1 mb-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full ${
                i < cliente.nps!
                  ? cliente.nps! >= 9 ? 'bg-emerald-400' : cliente.nps! >= 7 ? 'bg-amber-400' : 'bg-red-400'
                  : 'bg-slate-100'
              }`} />
            ))}
            <span className="text-xs font-bold text-slate-500 ml-1">{cliente.nps}</span>
            <Star size={11} className="text-slate-400" />
          </div>
        )}

        {/* Alertas */}
        {cliente.status === 'em_risco' && (
          <div className="flex items-start gap-1.5 bg-red-50 border border-red-100 rounded-lg px-2 py-1.5 mb-2">
            <AlertTriangle size={12} className="text-red-500 mt-0.5 flex-none" />
            <p className="text-xs text-red-600 line-clamp-2">{cliente.motivo_risco}</p>
          </div>
        )}

        {renovacaoProxima && (
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1.5 mb-2">
            <Calendar size={12} className="text-amber-500 flex-none" />
            <p className="text-xs text-amber-700">Renovação em {formatarData(contratoAtivo!.data_fim!)}</p>
          </div>
        )}

        {/* Rodapé */}
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-slate-400">{cliente.cidade} — {cliente.estado}</p>
          <div className="flex items-center gap-1.5">
            {onEdit && (
              <button
                onClick={onEdit}
                title="Editar dados do cliente"
                className="p-1 rounded text-slate-300 hover:text-blue-500 hover:bg-blue-50 transition-colors"
              >
                <Pencil size={13} />
              </button>
            )}
            {responsavel && (
              <span className={`w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center ${responsavel.cor}`}
                title={responsavel.nome}>
                {responsavel.iniciais}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-semibold text-slate-700">{value}</p>
    </div>
  )
}
