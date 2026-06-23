import { useState, useEffect, useMemo } from 'react'
import api from '../api'
import ReactMarkdown from 'react-markdown'
import {
  Search, Sparkles, X, BookOpen,
  Clock, MapPin, ChevronRight, Star,
} from 'lucide-react'
import { marked } from 'marked'

const FILTROS = [
  { key: 'todos',         label: 'Todos'        },
  { key: 'atencion',      label: 'Atención'     },
  { key: 'impulsividad',  label: 'Impulsividad' },
  { key: 'organizacion',  label: 'Organización' },
  { key: 'evaluacion',    label: 'Evaluación'   },
  { key: 'transiciones',  label: 'Transiciones' },
]

const CATEGORIA_COLORS = {
  atencion:     'bg-red-50 text-red-500',
  impulsividad: 'bg-orange-50 text-orange-500',
  organizacion: 'bg-blue-50 text-blue-600',
  evaluacion:   'bg-purple-50 text-purple-600',
  transiciones: 'bg-teal-50 text-teal-600',
  motivacion:   'bg-yellow-50 text-yellow-600',
  visual:       'bg-sky-50 text-sky-600',
  energia:      'bg-lime-50 text-lime-600',
  inclusion:    'bg-pink-50 text-pink-600',
  rutinas:      'bg-indigo-50 text-indigo-600',
  tiempo:       'bg-violet-50 text-violet-600',
}
const FALLBACK_COLOR = 'bg-slate-100 text-slate-500'

function CategoriaTag({ cat }) {
  const color = CATEGORIA_COLORS[cat] || FALLBACK_COLOR
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${color}`}>
      {cat}
    </span>
  )
}

function EficaciaBar({ value, label }) {
  const color = value >= 90 ? 'bg-red-400'
              : value >= 80 ? 'bg-amber-400'
              : 'bg-blue-400'
  return (
    <div>
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${value}%` }} />
      </div>
      {label && <p className={`text-[11px] font-semibold mt-1 ${value >= 90 ? 'text-red-500' : value >= 80 ? 'text-amber-500' : 'text-blue-500'}`}>{label}</p>}
    </div>
  )
}

