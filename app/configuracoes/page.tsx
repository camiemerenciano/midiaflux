'use client'

import { useState, useRef } from 'react'
import { useAgenciaStore, Membro } from '@/lib/agencia/store'
import { Building2, Users2, Camera, Plus, Pencil, Trash2, Check, X, Save } from 'lucide-react'

type Tab = 'agencia' | 'equipe'

const CORES = [
  'bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-rose-500',
  'bg-amber-500', 'bg-cyan-500', 'bg-pink-500', 'bg-indigo-500',
  'bg-orange-500', 'bg-teal-500',
]

export default function ConfiguracoesPage() {
  const [tab, setTab] = useState<Tab>('agencia')

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <h1 className="text-xl font-bold text-slate-800">Configurações</h1>
        <p className="text-sm text-slate-500">Perfil da agência e gestão da equipe</p>

        <div className="flex border-b border-slate-200 -mb-4 -mx-6 px-6 mt-4">
          {([
            ['agencia', Building2, 'Agência'],
            ['equipe',  Users2,   'Equipe'],
          ] as [Tab, React.ElementType, string][]).map(([t, Icon, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}>
              <Icon size={15} />{label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {tab === 'agencia' && <TabAgencia />}
        {tab === 'equipe'  && <TabEquipe />}
      </div>
    </div>
  )
}

// ─── Tab Agência ──────────────────────────────────────────────────────────────

function TabAgencia() {
  const { perfil, updatePerfil } = useAgenciaStore()
  const [form, setForm] = useState({ ...perfil })
  const [salvo, setSalvo] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function setField(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setField('logo', ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function handleSave() {
    updatePerfil(form)
    setSalvo(true)
    setTimeout(() => setSalvo(false), 2000)
  }

  return (
    <div className="max-w-xl space-y-6">

      {/* Logo */}
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Logo</p>
        <div className="flex items-center gap-4">
          <div
            className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50 cursor-pointer hover:border-blue-400 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            {form.logo
              ? <img src={form.logo} alt="Logo" className="w-full h-full object-contain" />
              : <Camera size={24} className="text-slate-300" />
            }
          </div>
          <div>
            <button
              onClick={() => fileRef.current?.click()}
              className="text-sm text-blue-600 font-medium hover:underline block"
            >
              {form.logo ? 'Trocar imagem' : 'Carregar logo'}
            </button>
            {form.logo && (
              <button
                onClick={() => setField('logo', '')}
                className="text-xs text-slate-400 hover:text-red-500 mt-1 block"
              >
                Remover
              </button>
            )}
            <p className="text-xs text-slate-400 mt-1">PNG, JPG ou SVG · máx. 2 MB</p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
        </div>
      </div>

      {/* Dados da agência */}
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Dados da agência</p>
        <div className="space-y-3">
          <Field label="Nome da agência">
            <input value={form.nome} onChange={(e) => setField('nome', e.target.value)}
              placeholder="MídiaFlux" className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cidade">
              <input value={form.cidade} onChange={(e) => setField('cidade', e.target.value)}
                placeholder="São Paulo" className={inputCls} />
            </Field>
            <Field label="Telefone / WhatsApp">
              <input value={form.telefone} onChange={(e) => setField('telefone', e.target.value)}
                placeholder="(11) 99999-9999" className={inputCls} />
            </Field>
          </div>
          <Field label="E-mail">
            <input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)}
              placeholder="contato@midiaflux.com.br" className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Site">
              <input value={form.site} onChange={(e) => setField('site', e.target.value)}
                placeholder="midiaflux.com.br" className={inputCls} />
            </Field>
            <Field label="Instagram">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">@</span>
                <input value={form.instagram} onChange={(e) => setField('instagram', e.target.value.replace('@', ''))}
                  placeholder="midiaflux" className={`${inputCls} pl-7`} />
              </div>
            </Field>
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors ${
          salvo ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {salvo ? <><Check size={15} /> Salvo!</> : <><Save size={15} /> Salvar alterações</>}
      </button>
    </div>
  )
}

// ─── Tab Equipe ───────────────────────────────────────────────────────────────

function TabEquipe() {
  const { membros, addMembro, updateMembro, removeMembro } = useAgenciaStore()
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [adicionando, setAdicionando] = useState(false)
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null)

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          {membros.length} membro{membros.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={() => { setAdicionando(true); setEditandoId(null) }}
          className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={14} /> Adicionar membro
        </button>
      </div>

      {adicionando && (
        <MembroForm
          onSave={(data) => { addMembro(data); setAdicionando(false) }}
          onCancel={() => setAdicionando(false)}
        />
      )}

      <div className="space-y-2">
        {membros.map((m) => (
          <div key={m.id}>
            {editandoId === m.id ? (
              <MembroForm
                inicial={m}
                onSave={(data) => { updateMembro(m.id, data); setEditandoId(null) }}
                onCancel={() => setEditandoId(null)}
              />
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full ${m.cor} flex items-center justify-center text-white text-sm font-bold flex-none`}>
                  {m.iniciais}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{m.nome}</p>
                  <p className="text-xs text-slate-400">{m.cargo}{m.email ? ` · ${m.email}` : ''}</p>
                </div>
                {m.whatsapp && (
                  <span className="text-xs text-slate-400 hidden sm:block">{m.whatsapp}</span>
                )}
                {confirmandoId === m.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-600 font-medium">Remover?</span>
                    <button onClick={() => { removeMembro(m.id); setConfirmandoId(null) }}
                      className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 font-medium">
                      Sim
                    </button>
                    <button onClick={() => setConfirmandoId(null)}
                      className="text-xs border border-slate-200 text-slate-500 px-2 py-1 rounded hover:bg-slate-50">
                      Não
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditandoId(m.id); setAdicionando(false) }}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => setConfirmandoId(m.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Formulário de membro ─────────────────────────────────────────────────────

function MembroForm({
  inicial,
  onSave,
  onCancel,
}: {
  inicial?: Membro
  onSave: (data: Omit<Membro, 'id'>) => void
  onCancel: () => void
}) {
  const [nome, setNome] = useState(inicial?.nome ?? '')
  const [cargo, setCargo] = useState(inicial?.cargo ?? '')
  const [email, setEmail] = useState(inicial?.email ?? '')
  const [whatsapp, setWhatsapp] = useState(inicial?.whatsapp ?? '')
  const [cor, setCor] = useState(inicial?.cor ?? CORES[0])

  function gerarIniciais(n: string) {
    const partes = n.trim().split(' ').filter(Boolean)
    if (partes.length === 0) return ''
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
  }

  function handleSave() {
    if (!nome.trim()) return
    onSave({ nome: nome.trim(), iniciais: gerarIniciais(nome), cargo, email, whatsapp, cor })
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
      <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">
        {inicial ? 'Editar membro' : 'Novo membro'}
      </p>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Nome *">
          <input value={nome} onChange={(e) => setNome(e.target.value)}
            placeholder="Ana Silva" className={inputCls} />
        </Field>
        <Field label="Cargo">
          <input value={cargo} onChange={(e) => setCargo(e.target.value)}
            placeholder="Designer, Gestor..." className={inputCls} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="E-mail">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="ana@agencia.com" className={inputCls} />
        </Field>
        <Field label="WhatsApp">
          <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="(11) 99999-9999" className={inputCls} />
        </Field>
      </div>

      <Field label="Cor do avatar">
        <div className="flex gap-2 flex-wrap">
          {CORES.map((c) => (
            <button
              key={c}
              onClick={() => setCor(c)}
              className={`w-7 h-7 rounded-full ${c} transition-transform ${cor === c ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'hover:scale-105'}`}
            />
          ))}
          {nome && (
            <div className={`w-7 h-7 rounded-full ${cor} flex items-center justify-center text-white text-xs font-bold ml-2`}>
              {gerarIniciais(nome) || '?'}
            </div>
          )}
        </div>
      </Field>

      <div className="flex gap-2 pt-1">
        <button onClick={handleSave} disabled={!nome.trim()}
          className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors">
          <Check size={14} /> {inicial ? 'Salvar' : 'Adicionar'}
        </button>
        <button onClick={onCancel}
          className="flex items-center gap-1.5 border border-slate-200 text-slate-600 text-sm px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors">
          <X size={14} /> Cancelar
        </button>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const inputCls = 'w-full text-sm text-slate-900 border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-slate-500 mb-1 block">{label}</label>
      {children}
    </div>
  )
}
