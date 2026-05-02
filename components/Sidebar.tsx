'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Users2,
  Building2,
  FolderKanban,
  DollarSign,
  BarChart3,
  BookOpen,
  CalendarDays,
  Settings,
  Zap,
  ChevronUp,
  Check,
} from 'lucide-react'
import { useAgenciaStore } from '@/lib/agencia/store'

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/crm', label: 'CRM', icon: Users },
  { href: '/clientes', label: 'Clientes', icon: Building2 },
  { href: '/projetos', label: 'Projetos', icon: FolderKanban },
  { href: '/financeiro', label: 'Financeiro', icon: DollarSign },
  { href: '/equipe', label: 'Equipe', icon: Users2 },
  { href: '/agenda', label: 'Agenda', icon: CalendarDays },
  { href: '/processos', label: 'Processos', icon: BookOpen },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart3 },
]

const STORAGE_KEY = 'midiaflux-usuario-ativo'

export function Sidebar() {
  const pathname = usePathname()
  const { membros } = useAgenciaStore()
  const [usuarioId, setUsuarioId] = useState('')
  const [aberto, setAberto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const salvo = localStorage.getItem(STORAGE_KEY)
    if (salvo && membros.find(u => u.id === salvo)) {
      setUsuarioId(salvo)
    } else if (membros.length > 0) {
      setUsuarioId(membros[0].id)
    }
  }, [membros])

  useEffect(() => {
    function fechar(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAberto(false)
      }
    }
    document.addEventListener('mousedown', fechar)
    return () => document.removeEventListener('mousedown', fechar)
  }, [])

  function selecionarUsuario(id: string) {
    setUsuarioId(id)
    localStorage.setItem(STORAGE_KEY, id)
    setAberto(false)
  }

  const usuarioAtivo = membros.find(u => u.id === usuarioId) ?? membros[0]

  return (
    <aside className="w-56 bg-slate-900 flex flex-col h-screen flex-none">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">MídiaFlux</p>
            <p className="text-slate-500 text-xs">Agência</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-slate-800">
        <Link
          href="/configuracoes"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <Settings size={16} />
          Configurações
        </Link>

        {/* Seletor de usuário */}
        {usuarioAtivo && (
        <div className="mt-3 relative" ref={ref}>
          <button
            onClick={() => setAberto(!aberto)}
            className="w-full flex items-center gap-2.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors group"
          >
            <div className={`w-7 h-7 rounded-full ${usuarioAtivo.cor} flex items-center justify-center text-white text-xs font-bold flex-none`}>
              {usuarioAtivo.iniciais}
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-xs text-slate-400 leading-none mb-0.5">Logado como</p>
              <p className="text-xs font-semibold text-slate-200 truncate">{usuarioAtivo.nome}</p>
            </div>
            <ChevronUp
              size={13}
              className={`text-slate-500 flex-none transition-transform ${aberto ? 'rotate-0' : 'rotate-180'}`}
            />
          </button>

          {/* Dropdown */}
          {aberto && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-slate-800 border border-slate-700 rounded-lg overflow-hidden shadow-xl">
              {membros.map(u => (
                <button
                  key={u.id}
                  onClick={() => selecionarUsuario(u.id)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-slate-700 transition-colors"
                >
                  <div className={`w-7 h-7 rounded-full ${u.cor} flex items-center justify-center text-white text-xs font-bold flex-none`}>
                    {u.iniciais}
                  </div>
                  <span className="flex-1 text-left text-sm text-slate-200">{u.nome}</span>
                  {u.id === usuarioId && (
                    <Check size={14} className="text-blue-400 flex-none" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        )}
      </div>
    </aside>
  )
}