// Modal "Ver paso a paso" con Markdown renderizado
function PasosModal({ estrategia, onClose }) {
  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── HEADER con gradiente ── */}
        <div
          className="relative p-6 pb-5 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)' }}
        >
          {/* Botón cerrar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-white/70 transition-all"
          >
            <X size={16} strokeWidth={2} />
          </button>

          {/* Emoji grande + título */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-md flex items-center justify-center text-4xl flex-shrink-0">
              {estrategia.emoji}
            </div>
            <div className="flex-1 min-w-0 pr-8">
              <h2
                className="font-bold text-slate-800 text-xl leading-tight"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                {estrategia.titulo}
              </h2>
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {(estrategia.categorias || []).map(c => <CategoriaTag key={c} cat={c} />)}
              </div>
            </div>
          </div>

          {/* Descripción breve */}
          <p className="mt-4 text-sm text-slate-600 leading-relaxed bg-white/60 rounded-2xl px-4 py-3">
            {estrategia.descripcion}
          </p>

          {/* Stats rápidos */}
          <div className="flex items-center gap-4 mt-4">
            {estrategia.tasa_eficacia > 0 && (
              <div className="flex items-center gap-2 bg-white/70 rounded-xl px-3 py-1.5">
                <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${estrategia.tasa_eficacia >= 90 ? 'bg-red-400' : estrategia.tasa_eficacia >= 80 ? 'bg-amber-400' : 'bg-blue-400'}`}
                    style={{ width: `${estrategia.tasa_eficacia}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-600">{estrategia.tasa_eficacia}% efectividad</span>
              </div>
            )}
            {estrategia.tiempo_setup && (
              <div className="flex items-center gap-1.5 bg-white/70 rounded-xl px-3 py-1.5">
                <Clock size={12} className="text-slate-400" />
                <span className="text-xs font-semibold text-slate-600">{estrategia.tiempo_setup}</span>
              </div>
            )}
            {estrategia.contexto && (
              <div className="flex items-center gap-1.5 bg-white/70 rounded-xl px-3 py-1.5">
                <MapPin size={12} className="text-slate-400" />
                <span className="text-xs font-semibold text-slate-600">{estrategia.contexto}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── DIVISOR ── */}
        <div className="flex items-center gap-3 px-6 py-3 bg-slate-50 border-y border-slate-100 flex-shrink-0">
          <BookOpen size={13} strokeWidth={2} className="text-indigo-500" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Guía paso a paso
          </span>
        </div>

{/* ── CONTENIDO MARKDOWN ── */}
<div className="overflow-y-auto flex-1 p-6">
  {estrategia.pasos_markdown ? (
    <div className="space-y-2">
      {estrategia.pasos_markdown
        .split('\n')
        .filter(line => line.trim() !== '' && !line.startsWith('##'))
        .map((line, i) => {
          // Bloque tip/blockquote (líneas que empiezan con >)
          if (line.startsWith('>')) {
            const text = line.replace(/^>\s*/, '').replace(/\*\*(.*?)\*\*/g, '$1')
            return (
              <div key={i} className="flex gap-3 bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-3 mt-4">
                <span className="text-base flex-shrink-0"></span>
                <p className="text-sm text-indigo-700 leading-relaxed">{text}</p>
              </div>
            )
          }

          // Pasos numerados (líneas que empiezan con número)
          const stepMatch = line.match(/^(\d+)\.\s+\*\*(.*?)\*\*\s*[—–-]\s*(.*)/)
          if (stepMatch) {
            const [, num, title, desc] = stepMatch
            // Limpiar cursiva del desc
            const cleanDesc = desc.replace(/\*(.*?)\*/g, '$1')
            return (
              <div key={i} className="flex gap-3 items-start bg-white border border-slate-100 rounded-2xl p-4 hover:border-indigo-100 hover:bg-slate-50 transition-all">
                <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {num}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-700 leading-tight">{title}</p>
                  <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">{cleanDesc}</p>
                </div>
              </div>
            )
          }

          // Pasos numerados sin negrita (líneas que empiezan con número simple)
          const simpleStep = line.match(/^(\d+)\.\s+(.+)/)
          if (simpleStep) {
            const [, num, text] = simpleStep
            const cleanText = text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1')
            return (
              <div key={i} className="flex gap-3 items-start bg-white border border-slate-100 rounded-2xl p-4 hover:border-indigo-100 hover:bg-slate-50 transition-all">
                <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {num}
                </span>
                <p className="text-sm text-slate-600 leading-relaxed flex-1">{cleanText}</p>
              </div>
            )
          }

          // Sub-items con guion (  - texto)
          const subItem = line.match(/^\s+[-*]\s+(.+)/)
          if (subItem) {
            const cleanText = subItem[1].replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1')
            return (
              <div key={i} className="flex gap-2 items-start pl-10">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-300 flex-shrink-0 mt-2" />
                <p className="text-sm text-slate-500 leading-relaxed">{cleanText}</p>
              </div>
            )
          }

          // Texto plano restante
          const cleanLine = line.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').trim()
          if (!cleanLine) return null
          return (
            <p key={i} className="text-sm text-slate-500 leading-relaxed px-1">{cleanLine}</p>
          )
        })}
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center h-32 text-slate-400 gap-2">
      <BookOpen size={24} strokeWidth={1.2} />
      <p className="text-sm">Sin pasos detallados aún.</p>
    </div>
  )}
     </div> 
    </div>   	
  </div> 
)
}

