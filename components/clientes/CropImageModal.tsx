'use client'

import { useState, useEffect, useRef } from 'react'
import { X, ZoomIn, ZoomOut } from 'lucide-react'

// Dimensões do frame visual de crop (16:5 — proporcional ao card)
const FRAME_W = 480
const FRAME_H = 150

// Dimensões da imagem final salva
const OUTPUT_W = 800
const OUTPUT_H = 250

interface Props {
  src: string              // data URL da imagem original
  onConfirm: (base64: string) => void
  onCancel: () => void
}

export function CropImageModal({ src, onConfirm, onCancel }: Props) {
  const [offsetX, setOffsetX]     = useState(0)
  const [offsetY, setOffsetY]     = useState(0)
  const [scale, setScale]         = useState(1)
  const [naturalW, setNaturalW]   = useState(0)
  const [naturalH, setNaturalH]   = useState(0)
  const [dragging, setDragging]   = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, ox: 0, oy: 0 })
  const imgRef = useRef<HTMLImageElement>(null)

  // Ao carregar a imagem, encaixar para cobrir o frame
  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      setNaturalW(img.naturalWidth)
      setNaturalH(img.naturalHeight)
      const scaleX = FRAME_W / img.naturalWidth
      const scaleY = FRAME_H / img.naturalHeight
      const fitScale = Math.max(scaleX, scaleY)
      setScale(fitScale)
      // Centralizar
      setOffsetX((FRAME_W - img.naturalWidth  * fitScale) / 2)
      setOffsetY((FRAME_H - img.naturalHeight * fitScale) / 2)
    }
    img.src = src
  }, [src])

  function clampOffset(ox: number, oy: number, s: number) {
    const scaledW = naturalW * s
    const scaledH = naturalH * s
    const minX = Math.min(0, FRAME_W - scaledW)
    const minY = Math.min(0, FRAME_H - scaledH)
    return {
      x: Math.max(minX, Math.min(0, ox)),
      y: Math.max(minY, Math.min(0, oy)),
    }
  }

  function changeScale(newScale: number) {
    const s = Math.max(0.3, Math.min(4, newScale))
    const { x, y } = clampOffset(offsetX, offsetY, s)
    setScale(s)
    setOffsetX(x)
    setOffsetY(y)
  }

  // Drag handlers — mouse
  function onMouseDown(e: React.MouseEvent) {
    e.preventDefault()
    setDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY, ox: offsetX, oy: offsetY })
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!dragging) return
    const dx = e.clientX - dragStart.x
    const dy = e.clientY - dragStart.y
    const { x, y } = clampOffset(dragStart.ox + dx, dragStart.oy + dy, scale)
    setOffsetX(x)
    setOffsetY(y)
  }
  function onMouseUp() { setDragging(false) }

  // Drag handlers — touch
  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0]
    setDragging(true)
    setDragStart({ x: t.clientX, y: t.clientY, ox: offsetX, oy: offsetY })
  }
  function onTouchMove(e: React.TouchEvent) {
    if (!dragging) return
    const t = e.touches[0]
    const dx = t.clientX - dragStart.x
    const dy = t.clientY - dragStart.y
    const { x, y } = clampOffset(dragStart.ox + dx, dragStart.oy + dy, scale)
    setOffsetX(x)
    setOffsetY(y)
  }

  function aplicar() {
    const img = imgRef.current
    if (!img || !naturalW) return

    const canvas = document.createElement('canvas')
    canvas.width  = OUTPUT_W
    canvas.height = OUTPUT_H

    const ctx = canvas.getContext('2d')!
    // Mapear o que está visível no frame para o canvas de saída
    const srcX = -offsetX / scale
    const srcY = -offsetY / scale
    const srcW = FRAME_W  / scale
    const srcH = FRAME_H  / scale

    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, OUTPUT_W, OUTPUT_H)
    onConfirm(canvas.toDataURL('image/jpeg', 0.85))
  }

  const scalePct = Math.round(scale * 100)

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Ajustar foto de capa</h2>
            <p className="text-xs text-slate-500">Arraste para posicionar · deslize para ampliar</p>
          </div>
          <button onClick={onCancel} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Frame de crop */}
          <div
            className="relative overflow-hidden rounded-xl border-2 border-blue-500 mx-auto select-none"
            style={{
              width: FRAME_W,
              height: FRAME_H,
              cursor: dragging ? 'grabbing' : 'grab',
              touchAction: 'none',
            }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={() => setDragging(false)}
          >
            <img
              ref={imgRef}
              src={src}
              alt="crop"
              draggable={false}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: naturalW,
                height: naturalH,
                transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
                transformOrigin: '0 0',
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            />
            {/* Grade de referência */}
            <div className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)',
                backgroundSize: `${FRAME_W / 3}px ${FRAME_H / 3}px`,
              }}
            />
          </div>

          {/* Zoom */}
          <div className="flex items-center gap-3">
            <button onClick={() => changeScale(scale - 0.1)}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors">
              <ZoomOut size={16} />
            </button>
            <div className="flex-1">
              <input
                type="range"
                min="0.3"
                max="4"
                step="0.01"
                value={scale}
                onChange={e => changeScale(parseFloat(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>
            <button onClick={() => changeScale(scale + 0.1)}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors">
              <ZoomIn size={16} />
            </button>
            <span className="text-xs font-mono text-slate-400 w-12 text-right">{scalePct}%</span>
          </div>

          <p className="text-xs text-slate-400 text-center">
            A área destacada será salva como capa do cliente
          </p>
        </div>

        {/* Ações */}
        <div className="px-6 pb-5 flex gap-3">
          <button onClick={aplicar}
            className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            Aplicar
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
