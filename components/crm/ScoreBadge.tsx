'use client'

import { classificarScore } from '@/lib/crm/score'

interface Props {
  score: number
  showLabel?: boolean
}

export function ScoreBadge({ score, showLabel = false }: Props) {
  const c = classificarScore(score)
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold border ${c.corTexto} ${c.corBg} ${c.corBorda}`}
    >
      <span>{c.emoji}</span>
      <span>{score}</span>
      {showLabel && <span>· {c.label}</span>}
    </span>
  )
}