// Tarjeta de estrategia
function EstrategiaCard({ estrategia, onVerPasos, destacada }) {
  return (
    <div className={`bg-white rounded-2xl border flex flex-col transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 relative overflow-hidden
      ${destacada ? 'border-indigo-200 shadow-[0_0_0_2px_rgba(99,102,241,0.12)]' : 'border-slate-100 shadow-[0_2px_16px_rgba(15,23,42,0.06)]'}`}
    >

      {/* Bookmark */}
      <button className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center text-slate-300 hover:text-indigo-500 transition-colors">
        <Star size={14} strokeWidth={1.8} />
      </button>

      <div className="p-5 flex flex-col flex-1 gap-3">
        {/* Tags categoría */}
        <div className="flex gap-1.5 flex-wrap">
	  {(estrategia.categorias || []).map(c => <CategoriaTag key={c} cat={c} />)}
        </div>

        {/* Emoji + título */}
        <div className="flex items-start gap-3">
          <span className="text-3xl flex-shrink-0 mt-0.5">{estrategia.emoji}</span>
          <h3 className="font-bold text-slate-800 text-base leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
            {estrategia.titulo}
          </h3>
        </div>

        {/* Descripción */}
        <p className="text-sm text-slate-500 leading-relaxed flex-1">
          {estrategia.descripcion}
        </p>

        {/* Eficacia */}
        {estrategia.tasa_eficacia > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
              Efectividad reportada
            </p>
            <EficaciaBar value={estrategia.tasa_eficacia} label={estrategia.etiqueta_eficacia} />
          </div>
        )}

        {/* Meta info */}
        {(estrategia.tiempo_setup || estrategia.contexto) && (
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            {estrategia.tiempo_setup && (
              <span className="flex items-center gap-1"><Clock size={11} />{estrategia.tiempo_setup}</span>
            )}
            {estrategia.contexto && (
              <span className="flex items-center gap-1"><MapPin size={11} />{estrategia.contexto}</span>
            )}
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="px-5 pb-5">
        <button
          onClick={() => onVerPasos(estrategia)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-all"
        >
          <BookOpen size={13} strokeWidth={1.8} />
          Ver paso a paso
          <ChevronRight size={12} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}

// ── Vista principal ──────────────────────────────────────────────────────────
export default function BankView() {
  const [estrategias, setEstrategias] = useState([])
  const [loading, setLoading]         = useState(true)
  const [filtro, setFiltro]           = useState('todos')
  const [query, setQuery]             = useState('')
  const [modal, setModal]             = useState(null)

  useEffect(() => {
    api.get('bank/')
      .then(({ data }) => setEstrategias(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const visibles = useMemo(() => {
    return estrategias.filter(e => {
      const matchFiltro = filtro === 'todos' || (e.categorias || []).includes(filtro)
      const matchQuery  = !query
        || e.titulo.toLowerCase().includes(query.toLowerCase())
        || e.descripcion.toLowerCase().includes(query.toLowerCase())
      return matchFiltro && matchQuery
    })
  }, [estrategias, filtro, query])

  return (
    <>
      {modal && <PasosModal estrategia={modal} onClose={() => setModal(null)} />}

      <div className="space-y-6">

        {/* HEADER */}
        <header>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Banco Dinámico de Estrategias
              </h1>
              <p className="text-slate-500 mt-1 text-sm">
                Estrategias pedagógicas basadas en evidencia para estudiantes con TDAH
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs flex-shrink-0">
              <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1.5 rounded-full font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                IA activa
              </span>
              <span className="text-slate-400 font-medium">
                {loading ? '...' : `${visibles.length} estrategias disponibles`}
              </span>
            </div>
          </div>
        </header>

        {/* BUSCADOR */}
        <div className="relative">
          <Search size={15} strokeWidth={1.8} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar estrategia por nombre, categoría o descripción..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-3 rounded-2xl border-2 border-slate-200 bg-white text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-400 transition-colors shadow-sm"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={14} strokeWidth={2} />
            </button>
          )}
        </div>

        {/* FILTROS */}
        <div className="flex gap-2 flex-wrap">
          {FILTROS.map(f => (
            <button
              key={f.key}
              onClick={() => setFiltro(f.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all border ${
                filtro === f.key
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-200 hover:text-indigo-500'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* GRID */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-72 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : visibles.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
            <p className="text-slate-400 text-sm">No se encontraron estrategias · Prueba otro filtro</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {visibles.map((e, i) => (
              <EstrategiaCard
                key={e.id}
                estrategia={e}
                destacada={e.sugerida_por_ia}
                onVerPasos={setModal}
              />
            ))}
          </div>
        )}

      </div>
    </>
  )
}
